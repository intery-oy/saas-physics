/*
 * SaaS Physics — Prototype 0.3: the State Sufficiency Experiment.
 *
 * Question: if two portfolios show the same ARR and the same trailing SaaS KPIs
 * today, can their existing ARR nevertheless contain different amounts of future
 * economic value?
 *
 * Run: node state-sufficiency.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');

var m  = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var m3 = function (v) { return '€' + (v / 1e6).toFixed(4) + 'm'; };
var pc = function (v, d) { return (v * 100).toFixed(d === undefined ? 2 : d) + '%'; };
var L  = function (w) { return '─'.repeat(w || 84); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }

var T0 = 12, FORWARD = 60, HORIZON = T0 + FORWARD;   // 12 months of history, then 60 forward

/* ------------------------------------------------------------------ *
 * The world. A USER ASSUMPTION, not a claimed law of SaaS.
 *
 * Band 2 is a mid-life risk window — the first full renewal / re-contracting
 * cycle after the initial term. Bands 1 and 3 are given IDENTICAL coefficients,
 * which is what makes the matched construction exact rather than approximate
 * (see the calibration note below).
 * ------------------------------------------------------------------ */
var STABLE = { persistenceAnnual: 0.94, expansionCoefficientAnnual: 0.14 };
var RISKY  = { persistenceAnnual: 0.78, expansionCoefficientAnnual: 0.06 };
var PROFILE = [
  { name: 'Early',      maxAgeExclusive: 12,       persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual },
  { name: 'Developing', maxAgeExclusive: 24,       persistenceAnnual: RISKY.persistenceAnnual,  expansionCoefficientAnnual: RISKY.expansionCoefficientAnnual },
  { name: 'Mature',     maxAgeExclusive: Infinity, persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual }
];
var FLAT = [
  { name: 'Early',      maxAgeExclusive: 12,       persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual },
  { name: 'Developing', maxAgeExclusive: 24,       persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual },
  { name: 'Mature',     maxAgeExclusive: Infinity, persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual }
];

var OPENING_ARR = 20000000, OPENING_CASH = 10000000;
var D = E.DEFAULT_ASSUMPTIONS;

function build(bands, ages, sm) {
  var a = Object.assign({}, D, { bands: bands, sm: sm === undefined ? 0 : sm });
  var total = ages.reduce(function (s, x) { return s + x.w; }, 0);
  var seed = ages.map(function (x) {
    return { arr: OPENING_ARR * x.w / total, age: x.age, label: 'vintage age ' + x.age };
  });
  return E.run(a, { openingARR: OPENING_ARR, openingCash: OPENING_CASH, openingCohorts: seed }, HORIZON);
}

/* Portfolio Y: every euro is age 12 at T0 — it has NOT yet been through band 2.
   Portfolio M: every euro is age 36 at T0 — it went through band 2 long ago. */
var Y_AGES = [{ age: 0,  w: 1 }];
var M_AGES = [{ age: 24, w: 1 }];

console.log('\nSaaS Physics — Prototype 0.3   State Sufficiency Experiment   (model v' + E.run().modelVersion + ')');
console.log(L());

/* ================================================================== *
 * A. State architecture
 * ================================================================== */
console.log('A. NEW STATE DIMENSION — cohort maturity');
console.log(L());
console.log('  Three age bands by cohort age at the START of each month.');
console.log('  Six transition parameters; no other new behavioural coefficient.');
console.log('');
console.log('  ' + pad('band', 14) + pad('ages', 12) + rpad('persistence', 14) + rpad('expansion', 12) + rpad('annual mult', 14));
console.log('  ' + L(66));
PROFILE.forEach(function (b, i) {
  var lo = i === 0 ? 0 : PROFILE[i - 1].maxAgeExclusive;
  var hi = b.maxAgeExclusive === Infinity ? '+' : b.maxAgeExclusive - 1;
  console.log('  ' + pad(b.name, 14) + pad(lo + '–' + hi, 12) + rpad(pc(b.persistenceAnnual), 14) +
              rpad(pc(b.expansionCoefficientAnnual), 12) +
              rpad((b.persistenceAnnual * (1 + b.expansionCoefficientAnnual)).toFixed(4), 14));
});
console.log('');
console.log('  This profile is a USER ASSUMPTION, not a law. Band 2 is read as a mid-life');
console.log('  renewal / re-contracting window. Bands 1 and 3 are deliberately identical:');
console.log('  the simulator takes no position on whether older cohorts are better.');
console.log('  The shipped DEFAULT is flat — age carries no meaning until someone gives it some.');

/* ================================================================== *
 * B. Matched current-state construction
 * ================================================================== */
var Y = build(PROFILE, Y_AGES), M = build(PROFILE, M_AGES);
var kY = K.measureR12M(Y, T0), kM = K.measureR12M(M, T0);
var cY = K.ageComposition(Y, T0), cM = K.ageComposition(M, T0);

console.log('\n' + L());
console.log('B. MATCHED CURRENT STATE AT T0 (month ' + T0 + ')');
console.log(L());
console.log('  CALIBRATION NOTE. A first attempt used a monotone band profile and solved for');
console.log('  two age mixes hitting the same (GRR, expansion). It was INFEASIBLE: with monotone');
console.log('  bands the (GRR, expansion) signature is very nearly one-dimensional in age, so');
console.log('  matching two KPIs pins the age distribution and no non-negative second solution');
console.log('  exists. Rather than fudge the reported metrics, the construction was changed:');
console.log('  bands 1 and 3 share coefficients, so a cohort that spent the measurement window');
console.log('  in band 1 and one that spent it in band 3 report IDENTICAL KPIs exactly, while');
console.log('  facing completely different futures. No solver, no residual.');
console.log('');
console.log('  ' + pad('', 34) + rpad('Y · young', 20) + rpad('M · mature', 20) + rpad('difference', 14));
console.log('  ' + L(88));
var B = [
  ['Age at T0', '12 months', '36 months', 'differs'],
  ['Band occupied during window', 'Early (0–11)', 'Mature (24–35)', 'differs'],
  ['Band occupied AT T0', cY.bands.filter(function (b) { return b.share > 0.5; })[0].name,
                          cM.bands.filter(function (b) { return b.share > 0.5; })[0].name, 'differs'],
  ['ARR at T0', m3(Y.months[T0 - 1].closingARR), m3(M.months[T0 - 1].closingARR),
    '€' + Math.abs(Y.months[T0 - 1].closingARR - M.months[T0 - 1].closingARR).toExponential(1)],
  ['R12M GRR', pc(kY.grr, 6), pc(kM.grr, 6), Math.abs(kY.grr - kM.grr).toExponential(1)],
  ['R12M expansion', pc(kY.expansionRate, 6), pc(kM.expansionRate, 6), Math.abs(kY.expansionRate - kM.expansionRate).toExponential(1)],
  ['R12M NRR', pc(kY.nrr, 6), pc(kM.nrr, 6), Math.abs(kY.nrr - kM.nrr).toExponential(1)],
  ['Gross margin', pc(Y.assumptions.grossMargin), pc(M.assumptions.grossMargin), '0'],
  ['R&D + G&A per month', m(Y.assumptions.rd + Y.assumptions.ga), m(M.assumptions.rd + M.assumptions.ga), '0'],
  ['S&M per month (acquisition off)', m(Y.assumptions.sm), m(M.assumptions.sm), '0'],
  ['New ARR per month', m(Y.derived.newARRPerMonth), m(M.derived.newARRPerMonth), '0'],
  ['CAC / New ARR', Y.assumptions.cacPerARR.toFixed(2) + '×', M.assumptions.cacPerARR.toFixed(2) + '×', '0']
];
B.forEach(function (r) { console.log('  ' + pad(r[0], 34) + rpad(r[1], 20) + rpad(r[2], 20) + rpad(r[3], 14)); });
console.log('');
console.log('  → To any conventional KPI dashboard these are the same company.');

/* ================================================================== *
 * C. Future divergence
 * ================================================================== */
var fY = K.forwardEconomics(Y, T0, FORWARD), fM = K.forwardEconomics(M, T0, FORWARD);

console.log('\n' + L());
console.log('C. FORWARD 60 MONTHS (months ' + (T0 + 1) + '–' + HORIZON + '), acquisition off in both');
console.log(L());
console.log('  ' + pad('', 34) + rpad('Y · young', 20) + rpad('M · mature', 20) + rpad('M − Y', 14));
console.log('  ' + L(88));
function row(label, y, x, fmt) {
  console.log('  ' + pad(label, 34) + rpad(fmt(y), 20) + rpad(fmt(x), 20) +
              rpad((x - y >= 0 ? '+' : '−') + fmt(Math.abs(x - y)), 14));
}
row('ARR at M' + HORIZON, Y.months[HORIZON - 1].closingARR, M.months[HORIZON - 1].closingARR, m);
row('Remaining revenue (60m)', fY.remainingRevenue, fM.remainingRevenue, m);
row('Remaining gross profit (60m)', fY.remainingGP, fM.remainingGP, m);
row('Remaining EBITA (60m)', fY.remainingEbita, fM.remainingEbita, m);
row('Remaining FCF (60m)', fY.remainingFCF, fM.remainingFCF, m);
row('Cash at M' + HORIZON, fY.cashAtEnd, fM.cashAtEnd, m);
row('Expansion from T0 base', fY.existingBaseExpansion, fM.existingBaseExpansion, m);
row('Leakage from T0 base', fY.existingBaseLeakage, fM.existingBaseLeakage, m);
console.log('');
console.log('  ARR trajectory of the T0 base, by year:');
console.log('  ' + pad('', 12) + [1, 2, 3, 4, 5].map(function (y) { return rpad('Y' + y, 13); }).join(''));
['Y · young', 'M · mature'].forEach(function (nm, i) {
  var r = i === 0 ? Y : M;
  console.log('  ' + pad(nm, 12) + [1, 2, 3, 4, 5].map(function (y) {
    return rpad(m(r.months[T0 + y * 12 - 1].closingARR), 13);
  }).join(''));
});
console.log('  ' + pad('Y\'s band', 12) + [1, 2, 3, 4, 5].map(function (y) {
  var comp = K.ageComposition(Y, T0 + y * 12 - 6);   // mid-year
  return rpad(comp.bands.filter(function (b) { return b.share > 0.5; })[0].name, 13);
}).join('') + '   (mid-year)');

/* ================================================================== *
 * D/F. Economic mechanism and forward economic content
 * ================================================================== */
console.log('\n' + L());
console.log('D. THE MECHANISM, AND F. FORWARD ECONOMIC CONTENT');
console.log(L());
console.log('  Y still has to pass through the Developing band. M passed through it 12 months');
console.log('  before T0. In months ' + (T0 + 1) + '–' + (T0 + 12) + ' Y runs at an annual multiplier of ' +
            (RISKY.persistenceAnnual * (1 + RISKY.expansionCoefficientAnnual)).toFixed(4) + ' while M runs at ' +
            (STABLE.persistenceAnnual * (1 + STABLE.expansionCoefficientAnnual)).toFixed(4) + '.');
console.log('  After month ' + (T0 + 12) + ' both grow at the SAME rate — the gap never closes, because it is a');
console.log('  level difference created in one year and then compounded by an identical rate.');
console.log('');
console.log('  ARR at M' + (T0 + 12) + ' (end of Y\'s risk window):  Y ' + m(Y.months[T0 + 11].closingARR) +
            '   M ' + m(M.months[T0 + 11].closingARR) + '   ratio ' +
            (M.months[T0 + 11].closingARR / Y.months[T0 + 11].closingARR).toFixed(4));
console.log('  ARR at M' + HORIZON + ':                          Y ' + m(Y.months[HORIZON - 1].closingARR) +
            '   M ' + m(M.months[HORIZON - 1].closingARR) + '   ratio ' +
            (M.months[HORIZON - 1].closingARR / Y.months[HORIZON - 1].closingARR).toFixed(4));
console.log('');
console.log('  EXPERIMENTAL 60-MONTH FORWARD ECONOMIC MEASURE — not a KPI, not enterprise value');
console.log('    Remaining GP60             Y ' + m(fY.remainingGP) + '        M ' + m(fM.remainingGP));
console.log('    Current ARR at T0          Y ' + m(fY.arrAtT0) + '         M ' + m(fM.arrAtT0));
console.log('    Forward GP density (GP60 / current ARR)');
console.log('                               Y ' + fY.gpDensity.toFixed(4) + '×          M ' + fM.gpDensity.toFixed(4) + '×');
console.log('    → €1 of Y\'s ARR carries ' + fY.gpDensity.toFixed(2) + ' of forward gross profit;');
console.log('      €1 of M\'s ARR carries ' + fM.gpDensity.toFixed(2) + '. Same euro, ' +
            pc(fM.gpDensity / fY.gpDensity - 1) + ' more economic content.');

/* Density is linear in composition — sweep the mix */
console.log('\n  Density across the mix (share of ARR that is young at T0):');
console.log('  ' + pad('young share', 16) + rpad('ARR at T0', 14) + rpad('GP60', 14) + rpad('GP density', 14));
[0, 0.25, 0.5, 0.75, 1].forEach(function (w) {
  var r = build(PROFILE, [{ age: 0, w: w }, { age: 24, w: 1 - w }].filter(function (x) { return x.w > 0; }));
  var f = K.forwardEconomics(r, T0, FORWARD);
  console.log('  ' + pad(pc(w, 0), 16) + rpad(m(f.arrAtT0), 14) + rpad(m(f.remainingGP), 14) + rpad(f.gpDensity.toFixed(4) + '×', 14));
});

/* ================================================================== *
 * E. Flat-law counterfactual
 * ================================================================== */
var Yf = build(FLAT, Y_AGES), Mf = build(FLAT, M_AGES);
var kYf = K.measureR12M(Yf, T0), kMf = K.measureR12M(Mf, T0);
var fYf = K.forwardEconomics(Yf, T0, FORWARD), fMf = K.forwardEconomics(Mf, T0, FORWARD);
var wARR = 0, wGP = 0;
for (var i = 0; i < HORIZON; i++) {
  wARR = Math.max(wARR, Math.abs(Yf.months[i].closingARR - Mf.months[i].closingARR));
  wGP = Math.max(wGP, Math.abs(Yf.months[i].grossProfit - Mf.months[i].grossProfit));
}
console.log('\n' + L());
console.log('E. FLAT-LAW COUNTERFACTUAL — identical coefficients in every band');
console.log(L());
console.log('  Same two portfolios, same age composition, only the age-dependence removed.');
console.log('  ' + pad('', 34) + rpad('Y · young', 20) + rpad('M · mature', 20) + rpad('difference', 14));
console.log('  ' + L(88));
console.log('  ' + pad('ARR at T0', 34) + rpad(m3(fYf.arrAtT0), 20) + rpad(m3(fMf.arrAtT0), 20) + rpad('€' + Math.abs(fYf.arrAtT0 - fMf.arrAtT0).toExponential(1), 14));
console.log('  ' + pad('R12M NRR', 34) + rpad(pc(kYf.nrr, 6), 20) + rpad(pc(kMf.nrr, 6), 20) + rpad(Math.abs(kYf.nrr - kMf.nrr).toExponential(1), 14));
console.log('  ' + pad('Remaining GP60', 34) + rpad(m3(fYf.remainingGP), 20) + rpad(m3(fMf.remainingGP), 20) + rpad('€' + Math.abs(fYf.remainingGP - fMf.remainingGP).toExponential(1), 14));
console.log('  ' + pad('Forward GP density', 34) + rpad(fYf.gpDensity.toFixed(6) + '×', 20) + rpad(fMf.gpDensity.toFixed(6) + '×', 20) + rpad(Math.abs(fYf.gpDensity - fMf.gpDensity).toExponential(1), 14));
console.log('  ' + pad('max |Y − M| ARR over ' + HORIZON + ' months', 34) + rpad('€' + wARR.toExponential(3), 20));
console.log('  ' + pad('max |Y − M| gross profit', 34) + rpad('€' + wGP.toExponential(3), 20));
console.log('');
console.log('  → Age composition alone creates NOTHING. With flat laws the two portfolios are');
console.log('    bit-identical. Maturity has no value; only economically different future');
console.log('    transition behaviour associated with maturity has value.');

/* Direction-agnostic check: invert the profile and the ranking flips */
var INVERTED = [
  { name: 'Early',      maxAgeExclusive: 12,       persistenceAnnual: RISKY.persistenceAnnual,  expansionCoefficientAnnual: RISKY.expansionCoefficientAnnual },
  { name: 'Developing', maxAgeExclusive: 24,       persistenceAnnual: STABLE.persistenceAnnual, expansionCoefficientAnnual: STABLE.expansionCoefficientAnnual },
  { name: 'Mature',     maxAgeExclusive: Infinity, persistenceAnnual: RISKY.persistenceAnnual,  expansionCoefficientAnnual: RISKY.expansionCoefficientAnnual }
];
var Yi = build(INVERTED, Y_AGES), Mi = build(INVERTED, M_AGES);
var fYi = K.forwardEconomics(Yi, T0, FORWARD), fMi = K.forwardEconomics(Mi, T0, FORWARD);
console.log('\n  Direction agnosticism. Invert the profile (bands 1 and 3 risky, band 2 stable):');
console.log('    Forward GP density   Y ' + fYi.gpDensity.toFixed(4) + '×   M ' + fMi.gpDensity.toFixed(4) +
            '×   → ' + (fYi.gpDensity > fMi.gpDensity ? 'YOUNG' : 'MATURE') + ' is now worth more.');
console.log('    The model privileges no direction. The ranking is a property of the assumed');
console.log('    transition laws, never of age itself.');

/* ================================================================== *
 * When, if ever, does the KPI layer see the hidden state?
 * ================================================================== */
console.log('\n' + L());
console.log('OBSERVABILITY — when does the reported KPI series reveal the difference?');
console.log(L());
console.log('  ' + pad('measurement date', 20) + rpad('Y · young', 14) + rpad('M · mature', 14) + '   distinguishable?');
console.log('  ' + L(76));
[12, 15, 18, 21, 24, 30, 36, 48, 72].forEach(function (T) {
  var a1 = K.measureR12M(Y, T), b1 = K.measureR12M(M, T), d = Math.abs(a1.nrr - b1.nrr);
  console.log('  ' + pad('M' + T + (T === T0 ? '  (T0)' : ''), 20) + rpad(pc(a1.nrr), 14) + rpad(pc(b1.nrr), 14) +
              '   ' + (d < 1e-9 ? 'NO — identical' : 'yes, ' + (d * 100).toFixed(2) + 'pp apart'));
});
console.log('');
console.log('  The trailing KPI series is blind BEFORE the event, sees it for exactly 24 months as');
console.log('  the risk window passes through the measurement window, and is blind again AFTER.');
console.log('  A CFO deciding at T0 gets the blind reading. By the time the KPIs show it, the');
console.log('  economics have already happened — and by M36 the report looks pristine again.');
console.log('');
console.log('  The information is not unknowable. It is simply not in GRR and NRR: cohort vintage');
console.log('  disclosure identifies it instantly, and every company already has that data.');

/* ================================================================== *
 * Secondary run: identical acquisition re-enabled
 * ================================================================== */
var Ya = build(PROFILE, Y_AGES, D.sm), Ma = build(PROFILE, M_AGES, D.sm);
var fYa = K.forwardEconomics(Ya, T0, FORWARD), fMa = K.forwardEconomics(Ma, T0, FORWARD);
console.log('\n' + L());
console.log('SECONDARY RUN — identical acquisition re-enabled (S&M ' + m(D.sm) + '/mo in both)');
console.log(L());
console.log('  ' + pad('', 34) + rpad('Y · young', 20) + rpad('M · mature', 20) + rpad('M − Y', 14));
console.log('  ' + L(88));
row('ARR at M' + HORIZON, Ya.months[HORIZON - 1].closingARR, Ma.months[HORIZON - 1].closingARR, m);
row('Remaining GP60', fYa.remainingGP, fMa.remainingGP, m);
row('Cash at M' + HORIZON, fYa.cashAtEnd, fMa.cashAtEnd, m);
console.log('  ' + pad('Forward GP density', 34) + rpad(fYa.gpDensity.toFixed(4) + '×', 20) + rpad(fMa.gpDensity.toFixed(4) + '×', 20));
console.log('');
console.log('  The gap survives but is diluted: new cohorts are identical in both companies and');
console.log('  arrive at the same rate, so they add the same economics to each. Acquisition');
console.log('  does not remove the difference in the installed base — it hides it.');
console.log('');
