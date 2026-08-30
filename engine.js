/*
 * SaaS Physics — Prototype 0
 * Deterministic monthly economic engine. No DOM, no randomness, no I/O.
 *
 * ONE source of truth: this file is required by the Node checks/scenarios AND
 * inlined verbatim into the inspection UI by build.js. Base and Experiment
 * scenarios call the same run() with different assumption objects.
 *
 * LAYER A — ECONOMIC / STATE-TRANSITION ENGINE.
 * This file is the world, not the report on it. Its parameters are TRANSITION
 * COEFFICIENTS that govern how cohort ARR state evolves month to month. They are
 * deliberately NOT the CFO-reported KPIs of the same-sounding names: the reported
 * KPIs are computed by Layer B (kpi.js) by measuring this world's output. See
 * docs/MEASUREMENT.md.
 *
 * MODEL VERSION: v0.3
 *   v0.2.1 → v0.3: ONE new state dimension — cohort maturity. Transition
 *   coefficients may vary by cohort age band. Defaults are FLAT (all bands
 *   identical), so the shipped default reproduces v0.2.1 exactly and the model
 *   privileges no direction. Cohorts also carry acquisition-cost provenance.
 *   v0.1 → v0.2: the acquisition primitive is inverted. CAC per €1 of New ARR is
 *   now the input and CAC payback is an emergent output. Everything else about the
 *   engine is unchanged. Weaknesses are flagged in docs/FINDINGS.md, never silently
 *   "improved".
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
    /* TRANSITION COEFFICIENTS — they govern the world. They are not measurements,
       and they do not equal the KPIs of similar name. */
    TRANSITION: {
      persistenceAnnual:          'Annual persistence coefficient — 12-month multiplicative survival of installed ARR, applied BEFORE expansion. NOT reported GRR.',
      expansionCoefficientAnnual: 'Annual expansion coefficient — 12-month compounded expansion factor applied to RETAINED ARR. NOT reported expansion.',
      grossMargin:                'Gross margin coefficient',
      cacPerARR:                  'Acquisition spend per €1 of New ARR — dimensionless acquisition productivity'
    },
    CONTROL: {
      sm: 'Monthly S&M investment (management control)',
      rd: 'Monthly R&D investment (management control)',
      ga: 'Monthly G&A investment (management control)'
    },
    /* MEASURED — produced by Layer B (kpi.js) by observing the world. Never settable. */
    MEASURED: {
      r12mGRR:          'R12M gross revenue retention over a frozen eligible cohort — see kpi.js',
      r12mExpansion:    'R12M expansion rate over the same frozen cohort',
      r12mNRR:          'R12M net revenue retention = closing eligible ARR / opening ARR',
      cacPaybackMonths: 'Months of gross profit to repay acquisition cost — OUTPUT of cacPerARR and gross margin',
      arrGrowthYoY:     'ARR growth',
      ebitaMargin:      'EBITA margin',
      burn:             'Cash burn when FCF < 0'
    }
  };

  /* Illustrative defaults. Not real company data. */
  var DEFAULT_ASSUMPTIONS = {
    sm:                         900000,  // CONTROL   €/month
    cacPerARR:                  1.20,    // TRANSITION € of S&M per €1 of New ARR
    persistenceAnnual:          0.90,    // TRANSITION 12-month survival factor of installed ARR, before expansion
    expansionCoefficientAnnual: 0.10,    // TRANSITION 12-month compounded expansion factor applied to RETAINED ARR
    grossMargin:                0.80,    // TRANSITION
    rd:                         700000,  // CONTROL   €/month
    ga:                         350000   // CONTROL   €/month
  };
  /* AGE BANDS (v0.3). Three bands by cohort age in months at the START of a month:
     band 1 covers ages 0..11, band 2 covers 12..23, band 3 covers 24 and above.
     Each band carries its OWN persistence and expansion coefficient — six
     transition parameters in total, and no other new behavioural coefficient.

     The DEFAULT is flat: every band inherits the scalar coefficients, so the
     default world is exactly v0.2.1 and age carries no economic meaning until a
     user makes it carry some. The simulator takes no position on whether older
     cohorts are better, worse, or the same. */
  var BAND_EDGES = [12, 24, Infinity];
  var BAND_NAMES = ['Early', 'Developing', 'Mature'];

  function resolveBands(a) {
    if (a.bands && a.bands.length === 3) return a.bands;
    return BAND_NAMES.map(function (n, i) {
      return { name: n, maxAgeExclusive: BAND_EDGES[i],
               persistenceAnnual: a.persistenceAnnual,
               expansionCoefficientAnnual: a.expansionCoefficientAnnual };
    });
  }
  function bandFor(bands, ageAtStart) {
    for (var i = 0; i < bands.length; i++) if (ageAtStart < bands[i].maxAgeExclusive) return i;
    return bands.length - 1;
  }

  /* NOTE ON NAMES. persistenceAnnual is NOT reported GRR and expansionCoefficientAnnual
     is NOT reported expansion. At these defaults the measurement layer reports GRR
     89.56% and expansion 9.44% — see rateDiagnostics() and docs/MEASUREMENT.md. */
  /* cacPerARR 1.20 with GM 80% reproduces the v0.1 baseline exactly:
     v0.1 CAC payback 18 months  ⇔  cacPerARR = payback × GM / 12 = 18 × 0.80 / 12 = 1.20 */

  var DEFAULT_START = {
    openingARR:  20000000,      // STATE €20.0m
    openingCash: 10000000,      // STATE €10.0m
    /* v0.3: the opening base may be a portfolio of vintages. Each entry is
       { arr, age } where age is the cohort's age in months at t=0. Omit for the
       v0.2.1 behaviour of one opening cohort at age 0. */
    openingCohorts: null
  };

  /* ------------------------------------------------------------------ *
   * Rate conversions (spec §5)
   * ------------------------------------------------------------------ */
  function toMonthlyPersistence(persistenceAnnual) { return Math.pow(persistenceAnnual, 1 / 12); }

  /* Geometric conversion so that 12 compounded monthly steps reproduce the
   * stated annual expansion exactly: (1+e_m)^12 = 1+e_a */
  function toMonthlyExpansion(expAnnual) { return Math.pow(1 + expAnnual, 1 / 12) - 1; }

  /* ------------------------------------------------------------------ *
   * v0.2 acquisition physics
   *
   * PRIMITIVE — acquisition productivity, a dimensionless ratio:
   *   cacPerARR = acquisition spend / New ARR generated
   *
   * New ARR generated per year of spend:
   *   annual New ARR = (Monthly S&M x 12) / cacPerARR
   * so the ARR added to the stock in one month is:
   *   monthly New ARR = Monthly S&M / cacPerARR
   *
   * UNITS. sm is €/month. cacPerARR is dimensionless. newARRPerMonth is therefore
   * € of ARR (an annualised-run-rate quantity) added to the ARR stock each month —
   * the same interpretation the v0.1 engine used, so every downstream identity,
   * cohort rule and reconciliation is untouched.
   *
   * Gross margin does NOT appear here. That is the whole point of v0.2: acquisition
   * productivity determines how much ARR the spend creates; gross margin determines
   * how fast that investment is recovered, and shows up in cacPaybackMonths below.
   *
   * Still linear, instantaneous and unbounded in S&M — no capacity, ramp, pipeline,
   * conversion, diminishing returns or acquisition lag. See FINDINGS.md.
   * ------------------------------------------------------------------ */
  function newARRPerMonth(a) {
    if (!(a.cacPerARR > 0)) return 0;
    return a.sm / a.cacPerARR;
  }

  /* EMERGENT. Months of gross profit needed to repay the acquisition cost of €1 of
   * New ARR:  CAC = cacPerARR;  monthly gross profit on €1 of ARR = GM / 12.
   *   payback = cacPerARR / (GM / 12) = cacPerARR x 12 / GM
   * Never an input, and never used to generate New ARR. */
  function cacPaybackMonths(a) {
    if (!(a.grossMargin > 0)) return Infinity;
    return (a.cacPerARR * 12) / a.grossMargin;
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

    var gM = toMonthlyPersistence(a.persistenceAnnual);
    var eM = toMonthlyExpansion(a.expansionCoefficientAnnual);
    var newARR = newARRPerMonth(a);

    var bands = resolveBands(a);
    var bandRates = bands.map(function (b) {
      return { name: b.name, maxAgeExclusive: b.maxAgeExclusive,
               persistenceAnnual: b.persistenceAnnual,
               expansionCoefficientAnnual: b.expansionCoefficientAnnual,
               g: toMonthlyPersistence(b.persistenceAnnual),
               e: toMonthlyExpansion(b.expansionCoefficientAnnual) };
    });

    /* 4. The company IS a set of cohorts. Aggregates are only ever sums.
       v0.3: the opening base may be several vintages of different ages. */
    var seed = (s.openingCohorts && s.openingCohorts.length)
      ? s.openingCohorts
      : [{ arr: s.openingARR, age: 0 }];
    var cohorts = seed.map(function (c, i) {
      return {
        id: seed.length === 1 ? 'base' : 'base' + (i + 1),
        label: c.label || (seed.length === 1 ? 'Opening base' : 'Opening vintage, age ' + c.age),
        acquisitionMonth: 0,
        initialAge: c.age || 0,
        initialARR: c.arr,
        live: c.arr,
        /* PROVENANCE. The cost of creating the opening base happened before the
           simulation and is genuinely unknown — recorded as null, never as zero. */
        acquisitionCost: null,
        cacPerARRAtCreation: null,
        rows: []
      };
    });

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

      /* --- 5. ARR physics, applied cohort by cohort ---
         v0.3: the coefficients used are those of the band the cohort occupies at
         the START of the month. Nothing else about the transition changed. */
      for (i = 0; i < cohorts.length; i++) {
        c = cohorts[i];
        var ageEnd     = c.initialAge + (t - c.acquisitionMonth);
        var ageAtStart = ageEnd - 1;
        var bi = bandFor(bandRates, ageAtStart);
        var br = bandRates[bi];
        var opening  = c.live;
        var retained = opening * br.g;            // persistence can only shrink or hold
        var leakage  = opening - retained;        // churn + contraction combined
        var expansion= retained * br.e;           // expansion applies to RETAINED ARR
        var closing  = retained + expansion;
        var avgARR   = (opening + closing) / 2;   // 7. stock -> flow
        var revenue  = avgARR / 12;
        var gp       = revenue * a.grossMargin;

        c.rows.push({
          t: t, age: ageEnd, ageAtStart: ageAtStart, band: bi, bandName: br.name,
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
        id: 'M' + t, label: 'M' + t, acquisitionMonth: t, initialAge: 0,
        initialARR: newARR, live: newARR, rows: [],
        /* PROVENANCE (§2). Stamped once, at creation, from the acquisition
           economics in force in that month. Immutable thereafter, and never read
           by any forward transition — it is a sunk cost, not a forward penalty. */
        acquisitionCost: a.sm,
        cacPerARRAtCreation: a.cacPerARR
      };
      var ncRevenue = ((0 + newARR) / 2) / 12;    // half a month of ARR, same midpoint rule
      nc.rows.push({
        t: t, age: 0, ageAtStart: -1, band: 0, bandName: bandRates[0].name,
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
        nrrMonthly: nrrMonthly,               /* chained transition NRR, not the R12M KPI */
        nrrAnnualised: nrrAnnualised,         /* chained monthly NRR annualised — see kpi.js for the KPI */
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
      modelVersion: '0.3',
      assumptions: a,
      start: s,
      horizon: H,
      bands: bandRates,
      bandsAreFlat: bandRates.every(function (b) {
        return b.persistenceAnnual === bandRates[0].persistenceAnnual &&
               b.expansionCoefficientAnnual === bandRates[0].expansionCoefficientAnnual;
      }),
      derived: {
        monthlyPersistence: gM,
        monthlyExpansion: eM,
        newARRPerMonth: newARR,                       // € of ARR added per month
        newARRAnnualised: newARR * 12,                // € of ARR created per year of spend
        annualAcquisitionSpend: a.sm * 12,
        cacPaybackMonths: cacPaybackMonths(a),        // EMERGENT
        impliedAnnualNRR: a.persistenceAnnual * (1 + a.expansionCoefficientAnnual),
        impliedCACPerNewARR: newARR > 0 ? a.sm / newARR : 0   // reconciles to cacPerARR
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
        bandName: row.bandName,
        acquisitionCost: c.acquisitionCost,
        cacPerARRAtCreation: c.cacPerARRAtCreation,
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
   * Rate-conversion diagnostics (brief §8).
   *
   * The engine converts both annual rates geometrically and applies expansion to
   * RETAINED ARR, so monthly NRR = mGRR x (1 + mExp) and twelve of those compound
   * to exactly GRR x (1 + expansion). The intended annual NRR is reproduced exactly.
   *
   * What is NOT reproduced exactly is the DECOMPOSITION. A CFO measures annual gross
   * retention as (leakage over the year / opening ARR) and annual expansion as
   * (expansion over the year / opening ARR). Both of those flows accrue on a base
   * that moves during the year, and expansion accrues on the post-churn base, so the
   * measured rates differ from the input rates even though their net effect does not.
   * This function reports both so the gap is visible rather than assumed away.
   * ------------------------------------------------------------------ */
  function rateDiagnostics(res) {
    var a = res.assumptions, gM = res.derived.monthlyPersistence, eM = res.derived.monthlyExpansion;
    var base = res.cohorts[0], rows = base.rows.slice(0, 12);
    var opening = base.initialARR;
    var leak = 0, exp = 0;
    rows.forEach(function (r) { leak += r.leakage; exp += r.expansion; });
    var closing = rows.length ? rows[rows.length - 1].closingARR : opening;
    return {
      inputPersistenceAnnual: a.persistenceAnnual,
      inputExpansionCoefficient: a.expansionCoefficientAnnual,
      monthlyPersistence: gM,
      monthlyExpansion: eM,
      monthlyNRR: gM * (1 + eM),
      twelveMonthPersistence: Math.pow(gM, 12),                 // = input GRR
      twelveMonthExpansionCoefficient: Math.pow(1 + eM, 12) - 1,   // = input expansion
      twelveMonthNRRCompounded: Math.pow(gM * (1 + eM), 12),      // = GRR x (1 + expansion)
      /* measured the way a finance team would, from the first 12 months of the
         opening cohort's actual flows. See kpi.js for the general R12M measurement. */
      realisedGrossRetention: opening > 0 ? 1 - leak / opening : 1,
      realisedExpansionRate: opening > 0 ? exp / opening : 0,
      realisedNRR: opening > 0 ? closing / opening : 1,
      realisedLeakage: leak,
      realisedExpansion: exp
    };
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
    function arrAtYear(y) { var i = y * 12 - 1; return i < res.months.length ? res.months[i].closingARR : null; }
    return {
      newARRPerMonth: res.derived.newARRPerMonth,
      cacPaybackMonths: res.derived.cacPaybackMonths,
      y1ARR: arrAtYear(1), y3ARR: arrAtYear(3),
      openingCohortARR: mix.amounts.base,
      acquiredCohortARR: mix.total - mix.amounts.base,
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
      if (k === 'bands') return;                       // structural, compared separately
      if (expRes.assumptions[k] !== baseRes.assumptions[k]) {
        changed.push({ key: k, from: baseRes.assumptions[k], to: expRes.assumptions[k] });
      }
    });
    var bandsChanged = JSON.stringify(baseRes.bands.map(function (bb) {
      return [bb.persistenceAnnual, bb.expansionCoefficientAnnual]; })) !==
      JSON.stringify(expRes.bands.map(function (bb) {
        return [bb.persistenceAnnual, bb.expansionCoefficientAnnual]; }));
    return { base: b, experiment: x, delta: delta, changed: changed, bandsChanged: bandsChanged };
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
    BAND_EDGES: BAND_EDGES,
    BAND_NAMES: BAND_NAMES,
    resolveBands: resolveBands,
    bandFor: bandFor,
    toMonthlyPersistence: toMonthlyPersistence,
    toMonthlyExpansion: toMonthlyExpansion,
    newARRPerMonth: newARRPerMonth,
    run: run,
    bridge: bridge,
    cohortSnapshot: cohortSnapshot,
    arrMix: arrMix,
    yearSlice: yearSlice,
    rateDiagnostics: rateDiagnostics,
    cacPaybackMonths: cacPaybackMonths,
    summarise: summarise,
    compare: compare,
    annualSummary: annualSummary
  };
});
