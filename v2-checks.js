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

/* ================================================================== *
 * GATE C — CASH PHYSICS
 * ================================================================== */
var CA = require('./cash.js');
(function gateC() {
  var r0 = E.run(A);
  var worlds = [['advance 12, delay 0', { billingTermMonths: 12 }], ['advance 12, delay 1', { billingTermMonths: 12, collectionDelayMonths: 1 }],
                ['arrears 12, delay 2', { billingTermMonths: 12, billingTiming: 'arrears', collectionDelayMonths: 2 }], ['advance 3, delay 1', { billingTermMonths: 3, collectionDelayMonths: 1 }],
                ['advance 1, delay 0', { billingTermMonths: 1 }], ['advance 12 + all layers + lag + cap + cost', Object.assign({}, MW, { billingTermMonths: 12, collectionDelayMonths: 1, acquisitionLagMonths: 6, maxMonthlyNewARR: 2e6, expansionCostPerARR: 0.25 })]];
  worlds.forEach(function (w) {
    var r = E.run(Object.assign({}, A, w[1])), base = E.run(Object.assign({}, A, w[1], { billingTermMonths: null, collectionDelayMonths: 0 }));
    var worst = 0, pl = 0, cashRun = r.start.openingCash, wc = 0, coh = 0;
    r.months.forEach(function (m, i) {
      var c = m.cash, dDef = c.deferredClosing - c.deferredOpening, dRec = c.receivablesClosing - c.receivablesOpening;
      worst = Math.max(worst, Math.abs(c.billings - (m.revenue + dDef)), Math.abs(m.fcf - (c.collections - c.cashCosts)), Math.abs(m.fcf - (m.ebita + dDef - dRec)),
                       Math.abs(c.cashCosts - (m.cogs + m.sm + m.rd + m.ga + m.expansionCost)), Math.abs(c.billings - c.collections - dRec),
                       i > 0 ? Math.abs(c.deferredOpening - r.months[i - 1].cash.deferredClosing) + Math.abs(c.receivablesOpening - r.months[i - 1].cash.receivablesClosing) : Math.abs(c.deferredOpening - r.derived.cash.openingDeferredRevenue));
      cashRun += m.fcf; wc = Math.max(wc, Math.abs(m.cashClosing - cashRun));
      /* the P&L and the recurring state are untouched by the layer */
      var b = base.months[i];
      pl = Math.max(pl, Math.abs(m.ebita - b.ebita), Math.abs(m.revenue - b.revenue), Math.abs(m.closingARR - b.closingARR), Math.abs(m.grossProfit - b.grossProfit), Math.abs(m.expansionCost - b.expansionCost));
      /* company billings and deferred = Σ cohort rows */
      var sb = 0, sd = 0; r.cohorts.forEach(function (cc) { var rw = K.rowAt(cc, m.t); if (rw && rw.cash) { sb += rw.cash.billings; sd += rw.cash.deferredClosing; } });
      coh = Math.max(coh, Math.abs(sb - c.billings), Math.abs(sd - c.deferredClosing));
    });
    ok('C-RECONCILE', w[0] + ': every month billings = revenue + Δdeferred; FCF = collections − cash costs = EBITA + Δdeferred − Δreceivables; Δreceivables = billings − collections; balances chain; cash = opening + Σ FCF; company billings and deferred = Σ cohort rows',
       worst < EPS && wc < EPS && coh < EPS, 'worst residual €' + ex(Math.max(worst, wc, coh)));
    ok('C-UNTOUCHED', w[0] + ': EBITA, revenue, gross profit, expansion cost and ARR are identical to the same world with Cash Physics off — the layer changes only the cash path', pl < EPS, 'worst |Δ| €' + ex(pl));
  });
  var rA = E.run(Object.assign({}, A, { billingTermMonths: 12 })), rR = E.run(Object.assign({}, A, { billingTermMonths: 12, billingTiming: 'arrears' })), rM = E.run(Object.assign({}, A, { billingTermMonths: 1 }));
  ok('C-OPENING-BOOK', 'the opening base is a staggered book: opening deferred = MRR × (T − 1)/2 = €9.17m under annual advance billing, the same amount as a contract asset under arrears, €0 under monthly billing — derived, reported, never an input',
     Math.abs(rA.derived.cash.openingDeferredRevenue - 20e6 / 12 * 11 / 2) < EPS && Math.abs(rR.derived.cash.openingDeferredRevenue + 20e6 / 12 * 11 / 2) < EPS && rM.derived.cash.openingDeferredRevenue === 0,
     'advance €' + (rA.derived.cash.openingDeferredRevenue / 1e6).toFixed(2) + 'm · arrears €' + (rR.derived.cash.openingDeferredRevenue / 1e6).toFixed(2) + 'm');
  /* a new cohort under advance billing: invoiced its whole period at birth, then nothing until renewal */
  var c7 = rA.cohorts[7], bl = c7.rows.map(function (rw) { return rw.cash.billings; });
  var sumRev = 0; c7.rows.slice(0, 12).forEach(function (rw) { sumRev += rw.revenue; });
  ok('C-ANCHORED', 'an acquisition cohort under annual advance billing is invoiced 12 × its run-rate at birth (€750,000), nothing for eleven months, then TRUED UP at renewal: the M13 invoice = 12 × current MRR − what the first invoice left in deferred (first invoice − revenue recognised over the period)',
     Math.abs(bl[0] - 750000) < EPS && bl.slice(1, 12).every(function (v) { return v === 0; }) && bl[12] > 0 && Math.abs(bl[12] - (12 * c7.rows[12].openingMRR - c7.rows[11].cash.deferredClosing)) < EPS && Math.abs(c7.rows[11].cash.deferredClosing - (750000 - sumRev)) < EPS,
     'M7 €' + bl[0].toFixed(0) + ' · M8–M18 €0 · renewal €' + bl[12].toFixed(0) + ' = 12 × €' + c7.rows[12].openingMRR.toFixed(0) + ' − €' + c7.rows[11].cash.deferredClosing.toFixed(0) + ' left in deferred (the cohort shrank and its birth month recognised half a month)');
  /* steady-state: over a full period, billings = revenue for a flat book */
  var flat = E.run(Object.assign({}, A, { sm: 0, persistenceAnnual: 1, expansionCoefficientAnnual: 0, billingTermMonths: 12 })), fb = 0, fr = 0;
  flat.months.slice(0, 12).forEach(function (m) { fb += m.cash.billings; fr += m.revenue; });
  ok('C-STEADY', 'a flat book (no churn, expansion or acquisition) billed annually in advance invoices exactly its revenue over any twelve months and keeps deferred constant: the timing layer creates no money',
     Math.abs(fb - fr) < EPS && Math.abs(flat.months[11].cash.deferredClosing - flat.months[0].cash.deferredOpening) < EPS && flat.months.every(function (m) { return Math.abs(m.fcf - m.ebita) < EPS; }), 'Σ billings €' + fb.toFixed(2) + ' = Σ revenue €' + fr.toFixed(2));
  /* the signature: same P&L, different cash */
  var sA = E.summarise(rA), sR = E.summarise(rR), s0 = E.summarise(r0), sD = E.summarise(E.run(Object.assign({}, A, { billingTermMonths: 12, collectionDelayMonths: 2 })));
  ok('C-FCF-NE-EBITA', 'Base P&L, three cash worlds: cumulative EBITA identical; ending cash €59.57m (FCF = EBITA) vs €' + (sA.endingCash / 1e6).toFixed(2) + 'm (annual in advance) vs €' + (sR.endingCash / 1e6).toFixed(2) + 'm (annual in arrears); the trough moves from €6.10m to €' + (sA.cashTrough / 1e6).toFixed(2) + 'm and €' + (sR.cashTrough / 1e6).toFixed(2) + 'm — FCF ≠ EBITA, in both directions',
     Math.abs(sA.cumEbita - s0.cumEbita) < EPS && Math.abs(sR.cumEbita - s0.cumEbita) < EPS && sA.endingCash > s0.endingCash + 1e6 && sR.endingCash < s0.endingCash - 1e6 && sR.cashTrough < s0.cashTrough - 1e6 && sA.cashTrough > s0.cashTrough,
     'cum EBITA €' + (s0.cumEbita / 1e6).toFixed(2) + 'm all three; cum FCF − EBITA: advance +€' + (sA.cumFCFMinusEbita / 1e6).toFixed(2) + 'm, arrears €' + (sR.cumFCFMinusEbita / 1e6).toFixed(2) + 'm');
  ok('C-FCF-NE-EBITA', 'a 2-month collection delay on the same annual advance billing lowers ending cash by exactly the receivables outstanding at M60 (cash is only deferred, never lost)',
     Math.abs((sA.endingCash - sD.endingCash) - sD.finalReceivables) < EPS, 'Δ ending cash €' + ((sA.endingCash - sD.endingCash) / 1e6).toFixed(3) + 'm = receivables €' + (sD.finalReceivables / 1e6).toFixed(3) + 'm');
  /* measurement identities */
  var km = K.cashMeasures(rA, 36);
  ok('C-MEASURE', 'cashMeasures: (FCF − EBITA) over the window = Δdeferred − Δreceivables (identity residual < €1e-6); cash conversion and deferred months of revenue reported',
     Math.abs(km.identityResidual) < EPS && km.cashConversion > 1 && km.deferredMonthsOfRevenue > 4, 'conversion ' + km.cashConversion.toFixed(3) + ' · deferred ' + km.deferredMonthsOfRevenue.toFixed(2) + ' months of revenue');
  /* validation */
  var badC = [{ billingTermMonths: 0 }, { billingTermMonths: 2.5 }, { billingTermMonths: -1 }, { billingTermMonths: 'x' }, { billingTermMonths: 12, billingTiming: 'monthly' }, { billingTermMonths: 12, collectionDelayMonths: -1 },
              { billingTermMonths: 12, collectionDelayMonths: 1.5 }, { collectionDelayMonths: 2 }];
  ok('C-VALIDATION', 'RangeError for a term ≤ 0, fractional, negative or non-numeric; an unknown timing; a negative or fractional delay; and a collection delay without a billing term',
     badC.every(function (b) { return throws(function () { E.run(Object.assign({}, A, b)); }); }), badC.length + ' invalid inputs rejected');
  var d1 = E.run(Object.assign({}, A, { billingTermMonths: 12, collectionDelayMonths: 1 })), d2 = E.run(Object.assign({}, A, { billingTermMonths: 12, collectionDelayMonths: 1 }));
  ok('C-DETERMINISM', 'two runs of the same cash world are identical in every field', JSON.stringify(snapshot(d1)) === JSON.stringify(snapshot(d2)), '');
  var u1 = [{ share: 1, phase: 0, deferred: 0 }], b1 = CA.bill(u1, 12, 'advance', 0, 100, 50), u2 = [{ share: 1, phase: 0, deferred: 0 }], b2 = CA.bill(u2, 12, 'advance', 0, 100, 50);
  ok('C-MODULE', 'cash.js: bill() is a pure transition of the units it is given (same input → same output), collect() a FIFO; the built product inlines cash.js before the engine',
     JSON.stringify(b1) === JSON.stringify(b2) && b1.billings === 1200 && b1.deferred === 1150 &&
     (function () { var built = fs.readFileSync(__dirname + '/saas-physics-v1.html', 'utf8'); var i = built.indexOf('root.SaaSPhysicsCash = factory()'); return i > 0 && i < built.indexOf('var CA = deps.cash'); })(), '');
})();

/* ================================================================== *
 * GATE D — INTERVENTIONS
 * ================================================================== */
var IV = require('./interventions.js');
var RET = { id: 'ret', name: 'Retention programme', target: 'persistenceAnnual', effect: 'multiply', value: 1.05, startMonth: 6, lagMonths: 3, durationMonths: 24, cost: { oneOff: 200000, monthly: 50000 } };
(function gateD() {
  var r0 = E.run(A), r = E.run(Object.assign({}, A, { interventions: [RET] })), rEmpty = E.run(Object.assign({}, A, { interventions: [] }));
  var acc = { fields: 0, worst: 0, where: '', missing: [] }; walkCompare(snapshot(r0), snapshot(rEmpty), 'run', acc);
  ok('D-NULL', 'interventions: [] is the null world: every field identical to a run without the key (lawAt(t) IS the base object); mechanisms.interventions false; no month carries a hypothesis record',
     acc.worst === 0 && acc.missing.length === 0 && !rEmpty.mechanisms.interventions && rEmpty.months.every(function (m) { return m.interventions === null && m.interventionCost === 0; }) && rEmpty.derived.interventions === null, acc.fields + ' fields identical');

  /* --- lawAt(t): before, during, after --- */
  var sched = r.derived.interventions[0];
  var before = true; for (var t = 0; t < 8; t++) before = before && Math.abs(r.months[t].closingARR - r0.months[t].closingARR) === 0 && r.months[t].interventions.active.length === 0;
  var during = r.months.slice(8, 32).every(function (m) { return m.interventions.active.length === 1 && m.interventions.changes[0].target === 'persistenceAnnual' && Math.abs(m.interventions.changes[0].to - 0.945) < 1e-12; });
  var after = r.months.slice(32).every(function (m) { return m.interventions.active.length === 0 && m.interventions.changes.length === 0; });
  var gDuring = Math.pow(0.945, 1 / 12), gBase = Math.pow(0.9, 1 / 12), rowsOK = true;
  r.cohorts.forEach(function (c) { c.rows.forEach(function (rw, i) { if (c.acquisitionMonth > 0 && i === 0) return; var g = rw.retainedMRR / rw.openingMRR; var want = (rw.t >= 9 && rw.t <= 32) ? gDuring : gBase; if (rw.openingMRR > 0 && Math.abs(g - want) > 1e-12) rowsOK = false; }); });
  ok('D-LAWAT', 'retention programme (persistence × 1.05 from M6, 3-month lag, 24 months): months 1–8 bit-identical to Base; months 9–32 run every cohort at persistence 0.945 (monthly g = 0.945^(1/12) on every ageing row); from M33 the law reverts to 0.90 — a hypothesis never became a coefficient',
     before && during && after && rowsOK && sched.effectiveFrom === 9 && sched.effectiveTo === 32 && sched.activeMonths === 24 && Math.abs(sched.valueInForce - 0.945) < 1e-12, 'in force M' + sched.effectiveFrom + '–M' + sched.effectiveTo);

  /* --- cost: its own line, decision-dated --- */
  var costOK = r.months.every(function (m) { var want = (m.t === 6 ? 200000 : 0) + (m.t >= 6 && m.t <= 32 ? 50000 : 0); return Math.abs(m.interventionCost - want) < EPS && Math.abs(m.ebita - (m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.interventionCost)) < EPS; });
  var rNoEffect = E.run(Object.assign({}, A, { interventions: [Object.assign({}, RET, { value: 1.0 })] }));
  var costOnly = rNoEffect.months.every(function (m, i) { return Math.abs(m.closingARR - r0.months[i].closingARR) === 0 && Math.abs((r0.months[i].ebita - m.ebita) - m.interventionCost) < EPS && Math.abs((r0.months[i].cashClosing - m.cashClosing) - m.interventions.cumulativeCost) < EPS; });
  ok('D-COST', 'the cost line is decision-dated (€200,000 one-off in M6, €50,000/month M6–M32, total €1.55m) and its own P&L line; a hypothesis with no effect (× 1.0) leaves ARR bit-identical and lowers EBITA and cash by exactly its cost',
     costOK && costOnly && Math.abs(E.summarise(r).cumInterventionCost - 1550000) < EPS, 'Σ cost €' + E.summarise(r).cumInterventionCost.toFixed(0));

  /* --- provenance: stamped at spend, not at maturity --- */
  var CAC = { id: 'cac', target: 'cacPerARR', effect: 'multiply', value: 0.8, startMonth: 10, lagMonths: 0, durationMonths: null, cost: { oneOff: 0, monthly: 0 } };
  var rL = E.run(Object.assign({}, A, { acquisitionLagMonths: 6, interventions: [CAC] }));
  var provOK = rL.acquisitionLedger.every(function (e) { return (e.spendMonth < 10 ? e.cacPerARRAtSpend === 1.2 && e.interventionsAtSpend.length === 0 : Math.abs(e.cacPerARRAtSpend - 0.96) < 1e-12 && e.interventionsAtSpend[0] === 'cac'); }) &&
               rL.cohorts.slice(1).every(function (c) { return c.spendMonth < 10 ? c.cacCoefficientAtCreation === 1.2 && c.interventionsAtSpend.length === 0 : Math.abs(c.cacCoefficientAtCreation - 0.96) < 1e-12 && c.interventionsAtSpend[0] === 'cac'; }) &&
               rL.cohorts.filter(function (c) { return c.acquisitionMonth >= 10 && c.acquisitionMonth <= 15; }).every(function (c) { return c.cacCoefficientAtCreation === 1.2; });
  ok('D-PROVENANCE', 'CAC coefficient × 0.8 from M10 under a 6-month lag: entries spent before M10 carry 1.20 and no hypothesis; entries from M10 carry 0.96 and the hypothesis id; cohorts realised M10–M15 (spent before the change) still carry 1.20 — stamped at spend, not at maturity',
     provOK, rL.cohorts.length + ' cohorts');

  /* --- bounds before benefits: the boundary --- */
  var badD = [
    [{ target: 'maxMonthlyNewARR', effect: 'set', value: 2e6, startMonth: 1 }, 'a null target (capacity off)'],
    [{ target: 'logoRetentionAnnual', effect: 'set', value: 0.9, startMonth: 1 }, 'switching Customer Physics on'],
    [{ target: 'billingTermMonths', effect: 'set', value: 12, startMonth: 1 }, 'the billing policy'],
    [{ target: 'monetization', effect: 'set', value: 1, startMonth: 1 }, 'a whole layer'],
    [{ target: 'persistenceAnnual', effect: 'multiply', value: 1.3, startMonth: 1 }, 'persistence pushed above 1'],
    [{ target: 'grossMargin', effect: 'add', value: 0.5, startMonth: 1 }, 'gross margin above 1'],
    [{ target: 'sm', effect: 'multiply', value: -1, startMonth: 1 }, 'negative S&M'],
    [{ target: 'acquisitionLagMonths', effect: 'add', value: 1.5, startMonth: 1 }, 'a fractional lag'],
    [{ target: 'nope', effect: 'add', value: 1, startMonth: 1 }, 'an unknown target'],
    [{ target: 'sm', effect: 'divide', value: 2, startMonth: 1 }, 'an unknown effect'],
    [{ target: 'sm', effect: 'add', value: 1, startMonth: 0 }, 'startMonth 0'],
    [{ target: 'sm', effect: 'add', value: 1, startMonth: 1, durationMonths: 0 }, 'duration 0'],
    [{ target: 'sm', effect: 'add', value: 1, startMonth: 1, cost: { monthly: -5 } }, 'a negative cost'],
    [{ target: 'sm', effect: 'add', value: NaN, startMonth: 1 }, 'a NaN value']
  ];
  var allRejected = badD.every(function (b) { return throws(function () { E.run(Object.assign({}, A, { interventions: [b[0]] })); }); });
  var dup = throws(function () { E.run(Object.assign({}, A, { interventions: [Object.assign({}, RET), Object.assign({}, RET)] })); });
  ok('D-BOUNDS', 'RangeError for: ' + badD.map(function (b) { return b[1]; }).join(', ') + ', a duplicate id; the resolved law of every month must pass the engine\'s own boundary and stay inside each law\'s domain',
     allRejected && dup, (badD.length + 1) + ' invalid hypotheses rejected');
  ok('D-BOUNDS', 'a hypothesis may switch a bound ON where the base carries it: capacity × 0.5 from M12 on a bounded world halves the capacity from M12 and the entries carry the capacity at spend',
     (function () { var rc = E.run(Object.assign({}, A, { maxMonthlyNewARR: 2e6, interventions: [{ target: 'maxMonthlyNewARR', effect: 'multiply', value: 0.5, startMonth: 12 }] }));
                    return rc.acquisitionLedger.every(function (e) { return e.maxMonthlyNewARRAtSpend === (e.spendMonth < 12 ? 2e6 : 1e6); }) && rc.months[11].acquisitionLawNewARR < rc.months[10].acquisitionLawNewARR; })(), '');

  /* --- order and composition --- */
  var A1 = { id: 'a', target: 'sm', effect: 'multiply', value: 1.1, startMonth: 1 }, A2 = { id: 'b', target: 'sm', effect: 'add', value: 100000, startMonth: 1 };
  var rAB = E.run(Object.assign({}, A, { interventions: [A1, A2] })), rBA = E.run(Object.assign({}, A, { interventions: [A2, A1] }));
  ok('D-ORDER', 'two hypotheses on the same law apply in declaration order (× 1.1 then + €100k → €1,090,000; + €100k then × 1.1 → €1,100,000): the order is a stated convention, recorded per month',
     Math.abs(rAB.months[0].sm - 1090000) < EPS && Math.abs(rBA.months[0].sm - 1100000) < EPS && rAB.months[0].interventions.changes.length === 2 && Math.abs(rAB.months[0].interventions.changes[1].from - 990000) < EPS, rAB.months[0].sm + ' vs ' + rBA.months[0].sm);
  var perm = E.run(Object.assign({}, A, { interventions: [{ id: 'p', target: 'grossMargin', effect: 'add', value: 0.05, startMonth: 24, durationMonths: null, cost: { monthly: 10000 } }] }));
  ok('D-DURATION', 'a permanent hypothesis (duration null) stays in force to the horizon and its monthly cost runs to the horizon; the schedule reports effectiveTo = H',
     perm.months.slice(23).every(function (m) { return m.interventions.active[0] === 'p' && Math.abs(m.grossProfit - m.revenue * 0.85) < EPS && m.interventionCost === 10000; }) && perm.derived.interventions[0].effectiveTo === 60 && Math.abs(perm.derived.interventions[0].totalCost - 37 * 10000) < EPS, '');

  /* --- targets inside the layers --- */
  var rM = E.run(Object.assign({}, A, MW, { interventions: [{ id: 'px', target: 'monetization.components[1].priceGrowthAnnual', effect: 'set', value: 0.10, startMonth: 13 }, { id: 'list', target: 'monetization.components[0].priceAnnual', effect: 'multiply', value: 1.25, startMonth: 25 }] }));
  var rMb = E.run(Object.assign({}, A, MW));
  var pxOK = rM.months.slice(0, 12).every(function (m, i) { return Math.abs(m.closingARR - rMb.months[i].closingARR) === 0; }) && rM.months[12].monetization.priceARR > rMb.months[12].monetization.priceARR;
  var listOK = rM.cohorts.filter(function (c) { return c.acquisitionMonth >= 25; }).every(function (c) { return Math.abs(c.rows[0].monetization.perCustomerClosing - 23000) < 1e-9; }) &&
               rM.cohorts.filter(function (c) { return c.acquisitionMonth > 0 && c.acquisitionMonth < 25; }).every(function (c) { return Math.abs(c.rows[0].monetization.perCustomerClosing - 20000) < 1e-9; }) &&
               Math.abs(rM.cohorts[0].rows[24].monetization.state[0].price - rMb.cohorts[0].rows[24].monetization.state[0].price) < 1e-9;
  ok('D-LAYERS', 'hypotheses reach into the layers by path: usage price growth set to 10% from M13 changes every cohort\'s price effect from M13 (months 1–12 identical); a 25% list-price rise from M25 prices NEW logos at €23,000 while existing cohorts keep their own state — the two kinds of price change are distinct objects',
     pxOK && listOK, '');
  var rCu = E.run(Object.assign({}, A, CUW, { interventions: [{ id: 'L', target: 'logoRetentionAnnual', effect: 'add', value: 0.03, startMonth: 1 }] }));
  ok('D-LAYERS', 'logo retention + 3pp from M1 with Customer Physics on: the derived persistence in force follows (0.95 × 0.95 = 0.9025), read from the month record',
     Math.abs(rCu.months[0].interventions.changes[0].to - 0.95) < 1e-12 && Math.abs(rCu.cohorts[0].rows[0].customers.closing - 1000 * Math.pow(0.95, 1 / 12)) < 1e-9, '');

  /* --- composition with cash and measurement --- */
  var rC = E.run(Object.assign({}, A, { billingTermMonths: 12, interventions: [RET] }));
  ok('D-COMPOSE', 'with Cash Physics on the intervention cost is cash when incurred (cash costs include it) and the cash identities still hold every month',
     rC.months.every(function (m) { var c = m.cash; return Math.abs(c.cashCosts - (m.cogs + m.sm + m.rd + m.ga + m.expansionCost + m.interventionCost)) < EPS && Math.abs(m.fcf - (c.collections - c.cashCosts)) < EPS; }), '');
  var km = K.interventionMeasures(r, 20), km60 = K.interventionMeasures(r, 60);
  ok('D-MEASURE', 'interventionMeasures reports status, months in force and cost to date per hypothesis (M20: in force 12 months, €950k to date; M60: ended, €1.55m); the effect itself is a comparison of runs, not a measurement of one',
     km.hypotheses[0].status === 'in force' && km.hypotheses[0].monthsInForce === 12 && Math.abs(km.hypotheses[0].costToDate - 950000) < EPS && km60.hypotheses[0].status === 'ended' && Math.abs(km60.cumulativeCost - 1550000) < EPS, JSON.stringify(km.hypotheses[0]));
  var d1 = E.run(Object.assign({}, A, { interventions: [RET] })), d2 = E.run(Object.assign({}, A, { interventions: [RET] }));
  ok('D-DETERMINISM', 'two runs of the same hypothesis world are identical in every field', JSON.stringify(snapshot(d1)) === JSON.stringify(snapshot(d2)), '');
  ok('D-MODULE', 'interventions.js resolves without touching the base object (resolve(a, t).law is the base when nothing is active, a fresh object otherwise) and the built product inlines it before the engine',
     (function () { var a2 = E.normaliseAssumptions(Object.assign({}, A, { interventions: [RET] })); var r8 = IV.resolve(a2, 8), r9 = IV.resolve(a2, 9); return r8.law === a2 && r9.law !== a2 && a2.persistenceAnnual === 0.9 && r9.law.persistenceAnnual !== 0.9; })() &&
     (function () { var built = fs.readFileSync(__dirname + '/saas-physics-v1.html', 'utf8'); var i = built.indexOf('root.SaaSPhysicsInterventions = factory()'); return i > 0 && i < built.indexOf('var IV = deps.interventions'); })(), '');
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
