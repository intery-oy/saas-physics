/*
 * SaaS Physics v1 — logo vs contraction (logoRetentionAnnual).
 *
 * Null default = no customer stock (prior). Finite logo retention splits
 * ARR leakage without moving the ARR path.
 *
 *   LOGO-DEFAULT   omitted / null / 0 === no customers
 *   LOGO-UI        v1 template exposes the logo-retention slider
 *   LOGO-SPLIT     when on, logoChurn + contraction = leakage
 *
 * Run: node logo-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('LOGO-DEFAULT', 'DEFAULT_ASSUMPTIONS.logoRetentionAnnual is null',
   A.logoRetentionAnnual === null, '');

var omit = E.run(A);
ok('LOGO-DEFAULT', 'default path has no customer stock',
   omit.derived.logoLayerOn === false &&
   omit.months.every(function (m) { return m.customersOpening === 0; }),
   omit.months.length + ' months');

ok('LOGO-UI', 'v1 rail has a Logo retention slider (offpct, 0 → null)',
   tpl.indexOf("k:'logoRetentionAnnual'") !== -1 &&
   tpl.indexOf("f:'offpct'") !== -1 &&
   tpl.indexOf('off · no logos') !== -1, '');

var on = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.90 }));
var split = on.months.every(function (m) {
  return Math.abs(m.logoChurn + m.contraction - m.leakage) < 1e-6;
});
var kpi = K.measureR12M(on, 12);
ok('LOGO-SPLIT', 'logoChurn + contraction = leakage, and R12M reports the split',
   split && kpi && Math.abs(kpi.logoChurn + kpi.contraction - kpi.leakage) < 1e-6 &&
   kpi.logoRetention !== null,
   'M1 customers ' + on.months[0].customersOpening.toFixed(0) +
   '; R12M logo retention ' + (kpi.logoRetention * 100).toFixed(2) + '%');

console.log('\nSaaS Physics v1 — Logo vs contraction\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' logo-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
