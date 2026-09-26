/*
 * SaaS Physics v2 — INTERVENTIONS (Gate D). Hypotheses, resolved month by month.
 *
 * Every law in the engine is a coefficient the world obeys. An INTERVENTION is
 * not a law: it is a management hypothesis — "if we do X from month s, law L
 * moves by Δ after a lag, for a while, and it costs this much" — and it must
 * never silently become a coefficient. So an intervention is an explicit
 * object,
 *
 *   { id, name, target, effect: 'multiply' | 'add' | 'set', value,
 *     startMonth, lagMonths, durationMonths (null = permanent),
 *     cost: { oneOff, monthly } }
 *
 * and the engine reads the assumptions IN FORCE in month t from
 *
 *   lawAt(t) = base laws, with every intervention active in t applied in
 *              declaration order (active: startMonth + lagMonths ≤ t <
 *              startMonth + lagMonths + durationMonths)
 *
 * Costs are incurred from startMonth (the decision), not from the month the
 * effect arrives: oneOff in startMonth, monthly from startMonth through the
 * last active month (or the horizon when permanent). They are a P&L line of
 * their own (interventionCost) and cash when incurred.
 *
 * What an intervention may target: any numeric assumption that is ON in the
 * base world (a flat key, or a monetization component leaf by path). It may
 * not switch a layer on or off (a null target is rejected; setting a layer's
 * switch is rejected), and it may not change the billing policy (billing
 * units are anchored to a term). The resolved law of EVERY month must pass the
 * engine's own boundary validation, or the intervention is rejected up front:
 * a hypothesis cannot produce a world the engine would refuse to run.
 *
 * Provenance: every month records which interventions were active and what
 * each changed (target: from → to); every pending-acquisition entry and every
 * cohort records the interventions in force at spend.
 *
 * This module keeps no state and knows nothing about the economics: it
 * validates, resolves lawAt(t), and schedules cost.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsInterventions = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var LAYER_SWITCHES = { logoRetentionAnnual: 'Customer Physics', monetization: 'Monetization Physics', billingTermMonths: 'Cash Physics' };
  var FORBIDDEN = { billingTermMonths: 'billing policy', billingTiming: 'billing policy', collectionDelayMonths: 'billing policy', monetization: 'a whole layer', bands: 'age bands', interventions: 'itself' };

  /* Domains of the v1 laws the engine never bounded at its boundary (a caller
     could always set them; a hypothesis may not push them out of the world). */
  var DOMAIN = {
    sm: [0, Infinity], rd: [0, Infinity], ga: [0, Infinity], cacPerARR: [1e-9, Infinity],
    persistenceAnnual: [1e-9, 1], expansionCoefficientAnnual: [0, Infinity], grossMargin: [0, 1],
    expansionCostPerARR: [0, Infinity], maxMonthlyNewARR: [0, Infinity], acquisitionLagMonths: [0, Infinity],
    logoRetentionAnnual: [1e-9, 1], contractionAnnual: [0, 1 - 1e-9], newLogoARPA: [1e-9, Infinity]
  };
  function inDomain(key, v) { var d = DOMAIN[key]; return !d || (v >= d[0] && v <= d[1]); }

  function enabled(a) { return Array.isArray(a.interventions) && a.interventions.length > 0; }
  function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }

  /* nested paths: 'monetization.components[1].priceGrowthAnnual' */
  function parts(key) { return key.replace(/\[(\d+)\]/g, '.$1').split('.'); }
  function getK(obj, key) {
    var p = parts(key), v = obj;
    for (var i = 0; i < p.length; i++) { if (v === null || v === undefined) return undefined; v = v[p[i]]; }
    return v;
  }
  function setK(obj, key, val) {
    var p = parts(key), out = Object.assign({}, obj);
    if (p.length === 1) { out[key] = val; return out; }
    out[p[0]] = JSON.parse(JSON.stringify(obj[p[0]]));
    var v = out[p[0]];
    for (var i = 1; i < p.length - 1; i++) v = v[p[i]];
    v[p[p.length - 1]] = val;
    return out;
  }

  function applyOne(law, iv) {
    var cur = getK(law, iv.target), next;
    if (iv.effect === 'multiply') next = cur * iv.value;
    else if (iv.effect === 'add') next = cur + iv.value;
    else next = iv.value;
    return setK(law, iv.target, next);
  }

  function activeIn(iv, t) {
    var from = iv.startMonth + iv.lagMonths;
    if (t < from) return false;
    return iv.durationMonths === null || t < from + iv.durationMonths;
  }
  function costIn(iv, t, H) {
    var last = iv.durationMonths === null ? H : iv.startMonth + iv.lagMonths + iv.durationMonths - 1;
    var c = 0;
    if (t === iv.startMonth) c += iv.cost.oneOff;
    if (t >= iv.startMonth && t <= last) c += iv.cost.monthly;
    return c;
  }

  /* Validates and canonicalises; throws RangeError. `validateLaw` is the
     engine's own boundary validator, run on the resolved law of every month. */
  function validate(a, H, validateLaw) {
    var list = a.interventions;
    if (list === undefined || list === null) { a.interventions = []; return a; }
    if (!Array.isArray(list)) throw new RangeError('interventions must be an array (got ' + typeof list + ')');
    var seen = {};
    a.interventions = list.map(function (iv, i) {
      var tag = 'interventions[' + i + '] ';
      if (!iv || typeof iv !== 'object') throw new RangeError(tag + 'must be an object');
      var id = iv.id === undefined ? 'H' + (i + 1) : String(iv.id);
      if (seen[id]) throw new RangeError(tag + 'duplicate id "' + id + '"'); seen[id] = true;
      if (typeof iv.target !== 'string' || !iv.target) throw new RangeError(tag + 'target must be an assumption key');
      var root = parts(iv.target)[0];
      if (FORBIDDEN[root] && parts(iv.target).length === 1) throw new RangeError(tag + 'may not target ' + iv.target + ' (' + FORBIDDEN[root] + ')');
      if (root !== 'monetization' && parts(iv.target).length > 1) throw new RangeError(tag + 'only monetization component leaves may be targeted by path (got ' + iv.target + ')');
      var cur = getK(a, iv.target);
      if (cur === undefined) throw new RangeError(tag + 'unknown target ' + iv.target);
      if (cur === null) throw new RangeError(tag + 'targets ' + iv.target + ', which is off in the base world' + (LAYER_SWITCHES[root] ? ' — an intervention cannot switch ' + LAYER_SWITCHES[root] + ' on' : ''));
      if (typeof cur !== 'number') throw new RangeError(tag + 'target ' + iv.target + ' is not numeric');
      var effect = iv.effect === undefined ? 'multiply' : iv.effect;
      if (effect !== 'multiply' && effect !== 'add' && effect !== 'set') throw new RangeError(tag + 'effect must be "multiply", "add" or "set" (got ' + String(iv.effect) + ')');
      if (typeof iv.value !== 'number' || !isFinite(iv.value)) throw new RangeError(tag + 'value must be a finite number');
      if (!isInt(iv.startMonth) || iv.startMonth < 1) throw new RangeError(tag + 'startMonth must be an integer >= 1');
      var lag = iv.lagMonths === undefined ? 0 : iv.lagMonths;
      if (!isInt(lag) || lag < 0) throw new RangeError(tag + 'lagMonths must be an integer >= 0');
      var dur = iv.durationMonths === undefined ? null : iv.durationMonths;
      if (dur !== null && (!isInt(dur) || dur < 1)) throw new RangeError(tag + 'durationMonths must be null (permanent) or an integer >= 1');
      var cost = iv.cost || {};
      var oneOff = cost.oneOff === undefined ? 0 : cost.oneOff, monthly = cost.monthly === undefined ? 0 : cost.monthly;
      if (typeof oneOff !== 'number' || !(oneOff >= 0) || !isFinite(oneOff) || typeof monthly !== 'number' || !(monthly >= 0) || !isFinite(monthly))
        throw new RangeError(tag + 'cost.oneOff and cost.monthly must be numbers >= 0');
      return { id: id, name: iv.name || id, target: iv.target, effect: effect, value: iv.value, startMonth: iv.startMonth, lagMonths: lag, durationMonths: dur, cost: { oneOff: oneOff, monthly: monthly } };
    });
    /* bounds before benefits: the resolved law of every month must be a world the engine accepts */
    if (a.interventions.length && validateLaw) {
      for (var t = 1; t <= H; t++) {
        var rs = resolve(a, t), law = rs.law;
        if (law !== a) {
          for (var c = 0; c < rs.changes.length; c++) {
            var ch = rs.changes[c];
            if (!inDomain(ch.target, ch.to) || (ch.target === 'acquisitionLagMonths' && !isInt(ch.to)))
              throw new RangeError('interventions produce an invalid law in month ' + t + ': ' + ch.target + ' = ' + ch.to + ' is outside its domain');
          }
          try { validateLaw(Object.assign({}, law, { interventions: [] })); }
          catch (e) { throw new RangeError('interventions produce an invalid law in month ' + t + ': ' + e.message); }
        }
      }
    }
    return a;
  }

  /* The law in force in month t, and what each active intervention changed. */
  function resolve(a, t) {
    var law = a, active = [], changes = [];
    for (var i = 0; i < a.interventions.length; i++) {
      var iv = a.interventions[i];
      if (!activeIn(iv, t)) continue;
      var before = getK(law, iv.target);
      law = applyOne(law, iv);
      active.push(iv.id);
      changes.push({ id: iv.id, target: iv.target, from: before, to: getK(law, iv.target) });
    }
    return { law: law, active: active, changes: changes };
  }

  function costAt(a, t, H) {
    var total = 0, items = [];
    for (var i = 0; i < a.interventions.length; i++) {
      var c = costIn(a.interventions[i], t, H);
      if (c) { total += c; items.push({ id: a.interventions[i].id, cost: c }); }
    }
    return { total: total, items: items };
  }

  /* The schedule, for provenance and the product. */
  function schedule(a, H) {
    return a.interventions.map(function (iv) {
      var from = iv.startMonth + iv.lagMonths, to = iv.durationMonths === null ? H : Math.min(H, from + iv.durationMonths - 1);
      var totalCost = 0; for (var t = 1; t <= H; t++) totalCost += costIn(iv, t, H);
      return { id: iv.id, name: iv.name, target: iv.target, effect: iv.effect, value: iv.value,
               startMonth: iv.startMonth, lagMonths: iv.lagMonths, durationMonths: iv.durationMonths,
               effectiveFrom: from, effectiveTo: to, activeMonths: Math.max(0, to - from + 1),
               baseValue: getK(a, iv.target), valueInForce: from <= H ? getK(resolve(a, from).law, iv.target) : null,
               cost: iv.cost, totalCost: totalCost };
    });
  }

  /* activeIn, getK and setK are implementation, not interface: nothing outside
     this module has ever called them (the UI has its own getK/setK for nested
     assumption paths). An export nobody calls is a promise nobody asked for. */
  return { enabled: enabled, validate: validate, resolve: resolve, costAt: costAt, schedule: schedule };
});
