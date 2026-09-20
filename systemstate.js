/*
 * SaaS Physics — SYSTEM VIEW state readout.
 *
 * The SYSTEM view needs one month of the engine's own record: the cohort
 * balances, the four ARR flows, the P&L line and the cash movement, plus the
 * same thing rendered as Experiment − Base.
 *
 * These derivations were originally written inside the Pulse concept study.
 * The Pulse was rejected and archived; the SYSTEM view was kept. A kept surface
 * must not depend on an archived prototype's module, so the two functions it
 * actually uses live here, in a module the product owns.
 *
 * NO PHYSICS. Every value is read out of the frozen engine's month record and
 * cohort rows. Behaviour is identical to the archived original, and the
 * SYSTEM-STATE check asserts that agreement value by value.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsSystemState = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function rowAt(c, t) {
    var idx = c.acquisitionMonth === 0 ? t - 1 : t - c.acquisitionMonth;
    return (idx >= 0 && idx < c.rows.length) ? c.rows[idx] : null;
  }

  /* One month, absolute. Cohort-anchored first, aggregates second — the
     aggregates are literally the sums of the cohort movements above them. */
  function stateAt(res, t) {
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
    /* v1.1 — the expansion realisation cost line; 0 in the null world, so every
       pre-existing residual below is unchanged there. v1.3 — the pending
       acquisition stock and the law's own output, so the SYSTEM view can draw
       spend → pending → cohort as the engine actually steps it. */
    var expansionCost = m.expansionCost || 0;
    return {
      t:t, year:m.year, cohorts:cohorts,
      openingARR:m.openingARR, leakage:m.leakage, expansion:m.expansion,
      newARR:m.newARR, closingARR:m.closingARR,
      arrResidual: m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR,
      cohortSumResidual: { opening: sumOpen - m.openingARR, closing: sumClose - m.closingARR,
                           leakage: sumLeak - m.leakage, expansion: sumExp - m.expansion },
      midpointARR:(m.openingARR + m.closingARR) / 2,
      revenue:m.revenue, cogs:m.cogs, grossProfit:m.grossProfit,
      sm:m.sm, rd:m.rd, ga:m.ga, otherOpex:otherOpex,
      expansionCost: expansionCost,
      acquisitionLawNewARR: m.acquisitionLawNewARR === undefined ? m.newARR : m.acquisitionLawNewARR,
      pendingNewARR: m.pendingNewARR || 0, pendingSpend: m.pendingSpend || 0, pendingCount: m.pendingCount || 0,
      ebita:m.ebita, fcf:m.fcf, cashOpening:m.cashOpening, cashClosing:m.cashClosing,
      gpResidual: m.revenue - m.cogs - m.grossProfit,
      fcfResidual: m.grossProfit - m.sm - otherOpex - expansionCost - m.fcf,
      cashResidual: m.cashOpening + m.fcf - m.cashClosing,
      newCohortRevenueThisMonth: newC ? newC.revenue : 0,
      newCohortGPThisMonth: newC ? newC.grossProfit : 0,
      sameMonthReturnOnSM: (newC && m.sm > 0) ? newC.grossProfit / m.sm : 0
    };
  }

  /* The same month, rendered as Experiment − Base. Base becomes zero. */
  function deltaStateAt(baseRes, expRes, t) {
    var b = stateAt(baseRes, t), x = stateAt(expRes, t);
    var keys = ['openingARR','leakage','expansion','newARR','closingARR','midpointARR',
                'revenue','cogs','grossProfit','sm','rd','ga','otherOpex','expansionCost',
                'acquisitionLawNewARR','pendingNewARR','pendingSpend','pendingCount','ebita','fcf',
                'cashOpening','cashClosing'];
    var d = { t:t, base:b, experiment:x };
    keys.forEach(function(kk){ d[kk] = x[kk] - b[kk]; });
    d.arrResidual = d.openingARR + d.newARR + d.expansion - d.leakage - d.closingARR;
    d.fcfResidual = d.grossProfit - d.sm - d.otherOpex - d.expansionCost - d.fcf;
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

  return { stateAt: stateAt, deltaStateAt: deltaStateAt, rowAt: rowAt };
});
