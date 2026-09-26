/*
 * SaaS Physics — the build.
 *
 * Inlines the SAME modules the Node checks run against into the HTML surfaces,
 * so the page and the suites cannot disagree about what the engine is.
 *
 * A module, not just a script: buildAll() returns the bytes, and build-checks.js
 * uses that to assert the committed artifact is current with its modules. The
 * CLI (node build.js) is the same function plus fs.writeFileSync.
 */
'use strict';
var fs = require('fs');
var path = require('path');

function R(f) { return fs.readFileSync(path.join(__dirname, f), 'utf8'); }

/* LOAD ORDER. The four layer modules must be inlined before the engine, whose
   browser branch resolves them off the global; and the engine before kpi,
   capital, systemstate and pulse, which now resolve engine.rowAt the same way.
   There is NO dependency order AMONG the four layers -- the comment here used
   to claim one, and none of them references another. Gate B depends on Gate A
   at RUN time (engine.js passes customersOn and the monthly contraction rate),
   never at load time. Held by LOAD-ORDER in build-checks.js. */
var LAYER_MODULES = ['customers.js', 'monetization.js', 'cash.js', 'interventions.js'];

/* Who must appear before whom in the concatenated page, by the global each
   module assigns. A wrong order used to fail as `Cannot read properties of
   undefined (reading 'validate')` on the first run, naming neither module. */
var DEFINES_BEFORE_ENGINE = ['SaaSPhysicsCustomers', 'SaaSPhysicsMonetization', 'SaaSPhysicsCash', 'SaaSPhysicsInterventions'];
var DEFINES_AFTER_ENGINE = ['SaaSPhysicsKPI', 'SaaSPhysicsCapital', 'SaaSPhysicsSystemState', 'SaaSPhysicsPulse'];

var BUILD_TOKEN = '__BUILD__';

function buildMarker() {
  try {
    return require('child_process').execFileSync('git', ['rev-parse', '--short', 'HEAD'],
      { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'dev';
  } catch (e) { return 'dev'; }
}

/* Substitute without letting a '$' in the payload be read as a replacement
   pattern -- the reason every call site here passes a function. */
function fill(tpl, key, value) {
  return tpl.replace('/*__' + key + '__*/', function () { return value; });
}

function buildAll(marker) {
  var engine = LAYER_MODULES.map(R).join('\n') + '\n' + R('engine.js');
  var kpi = R('kpi.js');
  var capital = R('capital.js');
  var out = {};

  /* Prototype 0 — the original inspection surface. */
  var p0 = fill(fill(fill(R('ui.template.html'), 'ENGINE', engine), 'KPI', kpi), 'INTEGRITY', R('integrity.js'));
  out['saas-physics-prototype-0.html'] = p0;

  /* Visual Prototype 1 — the same frozen engine and KPI layer, verbatim. */
  var vis = fill(fill(fill(fill(R('visual.template.html'), 'ENGINE', engine), 'KPI', kpi), 'CAPITAL', capital), 'PULSE', R('pulse.js'));
  out['saas-physics-visual-1.html'] = vis;

  /* SaaS Physics v1 — the product. The Pulse module is NOT inlined: the failed
     prototype stays in the research archive, not in the product. */
  var v1 = fill(fill(fill(fill(fill(R('v1.template.html'), 'ENGINE', engine), 'KPI', kpi),
    'CAPITAL', capital), 'SYSTEMSTATE', R('systemstate.js')), 'BASIS', R('basis.js'));
  v1 = v1.replace(new RegExp(BUILD_TOKEN, 'g'), function () { return marker === undefined ? buildMarker() : marker; });
  out['saas-physics-v1.html'] = v1;

  return out;
}

module.exports = {
  buildAll: buildAll, buildMarker: buildMarker, LAYER_MODULES: LAYER_MODULES,
  DEFINES_BEFORE_ENGINE: DEFINES_BEFORE_ENGINE, DEFINES_AFTER_ENGINE: DEFINES_AFTER_ENGINE,
  BUILD_TOKEN: BUILD_TOKEN, OUTPUTS: ['saas-physics-prototype-0.html', 'saas-physics-visual-1.html', 'saas-physics-v1.html']
};

if (require.main === module) {
  var built = buildAll();
  Object.keys(built).forEach(function (f) {
    fs.writeFileSync(path.join(__dirname, f), built[f]);
    console.log('built ' + f + ' — ' + (built[f].length / 1024).toFixed(1) + ' KB');
  });
}
