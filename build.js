/* Inlines the SAME engine.js and integrity.js the Node checks use into the UI. */
'use strict';
var fs = require('fs');
var tpl = fs.readFileSync('ui.template.html', 'utf8');
var engine = fs.readFileSync('engine.js', 'utf8');
var kpi = fs.readFileSync('kpi.js', 'utf8');
var integrity = fs.readFileSync('integrity.js', 'utf8');   // browser branch resolves via globals
var out = tpl.replace('/*__ENGINE__*/', function () { return engine; })
             .replace('/*__KPI__*/', function () { return kpi; })
             .replace('/*__INTEGRITY__*/', function () { return integrity; });
fs.writeFileSync('saas-physics-prototype-0.html', out);
console.log('built saas-physics-prototype-0.html — ' + (out.length / 1024).toFixed(1) + ' KB');

/* Visual Prototype 1 — the SAME frozen engine and KPI layer, inlined verbatim. */
var capital = fs.readFileSync('capital.js', 'utf8');
var vis = fs.readFileSync('visual.template.html', 'utf8')
  .replace('/*__ENGINE__*/', function () { return engine; })
  .replace('/*__KPI__*/', function () { return kpi; })
  .replace('/*__CAPITAL__*/', function () { return capital; })
  .replace('/*__PULSE__*/', function () { return fs.readFileSync('pulse.js', 'utf8'); });
fs.writeFileSync('saas-physics-visual-1.html', vis);
console.log('built saas-physics-visual-1.html — ' + (vis.length / 1024).toFixed(1) + ' KB');
