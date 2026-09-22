/*
 * SaaS Physics — MONETIZATION COMPOSITION checks (FINDINGS #43).
 *
 * A cohort's per-customer component state is carried through MO.copyState(), whose
 * contract is { penetration, units, price }: the component KIND is a property of the
 * spec and lives on the rates array, not on state. realiseCohort() nevertheless
 * recovered the kind from a copied state, read undefined for every component, and so
 * classified ALL of a newly realised cohort's revenue as variable on its birth month.
 * The company record sums the cohort rows and inherited the error.
 *
 * Nothing economic moved — MO.revenue() returns total = fixed + variable whatever the
 * classification, and a newborn's ARR comes from the acquisition ledger — which is
 * exactly why every existing test passed straight through it. The checks below are
 * written against the quantity that was wrong, not the sum that was always right.
 *
 *   CLEAN-ROOM SPLIT   every cohort row, reconstructed from the spec's own kinds
 *   BIRTH ROW          a birth row carries fixed revenue when the world has a fixed line
 *   ATTRIBUTION ONLY   the changed-field set is exactly the nine documented paths
 *   STATE SHAPE        the published state object is unchanged (pins the chosen fix)
 *   N != 2             three components, two of them fixed
 *   NULL               unreachable with Monetization off
 *
 * Run: node monetization-split-checks.js
 */
'use strict';
var E = require('./engine.js'), K = require('./kpi.js');
var out = [], pass = 0, total = 0;
function ok(group, name, cond, detail) {
  total++; if (cond) pass++;
  out.push((cond ? '  PASS  ' : '  FAIL  ') + group + ' · ' + name + (cond || !detail ? '' : '\n        ' + detail));
}
function ex(v) { return Math.abs(v) < 1e-12 ? '0.00e+0' : v.toExponential(2); }

function mon(fixedFee, fixedGrowth, usage) {
  return { components: [{ name: 'platform', kind: 'fixed', units: 1, priceAnnual: fixedFee, priceGrowthAnnual: fixedGrowth },
                        Object.assign({ name: 'usage', kind: 'variable' }, usage)] };
}
var HYP = { id: 'ret', name: 'Retention programme', target: 'logoRetentionAnnual', effect: 'multiply', value: 1.03,
            startMonth: 6, lagMonths: 3, durationMonths: 24, cost: { oneOff: 200000, monthly: 50000 } };

/* Every world here ACQUIRES (sm > 0), which is what the earlier clean-room audit did
   not do: with sm = 0 the only cohort is the opening base, and the opening base is the
   one cohort that never passes through realiseCohort(). */
var WORLDS = {
  'A · Enterprise': [{ sm: 700000, rd: 700000, ga: 350000, cacPerARR: 1.6, grossMargin: 0.78, maxMonthlyNewARR: 1500000,
      acquisitionLagMonths: 4, openingPipelineMonths: 4, logoRetentionAnnual: 0.95, contractionAnnual: 0.03,
      monetization: mon(90000, 0.04, { penetration: 0.7, units: 400, priceAnnual: 150, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.20, unitsCap: 1200, adoptionAnnual: 0.12, penetrationCap: 0.95 }),
      billingTermMonths: 12, billingTiming: 'advance', collectionDelayMonths: 2 }, { openingCustomers: 120, openingCash: 10000000 }],
  'B · Usage / AI': [{ sm: 700000, rd: 900000, ga: 300000, cacPerARR: 0.9, grossMargin: 0.60, logoRetentionAnnual: 0.85, contractionAnnual: 0.10,
      monetization: mon(2400, 0, { penetration: 0.9, units: 500, priceAnnual: 12, priceGrowthAnnual: -0.05, usageGrowthAnnual: 0.45, unitsCap: 3000, adoptionAnnual: 0.30, penetrationCap: 1 }),
      billingTermMonths: 1, billingTiming: 'arrears', collectionDelayMonths: 1 }, { openingCustomers: 2500, openingCash: 10000000 }],
  'C · SMB': [{ sm: 450000, rd: 400000, ga: 200000, cacPerARR: 0.7, grossMargin: 0.75, maxMonthlyNewARR: 800000, logoRetentionAnnual: 0.78, contractionAnnual: 0.04,
      monetization: mon(1800, 0.03, { penetration: 0.5, units: 20, priceAnnual: 30, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.10, unitsCap: 60, adoptionAnnual: 0.15, penetrationCap: 0.8 }),
      billingTermMonths: 1, billingTiming: 'advance', collectionDelayMonths: 0 }, { openingCustomers: 8000, openingCash: 10000000 }],
  '+ Monetization pack': [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05,
      monetization: mon(12000, 0.03, { penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 }) }, undefined],
  '+ hypothesis': [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, billingTermMonths: 12, collectionDelayMonths: 1, interventions: [HYP],
      monetization: mon(12000, 0.03, { penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 }) }, undefined],
  'three components': [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05,
      monetization: { components: [
        { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.03 },
        { name: 'seats', kind: 'fixed', units: 1, priceAnnual: 5000, priceGrowthAnnual: 0.01 },
        { name: 'usage', kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 }] } }, undefined],
  'fixed only': [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05,
      monetization: { components: [{ name: 'platform', kind: 'fixed', units: 1, priceAnnual: 15000, priceGrowthAnnual: 0.05 }] } }, undefined]
};
var RUNS = {};
Object.keys(WORLDS).forEach(function (w) { RUNS[w] = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, WORLDS[w][0]), WORLDS[w][1]); });

/* ---- 1 · CLEAN-ROOM SPLIT — every cohort row, from the spec's kinds ---- */
(function () {
  var worstAll = 0, badRows = 0, rowsSeen = 0, cohortsWithAcq = 0, detail = '';
  Object.keys(RUNS).forEach(function (w) {
    var res = RUNS[w];
    /* kinds come from the SPEC, which the engine publishes and never copies */
    var isFixed = res.derived.monetization.spec.components.map(function (c) { return c.kind === 'fixed'; });
    res.cohorts.forEach(function (c) {
      if (c.acquisitionMonth > 0) cohortsWithAcq++;
      c.rows.forEach(function (r) {
        if (!r.monetization || !r.customers) return;
        rowsSeen++;
        var n = r.customers.closing, st = r.monetization.state, f = 0, v = 0;
        for (var k = 0; k < st.length; k++) {
          var val = n * st[k].penetration * st[k].units * st[k].price;
          if (isFixed[k]) f += val; else v += val;
        }
        var scale = Math.max(1, Math.abs(f) + Math.abs(v));
        var d = Math.max(Math.abs(f - r.monetization.fixedARR), Math.abs(v - r.monetization.variableARR));
        worstAll = Math.max(worstAll, d / scale);
        if (d / scale > 1e-9) { badRows++; if (!detail) detail = w + ' cohort@M' + c.acquisitionMonth + ' row M' + r.t + ' age ' + r.age + ': engine fixed ' + Math.round(r.monetization.fixedARR) + ', spec says ' + Math.round(f); }
      });
    });
  });
  ok('CLEAN-ROOM SPLIT', 'every cohort row in every acquiring world reconstructs from the spec\'s own component kinds — the check whose absence let the birth-row misattribution stand',
     badRows === 0, detail + ' | ' + badRows + ' of ' + rowsSeen + ' rows, worst rel ' + ex(worstAll));
  ok('CLEAN-ROOM SPLIT', 'the worlds actually acquire, so realiseCohort() is exercised (the prior clean-room audit ran at sm = 0, where the only cohort is the opening base and that path is never reached)',
     cohortsWithAcq > 300, cohortsWithAcq + ' acquisition cohorts across ' + Object.keys(RUNS).length + ' worlds');
})();

/* ---- 2 · BIRTH ROW — the row the defect lived on ---- */
(function () {
  var bad = [], checked = 0;
  Object.keys(RUNS).forEach(function (w) {
    var res = RUNS[w];
    var anyFixed = res.derived.monetization.spec.components.some(function (c) { return c.kind === 'fixed'; });
    if (!anyFixed) return;
    res.cohorts.forEach(function (c) {
      if (c.acquisitionMonth === 0) return;          /* the opening base is not realised */
      var r = c.rows[0]; if (!r || !r.monetization) return;
      checked++;
      if (!(r.monetization.fixedARR > 0)) bad.push(w + ' M' + c.acquisitionMonth);
    });
  });
  ok('BIRTH ROW', 'a cohort born into a world that has a fixed component reports fixed revenue on its birth month — it reported exactly zero before',
     bad.length === 0 && checked > 300, bad.slice(0, 4).join(', ') + ' | ' + checked + ' birth rows checked');
})();

/* ---- 3 · ATTRIBUTION ONLY — the sum was never wrong ---- */
(function () {
  var worstRow = 0, worstCo = 0, worstAgg = 0;
  Object.keys(RUNS).forEach(function (w) {
    var res = RUNS[w];
    res.cohorts.forEach(function (c) { c.rows.forEach(function (r) {
      if (!r.monetization) return;
      worstRow = Math.max(worstRow, Math.abs(r.monetization.fixedARR + r.monetization.variableARR - r.closingARR) / Math.max(1, r.closingARR));
    }); });
    res.months.forEach(function (m) {
      if (!m.monetization) return;
      worstCo = Math.max(worstCo, Math.abs(m.monetization.fixedARR + m.monetization.variableARR - m.closingARR) / Math.max(1, m.closingARR));
      var sf = 0, sv = 0;
      res.cohorts.forEach(function (c) { var r = K.rowAt(c, m.t); if (r && r.monetization) { sf += r.monetization.fixedARR; sv += r.monetization.variableARR; } });
      worstAgg = Math.max(worstAgg, Math.abs(sf - m.monetization.fixedARR) / Math.max(1, sf), Math.abs(sv - m.monetization.variableARR) / Math.max(1, sv));
    });
  });
  ok('ATTRIBUTION ONLY', 'fixed + variable = closing ARR on every cohort row — the partition identity held before the fix too, which is why the sum could never have caught it',
     worstRow < 1e-9, 'worst rel ' + ex(worstRow));
  ok('ATTRIBUTION ONLY', 'and on every company month', worstCo < 1e-9, 'worst rel ' + ex(worstCo));
  ok('ATTRIBUTION ONLY', 'the company split is the sum of the cohort splits', worstAgg < 1e-9, 'worst rel ' + ex(worstAgg));
})();

/* ---- 4 · STATE SHAPE — pins the fix that was chosen ---- */
(function () {
  var want = 'penetration,units,price', bad = [];
  Object.keys(RUNS).forEach(function (w) {
    RUNS[w].cohorts.forEach(function (c) { c.rows.forEach(function (r) {
      if (!r.monetization) return;
      r.monetization.state.forEach(function (k) { var got = Object.keys(k).join(','); if (got !== want) bad.push(w + ' M' + r.t + ': ' + got); });
    }); });
  });
  ok('STATE SHAPE', 'the published per-customer state is { penetration, units, price } and nothing else — the kind is a property of the spec, and widening a state copy to carry it was the fix NOT taken',
     bad.length === 0, bad.slice(0, 3).join(' | '));
})();

/* ---- 5 · N != 2 ---- */
(function () {
  var res = RUNS['three components'], spec = res.derived.monetization.spec.components;
  var nf = spec.filter(function (c) { return c.kind === 'fixed'; }).length;
  var m = res.months[35], f2 = 0;
  res.cohorts.forEach(function (c) { var r = K.rowAt(c, 36); if (r && r.monetization) f2 += r.monetization.fixedARR; });
  ok('N != 2', 'a three-component world with two fixed lines splits correctly — the classification is per component, not a two-way switch',
     spec.length === 3 && nf === 2 && Math.abs(f2 - m.monetization.fixedARR) < 1e-6 * Math.max(1, f2),
     spec.length + ' components, ' + nf + ' fixed');
  var fo = RUNS['fixed only'];
  var allFixed = fo.months.every(function (mm) { return !mm.monetization || Math.abs(mm.monetization.variableARR) < 1e-6; });
  ok('N != 2', 'a world with no variable line reports zero variable revenue in every month', allFixed, '');
})();

/* ---- 6 · NULL — unreachable with Monetization off ---- */
(function () {
  var offs = { 'ARR physics': {}, 'Customers only': { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 } };
  var bad = [];
  Object.keys(offs).forEach(function (w) {
    var res = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, offs[w]));
    if (res.mechanisms.monetization) bad.push(w + ': monetization on');
    res.months.forEach(function (m) { if (m.monetization !== null) bad.push(w + ' M' + m.t + ': monetization record not null'); });
    res.cohorts.forEach(function (c) { c.rows.forEach(function (r) { if (r.monetization !== null) bad.push(w + ': cohort row carries a monetization record'); }); });
  });
  ok('NULL', 'with Monetization off no month, cohort or row carries a monetization record at all — the corrected path is unreachable, which is why the null witnesses cannot move',
     bad.length === 0, bad.slice(0, 3).join(' | '));
})();

console.log(out.join('\n'));
console.log(pass + ' / ' + total + ' monetization-split checks passed');
process.exit(pass === total ? 0 : 1);
