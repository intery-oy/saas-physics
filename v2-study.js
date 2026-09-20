/*
 * SaaS Physics v2 — the economic-system experiments, printed with their
 * measured results. Every number is engine output; the research notes in
 * docs/RN-*-PHYSICS.md quote this script.
 *
 *   A. CUSTOMER PHYSICS   the matched-world pair: same ARR and NRR, different customers
 *
 * Run: node v2-study.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
var A = E.DEFAULT_ASSUMPTIONS;

var m = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var pc = function (v, d) { return (v * 100).toFixed(d === undefined ? 1 : d) + '%'; };
var L = function (w) { return '─'.repeat(w || 96); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }
function maxOver(r1, r2, f) { var w = 0; for (var q = 0; q < r1.months.length; q++) w = Math.max(w, Math.abs(f(r1.months[q]) - f(r2.months[q]))); return w; }

console.log('\nSaaS Physics — economic system study   (model v' + E.run().modelVersion + ')');
console.log(L());

/* ================================================================== *
 * A. CUSTOMER PHYSICS — the matched-world experiment
 * ================================================================== */
console.log('A. CUSTOMER PHYSICS — three worlds with the same dollar persistence 87.4%');
console.log(L());
var worlds = [
  ['V · v1.3, persistence set',           { persistenceAnnual: 0.874 }],
  ['B · every lost euro is a lost logo',  { logoRetentionAnnual: 0.874, contractionAnnual: 0 }],
  ['X · fewer logos lost, survivors shrink', { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }],
  ['Y · almost no logos lost, heavy contraction', { logoRetentionAnnual: 0.98, contractionAnnual: 0.874 / 0.98 > 1 ? 0 : 1 - 0.874 / 0.98 }]
];
var runs = worlds.map(function (w) { return { name: w[0], a: w[1], r: E.run(Object.assign({}, A, w[1])) }; });
var ref = runs[0].r;
console.log('  Same opening state (€20m ARR, 1,000 customers → ARPA €20,000), S&M, CAC, expansion 10%, gross margin, R&D, G&A.\n');
console.log('  ' + pad('world', 46) + rpad('P in force', 12) + rpad('max |ΔARR|', 12) + rpad('max |Δcash|', 12) + rpad('M60 ARR', 12) + rpad('M60 cash', 12));
console.log('  ' + L(106));
runs.forEach(function (w) {
  var last = w.r.months[59];
  console.log('  ' + pad(w.name, 46) + rpad(pc(w.r.derived.persistenceAnnualEffective, 2), 12) + rpad('€' + maxOver(ref, w.r, function (mm) { return mm.closingARR; }).toExponential(1), 12) +
              rpad('€' + maxOver(ref, w.r, function (mm) { return mm.cashClosing; }).toExponential(1), 12) + rpad(m(last.closingARR), 12) + rpad(m(last.cashClosing), 12));
});
console.log('\n  What the ARR-only measurement reports at T = 36 and T = 60 (identical across the four):');
[36, 60].forEach(function (T) {
  var k = K.measureR12M(ref, T);
  console.log('    T=' + T + '  R12M GRR ' + pc(k.grr, 2) + ' · expansion ' + pc(k.expansionRate, 2) + ' · NRR ' + pc(k.nrr, 2) + ' · ARR growth ' + pc(k.arrGrowth, 1));
});
console.log('\n  What the customer layer adds (worlds B, X, Y; V has no customers):');
console.log('  ' + pad('world', 46) + rpad('logo ret. R12M', 15) + rpad('GRR R12M', 10) + rpad('lost-logo €', 12) + rpad('contraction €', 14) + rpad('customers M60', 15) + rpad('ARPA M60', 10));
console.log('  ' + L(122));
runs.slice(1).forEach(function (w) {
  var c = K.customerMeasures(w.r, 60);
  console.log('  ' + pad(w.name, 46) + rpad(pc(c.logoRetentionR12M, 1), 15) + rpad(pc(c.grrR12M, 2), 10) + rpad(pc(c.dollarChurnFromLogosR12M, 2), 12) + rpad(pc(c.dollarChurnFromContractionR12M, 2), 14) +
              rpad(c.companyCustomersClosing.toFixed(0), 15) + rpad('€' + c.arpaClosing.toFixed(0), 10));
});
var cB = K.customerMeasures(runs[1].r, 60), cY = K.customerMeasures(runs[3].r, 60);
console.log('\n  Between B and Y the company ends with ' + (cY.companyCustomersClosing / cB.companyCustomersClosing).toFixed(2) + '× the customers at ' +
            (cY.arpaClosing / cB.arpaClosing * 100).toFixed(0) + '% of the ARPA — on identical ARR, revenue, cash, GRR and NRR at every month.');
console.log('  Cumulative M1–M60 leakage in B: ' + m(runs[1].r.months[59].customers.cumulative.logoChurnARR) + ' lost logos + ' + m(runs[1].r.months[59].customers.cumulative.contractionARR) + ' contraction;' +
            ' in Y: ' + m(runs[3].r.months[59].customers.cumulative.logoChurnARR) + ' + ' + m(runs[3].r.months[59].customers.cumulative.contractionARR) + '. Total leakage identical: ' +
            m(runs[1].r.months[59].cumulative.leakage) + ' vs ' + m(runs[3].r.months[59].cumulative.leakage) + '.');

/* --- the decomposition GRR cannot make on its own --- */
console.log('\n  R12M GRR decomposition in world X at T = 36 (frozen eligible cohort, opening ' + m(K.customerMeasures(runs[2].r, 36).openingARR) + '):');
var cx = K.customerMeasures(runs[2].r, 36), kx = K.measureR12M(runs[2].r, 36);
console.log('    100% − ' + pc(cx.dollarChurnFromLogosR12M, 2) + ' (departing customers) − ' + pc(cx.dollarChurnFromContractionR12M, 2) + ' (surviving customers shrinking) = GRR ' + pc(cx.grrR12M, 2) +
            '  (kpi.measureR12M: ' + pc(kx.grr, 2) + ', identity residual ' + cx.identityResidual.toExponential(1) + ')');
console.log('    logo retention R12M ' + pc(cx.logoRetentionR12M, 3) + ' reads back L = 92% exactly; GRR does not, because it is measured in euros on a base expansion moved.');

/* --- ARR per new logo: customers, never ARR --- */
console.log('\n  ARR per new logo (world X): €20,000 (opening ARPA) vs €10,000 vs €40,000');
[null, 10000, 40000].forEach(function (k) {
  var r = E.run(Object.assign({}, A, runs[2].a, { newLogoARPA: k })), c = K.customerMeasures(r, 60);
  console.log('    ' + pad(k === null ? 'opening ARPA €20,000' : '€' + k, 22) + ' M60 ARR ' + m(r.months[59].closingARR) + ' (Δ vs X €' + maxOver(runs[2].r, r, function (mm) { return mm.closingARR; }).toExponential(1) + ')' +
              ' · customers ' + c.companyCustomersClosing.toFixed(0) + ' · ARPA €' + c.arpaClosing.toFixed(0) + ' · logo retention ' + pc(c.logoRetentionR12M, 1));
});
console.log('\n' + L());
