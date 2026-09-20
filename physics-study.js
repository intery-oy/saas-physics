/*
 * SaaS Physics v1.1–v1.3 — the three research experiments, printed with their
 * measured results. Every number below is engine output; the research notes in
 * docs/RN-*.md quote this script.
 *
 *   1. EXPANSION ECONOMICS   matched measured-NRR pair under a cost sweep
 *   2. ACQUISITION SATURATION  the S&M sweep, linear vs bounded
 *   3. ACQUISITION TIMING    lag 0 vs lag L, same law, same capacity
 *
 * Run: node physics-study.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
var A = E.DEFAULT_ASSUMPTIONS;

var m = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var m3 = function (v) { return '€' + (v / 1e6).toFixed(3) + 'm'; };
var sm = function (v) { return (v >= 0 ? '+' : '−') + '€' + Math.abs(v / 1e6).toFixed(2) + 'm'; };
var pc = function (v, d) { return (v * 100).toFixed(d === undefined ? 1 : d) + '%'; };
var L = function (w) { return '─'.repeat(w || 96); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }
function maxOver(r1, r2, f) { var w = 0; for (var q = 0; q < r1.months.length; q++) w = Math.max(w, Math.abs(f(r1.months[q]) - f(r2.months[q]))); return w; }

console.log('\nSaaS Physics — physics extension study   (model v' + E.run().modelVersion + ')');
console.log(L());

/* ================================================================== *
 * 1. EXPANSION ECONOMICS
 * ================================================================== */
console.log('1. EXPANSION ECONOMICS — matched measured-NRR pair, expansion realisation cost swept');
console.log(L());
var TN = 0.96 * 1.10;
var calR = K.calibrate(0.96, TN - 0.96), calX = K.calibrate(0.90, TN - 0.90);
var aR = { persistenceAnnual: calR.persistenceAnnual, expansionCoefficientAnnual: calR.expansionCoefficientAnnual };
var aX = { persistenceAnnual: calX.persistenceAnnual, expansionCoefficientAnnual: calX.expansionCoefficientAnnual };
console.log('  R · retention-heavy   measured GRR 96.0% / expansion ' + pc(TN - 0.96) + ' / NRR ' + pc(TN));
console.log('  X · expansion-heavy   measured GRR 90.0% / expansion ' + pc(TN - 0.90) + ' / NRR ' + pc(TN));
console.log('  Same opening state, S&M, CAC, gross margin, R&D, G&A. Only the cost per €1 of expansion ARR moves.\n');
console.log('  ' + pad('cost / €1 exp ARR', 20) + rpad('max |ΔARR| 60m', 16) + rpad('max |ΔNRR|', 12) + rpad('exp cost R', 12) + rpad('exp cost X', 12) +
            rpad('cash R (M60)', 14) + rpad('cash X (M60)', 14) + rpad('X − R', 10) + rpad('c × Δexp', 10));
console.log('  ' + L(120));
var cumExpR = null, cumExpX = null;
[0, 0.10, 0.25, 0.50, 1.00].forEach(function (c) {
  var R = E.run(Object.assign({}, A, aR, { expansionCostPerARR: c })), X = E.run(Object.assign({}, A, aX, { expansionCostPerARR: c }));
  var dARR = maxOver(R, X, function (mm) { return mm.closingARR; });
  var dNRR = 0; for (var T = 12; T <= 60; T++) dNRR = Math.max(dNRR, Math.abs(K.measureR12M(R, T).nrr - K.measureR12M(X, T).nrr));
  var lr = R.months[59], lx = X.months[59];
  cumExpR = lr.cumulative.expansion; cumExpX = lx.cumulative.expansion;
  console.log('  ' + pad(c.toFixed(2) + '×', 20) + rpad('€' + dARR.toExponential(1), 16) + rpad(dNRR.toExponential(1), 12) +
              rpad(m(lr.cumulative.expansionCost), 12) + rpad(m(lx.cumulative.expansionCost), 12) +
              rpad(m(lr.cashClosing), 14) + rpad(m(lx.cashClosing), 14) + rpad(sm(lx.cashClosing - lr.cashClosing), 10) + rpad(sm(-c * (cumExpX - cumExpR)), 10));
});
console.log('\n  Cumulative expansion ARR over 60 months: R ' + m(cumExpR) + ' · X ' + m(cumExpX) + ' · X − R = ' + m(cumExpX - cumExpR));
console.log('  The cash gap is c × (' + m(cumExpX - cumExpR) + '), linear in c, with no threshold: any c > 0 separates the pair.');
var Rk = E.run(Object.assign({}, A, aR, { expansionCostPerARR: 0.25 })), kx = K.expansionCostMeasures(Rk, 36);
console.log('  Measured back from flows at T=36 (R, c=0.25): Σcost ÷ Σexpansion = ' + kx.measuredCostPerARR.toFixed(6) + '× · cost = ' + pc(kx.shareOfGrossProfitR12M, 2) + ' of R12M gross profit');

/* ================================================================== *
 * 2. ACQUISITION SATURATION
 * ================================================================== */
console.log('\n' + L());
console.log('2. ACQUISITION SATURATION — S&M sweep, all other assumptions at Base');
console.log(L());
var CAP = 2000000;
console.log('  Bounded law: N = S&M ÷ (cacPerARR + S&M ÷ capacity), cacPerARR ' + A.cacPerARR.toFixed(2) + '×, capacity ' + m(CAP) + '/mo of New ARR.');
console.log('  Linear law (v1.0): N = S&M ÷ cacPerARR. Both columns are the same engine; only maxMonthlyNewARR differs.\n');
console.log('  ' + pad('S&M / mo', 11) + rpad('N linear', 11) + rpad('N bounded', 11) + rpad('util', 7) + rpad('avg CAC', 9) + rpad('marg CAC', 10) +
            rpad('avg payback', 13) + rpad('marg payback', 14) + rpad('M60 ARR lin', 13) + rpad('M60 ARR bnd', 13) + rpad('trough bnd', 12) + rpad('end cash bnd', 14));
console.log('  ' + L(138));
[0, 300000, 600000, 900000, 1200000, 1800000, 2400000, 3600000, 4800000, 7200000].forEach(function (s) {
  var lin = E.run(Object.assign({}, A, { sm: s })), bnd = E.run(Object.assign({}, A, { sm: s, maxMonthlyNewARR: CAP }));
  var q = bnd.derived.acquisition, sl = E.summarise(lin), sb = E.summarise(bnd);
  console.log('  ' + pad(m3(s), 11) + rpad(m3(lin.derived.newARRPerMonth), 11) + rpad(m3(q.newARR), 11) + rpad(pc(q.utilisation, 0), 7) +
              rpad(q.averageCAC.toFixed(2) + '×', 9) + rpad(q.marginalCAC.toFixed(2) + '×', 10) +
              rpad(q.averagePaybackMonths.toFixed(1) + ' mo', 13) + rpad(q.marginalPaybackMonths.toFixed(1) + ' mo', 14) +
              rpad(m(sl.finalARR), 13) + rpad(m(sb.finalARR), 13) + rpad(m(sb.cashTrough), 12) + rpad(m(sb.endingCash), 14));
});
console.log('\n  Under the bound, each extra euro of S&M creates less ARR than the last: marginal CAC rises as the square of the');
console.log('  average-CAC denominator. The engine shows the curve. It declares no optimum: that needs an objective it does not have.');

/* ================================================================== *
 * 3. ACQUISITION TIMING
 * ================================================================== */
console.log('\n' + L());
console.log('3. ACQUISITION TIMING — same law, same capacity, lag 0 vs lag L');
console.log(L());
var LAGS = [0, 3, 6, 12];
console.log('  All worlds: S&M ' + m(A.sm) + '/mo, cacPerARR ' + A.cacPerARR + '×, capacity off, persistence ' + pc(A.persistenceAnnual) + ', expansion ' + pc(A.expansionCoefficientAnnual) + ', GM ' + pc(A.grossMargin) + '.\n');
console.log('  ' + pad('lag', 6) + rpad('N per month', 13) + rpad('first cohort', 14) + rpad('M12 ARR', 11) + rpad('M36 ARR', 11) + rpad('M60 ARR', 11) +
            rpad('cash trough', 13) + rpad('trough M', 10) + rpad('end cash', 11) + rpad('pending @M60', 14) + rpad('unrealised spend', 18) + rpad('R12M NRR M36', 14));
console.log('  ' + L(146));
var base0 = null;
LAGS.forEach(function (lag) {
  var r = E.run(Object.assign({}, A, { acquisitionLagMonths: lag })), s = E.summarise(r);
  if (lag === 0) base0 = r;
  console.log('  ' + pad(lag + ' mo', 6) + rpad(m3(r.derived.newARRPerMonth), 13) + rpad('M' + s.firstCohortMonth, 14) +
              rpad(m(r.months[11].closingARR), 11) + rpad(m(r.months[35].closingARR), 11) + rpad(m(s.finalARR), 11) +
              rpad(m(s.cashTrough), 13) + rpad('M' + s.cashTroughMonth, 10) + rpad(m(s.endingCash), 11) +
              rpad(m(s.pendingNewARRAtHorizon), 14) + rpad(m(s.pendingSpendAtHorizon), 18) + rpad(pc(K.measureR12M(r, 36).nrr, 4), 14));
});
var lag6 = E.run(Object.assign({}, A, { acquisitionLagMonths: 6 }));
var shift = 0; for (var t = 6; t < 60; t++) shift = Math.max(shift, Math.abs(lag6.months[t].newARR - base0.months[t - 6].newARR));
var cohortTwin = 0; for (var k = 1; k + 6 < base0.cohorts.length; k++) for (var q2 = 0; q2 < lag6.cohorts[k + 6].rows.length; q2++) cohortTwin = Math.max(cohortTwin, Math.abs(lag6.cohorts[k + 6].rows[q2].closingARR - base0.cohorts[k].rows[q2].closingARR));
console.log('\n  Lag 6: realised New ARR series = the lag-0 series shifted by 6 months exactly (max |Δ| €' + shift.toExponential(1) + ').');
console.log('  Lag 6: every cohort ages exactly as its lag-0 twin (max |Δ| €' + cohortTwin.toExponential(1) + ') — retention mechanics untouched.');
var cashGap = 0, cashGapM = 0; for (t = 0; t < 60; t++) { var g = base0.months[t].cashClosing - lag6.months[t].cashClosing; if (g > cashGap) { cashGap = g; cashGapM = t + 1; } }
console.log('  Lag 6: cash sits below the lag-0 path all the way — widest gap ' + m(cashGap) + ' at M' + cashGapM + '. Spend leaves on time; ARR and its gross profit arrive 6 months late.');
console.log('  Horizon boundary: the last L months of spend are expensed inside the window and their ARR matures outside it —');
console.log('  the model reports them as pending at M60, it does not pull them forward. M60 ARR therefore differs by construction, not by productivity.');
var k36l = K.acquisitionMeasures(lag6, 36), k12l = K.acquisitionMeasures(lag6, 9);
console.log('  Measured CAC (spend ÷ realised New ARR): at T=9 ' + (k12l.measuredCACR12M === null ? 'undefined (nothing realised yet)' : k12l.measuredCACR12M.toFixed(3) + '×') +
            ' · trailing-12 at T=36 ' + k36l.measuredCACR12M.toFixed(3) + '× · cumulative at T=36 ' + k36l.measuredCACCumulative.toFixed(3) + '× (the pending stock inflates it) · law ' + A.cacPerARR.toFixed(3) + '×');
console.log('');
