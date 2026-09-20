/*
 * SaaS Physics v1.1–v1.3 — cross-mechanism, release-gate and extreme-probe checks.
 *
 * The per-mechanism assertions live in integrity.js (EXP-COST, ACQ-BOUND,
 * ACQ-LAG) so the browser runs them too. This file holds what needs the
 * captured v1.0 fixture or a probe grid, and the checks that only make sense
 * once all three mechanisms exist together:
 *
 *   ALL-NULL          expansionCostPerARR 0 · saturation disabled · lag 0
 *                     reproduces baseline-v1.0.json (Base + 5 scenarios) — THE
 *                     release gate.
 *   SAT+LAG           capacity governs how much, lag governs when; changing the
 *                     lag never alters the acquisition response.
 *   COST+SAT          expansion cost never touches acquisition; the bound never
 *                     touches existing-cohort expansion.
 *   ALL-ON            with all three on, the ARR bridge, cohort sum, cash
 *                     roll-forward and P&L identity still reconcile.
 *   RETENTION-ISO     under all three, pure acquisition changes leave every
 *                     R12M measure unchanged.
 *   DETERMINISM       repeat runs identical, all three on.
 *   EXTREMES          zero/huge S&M, zero/high expansion, zero/high cost,
 *                     zero/long lag, disabled/very tight capacity: no NaN, no
 *                     Infinity, identities hold. Nothing is clamped.
 *   SWEEP             the S&M sweep is monotone in New ARR and M60 ARR while
 *                     marginal economics deteriorate faster than average.
 *
 * Run: node physics-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');

var EPS = 1e-6;
var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }
function ex(v) { return Number(v).toExponential(2); }
var A = E.DEFAULT_ASSUMPTIONS;
var NULLS = { expansionCostPerARR: 0, maxMonthlyNewARR: null, acquisitionLagMonths: 0 };
var ALL = { expansionCostPerARR: 0.25, maxMonthlyNewARR: 2000000, acquisitionLagMonths: 3 };

/* ------------------------------------------------------------------ *
 * ALL-NULL — the release gate.
 *
 * Two fixtures, both generated from the v1.0 engine at git ba98265 (the
 * generator is recorded in docs/BASELINE-v1.0.md):
 *
 *   baseline-v1.0.json          a small, human-readable subset (11 month
 *                               fields, cohort finals, R12M at 36, summary)
 *   baseline-v1.0-full.json.gz  EVERYTHING the v1.0 engine emitted: every
 *                               month field including `cumulative`, every
 *                               cohort scalar and every cohort row, R12M at
 *                               every T = 12…60 including per-cohort
 *                               contributions, summarise() including `mix`,
 *                               derived, bands — gzipped, read with node's
 *                               built-in zlib, no dependency.
 *
 * The FULL comparison walks the v1.0 object recursively and looks up the same
 * path in the v1.3 run. Numbers must agree within EPS, nulls/strings/booleans
 * exactly; a v1.0 path missing in v1.3 is a failure. Fields that exist only in
 * v1.3 (expansionCost, acquisitionLawNewARR, pendingNewARR, pendingSpend,
 * pendingCount, realisedFromSpendMonth, cohortCreated, cacCoefficientAtCreation,
 * capacityAtSpend, spendMonth, lagMonths, sourceEntries, mechanisms,
 * derived.acquisition/acquisitionLagMonths/expansionCostPerARR,
 * acquisitionLedger, pendingAtHorizon, summarise.cumExpansionCost/averageCAC/
 * marginalCAC/acquisitionUtilisation/firstCohortMonth/cohortCount/pending*) are
 * not in the fixture and are asserted separately to be at their null values.
 * ------------------------------------------------------------------ */
var SCEN = { base: {}, retention: { persistenceAnnual: 0.96 }, expansion: { expansionCoefficientAnnual: 0.18 },
             efficiency: { cacPerARR: 0.80 }, margin: { grossMargin: 0.65 }, pair: { cacPerARR: 0.80, sm: 900000 * 1.5 } };
function walkCompare(ref, cur, path, acc) {
  if (ref === null || typeof ref !== 'object') {
    acc.fields++;
    /* JSON has no Infinity: the v1.0 engine's open-ended band edge
       (bands[2].maxAgeExclusive = Infinity) serialised as null in the fixture.
       That is the one place a null in the fixture may meet ±Infinity here. */
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
(function allNull() {
  var zlib = require('zlib');
  var FULL = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/baseline-v1.0-full.json.gz')).toString('utf8'));
  var totalFields = 0;
  Object.keys(SCEN).forEach(function (k) {
    var r = E.run(Object.assign({}, A, NULLS, SCEN[k]));
    var r12 = []; for (var T = 12; T <= r.horizon; T++) r12.push(K.measureR12M(r, T));
    var cur = { months: r.months, cohorts: r.cohorts, r12m: r12, summary: E.summarise(r), derived: r.derived, bands: r.bands };
    var acc = { fields: 0, worst: 0, where: '', missing: [] };
    walkCompare(FULL[k], cur, k, acc);
    totalFields += acc.fields;
    ok('ALL-NULL-FULL', k + ': every v1.0 field (all month fields incl. cumulative, every cohort scalar and row, R12M at every T, summary, derived, bands) is reproduced by the v1.3 engine at null',
       acc.worst < EPS && acc.missing.length === 0,
       acc.fields + ' fields; worst |Δ| = ' + ex(acc.worst) + (acc.worst ? ' at ' + acc.where : ' (exact)') + (acc.missing.length ? '; MISSING/MISMATCHED: ' + acc.missing.slice(0, 5).join(', ') : ''));
    /* the v1.3-only state must be at its null values in the null world */
    var pend = r.months.every(function (m) { return m.pendingNewARR === 0 && m.pendingSpend === 0 && m.pendingCount === 0 && m.expansionCost === 0 && m.cohortCreated === true && m.acquisitionLawNewARR === m.newARR; });
    var led = r.acquisitionLedger.every(function (e) { return e.realised && e.matureMonth === e.spendMonth && e.lagMonths === 0 && e.maxMonthlyNewARRAtSpend === null && e.cacPerARRAtSpend === r.assumptions.cacPerARR; });
    var coh = r.cohorts.slice(1).every(function (c) { return c.spendMonth === c.acquisitionMonth && c.lagMonths === 0 && c.capacityAtSpend === null && c.cacCoefficientAtCreation === r.assumptions.cacPerARR && c.sourceEntries === 1; });
    ok('ALL-NULL-FULL', k + ': the v1.3-only state is at its null value (no pending stock, €0 cost line, a cohort every month, every ledger entry same-month, bound off at spend)',
       pend && led && coh && r.pendingAtHorizon.entries.length === 0 && r.cohorts.length === r.horizon + 1, '');
  });
  ok('ALL-NULL-FULL', 'total fields compared against the v1.0 full snapshot', totalFields > 200000, totalFields + ' fields');
  var r0 = E.run(A);
  ok('ALL-NULL', 'the default assumption object IS the all-null world (no caller has to opt out of anything)',
     r0.mechanisms.expansionCost === false && r0.mechanisms.acquisitionSaturation === false && r0.mechanisms.acquisitionLag === false, JSON.stringify(r0.mechanisms));
  /* the small fixture stays as a readable second witness */
  var B = JSON.parse(fs.readFileSync(__dirname + '/baseline-v1.0.json', 'utf8'));
  var worstS = 0;
  Object.keys(SCEN).forEach(function (k) {
    var r = E.run(Object.assign({}, A, NULLS, SCEN[k]));
    r.months.forEach(function (m, i) { Object.keys(B[k].months[i]).forEach(function (f) { worstS = Math.max(worstS, Math.abs(m[f] - B[k].months[i][f])); }); });
  });
  ok('ALL-NULL', 'the small readable fixture (baseline-v1.0.json) agrees too', worstS < EPS, 'worst |Δ| = ' + ex(worstS));
})();

/* ------------------------------------------------------------------ *
 * NO-PHANTOM-COHORTS + CAPITAL-RECONCILIATION — the pending stock is a
 * stock, not a placeholder cohort; capital is deployed when spent.
 *
 *   deployed(t) = Σ acquisitionCost of realised cohorts (acqMonth ≤ t)
 *               + Σ sm of ledger entries pending at t
 *               = Σ S&M spent through t                     (no double count)
 * ------------------------------------------------------------------ */
(function capitalReconciliation() {
  var CAPm = require('./capital.js');
  var cases = [['lag 0', { acquisitionLagMonths: 0 }], ['lag 6', { acquisitionLagMonths: 6 }], ['lag 12', { acquisitionLagMonths: 12 }],
               ['lag 72 (beyond horizon)', { acquisitionLagMonths: 72 }], ['zero S&M, lag 6', { sm: 0, acquisitionLagMonths: 6 }],
               ['lag 6 with capacity and cost', { acquisitionLagMonths: 6, maxMonthlyNewARR: 2e6, expansionCostPerARR: 0.25 }]];
  cases.forEach(function (cs) {
    var L = cs[1].acquisitionLagMonths, r = E.run(Object.assign({}, A, cs[1]));
    var phantoms = r.cohorts.filter(function (c) { return c.acquisitionMonth > 0 && c.acquisitionMonth <= L; }).length;
    var countOK = r.cohorts.length === 1 + Math.max(0, r.horizon - L);
    var ages = r.cohorts.slice(1).every(function (c) { return c.rows[0].t === c.acquisitionMonth && c.rows[0].age === 0 && c.spendMonth === c.acquisitionMonth - L; });
    var snapOK = true;
    for (var t = 1; t <= r.horizon; t++) if (E.cohortSnapshot(r, t).length !== 1 + Math.max(0, t - L)) snapOK = false;
    ok('NO-PHANTOM-COHORTS', cs[0] + ': no cohort exists before maturity; count = opening base + realised months; created in the maturity month, aged from realisation; cohortSnapshot counts realised cohorts only',
       phantoms === 0 && countOK && ages && snapOK,
       r.cohorts.length + ' cohorts (' + (r.cohorts.length - 1) + ' realised), ' + r.pendingAtHorizon.entries.length + ' entries pending at M' + r.horizon);
    var worst = 0, where = '', spent = 0;
    for (t = 1; t <= r.horizon; t++) {
      spent += r.months[t - 1].sm;
      var p = CAPm.portfolioCapital(r, t);
      var d1 = Math.abs(p.deployed - spent), d2 = Math.abs((p.realisedDeployed + p.pendingCapital) - p.deployed), d3 = Math.abs(p.pendingCapital - r.months[t - 1].pendingSpend);
      var d4 = Math.abs(p.deployed - CAPm.deployedSeries(r)[t]);
      var d = Math.max(d1, d2, d3, d4);
      if (d > worst) { worst = d; where = 'M' + t; }
    }
    ok('CAPITAL-RECONCILIATION', cs[0] + ': deployed = realised-cohort capital + pending capital = Σ S&M spent = deployedSeries, every month, no double counting',
       worst < EPS, 'worst residual €' + ex(worst) + (worst ? ' at ' + where : ' (exact)'));
  });
  /* the maturity transition, shown numerically: lag 6, months 6 → 7 → 8 */
  var r6 = E.run(Object.assign({}, A, { acquisitionLagMonths: 6 }));
  var rows = [6, 7, 8, 12].map(function (t) { var p = CAPm.portfolioCapital(r6, t); return { t: t, realised: p.realisedDeployed, pending: p.pendingCapital, deployed: p.deployed, spent: t * A.sm, pendingCount: p.counts.pending, cohorts: E.cohortSnapshot(r6, t).length - 1 }; });
  var transOK = rows[0].realised === 0 && rows[0].pending === 6 * A.sm && Math.abs(rows[1].realised - A.sm) < EPS && Math.abs(rows[1].pending - 6 * A.sm) < EPS &&
                rows.every(function (x) { return Math.abs(x.deployed - x.spent) < EPS && x.pendingCount === 6; }) && rows[1].cohorts === 1 && rows[0].cohorts === 0;
  ok('CAPITAL-RECONCILIATION', 'lag 6 through the first maturity: M6 realised €0 / pending €5.4m; M7 realised €0.9m / pending €5.4m (one in, one out); deployed = spent at every step',
     transOK, rows.map(function (x) { return 'M' + x.t + ': realised €' + (x.realised / 1e6).toFixed(2) + 'm + pending €' + (x.pending / 1e6).toFixed(2) + 'm (' + x.pendingCount + ' months) = €' + (x.deployed / 1e6).toFixed(2) + 'm = spent €' + (x.spent / 1e6).toFixed(2) + 'm · ' + x.cohorts + ' realised cohorts'; }).join(' | '));
  /* pending capital has recovered nothing; outstanding includes it in full */
  var p12 = CAPm.portfolioCapital(r6, 12);
  ok('CAPITAL-RECONCILIATION', 'pending capital is outstanding in full (it has no cohort to recover through): outstanding = unrecovered on realised cohorts + pending',
     Math.abs(p12.outstanding - (p12.outstandingRealised + p12.pendingCapital)) < EPS && p12.pendingCapital === 6 * A.sm && p12.counts.paidBack === 0,
     'M12: outstanding €' + (p12.outstanding / 1e6).toFixed(2) + 'm = €' + (p12.outstandingRealised / 1e6).toFixed(2) + 'm realised-unrecovered + €' + (p12.pendingCapital / 1e6).toFixed(2) + 'm pending; paid-back count ' + p12.counts.paidBack);
})();

/* ------------------------------------------------------------------ *
 * SATURATION-INDEPENDENT — the law N(S), evaluated on a grid, checked
 * with finite differences only; the analytical response is compared
 * against those differences, never assumed.
 * ------------------------------------------------------------------ */
(function saturationIndependent() {
  /* h is the GRID step (shape: monotone, concave, declining ΔN/ΔS); hd is the
     small step for derivative ESTIMATES compared against the closed form —
     the central difference is O(hd²) accurate, and at hd = €10 on a law
     curving over millions the truncation error is ~1e-11 relative while the
     cancellation error stays ~1e-10. */
  var CAPv = 2e6, h = 50000, hd = 10, grid = [];
  var lawAt = function (s) { return E.newARRPerMonth(Object.assign({}, A, { sm: s, maxMonthlyNewARR: CAPv })); };
  for (var s = h; s <= 8e6; s += h) grid.push({ s: s, N: lawAt(s) });
  var inc = true, concave = true, fdDecl = true, below = true, worstMarg = 0, worstDN = 0, prevFd = Infinity;
  for (var i = 0; i < grid.length; i++) {
    var g = grid[i];
    var fwd = (lawAt(g.s + h) - g.N) / h, central = (lawAt(g.s + hd) - lawAt(g.s - hd)) / (2 * hd);
    var second = (lawAt(g.s + h) - 2 * g.N + lawAt(g.s - h)) / (h * h);
    if (i > 0 && g.N <= grid[i - 1].N) inc = false;
    if (second >= 0) concave = false;
    if (fwd > prevFd + 1e-12) fdDecl = false; prevFd = fwd;
    if (g.N >= CAPv) below = false;
    var an = E.acquisitionResponse(Object.assign({}, A, { sm: g.s, maxMonthlyNewARR: CAPv }));
    worstDN = Math.max(worstDN, Math.abs(central - an.dNewARRdSM) / an.dNewARRdSM);
    worstMarg = Math.max(worstMarg, Math.abs((1 / central) - an.marginalCAC) / an.marginalCAC);
  }
  ok('SATURATION-INDEPENDENT', 'on a €50k grid to €8m, N(S) is strictly increasing and every finite second difference is negative (the law itself, no derivative formula used)',
     inc && concave, grid.length + ' points; increasing ' + inc + ', second differences < 0 ' + concave);
  ok('SATURATION-INDEPENDENT', 'finite-difference marginal productivity ΔN/ΔS declines along the grid and bounded N stays strictly below the asymptote',
     fdDecl && below, 'ΔN/ΔS ' + ((grid[0].N - lawAt(0)) / h).toFixed(4) + ' at €50k → ' + ((lawAt(8e6 + h) - grid[grid.length - 1].N) / h).toFixed(4) + ' at €8m; N(€8m) = ' + (grid[grid.length - 1].N / CAPv * 100).toFixed(2) + '% of capacity');
  ok('SATURATION-INDEPENDENT', 'numerical (central-difference) marginal CAC agrees with the analytical marginal CAC at every grid point, and so does dN/dS',
     worstMarg < 1e-6 && worstDN < 1e-6, 'worst rel err: marginal CAC ' + ex(worstMarg) + ', dN/dS ' + ex(worstDN));
})();

/* ------------------------------------------------------------------ *
 * CAC-UNITS — CAC is per €1 of ARR and never passes through the MRR/ARR
 * display basis. Source scan of the product template (the DOM check is in
 * physics-accept.js).
 * ------------------------------------------------------------------ */
(function cacUnits() {
  var tpl = fs.readFileSync(__dirname + '/v1.template.html', 'utf8');
  ok('CAC-UNITS', 'no CAC figure in the template is multiplied by the basis (no "AtCreation*(basis" / "CAC*(basis" pattern)',
     !/cacPerARRAtCreation\s*\*\s*\(basis|cacCoefficientAtCreation\s*\*\s*\(basis|CAC\s*\*\s*\(basis/.test(tpl), '');
  ok('CAC-UNITS', 'the canonical CAC vocabulary is used on screen: "CAC coefficient", "Average CAC", "Marginal CAC", "Cohort CAC (realised)", "Measured CAC · trailing 12"; and paybacks are qualified',
     /CAC coefficient/.test(tpl) && /Average CAC/.test(tpl) && /Marginal CAC/.test(tpl) && /Cohort CAC \(realised\)/.test(tpl) && /Measured CAC · trailing 12/.test(tpl) &&
     /Coefficient payback/.test(tpl) && /Average payback/.test(tpl) && /Marginal payback/.test(tpl) && /Cohort payback/.test(tpl) && !/'CAC payback'/.test(tpl), '');
})();

/* ------------------------------------------------------------------ *
 * SAT+LAG — how much vs when
 * ------------------------------------------------------------------ */
(function satLag() {
  var cap = 2000000, L = 4;
  var sat = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var satLag = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap, acquisitionLagMonths: L }));
  var respNoLag = E.acquisitionResponse(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var respLag = E.acquisitionResponse(Object.assign({}, A, { maxMonthlyNewARR: cap, acquisitionLagMonths: L }));
  var same = ['newARR', 'averageCAC', 'marginalCAC', 'dNewARRdSM', 'utilisation'].every(function (k) { return respNoLag[k] === respLag[k]; });
  ok('SAT+LAG', 'changing the lag does not alter the acquisition response function (N, average CAC, marginal CAC, dN/dS&M, utilisation identical)',
     same, 'N ' + respLag.newARR.toFixed(2) + ' both; marginal CAC ' + respLag.marginalCAC.toFixed(4) + '× both');
  var afterLag = satLag.months.slice(L).every(function (m) { return Math.abs(m.newARR - respLag.newARR) < EPS; });
  var beforeLag = satLag.months.slice(0, L).every(function (m) { return m.newARR === 0; });
  ok('SAT+LAG', 'capacity governs how much ARR each month of spend creates; lag governs when it appears (€0 for L months, then the saturated N every month)',
     afterLag && beforeLag, 'first ' + L + ' months €0, then €' + (respLag.newARR / 1e6).toFixed(4) + 'm/mo = the bounded response');
  var shifted = 0;
  for (var t = L; t < sat.horizon; t++) shifted = Math.max(shifted, Math.abs(satLag.months[t].newARR - sat.months[t - L].newARR));
  ok('SAT+LAG', 'the realised New ARR series under lag is the no-lag series shifted by exactly L months',
     shifted < EPS, 'max |N_lag(t) − N(t−L)| = €' + ex(shifted));
  var sumSat = sat.months[sat.horizon - 1].cumulative.newARR, sumSatLag = satLag.months[satLag.horizon - 1].cumulative.newARR;
  ok('SAT+LAG', 'inside the horizon the lagged world realises exactly L months less of New ARR — the horizon effect, not a productivity change',
     Math.abs((sumSat - sumSatLag) - L * respLag.newARR) < EPS, 'Σ N no-lag €' + (sumSat / 1e6).toFixed(3) + 'm − Σ N lag €' + (sumSatLag / 1e6).toFixed(3) + 'm = ' + L + ' × €' + (respLag.newARR / 1e6).toFixed(4) + 'm');
})();

/* ------------------------------------------------------------------ *
 * COST+SAT — separate concepts stay separate
 * ------------------------------------------------------------------ */
(function costSat() {
  var cap = 1500000, c = 0.4;
  var satOnly = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap }));
  var both = E.run(Object.assign({}, A, { maxMonthlyNewARR: cap, expansionCostPerARR: c }));
  var costOnly = E.run(Object.assign({}, A, { expansionCostPerARR: c }));
  var base = E.run(A);
  var nSame = satOnly.derived.newARRPerMonth === both.derived.newARRPerMonth &&
              JSON.stringify(satOnly.derived.acquisition) === JSON.stringify(both.derived.acquisition);
  ok('COST+SAT', 'expansion realisation cost does not affect acquisition productivity (New ARR and the whole response object identical with and without the cost)',
     nSame, 'N €' + (both.derived.newARRPerMonth / 1e6).toFixed(4) + 'm/mo either way');
  var w = 0;
  for (var t = 0; t < base.horizon; t++) w = Math.max(w, Math.abs(satOnly.cohorts[0].rows[t].expansion - base.cohorts[0].rows[t].expansion),
                                                       Math.abs(costOnly.cohorts[0].rows[t].expansion - base.cohorts[0].rows[t].expansion));
  ok('COST+SAT', 'neither the bound nor the cost changes existing-cohort expansion (opening cohort expansion identical in all three worlds)',
     w === 0, 'max Δexpansion on the opening cohort €' + ex(w));
  var wc = 0;
  both.months.forEach(function (m) { wc = Math.max(wc, Math.abs(m.expansionCost - m.expansion * c)); });
  ok('COST+SAT', 'with both on, the cost line is still exactly expansion ARR × coefficient (the bound alters the expansion base only through smaller cohorts)',
     wc < EPS, 'max residual €' + ex(wc));
})();

/* ------------------------------------------------------------------ *
 * ALL-ON, RETENTION-ISO, DETERMINISM
 * ------------------------------------------------------------------ */
(function allOn() {
  var r = E.run(Object.assign({}, A, ALL));
  var wBridge = 0, wCash = 0, wPL = 0, wSum = 0, prev = r.start.openingCash;
  r.months.forEach(function (m, i) {
    wBridge = Math.max(wBridge, Math.abs(m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR));
    wCash = Math.max(wCash, Math.abs(m.cashOpening - prev), Math.abs(m.cashClosing - (m.cashOpening + m.fcf))); prev = m.cashClosing;
    wPL = Math.max(wPL, Math.abs(m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.ebita));
    var s = E.cohortSnapshot(r, i + 1).reduce(function (a2, c) { return a2 + c.currentARR; }, 0);
    wSum = Math.max(wSum, Math.abs(s - m.closingARR));
  });
  ok('ALL-ON', 'with all three mechanisms on: ARR bridge, cohort sum, cash roll-forward and the P&L identity all reconcile',
     wBridge < EPS && wCash < EPS && wPL < EPS && wSum < EPS,
     'bridge €' + ex(wBridge) + ' · cohort sum €' + ex(wSum) + ' · cash €' + ex(wCash) + ' · P&L €' + ex(wPL) + ' · mechanisms ' + JSON.stringify(r.mechanisms));
  ok('ALL-ON', 'the run reports all three mechanisms as switched on',
     r.mechanisms.expansionCost && r.mechanisms.acquisitionSaturation && r.mechanisms.acquisitionLag, '');

  var ten = E.run(Object.assign({}, A, ALL, { sm: A.sm * 10 }));
  var lag0 = E.run(Object.assign({}, A, ALL, { acquisitionLagMonths: 0 }));
  var capOff = E.run(Object.assign({}, A, ALL, { maxMonthlyNewARR: null }));
  var w = 0;
  for (var T = 12; T <= r.horizon; T++) {
    var k0 = K.measureR12M(r, T);
    [ten, lag0, capOff].forEach(function (v) {
      var k1 = K.measureR12M(v, T);
      w = Math.max(w, Math.abs(k0.grr - k1.grr), Math.abs(k0.expansionRate - k1.expansionRate), Math.abs(k0.nrr - k1.nrr));
    });
  }
  ok('RETENTION-ISO', 'under all three mechanisms, 10× S&M, removing the lag or removing the bound leave R12M GRR / expansion / NRR unchanged at every T',
     w < 1e-12, 'max KPI delta ' + ex(w));

  var r1 = E.run(Object.assign({}, A, ALL)), r2 = E.run(JSON.parse(JSON.stringify(Object.assign({}, A, ALL))));
  ok('DETERMINISM', 'repeat runs with all three on are byte-identical (months, cohorts, ledger)',
     JSON.stringify(r1.months) === JSON.stringify(r2.months) && JSON.stringify(r1.cohorts) === JSON.stringify(r2.cohorts) &&
     JSON.stringify(r1.acquisitionLedger) === JSON.stringify(r2.acquisitionLedger), '');
})();

/* ------------------------------------------------------------------ *
 * EXTREMES — legitimate controls at their edges
 * ------------------------------------------------------------------ */
(function extremes() {
  var probes = [
    ['zero S&M', { sm: 0 }], ['zero S&M, all on', Object.assign({ sm: 0 }, ALL)],
    ['very large S&M', { sm: 1e9 }], ['very large S&M, tight capacity', { sm: 1e9, maxMonthlyNewARR: 100000 }],
    ['zero expansion', { expansionCoefficientAnnual: 0 }], ['zero expansion, high cost', { expansionCoefficientAnnual: 0, expansionCostPerARR: 5 }],
    ['high expansion', { expansionCoefficientAnnual: 0.4 }], ['high expansion, high cost', { expansionCoefficientAnnual: 0.4, expansionCostPerARR: 5 }],
    ['zero cost', { expansionCostPerARR: 0 }], ['high cost', { expansionCostPerARR: 10 }],
    ['zero lag', { acquisitionLagMonths: 0 }], ['long lag (24)', { acquisitionLagMonths: 24 }], ['lag beyond horizon (72)', { acquisitionLagMonths: 72 }],
    ['saturation disabled', { maxMonthlyNewARR: null }], ['very tight capacity (€10k/mo)', { maxMonthlyNewARR: 10000 }],
    ['capacity 0 (no acquisition capacity)', { maxMonthlyNewARR: 0 }], ['capacity Infinity (disabled)', { maxMonthlyNewARR: Infinity }],
    ['all on, long lag, tight capacity, high cost', { expansionCostPerARR: 3, maxMonthlyNewARR: 50000, acquisitionLagMonths: 18 }]
  ];
  probes.forEach(function (p) {
    var r = E.run(Object.assign({}, A, p[1]));
    var bad = 0, wBridge = 0, wPL = 0, wSum = 0;
    r.months.forEach(function (m, i) {
      Object.keys(m).forEach(function (k) { if (typeof m[k] === 'number' && !isFinite(m[k])) bad++; });
      wBridge = Math.max(wBridge, Math.abs(m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR));
      wPL = Math.max(wPL, Math.abs(m.grossProfit - m.sm - m.rd - m.ga - m.expansionCost - m.ebita));
      var s = E.cohortSnapshot(r, i + 1).reduce(function (a2, c) { return a2 + c.currentARR; }, 0);
      wSum = Math.max(wSum, Math.abs(s - m.closingARR));
    });
    var resp = r.derived.acquisition;
    var respOK = isFinite(resp.newARR) && resp.newARR >= 0 && !isNaN(resp.averageCAC) && !isNaN(resp.marginalCAC);
    var tol = Math.max(EPS, 1e-9 * Math.abs(r.months[r.horizon - 1].closingARR));
    ok('EXTREMES', p[0] + ': no NaN/Infinity in any month field; bridge, cohort sum and P&L identity hold',
       bad === 0 && respOK && wBridge < tol && wPL < tol && wSum < tol,
       'non-finite fields ' + bad + ' · N €' + (resp.newARR / 1e6).toFixed(4) + 'm · bridge €' + ex(wBridge) + ' · sum €' + ex(wSum) + ' · P&L €' + ex(wPL) +
       ' · M60 ARR €' + (r.months[r.horizon - 1].closingARR / 1e6).toFixed(2) + 'm · cash €' + (r.months[r.horizon - 1].cashClosing / 1e6).toFixed(2) + 'm');
  });
  var beyond = E.run(Object.assign({}, A, { acquisitionLagMonths: 72 }));
  ok('EXTREMES', 'a lag beyond the horizon realises nothing inside it, creates NO cohort (only the opening base exists), expenses every month of S&M, and reports all 60 entries pending at the horizon',
     beyond.months.every(function (m) { return m.newARR === 0 && m.sm === A.sm && m.cohortCreated === false; }) && beyond.cohorts.length === 1 && beyond.pendingAtHorizon.entries.length === 60 &&
     Math.abs(beyond.pendingAtHorizon.spend - A.sm * 60) < EPS, 'pending spend €' + (beyond.pendingAtHorizon.spend / 1e6).toFixed(1) + 'm; cohorts: ' + beyond.cohorts.length);
  var badLag = 0; [-1, 2.5, NaN, 'x', Infinity, null].forEach(function (v) { try { E.run(Object.assign({}, A, { acquisitionLagMonths: v })); } catch (err) { if (err instanceof RangeError) badLag++; } });
  var badCap = 0; [-5, NaN, 'x'].forEach(function (v) { try { E.run(Object.assign({}, A, { maxMonthlyNewARR: v })); } catch (err) { if (err instanceof RangeError) badCap++; } });
  ok('EXTREMES', 'invalid lags (−1, 2.5, NaN, "x", Infinity, null) and invalid capacities (−5, NaN, "x") are rejected with RangeError at the engine boundary; ±Infinity capacity canonicalises to null',
     badLag === 6 && badCap === 3 && E.run(Object.assign({}, A, { maxMonthlyNewARR: Infinity })).assumptions.maxMonthlyNewARR === null &&
     E.compare(E.run(A), E.run(Object.assign({}, A, { maxMonthlyNewARR: Infinity }))).changed.length === 0, badLag + ' lags and ' + badCap + ' capacities rejected');
  var zeroCap = E.run(Object.assign({}, A, { maxMonthlyNewARR: 0 }));
  ok('EXTREMES', 'capacity 0 is NOT silently treated as "disabled": it means no acquisition capacity, New ARR = 0, S&M still spent',
     zeroCap.mechanisms.acquisitionSaturation && zeroCap.derived.newARRPerMonth === 0 && zeroCap.months[0].sm === A.sm, '');
})();

/* ------------------------------------------------------------------ *
 * SWEEP — diminishing returns, exposed as a curve
 * ------------------------------------------------------------------ */
(function sweep() {
  var cap = 2000000, rows = [];
  for (var sm = 0; sm <= 5e6; sm += 250000) {
    var r = E.run(Object.assign({}, A, { sm: sm, maxMonthlyNewARR: cap })), s = E.summarise(r), q = r.derived.acquisition;
    rows.push({ sm: sm, N: q.newARR, m60: s.finalARR, avg: q.averageCAC, marg: q.marginalCAC, trough: s.cashTrough, end: s.endingCash });
  }
  var monoN = true, monoM60 = true, margFaster = true, avgUp = true;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i].N < rows[i - 1].N) monoN = false;
    if (rows[i].m60 < rows[i - 1].m60) monoM60 = false;
    if (rows[i].avg < rows[i - 1].avg) avgUp = false;
    if ((rows[i].marg - rows[i - 1].marg) <= (rows[i].avg - rows[i - 1].avg)) margFaster = false;
  }
  ok('SWEEP', 'S&M sweep €0–5m/mo: New ARR and M60 ARR are monotone non-decreasing in S&M (the bound never makes spend destroy ARR)',
     monoN && monoM60, 'N €' + (rows[1].N / 1e6).toFixed(3) + 'm → €' + (rows[rows.length - 1].N / 1e6).toFixed(3) + 'm; M60 ARR €' + (rows[1].m60 / 1e6).toFixed(1) + 'm → €' + (rows[rows.length - 1].m60 / 1e6).toFixed(1) + 'm');
  ok('SWEEP', 'average CAC rises with spend, and marginal CAC rises FASTER than average at every step (marginal economics deteriorate first)',
     avgUp && margFaster, 'at €5m: average ' + rows[rows.length - 1].avg.toFixed(2) + '×, marginal ' + rows[rows.length - 1].marg.toFixed(2) + '×');
  var troughMin = rows.reduce(function (lo, r) { return r.trough < lo.trough ? r : lo; }, rows[0]);
  ok('SWEEP', 'the cash trough deepens as spend rises under the bound — a capital consequence the sweep exposes without declaring an optimum',
     troughMin.sm > 0 && troughMin.trough < rows[0].trough, 'deepest trough €' + (troughMin.trough / 1e6).toFixed(2) + 'm at S&M €' + (troughMin.sm / 1e6).toFixed(2) + 'm/mo');
})();

console.log('\nSaaS Physics v1.1–v1.3 — physics extension checks\n' + '='.repeat(96));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(96));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
