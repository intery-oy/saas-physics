/*
 * SaaS Physics — run the browser suites.
 *
 * `npm run accept` was a 21-term && chain: the first failure hid the other
 * twenty, and a hang blocked everything behind it. This runs them all, in
 * parallel, and reports every one.
 *
 *   node accept-run.js                 all suites
 *   node accept-run.js ledger laws     just those
 *   ACCEPT_JOBS=1 node accept-run.js   serially (for a flaky bisect)
 */
'use strict';
var fs = require('fs');
var path = require('path');
var execFile = require('child_process').execFile;

var JOBS = Math.max(1, parseInt(process.env.ACCEPT_JOBS, 10) || 4);
var TIMEOUT = Math.max(30, parseInt(process.env.ACCEPT_TIMEOUT, 10) || 180) * 1000;

var only = process.argv.slice(2);
var suites = fs.readdirSync(__dirname)
  .filter(function (f) { return /-accept\.js$/.test(f); })
  .filter(function (f) { return !only.length || only.some(function (o) { return f.indexOf(o) === 0; }); })
  .sort();

if (!suites.length) { console.error('no suites match ' + only.join(' ')); process.exit(2); }

var results = [];
var queue = suites.slice();
var started = Date.now();

function runOne(file, done) {
  var t0 = Date.now();
  execFile(process.execPath, [path.join(__dirname, file)], { cwd: __dirname, timeout: TIMEOUT, maxBuffer: 32 * 1024 * 1024 },
    function (err, stdout, stderr) {
      var secs = (Date.now() - t0) / 1000;
      var m = /(\d+) \/ (\d+) [\w-]+ checks passed/.exec(stdout || '');
      var timedOut = err && err.killed;
      results.push({
        file: file, secs: secs,
        pass: m ? +m[1] : 0, total: m ? +m[2] : 0,
        code: timedOut ? 'TIMEOUT' : (err ? (err.code === undefined ? 1 : err.code) : 0),
        fails: (stdout || '').split('\n').filter(function (l) { return /^ {2}FAIL {2}/.test(l); }).map(function (l) { return l.slice(8, 130); }),
        crashed: /CRASHED/.test(stdout || '') || /CRASHED/.test(stderr || ''),
        stderr: (stderr || '').slice(0, 400)
      });
      done();
    });
}

function pump() {
  if (!queue.length) return;
  var f = queue.shift();
  runOne(f, function () { pump(); if (results.length === suites.length) report(); });
}

function report() {
  results.sort(function (a, b) { return a.file < b.file ? -1 : 1; });
  var pass = 0, total = 0, bad = [];
  console.log('');
  results.forEach(function (r) {
    pass += r.pass; total += r.total;
    var okAll = r.code === 0 && r.pass === r.total && r.total > 0;
    if (!okAll) bad.push(r);
    console.log('  ' + (okAll ? 'PASS' : 'FAIL') + '  ' + r.file.replace('-accept.js', '').padEnd(18) +
      String(r.pass + '/' + r.total).padEnd(8) + r.secs.toFixed(1) + 's' +
      (r.code === 'TIMEOUT' ? '   TIMED OUT' : '') + (r.crashed ? '   CRASHED' : ''));
  });
  console.log('-'.repeat(90));
  bad.forEach(function (r) {
    r.fails.forEach(function (l) { console.log('  ' + r.file.replace('-accept.js', '') + ' · ' + l); });
    if (r.crashed && r.stderr) console.log('  ' + r.file + ' · ' + r.stderr.split('\n')[0]);
  });
  if (bad.length) console.log('-'.repeat(90));
  console.log(pass + ' / ' + total + ' assertions across ' + results.length + ' suites  ·  ' +
    ((Date.now() - started) / 1000).toFixed(1) + 's wall, ' + JOBS + ' at a time');
  console.log('');
  process.exitCode = bad.length ? 1 : 0;
}

for (var i = 0; i < JOBS; i++) pump();
