/*
 * SaaS Physics — CAPITAL LOOP derivations (concept study).
 *
 * This file adds NO physics. Every quantity below is derived from values the
 * frozen engine already stores:
 *   cohort.acquisitionCost      stamped at creation (v0.3 provenance)
 *   cohort.rows[].cumGrossProfit  cumulative gross profit of that cohort
 *
 * It is an ECONOMIC ATTRIBUTION model. It does not claim that gross profit
 * literally flows back to the euro of S&M that was spent; it measures how long
 * a cohort takes to produce cumulative gross profit equal to the acquisition
 * cost attributed to it.
 *
 * DISCLOSED BOUNDARY: the engine applies one uniform gross margin to every
 * cohort, and models no marginal acquisition cost for expansion. So a cohort's
 * gross profit is exactly its ARR × GM / 12, and "gross profit by vintage" is
 * the ARR mix scaled by a constant. That is a property of the current physics,
 * not of SaaS, and it is surfaced rather than hidden.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsCapital = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function rowAt(c, t) {
    var idx = c.acquisitionMonth === 0 ? t - 1 : t - c.acquisitionMonth;
    return (idx >= 0 && idx < c.rows.length) ? c.rows[idx] : null;
  }

  /* ------------------------------------------------------------------ *
   * One cohort, from capital deployment through recovery.
   *
   *   unrecovered(t) = max(acquisitionCost − cumulativeGP(t), 0)
   *   net(t)         = cumulativeGP(t) − acquisitionCost      (signed)
   *   payback        = first t where cumulativeGP(t) ≥ acquisitionCost
   * ------------------------------------------------------------------ */
  function cohortCapital(res, k) {
    var c = res.cohorts[k];
    if (!c) return null;
    var cost = c.acquisitionCost;                    // null for the opening base
    var series = [], payback = null, paybackAge = null;
    for (var t = Math.max(1, c.acquisitionMonth); t <= res.horizon; t++) {
      var r = rowAt(c, t);
      if (!r) continue;
      var cum = r.cumGrossProfit;
      var unrec = cost === null ? null : Math.max(cost - cum, 0);
      var net = cost === null ? null : cum - cost;
      if (cost !== null && payback === null && cum >= cost) {
        payback = t; paybackAge = t - c.acquisitionMonth;
      }
      series.push({ t: t, age: r.age, cumGP: cum, gp: r.grossProfit,
                    arr: r.closingARR, unrecovered: unrec, net: net });
    }
    var last = series.length ? series[series.length - 1] : null;
    return {
      index: k, id: c.id, acquisitionMonth: c.acquisitionMonth,
      acquisitionCost: cost, cacPerARRAtCreation: c.cacPerARRAtCreation,
      initialARR: c.initialARR, series: series,
      paybackMonth: payback, paybackAge: paybackAge,
      finalCumGP: last ? last.cumGP : 0,
      surplusAtHorizon: (cost !== null && last) ? Math.max(last.cumGP - cost, 0) : null,
      /* the engine's closed form, for cross-checking the observed crossing */
      formulaPaybackMonths: res.derived.cacPaybackMonths
    };
  }

  function cohortCapitalAt(res, k, t) {
    var cap = cohortCapital(res, k);
    if (!cap) return null;
    var row = null;
    for (var i = 0; i < cap.series.length; i++) if (cap.series[i].t <= t) row = cap.series[i];
    return { cap: cap, now: row,
             paidBack: cap.paybackMonth !== null && cap.paybackMonth <= t };
  }

  /* ------------------------------------------------------------------ *
   * Portfolio view at month t: how much capital is out, how much has come
   * back, and how the deployed capital is distributed across payback states.
   * ------------------------------------------------------------------ */
  function portfolioCapital(res, t) {
    var deployed = 0, recovered = 0, outstanding = 0;
    var states = { prePayback: 0, paidBack: 0 }, counts = { prePayback: 0, paidBack: 0 };
    for (var k = 0; k < res.cohorts.length; k++) {
      var c = res.cohorts[k];
      if (c.acquisitionCost === null || c.acquisitionMonth > t) continue;
      var r = rowAt(c, t);
      var cum = r ? r.cumGrossProfit : 0;
      deployed += c.acquisitionCost;
      recovered += Math.min(cum, c.acquisitionCost);
      var unrec = Math.max(c.acquisitionCost - cum, 0);
      outstanding += unrec;
      if (unrec > 0) { states.prePayback += c.acquisitionCost; counts.prePayback++; }
      else { states.paidBack += c.acquisitionCost; counts.paidBack++; }
    }
    return { t: t, deployed: deployed, recovered: recovered, outstanding: outstanding,
             states: states, counts: counts,
             recoveredShare: deployed > 0 ? recovered / deployed : 0 };
  }

  /* ------------------------------------------------------------------ *
   * Which vintages produce THIS month's gross profit.
   * Under the current physics this is the ARR mix scaled by GM/12 — stated
   * plainly wherever it is displayed.
   * ------------------------------------------------------------------ */
  function gpByVintage(res, t) {
    var out = [], total = 0;
    for (var k = 0; k < res.cohorts.length; k++) {
      var c = res.cohorts[k], r = rowAt(c, t);
      if (!r || r.grossProfit <= 0) continue;
      out.push({ index: k, acquisitionMonth: c.acquisitionMonth, gp: r.grossProfit, age: r.age });
      total += r.grossProfit;
    }
    out.forEach(function (o) { o.share = total > 0 ? o.gp / total : 0; });
    var fromBase = out.filter(function (o) { return o.acquisitionMonth === 0; })
                      .reduce(function (s, o) { return s + o.gp; }, 0);
    var fromThisMonth = out.filter(function (o) { return o.acquisitionMonth === t; })
                           .reduce(function (s, o) { return s + o.gp; }, 0);
    return { t: t, total: total, rows: out,
             fromOpeningBase: fromBase,
             fromCohortAcquiredThisMonth: fromThisMonth,
             fromEarlierAcquisitions: total - fromBase - fromThisMonth };
  }

  /* Cumulative acquisition capital deployed up to month t. */
  function deployedSeries(res) {
    var out = [], acc = 0;
    for (var t = 0; t <= res.horizon; t++) {
      if (t > 0) acc += res.months[t - 1].sm;
      out.push(acc);
    }
    return out;
  }

  return {
    cohortCapital: cohortCapital,
    cohortCapitalAt: cohortCapitalAt,
    portfolioCapital: portfolioCapital,
    gpByVintage: gpByVintage,
    deployedSeries: deployedSeries
  };
});
