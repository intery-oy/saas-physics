/*
 * SaaS Physics v2 — ECONOMIC SYSTEM CHECKS
 *
 * The first check of every commit in the v2 programme is ALL-NULL-V13: with
 * every v2 layer at its null setting the engine must reproduce the COMPLETE
 * frozen v1.3 state (baseline-v1.3-full.json.gz, generated from the engine at
 * 44f7652 for twelve worlds including every v1.3 mechanism on) to €1e-6. Then,
 * gate by gate, the layer's own laws: reconciliation, no duplication or loss,
 * distinctness of what the layer claims to make distinct, provenance, and the
 * matched-world experiment that shows a result the layer below cannot produce.
 *
 * Run: node v2-checks.js
 */
'use strict';
var fs = require('fs'), zlib = require('zlib');
var E = require('./engine.js');
var K = require('./kpi.js');
var CAPm = require('./capital.js');
var CU = require('./customers.js');

var EPS = 1e-6;
var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }
function ex(v) { return Number(v).toExponential(2); }
function throws(fn) { try { fn(); return false; } catch (e) { return e instanceof RangeError; } }
var A = E.DEFAULT_ASSUMPTIONS;
function snapshot(r) {
  var r12 = [], am = [], xm = [], pc = [];
  for (var T = 12; T <= r.horizon; T++) { r12.push(K.measureR12M(r, T)); am.push(K.acquisitionMeasures(r, T)); xm.push(K.expansionCostMeasures(r, T)); }
  for (var t = 1; t <= r.horizon; t++) pc.push(CAPm.portfolioCapital(r, t));
  return { assumptions: r.assumptions, mechanisms: r.mechanisms, months: r.months, cohorts: r.cohorts, r12m: r12,
           acquisitionMeasures: am, expansionCostMeasures: xm, summary: E.summarise(r), derived: r.derived, bands: r.bands,
           acquisitionLedger: r.acquisitionLedger, pendingAtHorizon: r.pendingAtHorizon, portfolioCapital: pc };
}
/* Recursive comparison, driven by the REFERENCE object: every path in the
   reference must exist in the current run and agree. Paths that exist only in
   the current run (the v2 fields) are not visited here; they are asserted
   separately to be at their null values. */
function walkCompare(ref, cur, path, acc) {
  if (ref === null || typeof ref !== 'object') {
    acc.fields++;
    if (ref === null && (cur === Infinity || cur === -Infinity) && /maxAgeExclusive$/.test(path)) return;
    if (typeof ref === 'number') {
      if (typeof cur !== 'number') { acc.missing.push(path); return; }
      var d = Math.abs(ref - cur);
      if (!(d <= EPS) && !(ref === cur)) { if (d > acc.worst || isNaN(d)) { acc.worst = isNaN(d) ? Infinity : d; acc.where = path; } }
      else if (d > acc.worst) { acc.worst = d; acc.where = path; }
    } else if (ref !== cur) acc.missing.push(path + ' (' + String(ref) + ' vs ' + String(cur) + ')');
    return;
  }
  if (cur === null || typeof cur !== 'object') { acc.missing.push(path); return; }
  if (Array.isArray(ref)) {
    if (!Array.isArray(cur) || cur.length !== ref.length) { acc.missing.push(path + ' (length ' + ref.length + ' vs ' + (cur && cur.length) + ')'); return; }
    for (var i = 0; i < ref.length; i++) walkCompare(ref[i], cur[i], path + '[' + i + ']', acc);
    return;
  }
  Object.keys(ref).forEach(function (f) { walkCompare(ref[f], cur[f], path + '.' + f, acc); });
}
function maxDiff(r1, r2, f) { var w = 0; for (var q = 0; q < r1.months.length; q++) w = Math.max(w, Math.abs(f(r1.months[q]) - f(r2.months[q]))); return w; }

/* ================================================================== *
 * ALL-NULL-V13 — the release gate of every v2 commit
 * ================================================================== */
(function allNullV13() {
  var FULL = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/baseline-v1.3-full.json.gz')).toString('utf8'));
  var worlds = FULL._meta.worlds, total = 0, allOK = true;
  Object.keys(worlds).forEach(function (k) {
    var r = E.run(Object.assign({}, A, worlds[k]));
    var acc = { fields: 0, worst: 0, where: '', missing: [] };
    walkCompare(FULL[k], snapshot(r), k, acc);
    total += acc.fields;
    var pass = acc.worst < EPS && acc.missing.length === 0;
    allOK = allOK && pass;
    ok('ALL-NULL-V13', k + ': every v1.3 field (assumptions, mechanisms, months, cohorts + rows, R12M / acquisition / expansion-cost measures at every T, summary, derived, bands, ledger, pending, portfolio capital) reproduced at null',
       pass, acc.fields + ' fields; worst |Δ| = ' + ex(acc.worst) + (acc.worst ? ' at ' + acc.where : ' (exact)') + (acc.missing.length ? '; MISSING/MISMATCHED: ' + acc.missing.slice(0, 5).join(', ') : ''));
    /* v2-only state at its null value */
    var nulls = r.mechanisms.customerPhysics === false && r.derived.customers === null && r.derived.persistenceSource === 'input' &&
                r.derived.persistenceAnnualEffective === r.assumptions.persistenceAnnual &&
                r.months.every(function (m) { return m.customers === null; }) &&
                r.cohorts.every(function (c) { return c.customers === null && c.initialCustomers === null && c.finalCustomers === null && c.rows.every(function (rw) { return rw.customers === null; }); }) &&
                r.acquisitionLedger.every(function (e) { return e.newLogoARPAAtSpend === null; }) &&
                E.summarise(r).finalCustomers === null && K.customerMeasures(r, 36) === null;
    ok('ALL-NULL-V13', k + ': the v2-only state is null (no customer record on any month, cohort, row or ledger entry; persistence read from input; no customer measure)', nulls, '');
  });
  ok('ALL-NULL-V13', 'total fields compared against the complete v1.3 snapshot (' + FULL._meta.engineCommit + ')', total > 500000 && allOK, total + ' fields across ' + Object.keys(worlds).length + ' worlds');
  ok('ALL-NULL-V13', 'the default assumption object IS the all-null world', E.run().mechanisms.customerPhysics === false && A.logoRetentionAnnual === null && A.contractionAnnual === 0 && A.newLogoARPA === null, JSON.stringify(E.run().mechanisms));
})();

/* ================================================================== *
 * GATE A — CUSTOMER PHYSICS
 * ================================================================== */
var CUW = { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 };   /* the Gate A world used across gates */
(function gateA() {
  var r = E.run(Object.assign({}, A, CUW));
  ok('A-ON', 'logoRetentionAnnual set → customerPhysics on; persistence is DERIVED L(1−C) and the persistence input is reported as ignored',
     r.mechanisms.customerPhysics && r.derived.persistenceSource === 'derived: L(1 - C)' && Math.abs(r.derived.persistenceAnnualEffective - 0.92 * 0.95) < 1e-12 &&
     r.derived.customers.persistenceInputIgnored === 0.90 && Math.abs(r.derived.monthlyPersistence - Math.pow(0.874, 1 / 12)) < 1e-12,
     'P = ' + r.derived.persistenceAnnualEffective.toFixed(4) + ' (input 0.90 not read)');

  /* --- reconciliation: ARR fully reconciles to customer state, every cohort, every month --- */
  var worst = 0, where = '', rowsChecked = 0;
  r.cohorts.forEach(function (c) {
    var prevN = c.initialCustomers, prevMRR = null;
    c.rows.forEach(function (rw, i) {
      var cu = rw.customers; rowsChecked++;
      var birth = c.acquisitionMonth > 0 && i === 0;                    // the realisation row: new ARR / new customers, no ageing
      var d = Math.max(
        Math.abs(rw.openingMRR + (birth ? rw.closingMRR : 0) - cu.logoChurnMRR - cu.contractionMRR + rw.expansionMRR - rw.closingMRR),   // ARR bridge through customer flows
        Math.abs(rw.leakageMRR - (cu.logoChurnMRR + cu.contractionMRR)),                                    // leakage = logo churn + contraction
        Math.abs(cu.survivorMRR - (birth ? 0 : rw.openingMRR - cu.logoChurnMRR)),
        Math.abs(cu.opening + cu.newCustomers - cu.logoChurn - cu.closing),                                  // customer bridge
        birth ? Math.abs(cu.newCustomers - c.initialCustomers) + Math.abs(cu.logoChurn) : Math.abs(cu.newCustomers),
        i > 0 ? Math.abs(cu.opening - prevN) : (c.acquisitionMonth === 0 ? Math.abs(cu.opening - c.initialCustomers) : Math.abs(cu.opening)),
        Math.abs(cu.logoChurnARR - cu.logoChurnMRR * 12), Math.abs(cu.contractionARR - cu.contractionMRR * 12));
      if (d > worst) { worst = d; where = c.id + ' t=' + rw.t; }
      prevN = cu.closing;
    });
  });
  ok('A-RECONCILE', 'every cohort row: opening + new − logo-churn − contraction + expansion = closing; leakage = logo churn + contraction; customers opening − churned = closing; opening(t) = closing(t−1)',
     worst < EPS, rowsChecked + ' rows; worst residual ' + ex(worst) + (worst ? ' at ' + where : ' (exact)'));
  /* company = Σ cohorts */
  worst = 0;
  r.months.forEach(function (m, i) {
    var sumOpen = 0, sumClose = 0, sumLogo = 0, sumContr = 0, sumNew = 0;
    r.cohorts.forEach(function (c) {
      var rw = K.rowAt(c, m.t); if (!rw) return;
      if (c.acquisitionMonth === m.t) sumNew += rw.customers.closing; else sumOpen += rw.customers.opening;
      sumClose += rw.customers.closing; sumLogo += rw.customers.logoChurnARR; sumContr += rw.customers.contractionARR;
    });
    var cu = m.customers;
    var d = Math.max(Math.abs(cu.opening - sumOpen), Math.abs(cu.closing - sumClose), Math.abs(cu.newCustomers - sumNew), Math.abs(cu.logoChurnARR - sumLogo), Math.abs(cu.contractionARR - sumContr),
                     Math.abs(cu.opening - cu.logoChurn + cu.newCustomers - cu.closing), Math.abs(m.leakage - (cu.logoChurnARR + cu.contractionARR)),
                     i > 0 ? Math.abs(cu.opening - r.months[i - 1].customers.closing) : Math.abs(cu.opening - 1000),
                     Math.abs(cu.arpaClosing * cu.closing - m.closingARR));
    worst = Math.max(worst, d);
  });
  ok('A-RECONCILE', 'company customer record = Σ cohort sub-records every month; company leakage = logo-churn ARR + contraction ARR; ARPA × customers = ARR exactly',
     worst < EPS, 'worst residual ' + ex(worst));
  var last = r.months[r.horizon - 1].customers, cumc = last.cumulative;
  ok('A-NO-DUPLICATION', 'no customer is created or lost outside the flows: opening 1000 + Σ new − Σ logo churn = closing at M60; Σ cohort initial customers = 1000 + Σ new',
     Math.abs(1000 + cumc.newCustomers - cumc.logoChurnCustomers - last.closing) < EPS &&
     Math.abs(r.cohorts.reduce(function (q, c) { return q + c.initialCustomers; }, 0) - (1000 + cumc.newCustomers)) < EPS,
     'M60 customers ' + last.closing.toFixed(2) + ' = 1000 + ' + cumc.newCustomers.toFixed(2) + ' − ' + cumc.logoChurnCustomers.toFixed(2));
  ok('A-NO-DUPLICATION', 'the v1.3 ARR bridge still closes with Customer Physics on (opening + new + expansion − leakage = closing, every month)',
     r.months.every(function (m) { return Math.abs(E.bridge(r, m.t).residual) < EPS; }), '');

  /* --- logo vs dollar retention are DISTINCT measurements --- */
  var cm = K.customerMeasures(r, 36), r12 = K.measureR12M(r, 36);
  ok('A-DISTINCT', 'R12M logo retention reads back L exactly (a flat survival law), while R12M GRR is lower: it carries contraction AND is measured on a base expansion moved',
     Math.abs(cm.logoRetentionR12M - 0.92) < 1e-9 && cm.grrR12M < cm.logoRetentionR12M && Math.abs(cm.grrR12M - r12.grr) < 1e-9 && Math.abs(cm.identityResidual) < EPS,
     'logo retention ' + (cm.logoRetentionR12M * 100).toFixed(3) + '% · GRR ' + (cm.grrR12M * 100).toFixed(3) + '% = 1 − ' + (cm.dollarChurnFromLogosR12M * 100).toFixed(2) + '% (logos) − ' + (cm.dollarChurnFromContractionR12M * 100).toFixed(2) + '% (contraction)');
  var rC0 = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.92, contractionAnnual: 0 })), cm0 = K.customerMeasures(rC0, 36);
  ok('A-DISTINCT', 'with contraction 0 every euro of leakage is a departing customer (contraction share 0) and GRR still ≠ logo retention: the ARR-only measurement cannot recover L even then',
     cm0.dollarChurnFromContractionR12M === 0 && Math.abs(cm0.logoRetentionR12M - 0.92) < 1e-9 && Math.abs(cm0.grrR12M - 0.92) > 1e-3,
     'GRR ' + (cm0.grrR12M * 100).toFixed(3) + '% vs logo retention 92.000%');

  /* --- the matched-world experiment: same ARR, same NRR, different customers --- */
  var W1 = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }));     // P = 0.874
  var W2 = E.run(Object.assign({}, A, { logoRetentionAnnual: 0.874, contractionAnnual: 0 }));       // P = 0.874
  var V13 = E.run(Object.assign({}, A, { persistenceAnnual: 0.874 }));
  var dARR = Math.max(maxDiff(W1, W2, function (m) { return m.closingARR; }), maxDiff(W1, V13, function (m) { return m.closingARR; }));
  var dCash = Math.max(maxDiff(W1, W2, function (m) { return m.cashClosing; }), maxDiff(W1, V13, function (m) { return m.cashClosing; }));
  var dNRR = 0; for (var T = 12; T <= 60; T++) dNRR = Math.max(dNRR, Math.abs(K.measureR12M(W1, T).nrr - K.measureR12M(W2, T).nrr), Math.abs(K.measureR12M(W1, T).grr - K.measureR12M(W2, T).grr));
  var c1 = K.customerMeasures(W1, 60), c2 = K.customerMeasures(W2, 60);
  ok('A-MATCHED-WORLD', 'L 0.92 / C 0.05 and L 0.874 / C 0 (both P = 0.874) and v1.3 at persistence 0.874: identical ARR, cash, GRR and NRR at every month (the ARR-only world cannot tell them apart)',
     dARR < EPS && dCash < EPS && dNRR < 1e-12, 'max |ΔARR| ' + ex(dARR) + ' · max |Δcash| ' + ex(dCash) + ' · max |ΔGRR,ΔNRR| ' + ex(dNRR));
  ok('A-MATCHED-WORLD', '… and genuinely different customer states: logo retention 92% vs 87.4%, different customer counts and ARPA at M60 — a result Customer Physics makes and v1.3 cannot',
     Math.abs(c1.logoRetentionR12M - 0.92) < 1e-9 && Math.abs(c2.logoRetentionR12M - 0.874) < 1e-9 && Math.abs(c1.companyCustomersClosing - c2.companyCustomersClosing) > 50 && Math.abs(c1.arpaClosing - c2.arpaClosing) > 100,
     'M60 customers ' + c1.companyCustomersClosing.toFixed(1) + ' vs ' + c2.companyCustomersClosing.toFixed(1) + ' · ARPA €' + c1.arpaClosing.toFixed(0) + ' vs €' + c2.arpaClosing.toFixed(0));

  /* --- ARPA is derived; ARR-per-new-logo moves customers, never ARR --- */
  var rK = E.run(Object.assign({}, A, CUW, { newLogoARPA: 10000 }));
  ok('A-ARPA-DERIVED', 'newLogoARPA null → the opening ARPA (€20,000) is used and reported as such; newLogoARPA €10,000 → twice the customers per cohort, and NOT one euro of ARR, revenue or cash changes',
     r.derived.customers.newLogoARPA === 20000 && r.derived.customers.newLogoARPASource === 'opening ARPA' && rK.derived.customers.newLogoARPASource === 'input' &&
     maxDiff(r, rK, function (m) { return m.closingARR; }) < EPS && maxDiff(r, rK, function (m) { return m.cashClosing; }) < EPS &&
     Math.abs(rK.cohorts[5].initialCustomers - 2 * r.cohorts[5].initialCustomers) < 1e-9 && Math.abs(rK.cohorts[5].initialCustomers - 750000 / 10000) < 1e-9,
     'M5 cohort: ' + r.cohorts[5].initialCustomers.toFixed(1) + ' vs ' + rK.cohorts[5].initialCustomers.toFixed(1) + ' customers for the same €750,000');
  ok('A-ARPA-DERIVED', 'ARPA is ARR ÷ customers at every cohort and every month (cohortSnapshot.arpa, months.customers.arpaClosing) — a readout, never a stock',
     (function () { for (var t = 1; t <= 60; t++) { var s = E.cohortSnapshot(r, t); for (var i = 0; i < s.length; i++) if (Math.abs(s[i].arpa * s[i].customers - s[i].currentARR) > EPS) return false; } return true; })(), '');

  /* --- persistence input is not read while the layer is on --- */
  var rP = E.run(Object.assign({}, A, CUW, { persistenceAnnual: 0.5 }));
  var acc = { fields: 0, worst: 0, where: '', missing: [] }; walkCompare(r.months, rP.months, 'months', acc);
  ok('A-NOT-READ', 'with Customer Physics on, persistenceAnnual 0.90 → 0.50 changes nothing in any month field (the input is not read; P = L(1−C) is)', acc.worst === 0 && acc.missing.length === 0, acc.fields + ' fields identical');

  /* --- provenance: customers realised FROM THE PENDING ENTRY, never a live value --- */
  var rL = E.run(Object.assign({}, A, CUW, { acquisitionLagMonths: 6, maxMonthlyNewARR: 2e6 }));
  var provOK = rL.cohorts.slice(1).every(function (c) {
    var entries = rL.acquisitionLedger.filter(function (e) { return e.cohortId === c.id; });
    var n = entries.reduce(function (q, e) { return q + e.newARR / e.newLogoARPAAtSpend; }, 0);
    return Math.abs(n - c.initialCustomers) < 1e-9 && entries.every(function (e) { return e.newLogoARPAAtSpend === 20000; });
  });
  var synth = E.realiseCohort(9, [{ spendMonth: 3, matureMonth: 9, lagMonths: 6, sm: 500000, newARR: 400000, cacPerARRAtSpend: 1.25, maxMonthlyNewARRAtSpend: null, newLogoARPAAtSpend: 8000, realised: false, cohortId: null }], 'Early', 0.8);
  var synthNull = E.realiseCohort(9, [{ spendMonth: 3, matureMonth: 9, lagMonths: 6, sm: 500000, newARR: 400000, cacPerARRAtSpend: 1.25, maxMonthlyNewARRAtSpend: null, newLogoARPAAtSpend: null, realised: false, cohortId: null }], 'Early', 0.8);
  ok('A-PROVENANCE', 'lag 6 + capacity: every realised cohort\'s customers = Σ entry newARR ÷ ARR-per-logo STAMPED AT SPEND; realiseCohort with a synthetic entry (no assumption object) yields 400,000 ÷ 8,000 = 50 customers, and null on the entry yields null',
     provOK && Math.abs(synth.initialCustomers - 50) < 1e-12 && synth.rows[0].customers.closing === 50 && synthNull.initialCustomers === null && synthNull.rows[0].customers === null,
     rL.cohorts.length + ' cohorts (' + rL.pendingAtHorizon.entries.length + ' entries pending at M60)');
  var lagRec = rL.months.every(function (m, i) { var cu = m.customers; return Math.abs(cu.opening - cu.logoChurn + cu.newCustomers - cu.closing) < EPS && (i === 0 || Math.abs(cu.opening - rL.months[i - 1].customers.closing) < EPS); }) &&
               rL.months.slice(0, 6).every(function (m) { return m.customers.newCustomers === 0; }) && rL.months[6].customers.newCustomers > 0;
  ok('A-PROVENANCE', 'under lag 6 the customer record reconciles every month and no customer appears before the first cohort matures (no phantom customers, as no phantom cohorts)', lagRec, '');

  /* --- other v1.3 mechanisms compose with the layer --- */
  var rX = E.run(Object.assign({}, A, CUW, { expansionCostPerARR: 0.25 }));
  ok('A-COMPOSE', 'expansion realisation cost with Customer Physics on: Σ cohort expansionCost = company line = 0.25 × Σ expansion ARR; customer state unchanged by the cost',
     rX.months.every(function (m) { return Math.abs(m.expansionCost - 0.25 * m.expansion) < EPS; }) && maxDiff(r, rX, function (m) { return m.customers.closing; }) < EPS, '');
  var capOK = true; for (var t = 1; t <= 60; t++) { var p = CAPm.portfolioCapital(rL, t); if (Math.abs(p.deployed - t * A.sm) > EPS) capOK = false; }
  ok('A-COMPOSE', 'capital reconciliation (deployed = realised + pending = Σ S&M) holds with Customer Physics on under lag and capacity', capOK, '');

  /* --- validation at the boundary --- */
  var bad = [{ logoRetentionAnnual: 0 }, { logoRetentionAnnual: 1.2 }, { logoRetentionAnnual: -0.5 }, { logoRetentionAnnual: 'x' }, { logoRetentionAnnual: NaN },
             { logoRetentionAnnual: 0.9, contractionAnnual: 1 }, { logoRetentionAnnual: 0.9, contractionAnnual: -0.1 }, { logoRetentionAnnual: 0.9, newLogoARPA: 0 }, { logoRetentionAnnual: 0.9, newLogoARPA: -5 },
             { logoRetentionAnnual: 0.9, bands: E.resolveBands(A) }];
  var rejected = bad.every(function (b) { return throws(function () { E.run(Object.assign({}, A, b)); }); });
  var seedBad = throws(function () { E.run(Object.assign({}, A, CUW), { openingCohorts: [{ arr: 1e7, age: 0 }, { arr: 1e7, age: 12 }] }); });
  var seedOK = (function () { var rr = E.run(Object.assign({}, A, CUW), { openingCohorts: [{ arr: 1e7, age: 0, customers: 400 }, { arr: 1e7, age: 12, customers: 600 }] });
                              return Math.abs(rr.derived.customers.openingARPA - 20000) < 1e-9 && rr.derived.customers.openingCustomers === 1000 && rr.cohorts[1].initialCustomers === 600; })();
  ok('A-VALIDATION', 'RangeError for L ∉ (0,1], non-numeric L, C ∉ [0,1), ARR-per-logo ≤ 0, and for age bands combined with the layer; opening vintages without customers are rejected, with customers they seed the layer',
     rejected && seedBad && seedOK, bad.length + ' invalid objects rejected');
  ok('A-VALIDATION', 'L = 1 (no logo churn) is legal: customers constant, leakage = contraction only',
     (function () { var r1 = E.run(Object.assign({}, A, { logoRetentionAnnual: 1, contractionAnnual: 0.05 })); return r1.months.every(function (m) { return m.customers.logoChurn === 0 && Math.abs(m.leakage - m.customers.contractionARR) < EPS; }); })(), '');
  var d1 = E.run(Object.assign({}, A, CUW)), d2 = E.run(Object.assign({}, A, CUW));
  ok('A-DETERMINISM', 'two runs of the same customer world are identical in every field', JSON.stringify(snapshot(d1)) === JSON.stringify(snapshot(d2)), '');

  /* --- the module is pure and the build inlines it before the engine --- */
  var tr = CU.transition({ n: 100, mrr: 1000 }, CU.rates({ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, expansionCoefficientAnnual: 0.10 }));
  ok('A-MODULE', 'customers.js transition: closing = opening × l(1−c)(1+e); it keeps no state (same input → same output) and knows nothing about the company',
     Math.abs(tr.closingMRR - 1000 * Math.pow(0.92, 1 / 12) * Math.pow(0.95, 1 / 12) * Math.pow(1.10, 1 / 12)) < 1e-9 && JSON.stringify(tr) === JSON.stringify(CU.transition({ n: 100, mrr: 1000 }, CU.rates({ logoRetentionAnnual: 0.92, contractionAnnual: 0.05, expansionCoefficientAnnual: 0.10 }))),
     'closing €' + tr.closingMRR.toFixed(4) + ' MRR');
  var built = fs.readFileSync(__dirname + '/saas-physics-v1.html', 'utf8');
  ok('A-MODULE', 'the built product inlines customers.js BEFORE the engine (the browser branch resolves it on the global)',
     built.indexOf('root.SaaSPhysicsCustomers = factory()') > 0 && built.indexOf('root.SaaSPhysicsCustomers = factory()') < built.indexOf("var CU = deps.customers"), '');
})();

/* ================================================================== *
 * GATE B — MONETIZATION PHYSICS
 * ================================================================== */
var MO = require('./monetization.js');
var MSPEC = { components: [
  { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.03 },
  { name: 'usage', kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 } ] };
var MW = Object.assign({}, CUW, { monetization: MSPEC });
(function gateB() {
  var r = E.run(Object.assign({}, A, MW));
  ok('B-ON', 'monetization set (with Customer Physics on) → monetization and genericExpansionBypassed on; persistence and expansion reported as emergent; opening ARR derived = 1,000 × €20,000',
     r.mechanisms.monetization && r.mechanisms.genericExpansionBypassed && r.derived.persistenceAnnualEffective === null && /emergent/.test(r.derived.persistenceSource) && /emergent/.test(r.derived.expansionSource) &&
     r.derived.monetization.openingARRDerived === 20000000 && r.derived.monetization.newLogoRevenuePerCustomer === 20000 && r.months[0].openingARR === 20000000, r.derived.persistenceSource);
  ok('B-REQUIRES-A', 'monetization without Customer Physics is rejected at the boundary (RangeError), never silently run with a carried balance',
     throws(function () { E.run(Object.assign({}, A, { monetization: MSPEC })); }), '');

  /* --- ONE source of truth: cohort MRR is n × per-customer revenue ÷ 12, every row --- */
  var worst = 0, where = '', rows = 0;
  r.cohorts.forEach(function (c) { c.rows.forEach(function (rw) {
    rows++;
    var st = rw.customers.closing * rw.monetization.perCustomerClosing / 12;
    var d = Math.max(Math.abs(st - rw.closingMRR), Math.abs(rw.monetization.fixedARR + rw.monetization.variableARR - rw.closingARR),
                     Math.abs(MO.revenue(rw.monetization.state, rw.monetization.state.map(function (k) { return { fixed: k.fixed }; })).total - rw.monetization.perCustomerClosing));
    if (d > worst) { worst = d; where = c.id + ' t=' + rw.t; }
  }); });
  ok('B-ONE-SOURCE', 'every cohort row: customers × per-customer revenue ÷ 12 = closing MRR (the balance IS the component state); fixed ARR + variable ARR = closing ARR; the stored state re-prices to the recorded per-customer revenue',
     worst < EPS, rows + ' rows; worst |Δ| €' + ex(worst) + (worst ? ' at ' + where : ''));
  worst = 0;
  r.months.forEach(function (m) {
    var sf = 0, sv = 0, sp = 0, su = 0, sa = 0, sc = 0;
    r.cohorts.forEach(function (c) { var rw = K.rowAt(c, m.t); if (!rw) return; sf += rw.monetization.fixedARR; sv += rw.monetization.variableARR; sp += rw.monetization.priceARR; su += rw.monetization.usageARR; sa += rw.monetization.adoptionARR; sc += rw.monetization.contractionARR; });
    var mo = m.monetization;
    worst = Math.max(worst, Math.abs(mo.fixedARR - sf), Math.abs(mo.variableARR - sv), Math.abs(mo.priceARR - sp), Math.abs(mo.usageARR - su), Math.abs(mo.adoptionARR - sa), Math.abs(mo.contractionARR - sc),
                     Math.abs(mo.fixedARR + mo.variableARR - m.closingARR), Math.abs(mo.priceARR + mo.usageARR + mo.adoptionARR - m.expansion), Math.abs(m.customers.contractionARR - mo.contractionARR),
                     Math.abs(m.leakage - (m.customers.logoChurnARR + mo.contractionARR)));
  });
  ok('B-ONE-SOURCE', 'company monetization record = Σ cohort sub-records; fixed + variable = company ARR; price + usage + adoption = the expansion flow; contraction = the customer record\'s contraction; leakage = logo churn + contraction — every month',
     worst < EPS, 'worst residual €' + ex(worst));

  /* --- the bridge through the four named effects --- */
  worst = 0;
  r.cohorts.forEach(function (c) { c.rows.forEach(function (rw, i) {
    if (c.acquisitionMonth > 0 && i === 0) return;
    var mo = rw.monetization, cu = rw.customers;
    worst = Math.max(worst, Math.abs(rw.openingARR - cu.logoChurnARR - mo.contractionARR + mo.priceARR + mo.usageARR + mo.adoptionARR - rw.closingARR),
                     Math.abs(rw.expansion - (mo.priceARR + mo.usageARR + mo.adoptionARR)), Math.abs(rw.leakage - (cu.logoChurnARR + mo.contractionARR)));
  }); });
  ok('B-BRIDGE', 'every ageing row: opening − logo churn − contraction + price + usage + adoption = closing; the generic expansion field IS price + usage + adoption; leakage IS logo churn + contraction',
     worst < EPS, 'worst residual €' + ex(worst));
  ok('B-BRIDGE', 'the v1.3 company bridge still closes (opening + new + expansion − leakage = closing) with both layers on', r.months.every(function (m) { return Math.abs(E.bridge(r, m.t).residual) < EPS; }), '');

  /* --- bypass: the generic coefficient, newLogoARPA and start.openingARR are not read --- */
  var rX = E.run(Object.assign({}, A, MW, { expansionCoefficientAnnual: 0.40, newLogoARPA: 5000, persistenceAnnual: 0.5 }), { openingARR: 5000000 });
  var acc = { fields: 0, worst: 0, where: '', missing: [] }; walkCompare(r.months, rX.months, 'months', acc);
  ok('B-BYPASS', 'with Monetization on, expansionCoefficientAnnual 0.10 → 0.40, newLogoARPA → €5,000, persistenceAnnual → 0.50 and start.openingARR → €5m change nothing in any month field (none is read); the ignored values are reported',
     acc.worst === 0 && acc.missing.length === 0 && rX.derived.monetization.expansionCoefficientIgnored === 0.40 && rX.derived.monetization.newLogoARPAIgnored === 5000 && rX.derived.monetization.openingARRInputIgnored === 5000000 && rX.derived.monetization.openingARRDerived === 20000000,
     acc.fields + ' fields identical');

  /* --- saturation: caps make expansion converge (FINDINGS #13 / #30 under this layer) --- */
  var closed = E.run(Object.assign({}, A, { sm: 0, logoRetentionAnnual: 1, contractionAnnual: 0,
    monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, usageGrowthAnnual: 0.30, unitsCap: 300, adoptionAnnual: 0.25, penetrationCap: 0.95 }] } }), {}, 120);
  var ceiling = 12000 + 0.95 * 300 * 100, path = closed.cohorts[0].rows.map(function (rw) { return rw.monetization.perCustomerClosing; });
  var mono = path.every(function (v, i) { return i === 0 || v >= path[i - 1] - 1e-9; }), below = path.every(function (v) { return v <= ceiling + 1e-9; });
  var lastRow = closed.cohorts[0].rows[119];
  var m1exp = closed.cohorts[0].rows[0].expansion, capMonth = null;
  closed.cohorts[0].rows.forEach(function (rw) { if (capMonth === null && rw.monetization.headroom[1].units > 0.999999) capMonth = rw.t; });
  var declining = closed.cohorts[0].rows.slice(capMonth).every(function (rw, i, arr) { return i === 0 || rw.expansion <= arr[i - 1].expansion + 1e-9; });
  ok('B-SATURATION', 'a closed cohort (no acquisition, no churn) with usage 30%/yr to a 300-unit cap and adoption 25%/yr to 95%: per-customer revenue rises monotonically, never exceeds the ceiling €' + ceiling + ' (fixed + penCap × cap × price), is within 1% of it by M120 with the usage cap reached and adoption at 99% of its cap, and expansion declines monotonically once the cap binds to < 5% of its M1 value — expansion SATURATES under this layer',
     mono && below && lastRow.monetization.perCustomerClosing > 0.99 * ceiling && lastRow.monetization.headroom[1].units > 0.999999 && lastRow.monetization.headroom[1].penetration > 0.99 && capMonth !== null && declining && lastRow.expansion < 0.05 * m1exp,
     'M1 €' + path[0].toFixed(0) + ' → M60 €' + path[59].toFixed(0) + ' → M120 €' + path[119].toFixed(2) + ' (ceiling €' + ceiling + '); M120 expansion €' + lastRow.expansion.toExponential(1));

  /* --- price only: exact compounding --- */
  var priceOnly = E.run(Object.assign({}, A, { sm: 0, logoRetentionAnnual: 1, contractionAnnual: 0,
    monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 20000, priceGrowthAnnual: 0.05 }] } }));
  var pw = 0; priceOnly.cohorts[0].rows.forEach(function (rw) { pw = Math.max(pw, Math.abs(rw.monetization.perCustomerClosing - 20000 * Math.pow(1.05, rw.t / 12))); });
  var pk = K.monetizationMeasures(priceOnly, 24);
  ok('B-PRICE', 'price growth alone (5%/yr, one fixed component, no churn): per-customer revenue = €20,000 × 1.05^(t/12) exactly; R12M NRR = 105% with the whole of it a price effect, usage and adoption 0',
     pw < 1e-6 && Math.abs(pk.nrrR12M - 1.05) < 1e-9 && Math.abs(pk.priceEffectR12M - 0.05) < 1e-9 && pk.usageEffectR12M === 0 && pk.adoptionEffectR12M === 0, 'worst |Δ| €' + ex(pw) + ' · NRR ' + (pk.nrrR12M * 100).toFixed(4) + '%');

  /* --- the matched-start experiment: mix alone changes GRR --- */
  var allFixed = Object.assign({}, CUW, { monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 20000, priceGrowthAnnual: 0 }] } });
  var mixed = Object.assign({}, CUW, { monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0 }, { kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0, usageGrowthAnnual: 0, unitsCap: null, adoptionAnnual: 0, penetrationCap: 0.8 }] } });
  var rF = E.run(Object.assign({}, A, allFixed)), rM = E.run(Object.assign({}, A, mixed));
  var kF = K.customerMeasures(rF, 24), kM = K.customerMeasures(rM, 24), gF = K.measureR12M(rF, 24), gM2 = K.measureR12M(rM, 24);
  ok('B-MIX-MATCHED', 'same opening ARR (€20m), customers (1,000), ARPA (€20,000), L (92%) and C (5%), no growth drivers: all-fixed vs 60/40 fixed/variable — identical logo churn, but contraction €0 in the all-fixed world (contraction reaches variable revenue only), so GRR differs: the revenue MIX alone changes dollar retention — a result neither the ARR-only nor the customer world can produce',
     rF.months[0].openingARR === rM.months[0].openingARR && Math.abs(rF.months[0].customers.logoChurn - rM.months[0].customers.logoChurn) < 1e-9 && rF.months[0].monetization.contractionARR === 0 && rM.months[0].monetization.contractionARR > 0 &&
     Math.abs(kF.logoRetentionR12M - kM.logoRetentionR12M) < 1e-9 && gF.grr > gM2.grr + 0.01 && Math.abs(gF.grr - 0.92) < 1e-9,
     'R12M GRR ' + (gF.grr * 100).toFixed(2) + '% (all fixed) vs ' + (gM2.grr * 100).toFixed(2) + '% (mixed); logo retention ' + (kF.logoRetentionR12M * 100).toFixed(1) + '% both');

  /* --- measurement identities --- */
  var mm = K.monetizationMeasures(r, 36), k36 = K.measureR12M(r, 36), c36 = K.customerMeasures(r, 36);
  ok('B-DECOMPOSITION', 'monetizationMeasures at T=36: 1 − logo churn − contraction + price + usage + adoption = NRR (identity residual < €1e-6); GRR and expansion agree with measureR12M and customerMeasures to 1e-9',
     Math.abs(mm.identityResidual) < EPS && Math.abs(mm.grrR12M - k36.grr) < 1e-9 && Math.abs(mm.expansionR12M - k36.expansionRate) < 1e-9 && Math.abs(mm.nrrR12M - k36.nrr) < 1e-9 && Math.abs(mm.contractionR12M - c36.dollarChurnFromContractionR12M) < 1e-9,
     'NRR ' + (mm.nrrR12M * 100).toFixed(2) + '% = 100 − ' + (mm.logoChurnR12M * 100).toFixed(2) + ' − ' + (mm.contractionR12M * 100).toFixed(2) + ' + ' + (mm.priceEffectR12M * 100).toFixed(2) + ' + ' + (mm.usageEffectR12M * 100).toFixed(2) + ' + ' + (mm.adoptionEffectR12M * 100).toFixed(2));

  /* --- provenance: cohorts are born from the per-customer state stamped at spend --- */
  var rL = E.run(Object.assign({}, A, MW, { acquisitionLagMonths: 6, maxMonthlyNewARR: 2e6 }));
  var provOK = rL.cohorts.slice(1).every(function (c) {
    var e = rL.acquisitionLedger.filter(function (x) { return x.cohortId === c.id; })[0];
    return e && e.perCustomerAtSpend && Math.abs(c.initialCustomers - e.newARR / e.newLogoARPAAtSpend) < 1e-9 && e.newLogoARPAAtSpend === 20000 &&
           Math.abs(c.rows[0].monetization.perCustomerClosing - 20000) < 1e-9 && rL.acquisitionLedger.every(function (x) { return x.perCustomerAtSpend !== null; });
  });
  var stA = [{ penetration: 1, units: 1, price: 9000, fixed: true }, { penetration: 0.5, units: 10, price: 100, fixed: false, unitsCap: 20, penetrationCap: 1 }];
  var synthB = E.realiseCohort(9, [{ spendMonth: 3, matureMonth: 9, lagMonths: 6, sm: 500000, newARR: 400000, cacPerARRAtSpend: 1.25, maxMonthlyNewARRAtSpend: null, newLogoARPAAtSpend: 9500, perCustomerAtSpend: stA, realised: false, cohortId: null }], 'Early', 0.8);
  var stB = [{ penetration: 1, units: 1, price: 9500, fixed: true }];
  var mixedEntries = throws(function () { E.realiseCohort(9, [
    { spendMonth: 3, matureMonth: 9, lagMonths: 6, sm: 1, newARR: 9500, cacPerARRAtSpend: 1, maxMonthlyNewARRAtSpend: null, newLogoARPAAtSpend: 9500, perCustomerAtSpend: stA, realised: false, cohortId: null },
    { spendMonth: 4, matureMonth: 9, lagMonths: 5, sm: 1, newARR: 9500, cacPerARRAtSpend: 1, maxMonthlyNewARRAtSpend: null, newLogoARPAAtSpend: 9500, perCustomerAtSpend: stB, realised: false, cohortId: null }], 'Early', 0.8); });
  ok('B-PROVENANCE', 'lag 6 + capacity: every cohort is born from the per-customer state STAMPED AT SPEND (customers = ARR ÷ €20,000, per-customer revenue €20,000); a synthetic entry with no engine state yields the cohort (42.1 customers at €9,500); entries with different states maturing together are rejected',
     provOK && synthB.money && Math.abs(synthB.initialCustomers - 400000 / 9500) < 1e-9 && Math.abs(synthB.rows[0].monetization.perCustomerClosing - 9500) < 1e-9 && synthB.rows[0].monetization.fixedARR + synthB.rows[0].monetization.variableARR === 400000 && mixedEntries,
     rL.cohorts.length + ' cohorts');

  /* --- composition with the v1.x mechanisms --- */
  var rC = E.run(Object.assign({}, A, MW, { expansionCostPerARR: 0.25 }));
  var capOK = true; for (var t = 1; t <= 60; t++) { var p = CAPm.portfolioCapital(rL, t); if (Math.abs(p.deployed - t * A.sm) > EPS) capOK = false; }
  ok('B-COMPOSE', 'expansion realisation cost prices the price + usage + adoption expansion (Σ cost = 0.25 × Σ expansion, revenue state unchanged); capital reconciliation holds under lag and capacity with both layers on',
     rC.months.every(function (m) { return Math.abs(m.expansionCost - 0.25 * (m.monetization.priceARR + m.monetization.usageARR + m.monetization.adoptionARR)) < EPS; }) && maxDiff(r, rC, function (m) { return m.closingARR; }) < EPS && capOK, '');

  /* --- validation --- */
  var badB = [{ components: [] }, {}, { components: [{ kind: 'fixed', units: 1, priceAnnual: 100, penetration: 0.5 }] }, { components: [{ kind: 'fixed', units: 1, priceAnnual: 100, usageGrowthAnnual: 0.1 }] },
              { components: [{ kind: 'variable', units: 10, priceAnnual: 100, unitsCap: 5 }] }, { components: [{ kind: 'variable', units: 10, priceAnnual: 100, adoptionAnnual: 1 }] },
              { components: [{ kind: 'variable', units: 10, priceAnnual: 100, penetration: 0.9, penetrationCap: 0.5 }] }, { components: [{ kind: 'variable', units: 0, priceAnnual: 100 }] },
              { components: [{ kind: 'variable', units: 1, priceAnnual: -5 }] }, { components: [{ kind: 'other', units: 1, priceAnnual: 5 }] }, { components: [{ kind: 'fixed', units: 1, priceAnnual: 5, priceGrowthAnnual: -1 }] }];
  ok('B-VALIDATION', 'RangeError for: no components, a fixed component with penetration ≠ 1 or usage/adoption headroom, unitsCap < units, adoption ≥ 1, penetrationCap < penetration, units ≤ 0, price ≤ 0, an unknown kind, price growth ≤ −100%; and for opening vintages without customers',
     badB.every(function (b) { return throws(function () { E.run(Object.assign({}, A, CUW, { monetization: b })); }); }) &&
     throws(function () { E.run(Object.assign({}, A, MW), { openingCohorts: [{ arr: 1e7, age: 0 }] }); }), badB.length + 1 + ' invalid inputs rejected');
  var v1 = E.run(Object.assign({}, A, MW)), v2 = E.run(Object.assign({}, A, MW));
  ok('B-DETERMINISM', 'two runs of the same monetization world are identical in every field', JSON.stringify(snapshot(v1)) === JSON.stringify(snapshot(v2)), '');
  var st0 = MO.initialState(MSPEC), rr = MO.rates(MSPEC), t1 = MO.transition(st0, rr, 0.004), t2 = MO.transition(st0, rr, 0.004);
  ok('B-MODULE', 'monetization.js keeps no state (same input → same output, input untouched) and the built product inlines it before the engine',
     JSON.stringify(t1) === JSON.stringify(t2) && JSON.stringify(st0) === JSON.stringify(MO.initialState(MSPEC)) &&
     (function () { var built = fs.readFileSync(__dirname + '/saas-physics-v1.html', 'utf8'); var i = built.indexOf('root.SaaSPhysicsMonetization = factory()'); return i > 0 && i < built.indexOf('var MO = deps.monetization'); })(), '');
})();

console.log('\nSaaS Physics v2 — economic system checks\n' + '='.repeat(96));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(96));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
