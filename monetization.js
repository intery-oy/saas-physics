/*
 * SaaS Physics v2 — MONETIZATION PHYSICS (Gate B). Pure transition functions.
 *
 * Requires Customer Physics. With Monetization on, a cohort's revenue is no
 * longer a carried MRR balance: it is DERIVED every month from per-customer
 * component state,
 *
 *   revenue per customer (annual) = Σ_k  penetration_k × units_k × price_k
 *   cohort ARR = customers × revenue per customer
 *
 * Every component is (penetration, units, price). A FIXED component (platform
 * fee, seats under contract) has penetration 1 and no usage or adoption
 * headroom; a VARIABLE component (usage, an add-on) may be adopted by more of
 * the cohort's customers (penetration → cap), used more (units → cap) and
 * repriced. The generic expansion coefficient is BYPASSED: survivor revenue
 * changes only through the four named effects below, in this order each month,
 *
 *   1. contraction   variable units × (1 − cM)            customers who stay and use less
 *   2. price         price_k × (1 + pM_k)                   list-price growth, every component
 *   3. usage         units_k → min(cap_k, units_k (1 + uM_k)) variable components only
 *   4. adoption      pen_k  → pen_k + (penCap_k − pen_k) aM_k  variable components only
 *
 * so  closing = opening − logo churn − contraction + price + usage + adoption,
 * with logo churn from customers.js (departing customers take the cohort's
 * average revenue). Contraction reaches only variable revenue, so a cohort's
 * dollar persistence is EMERGENT here — it depends on its fixed/variable mix —
 * not the Gate A constant L(1 − C). Usage and penetration caps make expansion
 * saturate: a cohort's ARPA converges to a ceiling (FINDINGS #13/#30).
 *
 * Rates: pM = (1 + P)^(1/12) − 1, uM = (1 + U)^(1/12) − 1 (growth rates);
 * aM = 1 − (1 − A)^(1/12) (share of remaining non-adopters per month).
 *
 * This module keeps no state and knows nothing about acquisition, cash or the
 * company. The engine passes a cohort's per-customer state in and takes the
 * transition out.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsMonetization = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function enabled(a) { return a.monetization !== null && a.monetization !== undefined; }

  function num(v) { return typeof v === 'number' && isFinite(v); }

  /* Validates and CANONICALISES the spec (returns a fresh object). Throws
     RangeError; never coerces a value silently. */
  function validate(a, customersOn) {
    var M = a.monetization;
    if (M === undefined || M === null) { a.monetization = null; return a; }
    if (!customersOn) throw new RangeError('Monetization Physics requires Customer Physics (logoRetentionAnnual) to be on');
    if (typeof M !== 'object' || !Array.isArray(M.components) || M.components.length === 0)
      throw new RangeError('monetization must be { components: [ ... ] } with at least one component');
    var out = { components: M.components.map(function (c, i) {
      var tag = 'monetization.components[' + i + '] ';
      if (!c || typeof c !== 'object') throw new RangeError(tag + 'must be a component object (got ' + String(c) + ')');
      var kind = c.kind === undefined ? 'variable' : c.kind;
      if (kind !== 'fixed' && kind !== 'variable') throw new RangeError(tag + 'kind must be "fixed" or "variable" (got ' + String(c.kind) + ')');
      var pen = c.penetration === undefined ? 1 : c.penetration;
      if (!num(pen) || !(pen > 0) || pen > 1) throw new RangeError(tag + 'penetration must be in (0, 1] (got ' + String(c.penetration) + ')');
      if (!num(c.units) || !(c.units > 0)) throw new RangeError(tag + 'units must be > 0 (got ' + String(c.units) + ')');
      if (!num(c.priceAnnual) || !(c.priceAnnual > 0)) throw new RangeError(tag + 'priceAnnual must be > 0 (got ' + String(c.priceAnnual) + ')');
      var pg = c.priceGrowthAnnual === undefined ? 0 : c.priceGrowthAnnual;
      if (!num(pg) || pg <= -1) throw new RangeError(tag + 'priceGrowthAnnual must be a number > -1 (got ' + String(c.priceGrowthAnnual) + ')');
      var ug = c.usageGrowthAnnual === undefined ? 0 : c.usageGrowthAnnual;
      var cap = c.unitsCap === undefined ? null : c.unitsCap;
      var ad = c.adoptionAnnual === undefined ? 0 : c.adoptionAnnual;
      var pcap = c.penetrationCap === undefined ? 1 : c.penetrationCap;
      if (kind === 'fixed') {
        if (pen !== 1) throw new RangeError(tag + 'a fixed component has penetration 1 (got ' + pen + ')');
        if (ug !== 0 || ad !== 0 || (cap !== null && cap !== c.units)) throw new RangeError(tag + 'a fixed component has no usage growth, adoption or headroom');
        cap = c.units; pcap = 1;
      } else {
        if (!num(ug) || ug < 0) throw new RangeError(tag + 'usageGrowthAnnual must be a number >= 0 (got ' + String(c.usageGrowthAnnual) + ')');
        if (cap !== null && (!num(cap) || cap < c.units)) throw new RangeError(tag + 'unitsCap must be null (no cap) or >= units (got ' + String(c.unitsCap) + ')');
        if (!num(ad) || ad < 0 || ad >= 1) throw new RangeError(tag + 'adoptionAnnual must be in [0, 1) (got ' + String(c.adoptionAnnual) + ')');
        if (!num(pcap) || pcap < pen || pcap > 1) throw new RangeError(tag + 'penetrationCap must be in [penetration, 1] (got ' + String(c.penetrationCap) + ')');
      }
      return { name: c.name || (kind === 'fixed' ? 'fixed' : 'variable ' + (i + 1)), kind: kind, penetration: pen, units: c.units, priceAnnual: c.priceAnnual,
               priceGrowthAnnual: pg, usageGrowthAnnual: ug, unitsCap: cap, adoptionAnnual: ad, penetrationCap: pcap };
    }) };
    a.monetization = out;
    return a;
  }

  function rates(spec) {
    return spec.components.map(function (c) {
      return { pM: Math.pow(1 + c.priceGrowthAnnual, 1 / 12) - 1,
               uM: Math.pow(1 + c.usageGrowthAnnual, 1 / 12) - 1,
               aM: 1 - Math.pow(1 - c.adoptionAnnual, 1 / 12),
               unitsCap: c.unitsCap, penetrationCap: c.penetrationCap, fixed: c.kind === 'fixed' };
    });
  }

  /* The per-customer state a cohort starts with: the spec's opening values. */
  function initialState(spec) {
    return spec.components.map(function (c) { return { penetration: c.penetration, units: c.units, price: c.priceAnnual }; });
  }
  function copyState(st) { return st.map(function (k) { return { penetration: k.penetration, units: k.units, price: k.price }; }); }

  /* Annual revenue per customer, and its fixed / variable split. */
  function revenue(state, r) {
    var fixed = 0, variable = 0;
    for (var k = 0; k < state.length; k++) {
      var v = state[k].penetration * state[k].units * state[k].price;
      if (r[k].fixed) fixed += v; else variable += v;
    }
    return { total: fixed + variable, fixed: fixed, variable: variable };
  }

  /* One cohort's per-customer state, one month. cM = monthly contraction
     (customers.js rates().cM). Returns the closing state and the four effects
     as ANNUAL revenue per customer, in application order. */
  function transition(state, r, cM) {
    var s = copyState(state), k;
    var r0 = revenue(s, r).total;
    for (k = 0; k < s.length; k++) if (!r[k].fixed) s[k].units *= (1 - cM);
    var r1 = revenue(s, r).total;
    for (k = 0; k < s.length; k++) s[k].price *= (1 + r[k].pM);
    var r2 = revenue(s, r).total;
    for (k = 0; k < s.length; k++) if (!r[k].fixed) {
      var u = s[k].units * (1 + r[k].uM);
      s[k].units = r[k].unitsCap === null ? u : Math.min(r[k].unitsCap, u);
    }
    var r3 = revenue(s, r).total;
    for (k = 0; k < s.length; k++) if (!r[k].fixed) s[k].penetration += (r[k].penetrationCap - s[k].penetration) * r[k].aM;
    var rv = revenue(s, r);
    return {
      state: s,
      opening: r0, closing: rv.total, fixed: rv.fixed, variable: rv.variable,
      effects: { contraction: r0 - r1, price: r2 - r1, usage: r3 - r2, adoption: rv.total - r3 },
      headroom: s.map(function (c, i) {
        return { units: r[i].fixed || r[i].unitsCap === null ? null : c.units / r[i].unitsCap,
                 penetration: r[i].fixed ? null : c.penetration / r[i].penetrationCap };
      })
    };
  }

  return { enabled: enabled, validate: validate, rates: rates, initialState: initialState, copyState: copyState, revenue: revenue, transition: transition };
});
