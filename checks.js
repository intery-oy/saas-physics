/* CLI wrapper — the assertions live in integrity.js so the browser runs the same ones. */
'use strict';
var I = require('./integrity.js');
var results = I.runAll();
var pass = results.filter(function (r) { return r.pass; }).length;
console.log('\nSaaS Physics — Prototype 0 integrity checks\n' + '='.repeat(80));
results.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
});
console.log('='.repeat(80));
console.log(pass + ' / ' + results.length + ' checks passed\n');
process.exit(pass === results.length ? 0 : 1);
