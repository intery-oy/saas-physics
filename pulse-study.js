/* SaaS Physics — Flow / Pulse concept study verification. Run: node pulse-study.js */
'use strict';
var E = require('./engine.js'), P = require('./pulse.js');
var D = E.DEFAULT_ASSUMPTIONS;
var k = function(v){ return '€' + (Math.abs(v)>=1e6 ? (v/1e6).toFixed(2)+'m' : Math.round(v/1e3)+'k'); };
var s = function(v){ return (v>=0?'+':'−') + k(Math.abs(v)); };
var L = function(w){ return '─'.repeat(w||84); };
function pad(x,n){ x=String(x); return x+' '.repeat(Math.max(0,n-x.length)); }
function rp(x,n){ x=String(x); return ' '.repeat(Math.max(0,n-x.length))+x; }

console.log('\nSaaS Physics — Flow / Pulse concept study   (engine v'+E.run().modelVersion+', frozen)');
console.log(L());
console.log('B. THE INTRA-MONTH LAW — read off engine.js, not invented');
console.log(L());
P.LAW.forEach(function(l){
  console.log('  '+l.n+'. '+pad(l.title,26)+l.formula);
  console.log('     '+' '.repeat(26)+l.note);
});

var r = E.run(), M = 24, p = P.pulseAt(r, M);
console.log('\n'+L());
console.log('C. ABSOLUTE PULSE — month '+M+', every value engine output');
console.log(L());
console.log('  ARR bridge      '+pad('opening '+k(p.openingARR),22)+pad('+ new '+k(p.newARR),18)+
            pad('+ exp '+k(p.expansion),18)+pad('− leak '+k(p.leakage),18)+'= closing '+k(p.closingARR));
console.log('                  residual '+p.arrResidual.toExponential(2)+
            '   · cohort-sum residuals '+Object.keys(p.cohortSumResidual).map(function(x){return p.cohortSumResidual[x].toExponential(0);}).join(' '));
console.log('  Revenue         midpoint ARR '+k(p.midpointARR)+' ÷ 12 = '+k(p.revenue)+'   (NOT from closing ARR)');
console.log('  Margin split    revenue '+k(p.revenue)+' − COGS '+k(p.cogs)+' = GP '+k(p.grossProfit)+'   residual '+p.gpResidual.toExponential(2));
console.log('  Operating       GP − S&M '+k(p.sm)+' − other '+k(p.otherOpex)+' = FCF '+k(p.fcf)+'   residual '+p.fcfResidual.toExponential(2));
console.log('  Cash            '+k(p.cashOpening)+' + '+k(p.fcf)+' = '+k(p.cashClosing)+'   residual '+p.cashResidual.toExponential(2));
console.log('\n  F. THE DELAYED LOOP — the honest same-period number');
console.log('     S&M '+k(p.sm)+' created a cohort of '+k(p.newARR)+' of ARR.');
console.log('     That cohort produced '+k(p.newCohortGPThisMonth)+' of GP in the SAME month = '+
            (p.sameMonthReturnOnSM*100).toFixed(1)+'% of the spend,');
console.log('     because the engine gives a birth-month cohort half a month of revenue.');
console.log('     The rest arrives over the following '+r.derived.cacPaybackMonths.toFixed(0)+' months. Not zero, and not instant.');

var RET = E.run(Object.assign({}, D, { persistenceAnnual: 0.96 }));
var dp = P.deltaPulseAt(r, RET, M);
console.log('\n'+L());
console.log('D/E. DELTA PULSE — persistence 90% → 96%, month '+M+' (Base becomes zero)');
console.log(L());
console.log('  Δ opening '+s(dp.openingARR)+'  Δ new '+s(dp.newARR)+'  Δ expansion '+s(dp.expansion)+
            '  Δ leakage '+s(dp.leakage)+'  → Δ closing '+s(dp.closingARR));
console.log('  residual '+dp.arrResidual.toExponential(2)+
            '   ·  Δ revenue '+s(dp.revenue)+'  Δ GP '+s(dp.grossProfit)+'  Δ FCF '+s(dp.fcf)+'  Δ cash '+s(dp.cashClosing));

var acc = P.deltaAccumulator(r, RET);
console.log('\n  §11 — Δ ARR today IS the running sum of every monthly Δflow');
console.log('  '+pad('month',8)+rp('Δ leakage avoided',20)+rp('Δ expansion',14)+rp('monthly Δflow',16)+
            rp('Σ Δflows',14)+rp('Δ closing ARR',16)+rp('Δ GP',10));
[1,3,6,12,24,36,60].forEach(function(t){
  var x = acc.rows[t-1];
  console.log('  '+pad('M'+t,8)+rp(k(-x.dLeakage),20)+rp(k(x.dExpansion),14)+rp(k(x.monthlyStep),16)+
              rp(k(x.cumulative),14)+rp(k(x.dClosingARR),16)+rp(k(x.dGrossProfit),10));
});
console.log('  max |Σ Δflows − Δ closing ARR| over 60 months: €'+acc.maxResidual.toExponential(2));
console.log('\n  The chain: Δflow → Δstock → Δfuture flow. A €108k first month becomes €14.95m of');
console.log('  stock and €983k a month of gross profit, with no change to acquisition at all.');

var re = P.retentionExponent();
console.log('\n'+L());
console.log('§12 ILLUSTRATIVE — repeated survival is exponential (not the engine scenario)');
console.log(L());
console.log('  0.98^60 = '+(re.survA*100).toFixed(1)+'%    0.99^60 = '+(re.survB*100).toFixed(1)+
            '%    ratio '+re.ratio.toFixed(2)+'×');
console.log('  One point of monthly survival nearly doubles what remains after five years.');

/* G. reconciliation evidence across every month and both lenses */
var wA=0, wF=0, wC=0, wD=0;
for (var t=1; t<=r.horizon; t++){
  var a1=P.pulseAt(r,t), b1=P.deltaPulseAt(r,RET,t);
  wA=Math.max(wA,Math.abs(a1.arrResidual)); wF=Math.max(wF,Math.abs(a1.fcfResidual));
  wC=Math.max(wC,Math.abs(a1.cashResidual)); wD=Math.max(wD,Math.abs(b1.arrResidual));
}
console.log('\n'+L());
console.log('G. RECONCILIATION EVIDENCE — all 60 months, both lenses');
console.log(L());
console.log('  ARR bridge, absolute      max residual €'+wA.toExponential(2));
console.log('  GP → FCF bridge           max residual €'+wF.toExponential(2));
console.log('  cash roll-forward         max residual €'+wC.toExponential(2));
console.log('  ARR bridge, delta         max residual €'+wD.toExponential(2));
console.log('  Δ-stock accumulator       max residual €'+acc.maxResidual.toExponential(2));
console.log('');
