/*
 * SaaS Physics v1.1–v1.3 — cross-mechanism, release-gate and extreme-probe checks.
 *
 * The per-mechanism assertions live in integrity.js (EXP-COST, ACQ-BOUND,
 * ACQ-LAG) so the browser runs them too. This file holds what needs the
 * captured v1.0 fixture or a probe grid, and the checks that only make sense
 * once all three mechanisms exist together:
 *
 *   ALL-NULL          expansionCostPerARR 0 · saturation disabled · lag 0
 *                     reproduces baseline-v1.0.json (Base + 5 scenarios) — THE
 *                     release gate.
 *   SAT+LAG           capacity governs how much, lag governs when; changing the
 *                     lag never alters the acquisition response.
 *   COST+SAT          expansion cost never touches acquisition; the bound never
 *                     touches existing-cohort expansion.
 *   ALL-ON            with all three on, the ARR bridge, cohort sum, cash
 *                     roll-forward and P&L identity still reconcile.
 *   RETENTION-ISO     under all three, pure acquisition changes leave every
 *                     R12M measure unchanged.
 *   DETERMINISM       repeat runs identical, all three on.
 *   EXTREMES          zero/huge S&M, zero/high expansion, zero/high cost,
 *                     zero/long lag, disabled/very tight capacity: no NaN, no
 *                     Infinity, identities hold. Nothing is clamped.
 *   SWEEP             the S&M sweep is monotone in New ARR and M60 ARR while
 *                     marginal economics deteriorate faster than average.
 *
 * Run: node physics-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');

var EPS = 1e-6;
var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }
function ex(v) { return Number(v).toExponential(2); }
var A = E.DEFAULT_ASSUMPTIONS;
var NULLS = { expansionCostPerARR: 0, maxMonthlyNewARR: null, acquisitionLagMonths: 0 };
var ALL = { expansionCostPerARR: 0.25, maxMonthlyNewARR: 2000000, acquisitionLagMonths: 3 };

/* ------------------------------------------------------------------ *
 * ALL-NULL — the release gate
 * ------------------------------------------------------------------ */
(function allNull() {
  var B = JSON.parse(fs.readFileSync(__dirname + '/baseline-v1.0.json', 'utf8'));
  var scen = { base: {}, retention: { persistenceAnnual: 0.96 }, expansion: { expansionCoefficientAnnual: 0.18 },
               efficiency: { cacPerARR: 0.80 }, margin: { grossMargin: 0.65 }, pair: { cacPerARR: 0.80, sm: 900000 * 1.5 } };
  Object.keys(scen).forEach(function (k) {
    var r = E.run(Object.assign({}, A, NULLS, scen[k]));
    var worst = 0, where = '';
    r.months.forEach(function (m, i) {
      var b = B[k].months[i];
      Object.keys(b).forEach(function (f) { var d = Math.abs(m[f] - b[f]); if (d > worst) { worst = d; where = 'M' + m.t + ' ' + f; } });
    });
    r.cohorts.forEach(function (c, i) {
      var b = B[k].cohortsFinal[i];
      [c.finalARR, c.cumGrossProfit, c.acquisitionCost].forEach(function (v, j) {
        var d = Math.abs((v === null ? 0 : v) - (b[j + 1] === null ? 0 : b[j + 1]));
        if (d > worst) { worst = d; where = 'cohort ' + c.id; }
      });
    });
    var k36 = K.measureR12M(r, 36);
    ['grr', 'expansionRate', 'nrr'].forEach(function (f) { var d = Math.abs(k36[f] - B[k].k36[f]); if (d > worst) { worst = d; where = 'k36 ' + f; } });
    var s = E.summarise(r);
    Object.keys(B[k].summary).forEach(function (f) { if (typeof s[f] === 'number') { var d = Math.abs(s[f] - B[k].summary[f]); if (d > worst) { worst = d; where = 'summary ' + f; } } });
    ok('ALL-NULL', k + ': all three mechanisms at null reproduce the captured v1.0 trajectory (months, cohorts, R12M, summary)',
       worst < EPS, 'worst |Δ| = €' + ex(worst) + (worst ? ' at ' + where : ' (exact)'));
  });
  var r0 = E.run(A);
  ok('ALL-NULL', 'the default assumption object IS the all-null world (no caller has to opt out of anything)',
     r0.mechanisms.expansionCost === false && r0.mechanisms.acquisitionSaturation === false && r0.mechanisms.acquisitionLag === false, JSON.stringify(r0.mechanisms));
})();

/* ------------------------------------------------------------------ *
 * SAT+LAG — how much vs when
 * ------------------------------------------------------------------ */
(function satLag() {
  var cap = 2000000, L = 4;
  var sat = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var satLag = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap, acquisitionLagMonths: L }));
  var respNoLag = E.acquisitionResponse(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var respLag = E.acquisitionResponse(Object.assign({}, A, { maxMonthlyNewARR: cap, acquisitionLagMonths: L }));
  var same = ['newARR', 'averageCAC', 'marginalCAC', 'dNewARRdSM', 'utilisation'].every(function (k) { return respNoLag[k] === respLag[k]; });
  ok('SAT+LAG', 'changing the lag does not alter the acquisition response function (N, average CAC, marginal CAC, dN/dS&M, utilisation identical)',
     same, 'N ' + respLag.newARR.toFixed(2) + ' both; marginal CAC ' + respLag.marginalCAC.toFixed(4) + '× both');
  var afterLag = satLag.months.slice(L).every(function (m) { return Math.abs(m.newARR - respLag.newARR) < EPS; });
  var beforeLag = satLag.months.slice(0, L).every(function (m) { return m.newARR === 0; });
  ok('SAT+LAG', 'capacity governs how much ARR each month of spend creates; lag governs when it appears (€0 for L months, then the saturated N every month)',
     afterLag && beforeLag, 'first ' + L + ' months €0, then €' + (respLag.newARR / 1e6).toFixed(4) + 'm/mo = the bounded response');
  var shifted = 0;
  for (var t = L; t < sat.horizon; t++) shifted = Math.max(shifted, Math.abs(satLag.months[t].newARR - sat.months[t - L].newARR));
  ok('SAT+LAG', 'the realised New ARR series under lag is the no-lag series shifted by exactly L months',
     shifted < EPS, 'max |N_lag(t) − N(t−L)| = €' + ex(shifted));
  var sumSat = sat.months[sat.horizon - 1].cumulative.newARR, sumSatLag = satLag.months[satLag.horizon - 1].cumulative.newARR;
  ok('SAT+LAG', 'inside the horizon the lagged world realises exactly L months less of New ARR — the horizon effect, not a productivity change',
     Math.abs((sumSat - sumSatLag) - L * respLag.newARR) < EPS, 'Σ N no-lag €' + (sumSat / 1e6).toFixed(3) + 'm − Σ N lag €' + (sumSatLag / 1e6).toFixed(3) + 'm = ' + L + ' × €' + (respLag.newARR / 1e6).toFixed(4) + 'm');
})();

/* ------------------------------------------------------------------ *
 * COST+SAT — separate concepts stay separate
 * ------------------------------------------------------------------ */
(function costSat() {
  var cap = 1500000, c = 0.4;
  var satOnly = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var both = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap, expansionCostPerARR: c }));
  var costOnly = E.run(Object.assign({}, A, { expansionCostPerARR: c }));
  var base = E.run(A);
  var nSame = satOnly.derived.newARRPerMonth === both.derived.newARRPerMonth &&
              JSON.stringify(satOnly.derived.acquisition) === JSON.stringify(both.derived.acquisition);
  ok('COST+SAT', 'expansion realisation cost does not affect acquisition productivity (New ARR and the whole response object identical with and without the cost)',
     nSame, 'N €' + (both.derived.newARRPerMonth / 1e6).toFixed(4) + 'm/mo either way');
  var w = 0;
  for (var t = 0; t < base.horizon; t++) w = Math.max(w, Math.abs(satOnly.cohorts[0].rows[t].expansion - base.cohorts[0].rows[t].expansion),
                                                       Math.abs(costOnly.cohorts[0].rows[t].expansion - base.cohorts[0].rows[t].expansion));
  ok('COST+SAT', 'neither the bound nor the cost changes existing-cohort expansion (opening cohort expansion identical in all three worlds)',
     w === 0, 'max Δexpansion on the opening cohort €' + ex(w));
  var wc = 0;
  both.months.forEach(function (m) { wc = Math.max(wc, Math.abs(m.expansionCost - m.expansion * c)); });
  ok('COST+SAT', 'with both on, the cost line is still exactly expansion ARR × coefficient (the bound alters the expansion base only through smaller cohorts)',
     wc < EPS, 'max residual €' + ex(wc));
})();

/* ------------------------------------------------------------------ *
 * ALL-ON, RETENTION-ISO, DETERMINISM
 * ------------------------------------------------------------------ */
(function allOn() {
  var r = E.run(Object.assign({}, A, ALL));
  var wBridge = 0, wCash = 0, wPL = 0, wSum = 0, prev = r.start.openingCash;
  r.months.forEach(function (m, i) {
    wBridge = Math.max(wBridge, Math.abs(m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR));
    wCash = Math.max(wCash, Math.abs(m.cashOpening - prev), Math.abs(m.cashClosing - (m.cashOpening + m.fcf))); prev = m.cashClosing;
    wPL = Math.max(wPL, Math.abs(m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.ebita));
    var s = E.cohortSnapshot(r, i + 1).reduce(function (a2, c) { return a2 + c.currentARR; }, 0);
    wSum = Math.max(wSum, Math.abs(s - m.closingARR));
  });
  ok('ALL-ON', 'with all three mechanisms on: ARR bridge, cohort sum, cash roll-forward and the P&L identity all reconcile',
     wBridge < EPS && wCash < EPS && wPL < EPS && wSum < EPS,
     'bridge €' + ex(wBridge) + ' · cohort sum €' + ex(wSum) + ' · cash €' + ex(wCash) + ' · P&L €' + ex(wPL) + ' · mechanisms ' + JSON.stringify(r.mechanisms));
  ok('ALL-ON', 'the run reports all three mechanisms as switched on',
     r.mechanisms.expansionCost && r.mechanisms.acquisitionSaturation && r.mechanisms.acquisitionLag, '');

  var ten = E.run(Object.assign({}, A, ALL, { sm: A.sm * 10 }));
  var lag0 = E.run(Object.assign({}, A, ALL, { acquisitionLagMonths: 0 }));
  var capOff = E.run(Object.assign({}, A, ALL, { maxMonthlyNewARR: null }));
  var w = 0;
  for (var T = 12; T <= r.horizon; T++) {
    var k0 = K.measureR12M(r, T);
    [ten, lag0, capOff].forEach(function (v) {
      var k1 = K.measureR12M(v, T);
      w = Math.max(w, Math.abs(k0.grr - k1.grr), Math.abs(k0.expansionRate - k1.expansionRate), Math.abs(k0.nrr - k1.nrr));
    });
  }
  ok('RETENTION-ISO', 'under all three mechanisms, 10× S&M, removing the lag or removing the bound leave R12M GRR / expansion / NRR unchanged at every T',
     w < 1e-12, 'max KPI delta ' + ex(w));

  var r1 = E.run(Object.assign({}, A, ALL)), r2 = E.run(JSON.parse(JSON.stringify(Object.assign({}, A, ALL))));
  ok('DETERMINISM', 'repeat runs with all three on are byte-identical (months, cohorts, ledger)',
     JSON.stringify(r1.months) === JSON.stringify(r2.months) && JSON.stringify(r1.cohorts) === JSON.stringify(r2.cohorts) &&
     JSON.stringify(r1.acquisitionLedger) === JSON.stringify(r2.acquisitionLedger), '');
})();

/* ------------------------------------------------------------------ *
 * EXTREMES — legitimate controls at their edges
 * ------------------------------------------------------------------ */
(function extremes() {
  var probes = [
    ['zero S&M', { sm: 0 }], ['zero S&M, all on', Object.assign({ sm: 0 }, ALL)],
    ['very large S&M', { sm: 1e9 }], ['very large S&M, tight capacity', { sm: 1e9, maxMonthlyNewARR: 100000 }],
    ['zero expansion', { expansionCoefficientAnnual: 0 }], ['zero expansion, high cost', { expansionCoefficientAnnual: 0, expansionCostPerARR: 5 }],
    ['high expansion', { expansionCoefficientAnnual: 0.4 }], ['high expansion, high cost', { expansionCoefficientAnnual: 0.4, expansionCostPerARR: 5 }],
    ['zero cost', { expansionCostPerARR: 0 }], ['high cost', { expansionCostPerARR: 10 }],
    ['zero lag', { acquisitionLagMonths: 0 }], ['long lag (24)', { acquisitionLagMonths: 24 }], ['lag beyond horizon (72)', { acquisitionLagMonths: 72 }],
    ['saturation disabled', { maxMonthlyNewARR: null }], ['very tight capacity (€10k/mo)', { maxMonthlyNewARR: 10000 }],
    ['capacity 0 (no acquisition capacity)', { maxMonthlyNewARR: 0 }], ['capacity Infinity (disabled)', { maxMonthlyNewARR: Infinity }],
    ['all on, long lag, tight capacity, high cost', { expansionCostPerARR: 3, maxMonthlyNewARR: 50000, acquisitionLagMonths: 18 }]
  ];
  probes.forEach(function (p) {
    var r = E.run(Object.assign({}, A, p[1]));
    var bad = 0, wBridge = 0, wPL = 0, wSum = 0;
    r.months.forEach(function (m, i) {
      Object.keys(m).forEach(function (k) { if (typeof m[k] === 'number' && !isFinite(m[k])) bad++; });
      wBridge = Math.max(wBridge, Math.abs(m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR));
      wPL = Math.max(wPL, Math.abs(m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.ebita));
      var s = E.cohortSnapshot(r, i + 1).reduce(function (a2, c) { return a2 + c.currentARR; }, 0);
      wSum = Math.max(wSum, Math.abs(s - m.closingARR));
    });
    var resp = r.derived.acquisition;
    var respOK = isFinite(resp.newARR) && resp.newARR >= 0 && !isNaN(resp.averageCAC) && !isNaN(resp.marginalCAC);
    var tol = Math.max(EPS, 1e-9 * Math.abs(r.months[r.horizon - 1].closingARR));
    ok('EXTREMES', p[0] + ': no NaN/Infinity in any month field; bridge, cohort sum and P&L identity hold',
       bad === 0 && respOK && wBridge < tol && wPL < tol && wSum < tol,
       'non-finite fields ' + bad + ' · N €' + (resp.newARR / 1e6).toFixed(4) + 'm · bridge €' + ex(wBridge) + ' · sum €' + ex(wSum) + ' · P&L €' + ex(wPL) +
       ' · M60 ARR €' + (r.months[r.horizon - 1].closingARR / 1e6).toFixed(2) + 'm · cash €' + (r.months[r.horizon - 1].cashClosing / 1e6).toFixed(2) + 'm');
  });
  var beyond = E.run(Object.assign({}, A, { acquisitionLagMonths: 72 }));
  ok('EXTREMES', 'a lag beyond the horizon realises nothing inside it, expenses every month of S&M, and reports all 60 entries pending at the horizon',
     beyond.months.every(function (m) { return m.newARR === 0 && m.sm === A.sm; }) && beyond.pendingAtHorizon.entries.length === 60 &&
     Math.abs(beyond.pendingAtHorizon.spend - A.sm * 60) < EPS, 'pending spend €' + (beyond.pendingAtHorizon.spend / 1e6).toFixed(1) + 'm');
  var zeroCap = E.run(Object.assign({}, A, { maxMonthlyNewARR: 0 }));
  ok('EXTREMES', 'capacity 0 is NOT silently treated as "disabled": it means no acquisition capacity, New ARR = 0, S&M still spent',
     zeroCap.mechanisms.acquisitionSaturation && zeroCap.derived.newARRPerMonth === 0 && zeroCap.months[0].sm === A.sm, '');
})();

/* ------------------------------------------------------------------ *
 * SWEEP — diminishing returns, exposed as a curve
 * ------------------------------------------------------------------ */
(function sweep() {
  var cap = 2000000, rows = [];
  for (var sm = 0; sm <= 5e6; sm += 250000) {
    var r = E.run(Object.assign({}, A, { sm: sm, maxMonthlyNewARR: cap })), s = E.summarise(r), q = r.derived.acquisition;
    rows.push({ sm: sm, N: q.newARR, m60: s.finalARR, avg: q.averageCAC, marg: q.marginalCAC, trough: s.cashTrough, end: s.endingCash });
  }
  var monoN = true, monoM60 = true, margFaster = true, avgUp = true;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i].N < rows[i - 1].N) monoN = false;
    if (rows[i].m60 < rows[i - 1].m60) monoM60 = false;
    if (rows[i].avg < rows[i - 1].avg) avgUp = false;
    if ((rows[i].marg - rows[i - 1].marg) <= (rows[i].avg - rows[i - 1].avg)) margFaster = false;
  }
  ok('SWEEP', 'S&M sweep €0–5m/mo: New ARR and M60 ARR are monotone non-decreasing in S&M (the bound never makes spend destroy ARR)',
     monoN && monoM60, 'N €' + (rows[1].N / 1e6).toFixed(3) + 'm → €' + (rows[rows.length - 1].N / 1e6).toFixed(3) + 'm; M60 ARR €' + (rows[1].m60 / 1e6).toFixed(1) + 'm → €' + (rows[rows.length - 1].m60 / 1e6).toFixed(1) + 'm');
  ok('SWEEP', 'average CAC rises with spend, and marginal CAC rises FASTER than average at every step (marginal economics deteriorate first)',
     avgUp && margFaster, 'at €5m: average ' + rows[rows.length - 1].avg.toFixed(2) + '×, marginal ' + rows[rows.length - 1].marg.toFixed(2) + '×');
  var troughMin = rows.reduce(function (lo, r) { return r.trough < lo.trough ? r : lo; }, rows[0]);
  ok('SWEEP', 'the cash trough deepens as spend rises under the bound — a capital consequence the sweep exposes without declaring an optimum',
     troughMin.sm > 0 && troughMin.trough < rows[0].trough, 'deepest trough €' + (troughMin.trough / 1e6).toFixed(2) + 'm at S&M €' + (troughMin.sm / 1e6).toFixed(2) + 'm/mo');
})();

console.log('\nSaaS Physics v1.1–v1.3 — physics extension checks\n' + '='.repeat(96));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(96));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
