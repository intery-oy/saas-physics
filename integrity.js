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
    var A = Object.assign({}, Aband); delete A.bands; delete A.acqSaturationSpend; delete A.smCashReserve; delete A.billingAdvanceMonths;
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
    ok('ACQ · New ARR generator never reads CAC payback or GM — only S&M, cacPerARR, and optional saturation',
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
     * v0.4 — acquisition nonlinearity (Finding 10). One bound. Null
     * default must reproduce the v0.3 linear generator exactly.
     * ================================================================ */
    var rOmit = E.run(A);
    var rNull = E.run(Object.assign({}, A, { acqSaturationSpend: null }));
    var rZero = E.run(Object.assign({}, A, { acqSaturationSpend: 0 }));
    var rInf  = E.run(Object.assign({}, A, { acqSaturationSpend: Infinity }));
    var sameOmitNull = JSON.stringify(rOmit.months) === JSON.stringify(rNull.months) &&
                       JSON.stringify(rOmit.cohorts) === JSON.stringify(rNull.cohorts);
    var sameZero = JSON.stringify(rOmit.months) === JSON.stringify(rZero.months);
    var sameInf  = JSON.stringify(rOmit.months) === JSON.stringify(rInf.months);
    var sameBase = JSON.stringify(rOmit.months) === JSON.stringify(BASE.months) &&
                   JSON.stringify(rOmit.cohorts) === JSON.stringify(BASE.cohorts);
    ok('NL · Null / omitted / 0 / ∞ saturation is bit-identical to the v0.3 linear generator',
       sameOmitNull && sameZero && sameInf && sameBase,
       'omit≡null: ' + sameOmitNull + '; omit≡0: ' + sameZero + '; omit≡∞: ' + sameInf +
       '; omit≡BASE: ' + sameBase + ' over ' + rOmit.horizon + ' months and ' + rOmit.cohorts.length + ' cohorts');

    var wLin = 0;
    rOmit.months.forEach(function (m) {
      wLin = Math.max(wLin, Math.abs(m.newARR - A.sm / A.cacPerARR));
    });
    ok('NL · Default New ARR equals S&M ÷ cacPerARR on every month (the linear formula, exactly)',
       wLin < EPS && rOmit.derived.acqIsLinear === true && rOmit.derived.acqSaturationSpend === null,
       'max monthly deviation €' + wLin.toExponential(3) + '; acqIsLinear=' + rOmit.derived.acqIsLinear);

    var kSat = 1500000;
    var satA = Object.assign({}, A, { acqSaturationSpend: kSat });
    var satRun = E.run(satA);
    var nSatExpected = (kSat / A.cacPerARR) * (A.sm / (A.sm + kSat));
    ok('NL · Saturating New ARR = (k / cacPerARR) × S&M / (S&M + k) exactly',
       Math.abs(satRun.derived.newARRPerMonth - nSatExpected) < EPS &&
       satRun.derived.acqIsLinear === false &&
       Math.abs(satRun.derived.acqAMax - kSat / A.cacPerARR) < EPS,
       'New ARR €' + satRun.derived.newARRPerMonth.toFixed(2) + ' vs formula €' + nSatExpected.toFixed(2) +
       '; A_max €' + (satRun.derived.acqAMax / 1e6).toFixed(3) + 'm');

    var sat2 = E.run(Object.assign({}, A, { acqSaturationSpend: kSat, sm: A.sm * 2 }));
    var doubled = 2 * satRun.derived.newARRPerMonth;
    ok('NL · Doubling S&M under saturation does not double New ARR (the model can say stop)',
       sat2.derived.newARRPerMonth < doubled - 1 &&
       sat2.derived.newARRPerMonth > satRun.derived.newARRPerMonth &&
       sat2.months[0].sm === A.sm * 2,
       'S&M ×2 moves New ARR €' + (satRun.derived.newARRPerMonth / 1e6).toFixed(3) + 'm → €' +
       (sat2.derived.newARRPerMonth / 1e6).toFixed(3) + 'm (linear would be €' +
       (doubled / 1e6).toFixed(3) + 'm); spend itself doubles');

    var huge = E.run(Object.assign({}, A, { acqSaturationSpend: kSat, sm: kSat * 1000 }));
    var aMax = kSat / A.cacPerARR;
    ok('NL · As S&M grows, New ARR approaches A_max = k / cacPerARR and never exceeds it',
       huge.derived.newARRPerMonth < aMax &&
       (aMax - huge.derived.newARRPerMonth) / aMax < 0.002,
       'S&M = 1000×k → New ARR €' + huge.derived.newARRPerMonth.toFixed(2) +
       ' vs A_max €' + aMax.toFixed(2) + ' (gap ' +
       ((aMax - huge.derived.newARRPerMonth) / aMax * 100).toFixed(3) + '%)');

    var spends = [0.25, 0.5, 1, 2, 4].map(function (f) { return A.sm * f; });
    var Ns = spends.map(function (s) {
      return E.newARRPerMonth(Object.assign({}, A, { sm: s, acqSaturationSpend: kSat }));
    });
    var marg = [];
    for (i = 1; i < Ns.length; i++) marg.push((Ns[i] - Ns[i - 1]) / (spends[i] - spends[i - 1]));
    var decreasing = true;
    for (i = 1; i < marg.length; i++) if (!(marg[i] < marg[i - 1] - 1e-18)) decreasing = false;
    ok('NL · Marginal acquisition productivity is strictly decreasing in S&M',
       decreasing && marg[marg.length - 1] < marg[0],
       'marginal €ARR/€S&M at successive spend steps: ' +
       marg.map(function (g) { return g.toFixed(4); }).join(' → '));

    var satGM = E.run(Object.assign({}, satA, { grossMargin: A.grossMargin * 0.7 }));
    var wSatGM = Math.abs(satGM.derived.newARRPerMonth - satRun.derived.newARRPerMonth);
    ok('NL · Saturation does not reintroduce gross margin into New ARR (GM still changes only payback)',
       wSatGM < EPS && src.indexOf('cacPayback') === -1 && src.indexOf('grossMargin') === -1 &&
       satGM.derived.cacPaybackMonths > satRun.derived.cacPaybackMonths + 1e-9,
       'New ARR delta under GM cut €' + wSatGM.toExponential(3) +
       '; stated payback ' + satRun.derived.cacPaybackMonths.toFixed(2) + ' → ' +
       satGM.derived.cacPaybackMonths.toFixed(2) + ' months');

    var satStamp = satRun.cohorts.filter(function (c) { return c.acquisitionMonth > 0; })[0];
    ok('NL · Under saturation, stamped CAC is realized S&M ÷ New ARR and still equals cost / initialARR',
       satStamp &&
       Math.abs(satStamp.cacPerARRAtCreation - A.sm / satRun.derived.newARRPerMonth) < 1e-12 &&
       Math.abs(satStamp.acquisitionCost - satStamp.initialARR * satStamp.cacPerARRAtCreation) < EPS &&
       satStamp.cacPerARRAtCreation > A.cacPerARR + 1e-9,
       'stamp ' + satStamp.cacPerARRAtCreation.toFixed(4) + '× vs stated ' + A.cacPerARR.toFixed(2) +
       '×; cost reconciles to €' +
       Math.abs(satStamp.acquisitionCost - satStamp.initialARR * satStamp.cacPerARRAtCreation).toExponential(2));

    var satBig = E.run(Object.assign({}, A, { acqSaturationSpend: kSat, sm: A.sm * 10 }));
    var wSatK = 0;
    for (i = 12; i <= BASE.horizon; i++) {
      var ks = K.measureR12M(satRun, i), kb = K.measureR12M(satBig, i);
      wSatK = Math.max(wSatK, Math.abs(ks.grr - kb.grr), Math.abs(ks.expansionRate - kb.expansionRate), Math.abs(ks.nrr - kb.nrr));
    }
    ok('NL · Saturation does not contaminate retention KPIs (10× S&M leaves R12M GRR / expansion / NRR unchanged)',
       wSatK < 1e-12,
       'max KPI delta ' + wSatK.toExponential(3) + ' while New ARR moved €' +
       (satRun.derived.newARRPerMonth / 1e6).toFixed(3) + 'm → €' +
       (satBig.derived.newARRPerMonth / 1e6).toFixed(3) + 'm/mo');

    /* ================================================================ *
     * B1 — opening-state identity. Zero new physics: the engine already
     * accepted {openingARR, openingCash, openingCohorts[]}. These lock
     * the null default to DEFAULT_START.
     * ================================================================ */
    var explStart = E.run(A, { openingARR: 20000000, openingCash: 10000000, openingCohorts: null });
    var age0Start = E.run(A, { openingARR: 20000000, openingCash: 10000000, openingCohorts: [{ arr: 20000000, age: 0 }] });
    ok('OPEN · Omitted start / explicit DEFAULT_START / single age-0 cohort are bit-identical',
       JSON.stringify(BASE.months) === JSON.stringify(explStart.months) &&
       JSON.stringify(BASE.months) === JSON.stringify(age0Start.months),
       'omit≡explicit: ' + (JSON.stringify(BASE.months) === JSON.stringify(explStart.months)) +
       '; omit≡age-0: ' + (JSON.stringify(BASE.months) === JSON.stringify(age0Start.months)));

    var cashOnly = E.run(A, { openingARR: 20000000, openingCash: 25000000 });
    var wOpenA = 0;
    for (i = 0; i < BASE.horizon; i++) wOpenA = Math.max(wOpenA, Math.abs(BASE.months[i].closingARR - cashOnly.months[i].closingARR));
    ok('OPEN · Raising opening cash alone leaves the ARR path unchanged',
       wOpenA < EPS && Math.abs(cashOnly.months[0].cashOpening - 25000000) < EPS,
       'max ARR delta €' + wOpenA.toExponential(3) + '; M1 cash opening €' +
       (cashOnly.months[0].cashOpening / 1e6).toFixed(2) + 'm');

    var biggerBook = E.run(A, { openingARR: 30000000, openingCash: 10000000 });
    ok('OPEN · Raising opening ARR raises month-1 opening ARR one-for-one and does not change New ARR',
       Math.abs(biggerBook.months[0].openingARR - 30000000) < EPS &&
       Math.abs(biggerBook.derived.newARRPerMonth - BASE.derived.newARRPerMonth) < EPS,
       'M1 opening €' + (biggerBook.months[0].openingARR / 1e6).toFixed(2) +
       'm; New ARR still €' + (biggerBook.derived.newARRPerMonth / 1e6).toFixed(3) + 'm/mo');

    var mixFlat = E.run(A, { openingARR: 20000000, openingCash: 10000000,
      openingCohorts: [{ arr: 10000000, age: 0 }, { arr: 10000000, age: 24 }] });
    var wMixA = 0, wMixC = 0;
    for (i = 0; i < BASE.horizon; i++) {
      wMixA = Math.max(wMixA, Math.abs(BASE.months[i].closingARR - mixFlat.months[i].closingARR));
      wMixC = Math.max(wMixC, Math.abs(BASE.months[i].cashClosing - mixFlat.months[i].cashClosing));
    }
    ok('OPEN · Under flat laws a vintage mix at the same total ARR does not change the ARR or cash path',
       wMixA < EPS && wMixC < EPS,
       'max ARR €' + wMixA.toExponential(2) + '; max cash €' + wMixC.toExponential(2) +
       ' — maturity itself creates nothing when laws are flat');

    /* ================================================================ *
     * Cash constrains S&M. One coefficient: smCashReserve.
     * Null / omitted / Infinity = unconstrained (prior: S&M is spent in
     * full every month). Finite r ≥ 0: S&M ≤ max(0, cashOpening − r).
     * ================================================================ */
    var rResNull = E.run(Object.assign({}, A, { smCashReserve: null }));
    var rResOmit = E.run(A);
    var rResInf  = E.run(Object.assign({}, A, { smCashReserve: Infinity }));
    var rResNeg  = E.run(Object.assign({}, A, { smCashReserve: -1 }));
    ok('CASHSM · Null / omitted / ∞ / invalid reserve is bit-identical to unconstrained S&M',
       JSON.stringify(rResOmit.months) === JSON.stringify(rResNull.months) &&
       JSON.stringify(rResOmit.months) === JSON.stringify(rResInf.months) &&
       JSON.stringify(rResOmit.months) === JSON.stringify(rResNeg.months) &&
       rResOmit.derived.smIsUnconstrained === true && rResOmit.derived.smCashReserve === null,
       'omit≡null≡∞≡neg; smIsUnconstrained=' + rResOmit.derived.smIsUnconstrained);

    var alwaysFull = rResOmit.months.every(function (m) {
      return Math.abs(m.sm - A.sm) < EPS && m.smConstrained === false;
    });
    ok('CASHSM · Unconstrained path spends the intended S&M every month',
       alwaysFull, 'intended €' + (A.sm / 1e3).toFixed(0) + 'k/mo');

    var tight = E.run(Object.assign({}, A, { smCashReserve: 2000000, sm: 2500000 }),
      { openingARR: 20000000, openingCash: 3000000 });
    var boundHeld = tight.months.every(function (m) {
      var cap = Math.max(0, m.cashOpening - 2000000);
      return m.sm <= cap + EPS && m.sm <= 2500000 + EPS;
    });
    var cutSomewhere = tight.months.some(function (m) { return m.smConstrained; });
    ok('CASHSM · With a reserve, S&M never exceeds max(0, cashOpening − reserve) and is cut when cash is tight',
       boundHeld && cutSomewhere && tight.months[0].sm < 2500000 - EPS,
       'M1 S&M €' + (tight.months[0].sm / 1e3).toFixed(1) + 'k vs intended €2500k; cash opening €' +
       (tight.months[0].cashOpening / 1e6).toFixed(2) + 'm');

    var starved = E.run(Object.assign({}, A, { smCashReserve: 10000000, sm: 900000 }),
      { openingARR: 20000000, openingCash: 10000000 });
    ok('CASHSM · Reserve equal to opening cash forces S&M and New ARR to zero in month 1',
       starved.months[0].sm < EPS && starved.months[0].newARR < EPS,
       'M1 S&M €' + starved.months[0].sm.toFixed(2) + '; New ARR €' + starved.months[0].newARR.toFixed(2));

    ok('CASHSM · Cutting S&M does not change month-1 installed-base leakage or expansion (same opening book, same laws)',
       Math.abs(BASE.months[0].leakage - starved.months[0].leakage) < EPS &&
       Math.abs(BASE.months[0].expansion - starved.months[0].expansion) < EPS,
       'M1 leakage €' + (starved.months[0].leakage / 1e6).toFixed(3) + 'm; expansion €' +
       (starved.months[0].expansion / 1e6).toFixed(3) + 'm');

    /* ================================================================ *
     * Deferred revenue / billings. Null/0 = FCF aliased to EBITA (prior).
     * Finite N: FCF = EBITA + N × ΔMRR. ARR path unchanged.
     * ================================================================ */
    var rBillNull = E.run(Object.assign({}, A, { billingAdvanceMonths: null }));
    var rBillZero = E.run(Object.assign({}, A, { billingAdvanceMonths: 0 }));
    var aliasHeld = BASE.months.every(function (m) { return Math.abs(m.fcf - m.ebita) < EPS && Math.abs(m.deltaDeferred) < EPS; });
    ok('DR · Null / omitted / 0 billing term keeps FCF aliased to EBITA (the prior contract)',
       JSON.stringify(BASE.months) === JSON.stringify(rBillNull.months) &&
       JSON.stringify(BASE.months) === JSON.stringify(rBillZero.months) &&
       aliasHeld && BASE.derived.fcfEqualsEbita === true,
       'FCF=EBITA every month; omit≡null≡0');

    var prepaid = E.run(Object.assign({}, A, { billingAdvanceMonths: 12 }));
    var wDr = 0, wArr = 0, splitSomewhere = false;
    for (i = 0; i < BASE.horizon; i++) {
      var md = prepaid.months[i], mb = BASE.months[i];
      var expect = mb.ebita + 12 * (md.closingMRR - md.openingMRR);
      wDr = Math.max(wDr, Math.abs(md.fcf - expect), Math.abs(md.fcf - (md.ebita + md.deltaDeferred)));
      wArr = Math.max(wArr, Math.abs(md.closingARR - mb.closingARR));
      if (Math.abs(md.fcf - md.ebita) > 1) splitSomewhere = true;
    }
    ok('DR · Annual prepaid: FCF = EBITA + 12 × ΔMRR exactly, and FCF is not aliased to EBITA',
       wDr < EPS && splitSomewhere && prepaid.derived.fcfEqualsEbita === false,
       'max formula residual €' + wDr.toExponential(3) + '; M1 FCF €' +
       (prepaid.months[0].fcf / 1e3).toFixed(1) + 'k vs EBITA €' + (prepaid.months[0].ebita / 1e3).toFixed(1) + 'k');

    ok('DR · Billing term does not change the ARR path (cash definition only)',
       wArr < EPS, 'max ARR delta €' + wArr.toExponential(3));

    ok('DR · Prepaid growth is cash-generative: N=12 ending cash exceeds the EBITA-alias path',
       prepaid.months[BASE.horizon - 1].cashClosing > BASE.months[BASE.horizon - 1].cashClosing + 1,
       'ending cash €' + (prepaid.months[BASE.horizon - 1].cashClosing / 1e6).toFixed(2) + 'm vs alias €' +
       (BASE.months[BASE.horizon - 1].cashClosing / 1e6).toFixed(2) + 'm');

    var wCashId = 0;
    prepaid.months.forEach(function (m) {
      wCashId = Math.max(wCashId, Math.abs(m.cashOpening + m.fcf - m.cashClosing));
    });
    ok('DR · Cash still rolls: opening + FCF = closing under prepaid billings',
       wCashId < EPS, 'max residual €' + wCashId.toExponential(3));

    return out;
  }

  return { runAll: runAll };
});
