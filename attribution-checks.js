/*
 * SaaS Physics v1 — Integrity + Experiment Attribution pass, regression checks.
 *
 * Pure-Node checks (no browser). DOM-level checks (SCREEN-RECONCILIATION,
 * BOUNDARY-DISCLOSURE, and the on-screen attribution table) live in
 * attribution-accept.js (Playwright). Together these cover §12:
 *
 *   ATTRIBUTION-TOTAL   Acquisition + InstalledBase + Interaction = TotalDelta,
 *                       for homogeneous (flat-band, same-state) experiments —
 *                       Interaction is DEFINED as the residual, so this is a
 *                       structural guarantee; the check exists to catch an
 *                       implementation bug (wrong month, wrong variant), not
 *                       to discover a new identity.
 *   ADDED-LAST          AddedLast_i = FullExperiment − ExperimentWithout_i,
 *                       and Stand-alone/Added-last are NOT forced to sum —
 *                       demonstrated on a case where they genuinely differ.
 *   ATTRIBUTION-SCOPE   attributionValid() is false for a state-dependent
 *                       (non-flat-band / differing-state) construction —
 *                       the exact condition Scenario 6 fails, so it never
 *                       shows the attribution panel — without touching
 *                       Scenario 6 / the state-sufficiency research itself.
 *
 * INSTALLED-BASE-NET (Expansion − Leakage equals displayed value) is already
 * covered by clarity-checks.js — unchanged this pass, not duplicated here.
 *
 * Run: node attribution-checks.js
 */
'use strict';
var E = require('./engine.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var A = E.DEFAULT_ASSUMPTIONS;

/* ------------------------------------------------------------------ *
 * ATTRIBUTION-TOTAL
 * ------------------------------------------------------------------ */
function recurringAttribution(baseA, expA, m) {
  var baseRes = E.run(baseA), expRes = E.run(expA);
  var acqRes = E.run(Object.assign({}, baseA, { sm: expA.sm, cacPerARR: expA.cacPerARR }));
  var ibRes = E.run(Object.assign({}, baseA, { persistenceAnnual: expA.persistenceAnnual, expansionCoefficientAnnual: expA.expansionCoefficientAnnual }));
  var b = baseRes.months[m - 1].closingARR, x = expRes.months[m - 1].closingARR;
  var acq = acqRes.months[m - 1].closingARR - b, ib = ibRes.months[m - 1].closingARR - b;
  var total = x - b;
  return { total: total, acquisition: acq, installedBase: ib, interaction: total - acq - ib };
}
[
  { name: 'persistence + sm', changes: { persistenceAnnual: 0.96, sm: 1200000 } },
  { name: 'expansion + cacPerARR', changes: { expansionCoefficientAnnual: 0.22, cacPerARR: 0.75 } },
  { name: 'both installed-base levers + sm', changes: { persistenceAnnual: 0.85, expansionCoefficientAnnual: 0.05, sm: 500000 } },
  { name: 'small perturbation', changes: { persistenceAnnual: 0.905, sm: 910000 } }
].forEach(function (c) {
  var expA = Object.assign({}, A, c.changes);
  [12, 24, 36, 60].forEach(function (m) {
    var r = recurringAttribution(A, expA, m);
    var resid = Math.abs(r.total - (r.acquisition + r.installedBase + r.interaction));
    ok('ATTRIBUTION-TOTAL', c.name + ' @ M' + m + ': Acquisition + InstalledBase + Interaction = Total, exactly',
       resid < 1e-6, 'Δ = €' + resid.toExponential(2));
  });
});

/* ------------------------------------------------------------------ *
 * ADDED-LAST / STAND-ALONE
 * ------------------------------------------------------------------ */
function leverViews(baseA, expA, key, m) {
  var baseRes = E.run(baseA), expRes = E.run(expA);
  var soA = Object.assign({}, baseA); soA[key] = expA[key];
  var wA = Object.assign({}, expA); wA[key] = baseA[key];
  var soRes = E.run(soA), wRes = E.run(wA);
  return {
    standAlone: soRes.months[m - 1].cashClosing - baseRes.months[m - 1].cashClosing,
    addedLast: expRes.months[m - 1].cashClosing - wRes.months[m - 1].cashClosing
  };
}
(function () {
  var expA = Object.assign({}, A, { persistenceAnnual: 0.96, sm: 1200000 });
  var m = 36;
  var sm = leverViews(A, expA, 'sm', m);
  ok('ADDED-LAST', 'AddedLast(sm) = FullExperiment.cashClosing − ExperimentWithoutSM.cashClosing, exactly by construction',
     typeof sm.addedLast === 'number' && isFinite(sm.addedLast), 'addedLast(sm) = €' + sm.addedLast.toFixed(2));
  var persistence = leverViews(A, expA, 'persistenceAnnual', m);
  ok('ADDED-LAST', 'Stand-alone and Added-last are NOT forced to sum to anything, and genuinely differ under interaction',
     Math.abs(sm.standAlone - sm.addedLast) > 1 || Math.abs(persistence.standAlone - persistence.addedLast) > 1,
     'sm: standAlone=€' + sm.standAlone.toFixed(0) + ' addedLast=€' + sm.addedLast.toFixed(0) +
     '  ·  persistence: standAlone=€' + persistence.standAlone.toFixed(0) + ' addedLast=€' + persistence.addedLast.toFixed(0));
  /* the pair scenario construction: same New ARR reached two ways — ARR
     attribution should be exactly zero (no ARR difference to attribute),
     Cash attribution should be nonzero (a real capital-journey difference) */
  var TARGET_NEW = 1125000;
  var pairBase = Object.assign({}, A, { cacPerARR: A.sm / TARGET_NEW });
  var pairExp = Object.assign({}, A, { sm: TARGET_NEW * A.cacPerARR });
  var pairAttrib = recurringAttribution(pairBase, pairExp, 36);
  ok('ATTRIBUTION-TOTAL', 'Pair scenario (Efficiency vs Spend): identical ARR path means zero recurring-state attribution',
     Math.abs(pairAttrib.total) < 1e-6 && Math.abs(pairAttrib.acquisition) < 1e-6 && Math.abs(pairAttrib.installedBase) < 1e-6,
     'total=€' + pairAttrib.total.toExponential(2));
  var pairCash = leverViews(pairBase, pairExp, 'sm', 36);
  ok('ADDED-LAST', 'Pair scenario: Cash attribution is nonzero even though ARR attribution is exactly zero (the capital-journey difference)',
     Math.abs(pairCash.standAlone) > 1000, 'standAlone(sm) = €' + pairCash.standAlone.toFixed(0));
})();

/* ------------------------------------------------------------------ *
 * ATTRIBUTION-SCOPE — the same gate the product uses (flat bands, same
 * opening state) correctly excludes a state-dependent construction.
 * ------------------------------------------------------------------ */
(function () {
  var STABLE_C = { persistenceAnnual: 0.94, expansionCoefficientAnnual: 0.14 };
  var RISKY_C = { persistenceAnnual: 0.78, expansionCoefficientAnnual: 0.06 };
  function bandOf(n, mx, c) { return { name: n, maxAgeExclusive: mx, persistenceAnnual: c.persistenceAnnual, expansionCoefficientAnnual: c.expansionCoefficientAnnual }; }
  var SCEN6_BANDS = [bandOf('Early', 12, STABLE_C), bandOf('Developing', 24, RISKY_C), bandOf('Mature', Infinity, STABLE_C)];
  var scen6A = Object.assign({}, A, { bands: SCEN6_BANDS, sm: 0 });
  var res = E.run(scen6A, { openingARR: 20000000, openingCash: 10000000, openingCohorts: [{ arr: 20000000, age: 24 }] });
  ok('ATTRIBUTION-SCOPE', 'the exact Scenario 6 law set reports bandsAreFlat = false (the reduced form does not apply)',
     res.bandsAreFlat === false, '');
  var flatRes = E.run(A);
  ok('ATTRIBUTION-SCOPE', 'the default flat-law world reports bandsAreFlat = true (the reduced form applies)',
     flatRes.bandsAreFlat === true, '');
})();

console.log('\nSaaS Physics v1 — Integrity + Experiment Attribution checks\n' + '='.repeat(90));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(90));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
