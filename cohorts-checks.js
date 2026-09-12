/*
 * SaaS Physics v1 — Cohorts surface contract.
 *
 *   COHORTS-UI         nav + Composition | Age profile + Base|Exp chrome
 *   COHORTS-ARR        composition total = engine closingARR; €000 display
 *   COHORTS-HONESTY    blended NRR is a warning; contraction — when logos off
 *   COHORTS-AGE        age bars + rates come from kpi.js, not new math
 *   COHORTS-FLAT       flat-law footnote when bandsAreFlat
 *   COHORTS-SOURCE     no E.run / no invented coefficient in cohorts.js
 *
 * Run: node cohorts-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');
var CO = require('./cohorts.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var tpl = fs.readFileSync('v1.template.html', 'utf8');
var build = fs.readFileSync('build.js', 'utf8');
var src = fs.readFileSync('cohorts.js', 'utf8');
var A = E.DEFAULT_ASSUMPTIONS;

ok('COHORTS-UI', 'v1 nav is Company · System · Scenarios · Cohorts · Appendix',
   tpl.indexOf('id="nav-company"') !== -1 &&
   tpl.indexOf('id="nav-system"') !== -1 &&
   tpl.indexOf('id="nav-scen"') !== -1 &&
   tpl.indexOf('id="nav-cohorts">Cohorts<') !== -1 &&
   /id="nav-notebook">Appendix</.test(tpl) &&
   tpl.indexOf('id="nav-notebook">Notebook<') === -1, '');

ok('COHORTS-UI', 'Cohorts chrome has Composition | Age profile and Base|Exp',
   tpl.indexOf('id="co-mode-comp"') !== -1 &&
   tpl.indexOf('id="co-mode-age"') !== -1 &&
   tpl.indexOf('id="co-base"') !== -1 &&
   tpl.indexOf('id="co-exp"') !== -1 &&
   tpl.indexOf('id="co-scene"') !== -1 &&
   tpl.indexOf('id="co-honesty"') !== -1, '');

ok('COHORTS-UI', 'build.js inlines cohorts.js into the v1 surface',
   build.indexOf('cohorts.js') !== -1 && build.indexOf('/*__COHORTS__*/') !== -1, '');

ok('COHORTS-UI', 'v1 template still declares UTF-8 as the first head child',
   /^<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">/.test(tpl), '');

ok('COHORTS-UI', 'question is the locked Cohorts v1 question',
   tpl.indexOf(CO.QUESTION) !== -1 &&
   /Which vintage is carrying\/leaking the book/.test(tpl), '');

ok('COHORTS-UI', 'Method overlay names Cohorts and Appendix',
   /<b>Cohorts<\/b>/.test(tpl) &&
   /<b>Appendix<\/b>/.test(tpl) &&
   /composition \+ honesty \+ age toggle/.test(tpl), '');

var base = E.run(A);
var comp = CO.compositionSeries(base);
ok('COHORTS-ARR', 'default world bounds-off: month-60 composition total = €62,926,223.19',
   Math.abs(comp.total[60] - 62926223.19) < 0.005 &&
   Math.abs(comp.total[60] - base.months[59].closingARR) < 1e-9,
   String(comp.total[60]));

ok('COHORTS-ARR', 'month-0 composition is opening stock, not a fake birth',
   Math.abs(comp.total[0] - base.start.openingARR) < 1e-9 &&
   comp.births[0].arr === 0 &&
   Math.abs(comp.births[1].arr - base.months[0].newARR) < 1e-9, '');

ok('COHORTS-ARR', 'yearly layers sum to company ARR at every month (arrMix identity)',
   (function () {
     var t, mix, layerSum, i;
     for (t = 1; t <= base.horizon; t++) {
       mix = E.arrMix(base, t);
       layerSum = 0;
       for (i = 0; i < comp.layers.length; i++) layerSum += comp.layers[i].arr[t];
       if (Math.abs(layerSum - mix.total) > 1e-6) return false;
       if (Math.abs(comp.layers[0].arr[t] - mix.amounts.base) > 1e-6) return false;
     }
     return true;
   })(), '');

ok('COHORTS-ARR', 'money displays as €000 (month-60 ARR → 62,926)',
   CO.MONEY_UNIT === '€000' && CO.formatEur000(comp.total[60]) === '62,926',
   CO.formatEur000(comp.total[60]));

var hon = CO.honesty(base, 60);
ok('COHORTS-HONESTY', 'blended NRR/GRR are kpi.measureR12M at the horizon',
   hon.blendedNRR !== null && hon.blendedGRR !== null &&
   Math.abs(hon.blendedNRR - K.measureR12M(base, 60).nrr) < 1e-12 &&
   Math.abs(hon.blendedGRR - K.measureR12M(base, 60).grr) < 1e-12, '');

ok('COHORTS-HONESTY', 'blended NRR is framed as a warning, not a hero',
   /not the hero|no-op|mixes vintages/.test(hon.warning) &&
   hon.warning.indexOf(CO.formatPct(hon.blendedNRR)) !== -1, hon.warning);

ok('COHORTS-HONESTY', 'logo bound off → contraction is — not 0.00',
   hon.logoOn === false && hon.contractionRate === null &&
   hon.vintages.every(function (v) { return !v.first || v.first.contractionRate === null; }) &&
   /Contraction is —/.test(hon.contractionNote), '');

ok('COHORTS-HONESTY', 'opening vintage first-year NRR matches rateDiagnostics',
   (function () {
     var d = E.rateDiagnostics(base);
     var w = CO.vintageFirstWindow(base, 0);
     return w && w.complete &&
       Math.abs(w.nrr - d.realisedNRR) < 1e-12 &&
       Math.abs(w.grr - d.realisedGrossRetention) < 1e-12;
   })(), '');

ok('COHORTS-HONESTY', 'honesty vintage rates at m60 are measureR12M contributions',
   (function () {
     var kpi = K.measureR12M(base, 60);
     var w = CO.vintageWindowRates(base, 0, 60);
     var hit = kpi.contributions.filter(function (c) { return c.acquisitionMonth === 0; })[0];
     return w && w.fromR12M && hit &&
       Math.abs(w.nrr - hit.nrr) < 1e-12 &&
       Math.abs(w.grr - hit.grr) < 1e-12;
   })(), '');

ok('COHORTS-FLAT', 'default world is flat → mix-is-a-no-op footnote',
   base.bandsAreFlat === true && hon.bandsAreFlat === true &&
   hon.flatNote !== null && /no-op/.test(hon.flatNote), hon.flatNote);

var STABLE = { p: 0.94, x: 0.14 }, RISKY = { p: 0.78, x: 0.06 };
function band(n, maxAge, r) {
  return { name: n, maxAgeExclusive: maxAge, persistenceAnnual: r.p, expansionCoefficientAnnual: r.x };
}
var PROFILE = [band('Early', 12, STABLE), band('Developing', 24, RISKY), band('Mature', Infinity, STABLE)];
var banded = E.run(Object.assign({}, A, { bands: PROFILE }));
var honB = CO.honesty(banded, 60);
ok('COHORTS-FLAT', 'non-flat tenure drops the no-op footnote and can mark blended as a mix',
   banded.bandsAreFlat === false && honB.flatNote === null &&
   honB.mixHides === true && /mixes vintages/.test(honB.warning), honB.warning);

var age = CO.ageProfile(base, 60);
var ageC = K.ageComposition(base, 60);
ok('COHORTS-AGE', 'age-profile ARR totals match kpi.ageComposition / closingARR',
   Math.abs(age.totalARR - base.months[59].closingARR) < 1e-6 &&
   Math.abs(age.engineBands.total - ageC.total) < 1e-9 &&
   Math.abs(age.buckets.reduce(function (s, b) { return s + b.arr; }, 0) - age.totalARR) < 1e-6, '');

ok('COHORTS-AGE', 'age-band GRR/NRR are weighted measureR12M.contributions',
   (function () {
     var kpi = K.measureR12M(base, 60);
     var i, r, wOpen = 0, wGrr = 0, wNrr = 0;
     for (i = 0; i < age.rates.length; i++) {
       r = age.rates[i];
       if (r.openingARR > 0) {
         wOpen += r.openingARR;
         wGrr += r.grr * r.openingARR;
         wNrr += r.nrr * r.openingARR;
       }
     }
     return Math.abs(wOpen - kpi.openingARR) < 1e-6 &&
       Math.abs(wGrr / wOpen - kpi.grr) < 1e-12 &&
       Math.abs(wNrr / wOpen - kpi.nrr) < 1e-12;
   })(), '');

ok('COHORTS-AGE', 'logo counts are — when the logo bound is off',
   age.logoOn === false && age.buckets.every(function (b) { return b.logos === null; }), '');

ok('COHORTS-AGE', 'R12M rates are — before month 12',
   CO.ageProfile(base, 11).ratesAvailable === false &&
   CO.ageProfile(base, 11).rates.every(function (r) { return r.grr === null && r.nrr === null; }) &&
   CO.honesty(base, 11).blendedNRR === null, '');

var logo = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.90 }));
ok('COHORTS-HONESTY', 'logo bound on → contraction is the KPI field, not invented churn',
   logo.derived.logoLayerOn === true &&
   Math.abs(CO.honesty(logo, 60).contractionRate - K.measureR12M(logo, 60).contractionRate) < 1e-12, '');

ok('COHORTS-SOURCE', 'cohorts.js does not call E.run or invent a coefficient',
   src.indexOf('E.run') === -1 &&
   src.indexOf('DEFAULT_ASSUMPTIONS') === -1 &&
   src.indexOf('persistenceAnnual') === -1 &&
   src.indexOf('expansionCoefficientAnnual') === -1, '');

ok('COHORTS-SOURCE', 'identical Base/Experiment defaults to Base',
   CO.defaultWorld(base, base) === 'base' && CO.experimentDiffers(base, base) === false, '');
ok('COHORTS-SOURCE', 'a changed force defaults to Experiment',
   CO.defaultWorld(base, E.run(Object.assign({}, A, { persistenceAnnual: 0.96 }))) === 'experiment', '');

console.log('\nSaaS Physics v1 — Cohorts\n' + '='.repeat(80));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(80));
console.log(pass + ' / ' + out.length + ' cohorts-checks passed\n');
process.exit(pass === out.length ? 0 : 1);
