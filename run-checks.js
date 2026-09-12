/*
 * SaaS Physics — run every check suite in the repo.
 *
 * `npm run report` used to be a `&&` chain: it halted at the first failing
 * suite, so one break hid every suite after it, and seven suites were never
 * in the chain at all. This runs ALL of them, always to the end, collects the
 * results, prints one total, and exits nonzero if anything failed.
 *
 * Three kinds of entry:
 *   check    a pure-Node suite. Must exit 0. No dependencies.
 *   accept   a DOM/render suite needing playwright + Chromium. Skips itself
 *            (exit 0, "SKIP" on the first line) when playwright is absent;
 *            a skip is reported as a skip, never as a pass.
 *   study    a narrative run (scenarios, state sufficiency). Asserts nothing,
 *            but must still complete without throwing.
 *
 * Run: node run-checks.js  (or npm run report)
 *      node run-checks.js --quiet   totals only, suite output on failure
 */
'use strict';
var spawnSync = require('child_process').spawnSync;
var path = require('path');

var SUITES = [
  /* the economic core and every regression pass, in the order they were built */
  { file: 'checks.js', kind: 'check', note: 'economic / measurement / state / NL / OPEN integrity' },
  { file: 'opening-checks.js', kind: 'check', note: 'opening state + inverse calibration' },
  { file: 'cash-checks.js', kind: 'check', note: 'S&M cash reserve' },
  { file: 'billings-checks.js', kind: 'check', note: 'prepaid term' },
  { file: 'expansion-checks.js', kind: 'check', note: 'expansion CAC' },
  { file: 'logo-checks.js', kind: 'check', note: 'logo retention' },
  { file: 'age-checks.js', kind: 'check', note: 'tenure editor' },
  { file: 'notebook-checks.js', kind: 'check', note: 'Appendix table' },
  { file: 'cohorts-checks.js', kind: 'check', note: 'Cohorts v1' },
  { file: 'mrr-native-checks.js', kind: 'check', note: 'MRR-native engine refactor' },
  { file: 'basis-checks.js', kind: 'check', note: 'MRR/ARR reporting basis' },
  { file: 'clarity-checks.js', kind: 'check', note: 'clarity pass' },
  { file: 'attribution-checks.js', kind: 'check', note: 'integrity + experiment attribution' },
  { file: 'research-checks.js', kind: 'check', note: 'Phase 0/1 research' },
  { file: 'pack-checks.js', kind: 'check', note: 'assumption pack + leave-behind kit' },
  /* need playwright + Chromium; skip cleanly when absent */
  { file: 'clarity-accept.js', kind: 'accept', note: 'clarity DOM/render' },
  { file: 'attribution-accept.js', kind: 'accept', note: 'attribution DOM/render' },
  /* narrative studies — no assertions, but must still run clean */
  { file: 'scenarios.js', kind: 'study', note: 'Scenarios A–E and the 0.2 / 0.2.1 experiments' },
  { file: 'state-sufficiency.js', kind: 'study', note: 'v0.3 state sufficiency experiment' }
];

var quiet = process.argv.indexOf('--quiet') !== -1;
var W = 92;

/* Suites print their own tally as "N / M checks passed" (or "... passed").
   Read the LAST such line so a suite that mentions a ratio mid-run does not
   confuse the total. A suite with no tally contributes 0 to the check count
   and is still counted as a suite. */
function tallyOf(text) {
  var H = '[^\\S\\n]';   // horizontal space only — a tally never spans lines
  var re = new RegExp('(\\d+)' + H + '*\\/' + H + '*(\\d+)' + H + '+(?:[\\w-]+' + H + '+)*passed', 'g');
  var m, last = null;
  while ((m = re.exec(text)) !== null) last = m;
  return last ? { pass: Number(last[1]), total: Number(last[2]) } : null;
}

console.log('\nSaaS Physics — full check run\n' + '='.repeat(W));

var results = [];
SUITES.forEach(function (s) {
  var r = spawnSync(process.execPath, [path.join(__dirname, s.file)], {
    cwd: __dirname,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  });
  var output = (r.stdout || '') + (r.stderr || '');
  var skipped = s.kind === 'accept' && r.status === 0 && /^\s*SKIP\b/m.test(output);
  var failed = r.status !== 0 || r.error != null;
  var tally = skipped ? null : tallyOf(output);

  if (r.error) output += '\n' + String(r.error.message || r.error);

  if (!quiet || failed) {
    console.log('\n' + '-'.repeat(W) + '\n' + s.file + '  ·  ' + s.note + '\n' + '-'.repeat(W));
    process.stdout.write(output.replace(/^\n+/, '').replace(/\n*$/, '\n'));
  }

  results.push({
    file: s.file, kind: s.kind,
    state: failed ? 'FAIL' : (skipped ? 'SKIP' : 'PASS'),
    tally: tally,
    status: r.status
  });
});

console.log('\n' + '='.repeat(W));
var checksPassed = 0, checksTotal = 0;
var nPass = 0, nFail = 0, nSkip = 0;
results.forEach(function (r) {
  if (r.state === 'PASS') nPass++;
  else if (r.state === 'SKIP') nSkip++;
  else nFail++;
  if (r.tally) { checksPassed += r.tally.pass; checksTotal += r.tally.total; }
  var count = r.tally ? r.tally.pass + ' / ' + r.tally.total
            : (r.state === 'SKIP' ? 'playwright not installed' : '—');
  console.log('  ' + r.state + '  ' + pad(r.file, 26) + pad(r.kind, 9) + count +
              (r.state === 'FAIL' ? '   (exit ' + r.status + ')' : ''));
});
console.log('='.repeat(W));
console.log('  ' + results.length + ' suites · ' + nPass + ' passed, ' + nFail + ' failed, ' + nSkip + ' skipped');
console.log('  ' + checksPassed + ' / ' + checksTotal + ' individual checks passed');
console.log('='.repeat(W) + '\n');

function pad(s, n) { return s.length >= n ? s + '  ' : s + new Array(n - s.length + 1).join(' '); }

process.exit(nFail ? 1 : 0);
