/*
 * SaaS Physics — Prototype 0.2 scenarios.
 * Run: node scenarios.js
 */
'use strict';
var E = require('./engine.js');
var D = E.DEFAULT_ASSUMPTIONS;
var BASE = E.run(D);
var bs = E.summarise(BASE);

var m   = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var sm  = function (v) { return (v >= 0 ? '+' : '−') + '€' + Math.abs(v / 1e6).toFixed(2) + 'm'; };
var pc  = function (v, d) { return (v * 100).toFixed(d === undefined ? 1 : d) + '%'; };
var spc = function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + 'pp'; };
var rel = function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%'; };
var mo  = function (v) { return v.toFixed(2) + ' mo'; };
var L   = function (w) { return '─'.repeat(w || 80); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

console.log('\nSaaS Physics — Prototype 0.2   (model v' + BASE.modelVersion + ')');
console.log(L());
console.log('BASE  S&M ' + m(D.sm) + '/mo · CAC/New ARR ' + D.cacPerARR.toFixed(2) + '× · GRR ' + pc(D.grrAnnual) +
            ' · expansion ' + pc(D.expansionAnnual) + ' · GM ' + pc(D.grossMargin) +
            ' · R&D ' + m(D.rd) + '/mo · G&A ' + m(D.ga) + '/mo');
console.log('      Opening ARR ' + m(E.DEFAULT_START.openingARR) + ', opening cash ' + m(E.DEFAULT_START.openingCash));
console.log('DERIVED  New ARR ' + m(BASE.derived.newARRPerMonth) + '/mo (' + m(BASE.derived.newARRAnnualised) +
            ' per year of spend) · CAC payback ' + mo(BASE.derived.cacPaybackMonths) + ' (EMERGENT)');
console.log('OUTCOME  M60 ARR ' + m(bs.finalARR) + ' · NRR ' + pc(bs.finalNRR) + ' · Y5 FCF ' + m(bs.finalYearFCF) +
            ' · ending cash ' + m(bs.endingCash) + ' · trough ' + m(bs.cashTrough) + ' (M' + bs.cashTroughMonth + ')');

/* ================================================================== *
 * §8  Rate-conversion methodology check
 * ================================================================== */
console.log('\n' + L());
console.log('RATE CONVERSION — how annual GRR and expansion become monthly rates');
console.log(L());
var rd = E.rateDiagnostics(BASE);
console.log('  monthly GRR                       ' + pc(rd.monthlyGRR, 6) + '   = GRR^(1/12)');
console.log('  monthly expansion                 ' + pc(rd.monthlyExpansion, 6) + '   = (1+expansion)^(1/12) − 1');
console.log('  monthly NRR                       ' + pc(rd.monthlyNRR, 6) + '   = mGRR × (1 + mExpansion)');
console.log('  12-month compounded GRR           ' + pc(rd.twelveMonthGRRCompounded, 6) + '   (input ' + pc(rd.inputGRRAnnual, 4) + ')');
console.log('  12-month compounded expansion     ' + pc(rd.twelveMonthExpansionCompounded, 6) + '   (input ' + pc(rd.inputExpansionAnnual, 4) + ')');
console.log('  12-month compounded NRR           ' + pc(rd.twelveMonthNRRCompounded, 6) + '   = GRR × (1 + expansion). EXACT.');
console.log('');
console.log('  Measured from the opening cohort\'s first 12 months of actual flows:');
console.log('  realised gross retention          ' + pc(rd.realisedGrossRetention, 4) + '   (1 − Σleakage/opening ARR)');
console.log('  realised expansion                ' + pc(rd.realisedExpansionRate, 4) + '   (Σexpansion/opening ARR)');
console.log('  realised NRR                      ' + pc(rd.realisedNRR, 6) + '   closing/opening. EXACT.');
console.log('');
console.log('  ⚠ SUBTLETY. Annual NRR is reproduced exactly, but the DECOMPOSITION is not:');
console.log('    gross retention reads ' + spc(rd.realisedGrossRetention - rd.inputGRRAnnual) +
            ' vs input, expansion ' + spc(rd.realisedExpansionRate - rd.inputExpansionAnnual) + ' vs input.');
console.log('    Both flows accrue on a base that moves during the year, and expansion accrues on');
console.log('    the POST-churn base. The two errors offset exactly, so NRR is right and the two');
console.log('    components a finance team would report are each slightly understated.');

/* ================================================================== *
 * Scenarios A–E
 * ================================================================== */
var TARGET_NRR = 0.96 * 1.10;
var SCENARIOS = [
  { id: 'A', title: 'Retention',              ch: { grrAnnual: 0.96 },        note: 'Annual GRR 90% → 96%' },
  { id: 'B', title: 'Expansion',              ch: { expansionAnnual: 0.20 },  note: 'Annual expansion 10% → 20%' },
  { id: 'C', title: 'Acquisition efficiency', ch: { cacPerARR: 0.80 },        note: 'CAC/New ARR 1.20× → 0.80×, S&M unchanged  (replaces v0.1 "payback 18→12")' },
  { id: 'D', title: 'Growth investment',      ch: { sm: D.sm * 1.5 },         note: 'S&M +50% (€0.90m → €1.35m/mo), CAC/New ARR unchanged' },
  { id: 'E', title: 'Margin deterioration',   ch: { grossMargin: 0.65 },      note: 'Gross margin 80% → 65%' }
];

SCENARIOS.forEach(function (s) {
  var exp = E.run(Object.assign({}, D, s.ch)), c = E.compare(BASE, exp), d = c.delta, x = c.experiment;
  console.log('\n' + L());
  console.log('SCENARIO ' + s.id + ' — ' + s.title + ':  ' + s.note);
  console.log(L());
  console.log('  New ARR / month        ' + m(BASE.derived.newARRPerMonth) + ' → ' + m(exp.derived.newARRPerMonth) +
              '   (' + sm(exp.derived.newARRPerMonth - BASE.derived.newARRPerMonth) + ')');
  console.log('  CAC payback (EMERGENT) ' + mo(BASE.derived.cacPaybackMonths) + ' → ' + mo(exp.derived.cacPaybackMonths));
  console.log('  NRR (EMERGENT)         ' + pc(bs.finalNRR) + ' → ' + pc(x.finalNRR) + '   (' + spc(d.finalNRR) + ')');
  console.log('  Y5 closing ARR         ' + m(bs.finalARR) + ' → ' + m(x.finalARR) + '   (' + sm(d.finalARR) + ', ' + rel(x.finalARR / bs.finalARR - 1) + ')');
  console.log('  Cumulative leakage     ' + m(bs.cumLeakage) + ' → ' + m(x.cumLeakage) + '   (' + sm(d.cumLeakage) + ')');
  console.log('  Cumulative expansion   ' + m(bs.cumExpansion) + ' → ' + m(x.cumExpansion) + '   (' + sm(d.cumExpansion) + ')');
  console.log('  Cumulative gross profit ' + m(bs.cumGrossProfit) + ' → ' + m(x.cumGrossProfit) + '   (' + sm(d.cumGrossProfit) + ')');
  console.log('  Cumulative S&M         ' + m(bs.cumSM) + ' → ' + m(x.cumSM) + '   (' + sm(d.cumSM) + ')');
  console.log('  Y5 FCF                 ' + m(bs.finalYearFCF) + ' → ' + m(x.finalYearFCF) + '   (' + sm(d.finalYearFCF) + ')');
  console.log('  Ending cash (M60)      ' + m(bs.endingCash) + ' → ' + m(x.endingCash) + '   (' + sm(d.endingCash) + ')');
  console.log('  Cash trough            ' + m(bs.cashTrough) + ' (M' + bs.cashTroughMonth + ') → ' + m(x.cashTrough) + ' (M' + x.cashTroughMonth + ')');
  console.log('  M60 ARR mix            opening base ' + pc(bs.baseCohortShare) + ' → ' + pc(x.baseCohortShare));
  if (s.id === 'E') {
    console.log('  ── REQUIRED BEHAVIOUR TEST (brief §5) ──');
    console.log('     New ARR unchanged .......... ' + (Math.abs(exp.derived.newARRPerMonth - BASE.derived.newARRPerMonth) < 1e-9 ? 'PASS' : 'FAIL'));
    console.log('     CAC payback deteriorates ... ' + (exp.derived.cacPaybackMonths > BASE.derived.cacPaybackMonths ? 'PASS' : 'FAIL') +
                '   ' + mo(BASE.derived.cacPaybackMonths) + ' → ' + mo(exp.derived.cacPaybackMonths));
    console.log('     Gross profit falls ......... ' + (x.cumGrossProfit < bs.cumGrossProfit ? 'PASS' : 'FAIL'));
    console.log('     EBITA / FCF falls .......... ' + (x.finalYearFCF < bs.finalYearFCF ? 'PASS' : 'FAIL'));
    console.log('     Ending cash falls .......... ' + (x.endingCash < bs.endingCash ? 'PASS' : 'FAIL'));
  }
});

/* ================================================================== *
 * §7–§11  Matched-NRR experiment
 * ================================================================== */
var xExp = TARGET_NRR / 0.90 - 1;
var R = E.run(Object.assign({}, D, { grrAnnual: 0.96, expansionAnnual: 0.10 }));
var X = E.run(Object.assign({}, D, { grrAnnual: 0.90, expansionAnnual: xExp }));
var rs = E.summarise(R), xs = E.summarise(X);

console.log('\n' + L());
console.log('MATCHED-NRR EXPERIMENT — retention-heavy (R) vs expansion-heavy (X)');
console.log(L());
console.log('  R  GRR 96.000000%  ×  expansion 110.000000%   → NRR ' + pc(0.96 * 1.10, 6));
console.log('  X  GRR 90.000000%  ×  expansion ' + ((1 + xExp) * 100).toFixed(6) + '%   → NRR ' + pc(0.90 * (1 + xExp), 6));
console.log('  X expansion solved as ' + (TARGET_NRR / 0.90 - 1).toFixed(15) + ' (full double precision, not rounded)');
console.log('  Everything else identical: opening ARR, cash, S&M, CAC/New ARR, GM, R&D, G&A, horizon.\n');

var ROWS = [
  ['Year 1 ARR',                     m(rs.y1ARR),            m(xs.y1ARR)],
  ['Year 3 ARR',                     m(rs.y3ARR),            m(xs.y3ARR)],
  ['Year 5 ARR',                     m(rs.finalARR),         m(xs.finalARR)],
  ['Cumulative expansion',           m(rs.cumExpansion),     m(xs.cumExpansion)],
  ['Cumulative leakage',             m(rs.cumLeakage),       m(xs.cumLeakage)],
  ['Cumulative gross profit',        m(rs.cumGrossProfit),   m(xs.cumGrossProfit)],
  ['Year 5 EBITA / FCF',             m(rs.finalYearFCF),     m(xs.finalYearFCF)],
  ['Ending cash (M60)',              m(rs.endingCash),       m(xs.endingCash)],
  ['M60 ARR from opening cohort',    m(rs.openingCohortARR), m(xs.openingCohortARR)],
  ['M60 ARR from acquired cohorts',  m(rs.acquiredCohortARR),m(xs.acquiredCohortARR)],
  ['NRR (calculated)',               pc(rs.finalNRR, 4),     pc(xs.finalNRR, 4)]
];
console.log('  ' + pad('', 32) + rpad('R · retention-heavy', 20) + rpad('X · expansion-heavy', 22) + rpad('difference', 16));
console.log('  ' + L(88));
ROWS.forEach(function (r) {
  var same = r[1] === r[2];
  console.log('  ' + pad(r[0], 32) + rpad(r[1], 20) + rpad(r[2], 22) + rpad(same ? '—' : 'differs', 16));
});

var wARR = 0, wCash = 0, wGP = 0;
for (var i = 0; i < R.months.length; i++) {
  wARR  = Math.max(wARR,  Math.abs(R.months[i].closingARR  - X.months[i].closingARR));
  wCash = Math.max(wCash, Math.abs(R.months[i].cashClosing - X.months[i].cashClosing));
  wGP   = Math.max(wGP,   Math.abs(R.months[i].grossProfit - X.months[i].grossProfit));
}
console.log('\n  Month-by-month divergence over all 60 months:');
console.log('    closing ARR   max |R − X| = €' + wARR.toExponential(3));
console.log('    gross profit  max |R − X| = €' + wGP.toExponential(3));
console.log('    cash          max |R − X| = €' + wCash.toExponential(3));
console.log('    cumulative leakage differs by ' + sm(xs.cumLeakage - rs.cumLeakage) +
            ', cumulative expansion by ' + sm(xs.cumExpansion - rs.cumExpansion));
console.log('\n  → Every aggregate the engine computes is identical to floating-point noise.');
console.log('    The ONLY difference is the gross decomposition of the flows: X churns');
console.log('    ' + m(xs.cumLeakage - rs.cumLeakage) + ' more and expands ' + m(xs.cumExpansion - rs.cumExpansion) + ' more, netting to zero.');

/* ================================================================== *
 * §18  Efficiency vs spend, calibrated to identical New ARR
 * ================================================================== */
var TARGET_NEW = 1125000;                       // €1.125m/mo of New ARR
var EFF   = E.run(Object.assign({}, D, { cacPerARR: D.sm / TARGET_NEW }));
var SPEND = E.run(Object.assign({}, D, { sm: TARGET_NEW * D.cacPerARR }));
var es = E.summarise(EFF), ss = E.summarise(SPEND);

console.log('\n' + L());
console.log('EFFICIENCY vs SPEND — calibrated to identical New ARR');
console.log(L());
console.log('  EFFICIENCY  CAC/New ARR ' + D.cacPerARR.toFixed(2) + '× → ' + (D.sm / TARGET_NEW).toFixed(2) + '×, S&M held at ' + m(D.sm) + '/mo');
console.log('  SPEND       S&M ' + m(D.sm) + ' → ' + m(TARGET_NEW * D.cacPerARR) + '/mo, CAC/New ARR held at ' + D.cacPerARR.toFixed(2) + '×');
console.log('  Both produce New ARR ' + m(EFF.derived.newARRPerMonth) + '/mo (' + m(SPEND.derived.newARRPerMonth) + '/mo)\n');

var EROWS = [
  ['Y5 ARR',                 m(es.finalARR),          m(ss.finalARR)],
  ['CAC payback (emergent)', mo(EFF.derived.cacPaybackMonths), mo(SPEND.derived.cacPaybackMonths)],
  ['Cumulative S&M',         m(es.cumSM),             m(ss.cumSM)],
  ['Cumulative gross profit',m(es.cumGrossProfit),    m(ss.cumGrossProfit)],
  ['Y5 EBITA / FCF',         m(es.finalYearFCF),      m(ss.finalYearFCF)],
  ['Cash trough',            m(es.cashTrough) + ' (M' + es.cashTroughMonth + ')', m(ss.cashTrough) + ' (M' + ss.cashTroughMonth + ')'],
  ['Ending cash (M60)',      m(es.endingCash),        m(ss.endingCash)],
  ['First profitable month', 'M' + es.firstProfitableMonth, 'M' + ss.firstProfitableMonth]
];
console.log('  ' + pad('', 26) + rpad('EFFICIENCY', 20) + rpad('SPEND', 20));
console.log('  ' + L(66));
EROWS.forEach(function (r) { console.log('  ' + pad(r[0], 26) + rpad(r[1], 20) + rpad(r[2], 20)); });

var wA = 0;
for (i = 0; i < EFF.months.length; i++) wA = Math.max(wA, Math.abs(EFF.months[i].closingARR - SPEND.months[i].closingARR));
console.log('\n  ARR paths agree to €' + wA.toExponential(3) + ' across all 60 months.');
console.log('  Same ARR state, ' + sm(ss.cumSM - es.cumSM) + ' of extra capital consumed, ' +
            sm(ss.endingCash - es.endingCash) + ' of ending cash.');
console.log('');
