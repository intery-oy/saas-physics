/*
 * SaaS Physics — PHASE 0/1 RESEARCH CHECKS (§16).
 *
 * These are SEPARATE from the 35 frozen integrity checks in integrity.js, which
 * remain untouched and must keep passing. Run: node research-checks.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
var R = require('./research.js');
var W = require('./worlds.js');

var pass = 0, fail = 0, out = [];
function check(name, ok, detail) {
  (ok ? pass++ : fail++);
  out.push('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + name.padEnd(34) + (detail || ''));
  return ok;
}
function ex(v) { return Number(v).toExponential(2); }

console.log('\nSaaS Physics — Phase 0/1 research checks');
console.log('─'.repeat(86));

/* ================================================================== *
 * SAME-WORLD
 * The matched state-sufficiency portfolios use identical transition laws.
 * This is also the AUTHORITATIVE check for v1.template.html's Scenario 6
 * ("Same KPIs, different history"): W.flagship() is built from the exact
 * same numbers Scenario 6 uses — STABLE {p:0.94,x:0.14} / RISKY {p:0.78,
 * x:0.06} bands at [12,24,∞), openingARR €20.0m, openingCash €10.0m, sm:0,
 * ages 0 ('young') and 24 ('mature') — so this block, not a duplicate, is
 * what establishes Scenario 6's same-world construction:
 *   LawSet_A = LawSet_B            · law signatures / no per-state calibration
 *   State_A ≠ State_B              · state differs (below)
 *   ObservedKPIs_A = ObservedKPIs_B · observations equal
 *   ForwardEconomics_A ≠ ForwardEconomics_B · forward differs
 * ================================================================== */
var Y = W.flagship('young'), M = W.flagship('mature');
var sw = R.sameWorld(Y, M);
check('SAME-WORLD · law signatures', sw.same, 'byte-identical law + control signature');
var ageAtT0_Y = Y.cohorts[0].initialAge + W.FLAGSHIP.T0, ageAtT0_M = M.cohorts[0].initialAge + W.FLAGSHIP.T0;
check('SAME-WORLD · state differs (cohort age at T0, despite identical laws and matching KPIs)',
  ageAtT0_Y !== ageAtT0_M, 'young ' + ageAtT0_Y + 'mo vs mature ' + ageAtT0_M + 'mo at T0=' + W.FLAGSHIP.T0);
var kY = K.measureR12M(Y, W.FLAGSHIP.T0), kM = K.measureR12M(M, W.FLAGSHIP.T0);
var obsGap = Math.max(
  Math.abs(Y.months[W.FLAGSHIP.T0 - 1].closingARR - M.months[W.FLAGSHIP.T0 - 1].closingARR) /
    Y.months[W.FLAGSHIP.T0 - 1].closingARR,
  Math.abs(kY.grr - kM.grr), Math.abs(kY.expansionRate - kM.expansionRate), Math.abs(kY.nrr - kM.nrr));
check('SAME-WORLD · observations equal', obsGap < 1e-12, 'max |Δobs| = ' + ex(obsGap));
var fY = R.fibc60(Y, W.FLAGSHIP.T0), fM = R.fibc60(M, W.FLAGSHIP.T0);
var fwdGap = R.sksgPair(fY.perEuroOfARR, fM.perEuroOfARR);
check('SAME-WORLD · forward differs', fwdGap > 0.2, 'SKSG(pair) = ' + (fwdGap * 100).toFixed(2) + '%');
check('SAME-WORLD · no per-state calibration',
  JSON.stringify(Y.bands) === JSON.stringify(M.bands) && Y.assumptions.bands === M.assumptions.bands,
  'both portfolios reference the SAME band array');

/* ================================================================== *
 * HOMOGENEOUS-REDUCTION
 * ARR_{t+1} = g·ARR_t + N reproduces the aggregate homogeneous ARR path.
 * ================================================================== */
var worstRed = 0;
[{}, { sm: 0 }, { sm: 2.5e6 }, { persistenceAnnual: 0.8, expansionCoefficientAnnual: 0.25 },
 { persistenceAnnual: 0.99, expansionCoefficientAnnual: 0.0 }].forEach(function (a) {
  var r = R.reductionResidual(a);
  worstRed = Math.max(worstRed, r.worstRelIterated, r.worstRelClosedForm);
});
check('HOMOGENEOUS-REDUCTION', worstRed < 1e-12,
  'worst relative error over 5 parameterisations = ' + ex(worstRed));

/* The reduction must NOT be claimed for a banded world. */
var banded = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { bands: W.PROFILE }),
                   { openingARR: 20e6, openingCash: 0 }, 60);
var red = R.reduction(banded.assumptions);
var bandedErr = 0;
var pth = red.path(banded.months[0].openingARR, 60);
for (var t = 1; t <= 60; t++) {
  bandedErr = Math.max(bandedErr, Math.abs(pth[t] - banded.months[t - 1].closingARR) / banded.months[t - 1].closingARR);
}
check('REDUCTION-IS-BAND-CONDITIONAL', bandedErr > 1e-4,
  'banded world departs from the reduction by ' + (bandedErr * 100).toFixed(2) + '% — as it must');

/* ================================================================== *
 * FIBC
 * FIBC-60 equals direct cohort-level GP summation from the T0 base with
 * future acquisition excluded.
 * ================================================================== */
var fRun = W.flagship('young');
var f1 = R.fibc60(fRun, W.FLAGSHIP.T0).fibc60;
/* independent recomputation: acquisition is off in the flagship run, so the
   company's whole gross profit after T0 belongs to the T0 installed base */
var f2 = 0;
for (var q = W.FLAGSHIP.T0 + 1; q <= W.FLAGSHIP.T0 + 60; q++) f2 += fRun.months[q - 1].grossProfit;
check('FIBC · cohort sum = company GP', Math.abs(f1 - f2) / f2 < 1e-12,
  'Δ = ' + ex(Math.abs(f1 - f2)) + ' on €' + (f1 / 1e6).toFixed(2) + 'm');

/* with acquisition ON, FIBC-60 must EXCLUDE the post-T0 cohorts */
var acqRun = W.flagship('young', E.DEFAULT_ASSUMPTIONS.sm);
var fA = R.fibc60(acqRun, W.FLAGSHIP.T0);
var allGP = 0;
for (var q2 = W.FLAGSHIP.T0 + 1; q2 <= W.FLAGSHIP.T0 + 60; q2++) allGP += acqRun.months[q2 - 1].grossProfit;
check('FIBC · excludes post-T0 acquisition', fA.fibc60 < allGP * 0.999,
  'installed base €' + (fA.fibc60 / 1e6).toFixed(2) + 'm of total €' + (allGP / 1e6).toFixed(2) + 'm');

/* ================================================================== *
 * SEGMENTATION
 * Chaining engine runs at a phase boundary is lossless — the state domain
 * depends on it.
 * ================================================================== */
var sm = E.DEFAULT_ASSUMPTIONS.sm, cac = E.DEFAULT_ASSUMPTIONS.cacPerARR;
var cont = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { sm: sm }), { openingARR: 20e6, openingCash: 0 }, 47);
var g1 = R.segment([{ arr: 20e6, age: 0 }], undefined, sm / cac, 35);
var g2 = R.segment(R.snapshotAt(g1, 35), undefined, sm / cac, 12);
var joined = R.joinRuns(g1, g2, 35);
var segARR = 0, segKPI = 0;
for (var u = 1; u <= 47; u++) segARR = Math.max(segARR, Math.abs(joined.months[u - 1].closingARR - cont.months[u - 1].closingARR));
for (var v = 12; v <= 47; v++) {
  var a1 = K.measureR12M(joined, v), b1 = K.measureR12M(cont, v);
  segKPI = Math.max(segKPI, Math.abs(a1.grr - b1.grr), Math.abs(a1.expansionRate - b1.expansionRate), Math.abs(a1.nrr - b1.nrr));
}
/* MRR-native engine refactor: the join boundary now round-trips through
   snapshotAt's ARR export and segment()'s re-seed (which divides by 12 to
   reach the engine's native MRR state), one extra floating-point division
   than the continuous run takes. That is sub-ULP noise (~1e-9 on ARR figures
   in the tens of millions, ~1e-16 relative) — not a second computation of
   the same thing disagreeing — so the tolerance matches the project's own
   EPS (1e-6 euros) used everywhere else a €-denominated identity is checked. */
check('SEGMENTATION · lossless join', segARR < 1e-6 && segKPI === 0,
  'max |ΔARR| = ' + ex(segARR) + ', max |ΔKPI| over 36 dates = ' + ex(segKPI));

/* ================================================================== *
 * KPI-EQUALITY
 * States labelled observationally equivalent really do match the specified
 * KPI/history set within the declared tolerance.
 * ================================================================== */
var states = R.enumerateStates();
var realised = states.map(function (s) { return R.realise(s, W.PROFILE); });
var snap = R.sksg(realised, 1, { arr: R.EXACT, rate: R.EXACT });
var worstInClass = 0, classChecked = 0;
(function () {
  var pts = realised.map(function (r) {
    return { obs: R.observe(r.warm, R.DOMAIN.T0, 1), fibc: R.stateFIBC(r).perEuroOfARR };
  });
  var seen = new Array(pts.length).fill(false);
  for (var i = 0; i < pts.length; i++) {
    if (seen[i]) continue;
    var cls = [i]; seen[i] = true;
    for (var j = i + 1; j < pts.length; j++) {
      if (!seen[j] && R.obsEqual(pts[i].obs, pts[j].obs, R.EXACT, R.EXACT)) { cls.push(j); seen[j] = true; }
    }
    if (cls.length > 1) {
      classChecked++;
      for (var m = 1; m < cls.length; m++) {
        worstInClass = Math.max(worstInClass, R.obsDistance(pts[cls[0]].obs, pts[cls[m]].obs));
      }
    }
  }
})();
check('KPI-EQUALITY · within tolerance', worstInClass <= R.EXACT,
  classChecked + ' ambiguous classes, worst intra-class |Δobs| = ' + ex(worstInClass));

/* ================================================================== *
 * SUFFICIENCY-METRIC
 * SKSG is symmetric and stable under state ordering.
 * ================================================================== */
check('SUFFICIENCY-METRIC · symmetric',
  Math.abs(R.sksgPair(3.1, 4.7) - R.sksgPair(4.7, 3.1)) === 0, 'pairwise gap is order-invariant');
var shuffled = realised.slice().reverse();
var sA = R.sksg(realised, 1, { arr: R.EXACT, rate: R.EXACT });
var sB = R.sksg(shuffled, 1, { arr: R.EXACT, rate: R.EXACT });
check('SUFFICIENCY-METRIC · order-stable',
  Math.abs(sA.sksg - sB.sksg) < 1e-15 && sA.classes === sB.classes,
  'SKSG ' + (sA.sksg * 100).toFixed(4) + '% under both orderings, ' + sA.classes + ' classes');

/* ================================================================== *
 * HISTORY
 * Building a longer observation window must not leak future information.
 * ================================================================== */
(function () {
  /* two runs identical up to T0, different afterwards */
  var seed = [{ arr: 20e6, age: 0 }];
  var upto = R.segment(seed, W.PROFILE, 0.01 * 20e6, R.DOMAIN.T0);
  var contA = R.segment(R.snapshotAt(upto, R.DOMAIN.T0), W.PROFILE, 0, 60);
  var contB = R.segment(R.snapshotAt(upto, R.DOMAIN.T0), W.PROFILE, 0.03 * 20e6, 60);
  var jA = R.joinRuns(upto, contA, R.DOMAIN.T0), jB = R.joinRuns(upto, contB, R.DOMAIN.T0);
  var worst = 0;
  [1, 12, 24, 36].forEach(function (Wn) {
    var oA = R.observe(jA, R.DOMAIN.T0, Wn), oB = R.observe(jB, R.DOMAIN.T0, Wn);
    worst = Math.max(worst, R.obsDistance(oA, oB));
  });
  check('HISTORY · no future leakage', worst === 0,
    'futures differ; observations at every window identical, max |Δ| = ' + ex(worst));
})();

/* the window must genuinely reach back W months, not silently truncate */
(function () {
  var r = realised[0];
  var lens = R.observe(r.warm, R.DOMAIN.T0, 36);
  check('HISTORY · window length honoured', lens.arr.length === 36 && lens.rates.length === 72,
    '36 ARR points and 72 rate points for W=36');
})();

/* ================================================================== *
 * CONDITIONING
 * Perturbation tests alter only the observations explicitly perturbed.
 * ================================================================== */
(function () {
  /* find a pair that agrees on RATES but differs on the ARR path */
  var pts = realised.map(function (r) { return R.observe(r.warm, R.DOMAIN.T0, 12); });
  var found = null;
  for (var i = 0; i < pts.length && !found; i++) {
    for (var j = i + 1; j < pts.length; j++) {
      var ratesSame = R.obsEqual({ arr: [], rates: pts[i].rates }, { arr: [], rates: pts[j].rates }, R.EXACT, R.EXACT);
      var arrDiff = !R.obsEqual({ arr: pts[i].arr, rates: [] }, { arr: pts[j].arr, rates: [] }, R.ARR_PERTURBATION, R.EXACT);
      if (ratesSame && arrDiff) { found = [pts[i], pts[j]]; break; }
    }
  }
  check('CONDITIONING · rate noise spares ARR', !!found &&
    !R.obsEqual(found[0], found[1], R.EXACT, R.PERTURBATION),
    'a pair identical in rates but apart in ARR stays distinguished under ±0.1pp rate noise');
})();
(function () {
  var c = R.conditioning(realised, 24);
  check('CONDITIONING · declared scenarios',
    c.ratePerturbationPP === 0.1 && c.arrPerturbationPct === 0.1 &&
    typeof c.sksgRatesPerturbed === 'number' && typeof c.sksgARRPerturbed === 'number',
    'rates ±0.1pp and ARR ±0.1% reported separately');
})();

/* ================================================================== *
 * HOMOGENEOUS CONTROL WORLD — composition carries no forward difference
 * ================================================================== */
(function () {
  var flat = states.map(function (s) { return R.realise(s, W.FLAT); });
  var worst = 0, ref = R.stateFIBC(flat[0]).perEuroOfARR;
  flat.forEach(function (r) { worst = Math.max(worst, Math.abs(R.stateFIBC(r).perEuroOfARR - ref) / ref); });
  check('HOMOGENEOUS-CONTROL · no composition effect', worst < 1e-12,
    'FIBC-60 per euro identical across all ' + flat.length + ' states, worst rel Δ = ' + ex(worst));
})();

/* ================================================================== *
 * SYSTEM-STATE
 * systemstate.js was extracted from the archived pulse.js so the kept SYSTEM
 * view does not depend on a rejected prototype's module. The extraction must be
 * behaviour-identical, value by value.
 * ================================================================== */
(function () {
  var PU = require('./pulse.js'), SS = require('./systemstate.js');
  var base = E.run(), exp = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { persistenceAnnual: 0.96, sm: 1.4e6 }));
  var worst = 0, fields = 0;
  function cmp(a, b) {
    Object.keys(a).forEach(function (k) {
      var va = a[k], vb = b[k];
      if (typeof va === 'number' && typeof vb === 'number') { worst = Math.max(worst, Math.abs(va - vb)); fields++; }
    });
  }
  for (var t = 1; t <= base.horizon; t++) {
    var pa = PU.pulseAt(exp, t), sa = SS.stateAt(exp, t);
    cmp(pa, sa);
    if (pa.cohorts.length !== sa.cohorts.length) worst = Infinity;
    for (var i = 0; i < pa.cohorts.length; i++) cmp(pa.cohorts[i], sa.cohorts[i]);
    var pd = PU.deltaPulseAt(base, exp, t), sd = SS.deltaStateAt(base, exp, t);
    cmp(pd, sd);
    for (var j = 0; j < pd.cohorts.length; j++) cmp(pd.cohorts[j], sd.cohorts[j]);
  }
  check('SYSTEM-STATE · extraction faithful', worst === 0,
    fields + ' numeric fields over ' + base.horizon + ' months, max |Δ| = ' + ex(worst));
})();

console.log(out.join('\n'));
console.log('─'.repeat(86));
console.log('  ' + pass + ' / ' + (pass + fail) + ' research checks passed\n');
process.exit(fail ? 1 : 0);
