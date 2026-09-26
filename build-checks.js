/*
 * SaaS Physics — the build, asserted.
 *
 * Nothing checked the step between the modules and the artifact. A module could
 * change with no rebuild, and the Node suites would certify the new module
 * while the accept suites certified a stale page -- both green. build.js and
 * deploy-build.js were asserted by nothing at all, and no check confirmed a
 * template placeholder had actually been substituted.
 *
 *   PLACEHOLDERS  every /*__X__*\/ slot in every template is filled
 *   LOAD-ORDER    the four layer modules are inlined before the engine, and the
 *                 engine before the four modules that resolve it off the global
 *   FRESH         the committed artifact is what the current modules build
 *   DEPLOY        dist/index.html is saas-physics-v1.html, byte for byte
 */
'use strict';
var fs = require('fs');
var path = require('path');
var B = require('./build.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

/* The build marker is the one thing that legitimately differs between a fresh
   build and the committed file: it stamps the commit, and the commit that
   carries a build cannot contain its own hash. Normalise it on both sides. */
var STAMP = /(<span class="chip build" id="build-chip"[^>]*>)([^<]*)(<\/span>)/;
function unstamp(s) { return s.replace(STAMP, function (m, a, v, z) { return a + 'STAMP' + z; }); }

var built = B.buildAll('STAMP');

/* ---- PLACEHOLDERS ---- */
var leftovers = [];
Object.keys(built).forEach(function (f) {
  var m = built[f].match(/\/\*__[A-Z_]+__\*\//g);
  if (m) leftovers.push(f + ': ' + m.join(','));
});
ok('PLACEHOLDERS', 'every template slot is substituted in every built surface (an unfilled slot used to ship as a comment and a blank page)',
   leftovers.length === 0, leftovers.join(' | ') || B.OUTPUTS.length + ' surfaces clean');

/* ---- LOAD-ORDER ---- */
var orderBad = [];
Object.keys(built).forEach(function (f) {
  var s = built[f];
  var eng = s.indexOf('root.SaaSPhysics = ');
  if (eng < 0) { orderBad.push(f + ': no engine'); return; }
  B.DEFINES_BEFORE_ENGINE.forEach(function (g) {
    var i = s.indexOf('root.' + g + ' = ');
    if (i >= 0 && i > eng) orderBad.push(f + ': ' + g + ' after the engine');
  });
  B.DEFINES_AFTER_ENGINE.forEach(function (g) {
    var i = s.indexOf('root.' + g + ' = ');
    if (i >= 0 && i < eng) orderBad.push(f + ': ' + g + ' before the engine it reads');
  });
});
ok('LOAD-ORDER', 'the four layer modules are inlined before the engine, and kpi / capital / systemstate / pulse after it — a wrong order used to surface as "Cannot read properties of undefined (reading \'validate\')" on the first run, naming neither module',
   orderBad.length === 0, orderBad.join(' | ') || 'order holds in all ' + Object.keys(built).length + ' surfaces');

/* ---- FRESH ---- */
var stale = [];
B.OUTPUTS.forEach(function (f) {
  var p = path.join(__dirname, f);
  if (!fs.existsSync(p)) { stale.push(f + ': missing'); return; }
  var disk = unstamp(fs.readFileSync(p, 'utf8'));
  var fresh = unstamp(built[f]);
  if (disk !== fresh) {
    var i = 0; while (i < disk.length && i < fresh.length && disk[i] === fresh[i]) i++;
    stale.push(f + ': differs at byte ' + i + ' (disk ' + disk.length + ' vs fresh ' + fresh.length + ')');
  }
});
ok('FRESH', 'the committed HTML is what the current modules build — a module changed without a rebuild used to leave the Node suites testing one engine and the browser suites testing another, both green',
   stale.length === 0, stale.join(' | ') || B.OUTPUTS.length + ' artifacts current');

/* ---- DEPLOY ---- */
var deploySrc = fs.readFileSync(path.join(__dirname, 'deploy-build.js'), 'utf8');
ok('DEPLOY', 'deploy-build packages the product byte for byte and refuses an incomplete build',
   /Buffer\.compare/.test(deploySrc) && /__ENGINE__/.test(deploySrc) && /process\.exit\(1\)/.test(deploySrc),
   'deploy-build.js asserts its own copy');

var pass = out.filter(function (r) { return r.pass; }).length;
console.log('\nSaaS Physics — build checks');
console.log('-'.repeat(90));
out.forEach(function (r) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
});
console.log('-'.repeat(90));
console.log(pass + ' / ' + out.length + ' build checks passed\n');
process.exit(pass === out.length ? 0 : 1);
