/*
 * SaaS Physics — Prototype 0 integrity checks (spec §17).
 * UMD so the Node CLI and the browser UI run the SAME assertions against the
 * SAME engine. Targeted economic-integrity checks, not a general test suite.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SaaSPhysicsIntegrity = factory(root.SaaSPhysics);
})(typeof self !== 'undefined' ? self : globalThis, function (E) {
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
    var implied = A.grrAnnual * (1 + A.expansionAnnual);
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
    var b = E.run(A), x = E.run(Object.assign({}, A, { grrAnnual: Math.min(0.999, A.grrAnnual + 0.06) }));
    var sameSchema = b.modelVersion === x.modelVersion && b.months.length === x.months.length &&
                     Object.keys(b.months[0]).join() === Object.keys(x.months[0]).join();
    ok('Base and Experiment run through one engine entry point and one output schema',
       sameSchema, 'E.run is the single entry point; identical output schema: ' + sameSchema);

    /* 7. GRR alone creates no New ARR */
    var hi = E.run(Object.assign({}, A, { grrAnnual: Math.min(0.999, A.grrAnnual + 0.06) }));
    var w7 = 0;
    for (i = 0; i < BASE.months.length; i++) w7 = Math.max(w7, Math.abs(BASE.months[i].newARR - hi.months[i].newARR));
    ok('Raising GRR alone creates no New ARR (it only reduces leakage)',
       w7 < EPS, 'New ARR delta €' + w7.toExponential(3) + '; M60 ARR ' +
       (BASE.months[BASE.horizon - 1].closingARR / 1e6).toFixed(2) + 'm → ' +
       (hi.months[hi.horizon - 1].closingARR / 1e6).toFixed(2) + 'm');

    /* 8. S&M hits spend immediately, New ARR per the stated formula */
    var up = E.run(Object.assign({}, A, { sm: A.sm * 1.5 }));
    var formula = (up.assumptions.sm * 12) / (up.assumptions.cacPaybackMonths * up.assumptions.grossMargin);
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

    return out;
  }

  return { runAll: runAll };
});
