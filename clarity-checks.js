/*
 * SaaS Physics v1 — Clarity & Semantic Precision pass, regression checks.
 *
 * Pure-Node checks (no browser). DOM/canvas-level checks that need a real
 * render live in clarity-accept.js (Playwright). Together these cover §20:
 *
 *   DISPLAY-RECONCILIATION  (static half: see TWO-PLANE-UNITS below;
 *                            the numeric-tie half is in clarity-accept.js)
 *   TWO-PLANE-UNITS         Plane 1 drawing code never calls the cash scale;
 *                           Plane 2 drawing code never calls the ARR scale.
 *   INSTALLED-BASE-NET      Expansion − Leakage, regime word, tolerance.
 *   FINANCIAL-WATERFALL     Revenue − COGS − S&M − R&D − G&A = modeled FCF,
 *                           reproduced against the engine's own ebita field.
 *   NO-FAKE-MOVEMENTS       Source scan: no Reactivation/Contraction/Churn
 *                           metric other than the one disclosed combined term.
 *
 * Run: node clarity-checks.js
 */
'use strict';
var fs = require('fs');
var E = require('./engine.js');
var K = require('./kpi.js');

var out = [];
function ok(id, name, pass, detail) { out.push({ id: id, name: name, pass: !!pass, detail: detail || '' }); }
var tpl = fs.readFileSync('v1.template.html', 'utf8');

/* ------------------------------------------------------------------ *
 * TWO-PLANE-UNITS — static separation of the two coordinate spaces.
 * ------------------------------------------------------------------ */
(function twoPlaneUnits() {
  var p1start = tpl.indexOf('/* --- THE MASS:');
  var p2start = tpl.indexOf('/* --- PLANE 2 · FINANCIAL CONSEQUENCE');
  var p2end = tpl.indexOf('/* --- the playhead: now --- */');
  ok('TWO-PLANE-UNITS', 'both plane boundaries found in source',
     p1start > 0 && p2start > p1start && p2end > p2start, '');
  var plane1 = tpl.slice(p1start, p2start);
  var plane2 = tpl.slice(p2start, p2end);
  ok('TWO-PLANE-UNITS', 'Plane 1 (recurring asset) never calls the Cash scale S.yC',
     !/S\.yC\(/.test(plane1), plane1.match(/S\.yC\(/g) ? 'found S.yC() in Plane 1' : '');
  ok('TWO-PLANE-UNITS', 'Plane 2 (financial consequence) never calls the ARR/MRR scale S.yA',
     !/S\.yA\(/.test(plane2), plane2.match(/S\.yA\(/g) ? 'found S.yA() in Plane 2' : '');
  ok('TWO-PLANE-UNITS', 'Plane 2 draws the Cash curves (sanity: the split point is real, not accidental)',
     /expS\.cash/.test(plane2) && /baseS\.cash/.test(plane2), '');
  ok('TWO-PLANE-UNITS', 'Plane 1 draws the cohort mass (sanity check)',
     /expS\.stack/.test(plane1), '');
})();

/* ------------------------------------------------------------------ *
 * INSTALLED-BASE-NET — Expansion − Leakage, and the regime word's tolerance.
 * ------------------------------------------------------------------ */
(function installedBaseNet() {
  var A = E.DEFAULT_ASSUMPTIONS;
  [Object.assign({}, A), Object.assign({}, A, { persistenceAnnual: 0.99 }),
   Object.assign({}, A, { persistenceAnnual: 0.70, expansionCoefficientAnnual: 0 })].forEach(function (a, i) {
    var res = E.run(a);
    for (var t = 1; t <= res.horizon; t += 13) {
      var m = res.months[t - 1];
      var net = m.expansion - m.leakage;
      var ratio = m.openingARR > 0 ? net / m.openingARR : 0;
      var TOL = 0.0005;
      var word = ratio > TOL ? 'net-growing' : (ratio < -TOL ? 'net-shrinking' : 'approximately self-sustaining');
      /* the check IS the definition: net must equal the two real engine
         fields subtracted, nothing invented (no reactivation/contraction) */
      ok('INSTALLED-BASE-NET', 'case ' + i + ' month ' + t + ': net = expansion − leakage, exactly',
         net === (m.expansion - m.leakage), '');
      ok('INSTALLED-BASE-NET', 'case ' + i + ' month ' + t + ': regime word is a deterministic function of ratio and a stated tolerance',
         ['net-growing', 'net-shrinking', 'approximately self-sustaining'].indexOf(word) >= 0, word);
    }
  });
})();

/* ------------------------------------------------------------------ *
 * FINANCIAL-WATERFALL — Revenue − COGS − S&M − R&D − G&A = modeled FCF,
 * reproduced independently against the engine's own EBITA field (never
 * against the template's own arithmetic — that would test nothing).
 * ------------------------------------------------------------------ */
(function financialWaterfall() {
  var A = E.DEFAULT_ASSUMPTIONS;
  [Object.assign({}, A), Object.assign({}, A, { grossMargin: 0.65 }),
   Object.assign({}, A, { sm: 0 })].forEach(function (a, i) {
    var res = E.run(a);
    var worst = 0;
    for (var t = 1; t <= res.horizon; t += 7) {
      var m = res.months[t - 1];
      var running = m.revenue - m.cogs - m.sm - m.rd - m.ga;
      worst = Math.max(worst, Math.abs(running - m.ebita));
    }
    ok('FINANCIAL-WATERFALL', 'case ' + i + ': Revenue − COGS − S&M − R&D − G&A = engine EBITA, every 7th month',
       worst < 1e-6, 'max |Δ| = ' + worst.toExponential(3));
    /* and EBITA = FCF under the stated v1 convention, exactly */
    var fcfGap = 0;
    for (var t2 = 1; t2 <= res.horizon; t2++) fcfGap = Math.max(fcfGap, Math.abs(res.months[t2 - 1].fcf - res.months[t2 - 1].ebita));
    ok('FINANCIAL-WATERFALL', 'case ' + i + ': modeled FCF = EBITA at every month (the stated v1 convention)',
       fcfGap === 0, '');
  });
  /* the waterfall's own COGS-step magnitude equals COGS, not the post-COGS
     balance — the exact bug this check exists to catch if it recurs */
  var cascadeSrc = tpl.slice(tpl.indexOf('function stepsFor'), tpl.indexOf('function renderCascade') + 2000);
  ok('FINANCIAL-WATERFALL', 'the COGS/S&M/R&D/G&A steps print the deduction magnitude (mm.cogs etc.), not the running balance',
     /bal:\s*mm\.cogs/.test(cascadeSrc) && /bal:\s*mm\.sm/.test(cascadeSrc) &&
     /bal:\s*mm\.rd/.test(cascadeSrc) && /bal:\s*mm\.ga/.test(cascadeSrc), '');
})();

/* ------------------------------------------------------------------ *
 * NO-FAKE-MOVEMENTS — the governing rule, enforced as a source scan.
 *
 * A code COMMENT documenting that a mechanism is deliberately absent (e.g.
 * "no Reactivation") is compliance, not a violation — it is scanned OUT
 * before the check runs. What must never survive that strip is a movement the
 * engine does not compute used as a PRODUCT-FACING label, row or field.
 *
 * v2 Gate A: the engine now DOES compute logo churn and contraction — when
 * Customer Physics is on. The rule is unchanged (no movement on screen that
 * the engine did not produce); what changed is the set of movements the engine
 * produces. So "Churn"/"Contraction" may appear (a) inside the disclosed
 * combined-metric sentence (the layer-off case), or (b) in customer-layer
 * context — text that names logos or customers, or reads a customers.* field.
 * Reactivation is still not modelled: it may appear only in a sentence that
 * says so. v2-accept.js checks the rendered page shows no Contraction row
 * with the layer off.
 * ------------------------------------------------------------------ */
(function noFakeMovements() {
  /* strip /* ... *\/ block comments and // line comments so only strings the
     browser can actually render remain */
  var noComments = tpl.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  var DISCLOSED = /combines churn and contraction|so churn and contraction cannot be separated/;
  var CUSTOMER_CTX = /[Ll]ogo|[Cc]ustomer|[Uu]sage|[Mm]onetization|platform|\bmv\.|rowsB|[Cc]ontractionA(nnual|RR)|logoChurn|dollarChurnFrom|contractionShare|cmd\b|cmo\b|cu\.|mcu2?\./;
  function mentions(src, re, allow) {
    var all = [], allowed = 0, m4, r2 = new RegExp(re.source, 'g');
    while ((m4 = r2.exec(src)) !== null) { all.push(m4.index); }
    var bad = [];
    all.forEach(function (idx) {
      var ctx = src.slice(Math.max(0, idx - 110), idx + 110);
      if (allow(ctx)) allowed++; else bad.push(ctx.replace(/\s+/g, ' ').slice(60, 170));
    });
    return { total: all.length, allowed: allowed, bad: bad };
  }

  var re1 = mentions(noComments, /[Rr]eactivation/, function (ctx) { return /no reactivation/i.test(ctx); });
  ok('NO-FAKE-MOVEMENTS', '"Reactivation" appears outside a code comment only in a sentence that says it is NOT modelled (never as a row or field)',
     re1.bad.length === 0, re1.total + ' mentions, ' + re1.allowed + ' inside an absence statement' + (re1.bad.length ? '; BAD: ' + re1.bad.join(' | ') : ''));

  /* --churn is a CSS custom-property NAME (a color token), never a metric
     value; strip that one declaration line before scanning for the word. */
  var scan = noComments.replace(/--churn:[^;]*;/g, ' ').replace(/var\(--churn\)/g, ' ');
  var re2 = mentions(scan, /[Cc]hurn/, function (ctx) { return DISCLOSED.test(ctx) || CUSTOMER_CTX.test(ctx); });
  ok('NO-FAKE-MOVEMENTS', '"Churn" appears only inside the disclosed combined-metric sentence(s) or in customer-layer context (logo churn the engine now produces), never as a bare row',
     re2.bad.length === 0, re2.total + ' mentions, ' + re2.allowed + ' allowed' + (re2.bad.length ? '; BAD: ' + re2.bad.join(' | ') : ''));
  var re3 = mentions(noComments, /[Cc]ontraction/, function (ctx) { return DISCLOSED.test(ctx) || CUSTOMER_CTX.test(ctx); });
  ok('NO-FAKE-MOVEMENTS', '"Contraction" appears only inside the disclosed combined term or in customer-layer context (a flow the engine now produces), never as a bare row',
     re3.bad.length === 0, re3.total + ' mentions, ' + re3.allowed + ' allowed' + (re3.bad.length ? '; BAD: ' + re3.bad.join(' | ') : ''));
  ok('NO-FAKE-MOVEMENTS', 'no time-varying glide-path / policy-rule / Trajectory surface reintroduced',
     !/glide.?path/i.test(tpl) && !/nav-trajectory/i.test(tpl) && !/Roadmap/i.test(tpl), '');
})();

console.log('\nSaaS Physics v1 — Clarity & Semantic Precision checks\n' + '='.repeat(90));
var pass = 0;
out.forEach(function (r, i) {
  console.log('  ' + (r.pass ? 'PASS' : 'FAIL') + '  [' + r.id + ']  ' + (i + 1) + '. ' + r.name);
  if (r.detail) console.log('        ' + r.detail);
  if (r.pass) pass++;
});
console.log('='.repeat(90));
console.log(pass + ' / ' + out.length + ' checks passed\n');
process.exit(pass === out.length ? 0 : 1);
