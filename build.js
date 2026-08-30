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
