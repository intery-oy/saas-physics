/*
 * SaaS Physics — Prototype 0
 * Deterministic monthly economic engine. No DOM, no randomness, no I/O.
 *
 * ONE source of truth: this file is required by the Node checks/scenarios AND
 * inlined verbatim into the inspection UI by build.js. Base and Experiment
 * scenarios call the same run() with different assumption objects.
 *
 * MODEL VERSION: v0.1 — implemented faithfully to spec, weaknesses flagged in
 * docs/FINDINGS.md rather than silently "improved".
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysics = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var HORIZON = 60;

  /* ------------------------------------------------------------------ *
   * 15. Conceptual classification — kept explicit, not collapsed to KPIs
   * ------------------------------------------------------------------ */
  var TAXONOMY = {
    STATE: {
      openingARR:  'Installed-base ARR at start of month (stock)',
      closingARR:  'Installed-base ARR at end of month (stock)',
      cohortARR:   'Per-cohort ARR balance (stock)',
      cash:        'Cash balance (stock)'
    },
    FLOW: {
      newARR:      'ARR added by acquisition this month',
      expansion:   'ARR added by the installed base this month',
      leakage:     'ARR lost by the installed base this month (churn + contraction combined in v0.1)',
      revenue:     'Recognised revenue this month',
      cogs:        'Cost of revenue this month',
      grossProfit: 'Revenue less COGS this month',
      ebita:       'Gross profit less S&M, R&D, G&A',
      fcf:         'Free cash flow (= EBITA in v0.1)'
    },
    RATE: {
      grrAnnual:        'Annual gross revenue retention (coefficient)',
      expansionAnnual:  'Annual expansion rate on retained ARR (coefficient)',
      grossMargin:      'Gross margin (coefficient)',
      cacPaybackMonths: 'Months of gross profit to repay acquisition cost (coefficient)'
    },
    CONTROL: {
      sm: 'Monthly S&M investment (management control)',
      rd: 'Monthly R&D investment (management control)',
      ga: 'Monthly G&A investment (management control)'
    }
  };

  /* Illustrative defaults. Not real company data. */
  var DEFAULT_ASSUMPTIONS = {
    sm:               900000,   // CONTROL  €/month
    cacPaybackMonths: 18,       // RATE
    grrAnnual:        0.90,     // RATE
    expansionAnnual:  0.10,     // RATE
    grossMargin:      0.80,     // RATE
    rd:               700000,   // CONTROL  €/month
    ga:               350000    // CONTROL  €/month
  };

  var DEFAULT_START = {
    openingARR:  20000000,      // STATE €20.0m
    openingCash: 10000000       // STATE €10.0m
  };

  /* ------------------------------------------------------------------ *
   * Rate conversions (spec §5)
   * ------------------------------------------------------------------ */
  function toMonthlyGRR(grrAnnual) { return Math.pow(grrAnnual, 1 / 12); }

  /* Geometric conversion so that 12 compounded monthly steps reproduce the
   * stated annual expansion exactly: (1+e_m)^12 = 1+e_a */
  function toMonthlyExpansion(expAnnual) { return Math.pow(1 + expAnnual, 1 / 12) - 1; }

  /* ------------------------------------------------------------------ *
   * 6. New ARR generation — v0.1 acquisition formula
   *
   *   New ARR = (Monthly S&M x 12) / (CAC payback months x Gross margin)
   *
   * Derivation: CAC payback is defined on GROSS PROFIT, so
   *   CAC = payback x (New ARR / 12) x GM  =>  New ARR = S&M x 12 / (payback x GM)
   * Linear, instantaneous, unbounded. No capacity, ramp, pipeline, conversion,
   * diminishing returns or acquisition lag. See FINDINGS.md.
   * ------------------------------------------------------------------ */
  function newARRPerMonth(a) {
    var denom = a.cacPaybackMonths * a.grossMargin;
    if (!(denom > 0)) return 0;
    return (a.sm * 12) / denom;
  }

  function normaliseAssumptions(a) {
    return Object.assign({}, DEFAULT_ASSUMPTIONS, a || {});
  }

  /* ------------------------------------------------------------------ *
   * The engine
   * ------------------------------------------------------------------ */
  function run(assumptions, start, horizon) {
    var a = normaliseAssumptions(assumptions);
    var s = Object.assign({}, DEFAULT_START, start || {});
    var H = horizon || HORIZON;

    var gM = toMonthlyGRR(a.grrAnnual);
    var eM = toMonthlyExpansion(a.expansionAnnual);
    var newARR = newARRPerMonth(a);

    /* 4. The company IS a set of cohorts. Aggregates are only ever sums. */
    var cohorts = [{
      id: 'base',
      label: 'Opening base',
      acquisitionMonth: 0,
      initialARR: s.openingARR,
      live: s.openingARR,
      rows: []
    }];

    var months = [];
    var cash = s.openingCash;
    var nrrMonthlyHistory = [];
    var cum = { newARR: 0, expansion: 0, leakage: 0, revenue: 0, cogs: 0,
                grossProfit: 0, sm: 0, rd: 0, ga: 0, ebita: 0, fcf: 0 };

    function closingAt(k) { return k === 0 ? s.openingARR : months[k - 1].closingARR; }

    for (var t = 1; t <= H; t++) {
      var openingARR = 0, i, c;
      for (i = 0; i < cohorts.length; i++) openingARR += cohorts[i].live;

      var totRetained = 0, totLeakage = 0, totExpansion = 0, totRevenue = 0;

      /* --- 5. ARR physics, applied cohort by cohort --- */
      for (i = 0; i < cohorts.length; i++) {
        c = cohorts[i];
        var opening  = c.live;
        var retained = opening * gM;              // GRR can only shrink or hold
        var leakage  = opening - retained;        // churn + contraction combined (v0.1)
        var expansion= retained * eM;             // expansion applies to RETAINED ARR
        var closing  = retained + expansion;
        var avgARR   = (opening + closing) / 2;   // 7. stock -> flow
        var revenue  = avgARR / 12;
        var gp       = revenue * a.grossMargin;

        c.rows.push({
          t: t, age: t - c.acquisitionMonth,
          openingARR: opening, retainedARR: retained, leakage: leakage,
          expansion: expansion, closingARR: closing,
          revenue: revenue, grossProfit: gp
        });
        c.live = closing;

        totRetained += retained; totLeakage += leakage;
        totExpansion += expansion; totRevenue += revenue;
      }

      /* --- New acquisition cohort is created AFTER the base has aged --- */
      var nc = {
        id: 'M' + t, label: 'M' + t, acquisitionMonth: t,
        initialARR: newARR, live: newARR, rows: []
      };
      var ncRevenue = ((0 + newARR) / 2) / 12;    // half a month of ARR, same midpoint rule
      nc.rows.push({
        t: t, age: 0,
        openingARR: 0, retainedARR: 0, leakage: 0, expansion: 0, closingARR: newARR,
        revenue: ncRevenue, grossProfit: ncRevenue * a.grossMargin
      });
      cohorts.push(nc);
      totRevenue += ncRevenue;

      var closingARR = totRetained + totExpansion + newARR;

      /* --- 7/8. Revenue and gross profit (company = sum of cohorts) --- */
      var avgARRco  = (openingARR + closingARR) / 2;
      var revenue   = avgARRco / 12;
      var cogs      = revenue * (1 - a.grossMargin);
      var grossProfit = revenue * a.grossMargin;

      /* --- 9. EBITA --- */
      var ebita = grossProfit - a.sm - a.rd - a.ga;

      /* --- 10. Cash. FCF = EBITA in v0.1 (no WC/tax/capex). Disclosed. --- */
      var fcf = ebita;
      var cashOpening = cash;
      var cashClosing = cashOpening + fcf;
      cash = cashClosing;

      /* --- 11. NRR: eligible OPENING installed base only, New ARR excluded --- */
      var nrrMonthly = openingARR > 0 ? (totRetained + totExpansion) / openingARR : 1;
      nrrMonthlyHistory.push(nrrMonthly);
      var window = nrrMonthlyHistory.slice(-12);
      var prod = window.reduce(function (p, x) { return p * x; }, 1);
      var nrrAnnualised = Math.pow(prod, 12 / window.length);

      cum.newARR += newARR; cum.expansion += totExpansion; cum.leakage += totLeakage;
      cum.revenue += revenue; cum.cogs += cogs; cum.grossProfit += grossProfit;
      cum.sm += a.sm; cum.rd += a.rd; cum.ga += a.ga;
      cum.ebita += ebita; cum.fcf += fcf;

      months.push({
        t: t,
        year: Math.ceil(t / 12),
        quarter: Math.ceil(t / 3),
        openingARR: openingARR,
        retainedARR: totRetained,
        leakage: totLeakage,
        expansion: totExpansion,
        newARR: newARR,
        closingARR: closingARR,
        cohortRevenueSum: totRevenue,
        avgARR: avgARRco,
        revenue: revenue,
        cogs: cogs,
        grossProfit: grossProfit,
        sm: a.sm, rd: a.rd, ga: a.ga,
        ebita: ebita,
        ebitaMargin: revenue > 0 ? ebita / revenue : 0,
        fcf: fcf,
        burn: fcf < 0 ? -fcf : 0,
        cashOpening: cashOpening,
        cashClosing: cashClosing,
        nrrMonthly: nrrMonthly,
        nrrAnnualised: nrrAnnualised,
        arrGrowthMoM: openingARR > 0 ? closingARR / openingARR - 1 : 0,
        arrGrowthYoY: t >= 12 ? closingARR / closingAt(t - 12) - 1 : null,
        cohortCount: cohorts.length,
        cumulative: Object.assign({}, cum)
      });
    }

    /* --- Cohort cumulatives --- */
    for (var k = 0; k < cohorts.length; k++) {
      var co = cohorts[k];
      var cl = 0, ce = 0, cr = 0, cg = 0;
      for (var r = 0; r < co.rows.length; r++) {
        cl += co.rows[r].leakage; ce += co.rows[r].expansion;
        cr += co.rows[r].revenue; cg += co.rows[r].grossProfit;
        co.rows[r].cumLeakage = cl; co.rows[r].cumExpansion = ce;
        co.rows[r].cumRevenue = cr; co.rows[r].cumGrossProfit = cg;
      }
      co.cumLeakage = cl; co.cumExpansion = ce;
      co.cumRevenue = cr; co.cumGrossProfit = cg;
      co.finalARR = co.live;
    }

    return {
      modelVersion: '0.1',
      assumptions: a,
      start: s,
      horizon: H,
      derived: {
        monthlyGRR: gM,
        monthlyExpansion: eM,
        newARRPerMonth: newARR,
        impliedAnnualNRR: a.grrAnnual * (1 + a.expansionAnnual),
        impliedCACPerNewARR: newARR > 0 ? a.sm / newARR : 0
      },
      months: months,
      cohorts: cohorts
    };
  }

  /* ------------------------------------------------------------------ *
   * Read helpers used by both the UI and the reports
   * ------------------------------------------------------------------ */
  function bridge(res, t) {
    var m = res.months[t - 1];
    return {
      t: t,
      openingARR: m.openingARR,
      newARR: m.newARR,
      expansion: m.expansion,
      leakage: m.leakage,
      closingARR: m.closingARR,
      residual: m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR
    };
  }

  function cohortSnapshot(res, t) {
    var out = [];
    for (var i = 0; i < res.cohorts.length; i++) {
      var c = res.cohorts[i];
      if (c.acquisitionMonth > t) continue;
      /* base cohort rows start at t=1; acquisition cohorts start at t=acquisitionMonth */
      var idx = c.acquisitionMonth === 0 ? t - 1 : t - c.acquisitionMonth;
      var row = c.rows[idx];
      if (!row) continue;
      out.push({
        id: c.id,
        acquisitionMonth: c.acquisitionMonth,
        age: row.age,
        initialARR: c.initialARR,
        openingARR: row.openingARR,
        currentARR: row.closingARR,
        leakage: row.leakage,
        expansion: row.expansion,
        cumLeakage: row.cumLeakage,
        cumExpansion: row.cumExpansion,
        cumRevenue: row.cumRevenue,
        cumGrossProfit: row.cumGrossProfit,
        retainedShare: c.initialARR > 0 ? row.closingARR / c.initialARR : 0
      });
    }
    return out;
  }

  /* ARR mix at month t: opening base vs cohorts by acquisition year */
  function arrMix(res, t) {
    var snap = cohortSnapshot(res, t);
    var total = snap.reduce(function (s, c) { return s + c.currentARR; }, 0);
    var buckets = { base: 0, y1: 0, y2: 0, y3: 0, y4: 0, y5: 0 };
    snap.forEach(function (c) {
      if (c.acquisitionMonth === 0) buckets.base += c.currentARR;
      else buckets['y' + Math.ceil(c.acquisitionMonth / 12)] += c.currentARR;
    });
    var shares = {};
    Object.keys(buckets).forEach(function (k) { shares[k] = total > 0 ? buckets[k] / total : 0; });
    return { total: total, amounts: buckets, shares: shares };
  }

  /* ------------------------------------------------------------------ *
   * 14. Explainability — every number below comes out of the simulation,
   * none of it is asserted prose. Shared by the report and the UI.
   * ------------------------------------------------------------------ */
  function summarise(res) {
    var last = res.months[res.horizon - 1];
    var y5 = yearSlice(res, Math.ceil(res.horizon / 12));
    var cum = last.cumulative;
    var trough = res.months.reduce(function (lo, m) { return m.cashClosing < lo.cashClosing ? m : lo; }, res.months[0]);
    var firstProfit = null, firstOutOfCash = null;
    for (var i = 0; i < res.months.length; i++) {
      if (firstProfit === null && res.months[i].ebita > 0) firstProfit = res.months[i].t;
      if (firstOutOfCash === null && res.months[i].cashClosing < 0) firstOutOfCash = res.months[i].t;
    }
    var mix = arrMix(res, res.horizon);
    return {
      finalARR: last.closingARR,
      finalNRR: last.nrrAnnualised,
      finalGrowthYoY: last.arrGrowthYoY,
      cumNewARR: cum.newARR,
      cumExpansion: cum.expansion,
      cumLeakage: cum.leakage,
      cumRevenue: cum.revenue,
      cumGrossProfit: cum.grossProfit,
      cumEbita: cum.ebita,
      cumSM: cum.sm,
      finalYearFCF: y5.fcf,
      finalYearGrossProfit: y5.grossProfit,
      finalYearEbitaMargin: y5.ebitaMargin,
      endingCash: last.cashClosing,
      cashTrough: trough.cashClosing,
      cashTroughMonth: trough.t,
      firstProfitableMonth: firstProfit,
      firstNegativeCashMonth: firstOutOfCash,
      baseCohortShare: mix.shares.base,
      mix: mix
    };
  }

  function compare(baseRes, expRes) {
    var b = summarise(baseRes), x = summarise(expRes);
    var delta = {};
    Object.keys(b).forEach(function (k) {
      if (typeof b[k] === 'number' && typeof x[k] === 'number') delta[k] = x[k] - b[k];
    });
    var changed = [];
    Object.keys(expRes.assumptions).forEach(function (k) {
      if (expRes.assumptions[k] !== baseRes.assumptions[k]) {
        changed.push({ key: k, from: baseRes.assumptions[k], to: expRes.assumptions[k] });
      }
    });
    return { base: b, experiment: x, delta: delta, changed: changed };
  }

  function yearSlice(res, year) {
    var ms = res.months.filter(function (m) { return m.year === year; });
    var last = ms[ms.length - 1];
    var sum = function (k) { return ms.reduce(function (s, m) { return s + m[k]; }, 0); };
    return {
      year: year,
      closingARR: last.closingARR,
      newARR: sum('newARR'),
      expansion: sum('expansion'),
      leakage: sum('leakage'),
      revenue: sum('revenue'),
      grossProfit: sum('grossProfit'),
      ebita: sum('ebita'),
      fcf: sum('fcf'),
      burn: sum('burn'),
      cashClosing: last.cashClosing,
      nrrAnnualised: last.nrrAnnualised,
      arrGrowthYoY: last.arrGrowthYoY,
      ebitaMargin: sum('revenue') > 0 ? sum('ebita') / sum('revenue') : 0
    };
  }

  function annualSummary(res) {
    var years = [], n = Math.ceil(res.horizon / 12);
    for (var y = 1; y <= n; y++) years.push(yearSlice(res, y));
    return years;
  }

  return {
    HORIZON: HORIZON,
    TAXONOMY: TAXONOMY,
    DEFAULT_ASSUMPTIONS: DEFAULT_ASSUMPTIONS,
    DEFAULT_START: DEFAULT_START,
    toMonthlyGRR: toMonthlyGRR,
    toMonthlyExpansion: toMonthlyExpansion,
    newARRPerMonth: newARRPerMonth,
    run: run,
    bridge: bridge,
    cohortSnapshot: cohortSnapshot,
    arrMix: arrMix,
    yearSlice: yearSlice,
    summarise: summarise,
    compare: compare,
    annualSummary: annualSummary
  };
});
