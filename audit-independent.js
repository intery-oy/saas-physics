/*
 * SaaS Physics — INDEPENDENT AUDIT MODEL.  NOT PART OF THE PRODUCT.
 *
 * A clean-room reimplementation of the economics, written from the documented laws rather than
 * from engine.js, so that agreement between the two is evidence rather than tautology. The
 * engine is imported ONLY to obtain the numbers under audit; not one of its economic functions
 * is called to produce the independent figures below.
 *
 * The laws, as stated in the modules' own documentation:
 *
 *   monthly persistence     g  = P^(1/12)                    (ARR-only worlds)
 *   monthly expansion       e  = (1+X)^(1/12) − 1
 *   monthly logo survival   l  = L^(1/12)                    (Customer Physics)
 *   monthly contraction     cM = 1 − (1−C)^(1/12)
 *   derived persistence     g  = l(1 − cM)
 *   acquisition response    N  = sm / cacPerARR              (uncapped)
 *                           N  = sm / (cacPerARR + sm/cap)   (capped)
 *   revenue                 = (openingMRR + closingMRR) / 2  (midpoint)
 *   EBITA                   = GP − S&M − R&D − G&A − expansion cost − hypothesis cost
 *   FCF                     = EBITA, or collections − cash costs under Cash Physics
 *
 * Run: node audit-independent.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');

var OUT = [];
function rec(block, name, pass, detail) { OUT.push([block, name, pass, detail || '']); }
function rel(a, b) { var m = Math.max(Math.abs(a), Math.abs(b), 1); return Math.abs(a - b) / m; }

/* ------------------------------------------------------------------ *
 * THE INDEPENDENT MODEL
 * ------------------------------------------------------------------ */
function independent(a, s) {
  var H = 60;
  var P = a.persistenceAnnual, X = a.expansionCoefficientAnnual;
  var L = a.logoRetentionAnnual, C = a.contractionAnnual || 0;
  var CU = (L !== null && L !== undefined);
  var gm = a.grossMargin, sm = a.sm, rd = a.rd, ga = a.ga;
  var LAG = a.acquisitionLagMonths || 0;
  var PIPE = (a.openingPipelineMonths === null || a.openingPipelineMonths === undefined) ? 0 : a.openingPipelineMonths;
  var cap = a.maxMonthlyNewARR, capOn = (cap !== null && cap !== undefined);
  var xc = a.expansionCostPerARR || 0;

  var e = Math.pow(1 + X, 1 / 12) - 1;
  var l = CU ? Math.pow(L, 1 / 12) : null;
  var cM = CU ? 1 - Math.pow(1 - C, 1 / 12) : null;
  var g = CU ? l * (1 - cM) : Math.pow(P, 1 / 12);

  /* the acquisition law, differentiated by hand for the marginal figure */
  var N = !(a.cacPerARR > 0) ? 0 : (capOn ? (cap > 0 ? sm / (a.cacPerARR + sm / cap) : 0) : sm / a.cacPerARR);
  var avgCAC = N > 0 ? sm / N : Infinity;
  var margCAC = !(a.cacPerARR > 0) ? Infinity
    : (capOn ? (function () { var d = a.cacPerARR + sm / cap; return (d * d) / a.cacPerARR; })() : a.cacPerARR);

  /* opening book */
  var openARR = s && s.openingARR !== undefined ? s.openingARR : E.DEFAULT_START.openingARR;
  var openCus = s && s.openingCustomers !== undefined ? s.openingCustomers : E.DEFAULT_START.openingCustomers;
  var openCash = s && s.openingCash !== undefined ? s.openingCash : E.DEFAULT_START.openingCash;
  var newLogoARPA = CU ? (a.newLogoARPA !== null && a.newLogoARPA !== undefined ? a.newLogoARPA : openARR / openCus) : null;

  var cohorts = [{ m: 0, mrr: openARR / 12, n: CU ? openCus : null, born: 0, rows: [] }];
  /* the warm pipeline: PIPE entries bought before month 1, maturing in months LAG−PIPE+1..LAG */
  var pipeline = [];
  for (var pw = LAG - PIPE + 1; pw <= LAG; pw++) pipeline.push({ mature: pw, arr: N, sm: 0, pre: true });
  var months = [];
  var cash = openCash;

  /* Cash Physics, reimplemented from the billing rules */
  var BT = a.billingTermMonths, CASH = (BT !== null && BT !== undefined);
  var TIM = a.billingTiming || 'advance', DLY = a.collectionDelayMonths || 0;
  var arq = [];
  function unitsFor(openingMRR, staggered) {
    if (!staggered) return [{ share: 1, phase: 0, deferred: 0 }];
    var u = [];
    for (var k = 0; k < BT; k++)
      u.push({ share: 1 / BT, phase: k,
        deferred: TIM === 'advance' ? (k === 0 ? 0 : BT - k) * openingMRR / BT : -(k * openingMRR / BT) });
    return u;
  }
  function bill(units, age, runRate, revenue) {
    var b = 0, d = 0;
    for (var i = 0; i < units.length; i++) {
      var u = units[i], rev = revenue * u.share, inv = 0;
      if (TIM === 'advance') { if ((age + u.phase) % BT === 0) { inv = BT * runRate * u.share - u.deferred; u.deferred += inv; } u.deferred -= rev; }
      else { u.deferred -= rev; if ((age + u.phase + 1) % BT === 0) { inv = -u.deferred; u.deferred = 0; } }
      b += inv; d += u.deferred;
    }
    return { billings: b, deferred: d };
  }
  if (CASH) cohorts[0].units = unitsFor(cohorts[0].mrr, true);

  var deferredPrev = 0, recvPrev = 0;
  if (CASH) { var dsum = 0; for (var q = 0; q < cohorts[0].units.length; q++) dsum += cohorts[0].units[q].deferred; deferredPrev = dsum; }

  for (var t = 1; t <= H; t++) {
    var openingMRR = 0, i2;
    for (i2 = 0; i2 < cohorts.length; i2++) openingMRR += cohorts[i2].mrr;
    var retained = 0, leakage = 0, expansion = 0, logoChurnMRR = 0, contractionMRR = 0;
    var nOpen = 0, nClose = 0, cohortRev = 0, billings = 0, deferred = 0, expCost = 0;

    for (i2 = 0; i2 < cohorts.length; i2++) {
      var c = cohorts[i2], o = c.mrr, ret, lk, ex;
      if (CU) {
        var n1 = c.n * l, lc = o * (1 - l), sv = o * l, ct = sv * cM;
        ret = sv - ct; ex = ret * e; lk = lc + ct;
        logoChurnMRR += lc; contractionMRR += ct; nOpen += c.n; nClose += n1; c.n = n1;
      } else { ret = o * g; lk = o - ret; ex = ret * e; }
      var cl = ret + ex;
      var rev = (o + cl) / 2;
      c.rows.push({ t: t, openingARR: o * 12, leakage: lk * 12, expansion: ex * 12, closingARR: cl * 12 });
      retained += ret; leakage += lk; expansion += ex; cohortRev += rev;
      expCost += ex * 12 * xc;
      if (CASH) { var bb = bill(c.units, c.m === 0 ? t - 1 : t - c.m, o, rev); billings += bb.billings; deferred += bb.deferred; }
      c.mrr = cl;
    }

    /* spend now; it matures at t + LAG */
    pipeline.push({ mature: t + LAG, arr: N, sm: sm, pre: false });
    var realisedARR = 0, realisedSpend = 0, realisedCus = 0, anyMature = false, fromSpend = null, preWin = true;
    for (var p2 = pipeline.length - 1; p2 >= 0; p2--) {
      if (pipeline[p2].mature === t) {
        var en = pipeline.splice(p2, 1)[0];
        anyMature = true; realisedARR += en.arr; realisedSpend += en.sm;
        if (!en.pre) preWin = false;
        var spendMonth = en.mature - LAG;
        if (fromSpend === null || spendMonth < fromSpend) fromSpend = spendMonth;
        if (CU) realisedCus += en.arr / newLogoARPA;
      }
    }
    var realisedMRR = realisedARR / 12;
    if (anyMature) {
      var nc = { m: t, mrr: realisedMRR, n: CU ? realisedCus : null, born: t, rows: [] };
      nc.rows.push({ t: t, openingARR: 0, leakage: 0, expansion: 0, closingARR: realisedARR });
      if (CASH) { nc.units = unitsFor(realisedMRR, false);
        var b0 = bill(nc.units, 0, realisedMRR, realisedMRR / 2); billings += b0.billings; deferred += b0.deferred; }
      cohorts.push(nc);
      cohortRev += realisedMRR / 2;
      if (CU) nClose += realisedCus;
    }

    var closingMRR = retained + expansion + realisedMRR;
    var revenue = (openingMRR + closingMRR) / 2;
    var cogs = revenue * (1 - gm), gp = revenue * gm;
    var ebita = gp - sm - rd - ga - expCost;
    var fcf = ebita, collections = null, recv = recvPrev, cashCosts = null;
    if (CASH) {
      arq.push(billings);
      collections = arq.length > DLY ? arq.shift() : 0;
      recv = 0; for (var r2 = 0; r2 < arq.length; r2++) recv += arq[r2];
      cashCosts = cogs + sm + rd + ga + expCost;
      fcf = collections - cashCosts;
    }
    var cashOpening = cash; cash = cashOpening + fcf;

    var pendARR = 0, pendSpend = 0;
    for (var p3 = 0; p3 < pipeline.length; p3++) { pendARR += pipeline[p3].arr; pendSpend += pipeline[p3].sm; }

    months.push({ t: t, openingMRR: openingMRR, closingMRR: closingMRR,
      openingARR: openingMRR * 12, closingARR: closingMRR * 12,
      retainedARR: retained * 12, leakage: leakage * 12, expansion: expansion * 12,
      newARR: realisedARR, producedARR: N, pendingNewARR: pendARR, pendingSpend: pendSpend,
      fromSpendMonth: anyMature ? fromSpend : null, preWindow: anyMature ? preWin : null,
      realisedSpend: preWin && anyMature ? null : realisedSpend,
      logoChurnARR: CU ? logoChurnMRR * 12 : null, contractionARR: CU ? contractionMRR * 12 : null,
      customersOpening: CU ? nOpen : null, customersClosing: CU ? nClose : null,
      revenue: revenue, cohortRevenue: cohortRev, cogs: cogs, grossProfit: gp,
      expansionCost: expCost, ebita: ebita, fcf: fcf,
      cashOpening: cashOpening, cashClosing: cash,
      billings: CASH ? billings : null, collections: collections,
      deferredOpening: CASH ? deferredPrev : null, deferredClosing: CASH ? deferred : null,
      receivablesOpening: CASH ? recvPrev : null, receivablesClosing: CASH ? recv : null,
      nrrMonthly: openingMRR > 0 ? (retained + expansion) / openingMRR : 1 });
    if (CASH) { deferredPrev = deferred; recvPrev = recv; }
  }
  return { months: months, cohorts: cohorts, N: N, avgCAC: avgCAC, margCAC: margCAC, g: g, e: e, l: l, cM: cM,
           paybackFloor: gm > 0 ? (a.cacPerARR * 12) / gm : Infinity };
}

/* ------------------------------------------------------------------ *
 * WORLDS
 * ------------------------------------------------------------------ */
function worldMon(fee, fg, usage) { return { components: [ { name: 'platform', kind: 'fixed', units: 1, priceAnnual: fee, priceGrowthAnnual: fg }, Object.assign({ name: 'usage', kind: 'variable' }, usage) ] }; }
var WORLDS = {
  'ARR-only (frozen base)':      [{}, undefined],
  'Customers':                   [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }, undefined],
  'Customers + lag 4 + warm 4':  [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, acquisitionLagMonths: 4, openingPipelineMonths: 4 }, undefined],
  'Customers + lag 4 cold':      [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, acquisitionLagMonths: 4 }, undefined],
  'Capacity bound':              [{ maxMonthlyNewARR: 500000 }, undefined],
  'Cash: 12mo advance, +1':      [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, billingTermMonths: 12, billingTiming: 'advance', collectionDelayMonths: 1 }, undefined],
  'Cash: 1mo arrears, +0':       [{ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, billingTermMonths: 1, billingTiming: 'arrears', collectionDelayMonths: 0 }, undefined],
  'Zero acquisition (sm=0)':     [{ sm: 0 }, undefined],
  'Zero churn (P=1)':            [{ persistenceAnnual: 1 }, undefined],
  'Zero expansion (X=0)':        [{ expansionCoefficientAnnual: 0 }, undefined],
  'Severe churn (P=0.40)':       [{ persistenceAnnual: 0.40 }, undefined],
  'Zero churn + zero expansion': [{ persistenceAnnual: 1, expansionCoefficientAnnual: 0 }, undefined],
  'Customers: no logo churn':    [{ logoRetentionAnnual: 1, contractionAnnual: 0 }, undefined],
  'Customers: severe churn':     [{ logoRetentionAnnual: 0.50, contractionAnnual: 0.20 }, undefined],
  'Expansion cost on':           [{ expansionCostPerARR: 0.25 }, undefined],
};

var AUDIT_MONTHS = [1, 4, 5, 12, 13, 27, 60];

console.log('INDEPENDENT AUDIT — clean-room model vs engine\n' + '='.repeat(78));
var grand = { checked: 0, failed: 0 };

Object.keys(WORLDS).forEach(function (name) {
  var over = WORLDS[name][0], st = WORLDS[name][1];
  var a = Object.assign({}, E.DEFAULT_ASSUMPTIONS, over);
  var eng, ind;
  try { eng = E.run(a, st); } catch (err) { console.log('\n' + name + '\n  ENGINE THREW: ' + err.message); return; }
  ind = independent(a, st || E.DEFAULT_START);

  var worst = {}, fields = ['openingARR', 'closingARR', 'retainedARR', 'leakage', 'expansion', 'newARR',
    'pendingNewARR', 'pendingSpend', 'revenue', 'cogs', 'grossProfit', 'expansionCost', 'ebita', 'fcf',
    'cashOpening', 'cashClosing'];
  fields.forEach(function (f) { worst[f] = 0; });
  var extra = { customersClosing: 0, logoChurnARR: 0, contractionARR: 0, billings: 0, collections: 0,
                deferredClosing: 0, receivablesClosing: 0, producedARR: 0, nrrMonthly: 0 };
  var detail = [];

  for (var t = 1; t <= 60; t++) {
    var em = eng.months[t - 1], im = ind.months[t - 1];
    fields.forEach(function (f) { var d = rel(em[f], im[f]); if (d > worst[f]) worst[f] = d; });
    if (im.customersClosing !== null && em.customers) {
      extra.customersClosing = Math.max(extra.customersClosing, rel(em.customers.closing, im.customersClosing));
      extra.logoChurnARR = Math.max(extra.logoChurnARR, rel(em.customers.logoChurnARR, im.logoChurnARR));
      extra.contractionARR = Math.max(extra.contractionARR, rel(em.customers.contractionARR, im.contractionARR));
    }
    if (im.billings !== null && em.cash) {
      extra.billings = Math.max(extra.billings, rel(em.cash.billings, im.billings));
      extra.collections = Math.max(extra.collections, rel(em.cash.collections, im.collections));
      extra.deferredClosing = Math.max(extra.deferredClosing, rel(em.cash.deferredClosing, im.deferredClosing));
      extra.receivablesClosing = Math.max(extra.receivablesClosing, rel(em.cash.receivablesClosing, im.receivablesClosing));
    }
    extra.producedARR = Math.max(extra.producedARR, rel(em.acquisitionLawNewARR, im.producedARR));
    extra.nrrMonthly = Math.max(extra.nrrMonthly, rel(em.nrrMonthly, im.nrrMonthly));
    if (AUDIT_MONTHS.indexOf(t) >= 0) {
      var fs2 = em.realisedFromSpendMonth, isf = im.fromSpendMonth;
      if (fs2 !== isf && !(fs2 === null && isf === null))
        detail.push('M' + t + ' spend-month engine=' + fs2 + ' independent=' + isf);
    }
  }
  var allWorst = 0, worstField = '';
  Object.keys(worst).forEach(function (f) { if (worst[f] > allWorst) { allWorst = worst[f]; worstField = f; } });
  Object.keys(extra).forEach(function (f) { if (extra[f] > allWorst) { allWorst = extra[f]; worstField = f; } });
  var ok = allWorst < 1e-9 && detail.length === 0;
  grand.checked++; if (!ok) grand.failed++;
  console.log('\n' + (ok ? 'PASS  ' : 'FAIL  ') + name);
  console.log('      worst relative disagreement over 60 months, all blocks: ' + allWorst.toExponential(2) + (worstField ? '  (' + worstField + ')' : ''));
  if (detail.length) console.log('      ' + detail.join('\n      '));
});

/* ---- RETENTION: R12M rebuilt from the independent cohorts ---- *
 * The window is defined as: freeze the cohorts that existed 12 months ago, take their ARR at the
 * start of the window, follow only those cohorts, and exclude every euro acquired inside it.
 * Rebuilt here from cohorts this file simulated, and compared to the product's KPI layer. */
console.log('\n' + '='.repeat(78) + '\nRETENTION — R12M rebuilt from the independent cohorts\n');
[['ARR-only', {}], ['Customers', { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }],
 ['Severe churn', { persistenceAnnual: 0.40 }], ['Lag 4 + warm 4', { acquisitionLagMonths: 4, openingPipelineMonths: 4 }],
 ['Zero expansion', { expansionCoefficientAnnual: 0 }]].forEach(function (w) {
  var a = Object.assign({}, E.DEFAULT_ASSUMPTIONS, w[1]);
  var eng = E.run(a), ind = independent(a, E.DEFAULT_START);
  var worstN = 0, worstG = 0, worstX = 0, worstId = 0, worstNew = 0;
  for (var T = 12; T <= 60; T++) {
    var start = T - 11, asOf = T - 12, open = 0, leak = 0, exp = 0, close = 0;
    ind.cohorts.forEach(function (c) {
      if (c.m > asOf) return;                       /* not eligible: acquired inside the window */
      var first = null, last = null;
      for (var i = 0; i < c.rows.length; i++) {
        var r = c.rows[i];
        if (r.t === start) first = r;
        if (r.t >= start && r.t <= T) { if (r.t > start || first) { leak += r.leakage; exp += r.expansion; } last = r; }
      }
      if (first) { open += first.openingARR; close += last ? last.closingARR : 0; }
    });
    var newIn = 0; for (var t3 = start; t3 <= T; t3++) newIn += ind.months[t3 - 1].newARR;
    var m = K.measureR12M(eng, T);
    worstN = Math.max(worstN, rel(close / open, m.nrr));
    worstG = Math.max(worstG, rel((open - leak) / open, m.grr));
    worstX = Math.max(worstX, rel(exp / open, m.expansionRate));
    worstNew = Math.max(worstNew, rel(newIn, m.newARRExcluded));
    worstId = Math.max(worstId, Math.abs((m.grr + m.expansionRate) - m.nrr));
  }
  var ok = Math.max(worstN, worstG, worstX, worstNew) < 1e-9 && worstId < 1e-12;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + w[0].padEnd(18) +
    ' NRR ' + worstN.toExponential(1) + '  GRR ' + worstG.toExponential(1) +
    '  expansion ' + worstX.toExponential(1) + '  new-ARR excluded ' + worstNew.toExponential(1) +
    '  GRR+exp-NRR ' + worstId.toExponential(1));
  grand.checked++; if (!ok) grand.failed++;
});


/* ------------------------------------------------------------------ *
 * MONETIZATION — the per-customer component dynamics, reimplemented.
 *
 * From the module's documented laws, in the stated order each month:
 *   1 contraction   variable units x (1 - cM)
 *   2 price         price_k x (1 + pM_k),      every component
 *   3 usage         units_k -> min(cap_k, units_k (1 + uM_k)),  variable only
 *   4 adoption      pen_k   -> pen_k + (penCap_k - pen_k) aM_k, variable only
 * with revenue per customer = SUM_k penetration_k x units_k x price_k, annual,
 * and rates pM = (1+P)^(1/12) - 1, uM = (1+U)^(1/12) - 1, aM = 1 - (1-A)^(1/12).
 *
 * The four effects are the revenue differences BETWEEN those steps, so their order matters and
 * is part of the law. Nothing below calls monetization.js.
 * ------------------------------------------------------------------ */
function monetizationIndependent(spec, cM, months) {
  var comp = spec.components.map(function (c) {
    var fixed = c.kind === 'fixed';
    return { fixed: fixed,
      pen: c.penetration === undefined ? 1 : c.penetration,
      units: c.units, price: c.priceAnnual,
      pM: Math.pow(1 + (c.priceGrowthAnnual || 0), 1 / 12) - 1,
      uM: fixed ? 0 : Math.pow(1 + (c.usageGrowthAnnual || 0), 1 / 12) - 1,
      aM: fixed ? 0 : 1 - Math.pow(1 - (c.adoptionAnnual || 0), 1 / 12),
      unitsCap: fixed ? c.units : (c.unitsCap === undefined ? null : c.unitsCap),
      penCap: fixed ? 1 : (c.penetrationCap === undefined ? 1 : c.penetrationCap) };
  });
  function rev() { var f = 0, v = 0; comp.forEach(function (k) { var x = k.pen * k.units * k.price; if (k.fixed) f += x; else v += x; }); return { total: f + v, fixed: f, variable: v }; }
  var out = [];
  for (var t = 1; t <= months; t++) {
    var r0 = rev().total;
    comp.forEach(function (k) { if (!k.fixed) k.units *= (1 - cM); });
    var r1 = rev().total;
    comp.forEach(function (k) { k.price *= (1 + k.pM); });
    var r2 = rev().total;
    comp.forEach(function (k) { if (!k.fixed) { var u = k.units * (1 + k.uM); k.units = k.unitsCap === null ? u : Math.min(k.unitsCap, u); } });
    var r3 = rev().total;
    comp.forEach(function (k) { if (!k.fixed) k.pen += (k.penCap - k.pen) * k.aM; });
    var rv = rev();
    out.push({ t: t, opening: r0, closing: rv.total, fixed: rv.fixed, variable: rv.variable,
      contraction: r0 - r1, price: r2 - r1, usage: r3 - r2, adoption: rv.total - r3 });
  }
  return out;
}

console.log('\n' + '='.repeat(78) + '\nMONETIZATION — component dynamics rebuilt from the documented laws\n');
[
  ['platform + usage, caps far off', { components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.03 },
      { name: 'usage', kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.01, usageGrowthAnnual: 0.20, unitsCap: 100000, adoptionAnnual: 0.10, penetrationCap: 1 } ] }],
  ['usage cap binds early',          { components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000 },
      { name: 'usage', kind: 'variable', penetration: 0.5, units: 100, priceAnnual: 100, usageGrowthAnnual: 0.60, unitsCap: 110, adoptionAnnual: 0.30, penetrationCap: 0.9 } ] }],
  ['penetration cap already reached',{ components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 9000 },
      { name: 'usage', kind: 'variable', penetration: 0.95, units: 50, priceAnnual: 80, usageGrowthAnnual: 0.10, unitsCap: 200, adoptionAnnual: 0.25, penetrationCap: 0.95 } ] }],
  ['null world: no growth of any kind', { components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 20000 },
      { name: 'usage', kind: 'variable', penetration: 0.6, units: 40, priceAnnual: 60, usageGrowthAnnual: 0, adoptionAnnual: 0, penetrationCap: 0.6 } ] }],
  ['falling unit price',             { components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 2400 },
      { name: 'usage', kind: 'variable', penetration: 0.9, units: 500, priceAnnual: 12, priceGrowthAnnual: -0.05, usageGrowthAnnual: 0.45, unitsCap: 3000, adoptionAnnual: 0.30, penetrationCap: 1 } ] }],
  ['fixed only, no variable line',   { components: [
      { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 15000, priceGrowthAnnual: 0.05 } ] }]
].forEach(function (w) {
  var label = w[0], spec = w[1];
  var a = Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 0.92, contractionAnnual: 0.05, monetization: spec, sm: 0 });
  var eng;
  try { eng = E.run(a, { openingCustomers: 1000, openingCash: 50000000 }); }
  catch (err) { console.log('FAIL  ' + label + '   engine threw: ' + err.message); grand.checked++; grand.failed++; return; }
  var cM = 1 - Math.pow(1 - 0.05, 1 / 12);
  var ind = monetizationIndependent(spec, cM, 60);
  /* the opening base cohort is the only cohort here (sm = 0), so its per-customer effects scale
     to the company by its customer count: effect_ARR = closing customers x per-customer effect */
  var base = eng.cohorts[0], worst = { contraction: 0, price: 0, usage: 0, adoption: 0, perCustomer: 0, fixedShare: 0 };
  for (var t = 1; t <= 60; t++) {
    var row = base.rows[t - 1], mo = row.monetization, im = ind[t - 1];
    var n = row.customers.closing;
    worst.contraction = Math.max(worst.contraction, rel(mo.contractionARR, n * im.contraction));
    worst.price = Math.max(worst.price, rel(mo.priceARR, n * im.price));
    worst.usage = Math.max(worst.usage, rel(mo.usageARR, n * im.usage));
    worst.adoption = Math.max(worst.adoption, rel(mo.adoptionARR, n * im.adoption));
    worst.perCustomer = Math.max(worst.perCustomer, rel(mo.perCustomerClosing, im.closing));
    worst.perCustomer = Math.max(worst.perCustomer, rel(mo.perCustomerOpening, im.opening));
    worst.fixedShare = Math.max(worst.fixedShare, rel(mo.fixedARR, n * im.fixed));
  }
  var w2 = Math.max(worst.contraction, worst.price, worst.usage, worst.adoption, worst.perCustomer, worst.fixedShare);
  var ok = w2 < 1e-9;
  grand.checked++; if (!ok) grand.failed++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + label.padEnd(34) + ' worst ' + w2.toExponential(2) +
    '   (contraction ' + worst.contraction.toExponential(1) + '  price ' + worst.price.toExponential(1) +
    '  usage ' + worst.usage.toExponential(1) + '  adoption ' + worst.adoption.toExponential(1) + ')');
});

/* Caps are the part of the monetization law that is easy to implement and easy to get wrong:
   they must BIND, never be crossed, and they must make per-customer revenue converge. Checked
   against the independent model's own trajectory, not against the engine. */
console.log('');
(function () {
  var cM = 1 - Math.pow(1 - 0.05, 1 / 12);
  var spec = { components: [ { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000 },
    { name: 'usage', kind: 'variable', penetration: 0.4, units: 100, priceAnnual: 100,
      usageGrowthAnnual: 0.80, unitsCap: 150, adoptionAnnual: 0.40, penetrationCap: 0.9 } ] };
  var a = Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 1, contractionAnnual: 0, monetization: spec, sm: 0 });
  var eng = E.run(a, { openingCustomers: 1000, openingCash: 50000000 });
  var rows = eng.cohorts[0].rows;
  var st = rows[59].monetization.state[1];
  var hr = rows[59].monetization.headroom[1];
  var perCust = rows.map(function (r) { return r.monetization.perCustomerClosing; });
  var gaps = [11, 23, 35, 47, 59].map(function (i) { return perCust[i] - perCust[i - 1]; });
  var converging = gaps.every(function (g, i) { return i === 0 || g <= gaps[i - 1] + 1e-9; });
  var ind = monetizationIndependent(spec, 0, 60);
  var indUnits = 100, indPen = 0.4;   /* the same trajectory, independently */
  var okCap = st.units <= 150 + 1e-9 && st.penetration <= 0.9 + 1e-9;
  /* usage is a hard min() so it REACHES the cap; adoption closes a fraction of the remaining
     gap each month, so it approaches its cap asymptotically and must never reach it */
  var pen0 = rows[0].monetization.state[1].penetration;
  var bound = st.units > 149.999 && st.penetration < 0.9 && st.penetration > pen0 &&
              rows.every(function (r) { return r.monetization.state[1].penetration < 0.9 + 1e-12; });
  var ok = okCap && bound && converging && Math.abs(ind[59].closing - perCust[59]) < 1e-9;
  grand.checked++; if (!ok) grand.failed++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + 'caps bind and are never crossed — usage reaches its ceiling, adoption approaches its own asymptotically, and per-customer revenue converges');
  console.log('      units ' + st.units.toFixed(4) + ' of cap 150 (headroom ' + (hr.units * 100).toFixed(2) + '%)   ' +
              'penetration ' + st.penetration.toFixed(5) + ' of cap 0.9 (' + (hr.penetration * 100).toFixed(2) + '%)');
  console.log('      per-customer revenue year on year: ' + gaps.map(function (g) { return '€' + g.toFixed(0); }).join(' → ') +
              '   monotonically narrowing: ' + converging);
})();

console.log('\n' + '='.repeat(78));
console.log(grand.checked - grand.failed + ' / ' + grand.checked + ' reconciliations agree with the independent model');
