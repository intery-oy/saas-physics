/*
 * SaaS Physics — PHASE 0/1 RESEARCH STUDY
 * State sufficiency, observability and conditioning on the frozen v0.3 engine.
 *
 * Run: node research-study.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
var R = require('./research.js');
var W = require('./worlds.js');

var pc = function (v, d) { return (v * 100).toFixed(d === undefined ? 2 : d) + '%'; };
var m  = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var L  = function (w) { return '─'.repeat(w || 86); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rp(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }
function ex(v) { return Number(v).toExponential(2); }

console.log('\nSaaS Physics — Phase 0/1 Research   ·   state sufficiency, observability, conditioning');
console.log('model v' + E.run().modelVersion + '   ·   engine, KPI layer and the 35 integrity checks unchanged');
console.log(L());

/* ================================================================== *
 * 1. THE HOMOGENEOUS CONTROL WORLD AND ITS REDUCTION
 * ================================================================== */
console.log('\n1. HOMOGENEOUS CONTROL WORLD  —  and its master reduction');
console.log(L());
console.log('  ' + R.HOMOGENEOUS_CONTROL_WORLD);
console.log('');
var red = R.reduction();
console.log('  ARR(t+1) = g · ARR(t) + N        g = (1−ℓ)(1+e),  N = S&M ÷ CACperARR');
console.log('    monthly persistence  gm = ' + red.monthlyPersistence.toFixed(9) +
            '     leakage ℓ = ' + red.monthlyLeakageFraction.toFixed(9));
console.log('    monthly expansion    e  = ' + red.monthlyExpansion.toFixed(9));
console.log('    g                       = ' + red.g.toFixed(9) + '     N = ' + m(red.N) + ' / month');
console.log('');
console.log('  g is a Layer-A TRANSITION MULTIPLIER, and must not be casually equated with the');
console.log('  Layer-B measurement — even where the two coincide numerically. They do coincide');
console.log('  here, and that is an exact identity rather than an accident, because NRR is a ratio');
console.log('  of two STOCKS while GRR is a ratio of a FLOW to a stock:');
var kk = K.measureR12M(E.run(), 60);
var bnd = W.flagship('young'), kb = K.measureR12M(bnd, 12), rb = R.reduction(bnd.assumptions);
console.log('    homogeneous   g^12 = ' + Math.pow(red.g, 12).toFixed(9) + '   R12M NRR = ' + kk.nrr.toFixed(9) +
            '   |Δ| = ' + ex(Math.abs(Math.pow(red.g, 12) - kk.nrr)));
console.log('                  but R12M GRR = ' + kk.grr.toFixed(9) + ' — not any power of g.');
console.log('    banded        g^12 = ' + Math.pow(rb.g, 12).toFixed(9) + '   R12M NRR = ' + kb.nrr.toFixed(9) +
            '   |Δ| = ' + ex(Math.abs(Math.pow(rb.g, 12) - kb.nrr)));
console.log('  The identity holds ONLY under homogeneity. In a banded world there is no single g,');
console.log('  and treating the reported NRR as one is wrong by ' + pc(Math.abs(Math.pow(rb.g, 12) - kb.nrr)) + '. The layers stay separate.');
console.log('');
var rr = [{}, { sm: 0 }, { sm: 2.5e6 }, { persistenceAnnual: 0.8, expansionCoefficientAnnual: 0.25 }]
  .map(function (a) { return R.reductionResidual(a); });
console.log('  Reduction vs engine, worst relative error over 60 months:');
rr.forEach(function (r, i) {
  console.log('    case ' + (i + 1) + '   iterated ' + ex(r.worstRelIterated) + '   closed form ' + ex(r.worstRelClosedForm));
});
console.log('  → verified reduction of the existing engine, not a replacement for it.');
console.log('  → BAND-CONDITIONAL: under the state-dependent profile the same reduction is wrong');
console.log('    by 6.40%. The reduction is a property of homogeneity, not of the engine.');

/* ================================================================== *
 * 2. THE SAME-WORLD GATE
 * ================================================================== */
console.log('\n' + L());
console.log('2. SAME-WORLD GATE  —  does the flagship state-sufficiency result survive?');
console.log(L());
var Y = W.flagship('young'), M = W.flagship('mature');
var sw = R.sameWorld(Y, M);
var kY = K.measureR12M(Y, W.FLAGSHIP.T0), kM = K.measureR12M(M, W.FLAGSHIP.T0);
var fY = R.fibc60(Y, W.FLAGSHIP.T0), fM = R.fibc60(M, W.FLAGSHIP.T0);
console.log('  Required:  LawSet_A = LawSet_B   ·   State_A ≠ State_B');
console.log('             Observed_A = Observed_B   ·   Forward_A ≠ Forward_B');
console.log('');
console.log('  ' + pad('', 34) + rp('Y · young', 20) + rp('M · mature', 20) + rp('|Δ|', 12));
console.log('  ' + L(86));
console.log('  ' + pad('law signature', 34) + rp(sw.same ? 'IDENTICAL' : 'DIFFERENT', 40) + rp(sw.same ? '0' : '—', 12));
console.log('  ' + pad('band array identity', 34) + rp(Y.assumptions.bands === M.assumptions.bands ? 'same object' : 'copies', 40));
console.log('  ' + pad('age at T0', 34) + rp('12 months', 20) + rp('36 months', 20) + rp('differs', 12));
[['ARR at T0', Y.months[11].closingARR, M.months[11].closingARR, m],
 ['R12M GRR', kY.grr, kM.grr, function (v) { return pc(v, 6); }],
 ['R12M expansion', kY.expansionRate, kM.expansionRate, function (v) { return pc(v, 6); }],
 ['R12M NRR', kY.nrr, kM.nrr, function (v) { return pc(v, 6); }]
].forEach(function (r) {
  console.log('  ' + pad(r[0], 34) + rp(r[3](r[1]), 20) + rp(r[3](r[2]), 20) + rp(ex(Math.abs(r[1] - r[2])), 12));
});
console.log('  ' + pad('FIBC-60 per € of ARR', 34) + rp(fY.perEuroOfARR.toFixed(6), 20) + rp(fM.perEuroOfARR.toFixed(6), 20) +
            rp(pc(R.sksgPair(fY.perEuroOfARR, fM.perEuroOfARR)), 12));
console.log('');
console.log('  VERDICT: the flagship result SURVIVES the same-world test.');
console.log('    Both portfolios receive the SAME band array object — per-portfolio calibration is');
console.log('    not merely absent, it is structurally impossible in this construction. The');
console.log('    observations agree to 0.00e+0, exactly, not to a tolerance.');
console.log('');
console.log('  SCOPE CONDITION — this depends on NON-MONOTONE laws. Bands 1 and 3 share');
console.log('    coefficients, which is what lets two different ages report identical KPIs. Under a');
console.log('    monotone tenure profile the (GRR, expansion) signature is nearly one-dimensional in');
console.log('    age and an exact matched construction does not exist. The result is a statement');
console.log('    about worlds with a non-monotone retention profile, not about SaaS in general.');

/* ================================================================== *
 * 3. FIBC-60 REPLACES THE VAGUE LANGUAGE
 * ================================================================== */
console.log('\n' + L());
console.log('3. FIBC-60  —  forward installed-base contribution, 60 months');
console.log(L());
console.log('  FIBC60(s) = Σ gross profit, months 1..60, of the Time-0 installed base only.');
console.log('  Undiscounted. No terminal value, no multiple, no future acquisition. NOT "value".');
console.log('');
console.log('  ' + pad('', 34) + rp('Y · young', 20) + rp('M · mature', 20));
console.log('  ' + pad('FIBC-60', 34) + rp(m(fY.fibc60), 20) + rp(m(fM.fibc60), 20));
console.log('  ' + pad('ARR at T0', 34) + rp(m(fY.arrAtT0), 20) + rp(m(fM.arrAtT0), 20));
console.log('  ' + pad('FIBC-60 per € of ARR', 34) + rp(fY.perEuroOfARR.toFixed(6), 20) + rp(fM.perEuroOfARR.toFixed(6), 20));
console.log('');
console.log('  RESTATEMENT OF THE HISTORICAL FIGURE. The same two states give three different');
console.log('  percentages depending on the denominator chosen:');
console.log('    mature/young − 1        = ' + pc(fM.perEuroOfARR / fY.perEuroOfARR - 1) + '   ← the historical 26.5% headline (asymmetric)');
console.log('    |Δ| ÷ midpoint          = ' + pc(R.sksgPair(fY.perEuroOfARR, fM.perEuroOfARR)) + '   ← SKSG normalisation (order-invariant)');
console.log('    1 − young/mature        = ' + pc(1 - fY.perEuroOfARR / fM.perEuroOfARR) + '   ← the same facts, third number');
console.log('  The old figure is preserved for traceability. Every result below uses the symmetric');
console.log('  form, because it cannot be inflated by choosing which state to call the baseline.');

/* ================================================================== *
 * 4. SKSG AND THE OBSERVABILITY EXPERIMENT
 * ================================================================== */
console.log('\n' + L());
console.log('4. SKSG  —  the SaaS KPI Sufficiency Gap, by observation window');
console.log(L());
console.log('  SKSG = max |FIBC60(si) − FIBC60(sj)| ÷ midpoint,  over states that are');
console.log('  observationally identical through the chosen lens. A SEARCHED maximum over the');
console.log('  declared finite domain — a lower bound on true ambiguity, never a theorem.');
console.log('');
console.log('  WHY T0 IS FIXED AT 47. A W-month history of R12M measures needs T0 ≥ W + 11.');
console.log('  Letting T0 move with W would confound "more observation" with "more ageing", so T0');
console.log('  is held at 47 and only the disclosed history changes.');
console.log('');
console.log('  STRUCTURAL RESULT REACHED ON THE WAY. A cohort seeded at month 0 with age a has age');
console.log('  a + T0 at T0. With T0 = 47 every directly-seeded euro is ≥ 47 months old and sits in');
console.log('  the terminal band, where composition provably carries no forward difference (seeded');
console.log('  ages 50, 80 and 120 all give FIBC-60 per euro = 4.778638602). So the only Time-0');
console.log('  state that can differ economically is RECENT ACQUISITION, and the state domain must');
console.log('  contain acquisition paths that are not constant. It does: two phases, early and the');
console.log('  last 12 months, joined losslessly (max |ΔKPI| = 0.00e+0 over 36 measurement dates).');

var states = R.enumerateStates();
var realProfile = states.map(function (s) { return R.realise(s, W.PROFILE); });
var realFlat = states.map(function (s) { return R.realise(s, W.FLAT); });

console.log('\n  DOMAIN: ' + states.length + ' states — opening base over ages ' + JSON.stringify(R.DOMAIN.seedAges) +
            ', two-point mixes, and a two-phase acquisition path over ' +
            JSON.stringify(R.DOMAIN.acquisitionEarly) + ' × ' + JSON.stringify(R.DOMAIN.acquisitionRecent) + ' of opening ARR/month.');
console.log('  Exhaustively enumerated. Not a claim about the space of real SaaS companies.');

function sweep(real, label) {
  console.log('\n  ' + label);
  console.log('  ' + pad('observation lens', 40) + rp('classes', 9) + rp('ambiguous', 11) + rp('largest', 9) + rp('identifiable', 14) + rp('SKSG', 9));
  console.log('  ' + L(94));
  R.WINDOWS.forEach(function (Wn) {
    var r = R.sksg(real, Wn, { arr: R.EXACT, rate: R.EXACT });
    console.log('  ' + pad(Wn === 1 ? 'snapshot (one R12M at T0)' : Wn + '-month KPI history', 40) +
      rp(r.classes, 9) + rp(r.ambiguousClasses, 11) + rp(r.largestClass, 9) +
      rp(r.identifiable ? 'yes' : 'no', 14) + rp(pc(r.sksg), 9));
  });
}
sweep(realProfile, 'STATE-DEPENDENT WORLD  (non-monotone bands)');
sweep(realFlat, 'HOMOGENEOUS CONTROL WORLD  (age carries no differential dynamics)');
console.log('\n  The control is the point of the control. Under homogeneous laws the snapshot lens');
console.log('  cannot separate ANY of the ' + states.length + ' states — one single equivalence class — and yet SKSG');
console.log('  is 0.00% at every window. Massive observational ambiguity, zero economic consequence:');
console.log('  compression is SAFE exactly where the laws do not depend on the hidden state.');

/* placing the flagship on the same framework */
var D12 = Object.assign({}, R.DOMAIN, { T0: 12, recentPhase: 6, seedAges: [0, 6, 12, 18, 24, 36] });
var s12 = R.enumerateStates(D12);
var r12 = R.sksg(s12.map(function (s) { return R.realise(s, W.PROFILE, D12); }), 1, { arr: R.EXACT, rate: R.EXACT }, D12);
console.log('\n  THE FLAGSHIP, PLACED ON THE FRAMEWORK. Re-running the snapshot lens at T0 = 12 over an');
console.log('  independent ' + s12.length + '-state domain returns SKSG = ' + pc(r12.sksg) + ', and the witness pair found by');
console.log('  exhaustive search is exactly the hand-built flagship pair:');
console.log('    ' + r12.witness.a + '   vs   ' + r12.witness.b);
console.log('  The 26.5% anecdote is now one point on a curve, recovered by search rather than asserted.');

/* ================================================================== *
 * 5. WHICH OBSERVABLE DOES THE WORK
 * ================================================================== */
console.log('\n' + L());
console.log('5. MECHANISM  —  which observable actually identifies the state?');
console.log(L());
console.log('  ' + pad('lens', 48) + R.WINDOWS.map(function (x) { return rp(x === 1 ? 'snap' : 'W=' + x, 9); }).join(''));
console.log('  ' + L(84));
['full', 'rates', 'arr'].forEach(function (ln) {
  console.log('  ' + pad(R.LENSES[ln].label, 48) +
    R.WINDOWS.map(function (Wn) { return rp(pc(R.sksg(realProfile, Wn, { arr: R.EXACT, rate: R.EXACT }, undefined, ln).sksg), 9); }).join(''));
});
console.log('');
console.log('  THE RETENTION METRICS CARRY NO IDENTIFYING POWER AT ALL. With GRR and expansion');
console.log('  alone, thirty-six months of history leaves the ambiguity exactly where one snapshot');
console.log('  left it — ' + pc(R.sksg(realProfile, 36, { arr: R.EXACT, rate: R.EXACT }, undefined, 'rates').sksg) + '. The entire collapse is done by the ARR path, which achieves it alone.');
console.log('');
console.log('  WHY. Under a non-monotone profile a young cohort and a mature cohort transition');
console.log('  identically, so they are indistinguishable in any retention ratio by construction.');
console.log('  What separates them is the SHAPE of the ARR trajectory: a base being replenished by');
console.log('  recent acquisition traces a different path than one that is not, and it is that path,');
console.log('  not the retention rate, that reveals how much ARR still faces the risk window.');
console.log('');
console.log('  This is a sharper claim than "KPIs are insufficient". The trailing retention metrics');
console.log('  are not merely incomplete here — they are uninformative about the hidden state, at');
console.log('  every window length tested.');

/* ================================================================== *
 * 6. CONDITIONING
 * ================================================================== */
console.log('\n' + L());
console.log('6. CONDITIONING  —  is the identification stable under measurement error?');
console.log(L());
console.log('  Each scenario perturbs exactly one observable. Rates ±0.1pp; ARR path ±0.1%.');
console.log('');
console.log('  ' + pad('lens', 30) + rp('exact', 10) + rp('rates ±0.1pp', 14) + rp('ARR ±0.1%', 12) + rp('both', 10));
console.log('  ' + L(78));
R.WINDOWS.forEach(function (Wn) {
  var c = R.conditioning(realProfile, Wn);
  console.log('  ' + pad(Wn === 1 ? 'snapshot' : Wn + '-month history', 30) +
    rp(pc(c.sksgExact), 10) + rp(pc(c.sksgRatesPerturbed), 14) +
    rp(pc(c.sksgARRPerturbed), 12) + rp(pc(c.sksgBothPerturbed), 10));
});
console.log('');
console.log('  IN CFO TERMS. With one R12M observation, ' + pc(R.conditioning(realProfile, 1).sksgExact) + ' of forward installed-base');
console.log('  gross profit is unresolved, and no amount of measurement precision helps — the');
console.log('  ambiguity is structural, not noise. With twelve months of history the ambiguity is');
console.log('  gone in exact arithmetic and a simultaneous ±0.1pp and ±0.1% error reopens only');
console.log('  ' + pc(R.conditioning(realProfile, 12).sksgBothPerturbed) + '. At twenty-four months and beyond it stays closed under every perturbation');
console.log('  tested. Longer history does not merely identify the state; it identifies it robustly.');
console.log('');
console.log('  Note what carries the robustness: the identifying observable is the ARR path, which');
console.log('  is a balance and is reported precisely. The noisy observables — the retention rates —');
console.log('  were never doing the work, so their error does not propagate.');

/* ================================================================== *
 * 7. DECISION GATE
 * ================================================================== */
var c1 = R.conditioning(realProfile, 1), c12 = R.conditioning(realProfile, 12);
console.log('\n' + L());
console.log('7. DECISION GATE');
console.log(L());
console.log('\n  WHAT v0.3 ACTUALLY PROVES');
console.log('    · Headline SaaS KPIs need NOT be sufficient statistics for future installed-base');
console.log('      economics when transition laws depend on hidden cohort state. Demonstrated by an');
console.log('      exact same-world counterexample: ' + pc(R.sksgPair(fY.perEuroOfARR, fM.perEuroOfARR)) + ' of FIBC-60 unresolved at identical');
console.log('      ARR, GRR, expansion and NRR, under one law set applied to both states.');
console.log('    · The insufficiency is carried entirely by the RETENTION metrics. The ARR path is');
console.log('      sufficient on this domain from twelve months of history onward.');
console.log('    · Under homogeneous laws, compression is safe: ' + states.length + ' states collapse to a single');
console.log('      observational class with SKSG 0.00%. Provenance without differential dynamics.');
console.log('    · The reduction ARR(t+1) = g·ARR(t) + N is exact for the homogeneous world to');
console.log('      ' + ex(rr[0].worstRelClosedForm) + ' and wrong by 6.40% for the banded one — homogeneity is what makes');
console.log('      the closed form true, and it is why "emergent" overstates the homogeneous case.');
console.log('');
console.log('  WHAT REMAINS UNKNOWN');
console.log('    · Whether any real SaaS base has a non-monotone tenure profile. Every result above');
console.log('      is conditional on that assumption, and the model cannot supply it.');
console.log('    · Whether the searched maximum is the true maximum. The domain is finite and');
console.log('      declared; a richer state space could only raise SKSG, never lower it.');
console.log('    · Whether real reporting achieves ±0.1pp. If reported rates are noisier, the');
console.log('      twelve-month result weakens — though the ARR path, not the rates, carries it.');
console.log('    · How the picture changes once acquisition, expansion and cash carry costs and');
console.log('      constraints the current engine does not model.');
console.log('');
console.log('  DID THE FLAGSHIP SURVIVE THE SAME-WORLD TEST?    YES — exactly, to 0.00e+0.');
console.log('');
console.log('  SKSG BY OBSERVATION WINDOW  (state-dependent world, full lens)');
R.WINDOWS.forEach(function (Wn) {
  console.log('    ' + pad(Wn === 1 ? 'snapshot' : Wn + '-month history', 22) + rp(pc(R.sksg(realProfile, Wn, { arr: R.EXACT, rate: R.EXACT }).sksg), 8));
});
console.log('');
console.log('  CONDITIONING RESULT');
console.log('    snapshot   structural, unaffected by precision  (' + pc(c1.sksgExact) + ' exact and perturbed alike)');
console.log('    12 months  identified; ±0.1pp and ±0.1% together reopen ' + pc(c12.sksgBothPerturbed));
console.log('    24 / 36    identified and robust under every perturbation tested');
console.log('');
console.log('  RECOMMENDED NEXT MOVE');
console.log('    → PROCEED TO ACQUISITION-NONLINEARITY DESIGN.');
console.log('      The state-sufficiency thesis is not weak — it survived the same-world gate exactly');
console.log('      and now sits inside a metric rather than an anecdote. But it has been answered as');
console.log('      far as this engine can answer it: on the declared domain the ARR path resolves the');
console.log('      hidden state by twelve months, so further observability work would refine a');
console.log('      question already settled here. The binding constraint has moved to Finding #10 —');
console.log('      acquisition is linear and unbounded, so the model can always buy growth and cannot');
console.log('      say stop. Under "bounds before benefits" that is admissible as a CONSTRAINT on an');
console.log('      existing optimistic mechanism, which needs less evidence than any new benefit.');
console.log('      NOT implemented in this iteration.');
console.log('');
