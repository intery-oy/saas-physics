/*
 * SaaS Physics — Prototype 0, Scenarios A-E (spec §18).
 * Run: node scenarios.js
 */
'use strict';
var E = require('./engine.js');
var D = E.DEFAULT_ASSUMPTIONS;
var BASE = E.run(D);

var m = function (v) { return (v / 1e6).toFixed(2) + 'm'; };
var sm = function (v) { return (v >= 0 ? '+' : '') + (v / 1e6).toFixed(2) + 'm'; };
var pc = function (v) { return (v * 100).toFixed(1) + '%'; };
var spc = function (v) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + 'pp'; };

var SCENARIOS = [
  { id: 'A', title: 'Retention',            change: { grrAnnual: 0.96 },        note: 'Annual GRR 90% -> 96%' },
  { id: 'B', title: 'Expansion',            change: { expansionAnnual: 0.20 },  note: 'Annual expansion 10% -> 20%' },
  { id: 'C', title: 'Acquisition efficiency', change: { cacPaybackMonths: 12 }, note: 'CAC payback 18 -> 12 months, S&M unchanged' },
  { id: 'D', title: 'Growth investment',    change: { sm: D.sm * 1.5 },         note: 'S&M +50% (€0.90m -> €1.35m/mo), CAC payback unchanged' },
  { id: 'E', title: 'Margin deterioration', change: { grossMargin: 0.65 },      note: 'Gross margin 80% -> 65%' }
];

function line(w) { return '-'.repeat(w || 78); }

console.log('\nSaaS Physics — Prototype 0');
console.log(line());
console.log('BASE assumptions: S&M €' + m(D.sm) + '/mo | CAC payback ' + D.cacPaybackMonths + 'mo | GRR ' +
            pc(D.grrAnnual) + ' | expansion ' + pc(D.expansionAnnual) + ' | GM ' + pc(D.grossMargin) +
            ' | R&D €' + m(D.rd) + '/mo | G&A €' + m(D.ga) + '/mo');
console.log('Start state: ARR €' + m(E.DEFAULT_START.openingARR) + ', cash €' + m(E.DEFAULT_START.openingCash));
var bs = E.summarise(BASE);
console.log('BASE outcome: M60 ARR €' + m(bs.finalARR) + ' | NRR ' + pc(bs.finalNRR) +
            ' | Y5 FCF €' + m(bs.finalYearFCF) + ' | ending cash €' + m(bs.endingCash) +
            ' | cash trough €' + m(bs.cashTrough) + ' (M' + bs.cashTroughMonth + ')' +
            ' | first profitable month M' + bs.firstProfitableMonth);
console.log('New ARR/mo €' + m(BASE.derived.newARRPerMonth) + ' | implied CAC per €1 of new ARR: €' +
            BASE.derived.impliedCACPerNewARR.toFixed(2));

SCENARIOS.forEach(function (s) {
  var exp = E.run(Object.assign({}, D, s.change));
  var c = E.compare(BASE, exp);
  var d = c.delta, x = c.experiment;
  console.log('\n' + line());
  console.log('SCENARIO ' + s.id + ' — ' + s.title + ':  ' + s.note);
  console.log(line());
  console.log('  New ARR / month      €' + m(BASE.derived.newARRPerMonth) + '  ->  €' + m(exp.derived.newARRPerMonth) +
              '   (' + sm(exp.derived.newARRPerMonth - BASE.derived.newARRPerMonth) + ')');
  console.log('  NRR (annualised)     ' + pc(bs.finalNRR) + '  ->  ' + pc(x.finalNRR) + '   (' + spc(d.finalNRR) + ')');
  console.log('  Y5 closing ARR       €' + m(bs.finalARR) + '  ->  €' + m(x.finalARR) + '   (' + sm(d.finalARR) +
              ', ' + spc(x.finalARR / bs.finalARR - 1) + ')');
  console.log('  Cumulative leakage   €' + m(bs.cumLeakage) + '  ->  €' + m(x.cumLeakage) + '   (' + sm(d.cumLeakage) + ')');
  console.log('  Cumulative expansion €' + m(bs.cumExpansion) + '  ->  €' + m(x.cumExpansion) + '   (' + sm(d.cumExpansion) + ')');
  console.log('  Cumulative new ARR   €' + m(bs.cumNewARR) + '  ->  €' + m(x.cumNewARR) + '   (' + sm(d.cumNewARR) + ')');
  console.log('  Cumulative gross profit €' + m(bs.cumGrossProfit) + '  ->  €' + m(x.cumGrossProfit) + '   (' + sm(d.cumGrossProfit) + ')');
  console.log('  Y5 FCF               €' + m(bs.finalYearFCF) + '  ->  €' + m(x.finalYearFCF) + '   (' + sm(d.finalYearFCF) + ')');
  console.log('  Ending cash (M60)    €' + m(bs.endingCash) + '  ->  €' + m(x.endingCash) + '   (' + sm(d.endingCash) + ')');
  console.log('  Cash trough          €' + m(bs.cashTrough) + ' (M' + bs.cashTroughMonth + ')  ->  €' +
              m(x.cashTrough) + ' (M' + x.cashTroughMonth + ')');
  console.log('  First profitable mo  M' + bs.firstProfitableMonth + '  ->  M' + x.firstProfitableMonth);
  console.log('  M60 ARR mix — opening base ' + pc(bs.baseCohortShare) + ' -> ' + pc(x.baseCohortShare) +
              ' | cohorts acquired Y1-Y2 ' + pc(bs.mix.shares.y1 + bs.mix.shares.y2) + ' -> ' + pc(x.mix.shares.y1 + x.mix.shares.y2) +
              ' | Y4-Y5 ' + pc(bs.mix.shares.y4 + bs.mix.shares.y5) + ' -> ' + pc(x.mix.shares.y4 + x.mix.shares.y5));
});

/* Scenario E coupling probe — required by spec §18E */
console.log('\n' + line());
console.log('SCENARIO E — acquisition coupling probe');
console.log(line());
var e = E.run(Object.assign({}, D, { grossMargin: 0.65 }));
console.log('  New ARR = S&M x 12 / (payback x GM). GM is in the DENOMINATOR, so cutting GM at');
console.log('  constant CAC payback RAISES modelled New ARR:');
console.log('    GM 80%: New ARR €' + m(BASE.derived.newARRPerMonth) + '/mo, CAC per €1 new ARR €' + BASE.derived.impliedCACPerNewARR.toFixed(2));
console.log('    GM 65%: New ARR €' + m(e.derived.newARRPerMonth) + '/mo, CAC per €1 new ARR €' + e.derived.impliedCACPerNewARR.toFixed(2));
console.log('  i.e. holding payback fixed while cutting GM silently assumes the company got ' +
            pc(1 - e.derived.impliedCACPerNewARR / BASE.derived.impliedCACPerNewARR) + ' CHEAPER at acquiring ARR.');
console.log('  ARR rises while gross profit falls — the model reports a bigger, poorer company.');
var eGmOnly = E.run(Object.assign({}, D, { grossMargin: 0.65, cacPaybackMonths: D.cacPaybackMonths * (D.grossMargin / 0.65) }));
console.log('  Control: holding CAC per € of new ARR constant instead (payback ' +
            (D.cacPaybackMonths * (D.grossMargin / 0.65)).toFixed(1) + 'mo) gives New ARR €' +
            m(eGmOnly.derived.newARRPerMonth) + '/mo and M60 ARR €' + m(E.summarise(eGmOnly).finalARR) +
            ' vs €' + m(E.summarise(e).finalARR) + ' under the stated v0.1 formula.');
console.log('');
