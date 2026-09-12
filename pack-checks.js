/*
 * SaaS Physics — C1 assumption pack + C2 leave-behind (lean).
 *
 *   PACK-SCHEMA      versioned schema maps to DEFAULT_ASSUMPTIONS + start
 *   PACK-DEFAULT     Default pack → Year-5 ARR €62,926,223.19
 *   PACK-ROUNDTRIP   JSON / YAML load reproduces the world
 *   PACK-DIFF        driver-level; only changed drivers
 *   KIT-EXPORT       pack + appendix + audit + bind; zip/folder opens
 *   PACK-UI          thin load/save/diff on Frame or Close; no engine write
 *
 * Run: node pack-checks.js
 */
'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');
var zlib = require('zlib');
var E = require('./engine.js');
var PACK = require('./pack.js');
var KIT = require('./kit.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var build = fs.readFileSync('build.js', 'utf8');
var packSrc = fs.readFileSync('pack.js', 'utf8');
var kitSrc = fs.readFileSync('kit.js', 'utf8');
var engineSrc = fs.readFileSync('engine.js', 'utf8');

ok('PACK-SCHEMA', 'schema id and version are pinned',
   PACK.SCHEMA === 'saas-physics.assumption-pack' && PACK.SCHEMA_VERSION === 1 &&
   PACK.MODEL_VERSION === '0.4', '');

var def = PACK.defaultPack();
ok('PACK-SCHEMA', 'Default pack carries every known assumption driver + start',
   PACK.ASSUMPTION_KEYS.every(function (k) { return Object.prototype.hasOwnProperty.call(def.assumptions, k); }) &&
   def.assumptions.bands === null &&
   def.start.openingARR === E.DEFAULT_START.openingARR &&
   def.start.openingCash === E.DEFAULT_START.openingCash &&
   def.start.openingCohorts === null, '');

ok('PACK-SCHEMA', 'unknown drivers are refused',
   (function () {
     try { PACK.parse({ schema: PACK.SCHEMA, schemaVersion: 1, assumptions: { sm: 1, sneaky: 2 } }); return false; }
     catch (e) { return /Unknown assumption/.test(e.message); }
   })(), '');

ok('PACK-DEFAULT', 'Default pack isDefault + Year-5 ARR checksum',
   PACK.isDefault(def) && Math.abs(PACK.year5ARR(def) - 62926223.19) < 0.005,
   String(PACK.year5ARR(def)));

ok('PACK-DEFAULT', 'Default pack run === E.run() months bit-identically',
   JSON.stringify(PACK.runPack(def).months) === JSON.stringify(E.run().months), '');

var json = PACK.stringifyJSON(def);
var yaml = PACK.stringifyYAML(def);
var fromJson = PACK.parse(json);
var fromYaml = PACK.parse(yaml);
ok('PACK-ROUNDTRIP', 'JSON and YAML of Default parse back to Default',
   PACK.isDefault(fromJson) && PACK.isDefault(fromYaml) &&
   Math.abs(PACK.year5ARR(fromJson) - 62926223.19) < 0.005 &&
   Math.abs(PACK.year5ARR(fromYaml) - 62926223.19) < 0.005, '');

var custom = PACK.fromWorld(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { sm: 1350000 }), E.DEFAULT_START, { label: 'Spend' });
var customRun = PACK.runPack(custom);
ok('PACK-ROUNDTRIP', 'load of a non-Default pack reproduces that world',
   customRun.assumptions.sm === 1350000 &&
   Math.abs(customRun.derived.newARRPerMonth - (1350000 / 1.2)) < 1e-9 &&
   !PACK.isDefault(custom), '');

var d1 = PACK.diff(def, custom);
ok('PACK-DIFF', 'Default vs Spend lists only assumptions.sm',
   d1.changed.length === 1 && d1.changed[0].path === 'assumptions.sm' &&
   d1.changed[0].from === 900000 && d1.changed[0].to === 1350000, JSON.stringify(d1.changed));

var sameDiff = PACK.diff(def, PACK.parse(json));
ok('PACK-DIFF', 'identical packs have an empty driver list',
   sameDiff.changed.length === 0, '');

var mixed = PACK.fromWorld(
  Object.assign({}, E.DEFAULT_ASSUMPTIONS, { persistenceAnnual: 0.92, smCashReserve: 8000000 }),
  { openingARR: 30000000, openingCash: 10000000, openingCohorts: null }
);
var d2 = PACK.diff(def, mixed);
var paths = d2.changed.map(function (c) { return c.path; }).sort();
ok('PACK-DIFF', 'three-driver pack lists exactly those three paths (no GRR)',
   paths.join(',') === 'assumptions.persistenceAnnual,assumptions.smCashReserve,start.openingARR' &&
   JSON.stringify(d2).indexOf('grr') === -1 &&
   JSON.stringify(d2).indexOf('GRR') === -1, paths.join(','));

ok('PACK-DIFF', 'diff is not a second analytics pass — no measureR12M / FIBC',
   packSrc.indexOf('measureR12M') === -1 && packSrc.indexOf('forwardEconomics') === -1 &&
   packSrc.indexOf('FIBC') === -1, '');

var kit = KIT.assemble({
  assumptions: E.DEFAULT_ASSUMPTIONS,
  start: E.DEFAULT_START,
  selectedMonth: 60,
  label: 'Default'
});
ok('KIT-EXPORT', 'kit has pack + appendix + audit + bind + index',
   kit.files['pack.json'] && kit.files['pack.yaml'] && kit.files['appendix.csv'] &&
   kit.files['audit.txt'] && kit.files['bind.json'] && kit.files['INDEX.md'],
   Object.keys(kit.files).join(','));

ok('KIT-EXPORT', 'exported pack is Default and Year-5 ARR matches stamp',
   PACK.isDefault(PACK.parse(kit.files['pack.json'])) &&
   Math.abs(kit.stamp.year5ARR - 62926223.19) < 0.005 &&
   /62,926,223/.test(kit.files['INDEX.md']), String(kit.stamp.year5ARR));

ok('KIT-EXPORT', 'bind snapshot matches Default glass (reserve off, linear unbounded)',
   kit.bind.reserve.on === false &&
   kit.bind.reserve.chip === 'no operating constraint binding' &&
   kit.bind.saturation.on === false &&
   kit.bind.linear.acquisition === 'linear · unbounded', '');

ok('KIT-EXPORT', 'audit text is the selected-month ARR identity',
   /M59 → flows → M60/.test(kit.files['audit.txt']) &&
   /closing ARR = opening ARR \+ New \+ Expansion/.test(kit.files['audit.txt']), '');

ok('KIT-EXPORT', 'appendix CSV has Month column and month 60',
   kit.files['appendix.csv'].indexOf('Month,') === 0 &&
   /\n60,/.test(kit.files['appendix.csv']), '');

var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-kit-'));
Object.keys(kit.files).forEach(function (name) {
  fs.writeFileSync(path.join(tmp, name), kit.files[name], { encoding: 'utf8' });
});
var zipBytes = KIT.zipStore(kit.files);
fs.writeFileSync(path.join(tmp, 'leave-behind.zip'), Buffer.from(zipBytes));
ok('KIT-EXPORT', 'folder opens with the six residue files',
   fs.existsSync(path.join(tmp, 'INDEX.md')) &&
   fs.existsSync(path.join(tmp, 'pack.json')) &&
   PACK.isDefault(PACK.parse(fs.readFileSync(path.join(tmp, 'pack.json'), 'utf8'))), tmp);

ok('KIT-EXPORT', 'zip is a store archive (PK header) and unpacks INDEX + pack',
   zipBytes[0] === 0x50 && zipBytes[1] === 0x4B &&
   Buffer.from(zipBytes).indexOf(Buffer.from('INDEX.md')) !== -1 &&
   Buffer.from(zipBytes).indexOf(Buffer.from('pack.json')) !== -1 &&
   Buffer.from(zipBytes).indexOf(Buffer.from('appendix.csv')) !== -1, String(zipBytes.length));

/* Sanity: zlib is present in Node; we do not need it for store-only zip,
   but the file must still be a zip even if someone inspects it. */
ok('KIT-EXPORT', 'store zip is not a gzip blob',
   !(zipBytes[0] === 0x1f && zipBytes[1] === 0x8b) && typeof zlib.gzipSync === 'function', '');

ok('PACK-UI', 'v1 Frame/Close expose load · save · diff · export kit',
   tpl.indexOf('id="pack-save"') !== -1 &&
   tpl.indexOf('id="pack-load"') !== -1 &&
   tpl.indexOf('id="pack-diff"') !== -1 &&
   tpl.indexOf('id="kit-export"') !== -1 &&
   tpl.indexOf('function applyPack') !== -1, '');

ok('PACK-UI', 'build.js inlines pack.js and kit.js into v1',
   build.indexOf('pack.js') !== -1 && build.indexOf('/*__PACK__*/') !== -1 &&
   build.indexOf('kit.js') !== -1 && build.indexOf('/*__KIT__*/') !== -1, '');

ok('PACK-UI', 'pack module never writes engine.js; one-way into assumptions',
   packSrc.indexOf('writeFileSync') === -1 &&
   packSrc.indexOf('engine.js') !== -1 &&
   /one-way into those objects/i.test(packSrc) &&
   engineSrc.indexOf('assumption-pack') === -1, '');

ok('PACK-UI', 'no Partner-mode, honesty language, auth, billing, or valuation',
   !/Partner-mode|honesty|multi-tenant|billing seat|enterprise value|DCF/i.test(packSrc + kitSrc) &&
   tpl.indexOf('id="packstrip"') !== -1, '');

console.log('\nSaaS Physics — Assumption pack + leave-behind (C1+C2)\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r) {
  console.log((r.pass ? '  PASS  ' : '  FAIL  ') + r.id + '  ' + r.name + (r.detail ? '  (' + r.detail + ')' : ''));
  if (r.pass) pass++;
});
console.log('-'.repeat(80));
console.log(pass + ' / ' + out.length + ' passed');
if (pass !== out.length) process.exit(1);
