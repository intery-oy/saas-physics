/*
 * SaaS Physics v1 — age / vintage editor (item 6).
 *
 * Zero new physics. The engine already had three bands; only Scenario 6
 * set them. These lock the default-flat contract and the UI copy rule.
 *
 *   AGE-DEFAULT    omitted bands === flat scalars (engine identity)
 *   AGE-UI         v1 template exposes six tenure sliders
 *   AGE-COPY       editor copies band objects; Scenario 6 keeps SCEN6_BANDS
 *
 * Run: node age-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

var omit = E.run(A);
var expl = E.run(Object.assign({}, A, { bands: E.resolveBands(A) }));
ok('AGE-DEFAULT', 'explicit flat bands are bit-identical to omitted bands',
   JSON.stringify(omit.months) === JSON.stringify(expl.months) && omit.bandsAreFlat === true,
   omit.cohorts.length + ' cohorts');

ok('AGE-UI', 'v1 rail has a Tenure laws group and six band sliders',
   tpl.indexOf('Tenure laws') !== -1 &&
   tpl.indexOf('id="tenure"') !== -1 &&
   tpl.indexOf('function writeBand') !== -1 &&
   tpl.indexOf("var id='t-'+field.charAt(0)+i") !== -1 &&
   tpl.indexOf('E.BAND_NAMES.forEach') !== -1, '');

ok('AGE-COPY', 'editor copies bands and never assigns into SCEN6_BANDS',
   tpl.indexOf('function copyBand') !== -1 &&
   tpl.indexOf('displayedBands().map(copyBand)') !== -1 &&
   /bands:\s*SCEN6_BANDS/.test(tpl) &&
   tpl.indexOf('SCEN6_BANDS[') === -1, '');

ok('AGE-COPY', 'Scenario 6 / world locks the tenure sliders',
   tpl.indexOf('activeScenario.world') !== -1 &&
   tpl.indexOf("id='tenure-grp'") !== -1, '');

var STABLE = { p: 0.94, x: 0.14 }, RISKY = { p: 0.78, x: 0.06 };
function band(n, maxAge, r) {
  return { name: n, maxAgeExclusive: maxAge, persistenceAnnual: r.p, expansionCoefficientAnnual: r.x };
}
var PROFILE = [band('Early', 12, STABLE), band('Developing', 24, RISKY), band('Mature', Infinity, STABLE)];
var banded = E.run(Object.assign({}, A, { bands: PROFILE }));
ok('AGE-DEFAULT', 'a non-flat profile reports bandsAreFlat === false (attribution / calibrate refuse)',
   banded.bandsAreFlat === false, '');

console.log('\nSaaS Physics v1 — Age / vintage editor\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' age-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
