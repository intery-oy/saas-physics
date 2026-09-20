/*
 * SaaS Physics — integrity checks (Prototype 0 §17, extended for 0.2 §16).
 * UMD so the Node CLI and the browser UI run the SAME assertions against the
 * SAME engine. Targeted economic-integrity checks, not a general test suite.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./kpi.js'));
  else root.SaaSPhysicsIntegrity = factory(root.SaaSPhysics, root.SaaSPhysicsKPI);
})(typeof self !== 'undefined' ? self : globalThis, function (E, K) {
  'use strict';

  var EPS = 1e-6; // euros

  function runAll(assumptions) {
    var Aband = Object.assign({}, E.DEFAULT_ASSUMPTIONS, assumptions || {});
    /* Checks 1–26 assert identities of the HOMOGENEOUS engine (NRR = P(1+X), the
       measured-vs-coefficient decomposition, closed-form calibration). Those are
       properties of age-independent laws and are deliberately band-conditional —
       see the final check — so they are evaluated against the flat projection of
       whatever is configured. The v0.3 checks build their own banded worlds. */
    var A = Object.assign({}, Aband); delete A.bands;
    var BASE = E.run(A);
    var out = [];
    function ok(name, pass, detail) { out.push({ name: name, pass: !!pass, detail: detail || '' }); }

    /* 1. ARR bridge reconciliation */
    var worst = 0, worstMonth = null;
    BASE.months.forEach(function (m) {
      var r = Math.abs(m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR);
      if (r > worst) { worst = r; worstMonth = m.t; }
    });
    ok('ARR bridge reconciles every month (Opening + New + Expansion − Leakage = Closing)',
       worst < EPS, 'max residual €' + worst.toExponential(3) + (worstMonth ? ' at M' + worstMonth : ''));

    /* 2. Total ARR = sum of cohort ARR */
    var worst2 = 0;
    for (var t = 1; t <= BASE.horizon; t++) {
      var sum = E.cohortSnapshot(BASE, t).reduce(function (s, c) { return s + c.currentARR; }, 0);
      worst2 = Math.max(worst2, Math.abs(sum - BASE.months[t - 1].closingARR));
    }
    ok('Company ARR = sum of cohort ARR (aggregates are never computed separately)',
       worst2 < EPS, 'max divergence €' + worst2.toExponential(3));

    /* 2b. Revenue is also only ever a sum of cohorts */
    var worst2b = 0;
    BASE.months.forEach(function (m) { worst2b = Math.max(worst2b, Math.abs(m.cohortRevenueSum - m.revenue)); });
    ok('Company revenue = sum of cohort revenue', worst2b < EPS, 'max divergence €' + worst2b.toExponential(3));

    /* 3. GRR cannot increase installed-base ARR before expansion */
    var bad = 0, negLeak = 0;
    BASE.cohorts.forEach(function (c) {
      c.rows.forEach(function (r) {
        if (r.retainedARR > r.openingARR + EPS) bad++;
        if (r.leakage < -EPS) negLeak++;
      });
    });
    ok('Retention never grows the base pre-expansion (retained ≤ opening, leakage ≥ 0)',
       bad === 0 && negLeak === 0, bad + ' retention violations, ' + negLeak + ' negative-leakage rows');

    /* 4. New ARR excluded from NRR */
    var tenX = E.run(Object.assign({}, A, { sm: A.sm * 10 }));
    var w4 = 0;
    for (var i = 0; i < BASE.months.length; i++) w4 = Math.max(w4, Math.abs(BASE.months[i].nrrAnnualised - tenX.months[i].nrrAnnualised));
    var scale = tenX.derived.newARRPerMonth / (BASE.derived.newARRPerMonth || 1);
    ok('New ARR is excluded from NRR (10× S&M leaves NRR bit-identical)',
       w4 < 1e-12, 'NRR delta ' + w4.toExponential(3) + ' while New ARR scaled ' + scale.toFixed(4) + '×');

    /* 4b. NRR emerges rather than being assumed */
    var implied = A.persistenceAnnual * (1 + A.expansionCoefficientAnnual);
    var simNRR = BASE.months[BASE.horizon - 1].nrrAnnualised;
    ok('NRR emerges from GRR × (1 + expansion) — never an input',
       Math.abs(simNRR - implied) < 1e-9,
       'simulated ' + (simNRR * 100).toFixed(4) + '% vs implied ' + (implied * 100).toFixed(4) + '%');

    /* 5. Cash roll-forward */
    var w5 = 0, prev = BASE.start.openingCash, sumFcf = 0;
    BASE.months.forEach(function (m) {
      w5 = Math.max(w5, Math.abs(m.cashOpening - prev), Math.abs(m.cashClosing - (m.cashOpening + m.fcf)));
      prev = m.cashClosing; sumFcf += m.fcf;
    });
    var endRes = Math.abs(BASE.months[BASE.horizon - 1].cashClosing - (BASE.start.openingCash + sumFcf));
    ok('Cash rolls forward (opening + FCF = closing; ending = opening + Σ FCF)',
       w5 < EPS && endRes < EPS, 'max step residual €' + w5.toExponential(3) + ', ending residual €' + endRes.toExponential(3));

    /* 6. One engine for both scenarios */
    var b = E.run(A), x = E.run(Object.assign({}, A, { persistenceAnnual: Math.min(0.999, A.persistenceAnnual + 0.06) }));
    var sameSchema = b.modelVersion === x.modelVersion && b.months.length === x.months.length &&
                     Object.keys(b.months[0]).join() === Object.keys(x.months[0]).join();
    ok('Base and Experiment run through one engine entry point and one output schema',
       sameSchema, 'E.run is the single entry point; identical output schema: ' + sameSchema);

    /* 7. GRR alone creates no New ARR */
    var hi = E.run(Object.assign({}, A, { persistenceAnnual: Math.min(0.999, A.persistenceAnnual + 0.06) }));
    var w7 = 0;
    for (i = 0; i < BASE.months.length; i++) w7 = Math.max(w7, Math.abs(BASE.months[i].newARR - hi.months[i].newARR));
    ok('Raising GRR alone creates no New ARR (it only reduces leakage)',
       w7 < EPS, 'New ARR delta €' + w7.toExponential(3) + '; M60 ARR ' +
       (BASE.months[BASE.horizon - 1].closingARR / 1e6).toFixed(2) + 'm → ' +
       (hi.months[hi.horizon - 1].closingARR / 1e6).toFixed(2) + 'm');

    /* 8. S&M hits spend immediately, New ARR per the stated formula */
    var up = E.run(Object.assign({}, A, { sm: A.sm * 1.5 }));
    var formula = up.assumptions.sm / up.assumptions.cacPerARR;
    var pass8 = up.months[0].sm === A.sm * 1.5 && Math.abs(up.months[0].newARR - formula) < EPS;
    ok('+50% S&M raises month-1 spend immediately and New ARR by the stated formula',
       pass8, 'M1 S&M €' + (up.months[0].sm / 1e6).toFixed(3) + 'm → New ARR €' +
       (up.months[0].newARR / 1e6).toFixed(4) + 'm (formula match: ' + (Math.abs(up.months[0].newARR - formula) < EPS) + ')');

    /* 9. R&D reduces EBITA/FCF one-for-one, with no modelled benefit */
    var d = 250000, rdUp = E.run(Object.assign({}, A, { rd: A.rd + d }));
    var w9e = 0, w9a = 0;
    for (i = 0; i < BASE.months.length; i++) {
      w9e = Math.max(w9e, Math.abs((BASE.months[i].ebita - rdUp.months[i].ebita) - d));
      w9a = Math.max(w9a, Math.abs(BASE.months[i].closingARR - rdUp.months[i].closingARR));
    }
    ok('+€0.25m/mo R&D cuts EBITA and FCF one-for-one, with zero ARR benefit (none is modelled)',
       w9e < EPS && w9a < EPS, 'EBITA delta exact to €' + w9e.toExponential(3) + '; ARR unchanged to €' + w9a.toExponential(3));

    /* 10. Determinism */
    var r1 = E.run(A), r2 = E.run(JSON.parse(JSON.stringify(A)));
    var same = JSON.stringify(r1.months) === JSON.stringify(r2.months) &&
               JSON.stringify(r1.cohorts) === JSON.stringify(r2.cohorts);
    ok('Identical assumptions produce byte-identical trajectories (fully deterministic)',
       same, 'deep equality over ' + r1.horizon + ' months and ' + r1.cohorts.length + ' cohorts');

    /* ================================================================ *
     * v0.2 acquisition physics (brief §16)
     * ================================================================ */

    /* A1. CAC payback is structurally incapable of generating New ARR */
    var src = E.newARRPerMonth.toString();
    var clean = src.indexOf('cacPayback') === -1 && src.indexOf('grossMargin') === -1 && src.indexOf('cacPerARR') !== -1;
    ok('ACQ · New ARR generator reads only S&M and cacPerARR — CAC payback and GM appear nowhere in it',
       clean, 'newARRPerMonth() source references cacPerARR: ' + (src.indexOf('cacPerARR') !== -1) +
       ', cacPayback: ' + (src.indexOf('cacPayback') !== -1) + ', grossMargin: ' + (src.indexOf('grossMargin') !== -1));

    /* A2/A3/A5. New ARR is invariant to gross margin across a sweep */
    var gms = [0.40, 0.55, 0.65, 0.80, 0.92], newSeries = gms.map(function (g) {
      return E.run(Object.assign({}, A, { grossMargin: g })).derived.newARRPerMonth;
    });
    var wGM = Math.max.apply(null, newSeries.map(function (v) { return Math.abs(v - newSeries[0]); }));
    /* perturb GM relative to the scenario under test, so the check is meaningful
       even when the Experiment already sits at a low margin */
    var gmLow = A.grossMargin * 0.8;
    var gmRun = E.run(Object.assign({}, A, { grossMargin: gmLow })), wMonthly = 0;
    for (i = 0; i < BASE.months.length; i++) wMonthly = Math.max(wMonthly, Math.abs(BASE.months[i].newARR - gmRun.months[i].newARR));
    ok('ACQ · Changing gross margin alone leaves New ARR unchanged (GM swept 40%→92%, and month by month)',
       wGM < EPS && wMonthly < EPS,
       'max New ARR spread across the GM sweep €' + wGM.toExponential(3) + '; max monthly delta at GM ' +
       (gmLow * 100).toFixed(0) + '% €' + wMonthly.toExponential(3));

    /* A2b. New ARR is exactly S&M / cacPerARR */
    var probes = [[A.sm, A.cacPerARR], [A.sm * 1.5, A.cacPerARR], [A.sm, 0.8], [500000, 1.5]], wF = 0;
    probes.forEach(function (pr) {
      var r = E.run(Object.assign({}, A, { sm: pr[0], cacPerARR: pr[1] }));
      wF = Math.max(wF, Math.abs(r.derived.newARRPerMonth - pr[0] / pr[1]));
    });
    ok('ACQ · New ARR = monthly S&M ÷ cacPerARR exactly (annualised: S&M × 12 ÷ cacPerARR)',
       wF < EPS, 'max deviation over 4 probes €' + wF.toExponential(3) +
       '; e.g. €500k/mo at 1.5× → €' + ((500000 / 1.5 * 12) / 1e6).toFixed(2) + 'm of New ARR per year of spend');

    /* A4. Changing GM alone MUST move CAC payback */
    var pbBase = BASE.derived.cacPaybackMonths, pbLow = gmRun.derived.cacPaybackMonths;
    ok('ACQ · Changing gross margin alone deteriorates CAC payback (the intended causal direction)',
       pbLow > pbBase + 1e-9,
       'GM ' + (A.grossMargin * 100).toFixed(0) + '% → ' + (gmLow * 100).toFixed(0) + '% moves payback ' +
       pbBase.toFixed(2) + ' → ' + pbLow.toFixed(2) + ' months');

    /* A6. Payback reconciles exactly to cacPerARR and GM */
    var wPB = 0;
    [[1.20, 0.80], [1.00, 0.80], [0.80, 0.80], [1.20, 0.65], [1.50, 0.50]].forEach(function (pr) {
      var r = E.run(Object.assign({}, A, { cacPerARR: pr[0], grossMargin: pr[1] }));
      wPB = Math.max(wPB, Math.abs(r.derived.cacPaybackMonths - (pr[0] * 12) / pr[1]));
    });
    ok('ACQ · CAC payback = cacPerARR × 12 ÷ GM, and is only ever an output',
       wPB < 1e-9, 'max deviation over 5 probes ' + wPB.toExponential(3) +
       ' months; e.g. 1.00× at GM 80% → ' + ((1.0 * 12) / 0.8).toFixed(1) + ' months');

    /* A7. Matched-NRR scenarios reproduce the intended annual NRR */
    var TARGET = 0.96 * 1.10;                       // 105.6%
    var R = E.run(Object.assign({}, A, { persistenceAnnual: 0.96, expansionCoefficientAnnual: 0.10 }));
    var X = E.run(Object.assign({}, A, { persistenceAnnual: 0.90, expansionCoefficientAnnual: TARGET / 0.90 - 1 }));
    var nR = R.months[R.horizon - 1].nrrAnnualised, nX = X.months[X.horizon - 1].nrrAnnualised;
    ok('ACQ · Matched-NRR scenarios R (96%×110%) and X (90%×117.33%) both reproduce NRR ' + (TARGET * 100).toFixed(1) + '%',
       Math.abs(nR - TARGET) < 1e-12 && Math.abs(nX - TARGET) < 1e-12,
       'R ' + (nR * 100).toFixed(10) + '%, X ' + (nX * 100).toFixed(10) + '%, max deviation ' +
       Math.max(Math.abs(nR - TARGET), Math.abs(nX - TARGET)).toExponential(2));

    /* ================================================================ *
     * v0.2.1 — the economic engine and the measurement engine are two layers
     * ================================================================ */
    var TGT_GRR = 0.90, TGT_EXP = 0.10;
    var mBase = K.measureR12M(BASE, 12);

    /* K1. Transition coefficients and reported KPIs are distinct objects */
    var dec = K.decompose(A.persistenceAnnual, A.expansionCoefficientAnnual);
    var predicted = Math.abs(dec.measuredGRR - mBase.grr) < 1e-9 &&
                    Math.abs(dec.measuredExpansion - mBase.expansionRate) < 1e-9;
    var distinct = Math.abs(mBase.grr - A.persistenceAnnual) > 1e-6 ||
                   Math.abs(mBase.expansionRate - A.expansionCoefficientAnnual) > 1e-6;
    ok('KPI · Transition coefficients ≠ reported KPIs, and the gap matches the closed-form decomposition',
       predicted && distinct,
       'persistence ' + (A.persistenceAnnual * 100).toFixed(2) + '% → measured GRR ' + (mBase.grr * 100).toFixed(4) +
       '%; expansion coefficient ' + (A.expansionCoefficientAnnual * 100).toFixed(2) + '% → measured expansion ' +
       (mBase.expansionRate * 100).toFixed(4) + '%; prediction matches simulation: ' + predicted);

    /* K2. The R12M measurement cohort excludes New ARR */
    var big = E.run(Object.assign({}, A, { sm: A.sm * 10 })), wK = 0, wN = 0;
    for (i = 12; i <= BASE.horizon; i++) {
      var a1 = K.measureR12M(BASE, i), b1 = K.measureR12M(big, i);
      wK = Math.max(wK, Math.abs(a1.grr - b1.grr), Math.abs(a1.expansionRate - b1.expansionRate), Math.abs(a1.nrr - b1.nrr));
      wN = Math.max(wN, b1.newARRExcluded - a1.newARRExcluded);
    }
    ok('KPI · R12M cohort excludes New ARR (10× S&M leaves GRR, expansion and NRR unchanged at every T)',
       wK < 1e-12,
       'max KPI delta ' + wK.toExponential(3) + ' while New ARR inside the window rose by up to €' +
       (wN / 1e6).toFixed(2) + 'm');

    /* K3. Expansion must not improve GRR */
    var xs = [0, 0.05, 0.10, 0.20, 0.35], grrs = xs.map(function (x) {
      return K.measureR12M(E.run(Object.assign({}, A, { expansionCoefficientAnnual: x })), 12).grr;
    });
    var monotone = true;
    for (i = 1; i < grrs.length; i++) if (grrs[i] > grrs[i - 1] + 1e-12) monotone = false;
    ok('KPI · Expansion never improves measured GRR (it slightly worsens it: more base survives to leak)',
       monotone,
       'expansion 0%→35% moves GRR ' + (grrs[0] * 100).toFixed(4) + '% → ' + (grrs[grrs.length - 1] * 100).toFixed(4) +
       '%, monotonically non-increasing');

    /* K4/K5. Bridge and identity reconcile at every measurement date */
    var wB = 0, wI = 0, wR = 0;
    for (i = 12; i <= BASE.horizon; i++) {
      var k = K.measureR12M(BASE, i);
      wB = Math.max(wB, Math.abs(k.bridgeResidual));
      wI = Math.max(wI, Math.abs(k.identityResidual));
      wR = Math.max(wR, Math.abs(k.nrr - k.closingEligibleARR / k.openingARR));
    }
    ok('KPI · Bridge reconciles (Opening + Expansion − Leakage = Closing eligible) and NRR = GRR + Expansion',
       wB < EPS && wI < 1e-12 && wR < 1e-12,
       'max bridge residual €' + wB.toExponential(3) + '; max GRR+Exp−NRR identity residual ' + wI.toExponential(3));

    /* K6/K7. Inverse calibration reproduces the target measured KPIs */
    var cal = K.calibrate(TGT_GRR, TGT_EXP);
    var calRun = E.run(Object.assign({}, A, {
      persistenceAnnual: cal.persistenceAnnual,
      expansionCoefficientAnnual: cal.expansionCoefficientAnnual
    }));
    var mc = K.measureR12M(calRun, 12);
    ok('KPI · Calibrated transition parameters reproduce target measured GRR 90.0% and expansion 10.0%',
       Math.abs(mc.grr - TGT_GRR) < 1e-9 && Math.abs(mc.expansionRate - TGT_EXP) < 1e-9,
       'persistence ' + (cal.persistenceAnnual * 100).toFixed(6) + '% + expansion coefficient ' +
       (cal.expansionCoefficientAnnual * 100).toFixed(6) + '% → measured GRR ' + (mc.grr * 100).toFixed(6) +
       '%, expansion ' + (mc.expansionRate * 100).toFixed(6) + '%, NRR ' + (mc.nrr * 100).toFixed(6) + '%');

    /* K8. Matched MEASURED-NRR scenarios report the intended KPI values */
    var TN = 0.96 * 1.10;
    var calR = K.calibrate(0.96, TN - 0.96), calX = K.calibrate(0.90, TN - 0.90);
    var runR = E.run(Object.assign({}, A, { persistenceAnnual: calR.persistenceAnnual, expansionCoefficientAnnual: calR.expansionCoefficientAnnual }));
    var runX = E.run(Object.assign({}, A, { persistenceAnnual: calX.persistenceAnnual, expansionCoefficientAnnual: calX.expansionCoefficientAnnual }));
    var mR = K.measureR12M(runR, 12), mX = K.measureR12M(runX, 12);
    ok('KPI · Matched measured-NRR scenarios truly report GRR 96.0%/90.0% and NRR ' + (TN * 100).toFixed(1) + '%',
       Math.abs(mR.grr - 0.96) < 1e-9 && Math.abs(mX.grr - 0.90) < 1e-9 &&
       Math.abs(mR.nrr - TN) < 1e-9 && Math.abs(mX.nrr - TN) < 1e-9,
       'R measures GRR ' + (mR.grr * 100).toFixed(4) + '% / NRR ' + (mR.nrr * 100).toFixed(4) +
       '%; X measures GRR ' + (mX.grr * 100).toFixed(4) + '% / NRR ' + (mX.nrr * 100).toFixed(4) + '%');

    /* K9. Calibrating retention KPIs never touches acquisition */
    var wAcq = 0;
    [calRun, runR, runX].forEach(function (r) {
      wAcq = Math.max(wAcq, Math.abs(r.derived.newARRPerMonth - BASE.derived.newARRPerMonth),
                            Math.abs(r.derived.cacPaybackMonths - BASE.derived.cacPaybackMonths));
    });
    ok('KPI · Calibrating retention KPIs leaves v0.2 acquisition physics untouched (New ARR and payback unmoved)',
       wAcq < EPS,
       'max deviation across all three calibrated runs ' + wAcq.toExponential(3) +
       '; New ARR still €' + (BASE.derived.newARRPerMonth / 1e6).toFixed(3) + 'm/mo, payback still ' +
       BASE.derived.cacPaybackMonths.toFixed(2) + ' months');

    /* K10. One economic engine AND one measurement engine for both scenarios */
    var eOne = typeof E.run === 'function', kOne = typeof K.measureR12M === 'function';
    var sameK = JSON.stringify(K.measureR12M(E.run(A), 36)) === JSON.stringify(K.measureR12M(E.run(JSON.parse(JSON.stringify(A))), 36));
    ok('KPI · Base and Experiment share one economic engine and one measurement engine',
       eOne && kOne && sameK,
       'E.run and K.measureR12M are the single entry points; identical assumptions give identical measurements: ' + sameK);

    /* ================================================================ *
     * v0.3 — state sufficiency: cohort maturity and acquisition provenance
     * ================================================================ */
    var STABLE = { p: 0.94, x: 0.14 }, RISKY = { p: 0.78, x: 0.06 };
    function band(n, maxAge, r) {
      return { name: n, maxAgeExclusive: maxAge, persistenceAnnual: r.p, expansionCoefficientAnnual: r.x };
    }
    var PROFILE = [band('Early', 12, STABLE), band('Developing', 24, RISKY), band('Mature', Infinity, STABLE)];
    var FLAT3   = [band('Early', 12, STABLE), band('Developing', 24, STABLE), band('Mature', Infinity, STABLE)];
    var T0 = 12, FWD = 60, HZ = T0 + FWD, OARR = 20000000;
    function port(bands, age, sm) {
      return E.run(Object.assign({}, A, { bands: bands, sm: sm === undefined ? 0 : sm }),
                   { openingARR: OARR, openingCash: 10000000, openingCohorts: [{ arr: OARR, age: age }] }, HZ);
    }
    var pY = port(PROFILE, 0), pM = port(PROFILE, 24);
    var mY = K.measureR12M(pY, T0), mM = K.measureR12M(pM, T0);
    var eY = K.forwardEconomics(pY, T0, FWD), eM = K.forwardEconomics(pM, T0, FWD);

    /* S1–S5. The two portfolios are indistinguishable at T0 */
    ok('STATE · At T0 the two portfolios match on ARR, R12M GRR, R12M expansion, R12M NRR and gross margin',
       Math.abs(eY.arrAtT0 - eM.arrAtT0) < EPS && Math.abs(mY.grr - mM.grr) < 1e-12 &&
       Math.abs(mY.expansionRate - mM.expansionRate) < 1e-12 && Math.abs(mY.nrr - mM.nrr) < 1e-12 &&
       pY.assumptions.grossMargin === pM.assumptions.grossMargin,
       'ARR €' + (eY.arrAtT0 / 1e6).toFixed(4) + 'm both (Δ €' + Math.abs(eY.arrAtT0 - eM.arrAtT0).toExponential(1) +
       '); GRR ' + (mY.grr * 100).toFixed(6) + '% both; NRR ' + (mY.nrr * 100).toFixed(6) + '% both; GM ' +
       (pY.assumptions.grossMargin * 100).toFixed(0) + '% both');

    /* S6. Acquisition is off in the core experiment */
    var noAcq = pY.derived.newARRPerMonth === 0 && pM.derived.newARRPerMonth === 0 &&
                pY.months.every(function (mm) { return mm.newARR === 0 && mm.sm === 0; });
    ok('STATE · Acquisition is zero throughout the core experiment, in both portfolios',
       noAcq, 'New ARR €0/month and S&M €0/month across all ' + HZ + ' months');

    /* S7. 2×2 factorial: divergence needs BOTH different composition AND age-dependent laws */
    function maxARRGap(r1, r2) {
      var w = 0; for (i = 0; i < HZ; i++) w = Math.max(w, Math.abs(r1.months[i].closingARR - r2.months[i].closingARR));
      return w;
    }
    var sameCompAgeDep = maxARRGap(port(PROFILE, 0), port(PROFILE, 0));   // same state, age-dependent
    var diffCompFlat   = maxARRGap(port(FLAT3, 0), port(FLAT3, 24));      // different state, flat
    var diffCompAgeDep = maxARRGap(pY, pM);                               // different state, age-dependent
    ok('STATE · Divergence requires BOTH a different cohort state AND age-dependent laws (2×2 factorial)',
       sameCompAgeDep < EPS && diffCompFlat < EPS && diffCompAgeDep > 1e6,
       'same state + age-dependent: €' + sameCompAgeDep.toExponential(1) +
       ' · different state + flat: €' + diffCompFlat.toExponential(1) +
       ' · different state + age-dependent: €' + (diffCompAgeDep / 1e6).toFixed(2) + 'm');

    /* S8. Flat laws: the matched portfolios stay bit-identical */
    var fY = port(FLAT3, 0), fM = port(FLAT3, 24);
    var flatSame = JSON.stringify(fY.months) === JSON.stringify(fM.months);
    var gY = K.forwardEconomics(fY, T0, FWD), gM = K.forwardEconomics(fM, T0, FWD);
    ok('STATE · With flat age-independent laws the matched portfolios do not diverge at all',
       flatSame && Math.abs(gY.gpDensity - gM.gpDensity) < 1e-12,
       'monthly series byte-identical: ' + flatSame + '; forward GP density ' + gY.gpDensity.toFixed(6) +
       '× vs ' + gM.gpDensity.toFixed(6) + '× — maturity itself creates nothing');

    /* S9. Acquisition cost is stamped at creation and never mutates */
    var acqRun = E.run(A), stamped = 0, bad = 0;
    acqRun.cohorts.forEach(function (c) {
      if (c.acquisitionMonth === 0) { if (c.acquisitionCost !== null) bad++; return; }
      stamped++;
      if (Math.abs(c.acquisitionCost - A.sm) > EPS) bad++;
      if (Math.abs(c.acquisitionCost - c.initialARR * c.cacPerARRAtCreation) > EPS) bad++;
    });
    var before = acqRun.cohorts.map(function (c) { return c.acquisitionCost; }).join(',');
    E.summarise(acqRun); K.measureR12M(acqRun, 24); K.forwardEconomics(acqRun, 12, 48);
    var after = acqRun.cohorts.map(function (c) { return c.acquisitionCost; }).join(',');
    ok('STATE · Acquisition cost is stamped at cohort creation, reconciles to cacPerARR, and is immutable',
       bad === 0 && before === after,
       stamped + ' acquisition cohorts stamped at €' + (A.sm / 1e6).toFixed(2) +
       'm each (= initialARR × ' + A.cacPerARR + '×); opening vintages null (genuinely unknown); ' +
       'unchanged after measurement: ' + (before === after));

    /* S10. Historical acquisition cost never feeds forward economics.
       Double both S&M and cacPerARR: identical New ARR, double the sunk cost. */
    var cheap = E.run(Object.assign({}, A, { sm: A.sm, cacPerARR: A.cacPerARR }));
    var dear  = E.run(Object.assign({}, A, { sm: A.sm * 2, cacPerARR: A.cacPerARR * 2 }));
    var wA2 = 0, wG2 = 0, wL2 = 0;
    for (i = 0; i < cheap.horizon; i++) {
      wA2 = Math.max(wA2, Math.abs(cheap.months[i].closingARR - dear.months[i].closingARR));
      wG2 = Math.max(wG2, Math.abs(cheap.months[i].grossProfit - dear.months[i].grossProfit));
      wL2 = Math.max(wL2, Math.abs(cheap.months[i].leakage - dear.months[i].leakage));
    }
    var costRatio = dear.cohorts[5].acquisitionCost / cheap.cohorts[5].acquisitionCost;
    ok('STATE · Sunk acquisition cost never reduces forward ARR, gross profit or retention',
       wA2 < EPS && wG2 < EPS && wL2 < EPS && Math.abs(costRatio - 2) < 1e-9,
       'doubling cost per cohort (' + costRatio.toFixed(2) + '×) at identical New ARR leaves ARR, GP and ' +
       'leakage unchanged to €' + Math.max(wA2, wG2, wL2).toExponential(1) + '; only the current-period S&M expense moves');

    /* S11. The measurement layer stays intact under age-dependent laws */
    var wB2 = 0, wI2 = 0;
    for (i = T0; i <= HZ; i++) {
      var kk = K.measureR12M(pY, i);
      wB2 = Math.max(wB2, Math.abs(kk.bridgeResidual)); wI2 = Math.max(wI2, Math.abs(kk.identityResidual));
    }
    ok('STATE · KPI bridge and the GRR + expansion = NRR identity still hold under age-dependent laws',
       wB2 < EPS && wI2 < 1e-12,
       'max bridge residual €' + wB2.toExponential(2) + ', max identity residual ' + wI2.toExponential(2) +
       ' across ' + (HZ - T0 + 1) + ' measurement dates');

    /* S13. The flat-law closed forms are band-conditional — stated, not hidden */
    var bandedRun = E.run(Aband), flatRun = E.run(A);
    var isFlat = bandedRun.bandsAreFlat;
    var kBand = K.measureR12M(bandedRun, 12), kFlat = K.measureR12M(flatRun, 12);
    var closedForm = Aband.persistenceAnnual * (1 + Aband.expansionCoefficientAnnual);
    var conditional = isFlat
      ? Math.abs(kFlat.nrr - closedForm) < 1e-9
      : Math.abs(kBand.nrr - closedForm) > 1e-9;
    ok('STATE · The flat-law closed forms (NRR = P×(1+X), the calibration inverse) hold only under flat bands',
       conditional,
       isFlat
         ? 'bands are flat: measured NRR ' + (kFlat.nrr * 100).toFixed(6) + '% = P×(1+X) ' + (closedForm * 100).toFixed(6) + '%'
         : 'bands are NOT flat: measured NRR ' + (kBand.nrr * 100).toFixed(4) + '% ≠ P×(1+X) ' +
           (closedForm * 100).toFixed(4) + '% — as it must be, since a banded world has no single (P, X)');

    /* S12. v0.2 acquisition physics survive outside the zero-acquisition experiment */
    var withAcq = port(PROFILE, 0, A.sm);
    ok('STATE · v0.2 acquisition physics remain intact when acquisition is re-enabled under age bands',
       Math.abs(withAcq.derived.newARRPerMonth - A.sm / A.cacPerARR) < EPS &&
       Math.abs(withAcq.derived.cacPaybackMonths - (A.cacPerARR * 12) / A.grossMargin) < 1e-9,
       'New ARR €' + (withAcq.derived.newARRPerMonth / 1e6).toFixed(3) + 'm/mo = S&M ÷ cacPerARR; payback ' +
       withAcq.derived.cacPaybackMonths.toFixed(2) + ' months = cacPerARR × 12 ÷ GM');

    /* ================================================================ *
     * v1.1 — EXPANSION ECONOMICS. One cost line, no ARR effect.
     * ================================================================ */
    function maxOver(r1, r2, f) { var w = 0; for (var q = 0; q < r1.months.length; q++) w = Math.max(w, Math.abs(f(r1.months[q]) - f(r2.months[q]))); return w; }
    var C = 0.25;
    var costOn = E.run(Object.assign({}, A, { expansionCostPerARR: C }));

    /* X1. The null world carries a zero line, and the P&L identity holds with the line in it */
    var x1line = 0, x1id = 0;
    BASE.months.forEach(function (m) {
      x1line = Math.max(x1line, Math.abs(m.expansionCost));
      x1id = Math.max(x1id, Math.abs(m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.ebita));
    });
    ok('EXP-COST · null world: expansionCostPerARR = 0 carries a €0 realisation-cost line and EBITA = GP − S&M − R&D − G&A − cost',
       A.expansionCostPerARR === 0 && x1line === 0 && x1id < EPS,
       'max cost line €' + x1line.toExponential(1) + ', max P&L residual €' + x1id.toExponential(1));

    /* X2. A positive cost touches no ARR state and no retention measure */
    var x2arr = Math.max(maxOver(BASE, costOn, function (m) { return m.closingARR; }),
                         maxOver(BASE, costOn, function (m) { return m.expansion; }),
                         maxOver(BASE, costOn, function (m) { return m.leakage; }),
                         maxOver(BASE, costOn, function (m) { return m.newARR; }));
    var x2kpi = 0;
    for (i = 12; i <= BASE.horizon; i++) {
      var ka = K.measureR12M(BASE, i), kb = K.measureR12M(costOn, i);
      x2kpi = Math.max(x2kpi, Math.abs(ka.grr - kb.grr), Math.abs(ka.expansionRate - kb.expansionRate), Math.abs(ka.nrr - kb.nrr));
    }
    ok('EXP-COST · a positive realisation cost leaves closing ARR, New, Expansion, Leakage and every R12M measure untouched',
       x2arr === 0 && x2kpi === 0,
       'max ARR-state delta €' + x2arr.toExponential(1) + ', max KPI delta ' + x2kpi.toExponential(1) + ' at cost ' + C + '× per €1 of expansion ARR');

    /* X3. The line is exactly expansion ARR × coefficient, company = Σ cohorts, and cash moves by exactly that */
    var x3line = 0, x3sum = 0, x3cash = 0, cumCost = 0;
    costOn.months.forEach(function (m, q) {
      x3line = Math.max(x3line, Math.abs(m.expansionCost - m.expansion * C));
      var s = 0; costOn.cohorts.forEach(function (c) { var r = K.rowAt(c, m.t); if (r) s += r.expansionCost; });
      x3sum = Math.max(x3sum, Math.abs(s - m.expansionCost));
      cumCost += m.expansionCost;
      x3cash = Math.max(x3cash, Math.abs((BASE.months[q].cashClosing - m.cashClosing) - cumCost));
    });
    ok('EXP-COST · cost line = expansion ARR × expansionCostPerARR = Σ cohort cost, and Cash falls by exactly the cumulative line',
       x3line < EPS && x3sum < EPS && x3cash < EPS,
       'max |line − exp×c| €' + x3line.toExponential(1) + ', max cohort-sum residual €' + x3sum.toExponential(1) +
       ', max cash residual €' + x3cash.toExponential(1) + '; cumulative cost €' + (cumCost / 1e6).toFixed(2) + 'm');

    /* X4. THE REQUIRED PROOF — matched measured-NRR pair. Same ARR path, same NRR;
       with c = 0 the v0.2 equivalence holds, with c > 0 only the economics diverge. */
    var TNx = 0.96 * 1.10;
    var cRx = K.calibrate(0.96, TNx - 0.96), cXx = K.calibrate(0.90, TNx - 0.90);
    var aR = { persistenceAnnual: cRx.persistenceAnnual, expansionCoefficientAnnual: cRx.expansionCoefficientAnnual };
    var aX = { persistenceAnnual: cXx.persistenceAnnual, expansionCoefficientAnnual: cXx.expansionCoefficientAnnual };
    var R0 = E.run(Object.assign({}, A, aR)), X0 = E.run(Object.assign({}, A, aX));
    var Rc = E.run(Object.assign({}, A, aR, { expansionCostPerARR: C })), Xc = E.run(Object.assign({}, A, aX, { expansionCostPerARR: C }));
    var tie0 = Math.max(maxOver(R0, X0, function (m) { return m.closingARR; }), maxOver(R0, X0, function (m) { return m.cashClosing; }));
    var arrC = maxOver(Rc, Xc, function (m) { return m.closingARR; });
    var nrrC = 0; for (i = 12; i <= Rc.horizon; i++) nrrC = Math.max(nrrC, Math.abs(K.measureR12M(Rc, i).nrr - K.measureR12M(Xc, i).nrr));
    var cashC = Rc.months[Rc.horizon - 1].cashClosing - Xc.months[Xc.horizon - 1].cashClosing;
    var costR = Rc.months[Rc.horizon - 1].cumulative.expansionCost, costX = Xc.months[Xc.horizon - 1].cumulative.expansionCost;
    var expR = Rc.months[Rc.horizon - 1].cumulative.expansion, expX = Xc.months[Xc.horizon - 1].cumulative.expansion;
    var linear = Math.abs(cashC - C * (expX - expR));
    ok('EXP-COST · MATCHED-NRR: with cost 0 the pair stays identical (ARR and cash); with cost > 0 ARR and NRR stay identical while cash diverges',
       tie0 < EPS && arrC < EPS && nrrC < 1e-12 && cashC > 1e5 && costX > costR,
       'c=0: max |R−X| €' + tie0.toExponential(1) + ' · c=' + C + ': max ΔARR €' + arrC.toExponential(1) + ', max ΔNRR ' + nrrC.toExponential(1) +
       ', X ends €' + (cashC / 1e6).toFixed(2) + 'm poorer; realisation cost R €' + (costR / 1e6).toFixed(2) + 'm vs X €' + (costX / 1e6).toFixed(2) + 'm');
    ok('EXP-COST · MATCHED-NRR: the cash gap is exactly linear in the cost — Δending cash = c × Δcumulative expansion',
       linear < EPS, 'residual €' + linear.toExponential(1) + ' on a gap of €' + (cashC / 1e6).toFixed(2) + 'm');

    /* ================================================================ *
     * v1.2 — BOUNDED ACQUISITION. A saturating response, one parameter.
     * ================================================================ */
    var CAP = 2000000;
    /* B1. Null reproduces the linear law, byte-for-byte and by formula */
    var nullRun = E.run(Object.assign({}, A, { maxMonthlyNewARR: null }));
    var b1same = JSON.stringify(nullRun.months) === JSON.stringify(BASE.months);
    var b1f = 0;
    [[A.sm, A.cacPerARR], [A.sm * 3, A.cacPerARR], [500000, 1.5], [2500000, 0.8]].forEach(function (pr) {
      b1f = Math.max(b1f, Math.abs(E.newARRPerMonth(Object.assign({}, A, { sm: pr[0], cacPerARR: pr[1], maxMonthlyNewARR: null })) - pr[0] / pr[1]));
    });
    ok('ACQ-BOUND · null (maxMonthlyNewARR = null) reproduces the linear law: run byte-identical, New ARR = S&M ÷ cacPerARR at every probe',
       A.maxMonthlyNewARR === null && b1same && b1f < EPS, 'byte-identical: ' + b1same + ', max formula deviation €' + b1f.toExponential(1));

    /* B2/B3/B4. Monotone, concave, bounded — on a sweep */
    var sweep = [], mono = true, concave = true, bounded = true, margWorse = true;
    for (var sm2 = 0; sm2 <= 10e6; sm2 += 250000) sweep.push(E.acquisitionResponse(Object.assign({}, A, { sm: sm2, maxMonthlyNewARR: CAP })));
    for (i = 1; i < sweep.length; i++) {
      if (sweep[i].newARR < sweep[i - 1].newARR - 1e-9) mono = false;
      if (sweep[i].dNewARRdSM > sweep[i - 1].dNewARRdSM + 1e-15) concave = false;
      if (sweep[i].newARR > CAP + 1e-6) bounded = false;
      if (sweep[i].marginalCAC <= sweep[i].averageCAC) margWorse = false;
    }
    var atInf = E.acquisitionResponse(Object.assign({}, A, { sm: 1e12, maxMonthlyNewARR: CAP })).newARR;
    ok('ACQ-BOUND · New ARR is monotonic in S&M and never exceeds the capacity; at extreme spend it approaches the capacity',
       mono && bounded && atInf > 0.999 * CAP && atInf <= CAP,
       'sweep €0–10m/mo in 40 steps: monotone ' + mono + ', bounded ' + bounded + '; N(€1e12) = ' + (atInf / CAP * 100).toFixed(4) + '% of capacity');
    ok('ACQ-BOUND · marginal acquisition productivity dN/dS&M declines with spend, so marginal CAC exceeds average CAC at every S&M > 0',
       concave && margWorse,
       'dN/dS&M ' + sweep[1].dNewARRdSM.toFixed(4) + ' at €0.25m → ' + sweep[sweep.length - 1].dNewARRdSM.toFixed(4) + ' at €10m; ' +
       'at €' + (A.sm / 1e6).toFixed(2) + 'm: average CAC ' + sweep[Math.round(A.sm / 250000)].averageCAC.toFixed(3) + '×, marginal ' + sweep[Math.round(A.sm / 250000)].marginalCAC.toFixed(3) + '×');

    /* B5. Low-spend limit is the v1.0 law; the analytical derivative is the law's own derivative */
    var lowSm = 1000, low = E.acquisitionResponse(Object.assign({}, A, { sm: lowSm, maxMonthlyNewARR: CAP }));
    var lowRel = Math.abs(low.newARR - lowSm / A.cacPerARR) / (lowSm / A.cacPerARR);
    var fdWorst = 0;
    [300000, 900000, 2700000, 8100000].forEach(function (s) {
      var h = 1, up = E.newARRPerMonth(Object.assign({}, A, { sm: s + h, maxMonthlyNewARR: CAP })), dn = E.newARRPerMonth(Object.assign({}, A, { sm: s - h, maxMonthlyNewARR: CAP }));
      var fd = (up - dn) / (2 * h), an = E.acquisitionResponse(Object.assign({}, A, { sm: s, maxMonthlyNewARR: CAP })).dNewARRdSM;
      fdWorst = Math.max(fdWorst, Math.abs(fd - an) / an);
    });
    ok('ACQ-BOUND · as S&M → 0 the response is S&M ÷ cacPerARR (the v1.0 law); the closed-form dN/dS&M matches a central difference',
       lowRel < 1e-3 && fdWorst < 1e-6,
       'at €1k/mo the response is within ' + (lowRel * 100).toFixed(4) + '% of the linear law; derivative vs finite difference worst rel err ' + fdWorst.toExponential(2));

    /* B6/B7. The bound changes new-cohort creation only; retention measures are unmoved by S&M under it */
    var capRun = E.run(Object.assign({}, A, { maxMonthlyNewARR: CAP })), capTen = E.run(Object.assign({}, A, { sm: A.sm * 10, maxMonthlyNewARR: CAP }));
    var baseRowsSame = JSON.stringify(capRun.cohorts[0].rows) === JSON.stringify(BASE.cohorts[0].rows);
    var b7 = 0;
    for (i = 12; i <= BASE.horizon; i++) {
      var k1 = K.measureR12M(capRun, i), k2 = K.measureR12M(capTen, i);
      b7 = Math.max(b7, Math.abs(k1.grr - k2.grr), Math.abs(k1.expansionRate - k2.expansionRate), Math.abs(k1.nrr - k2.nrr));
    }
    var stampOK = capRun.cohorts.slice(1).every(function (c) {
      return Math.abs(c.cacPerARRAtCreation - capRun.derived.acquisition.averageCAC) < 1e-9 && c.cacCoefficientAtCreation === A.cacPerARR &&
             Math.abs(c.acquisitionCost - c.initialARR * c.cacPerARRAtCreation) < EPS;
    });
    ok('ACQ-BOUND · the bound changes only new-cohort creation: the opening cohort\'s rows are byte-identical, and 10× S&M under the bound leaves GRR/expansion/NRR unchanged',
       baseRowsSame && b7 < 1e-12 && capRun.derived.newARRPerMonth < BASE.derived.newARRPerMonth,
       'opening cohort identical: ' + baseRowsSame + '; max KPI delta ' + b7.toExponential(1) + '; New ARR €' +
       (capRun.derived.newARRPerMonth / 1e6).toFixed(3) + 'm/mo under a €' + (CAP / 1e6).toFixed(1) + 'm capacity vs €' + (BASE.derived.newARRPerMonth / 1e6).toFixed(3) + 'm linear');
    ok('ACQ-BOUND · cohort provenance stamps the REALISED cost per €1 of ARR (= average CAC) and the coefficient separately; cost = initial ARR × realised CAC',
       stampOK, capRun.cohorts[1].cacPerARRAtCreation.toFixed(4) + '× realised vs ' + A.cacPerARR + '× coefficient');

    /* ================================================================ *
     * v1.3 — ACQUISITION TIMING. Explicit pending state, one lag parameter.
     * ================================================================ */
    var LAGM = 3, lagRun = E.run(Object.assign({}, A, { acquisitionLagMonths: LAGM }));
    /* L1. Lag 0 reproduces the prior world */
    var zeroLag = E.run(Object.assign({}, A, { acquisitionLagMonths: 0 }));
    var l1 = JSON.stringify(zeroLag.months) === JSON.stringify(BASE.months) && JSON.stringify(zeroLag.cohorts) === JSON.stringify(BASE.cohorts);
    ok('ACQ-LAG · null (acquisitionLagMonths = 0) reproduces the same-month world byte-for-byte',
       A.acquisitionLagMonths === 0 && l1, 'months and cohorts byte-identical: ' + l1);

    /* L2. No cohort before maturity; provenance records the spend month */
    var early = lagRun.months.slice(0, LAGM).every(function (m) { return m.newARR === 0; });
    var prov = lagRun.cohorts.slice(1).every(function (c) {
      return c.acquisitionMonth <= LAGM ? (c.initialARR === 0 && c.spendMonth === null)
                                        : (c.spendMonth === c.acquisitionMonth - LAGM && c.lagMonths === LAGM);
    });
    ok('ACQ-LAG · no New ARR enters the stock before its maturity date; each cohort records the month its spend was incurred and the lag it waited',
       early && prov && lagRun.months[LAGM].newARR > 0,
       'months 1–' + LAGM + ' realise €0; month ' + (LAGM + 1) + ' realises €' + (lagRun.months[LAGM].newARR / 1e6).toFixed(3) + 'm from month-1 spend');

    /* L3. S&M is expensed in the spend month — the only P&L difference vs no-lag is the missing gross profit */
    var l3sm = 0, l3 = 0;
    for (i = 0; i < BASE.horizon; i++) {
      l3sm = Math.max(l3sm, Math.abs(lagRun.months[i].sm - BASE.months[i].sm));
      l3 = Math.max(l3, Math.abs((BASE.months[i].ebita - lagRun.months[i].ebita) - (BASE.months[i].grossProfit - lagRun.months[i].grossProfit)));
    }
    ok('ACQ-LAG · S&M hits EBITA and cash in the month it is spent (identical S&M line every month); the lag changes only when gross profit arrives',
       l3sm === 0 && l3 < EPS, 'S&M line delta €' + l3sm.toExponential(1) + '; (ΔEBITA − ΔGP) residual €' + l3.toExponential(1));

    /* L4/L5. Neither duplicated nor lost; pending reconciles every month; horizon boundary is honest */
    var lawTotal = lagRun.derived.newARRPerMonth * lagRun.horizon, realisedTotal = lagRun.months[lagRun.horizon - 1].cumulative.newARR;
    var l4 = Math.abs(lawTotal - realisedTotal - lagRun.pendingAtHorizon.newARR);
    var l4s = Math.abs(lagRun.months[lagRun.horizon - 1].cumulative.sm - lagRun.cohorts.reduce(function (s, c) { return s + (c.acquisitionCost || 0); }, 0) - lagRun.pendingAtHorizon.spend);
    var l5 = 0;
    lagRun.months.forEach(function (m) {
      var p = 0; lagRun.acquisitionLedger.forEach(function (e) { if (e.spendMonth <= m.t && e.matureMonth > m.t) p += e.newARR; });
      l5 = Math.max(l5, Math.abs(p - m.pendingNewARR));
    });
    var beyond = lagRun.acquisitionLedger.every(function (e) { return e.realised === (e.matureMonth <= lagRun.horizon); });
    ok('ACQ-LAG · acquisition is neither duplicated nor lost: law output = realised + pending at the horizon (ARR and spend), pending reconciles to the ledger every month',
       l4 < EPS && l4s < EPS && l5 < EPS && beyond,
       'ARR residual €' + l4.toExponential(1) + ', spend residual €' + l4s.toExponential(1) + ', max pending residual €' + l5.toExponential(1) +
       '; ' + lagRun.pendingAtHorizon.entries.length + ' months of spend (€' + (lagRun.pendingAtHorizon.spend / 1e6).toFixed(2) + 'm) mature beyond M' + lagRun.horizon + ' and never appear inside it');

    /* L6/L7. Retention of created cohorts is unchanged, and cohorts still sum to the company */
    var l6 = 0;
    for (var kk2 = 1; kk2 + LAGM < BASE.cohorts.length; kk2++) {
      var cb = BASE.cohorts[kk2], cl2 = lagRun.cohorts[kk2 + LAGM];
      for (var r2 = 0; r2 < cl2.rows.length && r2 < cb.rows.length; r2++) {
        l6 = Math.max(l6, Math.abs(cl2.rows[r2].closingARR - cb.rows[r2].closingARR), Math.abs(cl2.rows[r2].leakage - cb.rows[r2].leakage));
      }
    }
    var l7 = 0;
    for (i = 1; i <= lagRun.horizon; i++) {
      var s7 = E.cohortSnapshot(lagRun, i).reduce(function (s, c) { return s + c.currentARR; }, 0);
      l7 = Math.max(l7, Math.abs(s7 - lagRun.months[i - 1].closingARR));
    }
    ok('ACQ-LAG · a cohort created after the lag ages exactly as its same-month twin would (rows identical at every age); company ARR = Σ cohorts still',
       l6 < EPS && l7 < EPS, 'max row delta €' + l6.toExponential(1) + '; max cohort-sum residual €' + l7.toExponential(1));

    return out;
  }

  return { runAll: runAll };
});
