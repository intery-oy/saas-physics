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

/* Two, not four. Each suite drives a full Chromium against a 670 KB page that
   parses and runs the engine on load; four at a time saturated a laptop and
   made timing-sensitive assertions fail for reasons that had nothing to do with
   the product (a canvas captured a frame early, a clock starved mid-hold).
   Raise it with ACCEPT_JOBS on a machine with cores to spare. */
var JOBS = Math.max(1, parseInt(process.env.ACCEPT_JOBS, 10) || 2);
var TIMEOUT = Math.max(30, parseInt(process.env.ACCEPT_TIMEOUT, 10) || 180) * 1000;

var only = process.argv.slice(2);
var suites = fs.readdirSync(__dirname)
  .filter(function (f) { return /-accept\.js$/.test(f); })
  .filter(function (f) { return !only.length || only.some(function (o) { return f.indexOf(o) === 0; }); })
  .sort();

if (!suites.length) { console.error('no suites match ' + only.join(' ')); process.exit(2); }

/* A suite that measures elapsed time cannot share a machine with three
   browsers: it declares @accept-serial and runs alone, after the rest. */
var serial = suites.filter(function (f) {
  return /@accept-serial/.test(fs.readFileSync(path.join(__dirname, f), 'utf8').slice(0, 4096));
});
var parallel = suites.filter(function (f) { return serial.indexOf(f) < 0; });

var results = [];
var queue = parallel.slice();
var started = Date.now();

function runOne(file, done, attempt) {
  attempt = attempt || 1;
  var t0 = Date.now();
  execFile(process.execPath, [path.join(__dirname, file)], { cwd: __dirname, timeout: TIMEOUT, maxBuffer: 32 * 1024 * 1024 },
    function (err, stdout, stderr) {
      var secs = (Date.now() - t0) / 1000;
      var m = /(\d+) \/ (\d+) [\w-]+ checks passed/.exec(stdout || '');
      var timedOut = err && err.killed;
      var failed = timedOut || (err && err.code !== 0) || !m || +m[1] !== +m[2];
      /* One retry, reported as FLAKY, never as a pass. A suite that fails twice
         fails the run. This exists because viewing-accept's pixel comparison has
         a pre-existing ~25% failure rate (measured on unmodified 3a83285); it is
         a way to keep a real gate usable, not a way to make red look green. */
      if (failed && attempt === 1) return runOne(file, done, 2);
      results.push({
        file: file, secs: secs, flaky: attempt > 1 && !failed,
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
  if (!queue.length) return drain();
  var f = queue.shift();
  runOne(f, function () { pump(); drain(); });
}

/* when the parallel batch is done, the serial ones, one at a time */
function drain() {
  if (results.length !== parallel.length + serialDone) return;
  if (serialDone < serial.length) {
    var f = serial[serialDone++];
    return runOne(f, drain);
  }
  if (results.length === suites.length) report();
}
var serialDone = 0;

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
      (r.flaky ? '   FLAKY (passed on retry)' : '') +
      (serial.indexOf(r.file) >= 0 ? '   (alone)' : '') +
      (r.code === 'TIMEOUT' ? '   TIMED OUT' : '') + (r.crashed ? '   CRASHED' : ''));
  });
  console.log('-'.repeat(90));
  bad.forEach(function (r) {
    r.fails.forEach(function (l) { console.log('  ' + r.file.replace('-accept.js', '') + ' · ' + l); });
    if (r.crashed && r.stderr) console.log('  ' + r.file + ' · ' + r.stderr.split('\n')[0]);
  });
  if (bad.length) console.log('-'.repeat(90));
  var flakes = results.filter(function (r) { return r.flaky; });
  if (flakes.length) console.log('  FLAKY (failed once, passed on retry): ' +
    flakes.map(function (r) { return r.file.replace('-accept.js', ''); }).join(', '));
  console.log(pass + ' / ' + total + ' assertions across ' + results.length + ' suites  ·  ' +
    ((Date.now() - started) / 1000).toFixed(1) + 's wall, ' + JOBS + ' at a time' +
    (serial.length ? ' + ' + serial.length + ' alone' : ''));
  console.log('');
  process.exitCode = bad.length ? 1 : 0;
}

for (var i = 0; i < JOBS; i++) pump();
