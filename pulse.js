/*
 * SaaS Physics — PULSE derivations (Flow concept study).
 *
 * No physics. Every value is read out of the frozen engine's own month record
 * and cohort rows. The ORDER below was read off engine.js, not invented:
 * see intraMonthLaw() for the declared sequence and its conventions.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SaaSPhysicsPulse = factory(root.SaaSPhysics);
})(typeof self !== 'undefined' ? self : globalThis, function (E) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * §3 — the intra-month law, as the frozen engine actually applies it.
   * ------------------------------------------------------------------ */
  var LAW = [
    { n:1, key:'opening',   title:'Opening cohort state',
      formula:'openingARR = Σ cohort.live', note:'Every cohort alive at the start of the month.' },
    { n:2, key:'leakage',   title:'Retention, then leakage',
      formula:'retained = opening × g   ·   leakage = opening − retained',
      note:'Applied per cohort, to that cohort’s OPENING balance, using the age band it occupies at the START of the month.' },
    { n:3, key:'expansion', title:'Expansion',
      formula:'expansion = retained × e',
      note:'Applied to RETAINED ARR — the post-leakage balance — not to opening ARR. This is a real convention, not a rounding detail.' },
    { n:4, key:'new',       title:'New cohort creation',
      formula:'newARR = S&M ÷ cacPerARR',
      note:'Created AFTER every existing cohort has aged. It neither leaks nor expands in its birth month.' },
    { n:5, key:'closing',   title:'Closing ARR',
      formula:'closing = Σ retained + Σ expansion + newARR',
      note:'Identical to opening + new + expansion − leakage. The bridge is an identity, not a check.' },
    { n:6, key:'revenue',   title:'Revenue',
      formula:'revenue = ((openingARR + closingARR) ÷ 2) ÷ 12',
      note:'A MIDPOINT convention. Revenue does not come from closing ARR alone. The new cohort contributes (0 + newARR)/2 — half a month — in its birth month.' },
    { n:7, key:'margin',    title:'Gross-margin split',
      formula:'COGS = revenue × (1 − GM)   ·   GP = revenue × GM', note:'One uniform margin across every cohort.' },
    { n:8, key:'opex',      title:'Operating absorption',
      formula:'EBITA = GP − S&M − R&D − G&A', note:'S&M is a current-period expense AND the thing that created this month’s new cohort.' },
    { n:9, key:'cash',      title:'FCF and cash',
      formula:'FCF = EBITA   ·   closing cash = opening cash + FCF',
      note:'Frozen simplification: no working capital, deferred revenue, tax or capex.' }
  ];

  /* The cohort row-indexing rule has one owner: engine.rowAt. */
  var rowAt = E.rowAt;

  /* ------------------------------------------------------------------ *
   * One month, absolute. Cohort-anchored first, aggregates second — the
   * aggregates are literally the sums of the cohort movements above them.
   * ------------------------------------------------------------------ */
  function pulseAt(res, t) {
    var m = res.months[t - 1];
    var cohorts = [], sumLeak = 0, sumExp = 0, sumOpen = 0, sumClose = 0;
    for (var k = 0; k < res.cohorts.length; k++) {
      var c = res.cohorts[k], r = rowAt(c, t);
      if (!r) continue;
      var isNew = c.acquisitionMonth === t;
      cohorts.push({ index:k, id:c.id, acquisitionMonth:c.acquisitionMonth, isNew:isNew,
                     opening:r.openingARR, retained:r.retainedARR, leakage:r.leakage,
                     expansion:r.expansion, closing:r.closingARR,
                     revenue:r.revenue, grossProfit:r.grossProfit });
      sumLeak += r.leakage; sumExp += r.expansion;
      sumOpen += r.openingARR; sumClose += r.closingARR;
    }
    var newC = cohorts.filter(function(x){ return x.isNew; })[0] || null;
    var otherOpex = m.rd + m.ga;
    return {
      t:t, year:m.year, cohorts:cohorts,
      openingARR:m.openingARR, leakage:m.leakage, expansion:m.expansion,
      newARR:m.newARR, closingARR:m.closingARR,
      /* the ARR bridge, as an identity */
      arrResidual: m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR,
      cohortSumResidual: { opening: sumOpen - m.openingARR, closing: sumClose - m.closingARR,
                           leakage: sumLeak - m.leakage, expansion: sumExp - m.expansion },
      midpointARR:(m.openingARR + m.closingARR) / 2,
      revenue:m.revenue, cogs:m.cogs, grossProfit:m.grossProfit,
      sm:m.sm, rd:m.rd, ga:m.ga, otherOpex:otherOpex,
      ebita:m.ebita, fcf:m.fcf, cashOpening:m.cashOpening, cashClosing:m.cashClosing,
      gpResidual: m.revenue - m.cogs - m.grossProfit,
      fcfResidual: m.grossProfit - m.sm - otherOpex - m.fcf,
      cashResidual: m.cashOpening + m.fcf - m.cashClosing,
      /* §6 honesty: how much of this month's GP the new cohort actually produced */
      newCohortRevenueThisMonth: newC ? newC.revenue : 0,
      newCohortGPThisMonth: newC ? newC.grossProfit : 0,
      sameMonthReturnOnSM: (newC && m.sm > 0) ? newC.grossProfit / m.sm : 0
    };
  }

  /* ------------------------------------------------------------------ *
   * §9 — the same month, rendered as Experiment − Base. Base becomes zero.
   * ------------------------------------------------------------------ */
  function deltaPulseAt(baseRes, expRes, t) {
    var b = pulseAt(baseRes, t), x = pulseAt(expRes, t);
    var keys = ['openingARR','leakage','expansion','newARR','closingARR','midpointARR',
                'revenue','cogs','grossProfit','sm','rd','ga','otherOpex','ebita','fcf',
                'cashOpening','cashClosing'];
    var d = { t:t, base:b, experiment:x };
    keys.forEach(function(kk){ d[kk] = x[kk] - b[kk]; });
    d.arrResidual = d.openingARR + d.newARR + d.expansion - d.leakage - d.closingARR;
    d.fcfResidual = d.grossProfit - d.sm - d.otherOpex - d.fcf;
    d.cashResidual = d.cashOpening + d.fcf - d.cashClosing;
    /* per-cohort deltas, so the delta stays cohort-anchored too */
    d.cohorts = x.cohorts.map(function(xc){
      var bc = b.cohorts.filter(function(y){ return y.index===xc.index; })[0];
      return { index:xc.index, acquisitionMonth:xc.acquisitionMonth, isNew:xc.isNew,
               opening:xc.opening-(bc?bc.opening:0), leakage:xc.leakage-(bc?bc.leakage:0),
               expansion:xc.expansion-(bc?bc.expansion:0), closing:xc.closing-(bc?bc.closing:0) };
    });
    return d;
  }

  /* ------------------------------------------------------------------ *
   * §11 — ΔARR today IS the running sum of every monthly Δflow.
   *   ΔClosing(T) = Σ_{t=1..T} (ΔNew + ΔExpansion − ΔLeakage)
   * because ΔOpening(t) = ΔClosing(t−1) and ΔClosing(0) = 0.
   * ------------------------------------------------------------------ */
  function deltaAccumulator(baseRes, expRes) {
    var rows = [], acc = 0, worst = 0;
    for (var t = 1; t <= expRes.horizon; t++) {
      var bm = baseRes.months[t-1], xm = expRes.months[t-1];
      var dNew = xm.newARR - bm.newARR, dExp = xm.expansion - bm.expansion, dLeak = xm.leakage - bm.leakage;
      var step = dNew + dExp - dLeak;
      acc += step;
      var dClose = xm.closingARR - bm.closingARR;
      worst = Math.max(worst, Math.abs(acc - dClose));
      rows.push({ t:t, dNew:dNew, dExpansion:dExp, dLeakage:dLeak, monthlyStep:step,
                  cumulative:acc, dClosingARR:dClose, residual:acc - dClose,
                  dRevenue:xm.revenue-bm.revenue, dGrossProfit:xm.grossProfit-bm.grossProfit,
                  dFCF:xm.fcf-bm.fcf, dCash:xm.cashClosing-bm.cashClosing });
    }
    return { rows:rows, maxResidual:worst };
  }

  /* §12 — an illustrative intuition calibration, deliberately separate from
     the engine scenario: repeated survival is exponential. */
  function retentionExponent(a, b, n) {
    a = a===undefined?0.98:a; b = b===undefined?0.99:b; n = n||60;
    return { a:a, b:b, n:n, survA:Math.pow(a,n), survB:Math.pow(b,n),
             ratio: Math.pow(b,n)/Math.pow(a,n), illustrative:true };
  }

  return { LAW:LAW, pulseAt:pulseAt, deltaPulseAt:deltaPulseAt,
           deltaAccumulator:deltaAccumulator, retentionExponent:retentionExponent };
});
