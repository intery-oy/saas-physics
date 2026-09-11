/*
 * SaaS Physics v1 — expansion cost (expansionCacPerARR).
 *
 * Null/0 = free expansion (prior). Finite c prices expansion ARR without
 * touching the ARR path.
 *
 *   EXPCAC-DEFAULT   omitted / null / 0 === free expansion
 *   EXPCAC-UI        v1 template exposes the slider next to cacPerARR
 *   EXPCAC-CASH      c=1 cuts ending cash by cumulative expansion ARR
 *
 * Run: node expansion-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('EXPCAC-DEFAULT', 'DEFAULT_ASSUMPTIONS.expansionCacPerARR is 0 (free)',
   A.expansionCacPerARR === 0, '');

var omit = E.run(A);
ok('EXPCAC-DEFAULT', 'default path has zero expansion cost every month',
   omit.months.every(function (m) { return Math.abs(m.expansionCost) < 1e-9; }),
   omit.months.length + ' months');

ok('EXPCAC-UI', 'v1 rail has Expansion CAC next to CAC / New ARR',
   tpl.indexOf("k:'expansionCacPerARR'") !== -1 &&
   tpl.indexOf('Expansion CAC / €1 Exp ARR') !== -1, '');

var paid = E.run(Object.assign({}, A, { expansionCacPerARR: 1 }));
var last = paid.months[paid.horizon - 1];
var baseLast = omit.months[omit.horizon - 1];
ok('EXPCAC-CASH', 'c=1: ARR unchanged, ending cash = alias − cumulative expansion',
   Math.abs(last.closingARR - baseLast.closingARR) < 1e-6 &&
   Math.abs(last.cashClosing - (baseLast.cashClosing - last.cumulative.expansion)) < 1e-6,
   'cash cut €' + (last.cumulative.expansion / 1e6).toFixed(2) + 'm');

console.log('\nSaaS Physics v1 — Expansion cost\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' expansion-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
