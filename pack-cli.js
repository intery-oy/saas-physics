#!/usr/bin/env node
/*
 * Assumption pack + leave-behind CLI.
 *
 *   node pack-cli.js save [file.json|.yaml]
 *   node pack-cli.js load <file>
 *   node pack-cli.js diff <a> <b>
 *   node pack-cli.js export [dir]
 *
 * Default world when no world is supplied. Pack never writes engine.js.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var PACK = require('./pack.js');
var KIT = require('./kit.js');
var E = require('./engine.js');

function die(msg) { console.error(msg); process.exit(1); }
function read(p) { return fs.readFileSync(p, { encoding: 'utf8' }); }
function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, { encoding: 'utf8' });
}

var cmd = process.argv[2] || 'help';
var arg = process.argv[3];
var arg2 = process.argv[4];

if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
  console.log('SaaS Physics assumption pack\n');
  console.log('  node pack-cli.js save [file]     write Default pack (json and/or yaml)');
  console.log('  node pack-cli.js load <file>     parse pack, print Year-5 ARR');
  console.log('  node pack-cli.js diff <a> <b>    driver-level diff');
  console.log('  node pack-cli.js export [dir]    leave-behind folder of the Default world');
  process.exit(0);
}

if (cmd === 'save') {
  var dest = arg || 'packs/default.json';
  var pack = PACK.defaultPack();
  var ext = path.extname(dest).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') write(dest, PACK.stringifyYAML(pack));
  else write(dest, PACK.stringifyJSON(pack));
  if (ext === '.json') write(dest.replace(/\.json$/i, '.yaml'), PACK.stringifyYAML(pack));
  if (ext === '.yaml' || ext === '.yml') write(dest.replace(/\.ya?ml$/i, '.json'), PACK.stringifyJSON(pack));
  console.log('wrote ' + dest);
  console.log('Default · Y5 ARR ' + PACK.year5ARR(pack).toFixed(2));
  process.exit(0);
}

if (cmd === 'load') {
  if (!arg) die('usage: node pack-cli.js load <file>');
  var loaded = PACK.parse(read(arg));
  var y5 = PACK.year5ARR(loaded);
  console.log('label   ' + loaded.label);
  console.log('default ' + (PACK.isDefault(loaded) ? 'yes' : 'no'));
  console.log('Y5 ARR  ' + y5.toFixed(2));
  if (PACK.isDefault(loaded) && Math.abs(y5 - PACK.DEFAULT_Y5_ARR) >= 0.005) {
    die('Default checksum failed: ' + y5 + ' ≠ ' + PACK.DEFAULT_Y5_ARR);
  }
  process.exit(0);
}

if (cmd === 'diff') {
  if (!arg || !arg2) die('usage: node pack-cli.js diff <a> <b>');
  var d = PACK.diff(PACK.parse(read(arg)), PACK.parse(read(arg2)));
  console.log(PACK.formatDiff(d));
  console.log(d.changed.length + ' driver(s)');
  process.exit(0);
}

if (cmd === 'export') {
  var dir = arg || 'leave-behind';
  var kit = KIT.assemble({
    assumptions: E.DEFAULT_ASSUMPTIONS,
    start: E.DEFAULT_START,
    selectedMonth: E.HORIZON,
    label: 'Default'
  });
  Object.keys(kit.files).forEach(function (name) {
    write(path.join(dir, name), kit.files[name]);
  });
  var zipPath = dir.replace(/\/$/, '') + '.zip';
  fs.writeFileSync(zipPath, Buffer.from(KIT.zipStore(kit.files)));
  console.log('exported ' + dir + '/ and ' + zipPath);
  console.log('stamp ' + [kit.stamp.world, kit.stamp.month, kit.stamp.scenario, kit.stamp.reading].join(' · '));
  console.log('Y5 ARR ' + kit.stamp.year5ARR.toFixed(2));
  process.exit(0);
}

die('unknown command ' + cmd);
