/*
 * SaaS Physics v1 — B1+B2 opening-state controls and inverse calibration.
 *
 * Zero new physics. The engine already accepted a start object; kpi.js already
 * had calibrate(). These checks lock the null default and the UI contract:
 *
 *   OPEN-DEFAULT     omitted start === DEFAULT_START (engine identity)
 *   OPEN-UI          v1 template exposes opening ARR / cash / vintage mix
 *   CAL-UI           v1 template wires K.calibrate and refuses non-flat bands
 *   CAL-FLAT         applying calibrate() still reproduces target measured KPIs
 *
 * Run: node opening-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('OPEN-DEFAULT', 'E.DEFAULT_START is €20m ARR / €10m cash / null cohorts',
   E.DEFAULT_START.openingARR === 20000000 && E.DEFAULT_START.openingCash === 10000000 &&
   E.DEFAULT_START.openingCohorts === null, '');

var omit = E.run(A), expl = E.run(A, Object.assign({}, E.DEFAULT_START));
ok('OPEN-DEFAULT', 'E.run(A) === E.run(A, DEFAULT_START) bit-identically',
   JSON.stringify(omit.months) === JSON.stringify(expl.months) &&
   JSON.stringify(omit.cohorts) === JSON.stringify(expl.cohorts),
   omit.cohorts.length + ' cohorts');

ok('OPEN-UI', 'v1 rail has an Opening state group writing startFromOpen',
   tpl.indexOf('Opening state') !== -1 && tpl.indexOf('function startFromOpen') !== -1 &&
   tpl.indexOf("openRow('openingARR'") !== -1 && tpl.indexOf("openRow('openingCash'") !== -1 &&
   tpl.indexOf("openRow('w0'") !== -1 && tpl.indexOf("openRow('w12'") !== -1 && tpl.indexOf("openRow('w24'") !== -1, '');

ok('OPEN-UI', 'default opening path leaves expStart undefined (attribution / Scenario 6 stay comparable)',
   /if\(o\.openingARR===DEFAULT_UI_START\.openingARR/.test(tpl) &&
   tpl.indexOf('return undefined') !== -1, '');

ok('OPEN-UI', 'Scenario 6 / pair lock the opening sliders and keep their own construction',
   tpl.indexOf('activeScenario.world || activeScenario.pair') !== -1 &&
   tpl.indexOf('openingCohorts:[{arr:20000000, age:24}]') !== -1, '');

ok('CAL-UI', 'v1 surfaces K.calibrate via an Inverse calibration box',
   tpl.indexOf('Inverse calibration') !== -1 &&
   tpl.indexOf('K.calibrate') !== -1 &&
   tpl.indexOf('Set coefficients from measured KPIs') !== -1 &&
   tpl.indexOf('Coefficients, not reported KPIs') !== -1, '');

ok('CAL-UI', 'calibration is refused when bands are not flat (check 34)',
   tpl.indexOf('function calibrationAllowed') !== -1 &&
   tpl.indexOf('bandsAreFlat') !== -1 &&
   tpl.indexOf('Refused: bands are not flat') !== -1, '');

var cal = K.calibrate(0.90, 0.10);
var calRun = E.run(Object.assign({}, A, {
  persistenceAnnual: cal.persistenceAnnual,
  expansionCoefficientAnnual: cal.expansionCoefficientAnnual
}));
var mc = K.measureR12M(calRun, 12);
ok('CAL-FLAT', 'K.calibrate(90%, 10%) still reproduces those measured KPIs',
   Math.abs(mc.grr - 0.90) < 1e-9 && Math.abs(mc.expansionRate - 0.10) < 1e-9,
   'P=' + (cal.persistenceAnnual * 100).toFixed(4) + '% X=' + (cal.expansionCoefficientAnnual * 100).toFixed(4) +
   '% → GRR ' + (mc.grr * 100).toFixed(4) + '% exp ' + (mc.expansionRate * 100).toFixed(4) + '%');

var STABLE = { p: 0.94, x: 0.14 }, RISKY = { p: 0.78, x: 0.06 };
function band(n, maxAge, r) {
  return { name: n, maxAgeExclusive: maxAge, persistenceAnnual: r.p, expansionCoefficientAnnual: r.x };
}
var PROFILE = [band('Early', 12, STABLE), band('Developing', 24, RISKY), band('Mature', Infinity, STABLE)];
var banded = E.run(Object.assign({}, A, { bands: PROFILE }));
ok('CAL-FLAT', 'a banded world reports bandsAreFlat === false (the UI refuse gate)',
   banded.bandsAreFlat === false, '');

console.log('\nSaaS Physics v1 — Opening state + inverse calibration (B1+B2)\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' opening-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
