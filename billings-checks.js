/*
 * SaaS Physics v1 — deferred revenue / billings (billingAdvanceMonths).
 *
 * Null default keeps FCF aliased to EBITA (the prior contract). Finite N
 * is a cash definition only — the ARR path does not move.
 *
 *   DR-DEFAULT   omitted / null / 0 === FCF = EBITA
 *   DR-UI        v1 template exposes the prepaid-term slider
 *   DR-SPLIT     N=12 makes FCF ≠ EBITA and FCF = EBITA + 12×ΔMRR
 *
 * Run: node billings-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('DR-DEFAULT', 'DEFAULT_ASSUMPTIONS.billingAdvanceMonths is null (FCF=EBITA)',
   A.billingAdvanceMonths === null, '');

var omit = E.run(A);
ok('DR-DEFAULT', 'default path aliases FCF to EBITA every month',
   omit.derived.fcfEqualsEbita === true &&
   omit.months.every(function (m) { return Math.abs(m.fcf - m.ebita) < 1e-9; }),
   omit.months.length + ' months');

ok('DR-UI', 'v1 rail has a prepaid-term slider (offmo, 0 → null)',
   tpl.indexOf("k:'billingAdvanceMonths'") !== -1 &&
   tpl.indexOf("f:'offmo'") !== -1 &&
   tpl.indexOf('Prepaid term') !== -1 &&
   tpl.indexOf('off · FCF=EBITA') !== -1, '');

ok('DR-UI', 'waterfall prints EBITA, Δ deferred and FCF as separate steps',
   tpl.indexOf("label:'= EBITA'") !== -1 &&
   tpl.indexOf('deltaDeferred') !== -1 &&
   tpl.indexOf("label:'= FCF'") !== -1, '');

var pre = E.run(Object.assign({}, A, { billingAdvanceMonths: 12 }));
var formula = pre.months.every(function (m) {
  return Math.abs(m.fcf - (m.ebita + 12 * (m.closingMRR - m.openingMRR))) < 1e-6;
});
ok('DR-SPLIT', 'N=12: FCF = EBITA + 12×ΔMRR and FCF ≠ EBITA on a growing book',
   formula && Math.abs(pre.months[0].fcf - pre.months[0].ebita) > 1 &&
   pre.derived.fcfEqualsEbita === false,
   'M1 Δdeferred €' + (pre.months[0].deltaDeferred / 1e3).toFixed(1) + 'k');

console.log('\nSaaS Physics v1 — Deferred revenue / billings\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' billings-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
