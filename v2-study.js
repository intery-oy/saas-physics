/*
 * SaaS Physics v2 — the economic-system experiments, printed with their
 * measured results. Every number is engine output; the research notes in
 * docs/RN-*-PHYSICS.md quote this script.
 *
 *   A. CUSTOMER PHYSICS   the matched-world pair: same ARR and NRR, different customers
 *
 * Run: node v2-study.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');
var A = E.DEFAULT_ASSUMPTIONS;

var m = function (v) { return '€' + (v / 1e6).toFixed(2) + 'm'; };
var sm = function (v) { return (v >= 0 ? '+' : '−') + '€' + Math.abs(v / 1e6).toFixed(2) + 'm'; };
var pc = function (v, d) { return (v * 100).toFixed(d === undefined ? 1 : d) + '%'; };
var L = function (w) { return '─'.repeat(w || 96); };
function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function rpad(s, n) { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }
function maxOver(r1, r2, f) { var w = 0; for (var q = 0; q < r1.months.length; q++) w = Math.max(w, Math.abs(f(r1.months[q]) - f(r2.months[q]))); return w; }

console.log('\nSaaS Physics — economic system study   (model v' + E.run().modelVersion + ')');
console.log(L());

/* ================================================================== *
 * A. CUSTOMER PHYSICS — the matched-world experiment
 * ================================================================== */
console.log('A. CUSTOMER PHYSICS — three worlds with the same dollar persistence 87.4%');
console.log(L());
var worlds = [
  ['V · v1.3, persistence set',           { persistenceAnnual: 0.874 }],
  ['B · every lost euro is a lost logo',  { logoRetentionAnnual: 0.874, contractionAnnual: 0 }],
  ['X · fewer logos lost, survivors shrink', { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }],
  ['Y · almost no logos lost, heavy contraction', { logoRetentionAnnual: 0.98, contractionAnnual: 0.874 / 0.98 > 1 ? 0 : 1 - 0.874 / 0.98 }]
];
var runs = worlds.map(function (w) { return { name: w[0], a: w[1], r: E.run(Object.assign({}, A, w[1])) }; });
var ref = runs[0].r;
console.log('  Same opening state (€20m ARR, 1,000 customers → ARPA €20,000), S&M, CAC, expansion 10%, gross margin, R&D, G&A.\n');
console.log('  ' + pad('world', 46) + rpad('P in force', 12) + rpad('max |ΔARR|', 12) + rpad('max |Δcash|', 12) + rpad('M60 ARR', 12) + rpad('M60 cash', 12));
console.log('  ' + L(106));
runs.forEach(function (w) {
  var last = w.r.months[59];
  console.log('  ' + pad(w.name, 46) + rpad(pc(w.r.derived.persistenceAnnualEffective, 2), 12) + rpad('€' + maxOver(ref, w.r, function (mm) { return mm.closingARR; }).toExponential(1), 12) +
              rpad('€' + maxOver(ref, w.r, function (mm) { return mm.cashClosing; }).toExponential(1), 12) + rpad(m(last.closingARR), 12) + rpad(m(last.cashClosing), 12));
});
console.log('\n  What the ARR-only measurement reports at T = 36 and T = 60 (identical across the four):');
[36, 60].forEach(function (T) {
  var k = K.measureR12M(ref, T);
  console.log('    T=' + T + '  R12M GRR ' + pc(k.grr, 2) + ' · expansion ' + pc(k.expansionRate, 2) + ' · NRR ' + pc(k.nrr, 2) + ' · ARR growth ' + pc(k.arrGrowth, 1));
});
console.log('\n  What the customer layer adds (worlds B, X, Y; V has no customers):');
console.log('  ' + pad('world', 46) + rpad('logo ret. R12M', 15) + rpad('GRR R12M', 10) + rpad('lost-logo €', 12) + rpad('contraction €', 14) + rpad('customers M60', 15) + rpad('ARPA M60', 10));
console.log('  ' + L(122));
runs.slice(1).forEach(function (w) {
  var c = K.customerMeasures(w.r, 60);
  console.log('  ' + pad(w.name, 46) + rpad(pc(c.logoRetentionR12M, 1), 15) + rpad(pc(c.grrR12M, 2), 10) + rpad(pc(c.dollarChurnFromLogosR12M, 2), 12) + rpad(pc(c.dollarChurnFromContractionR12M, 2), 14) +
              rpad(c.companyCustomersClosing.toFixed(0), 15) + rpad('€' + c.arpaClosing.toFixed(0), 10));
});
var cB = K.customerMeasures(runs[1].r, 60), cY = K.customerMeasures(runs[3].r, 60);
console.log('\n  Between B and Y the company ends with ' + (cY.companyCustomersClosing / cB.companyCustomersClosing).toFixed(2) + '× the customers at ' +
            (cY.arpaClosing / cB.arpaClosing * 100).toFixed(0) + '% of the ARPA — on identical ARR, revenue, cash, GRR and NRR at every month.');
console.log('  Cumulative M1–M60 leakage in B: ' + m(runs[1].r.months[59].customers.cumulative.logoChurnARR) + ' lost logos + ' + m(runs[1].r.months[59].customers.cumulative.contractionARR) + ' contraction;' +
            ' in Y: ' + m(runs[3].r.months[59].customers.cumulative.logoChurnARR) + ' + ' + m(runs[3].r.months[59].customers.cumulative.contractionARR) + '. Total leakage identical: ' +
            m(runs[1].r.months[59].cumulative.leakage) + ' vs ' + m(runs[3].r.months[59].cumulative.leakage) + '.');

/* --- the decomposition GRR cannot make on its own --- */
console.log('\n  R12M GRR decomposition in world X at T = 36 (frozen eligible cohort, opening ' + m(K.customerMeasures(runs[2].r, 36).openingARR) + '):');
var cx = K.customerMeasures(runs[2].r, 36), kx = K.measureR12M(runs[2].r, 36);
console.log('    100% − ' + pc(cx.dollarChurnFromLogosR12M, 2) + ' (departing customers) − ' + pc(cx.dollarChurnFromContractionR12M, 2) + ' (surviving customers shrinking) = GRR ' + pc(cx.grrR12M, 2) +
            '  (kpi.measureR12M: ' + pc(kx.grr, 2) + ', identity residual ' + cx.identityResidual.toExponential(1) + ')');
console.log('    logo retention R12M ' + pc(cx.logoRetentionR12M, 3) + ' reads back L = 92% exactly; GRR does not, because it is measured in euros on a base expansion moved.');

/* --- ARR per new logo: customers, never ARR --- */
console.log('\n  ARR per new logo (world X): €20,000 (opening ARPA) vs €10,000 vs €40,000');
[null, 10000, 40000].forEach(function (k) {
  var r = E.run(Object.assign({}, A, runs[2].a, { newLogoARPA: k })), c = K.customerMeasures(r, 60);
  console.log('    ' + pad(k === null ? 'opening ARPA €20,000' : '€' + k, 22) + ' M60 ARR ' + m(r.months[59].closingARR) + ' (Δ vs X €' + maxOver(runs[2].r, r, function (mm) { return mm.closingARR; }).toExponential(1) + ')' +
              ' · customers ' + c.companyCustomersClosing.toFixed(0) + ' · ARPA €' + c.arpaClosing.toFixed(0) + ' · logo retention ' + pc(c.logoRetentionR12M, 1));
});
console.log('\n' + L());

/* ================================================================== *
 * B. MONETIZATION PHYSICS — where survivor revenue change comes from
 * ================================================================== */
console.log('\nB. MONETIZATION PHYSICS — revenue derived from per-customer components');
console.log(L());
var MSPEC = { components: [
  { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.03 },
  { name: 'usage', kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 } ] };
var CUW = { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 };
var rB = E.run(Object.assign({}, A, CUW, { monetization: MSPEC }));
console.log('  Opening base 1,000 customers × (platform €12,000 + usage 80% × 100 units × €100) = €20.0m ARR (derived; the €20m input is not read).');
console.log('  Laws: L 92%, C 5% (variable units only); platform price +3%/yr; usage price +2%/yr, usage +15%/yr to a 300-unit cap, adoption 10%/yr of the remaining non-adopters to 95%.');
console.log('  The generic expansion coefficient (10%) is bypassed.\n');
console.log('  R12M decomposition on the frozen eligible cohort (K.monetizationMeasures):');
console.log('  ' + pad('T', 6) + rpad('opening ARR', 13) + rpad('− logos', 9) + rpad('− contr.', 10) + rpad('+ price', 9) + rpad('+ usage', 9) + rpad('+ adopt.', 9) + rpad('= NRR', 9) + rpad('GRR', 9) + rpad('residual', 10) + rpad('var. share', 12));
console.log('  ' + L(105));
[12, 24, 36, 48, 60].forEach(function (T) {
  var mm = K.monetizationMeasures(rB, T);
  console.log('  ' + pad(T, 6) + rpad(m(mm.openingARR), 13) + rpad(pc(mm.logoChurnR12M, 2), 9) + rpad(pc(mm.contractionR12M, 2), 10) + rpad(pc(mm.priceEffectR12M, 2), 9) + rpad(pc(mm.usageEffectR12M, 2), 9) + rpad(pc(mm.adoptionEffectR12M, 2), 9) +
              rpad(pc(mm.nrrR12M, 2), 9) + rpad(pc(mm.grrR12M, 2), 9) + rpad(mm.identityResidual.toExponential(1), 10) + rpad(pc(mm.companyVariableShare, 1), 12));
});
var b60 = rB.months[59];
console.log('\n  M60: ARR ' + m(b60.closingARR) + ' = fixed ' + m(b60.monetization.fixedARR) + ' + variable ' + m(b60.monetization.variableARR) + ' · cumulative expansion: price ' + m(b60.monetization.cumulative.priceARR) +
            ' + usage ' + m(b60.monetization.cumulative.usageARR) + ' + adoption ' + m(b60.monetization.cumulative.adoptionARR) + ' = ' + m(b60.cumulative.expansion));
var hb = rB.cohorts[0].rows[59].monetization.headroom[1];
console.log('  Opening base at M60: per-customer revenue €' + rB.cohorts[0].rows[59].monetization.perCustomerClosing.toFixed(0) + ' · usage headroom used ' + pc(hb.units, 1) + ' of the cap · penetration ' + pc(hb.penetration, 1) + ' of its cap.');

/* --- B.2 the matched-start pair: mix alone changes dollar retention --- */
console.log('\n  B.2  Same opening ARR, customers, ARPA, L and C — only the fixed/variable MIX differs (no growth drivers):');
var pairs = [
  ['all fixed  (platform €20,000)',            { components: [{ kind: 'fixed', units: 1, priceAnnual: 20000 }] }],
  ['60 / 40    (€12,000 + 80% × 100 × €100)',  { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, penetrationCap: 0.8 }] }],
  ['all variable (100% × 200 × €100)',         { components: [{ kind: 'variable', penetration: 1, units: 200, priceAnnual: 100, penetrationCap: 1 }] }]
];
console.log('  ' + pad('mix', 44) + rpad('M1 logo churn', 15) + rpad('M1 contraction', 16) + rpad('GRR R12M @24', 14) + rpad('NRR R12M @24', 14) + rpad('M60 ARR', 12) + rpad('M60 cash', 12));
console.log('  ' + L(127));
pairs.forEach(function (pr) {
  var rr = E.run(Object.assign({}, A, CUW, { monetization: pr[1] })), k = K.measureR12M(rr, 24), m1 = rr.months[0];
  console.log('  ' + pad(pr[0], 44) + rpad(m(m1.customers.logoChurnARR), 15) + rpad(m(m1.monetization.contractionARR), 16) + rpad(pc(k.grr, 2), 14) + rpad(pc(k.nrr, 2), 14) + rpad(m(rr.months[59].closingARR), 12) + rpad(m(rr.months[59].cashClosing), 12));
});
console.log('  Contraction reaches variable revenue only: the same 5% contraction law costs the all-fixed world nothing and the all-variable world 5% a year.');
console.log('  Dollar persistence is emergent here — L(1 − C) = 87.4% is what it WOULD be if every euro were variable.');

/* --- B.3 saturation: a closed cohort converges to its ceiling --- */
console.log('\n  B.3  A closed cohort (no acquisition, no churn, no contraction): usage 30%/yr to a 300-unit cap, adoption 25%/yr to 95%, no price growth:');
var closed = E.run(Object.assign({}, A, { sm: 0, logoRetentionAnnual: 1, contractionAnnual: 0,
  monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, usageGrowthAnnual: 0.30, unitsCap: 300, adoptionAnnual: 0.25, penetrationCap: 0.95 }] } }), {}, 120);
var ceiling = 12000 + 0.95 * 300 * 100;
console.log('  ' + pad('month', 8) + rpad('per-customer €', 16) + rpad('units', 8) + rpad('penetration', 13) + rpad('expansion €/mo', 16) + rpad('of ceiling', 12));
console.log('  ' + L(73));
[1, 12, 24, 36, 48, 60, 84, 120].forEach(function (t) {
  var rw = closed.cohorts[0].rows[t - 1], st = rw.monetization.state[1];
  console.log('  ' + pad(t, 8) + rpad(rw.monetization.perCustomerClosing.toFixed(0), 16) + rpad(st.units.toFixed(1), 8) + rpad(pc(st.penetration, 1), 13) + rpad('€' + rw.expansion.toFixed(0), 16) + rpad(pc(rw.monetization.perCustomerClosing / ceiling, 2), 12));
});
console.log('  Ceiling = fixed + penetration cap × units cap × price = €' + ceiling + '. Expansion saturates: FINDINGS #13 / #30 are bounded under this layer, by the caps, not by a coefficient.');

/* --- B.4 price or usage? two worlds with the same year-1 NRR --- */
console.log('\n  B.4  "How much of the revenue change came from price?" — two worlds matched on R12M NRR at T = 12:');
var specPrice = { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.06 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.06, penetrationCap: 0.8 }] };
var rP = E.run(Object.assign({}, A, CUW, { monetization: specPrice })), targetNRR = K.measureR12M(rP, 12).nrr;
function usageWorld(u) { return E.run(Object.assign({}, A, CUW, { monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, usageGrowthAnnual: u, unitsCap: 250, penetrationCap: 0.8 }] } })); }
var lo = 0, hi = 3, rU;
for (var it = 0; it < 80; it++) { var mid = (lo + hi) / 2; rU = usageWorld(mid); if (K.measureR12M(rU, 12).nrr < targetNRR) lo = mid; else hi = mid; }
var uStar = (lo + hi) / 2; rU = usageWorld(uStar);
console.log('  P · price +6%/yr on every component, no usage growth        vs   U · usage +' + pc(uStar, 1) + '/yr to a 250-unit cap, no price growth');
console.log('  ' + pad('T', 6) + rpad('NRR P', 9) + rpad('NRR U', 9) + rpad('price P', 9) + rpad('usage U', 9) + rpad('ARR P', 11) + rpad('ARR U', 11) + rpad('U − P', 10) + rpad('headroom U', 12));
console.log('  ' + L(86));
[12, 24, 36, 48, 60].forEach(function (T) {
  var mp = K.monetizationMeasures(rP, T), mu = K.monetizationMeasures(rU, T);
  console.log('  ' + pad(T, 6) + rpad(pc(mp.nrrR12M, 2), 9) + rpad(pc(mu.nrrR12M, 2), 9) + rpad(pc(mp.priceEffectR12M, 2), 9) + rpad(pc(mu.usageEffectR12M, 2), 9) + rpad(m(rP.months[T - 1].closingARR), 11) + rpad(m(rU.months[T - 1].closingARR), 11) +
              rpad(sm(rU.months[T - 1].closingARR - rP.months[T - 1].closingARR), 10) + rpad(pc(mu.baseHeadroom[1].units, 1), 12));
});
console.log('  Identical at T = 12 by construction; they diverge because usage runs into its cap and price does not. The ARR-only world reports one expansion number for both.');
console.log('\n' + L());

/* ================================================================== *
 * C. CASH PHYSICS — the same P&L, different cash
 * ================================================================== */
console.log('\nC. CASH PHYSICS — billings, collections and the cash path beneath EBITA');
console.log(L());
var cashWorlds = [
  ['FCF = EBITA (off)',                       {}],
  ['monthly in advance',                      { billingTermMonths: 1 }],
  ['quarterly in advance',                    { billingTermMonths: 3 }],
  ['annual in advance',                       { billingTermMonths: 12 }],
  ['annual in advance, collected 2 mo later', { billingTermMonths: 12, collectionDelayMonths: 2 }],
  ['annual in arrears',                       { billingTermMonths: 12, billingTiming: 'arrears' }],
  ['annual in arrears, collected 2 mo later', { billingTermMonths: 12, billingTiming: 'arrears', collectionDelayMonths: 2 }]
];
console.log('  Base P&L in every row (S&M €900k, CAC 1.20×, persistence 90%, expansion 10%, GM 80%). Only billing and collection differ.\n');
console.log('  ' + pad('world', 44) + rpad('cum EBITA', 12) + rpad('cum FCF', 12) + rpad('FCF − EBITA', 13) + rpad('trough', 12) + rpad('at', 5) + rpad('M60 cash', 12) + rpad('deferred M60', 14) + rpad('recv. M60', 12));
console.log('  ' + L(136));
cashWorlds.forEach(function (w) {
  var r = E.run(Object.assign({}, A, w[1])), s = E.summarise(r), c = r.months[59].cash;
  console.log('  ' + pad(w[0], 44) + rpad(m(s.cumEbita), 12) + rpad(m(r.months[59].cumulative.fcf), 12) + rpad(sm(r.months[59].cumulative.fcf - s.cumEbita), 13) + rpad(m(s.cashTrough), 12) + rpad('M' + s.cashTroughMonth, 5) +
              rpad(m(s.endingCash), 12) + rpad(c ? m(c.deferredClosing) : '—', 14) + rpad(c ? m(c.receivablesClosing) : '—', 12));
});
console.log('\n  Deferred revenue is negative under arrears: a contract asset (revenue recognised, not yet invoiced).');
console.log('  The FCF − EBITA gap at M60 equals the change in deferred revenue minus the change in receivables since M0 — identity, every month.');

/* --- C.2 how a growing book funds itself --- */
var rAdv = E.run(Object.assign({}, A, { billingTermMonths: 12 })), r0c = E.run(A);
console.log('\n  C.2  Annual in advance, month by month: billings run ahead of revenue while the book grows');
console.log('  ' + pad('month', 8) + rpad('revenue', 11) + rpad('billings', 11) + rpad('Δdeferred', 12) + rpad('EBITA', 11) + rpad('cash FCF', 11) + rpad('cash', 11) + rpad('cash (off)', 12));
console.log('  ' + L(87));
[1, 2, 3, 6, 12, 13, 24, 36, 60].forEach(function (t) {
  var mm = rAdv.months[t - 1], c = mm.cash;
  console.log('  ' + pad(t, 8) + rpad(m(mm.revenue), 11) + rpad(m(c.billings), 11) + rpad(sm(c.deferredClosing - c.deferredOpening), 12) + rpad(m(mm.ebita), 11) + rpad(m(mm.fcf), 11) + rpad(m(mm.cashClosing), 11) + rpad(m(r0c.months[t - 1].cashClosing), 12));
});
var km36 = K.cashMeasures(rAdv, 36);
console.log('  Trailing-12 at M36: billings ' + m(km36.billingsR12M) + ' on revenue ' + m(km36.revenueR12M) + ' (' + km36.billingsToRevenue.toFixed(3) + '×) · cash conversion ' + km36.cashConversion.toFixed(2) + '× EBITA · deferred ' + km36.deferredMonthsOfRevenue.toFixed(1) + ' months of revenue.');
console.log('  Each new cohort is invoiced a year up front (M7 cohort: €750,000 in M7, €0 for eleven months, trued-up at renewal); the opening book, staggered, invoices ~1/12 of itself a month.');

/* --- C.3 growth push under different cash physics --- */
console.log('\n  C.3  The same growth push (S&M €900k → €1.8m) under three cash physics — what the P&L cannot see:');
console.log('  ' + pad('cash physics', 30) + rpad('trough Base', 13) + rpad('trough push', 13) + rpad('Δ trough', 12) + rpad('M60 cash Base', 15) + rpad('M60 cash push', 15) + rpad('Δ M60', 10));
console.log('  ' + L(108));
[['FCF = EBITA (off)', {}], ['annual in advance', { billingTermMonths: 12 }], ['annual in arrears, +2 mo', { billingTermMonths: 12, billingTiming: 'arrears', collectionDelayMonths: 2 }]].forEach(function (w) {
  var b = E.summarise(E.run(Object.assign({}, A, w[1]))), x = E.summarise(E.run(Object.assign({}, A, w[1], { sm: 1800000 })));
  console.log('  ' + pad(w[0], 30) + rpad(m(b.cashTrough), 13) + rpad(m(x.cashTrough), 13) + rpad(sm(x.cashTrough - b.cashTrough), 12) + rpad(m(b.endingCash), 15) + rpad(m(x.endingCash), 15) + rpad(sm(x.endingCash - b.endingCash), 10));
});
console.log('  Under annual advance billing the push funds part of itself (each new cohort pays a year up front); under arrears with a delay it deepens the trough by more than EBITA says.');
console.log('\n' + L());
