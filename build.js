/* Inlines the SAME engine.js and integrity.js the Node checks use into the UI. */
'use strict';
var fs = require('fs');

function readUtf8(p) { return fs.readFileSync(p, { encoding: 'utf8' }); }
function writeUtf8(p, s) { fs.writeFileSync(p, s, { encoding: 'utf8' }); }

var tpl = readUtf8('ui.template.html');
var engine = readUtf8('engine.js');
var kpi = readUtf8('kpi.js');
var integrity = readUtf8('integrity.js');   // browser branch resolves via globals
var out = tpl.replace('/*__ENGINE__*/', function () { return engine; })
             .replace('/*__KPI__*/', function () { return kpi; })
             .replace('/*__INTEGRITY__*/', function () { return integrity; });
writeUtf8('saas-physics-prototype-0.html', out);
console.log('built saas-physics-prototype-0.html — ' + (out.length / 1024).toFixed(1) + ' KB');

/* Visual Prototype 1 — the SAME frozen engine and KPI layer, inlined verbatim. */
var capital = readUtf8('capital.js');
var vis = readUtf8('visual.template.html')
  .replace('/*__ENGINE__*/', function () { return engine; })
  .replace('/*__KPI__*/', function () { return kpi; })
  .replace('/*__CAPITAL__*/', function () { return capital; })
  .replace('/*__PULSE__*/', function () { return readUtf8('pulse.js'); });
writeUtf8('saas-physics-visual-1.html', vis);
console.log('built saas-physics-visual-1.html — ' + (vis.length / 1024).toFixed(1) + ' KB');

/* ------------------------------------------------------------------ *
 * SaaS Physics v1 — the consolidated product surface.
 * Same frozen engine and KPI layer, inlined verbatim. The Pulse module is NOT
 * inlined: the failed prototype stays in the research archive
 * (visual.template.html / docs/PULSE.md), not in the product.
 * ------------------------------------------------------------------ */
var v1 = readUtf8('v1.template.html')
  .replace('/*__ENGINE__*/', function () { return engine; })
  .replace('/*__KPI__*/', function () { return kpi; })
  .replace('/*__CAPITAL__*/', function () { return capital; })
  .replace('/*__SYSTEMSTATE__*/', function () { return readUtf8('systemstate.js'); })
  .replace('/*__BASIS__*/', function () { return readUtf8('basis.js'); })
  .replace('/*__NOTEBOOK__*/', function () { return readUtf8('notebook.js'); })
  .replace('/*__COHORTS__*/', function () { return readUtf8('cohorts.js'); });
if (!/^<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">/.test(v1)) {
  throw new Error('saas-physics-v1.html must declare UTF-8 as the first head child (file:// encoding)');
}
writeUtf8('saas-physics-v1.html', v1);
console.log('built saas-physics-v1.html — ' + (v1.length / 1024).toFixed(1) + ' KB');
