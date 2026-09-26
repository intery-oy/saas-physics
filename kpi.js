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
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SaaSPhysicsKPI = factory(root.SaaSPhysics);
})(typeof self !== 'undefined' ? self : globalThis, function (E) {
  'use strict';

  var WINDOW = 12;

  /* The cohort row-indexing rule has one owner: engine.rowAt. */
  var rowAt = E.rowAt;

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
      expansionCost: sum('expansionCost'),
      closingARR: res.months[T - 1].closingARR
    };
  }

  /* ------------------------------------------------------------------ *
   * FORWARD ECONOMIC CONTENT (v0.3)
   *
   * Not valuation. No discounting, no multiple, no score. Simply: how much gross
   * profit does the ARR that exists at T0 go on to produce over the next N months?
   *
   * `gpDensity` is that quantity per euro of current ARR — an EXPERIMENTAL
   * 60-month forward economic measure, deliberately not a canonical SaaS KPI and
   * deliberately not enterprise value.
   * ------------------------------------------------------------------ */
  function forwardEconomics(res, T0, horizon) {
    var end = Math.min(res.horizon, T0 + horizon);
    var win = res.months.slice(T0, end);
    var sum = function (k) { return win.reduce(function (s, m) { return s + m[k]; }, 0); };
    var arrT0 = res.months[T0 - 1].closingARR;

    /* flows attributable to the cohorts that already existed at T0 */
    var existing = res.cohorts.filter(function (c) { return c.acquisitionMonth <= T0; });
    var exLeak = 0, exExp = 0, exGP = 0, exARREnd = 0;
    existing.forEach(function (c) {
      var last = null;
      for (var t = T0 + 1; t <= end; t++) {
        var r = rowAt(c, t);
        if (!r) continue;
        exLeak += r.leakage; exExp += r.expansion; exGP += r.grossProfit; last = r;
      }
      if (last) exARREnd += last.closingARR;
    });

    return {
      T0: T0, months: end - T0,
      arrAtT0: arrT0,
      arrAtEnd: res.months[end - 1].closingARR,
      remainingRevenue: sum('revenue'),
      remainingGP: sum('grossProfit'),
      remainingEbita: sum('ebita'),
      remainingFCF: sum('fcf'),
      cashAtEnd: res.months[end - 1].cashClosing,
      existingBaseARREnd: exARREnd,
      existingBaseGP: exGP,
      existingBaseExpansion: exExp,
      existingBaseLeakage: exLeak,
      /* EXPERIMENTAL forward economic measure — not a KPI, not a valuation */
      gpDensity: arrT0 > 0 ? sum('grossProfit') / arrT0 : 0,
      existingBaseGPDensity: arrT0 > 0 ? exGP / arrT0 : 0
    };
  }

  /* ARR split by age band at month t — the state the KPIs cannot see. */
  function ageComposition(res, t) {
    var bands = res.bands, out = bands.map(function (b) { return { name: b.name, arr: 0 }; }), total = 0;
    res.cohorts.forEach(function (c) {
      var r = rowAt(c, t);
      if (!r) return;
      var age = r.age, bi = 0;
      for (var i = 0; i < bands.length; i++) { if (age < bands[i].maxAgeExclusive) { bi = i; break; } bi = bands.length - 1; }
      out[bi].arr += r.closingARR; total += r.closingARR;
    });
    out.forEach(function (o) { o.share = total > 0 ? o.arr / total : 0; });
    return { total: total, bands: out };
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

  /* ------------------------------------------------------------------ *
   * v1.1–v1.3 MEASUREMENTS. Layer B, so: nothing here creates economics. Each
   * function reads engine state (month records, the acquisition ledger, the
   * response the engine derived from its own law) and reports it. The
   * analytical marginal CAC is NOT recomputed here — it is a property of the
   * acquisition law and lives in engine.js (acquisitionResponse); this layer
   * only reads it and MEASURES the realised counterpart from flows.
   * ------------------------------------------------------------------ */

  /* Acquisition, measured over the trailing window and cumulatively:
     what was actually spent against what actually entered the stock. Under a
     lag the two are out of phase — the measured figure carries that, which is
     the point of measuring rather than quoting the law. */
  function acquisitionMeasures(res, T) {
    var start = Math.max(1, T - WINDOW + 1), ms = res.months.slice(start - 1, T);
    var sum = function (k) { return ms.reduce(function (s, m) { return s + m[k]; }, 0); };
    var spendR12 = sum('sm'), realisedR12 = sum('newARR');
    var m = res.months[T - 1], cum = m.cumulative, acq = res.derived.acquisition;
    return {
      T: T, windowStart: start,
      spendR12M: spendR12,
      realisedNewARRR12M: realisedR12,
      measuredCACR12M: realisedR12 > 0 ? spendR12 / realisedR12 : null,   // spend ÷ ARR that actually arrived
      cumulativeSpend: cum.sm,
      cumulativeRealisedNewARR: cum.newARR,
      measuredCACCumulative: cum.newARR > 0 ? cum.sm / cum.newARR : null,
      /* read from the engine's own law — not measured, quoted */
      lawNewARRPerMonth: res.derived.newARRPerMonth,
      capacity: acq.capacity,
      utilisation: acq.utilisation,
      averageCAC: acq.averageCAC,
      marginalCAC: acq.marginalCAC,
      averagePaybackMonths: acq.averagePaybackMonths,
      marginalPaybackMonths: acq.marginalPaybackMonths,
      /* the pending stock at T */
      pendingNewARR: m.pendingNewARR,
      pendingSpend: m.pendingSpend,
      pendingCount: m.pendingCount,
      lagMonths: res.derived.acquisitionLagMonths
    };
  }

  /* Expansion realisation cost, measured: the coefficient read back from
     flows over the window (Σ cost ÷ Σ expansion ARR), and its weight against
     the gross profit the same window produced. */
  function expansionCostMeasures(res, T) {
    var start = Math.max(1, T - WINDOW + 1), ms = res.months.slice(start - 1, T);
    var sum = function (k) { return ms.reduce(function (s, m) { return s + m[k]; }, 0); };
    var cost = sum('expansionCost'), exp = sum('expansion'), gp = sum('grossProfit');
    var m = res.months[T - 1];
    return {
      T: T, windowStart: start,
      costThisMonth: m.expansionCost,
      costR12M: cost,
      expansionR12M: exp,
      measuredCostPerARR: exp > 0 ? cost / exp : null,     // reads back expansionCostPerARR
      shareOfGrossProfitR12M: gp > 0 ? cost / gp : null,
      cumulativeCost: m.cumulative.expansionCost,
      cumulativeExpansion: m.cumulative.expansion
    };
  }

  /* ------------------------------------------------------------------ *
   * v2 Gate A — CUSTOMER MEASUREMENT over the same frozen R12M cohort.
   *
   * Same eligibility as measureR12M (cohorts acquired on or before T − 12),
   * same frozen opening. Adds what the ARR-only measurement cannot see:
   *   R12M logo retention = surviving eligible customers ÷ eligible opening customers
   *   GRR decomposition   = 1 − logo-churn ARR / opening − contraction ARR / opening
   *   ARPA                = ARR ÷ customers (company), at T − 12 and at T
   * Returns null when Customer Physics is off (nothing to measure) or T < 12.
   * ------------------------------------------------------------------ */
  function customerMeasures(res, T) {
    if (T < WINDOW || !res.mechanisms || !res.mechanisms.customerPhysics) return null;
    var start = T - WINDOW + 1, asOf = T - WINDOW;
    var eligible = res.cohorts.filter(function (c) { return c.acquisitionMonth <= asOf; });
    var nOpen = 0, nClose = 0, arrOpen = 0, logoARR = 0, contrARR = 0, expARR = 0, arrClose = 0;
    eligible.forEach(function (c) {
      var first = rowAt(c, start); if (!first || !first.customers) return;
      nOpen += first.customers.opening; arrOpen += first.openingARR;
      var last = null;
      for (var t = start; t <= T; t++) {
        var r = rowAt(c, t); if (!r) break;
        logoARR += r.customers.logoChurnARR; contrARR += r.customers.contractionARR; expARR += r.expansion; last = r;
      }
      if (last) { nClose += last.customers.closing; arrClose += last.closingARR; }
    });
    var mo = res.months[start - 1].customers, mc = res.months[T - 1].customers;
    var grr = arrOpen > 0 ? (arrOpen - logoARR - contrARR) / arrOpen : 1;
    return {
      T: T, windowStart: start, asOf: asOf,
      eligibleCustomersOpening: nOpen, eligibleCustomersClosing: nClose,
      logoRetentionR12M: nOpen > 0 ? nClose / nOpen : 1,
      logoChurnRateR12M: nOpen > 0 ? 1 - nClose / nOpen : 0,
      openingARR: arrOpen,
      logoChurnARR: logoARR, contractionARR: contrARR, expansionARR: expARR,
      dollarChurnFromLogosR12M: arrOpen > 0 ? logoARR / arrOpen : 0,
      dollarChurnFromContractionR12M: arrOpen > 0 ? contrARR / arrOpen : 0,
      grrR12M: grr,
      nrrR12M: arrOpen > 0 ? arrClose / arrOpen : 1,
      identityResidual: arrOpen + expARR - logoARR - contrARR - arrClose,
      /* company ARPA path (not frozen: it includes new logos, as ARPA does) */
      companyCustomersOpening: mo.opening, companyCustomersClosing: mc.closing,
      arpaOpening: mo.arpaOpening, arpaClosing: mc.arpaClosing,
      arpaChange: (mo.arpaOpening && mc.arpaClosing) ? mc.arpaClosing / mo.arpaOpening - 1 : null,
      newCustomersR12M: res.months.slice(start - 1, T).reduce(function (q, m) { return q + m.customers.newCustomers; }, 0),
      newLogoARPA: res.derived.customers.newLogoARPA
    };
  }

  /* ------------------------------------------------------------------ *
   * v2 Gate B — MONETIZATION MEASUREMENT over the same frozen R12M cohort.
   *
   * Same eligibility and frozen opening as measureR12M. Adds what neither the
   * ARR-only nor the customer measurement can see: WHERE survivor revenue
   * change came from — price, usage, adoption (the expansion side) and
   * contraction (the leakage side) — each ÷ the frozen opening ARR, so
   *   NRR = 1 − logo churn − contraction + price + usage + adoption
   * to the identity residual. Plus the revenue mix (fixed / variable share)
   * at T and the headroom the eligible cohorts have used. Null when
   * Monetization is off or T < 12.
   * ------------------------------------------------------------------ */
  function monetizationMeasures(res, T) {
    if (T < WINDOW || !res.mechanisms || !res.mechanisms.monetization) return null;
    var start = T - WINDOW + 1, asOf = T - WINDOW;
    var eligible = res.cohorts.filter(function (c) { return c.acquisitionMonth <= asOf; });
    var arrOpen = 0, arrClose = 0, logoARR = 0, contrARR = 0, priceARR = 0, usageARR = 0, adoptARR = 0, fixedClose = 0, varClose = 0;
    eligible.forEach(function (c) {
      var first = rowAt(c, start); if (!first || !first.monetization) return;
      arrOpen += first.openingARR;
      var last = null;
      for (var t = start; t <= T; t++) {
        var r = rowAt(c, t); if (!r) break;
        logoARR += r.customers.logoChurnARR; contrARR += r.monetization.contractionARR;
        priceARR += r.monetization.priceARR; usageARR += r.monetization.usageARR; adoptARR += r.monetization.adoptionARR; last = r;
      }
      if (last) { arrClose += last.closingARR; fixedClose += last.monetization.fixedARR; varClose += last.monetization.variableARR; }
    });
    var m = res.months[T - 1].monetization;
    var base = res.cohorts[0], baseRow = rowAt(base, T);
    var f = function (v) { return arrOpen > 0 ? v / arrOpen : 0; };
    return {
      T: T, windowStart: start, asOf: asOf,
      openingARR: arrOpen, closingEligibleARR: arrClose,
      logoChurnR12M: f(logoARR), contractionR12M: f(contrARR),
      priceEffectR12M: f(priceARR), usageEffectR12M: f(usageARR), adoptionEffectR12M: f(adoptARR),
      expansionR12M: f(priceARR + usageARR + adoptARR),
      grrR12M: 1 - f(logoARR) - f(contrARR),
      nrrR12M: arrOpen > 0 ? arrClose / arrOpen : 1,
      identityResidual: arrOpen - logoARR - contrARR + priceARR + usageARR + adoptARR - arrClose,
      /* mix of the eligible cohorts' closing ARR, and of the company at T */
      eligibleVariableShare: (fixedClose + varClose) > 0 ? varClose / (fixedClose + varClose) : 0,
      companyVariableShare: m.variableShare, companyFixedARR: m.fixedARR, companyVariableARR: m.variableARR,
      /* headroom used by the opening base at T (per variable component) */
      baseHeadroom: baseRow && baseRow.monetization ? baseRow.monetization.headroom : null,
      basePerCustomerRevenue: baseRow && baseRow.monetization ? baseRow.monetization.perCustomerClosing : null
    };
  }

  /* ------------------------------------------------------------------ *
   * v2 Gate C — CASH MEASUREMENT over the trailing 12 months. P&L and cash
   * flows need no cohort freezing. Null when Cash Physics is off.
   * ------------------------------------------------------------------ */
  function cashMeasures(res, T) {
    if (!res.mechanisms || !res.mechanisms.cashPhysics) return null;
    var start = Math.max(1, T - WINDOW + 1), ms = res.months.slice(start - 1, T);
    var sum = function (f) { return ms.reduce(function (s, m) { return s + f(m); }, 0); };
    var m = res.months[T - 1], c = m.cash, c0 = res.months[start - 1].cash;
    var revenue = sum(function (x) { return x.revenue; }), billings = sum(function (x) { return x.cash.billings; }), collections = sum(function (x) { return x.cash.collections; });
    var ebita = sum(function (x) { return x.ebita; }), fcf = sum(function (x) { return x.fcf; });
    return {
      T: T, windowStart: start,
      revenueR12M: revenue, billingsR12M: billings, collectionsR12M: collections,
      ebitaR12M: ebita, cashFCFR12M: fcf, fcfMinusEbitaR12M: fcf - ebita,
      deltaDeferredR12M: c.deferredClosing - c0.deferredOpening, deltaReceivablesR12M: c.receivablesClosing - c0.receivablesOpening,
      identityResidual: (fcf - ebita) - ((c.deferredClosing - c0.deferredOpening) - (c.receivablesClosing - c0.receivablesOpening)),
      cashConversion: ebita !== 0 ? fcf / ebita : null,                    // cash FCF ÷ EBITA over the window
      deferredRevenue: c.deferredClosing, receivables: c.receivablesClosing,
      deferredMonthsOfRevenue: m.revenue > 0 ? c.deferredClosing / m.revenue : null,
      receivablesDays: billings > 0 ? c.receivablesClosing / (billings / 365) : null,
      billingsToRevenue: revenue > 0 ? billings / revenue : null
    };
  }

  /* ------------------------------------------------------------------ *
   * v2 Gate D — INTERVENTION MEASUREMENT. What each hypothesis has cost to
   * date and whether it is in force at T. The EFFECT of a hypothesis is a
   * counterfactual — the same world without it — which is a comparison of two
   * runs (E.compare / the product's Base vs Experiment), not a measurement of
   * one; this function deliberately does not pretend otherwise.
   * ------------------------------------------------------------------ */
  function interventionMeasures(res, T) {
    if (!res.mechanisms || !res.mechanisms.interventions) return null;
    var m = res.months[T - 1], sched = res.derived.interventions;
    return {
      T: T,
      cumulativeCost: m.interventions.cumulativeCost,
      costThisMonth: m.interventions.cost,
      active: m.interventions.active.slice(),
      hypotheses: sched.map(function (h) {
        var cost = 0; for (var t = 1; t <= T; t++) { var it = res.months[t - 1].interventions.costItems.filter(function (x) { return x.id === h.id; })[0]; if (it) cost += it.cost; }
        return { id: h.id, name: h.name, target: h.target, startMonth: h.startMonth, lagMonths: h.lagMonths, effectiveFrom: h.effectiveFrom, effectiveTo: h.effectiveTo, inForce: m.interventions.active.indexOf(h.id) >= 0,
                 status: T < h.startMonth ? 'not started' : T < h.effectiveFrom ? 'decided, effect pending' : T <= h.effectiveTo ? 'in force' : 'ended',
                 monthsInForce: Math.max(0, Math.min(T, h.effectiveTo) - h.effectiveFrom + 1), costToDate: cost, totalCost: h.totalCost };
      })
    };
  }

  return {
    WINDOW: WINDOW,
    rowAt: rowAt,
    measureR12M: measureR12M,
    customerMeasures: customerMeasures,
    monetizationMeasures: monetizationMeasures,
    cashMeasures: cashMeasures,
    interventionMeasures: interventionMeasures,
    measureSeries: measureSeries,
    companyKPIs: companyKPIs,
    acquisitionMeasures: acquisitionMeasures,
    expansionCostMeasures: expansionCostMeasures,
    forwardEconomics: forwardEconomics,
    ageComposition: ageComposition,
    seriesSum: seriesSum,
    decompose: decompose,
    workedExample: workedExample,
    calibrate: calibrate
  };
});
