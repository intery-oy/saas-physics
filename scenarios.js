/*
 * SaaS Physics — Prototype 0.2 scenarios.
 * Run: node scenarios.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
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

console.log('\nSaaS Physics — Prototype 0.2.1   (model v' + BASE.modelVersion + ')');
console.log(L());
console.log('BASE  S&M ' + m(D.sm) + '/mo · CAC/New ARR ' + D.cacPerARR.toFixed(2) + '× · persistence ' + pc(D.persistenceAnnual) +
            ' · expansion coefficient ' + pc(D.expansionCoefficientAnnual) + ' · GM ' + pc(D.grossMargin) +
            ' · R&D ' + m(D.rd) + '/mo · G&A ' + m(D.ga) + '/mo');
console.log('      Opening ARR ' + m(E.DEFAULT_START.openingARR) + ', opening cash ' + m(E.DEFAULT_START.openingCash));
console.log('DERIVED  New ARR ' + m(BASE.derived.newARRPerMonth) + '/mo (' + m(BASE.derived.newARRAnnualised) +
            ' per year of spend) · CAC payback ' + mo(BASE.derived.cacPaybackMonths) + ' (EMERGENT)');
console.log('OUTCOME  M60 ARR ' + m(bs.finalARR) + ' · NRR ' + pc(bs.finalNRR) + ' · Y5 FCF ' + m(bs.finalYearFCF) +
            ' · ending cash ' + m(bs.endingCash) + ' · trough ' + m(bs.cashTrough) + ' (M' + bs.cashTroughMonth + ')');

/* ================================================================== *
 * LAYER SEPARATION — transition coefficients vs measured KPIs
 * ================================================================== */
console.log('\n' + L());
console.log('TWO LAYERS — the world, and the report on the world');
console.log(L());
var rdg = E.rateDiagnostics(BASE);
var dec = K.decompose(D.persistenceAnnual, D.expansionCoefficientAnnual);
var m12 = K.measureR12M(BASE, 12);
console.log('  LAYER A — economic transition coefficients (they govern the world)');
console.log('    annual persistence coefficient   ' + pc(D.persistenceAnnual, 4) + '     monthly g = P^(1/12) = ' + pc(rdg.monthlyPersistence, 6));
console.log('    annual expansion coefficient     ' + pc(D.expansionCoefficientAnnual, 4) + '     monthly e = (1+X)^(1/12)−1 = ' + pc(rdg.monthlyExpansion, 6));
console.log('    monthly multiplier m = g(1+e)    ' + rdg.monthlyNRR.toFixed(9));
console.log('');
console.log('  LAYER B — measured R12M KPIs (they observe the world), frozen cohort at T=12');
console.log('    R12M GRR         ' + pc(m12.grr, 4) + '   vs persistence coefficient ' + pc(D.persistenceAnnual, 2) + '   (' + spc(m12.grr - D.persistenceAnnual) + ')');
console.log('    R12M expansion   ' + pc(m12.expansionRate, 4) + '   vs expansion coefficient  ' + pc(D.expansionCoefficientAnnual, 2) + '   (' + spc(m12.expansionRate - D.expansionCoefficientAnnual) + ')');
console.log('    R12M NRR         ' + pc(m12.nrr, 6) + '   = P × (1+X) EXACTLY');
console.log('    bridge residual  €' + m12.bridgeResidual.toExponential(2) + '   ·  GRR + expansion − NRR = ' + m12.identityResidual.toExponential(2));
console.log('    New ARR inside the window, excluded from the cohort: ' + m(m12.newARRExcluded));

console.log('\n  WHY THE GAP EXISTS — it is one effect, not several');
console.log('  ' + L(76));
console.log('    Switch either process off and the other measures its coefficient EXACTLY:');
var offX = K.decompose(D.persistenceAnnual, 0), offP = K.decompose(1.0, D.expansionCoefficientAnnual);
console.log('      expansion coefficient 0%  ->  measured GRR       ' + pc(offX.measuredGRR, 6) + '  (= persistence exactly)');
console.log('      persistence 100%          ->  measured expansion ' + pc(offP.measuredExpansion, 6) + '  (= coefficient exactly)');
console.log('    The compounding-convention and moving-base terms are real but CANCEL exactly,');
console.log('    which is what makes those two cases exact. The entire residual is the');
console.log('    WITHIN-PERIOD INTERACTION of the two processes:');
console.log('      churn:      1 − P = ' + (dec.churn.isolated).toFixed(6) + '   + expansion exposure ' + (dec.churn.expansionExposure >= 0 ? '+' : '') + dec.churn.expansionExposure.toFixed(6) + '  =  measured ' + dec.churn.measured.toFixed(6));
console.log('      expansion:  X     = ' + (dec.expansion.isolated).toFixed(6) + '   + retention exposure ' + dec.expansion.retentionExposure.toFixed(6) + '  =  measured ' + dec.expansion.measured.toFixed(6));
console.log('    Expansion enlarges the balance later exposed to decay, so measured GRR < P.');
console.log('    Decay shrinks the balance expansion later accrues on, so measured expansion < X.');
console.log('    NRR is unaffected because it is a ratio of two STOCKS; GRR and expansion are');
console.log('    ratios of FLOWS to a stock, and only flow ratios pick up the interaction.');

console.log('\n  €100 WORKED EXAMPLE — persistence 90%, expansion coefficient 10%');
console.log('  ' + L(76));
var we = K.workedExample(D.persistenceAnnual, D.expansionCoefficientAnnual, 100, 12);
console.log('    ' + pad('month', 8) + rpad('opening', 11) + rpad('− leakage', 12) + rpad('+ expansion', 13) + rpad('closing', 11));
[0, 1, 2, 10, 11].forEach(function (i) {
  var r = we.rows[i];
  console.log('    ' + pad('M' + r.t, 8) + rpad(r.opening.toFixed(4), 11) + rpad(r.leakage.toFixed(4), 12) +
              rpad(r.expansion.toFixed(4), 13) + rpad(r.closing.toFixed(4), 11) + (i === 2 ? '   ...' : ''));
});
console.log('    ' + pad('TOTAL', 8) + rpad('100.0000', 11) + rpad(we.cumLeakage.toFixed(4), 12) +
            rpad(we.cumExpansion.toFixed(4), 13) + rpad(we.closing.toFixed(4), 11));
console.log('');
console.log('    R12M GRR       = (100 − ' + we.cumLeakage.toFixed(4) + ') / 100 = ' + pc(we.measuredGRR, 4) + '   NOT 90.00%');
console.log('    R12M expansion = ' + we.cumExpansion.toFixed(4) + ' / 100          = ' + pc(we.measuredExpansion, 4) + '    NOT 10.00%');
console.log('    R12M NRR       = ' + we.closing.toFixed(4) + ' / 100          = ' + pc(we.measuredNRR, 4) + '   exactly P(1+X)');

/* ================================================================== *
 * §6  INVERSE CALIBRATION — target the MEASURED KPIs
 * ================================================================== */
console.log('\n' + L());
console.log('INVERSE CALIBRATION — Target A: measured R12M GRR 90.0%, measured expansion 10.0%');
console.log(L());
var calA = K.calibrate(0.90, 0.10);
console.log('  Closed form:  NRR* = GRR* + Exp* = ' + pc(calA.targetNRR, 4) + '   →   m = NRR*^(1/12) = ' + calA.monthlyMultiplier.toFixed(9));
console.log('                S = Σ m^t (t=0..11) = ' + calA.S.toFixed(6) + '   →   g = 1 − (1−GRR*)/S = ' + calA.monthlyPersistence.toFixed(9));
console.log('                e = m/g − 1 = ' + calA.monthlyExpansion.toFixed(9));
console.log('');
console.log('  REQUIRED TRANSITION COEFFICIENTS');
console.log('    annual persistence coefficient   ' + pc(calA.persistenceAnnual, 6) + '   (not 90% — the world must persist BETTER than the KPI reads)');
console.log('    annual expansion coefficient     ' + pc(calA.expansionCoefficientAnnual, 6) + '   (not 10% — the world must expand HARDER than the KPI reads)');
var runA = E.run(Object.assign({}, D, { persistenceAnnual: calA.persistenceAnnual, expansionCoefficientAnnual: calA.expansionCoefficientAnnual }));
var mA = K.measureR12M(runA, 12);
console.log('');
console.log('  SIMULATED VERIFICATION (measurement engine, frozen cohort, T=12)');
console.log('    R12M GRR        ' + pc(mA.grr, 6) + '   target 90.000000%   ' + (Math.abs(mA.grr - 0.90) < 1e-9 ? 'PASS' : 'FAIL'));
console.log('    R12M expansion  ' + pc(mA.expansionRate, 6) + '   target 10.000000%   ' + (Math.abs(mA.expansionRate - 0.10) < 1e-9 ? 'PASS' : 'FAIL'));
console.log('    R12M NRR        ' + pc(mA.nrr, 6) + '   ← the resulting NRR, not an input');
console.log('    Acquisition untouched: New ARR ' + m(runA.derived.newARRPerMonth) + '/mo, payback ' + mo(runA.derived.cacPaybackMonths));

/* ================================================================== *
 * Scenarios A–E
 * ================================================================== */
var TARGET_NRR = 0.96 * 1.10;
var SCENARIOS = [
  { id: 'A', title: 'Retention',              ch: { persistenceAnnual: 0.96 },        note: 'Persistence coefficient 90% → 96% (a TRANSITION change, not a KPI target)' },
  { id: 'B', title: 'Expansion',              ch: { expansionCoefficientAnnual: 0.20 },  note: 'Expansion coefficient 10% → 20% (a TRANSITION change, not a KPI target)' },
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
  var kb = K.measureR12M(BASE, 12), kx = K.measureR12M(exp, 12);
  console.log('  R12M GRR (MEASURED)    ' + pc(kb.grr, 2) + ' → ' + pc(kx.grr, 2) + '   (' + spc(kx.grr - kb.grr) + ')');
  console.log('  R12M expansion (MEAS.) ' + pc(kb.expansionRate, 2) + ' → ' + pc(kx.expansionRate, 2) + '   (' + spc(kx.expansionRate - kb.expansionRate) + ')');
  console.log('  R12M NRR (MEASURED)    ' + pc(kb.nrr, 2) + ' → ' + pc(kx.nrr, 2) + '   (' + spc(kx.nrr - kb.nrr) + ')');
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
 * §7  MATCHED MEASURED-NRR EXPERIMENT — defined by KPI targets, not coefficients
 * ================================================================== */
var TN = 0.96 * 1.10;                                   // 105.6%
var calR = K.calibrate(0.96, TN - 0.96);                // measured GRR 96.0%, expansion 9.6%
var calX = K.calibrate(0.90, TN - 0.90);                // measured GRR 90.0%, expansion 15.6%
var R = E.run(Object.assign({}, D, { persistenceAnnual: calR.persistenceAnnual, expansionCoefficientAnnual: calR.expansionCoefficientAnnual }));
var X = E.run(Object.assign({}, D, { persistenceAnnual: calX.persistenceAnnual, expansionCoefficientAnnual: calX.expansionCoefficientAnnual }));
var rs = E.summarise(R), xs = E.summarise(X);
var mR = K.measureR12M(R, 12), mX = K.measureR12M(X, 12);

console.log('\n' + L());
console.log('MATCHED MEASURED-NRR — scenarios defined by reported KPIs, not by coefficients');
console.log(L());
console.log('  ' + pad('', 34) + rpad('R · retention-heavy', 22) + rpad('X · expansion-heavy', 22));
console.log('  ' + L(78));
console.log('  ' + pad('TARGET measured R12M GRR', 34) + rpad(pc(0.96, 4), 22) + rpad(pc(0.90, 4), 22));
console.log('  ' + pad('TARGET measured R12M expansion', 34) + rpad(pc(TN - 0.96, 4), 22) + rpad(pc(TN - 0.90, 4), 22));
console.log('  ' + pad('TARGET measured R12M NRR', 34) + rpad(pc(TN, 4), 22) + rpad(pc(TN, 4), 22));
console.log('  ' + L(78));
console.log('  ' + pad('→ persistence coefficient', 34) + rpad(pc(calR.persistenceAnnual, 6), 22) + rpad(pc(calX.persistenceAnnual, 6), 22));
console.log('  ' + pad('→ expansion coefficient', 34) + rpad(pc(calR.expansionCoefficientAnnual, 6), 22) + rpad(pc(calX.expansionCoefficientAnnual, 6), 22));
console.log('  ' + pad('→ monthly multiplier m', 34) + rpad(calR.monthlyMultiplier.toFixed(9), 22) + rpad(calX.monthlyMultiplier.toFixed(9), 22));
console.log('  ' + L(78));
console.log('  ' + pad('ACTUAL measured R12M GRR', 34) + rpad(pc(mR.grr, 4), 22) + rpad(pc(mX.grr, 4), 22));
console.log('  ' + pad('ACTUAL measured R12M expansion', 34) + rpad(pc(mR.expansionRate, 4), 22) + rpad(pc(mX.expansionRate, 4), 22));
console.log('  ' + pad('ACTUAL measured R12M NRR', 34) + rpad(pc(mR.nrr, 4), 22) + rpad(pc(mX.nrr, 4), 22));

var ROWS = [
  ['Year 1 ARR',                     m(rs.y1ARR),            m(xs.y1ARR)],
  ['Year 3 ARR',                     m(rs.y3ARR),            m(xs.y3ARR)],
  ['Year 5 ARR',                     m(rs.finalARR),         m(xs.finalARR)],
  ['Cumulative expansion',           m(rs.cumExpansion),     m(xs.cumExpansion)],
  ['Cumulative leakage',             m(rs.cumLeakage),       m(xs.cumLeakage)],
  ['Cumulative gross profit',        m(rs.cumGrossProfit),   m(xs.cumGrossProfit)],
  ['Year 5 EBITA / FCF',             m(rs.finalYearFCF),     m(xs.finalYearFCF)],
  ['Ending cash (M60)',              m(rs.endingCash),       m(xs.endingCash)],
  ['M60 opening-cohort survival',    m(rs.openingCohortARR), m(xs.openingCohortARR)],
  ['M60 ARR from acquired cohorts',  m(rs.acquiredCohortARR),m(xs.acquiredCohortARR)]
];
console.log('');
console.log('  ' + pad('', 34) + rpad('R · retention-heavy', 22) + rpad('X · expansion-heavy', 22) + rpad('', 12));
console.log('  ' + L(88));
ROWS.forEach(function (r) {
  console.log('  ' + pad(r[0], 34) + rpad(r[1], 22) + rpad(r[2], 22) + rpad(r[1] === r[2] ? 'identical' : 'differs', 12));
});

var wARR = 0, wCash = 0;
for (var i = 0; i < R.months.length; i++) {
  wARR  = Math.max(wARR,  Math.abs(R.months[i].closingARR  - X.months[i].closingARR));
  wCash = Math.max(wCash, Math.abs(R.months[i].cashClosing - X.months[i].cashClosing));
}
console.log('\n  Max |R − X| over 60 months:  closing ARR €' + wARR.toExponential(3) + '  ·  cash €' + wCash.toExponential(3));
console.log('');
console.log('  → STILL ECONOMICALLY IDENTICAL, and the measurement layer sharpens the reason.');
console.log('    Measured R12M NRR is a STOCK RATIO, so pinning it pins m = NRR^(1/12) uniquely:');
console.log('    both scenarios run at m = ' + calR.monthlyMultiplier.toFixed(9) + '. The ARR recursion consumes');
console.log('    nothing but m, so identical measured NRR forces identical everything downstream —');
console.log('    regardless of how GRR and expansion split it. The only trace is gross flow:');
console.log('    X leaks ' + sm(xs.cumLeakage - rs.cumLeakage) + ' more and expands ' + sm(xs.cumExpansion - rs.cumExpansion) + ' more, netting to zero.');

/* ================================================================== *
 * §8  INFORMATION LOST IN KPI COMPRESSION
 * ================================================================== */
console.log('\n' + L());
console.log('INFORMATION LOSS — two customer systems, one pair of reported KPIs');
console.log(L());
console.log('  Arithmetic illustration, NOT simulator output (the model has no customers).');
console.log('  Both systems open with €20.0m of ARR across 100 customers at €200k each,');
console.log('  and both report R12M GRR 90.0% and R12M NRR 100.0%.');
console.log('');
console.log('  ' + pad('', 32) + rpad('System A — logo churn', 24) + rpad('System B — contraction', 24));
console.log('  ' + L(80));
[['Opening customers', '100', '100'],
 ['Opening ARR', '€20.0m', '€20.0m'],
 ['How the €2.0m is lost', '10 logos churn entirely', 'all 100 shrink 10%'],
 ['Closing customers', '90', '100'],
 ['Logo retention', '90%', '100%'],
 ['Expansion €2.0m from', '5 survivors (+€400k each)', 'all 100 (+€20k each)'],
 ['Top-5 share of expansion', '100%', '5%'],
 ['Reported R12M GRR', '90.0%', '90.0%'],
 ['Reported R12M NRR', '100.0%', '100.0%']
].forEach(function (r) { console.log('  ' + pad(r[0], 32) + rpad(r[1], 24) + rpad(r[2], 24)); });
console.log('');
console.log('  Same two numbers. 90 customers vs 100. Expansion from 5 accounts vs 100.');
console.log('  Nothing in GRR or NRR distinguishes them, and their forward economics differ.');

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
