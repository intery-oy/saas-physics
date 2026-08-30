/*
 * SaaS Physics — LAYER B: KPI MEASUREMENT ENGINE
 *
 * This file contains no economics. It observes a simulation produced by the
 * economic engine (engine.js) and computes CFO-facing measurements using explicit,
 * canonical definitions.
 *
 * GOVERNING PRINCIPLE
 *   The business exists first. KPIs are measurements taken from it.
 *   A KPI definition must never become an economic law.
 *
 * Consequently the transition coefficients that drive the world (persistenceAnnual,
 * expansionCoefficientAnnual) are NOT the KPIs of similar name, and this file is
 * where the difference is made computable rather than assumed away.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsKPI = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var WINDOW = 12;

  /* Row lookup: the base cohort's rows start at t=1; an acquisition cohort's rows
     start at t = its acquisition month. */
  function rowAt(c, t) {
    var idx = c.acquisitionMonth === 0 ? t - 1 : t - c.acquisitionMonth;
    return (idx >= 0 && idx < c.rows.length) ? c.rows[idx] : null;
  }

  /* ------------------------------------------------------------------ *
   * CANONICAL R12M MEASUREMENT
   *
   * 1. Identify the ARR existing exactly 12 months before the measurement date.
   * 2. Freeze that eligible cohort.
   * 3. Follow only that cohort through the 12-month window.
   * 4. Exclude every euro of New ARR created after the opening date.
   * 5. Track surviving opening ARR, leakage (churn + contraction), and the
   *    expansion attributable to the frozen cohort, separately.
   *
   * Definitions (all denominators are the FROZEN opening ARR):
   *   R12M GRR       = (Opening − Churn − Contraction) / Opening
   *                  = (Opening − Leakage) / Opening        [v0.2.1: leakage is combined]
   *   R12M Expansion = Expansion / Opening
   *   R12M NRR       = (Opening + Expansion − Leakage) / Opening
   *                  = Closing ARR of the eligible cohort / Opening
   *
   * Expansion cannot improve GRR: it does not appear in the GRR numerator.
   * New ARR cannot enter any of the three: it is not in the eligible cohort.
   * ------------------------------------------------------------------ */
  function measureR12M(res, T) {
    if (T < WINDOW) return null;
    var start = T - WINDOW + 1;             // first month inside the window
    var asOf  = T - WINDOW;                 // the "12 months earlier" boundary
    var eligible = res.cohorts.filter(function (c) { return c.acquisitionMonth <= asOf; });

    var opening = 0, leakage = 0, expansion = 0, closing = 0, contributions = [];
    eligible.forEach(function (c) {
      var first = rowAt(c, start);
      if (!first) return;
      var o = first.openingARR, lk = 0, ex = 0, last = null;
      for (var t = start; t <= T; t++) {
        var r = rowAt(c, t);
        if (!r) break;
        lk += r.leakage; ex += r.expansion; last = r;
      }
      opening += o; leakage += lk; expansion += ex; closing += last ? last.closingARR : 0;
      contributions.push({
        id: c.id, acquisitionMonth: c.acquisitionMonth, ageAtOpening: start - 1 - c.acquisitionMonth,
        openingARR: o, leakage: lk, expansion: ex, closingARR: last ? last.closingARR : 0,
        grr: o > 0 ? (o - lk) / o : 1, nrr: o > 0 ? (last ? last.closingARR : 0) / o : 1
      });
    });

    /* New ARR created inside the window — reported, but excluded from the cohort */
    var newARRExcluded = 0;
    for (var t2 = start; t2 <= T; t2++) newARRExcluded += res.months[t2 - 1].newARR;

    var grr = opening > 0 ? (opening - leakage) / opening : 1;
    var exr = opening > 0 ? expansion / opening : 0;
    var nrr = opening > 0 ? closing / opening : 1;

    return {
      T: T, windowStart: start, asOf: asOf,
      eligibleCohortCount: eligible.length,
      openingARR: opening,
      expansion: expansion,
      leakage: leakage,
      closingEligibleARR: closing,
      bridgeResidual: opening + expansion - leakage - closing,
      grr: grr,
      expansionRate: exr,
      nrr: nrr,
      nrrFromBridge: opening > 0 ? (opening + expansion - leakage) / opening : 1,
      identityResidual: (grr + exr) - nrr,
      newARRExcluded: newARRExcluded,
      companyOpeningARR: res.months[start - 1].openingARR,
      companyClosingARR: res.months[T - 1].closingARR,
      arrGrowth: res.months[start - 1].openingARR > 0
        ? res.months[T - 1].closingARR / res.months[start - 1].openingARR - 1 : 0,
      contributions: contributions
    };
  }

  function measureSeries(res) {
    var out = [];
    for (var T = WINDOW; T <= res.horizon; T++) out.push(measureR12M(res, T));
    return out;
  }

  /* Company-level KPIs over the same trailing-12 window. These are P&L and cash
     measurements; they need no cohort freezing. */
  function companyKPIs(res, T) {
    var start = Math.max(1, T - WINDOW + 1), ms = res.months.slice(start - 1, T);
    var sum = function (k) { return ms.reduce(function (s, m) { return s + m[k]; }, 0); };
    var revenue = sum('revenue');
    return {
      T: T,
      newARR: sum('newARR'),
      revenue: revenue,
      grossProfit: sum('grossProfit'),
      grossMargin: revenue > 0 ? sum('grossProfit') / revenue : 0,
      ebita: sum('ebita'),
      ebitaMargin: revenue > 0 ? sum('ebita') / revenue : 0,
      fcf: sum('fcf'),
      cash: res.months[T - 1].cashClosing,
      cacPerARR: res.assumptions.cacPerARR,
      cacPaybackMonths: res.derived.cacPaybackMonths,
      closingARR: res.months[T - 1].closingARR
    };
  }

  /* ------------------------------------------------------------------ *
   * WHY MEASURED KPIs ≠ TRANSITION COEFFICIENTS
   *
   * With monthly persistence g and monthly expansion e, a cohort's balance follows
   * A_t = A_0 · m^t where m = g(1+e). Over a 12-month window:
   *
   *   Σ leakage   = A_0 (1−g) · S        Σ expansion = A_0 · g·e · S
   *   S = Σ_{t=0..11} m^t                (= 12 exactly when m = 1)
   *
   * so measured GRR = 1 − (1−g)S(m) and measured expansion = g·e·S(m), while
   * measured NRR = m^12 = P(1+X) — EXACT, because NRR is a ratio of two STOCKS while
   * GRR and expansion are ratios of FLOWS to a stock.
   *
   * THE CAUSE IS A SINGLE EFFECT, NOT SEVERAL. Switch one process off and the other
   * measures its own coefficient exactly:
   *
   *   X = 0  ⇒  (1−g)·S(g)   = 1 − g^12 = 1 − P   ⇒  measured GRR = P       EXACTLY
   *   P = 1  ⇒  e·S(1+e)     = (1+e)^12 − 1 = X   ⇒  measured expansion = X EXACTLY
   *
   * It is tempting to attribute the gap to the compounding convention (Σ of a monthly
   * hazard ≠ the compounded annual total) plus a moving-base effect. Those two terms
   * are real but they CANCEL EXACTLY — which is why each isolated case above is exact.
   * The entire residual is the WITHIN-PERIOD INTERACTION of the two processes:
   *
   *   expansion enlarges the balance that is subsequently exposed to decay
   *       → measured churn > 1 − P, so measured GRR < P
   *   decay shrinks the balance that expansion subsequently accrues on
   *       → measured expansion < X
   *
   * So the answer to "is it definition, timing, compounding, or flow attribution?" is:
   * flow attribution under interaction. Neither flow ratio is a property of its own
   * coefficient alone; each depends on the other process too.
   * ------------------------------------------------------------------ */
  function seriesSum(x) { return Math.abs(x - 1) < 1e-14 ? 12 : (Math.pow(x, 12) - 1) / (x - 1); }

  function decompose(P, X) {
    var g = Math.pow(P, 1 / 12), e = Math.pow(1 + X, 1 / 12) - 1, m = g * (1 + e);
    var Sm = seriesSum(m), Sg = seriesSum(g), Se = seriesSum(1 + e);
    var churnIsolated = (1 - g) * Sg;      // ≡ 1 − P
    var churnMeasured = (1 - g) * Sm;
    var expIsolated   = e * Se;            // ≡ X
    var expMeasured   = g * e * Sm;
    return {
      P: P, X: X, g: g, e: e, m: m, S: Sm,
      churn: {
        isolated: churnIsolated,                          // what it measures with expansion off
        expansionExposure: churnMeasured - churnIsolated, // the whole gap
        measured: churnMeasured
      },
      expansion: {
        isolated: expIsolated,                            // what it measures with decay off
        retentionExposure: expMeasured - expIsolated,     // the whole gap
        measured: expMeasured
      },
      measuredGRR: 1 - churnMeasured,
      measuredExpansion: expMeasured,
      measuredNRR: Math.pow(m, 12)
    };
  }

  /* Month-by-month worked example on a stated opening balance (the €100 case). */
  function workedExample(P, X, opening, months) {
    var g = Math.pow(P, 1 / 12), e = Math.pow(1 + X, 1 / 12) - 1;
    var rows = [], bal = opening, cumL = 0, cumE = 0;
    for (var t = 1; t <= (months || 12); t++) {
      var retained = bal * g, leak = bal - retained, exp = retained * e, close = retained + exp;
      cumL += leak; cumE += exp;
      rows.push({ t: t, opening: bal, retained: retained, leakage: leak, expansion: exp,
                  closing: close, cumLeakage: cumL, cumExpansion: cumE });
      bal = close;
    }
    return {
      opening: opening, rows: rows,
      cumLeakage: cumL, cumExpansion: cumE, closing: bal,
      measuredGRR: (opening - cumL) / opening,
      measuredExpansion: cumE / opening,
      measuredNRR: bal / opening
    };
  }

  /* ------------------------------------------------------------------ *
   * INVERSE CALIBRATION — closed form.
   *
   * Given TARGET MEASURED KPIs, solve for the transition coefficients that make the
   * measurement engine report them.
   *
   *   NRR* = GRR* + Expansion*        (the KPI bridge, exactly)
   *   m    = NRR*^(1/12)              (NRR is a stock ratio, so m follows directly)
   *   S    = Σ m^t, t = 0..11
   *   g    = 1 − (1 − GRR*) / S       (invert measured churn)
   *   e    = m/g − 1
   *   P    = g^12                     X = (1+e)^12 − 1
   * ------------------------------------------------------------------ */
  function calibrate(targetGRR, targetExpansion) {
    var nrr = targetGRR + targetExpansion;
    var m = Math.pow(nrr, 1 / 12);
    var S = Math.abs(m - 1) < 1e-14 ? 12 : (Math.pow(m, 12) - 1) / (m - 1);
    var g = 1 - (1 - targetGRR) / S;
    if (!(g > 0 && g <= 1)) return null;
    var e = m / g - 1;
    return {
      targetGRR: targetGRR, targetExpansion: targetExpansion, targetNRR: nrr,
      monthlyPersistence: g, monthlyExpansion: e, monthlyMultiplier: m, S: S,
      persistenceAnnual: Math.pow(g, 12),
      expansionCoefficientAnnual: Math.pow(1 + e, 12) - 1
    };
  }

  return {
    WINDOW: WINDOW,
    rowAt: rowAt,
    measureR12M: measureR12M,
    measureSeries: measureSeries,
    companyKPIs: companyKPIs,
    seriesSum: seriesSum,
    decompose: decompose,
    workedExample: workedExample,
    calibrate: calibrate
  };
});
