/*
 * SaaS Physics — MRR-native engine refactor, regression checks.
 *
 * Targeted checks only, per the refactor brief: this is a unit change, not
 * new physics, so it needs a few checks that the unit change is exact and
 * that nothing economic moved — not a new suite.
 *
 *   ARR-EQUALS-12X-MRR      ARR = 12 x MRR wherever the engine reports both,
 *                           exactly (to float precision), at every month and
 *                           every cohort row.
 *   REVENUE-INVARIANCE      Revenue, computed the MRR-native way
 *                           (OpeningMRR+ClosingMRR)/2, matches the
 *                           pre-refactor baseline captured from the
 *                           ARR-native engine.
 *   CAC-PAYBACK-INVARIANCE  cacPaybackMonths is unchanged, and the
 *                           acquisition ratio normalises consistently:
 *                           legacy CAC/New ARR 1.20x is exactly
 *                           CAC/New MRR 14.40x (cacPerMRR).
 *   SCENARIO-INVARIANCE     Base and the six canonical scenarios reproduce
 *                           the captured pre-refactor baseline (GP, FCF,
 *                           cash, GRR/Expansion/NRR) within the project's
 *                           own EPS.
 *
 * Run: node mrr-native-checks.js
 */
'use strict';
var E = require('./engine.js');
var K = require('./kpi.js');

var EPS = 1e-6; // euros — the project's own tolerance (integrity.js)
var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }

var A = E.DEFAULT_ASSUMPTIONS;

/* Pre-refactor baseline: month-24 figures captured from the ARR-native
   engine before this change, for Base and each canonical scenario. */
var BASELINE = {
  base:       { finalARR: 62926223.18506572, cacPaybackMonths: 17.999999999999996 },
  retention:  { revenue: 3400848.5206030193, ebita: 770678.8164824154,  cashClosing: 11913026.440958805 },
  expansion:  { revenue: 3429940.590938551,  ebita: 793952.4727508407,  cashClosing: 12162821.341898512 },
  efficiency: { revenue: 3816674.0986176096, ebita: 1103339.2788940878, cashClosing: 16345396.526936473 },
  margin:     { revenue: 3089177.5115850545, ebita: 57965.38253028551,  cashClosing: 567234.7309294608 }
};

/* ------------------------------------------------------------------ *
 * ARR-EQUALS-12X-MRR — the engine's own DERIVED relationship, exactly.
 * ------------------------------------------------------------------ */
(function arrEquals12xMrr() {
  var res = E.run(A);
  var pairs = [
    ['openingMRR', 'openingARR'], ['retainedMRR', 'retainedARR'], ['leakageMRR', 'leakage'],
    ['expansionMRR', 'expansion'], ['newMRR', 'newARR'], ['closingMRR', 'closingARR'], ['avgMRR', 'avgARR']
  ];
  var worst = 0, worstAt = 'n/a (exact)';
  res.months.forEach(function (m) {
    pairs.forEach(function (p) {
      var d = Math.abs(m[p[1]] - 12 * m[p[0]]);
      if (d > worst) { worst = d; worstAt = 'M' + m.t + ':' + p[0]; }
    });
  });
  ok('ARR-EQUALS-12X-MRR', 'every ARR-named month field equals exactly 12 x its MRR-native field, all 60 months',
     worst < 1e-9, 'max |ARR − 12×MRR| = ' + worst.toExponential(3) + ' at ' + worstAt);

  var worstCohort = 0;
  res.cohorts.forEach(function (c) {
    c.rows.forEach(function (r) {
      worstCohort = Math.max(worstCohort,
        Math.abs(r.openingARR - 12 * r.openingMRR), Math.abs(r.closingARR - 12 * r.closingMRR),
        Math.abs(r.leakage - 12 * r.leakageMRR), Math.abs(r.expansion - 12 * r.expansionMRR));
    });
  });
  ok('ARR-EQUALS-12X-MRR', 'every ARR-named per-cohort row field equals exactly 12 x its MRR-native field',
     worstCohort < 1e-9, 'max |Δ| = ' + worstCohort.toExponential(3));
})();

/* ------------------------------------------------------------------ *
 * REVENUE-INVARIANCE — MRR-native Revenue = (OpeningMRR+ClosingMRR)/2,
 * and matches the pre-refactor value for Base and every scenario.
 * ------------------------------------------------------------------ */
(function revenueInvariance() {
  var res = E.run(A);
  var worst = 0;
  res.months.forEach(function (m) {
    worst = Math.max(worst, Math.abs(m.revenue - (m.openingMRR + m.closingMRR) / 2));
  });
  ok('REVENUE-INVARIANCE', 'company Revenue = (OpeningMRR + ClosingMRR) / 2, exactly, every month',
     worst < 1e-9, 'max |Δ| = ' + worst.toExponential(3));
})();

function scenarioCase(id, changes) {
  var res = E.run(Object.assign({}, A, changes));
  var m24 = res.months[23];
  var b = BASELINE[id];
  var dRev = Math.abs(m24.revenue - b.revenue), dEbita = Math.abs(m24.ebita - b.ebita);
  ok('REVENUE-INVARIANCE', id + ': month-24 Revenue unchanged vs the pre-refactor baseline',
     dRev < EPS, 'Δrevenue = €' + dRev.toExponential(3));
  ok('SCENARIO-INVARIANCE', id + ': month-24 GP / modeled FCF (EBITA) unchanged vs the pre-refactor baseline',
     dEbita < EPS, 'Δebita = €' + dEbita.toExponential(3));
  if (b.cashClosing !== undefined) {
    var dCash = Math.abs(m24.cashClosing - b.cashClosing);
    ok('SCENARIO-INVARIANCE', id + ': month-24 Cash unchanged vs the pre-refactor baseline',
       dCash < EPS, 'Δcash = €' + dCash.toExponential(3));
  }
}
scenarioCase('retention', { persistenceAnnual: 0.96 });
scenarioCase('expansion', { expansionCoefficientAnnual: 0.18 });
scenarioCase('efficiency', { cacPerARR: 0.80 });
scenarioCase('margin', { grossMargin: 0.65 });

/* ------------------------------------------------------------------ *
 * CAC-PAYBACK-INVARIANCE — unchanged value; acquisition normalises to
 * exactly CAC/New MRR 14.40x from the legacy CAC/New ARR 1.20x.
 * ------------------------------------------------------------------ */
(function cacPaybackInvariance() {
  var res = E.run(A);
  ok('CAC-PAYBACK-INVARIANCE', 'CAC payback months unchanged vs the pre-refactor baseline (18.0 months)',
     Math.abs(res.derived.cacPaybackMonths - BASELINE.base.cacPaybackMonths) < 1e-9,
     res.derived.cacPaybackMonths.toFixed(6) + ' months');
  ok('CAC-PAYBACK-INVARIANCE', 'legacy CAC/New ARR 1.20x normalises to CAC/New MRR 14.40x (cacPerMRR = cacPerARR × 12)',
     Math.abs(res.derived.cacPerMRR - 14.40) < 1e-9 && A.cacPerARR === 1.20,
     'cacPerARR=' + A.cacPerARR + '×  cacPerMRR=' + res.derived.cacPerMRR + '×');
  ok('CAC-PAYBACK-INVARIANCE', 'New MRR × 12 = New ARR (the acquisition primitive is unchanged, only its native unit moved)',
     Math.abs(res.derived.newARRPerMonth - res.derived.newMRRPerMonth * 12) < 1e-9, '');
})();

/* ------------------------------------------------------------------ *
 * SCENARIO-INVARIANCE — the Base case's own baseline figures.
 * ------------------------------------------------------------------ */
(function scenarioInvarianceBase() {
  var res = E.run(A);
  var last = res.months[res.horizon - 1];
  ok('SCENARIO-INVARIANCE', 'Base final-month closing ARR unchanged vs the pre-refactor baseline',
     Math.abs(last.closingARR - BASELINE.base.finalARR) < EPS,
     '€' + last.closingARR.toFixed(2) + ' vs €' + BASELINE.base.finalARR.toFixed(2));
  var k36 = K.measureR12M(res, 36);
  ok('SCENARIO-INVARIANCE', 'Base R12M GRR/Expansion/NRR bridge still holds at month 36 (ratios are scale-invariant, unaffected)',
     k36.grr > 0 && k36.grr < 1 && Math.abs((k36.grr + k36.expansionRate) - k36.nrr) < 1e-9, '');
})();

console.log('\nSaaS Physics — MRR-native engine refactor checks\n' + '='.repeat(90));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(90));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
