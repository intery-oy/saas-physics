/*
 * SaaS Physics v1 — Notebook table contract.
 *
 *   NOTEBOOK-UI          nav + Base|Exp chrome in the v1 template
 *   NOTEBOOK-ARR         default world month-60 ARR = €62,926,223.19
 *   NOTEBOOK-PAIR        GRR and NRR always adjacent
 *   NOTEBOOK-LOGOS       Logos group always present; — when bound off
 *   NOTEBOOK-WORLD       default Experiment iff the run differs from Base
 *   NOTEBOOK-OMIT        LTV:CAC is not invented
 *   NOTEBOOK-SOURCE      cells are engine / kpi.js fields, not parallel math
 *
 * Run: node notebook-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var NB = require('./notebook.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var build = fs.readFileSync('build.js', 'utf8');
var nbSrc = fs.readFileSync('notebook.js', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('NOTEBOOK-UI', 'v1 nav has a Notebook companion tab',
   tpl.indexOf('id="nav-notebook"') !== -1 && tpl.indexOf('Notebook') !== -1, '');
ok('NOTEBOOK-UI', 'thin header has scenario name + Base|Exp toggle + CSV',
   tpl.indexOf('id="nb-scenario"') !== -1 &&
   tpl.indexOf('id="nb-base"') !== -1 &&
   tpl.indexOf('id="nb-exp"') !== -1 &&
   tpl.indexOf('id="nb-csv"') !== -1, '');
ok('NOTEBOOK-UI', 'build.js inlines notebook.js into the v1 surface',
   build.indexOf('notebook.js') !== -1 && build.indexOf('/*__NOTEBOOK__*/') !== -1, '');
ok('NOTEBOOK-UI', 'Method overlay names Notebook as table substrate',
   /Notebook/.test(tpl) && /substrate for charts later/.test(tpl), '');

var base = E.run(A);
var m60 = NB.cellsAt(base, 60);
ok('NOTEBOOK-ARR', 'default world bounds-off: month-60 ARR = €62,926,223.19',
   Math.abs(m60.arr - 62926223.19) < 0.005,
   NB.formatValue('eur', m60.arr));
ok('NOTEBOOK-ARR', 'formatted month-60 ARR is the locked checksum',
   NB.formatValue('eur', m60.arr) === '€62,926,223.19',
   NB.formatValue('eur', m60.arr));
ok('NOTEBOOK-ARR', 'month-0 ARR is opening stock, not a fake flow',
   NB.cellsAt(base, 0).arr === base.start.openingARR &&
   NB.cellsAt(base, 0).newARR === null &&
   NB.formatValue('eur', null) === '—', '');

var cols = NB.columnsFor(base);
var ids = cols.map(function (c) { return c.id; });
var gi = ids.indexOf('grr'), ni = ids.indexOf('nrr');
ok('NOTEBOOK-PAIR', 'GRR and NRR are always present and adjacent',
   gi >= 0 && ni === gi + 1, 'grr@' + gi + ' nrr@' + ni);
ok('NOTEBOOK-PAIR', 'R12M pair is — before month 12 and both filled from month 12',
   NB.cellsAt(base, 11).grr === null && NB.cellsAt(base, 11).nrr === null &&
   NB.cellsAt(base, 12).grr !== null && NB.cellsAt(base, 12).nrr !== null, '');

ok('NOTEBOOK-LOGOS', 'Logos group is always in the catalogue',
   NB.GROUPS.some(function (g) { return g.id === 'logos'; }) &&
   ids.indexOf('logos') !== -1 && ids.indexOf('logoRet') !== -1, '');
ok('NOTEBOOK-LOGOS', 'default Logos / Unit economics are collapsed; Revenue / Retention / Capital open',
   NB.DEFAULT_OPEN.revenue === true && NB.DEFAULT_OPEN.retention === true &&
   NB.DEFAULT_OPEN.capital === true && NB.DEFAULT_OPEN.unit === false &&
   NB.DEFAULT_OPEN.logos === false, '');
ok('NOTEBOOK-LOGOS', 'logo bound off → logo count and retention are — not 0.00',
   NB.cellsAt(base, 60).logos === null && NB.cellsAt(base, 60).logoRet === null &&
   NB.formatValue('count', null) === '—' && NB.formatValue('pct', 0) !== '—', '');

var logo = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.90 }));
ok('NOTEBOOK-LOGOS', 'logo bound on → count and R12M logo retention are engine/KPI values',
   logo.derived.logoLayerOn === true &&
   NB.cellsAt(logo, 60).logos === logo.months[59].customersClosing &&
   NB.cellsAt(logo, 12).logoRet !== null, '');
ok('NOTEBOOK-LOGOS', 'logo-on adds Contraction ARR using the engine field, not invented churn',
   NB.columnsFor(logo).some(function (c) { return c.id === 'contraction'; }) &&
   NB.cellsAt(logo, 1).contraction === logo.months[0].contraction &&
   !NB.columnsFor(base).some(function (c) { return c.id === 'contraction'; }), '');

ok('NOTEBOOK-WORLD', 'identical Base/Experiment defaults to Base',
   NB.defaultWorld(base, base) === 'base' && NB.experimentDiffers(base, base) === false, '');
var exp = E.run(Object.assign({}, A, { persistenceAnnual: 0.96 }));
ok('NOTEBOOK-WORLD', 'a changed force defaults to Experiment',
   NB.defaultWorld(base, exp) === 'experiment', '');
var logoWorld = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.90 }));
ok('NOTEBOOK-WORLD', 'an overnight bound on defaults to Experiment',
   NB.defaultWorld(base, logoWorld) === 'experiment', '');

ok('NOTEBOOK-OMIT', 'LTV:CAC is listed as omitted and does not appear as a column',
   NB.OMITTED.indexOf('LTV:CAC') !== -1 &&
   ids.indexOf('ltv') === -1 && ids.indexOf('ltvCac') === -1 &&
   !cols.some(function (c) { return /ltv/i.test(c.id + c.label); }), '');

var m = base.months[29];
var net = NB.cellsAt(base, 30).netNew;
ok('NOTEBOOK-SOURCE', 'Net new ARR is the System identity New + Expansion − Leakage',
   net === m.newARR + m.expansion - m.leakage, '');
ok('NOTEBOOK-SOURCE', 'S&M intended is omitted while the cash reserve is off',
   base.derived.smIsUnconstrained === true &&
   !cols.some(function (c) { return c.id === 'smIntended'; }), '');
var cashBound = E.run(Object.assign({}, A, { smCashReserve: 8000000 }));
ok('NOTEBOOK-SOURCE', 'S&M intended appears only when the engine distinguishes it',
   cashBound.derived.smIsUnconstrained === false &&
   NB.columnsFor(cashBound).some(function (c) { return c.id === 'smIntended'; }) &&
   NB.cellsAt(cashBound, 1).sm === cashBound.months[0].sm &&
   NB.cellsAt(cashBound, 1).smIntended === cashBound.months[0].smIntended, '');
ok('NOTEBOOK-SOURCE', 'Burn is the engine field (max(0, −FCF)), not a new definition',
   NB.cellsAt(base, 1).burn === base.months[0].burn &&
   NB.cellsAt(base, 1).fcf === base.months[0].fcf &&
   NB.cellsAt(base, 1).ebita === base.months[0].ebita, '');
ok('NOTEBOOK-SOURCE', 'MRR column is the engine native closingMRR, ARR is closingARR',
   NB.cellsAt(base, 60).mrr === base.months[59].closingMRR &&
   Math.abs(NB.cellsAt(base, 60).arr - 12 * NB.cellsAt(base, 60).mrr) < 1e-9, '');

var model = NB.tableModel(base);
ok('NOTEBOOK-SOURCE', 'CSV exports visible (default-open) columns only, 61 months, plain numbers',
   model.rows.length === 61 &&
   NB.toCSV(model).indexOf('R12M GRR') !== -1 &&
   NB.toCSV(model).indexOf('Logo count') === -1 &&
   NB.toCSV(model).split('\n').length === 63, '');

ok('NOTEBOOK-SOURCE', 'notebook.js does not call E.run or invent a coefficient',
   nbSrc.indexOf('E.run') === -1 &&
   nbSrc.indexOf('DEFAULT_ASSUMPTIONS') === -1, '');

console.log('\nSaaS Physics v1 — Notebook table\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' notebook-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
