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
    var A = Object.assign({}, E.DEFAULT_ASSUMPTIONS, assumptions || {});
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

    return out;
  }

  return { runAll: runAll };
});
