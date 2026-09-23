/*
 * SaaS Physics v1 — MRR/ARR reporting-basis regression checks.
 *
 * The switch added in this pass is a PURE PRESENTATION transform (basis.js):
 * every recurring quantity the UI shows is run through BS.toBasis(v, basis)
 * only at the point of display. (The engine itself became MRR-native in a
 * later refactor — see engine.js's header — but every field this switch
 * reads is still ARR-denominated, so the transform and this file are
 * unchanged.) These checks verify that claim three ways:
 *
 *   BASIS-12X            displayed ARR = 12 x displayed MRR, exactly,
 *                         before display rounding, for every kind of
 *                         recurring quantity the product shows.
 *   FINANCIAL-INVARIANCE the transform is never reachable from the frozen
 *                         engine files, and the template wraps financial
 *                         flows / cash / ratios / capital figures in the
 *                         PLAIN formatters, never the basis-aware ones.
 *   SCENARIO-INVARIANCE  all six canonical scenarios' underlying economics
 *                         (computed once, by the frozen engine, with no
 *                         concept of "basis") survive the BASIS-12X check
 *                         for every recurring figure they report.
 *
 * Run: node basis-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var SS = require('./systemstate.js');
var BS = require('./basis.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

/* ------------------------------------------------------------------ *
 * BASIS-12X — the arithmetic identity itself, on the transform.
 * ------------------------------------------------------------------ */
(function basisTransform() {
  var samples = [0, 1, 100, 12, 900000, 20000000, -450000, 0.333333, 1e9, -1];
  var worst = 0, worstV = null;
  samples.forEach(function (v) {
    var mrr = BS.toBasis(v, 'MRR'), arr = BS.toBasis(v, 'ARR');
    var residual = Math.abs(arr - 12 * mrr);
    if (residual > worst) { worst = residual; worstV = v; }
  });
  ok('BASIS-12X', 'toBasis: ARR == 12 x MRR, exactly, before display rounding',
     worst === 0, 'max residual ' + worst.toExponential(3) + (worstV !== null ? ' at v=' + worstV : ''));
  ok('BASIS-12X', 'toBasis(v, \'ARR\') is the identity (engine stays ARR-native)',
     samples.every(function (v) { return BS.toBasis(v, 'ARR') === v; }), '');
  ok('BASIS-12X', 'toBasis default basis is MRR',
     BS.DEFAULT_BASIS === 'MRR', 'DEFAULT_BASIS=' + BS.DEFAULT_BASIS);
})();

/* ------------------------------------------------------------------ *
 * BASIS-12X — real recurring quantities out of the frozen engine:
 * stock, New, Expansion, Leakage, Base, Experiment, Delta, cohort inspect.
 * ------------------------------------------------------------------ */
(function basisOnRealFigures() {
  var A = E.DEFAULT_ASSUMPTIONS;
  var base = E.run(A);
  var exp = E.run(Object.assign({}, A, { persistenceAnnual: 0.96 })); // Scenario 1 — Retention
  var H = E.HORIZON;

  var fields = [];
  for (var t = 1; t <= H; t += 11) {
    var bm = base.months[t - 1], xm = exp.months[t - 1];
    fields.push(['base closingARR M' + t, bm.closingARR]);
    fields.push(['base newARR M' + t, bm.newARR]);
    fields.push(['base expansion M' + t, bm.expansion]);
    fields.push(['base leakage M' + t, bm.leakage]);
    fields.push(['experiment closingARR M' + t, xm.closingARR]);
    var d = SS.deltaStateAt(base, exp, t);
    fields.push(['delta closingARR M' + t, d.closingARR]);
    fields.push(['delta newARR M' + t, d.newARR]);
    fields.push(['delta expansion M' + t, d.expansion]);
    fields.push(['delta leakage M' + t, d.leakage]);
  }
  var bs = E.summarise(base), xs = E.summarise(exp);
  fields.push(['base finalARR', bs.finalARR]);
  fields.push(['experiment finalARR', xs.finalARR]);
  fields.push(['base cumExpansion', bs.cumExpansion]);
  fields.push(['experiment cumExpansion', xs.cumExpansion]);
  fields.push(['base cumLeakage', bs.cumLeakage]);
  fields.push(['experiment cumLeakage', xs.cumLeakage]);
  fields.push(['M60 ARR delta (consequence panel)', xs.finalARR - bs.finalARR]);
  fields.push(['New ARR/mo delta', exp.derived.newARRPerMonth - base.derived.newARRPerMonth]);

  /* cohort inspect: original ARR, current ARR, cumulative Expansion/Leakage */
  var m36 = 36;
  var snap = E.cohortSnapshot(exp, m36);
  exp.cohorts.slice(0, 5).forEach(function (c) {
    var s = snap.filter(function (x) { return x.id === c.id; })[0];
    fields.push(['cohort ' + c.id + ' initialARR', c.initialARR]);
    if (s) {
      fields.push(['cohort ' + c.id + ' currentARR@M36', s.currentARR]);
      fields.push(['cohort ' + c.id + ' cumExpansion@M36', s.cumExpansion]);
      fields.push(['cohort ' + c.id + ' cumLeakage@M36', s.cumLeakage]);
    }
  });

  /* EPS matches integrity.js's own euro tolerance — IEEE-754 division/
     multiplication is not bit-exact for arbitrary doubles, so "exactly"
     means negligible against a euro, not literally zero. The same-order
     residuals already appear in the frozen engine's own checks (e.g.
     integrity.js check 33's €7.45e-9 bridge residual). */
  var EPS = 1e-6;
  var worst = 0, worstLabel = null, n = 0;
  fields.forEach(function (f) {
    var label = f[0], v = f[1];
    var mrr = BS.toBasis(v, 'MRR'), arr = BS.toBasis(v, 'ARR');
    var residual = Math.abs(arr - 12 * mrr);
    n++;
    if (residual > worst) { worst = residual; worstLabel = label; }
  });
  ok('BASIS-12X', 'Real recurring figures (stock/New/Expansion/Leakage/Base/Experiment/Delta/cohort) satisfy ARR = 12 x MRR',
     worst < EPS, n + ' quantities checked, max residual €' + worst.toExponential(3) + (worstLabel ? ' at "' + worstLabel + '"' : ''));

  /* MRR must be exactly v/12 (not merely close), and never rounded before the check */
  var mismatch = fields.filter(function (f) { return BS.toBasis(f[1], 'MRR') !== f[1] / 12; });
  ok('BASIS-12X', 'MRR = ARR / 12 exactly, no intermediate rounding',
     mismatch.length === 0, mismatch.length + ' mismatches');
})();

/* ------------------------------------------------------------------ *
 * SCENARIO-INVARIANCE — all six canonical scenarios' recurring outputs
 * pass BASIS-12X, and the underlying economics never take a "basis"
 * parameter (the engine has no such concept; the UI never passes one).
 * ------------------------------------------------------------------ */
(function scenarioInvariance() {
  var A = E.DEFAULT_ASSUMPTIONS;
  var STABLE_C = { p: 0.94, x: 0.14 }, RISKY_C = { p: 0.78, x: 0.06 };
  function bandOf(n, mx, c) { return { name: n, maxAgeExclusive: mx, persistenceAnnual: c.p, expansionCoefficientAnnual: c.x }; }
  var SCEN6_BANDS = [bandOf('Early', 12, STABLE_C), bandOf('Developing', 24, RISKY_C), bandOf('Mature', Infinity, STABLE_C)];
  var TARGET_NEW = 1125000;

  var SCENARIOS = [
    { id: 'retention', base: A, exp: Object.assign({}, A, { persistenceAnnual: 0.96 }) },
    { id: 'expansion', base: A, exp: Object.assign({}, A, { expansionCoefficientAnnual: 0.18 }) },
    { id: 'efficiency', base: A, exp: Object.assign({}, A, { cacPerARR: 0.80 }) },
    { id: 'margin', base: A, exp: Object.assign({}, A, { grossMargin: 0.65 }) },
    { id: 'pair',
      base: Object.assign({}, A, { cacPerARR: A.sm / TARGET_NEW }),
      exp:  Object.assign({}, A, { sm: TARGET_NEW * A.cacPerARR }) },
    { id: 'history',
      base: Object.assign({}, A, { bands: SCEN6_BANDS, sm: 0 }),
      exp:  Object.assign({}, A, { bands: SCEN6_BANDS, sm: 0 }),
      baseStart: { openingARR: 20000000, openingCash: 10000000, openingCohorts: [{ arr: 20000000, age: 24 }] },
      expStart:  { openingARR: 20000000, openingCash: 10000000, openingCohorts: [{ arr: 20000000, age: 0 }] } }
  ];

  var allPass = true, detail = [];
  SCENARIOS.forEach(function (sc) {
    var baseRes = E.run(sc.base, sc.baseStart), expRes = E.run(sc.exp, sc.expStart);
    var bs = E.summarise(baseRes), xs = E.summarise(expRes);
    var recurring = [
      xs.finalARR - bs.finalARR,                                       // M60 ARR
      expRes.derived.newARRPerMonth - baseRes.derived.newARRPerMonth,   // New ARR/mo
      xs.cumExpansion - bs.cumExpansion,                                // cumulative Expansion
      xs.cumLeakage - bs.cumLeakage                                     // cumulative Leakage
    ];
    var worst = 0;
    recurring.forEach(function (v) {
      worst = Math.max(worst, Math.abs(BS.toBasis(v, 'ARR') - 12 * BS.toBasis(v, 'MRR')));
    });
    /* the economics themselves — same regardless of which basis will later
       be chosen to display them, because "basis" never reaches E.run */
    var econImmutable = typeof baseRes.assumptions.basis === 'undefined' && typeof expRes.assumptions.basis === 'undefined';
    if (worst !== 0 || !econImmutable) allPass = false;
    detail.push(sc.id + ':' + worst.toExponential(1));
  });
  ok('SCENARIO-INVARIANCE', 'All six canonical scenarios: recurring consequence-panel figures satisfy ARR = 12 x MRR',
     allPass, detail.join(', '));
})();

/* ------------------------------------------------------------------ *
 * FINANCIAL-INVARIANCE — structural audit of the template source.
 *
 * (a) the frozen engine files never reference basis.js — the switch is
 *     unreachable from the economics, not merely unused by it.
 * (b) every known financial-flow / cash / ratio / capital-recovery call
 *     site in v1.template.html still uses the PLAIN formatter (eur/d/n),
 *     never the basis-aware one (reur/rd/rn/reurS) — so a future edit
 *     that accidentally routes Revenue/GP/FCF/Cash/S&M/acquisition cost
 *     through the MRR/ARR switch fails this check.
 * ------------------------------------------------------------------ */
(function financialInvariance() {
  ['engine.js', 'kpi.js', 'integrity.js'].forEach(function (f) {
    var src = fs.readFileSync(f, 'utf8');
    ok('FINANCIAL-INVARIANCE', f + ' never references basis.js or SaaSPhysicsBasis',
       !/basis\.js|SaaSPhysicsBasis/.test(src), '');
  });

  var tpl = fs.readFileSync('v1.template.html', 'utf8');

  /* exempt call sites: financial flows, cash, capital recovery, acquisition
     cost — each must still read as a PLAIN eur()/d()/n() call, never the
     basis-aware reur()/rd()/rn()/reurS() family. */
  var exemptPatterns = [
    /n\(d\.cashClosing\)/,
    /n\(d\.revenue\)/,
    /n\(d\.grossProfit\)/,
    /n\(d\.otherOpex\)/,
    /n\(d\.fcf\)/,
    /var finSE = function\(v\)\{ return v<0 \? '−'\+eur\(-v\) : eur\(v\); \}/,   // Financials · figure (EBITA, FCF, NWC in plain euros)
    /return \{ t:finFk\(v\), c:/,                                          // Financials · statements (plain € thousands), full build and month tick alike
    /eur\(em\.cashClosing\)/,
    /yFmt:eur, aria:'cumulative gross profit against the acquisition cost of one cohort'/,   // Inspect · cohort life · capital-recovery chart
    /eur\(gap\)\+' beyond acquisition cost'/,                       // Inspect · cohort life · the recovery gap at the selected month
    /eur\(cc\.acquisitionCost\)/,          // Inspect · capital recovery step (moved from the cohort rows in the legibility pass)
    /eur\(c\.acquisitionCost\)/,
    /eur\(now\.cumGP\)/,
    /eur\(now\.unrecovered\)/,
    /eur\(subj\.acquisitionCost\)/,
    /eur\(capAgg\[mi\]\.surplus\)/,
    /eur\(capAgg\[mi\]\.out\)/,
    /eur\(g\.total\)/,
    /eur\(p\.outstanding\)/,
    /row\('Acquisition capital deployed', x\.cumSM - b\.cumSM, -\(x\.cumSM - b\.cumSM\)\)/,
    /row\('Cumulative gross profit', x\.cumGrossProfit - b\.cumGrossProfit\)/,
    /row\('Cumulative FCF', x\.cumEbita - b\.cumEbita\)/,
    /row\('Ending cash', x\.endingCash - b\.endingCash\)/,
    /eur\(b\.cumGrossProfit\)\+' → '\+eur\(x\.cumGrossProfit\)/,
    /eur\(b\.finalYearFCF\)\+' → '\+eur\(x\.finalYearFCF\)/,
    /eur\(b\.cumSM\)\+' → '\+eur\(x\.cumSM\)/,
    /eur\(b\.endingCash\)\+' → '\+eur\(x\.endingCash\)/
  ];
  var missing = exemptPatterns.filter(function (re) { return !re.test(tpl); });
  ok('FINANCIAL-INVARIANCE', 'Financial-flow / cash / capital-recovery display sites still use the plain (non-basis) formatter',
     missing.length === 0, missing.length ? missing.length + ' expected exempt call sites not found (source moved?)' : String(exemptPatterns.length) + ' sites confirmed');

  /* recurring call sites: must use the basis-aware formatter */
  var recurringPatterns = [
    /reur\(v\)/,                          // Company ARR gridlines
    /reur\(expRes\.months\[selectedMonth\(\)-1\]\.cumulative\.leakage\)/,     // Company "CUMULATIVE HISTORICAL LEAKAGE" (§1: canonical selected-month figure, not the continuous lerpAt it used to read)
    /rn\(d\.closingARR\)/,                // System STOCK
    /rn\(d\.newARR\)/,                    // System FLOW New
    /rn\(d\.expansion\)/,                 // System FLOW Expansion
    /rn\(d\.leakage\)/,                   // System FLOW Leakage
    /reur\(em\.closingARR\)/,             // Company headline
    /reur\(em\.openingARR\)/,             // bridge
    /reur\(em\.closingARR\)/,         // composition
    /reur\(c\.initialARR\)/,              // cohort dossier
    /reur\(snap\.currentARR\)/,
    /reur\(snap\.cumExpansion\)/,
    /reur\(snap\.cumLeakage\)/,
    /yFmt:reur, aria:'one cohort, from acquisition through its recurring-revenue life'/,   // Inspect · cohort life · ARR chart
    /reur\(Math\.abs\(d1\)\)/,          // Inspect · cohort life · distance from the original balance
    /rd\(v\)/,                            // consequence-panel row formatter
    /return rc\(F\.runRate\)/              // Financials · year-end run-rate memo
  ];
  var missingR = recurringPatterns.filter(function (re) { return !re.test(tpl); });
  ok('FINANCIAL-INVARIANCE', 'Recurring-revenue display sites route through the basis-aware formatter',
     missingR.length === 0, missingR.length ? missingR.length + ' expected recurring call sites not found (source moved?)' : String(recurringPatterns.length) + ' sites confirmed');

  /* the toggle must exist and must not be wired to reset/recompute engine state */
  var setBasisMatch = tpl.match(/function setBasis\(b\)\{[\s\S]*?\n  \}/);
  var setBasisBody = setBasisMatch ? setBasisMatch[0] : '';
  ok('FINANCIAL-INVARIANCE', 'setBasis() never calls E.run / recompute (basis never re-simulates)',
     setBasisBody.length > 0 && !/recompute\(|E\.run\(/.test(setBasisBody),
     setBasisBody ? '' : 'setBasis() not found');
})();

console.log('\nSaaS Physics v1 — MRR/ARR reporting-basis checks\n' + '='.repeat(88));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(88));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
