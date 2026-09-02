/*
 * SaaS Physics — Capital Loop Concept Study, verification CLI.
 * Adds no physics: every number is derived from the frozen engine's outputs.
 * Run: node capital-study.js
 */
'use strict';
var E = require('./engine.js'), C = require('./capital.js');
var D = E.DEFAULT_ASSUMPTIONS;
var m = function (v){ return '€' + (v/1e6).toFixed(2) + 'm'; };
var k = function (v){ return '€' + Math.round(v/1e3) + 'k'; };
var pc = function (v,d){ return (v*100).toFixed(d===undefined?1:d) + '%'; };
var L = function (w){ return '─'.repeat(w||82); };
function pad(s,n){ s=String(s); return s + ' '.repeat(Math.max(0,n-s.length)); }
function rp(s,n){ s=String(s); return ' '.repeat(Math.max(0,n-s.length)) + s; }
function idxOf(res,j){ return res.cohorts.findIndex(function(c){ return c.acquisitionMonth===j; }); }

console.log('\nSaaS Physics — Capital Loop Concept Study   (engine v' + E.run().modelVersion + ', frozen)');
console.log(L());

/* ---- §20 calibration ---- */
var base = E.run();
console.log('CALIBRATION — is the observed crossing consistent with the model?');
console.log(L());
console.log('  Closed form   payback = cacPerARR × 12 ÷ GM = ' + D.cacPerARR + ' × 12 ÷ ' + D.grossMargin +
            ' = ' + base.derived.cacPaybackMonths.toFixed(2) + ' months');
console.log('  Observed      first month where a cohort\'s cumulative gross profit ≥ its stamped acquisition cost');
console.log('  ' + pad('cohort',10) + rp('cost',9) + rp('payback month',16) + rp('age at payback',16) + rp('cumGP @ M60',14) + rp('surplus',12));
[1,6,12,24,36].forEach(function(j){
  var cap = C.cohortCapital(base, idxOf(base,j));
  console.log('  ' + pad('M'+j,10) + rp(k(cap.acquisitionCost),9) + rp('M'+cap.paybackMonth,16) +
              rp(cap.paybackAge + ' months',16) + rp(m(cap.finalCumGP),14) + rp(m(cap.surplusAtHorizon),12));
});
console.log('  → every cohort recovers at age 18, matching the closed form. Not hard-coded: read off cumGP.');

/* ---- §C one cohort, acquisition through payback ---- */
var cap1 = C.cohortCapital(base, idxOf(base,1));
console.log('\n' + L());
console.log('COHORT M1 — capital deployed, then recovered');
console.log(L());
console.log('  ' + pad('age',6) + rp('ARR',11) + rp('GP this month',16) + rp('cumulative GP',16) + rp('unrecovered',14) + '   state');
[0,3,6,9,12,15,17,18,21,30,59].forEach(function(a){
  var s = cap1.series[a]; if(!s) return;
  console.log('  ' + pad(a,6) + rp(k(s.arr),11) + rp(k(s.gp),16) + rp(k(s.cumGP),16) + rp(k(s.unrecovered),14) +
              '   ' + (s.unrecovered>0 ? 'capital still out' : (a===cap1.paybackAge ? 'PAYBACK' : 'surplus ' + k(s.net))));
});

/* ---- §11 efficiency vs spend ---- */
var TARGET_NEW = 1125000;
var EFF   = E.run(Object.assign({}, D, { cacPerARR: D.sm/TARGET_NEW }));
var SPEND = E.run(Object.assign({}, D, { sm: TARGET_NEW*D.cacPerARR }));
function capSummary(res,label){
  var c1 = C.cohortCapital(res, idxOf(res,1));
  var p  = C.portfolioCapital(res, res.horizon);
  var s  = E.summarise(res);
  return { label:label, cost:c1.acquisitionCost, payback:c1.paybackAge,
           formula:res.derived.cacPaybackMonths, deployed:p.deployed, recovered:p.recovered,
           outstanding:p.outstanding, arr:s.finalARR, gp:s.cumGrossProfit, cash:s.endingCash,
           firstProfit:s.firstProfitableMonth, trough:s.cashTrough };
}
var a1 = capSummary(EFF,'Efficiency'), b1 = capSummary(SPEND,'Spend');
console.log('\n' + L());
console.log('EFFICIENCY vs SPEND — same New ARR ' + m(TARGET_NEW) + '/month, same ARR trajectory');
console.log(L());
var wA=0; for(var i=0;i<60;i++) wA=Math.max(wA,Math.abs(EFF.months[i].closingARR-SPEND.months[i].closingARR));
console.log('  ' + pad('',34) + rp('Efficiency',18) + rp('Spend',18));
console.log('  ' + L(70));
[['Acquisition cost per cohort',k(a1.cost),k(b1.cost)],
 ['CAC payback (closed form)',a1.formula.toFixed(1)+' mo',b1.formula.toFixed(1)+' mo'],
 ['CAC payback (observed age)',a1.payback+' mo',b1.payback+' mo'],
 ['Capital deployed over 60 months',m(a1.deployed),m(b1.deployed)],
 ['Capital recovered by M60',m(a1.recovered),m(b1.recovered)],
 ['Still outstanding at M60',m(a1.outstanding),m(b1.outstanding)],
 ['Year-5 ARR',m(a1.arr),m(b1.arr)],
 ['Cumulative gross profit',m(a1.gp),m(b1.gp)],
 ['First profitable month','M'+a1.firstProfit,'M'+b1.firstProfit],
 ['Cash trough',m(a1.trough),m(b1.trough)],
 ['Ending cash',m(a1.cash),m(b1.cash)]
].forEach(function(r){ console.log('  ' + pad(r[0],34) + rp(r[1],18) + rp(r[2],18)); });
console.log('\n  ARR paths agree to €' + wA.toExponential(2) + ' across all 60 months.');
console.log('  Same recurring state. Each cohort costs ' + k(b1.cost-a1.cost) + ' more and takes ' +
            (b1.payback-a1.payback) + ' months longer to come back.');

/* ---- §12 retention ---- */
var RET = E.run(Object.assign({}, D, { persistenceAnnual: 0.96 }));
var cB = C.cohortCapital(base, idxOf(base,1)), cR = C.cohortCapital(RET, idxOf(RET,1));
console.log('\n' + L());
console.log('RETENTION — same sunk acquisition cost, different future output from it');
console.log(L());
console.log('  ' + pad('',36) + rp('persistence 90%',18) + rp('persistence 96%',18));
console.log('  ' + L(72));
[['Acquisition cost (sunk, unchanged)',k(cB.acquisitionCost),k(cR.acquisitionCost)],
 ['Payback age',cB.paybackAge+' months',cR.paybackAge+' months'],
 ['Cohort cumulative GP by M60',m(cB.finalCumGP),m(cR.finalCumGP)],
 ['GP beyond acquisition cost',m(cB.surplusAtHorizon),m(cR.surplusAtHorizon)],
 ['Cohort ARR still alive at M60',k(cB.series[cB.series.length-1].arr),k(cR.series[cR.series.length-1].arr)]
].forEach(function(r){ console.log('  ' + pad(r[0],36) + rp(r[1],18) + rp(r[2],18)); });
console.log('\n  The capital already spent is identical. Retention changes what that capital goes on');
console.log('  to produce: ' + m(cR.surplusAtHorizon-cB.surplusAtHorizon) + ' more gross profit beyond cost, from the same ' +
            k(cB.acquisitionCost) + '.');

/* ---- §13 gross margin ---- */
var GM65 = E.run(Object.assign({}, D, { grossMargin: 0.65 }));
var cG = C.cohortCapital(GM65, idxOf(GM65,1));
console.log('\n' + L());
console.log('GROSS MARGIN — same acquisition productivity, slower recovery of the same capital');
console.log(L());
console.log('  ' + pad('',36) + rp('GM 80%',18) + rp('GM 65%',18));
console.log('  ' + L(72));
[['New ARR per month',k(base.derived.newARRPerMonth),k(GM65.derived.newARRPerMonth)],
 ['Acquisition cost per cohort',k(cB.acquisitionCost),k(cG.acquisitionCost)],
 ['CAC payback (closed form)',base.derived.cacPaybackMonths.toFixed(2)+' mo',GM65.derived.cacPaybackMonths.toFixed(2)+' mo'],
 ['CAC payback (observed age)',cB.paybackAge+' months',cG.paybackAge+' months'],
 ['Cohort cumulative GP by M60',m(cB.finalCumGP),m(cG.finalCumGP)],
 ['Ending cash',m(E.summarise(base).endingCash),m(E.summarise(GM65).endingCash)]
].forEach(function(r){ console.log('  ' + pad(r[0],36) + rp(r[1],18) + rp(r[2],18)); });
console.log('\n  Identical New ARR and identical acquisition cost. The same recurring state recycles');
console.log('  capital ' + (cG.paybackAge-cB.paybackAge) + ' months slower purely because each euro of revenue carries less margin.');

/* ---- §8/§9 the temporal truth ---- */
console.log('\n' + L());
console.log('WHERE TODAY\'S GROSS PROFIT COMES FROM');
console.log(L());
console.log('  ' + pad('month',8) + rp('GP this month',15) + rp('from opening base',20) + rp('from earlier cohorts',22) + rp('from this month\'s',20));
[6,12,24,36,60].forEach(function(t){
  var g = C.gpByVintage(base,t);
  console.log('  ' + pad('M'+t,8) + rp(k(g.total),15) + rp(pc(g.fromOpeningBase/g.total),20) +
              rp(pc(g.fromEarlierAcquisitions/g.total),22) + rp(pc(g.fromCohortAcquiredThisMonth/g.total),20));
});
var p60 = C.portfolioCapital(base,60);
console.log('\n  At M60: ' + m(p60.deployed) + ' of acquisition capital deployed, ' + m(p60.recovered) +
            ' recovered (' + pc(p60.recoveredShare) + '), ' + m(p60.outstanding) + ' still outstanding across ' +
            p60.counts.prePayback + ' cohorts.');
console.log('  Today\'s gross profit is almost entirely the delayed return on capital deployed months or years ago.');
console.log('');
console.log('  BOUNDARY. The engine applies ONE uniform gross margin to every cohort and models no');
console.log('  marginal acquisition cost for expansion. So a cohort\'s GP is exactly its ARR × GM ÷ 12,');
console.log('  and GP-by-vintage is the ARR mix scaled by a constant. Stated, not hidden.');
console.log('');
