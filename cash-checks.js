/*
 * SaaS Physics v1 — cash constrains S&M (smCashReserve).
 *
 * Null default is the prior unconstrained contract. These lock that identity
 * and the v1 rail that exposes the reserve.
 *
 *   CASHSM-DEFAULT   omitted / null reserve === unconstrained S&M
 *   CASHSM-UI        v1 template exposes the reserve slider
 *   CASHSM-BOUND     finite reserve never spends through the floor
 *
 * Run: node cash-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('CASHSM-DEFAULT', 'DEFAULT_ASSUMPTIONS.smCashReserve is null (unconstrained)',
   A.smCashReserve === null, '');

var omit = E.run(A), expl = E.run(Object.assign({}, A, { smCashReserve: null }));
ok('CASHSM-DEFAULT', 'E.run(A) === E.run(A, reserve null) bit-identically',
   JSON.stringify(omit.months) === JSON.stringify(expl.months) &&
   JSON.stringify(omit.cohorts) === JSON.stringify(expl.cohorts) &&
   omit.derived.smIsUnconstrained === true,
   omit.months.length + ' months');

ok('CASHSM-UI', 'v1 rail has an S&M cash reserve slider (offeur, 0 → null)',
   tpl.indexOf("k:'smCashReserve'") !== -1 &&
   tpl.indexOf("f:'offeur'") !== -1 &&
   tpl.indexOf('S&M cash reserve') !== -1 &&
   /offeur/.test(tpl) &&
   tpl.indexOf('off · unconstrained') !== -1, '');

ok('CASHSM-UI', 'System map draws the cash→S&M link as present only when a reserve is set',
   tpl.indexOf("S&M stops at cash reserve") !== -1 &&
   tpl.indexOf('cash never constrains S&M') !== -1, '');

var bound = E.run(Object.assign({}, A, { smCashReserve: 1500000, sm: 2000000 }),
  { openingARR: 20000000, openingCash: 2500000 });
var held = bound.months.every(function (m) {
  return m.sm <= Math.max(0, m.cashOpening - 1500000) + 1e-6 && m.sm <= 2000000 + 1e-6;
});
ok('CASHSM-BOUND', 'every month respects S&M ≤ max(0, cashOpening − reserve)',
   held && bound.months[0].smConstrained && bound.months[0].sm < 2000000,
   'M1 S&M €' + (bound.months[0].sm / 1e3).toFixed(1) + 'k; intended €2000k');

console.log('\nSaaS Physics v1 — Cash constrains S&M\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' cash-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
