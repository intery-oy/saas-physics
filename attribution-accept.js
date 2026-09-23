/*
 * SaaS Physics v1 — Integrity + Experiment Attribution pass, DOM/render-level
 * acceptance checks. Complements attribution-checks.js (pure Node). Needs a
 * real Chromium render, so like clarity-accept.js this is NOT dependency-free:
 * requires `playwright` and a Chromium binary. Run: node attribution-accept.js
 */
const { chromium } = require('playwright');

const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + require('path').resolve(__dirname, 'saas-physics-v1.html') + ''); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA'));
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });   /* the opening page: enter the portal */
  await pg.evaluate(() => { window.__SP_DEBUG.useBase('arr'); });   /* these checks read the ARR-physics world; the portal now opens on the Enterprise world */ await pg.waitForTimeout(400);
  /* the Change rail is a drawer and lenses show one at a time: checks click through the DOM and read every lens */
  const jsClick = async sel => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); };
  await pg.evaluate(() => { document.getElementById('side').dataset.reading = 'all'; });
  await pg.waitForTimeout(900);

  /* ---- SCREEN-RECONCILIATION: the fix specifically covers FRACTIONAL tau,
     where the printed Cash used to read the canvas's continuous interpolation
     while the side panel read the snapped month — the exact bug reported. ---- */
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 30.7; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const recon = await pg.evaluate(() => {
    const D = window.__SP_DEBUG;
    const m = D.selectedMonth();
    const canonicalCash = D.expRes.months[m - 1].cashClosing;
    const sideCashText = [...document.querySelectorAll('#side .desc > div')].find(d => /^cash( ·|$)/.test(d.querySelector('.dl').textContent.trim())).querySelector('.dv').textContent;
    return { m, canonicalCash, sideCashText };
  });
  rec('SCREEN-RECONCILIATION: side-panel Cash reads off the canonical selected-month object at fractional tau',
      recon.sideCashText === '€' + (recon.canonicalCash / 1e6).toFixed(2) + 'm',
      'month=' + recon.m + ' canonical=' + recon.canonicalCash + ' shown=' + recon.sideCashText);
  await jsClick('#nav-system'); await pg.waitForTimeout(400);
  const systemRecon = await pg.evaluate(() => {
    const D = window.__SP_DEBUG;
    const m = D.selectedMonth();
    return { canonical: D.expRes.months[m - 1].cashClosing, system: D.SS.stateAt(D.expRes, m).cashClosing };
  });
  rec('SCREEN-RECONCILIATION: System stock Cash === Company canonical Cash at the same fractional tau',
      systemRecon.canonical === systemRecon.system, JSON.stringify(systemRecon));
  await jsClick('#nav-company'); await pg.waitForTimeout(400);
  const waterfallCash = await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('.cascade .crow')];
    const r = rows.find(r => r.querySelector('.cl') && r.querySelector('.cl').textContent === 'Cash balance');
    return r ? r.querySelector('.cv').textContent : null;
  });
  rec('SCREEN-RECONCILIATION: waterfall footer Cash matches the same canonical figure',
      waterfallCash === recon.sideCashText, 'waterfall=' + waterfallCash + ' side=' + recon.sideCashText);

  /* ---- BOUNDARY-DISCLOSURE: only the bounds relevant to what changed ---- */
  await jsClick('#reset'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 1300000; i.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  await jsClick('#nav-compare'); await pg.waitForTimeout(300);
  const smBounds = await pg.evaluate(() => document.getElementById('compare-panel').innerHTML);
  await jsClick('#nav-company'); await pg.waitForTimeout(300);
  rec('BOUNDARY-DISCLOSURE: S&M change discloses the acquisition boundary (#10)', smBounds.includes('cannot say stop'), '');
  rec('BOUNDARY-DISCLOSURE: S&M change does NOT disclose the expansion boundary (#14) — not relevant', !smBounds.includes('no separately modelled marginal cost'), '');

  await jsClick('#reset'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const i = document.getElementById('f-expansionCoefficientAnnual'); i.value = 0.3; i.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  await jsClick('#nav-compare'); await pg.waitForTimeout(300);
  const expBounds = await pg.evaluate(() => document.getElementById('compare-panel').innerHTML);
  await jsClick('#nav-company'); await pg.waitForTimeout(300);
  rec('BOUNDARY-DISCLOSURE: Expansion change discloses the expansion boundary (#14)', expBounds.includes('no separately modelled marginal cost'), '');
  rec('BOUNDARY-DISCLOSURE: Expansion change does NOT disclose the acquisition boundary (#10) — not relevant', !expBounds.includes('cannot say stop'), '');

  /* ---- ATTRIBUTION panel: present for 2+ changed levers, absent for 1 ---- */
  await jsClick('#reset'); await pg.waitForTimeout(300);
  const cmpHTML = async () => { await jsClick('#nav-compare'); await pg.waitForTimeout(300); const h = await pg.evaluate(() => document.getElementById('compare-panel').innerHTML); await jsClick('#nav-company'); await pg.waitForTimeout(300); return h; };
  const oneLever = (await cmpHTML()).includes('What is driving the delta?');
  rec('attribution panel absent with 0 changed levers', !oneLever, '');
  await pg.evaluate(() => { const i = document.getElementById('f-persistenceAnnual'); i.value = 0.96; i.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const afterOne = (await cmpHTML()).includes('What is driving the delta?');
  rec('attribution panel absent with exactly 1 changed lever', !afterOne, '');
  await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 1300000; i.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const afterTwo = (await cmpHTML()).includes('What is driving the delta?');
  rec('attribution panel present with 2 changed levers', afterTwo, '');

  /* ---- ATTRIBUTION-TOTAL, read off the DOM against the debug hook ---- */
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 40; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const attribCheck = await pg.evaluate(() => {
    const D = window.__SP_DEBUG;
    const m = D.selectedMonth();
    const r = D.recurringAttribution(m);
    return { valid: D.attributionValid(), residual: Math.abs(r.total - (r.acquisition + r.installedBase + r.interaction)) };
  });
  rec('ATTRIBUTION-TOTAL: live page recomputation sums exactly, at the DOM\'s own selected month',
      attribCheck.valid && attribCheck.residual < 1e-6, JSON.stringify(attribCheck));

  /* ---- Scenario 6: attribution never shows (0 changed assumptions — only
     state differs), and the page renders without error ---- */
  await jsClick('#reset'); await pg.waitForTimeout(300);
  await jsClick('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => (window.__SP_DEBUG.useBase('ex-history'), document.querySelector('#preset-list .prow[data-id="history"]').click(), document.getElementById('nav-compare').click()));
  await pg.waitForTimeout(400);
  await jsClick('#nav-company'); await pg.waitForTimeout(400);
  const scen6 = await pg.evaluate(() => ({
    hasAttrib: document.getElementById('causal-slot').innerHTML.includes('What is driving the delta?'),
    valid: window.__SP_DEBUG.attributionValid()
  }));
  rec('Scenario 6: no attribution panel shown (0 changed assumptions — only state differs)', !scen6.hasAttrib, '');
  rec('Scenario 6: attributionValid() correctly reports false (state-dependent construction)', scen6.valid === false, '');

  /* ---- no page errors across the whole run ---- */
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));

  let pass = 0;
  P.forEach(([name, ok2, detail]) => { console.log('  ' + (ok2 ? 'PASS' : 'FAIL') + '  ' + name); if (detail) console.log('        ' + detail); if (ok2) pass++; });
  console.log('\n' + pass + ' / ' + P.length + ' attribution-accept checks passed\n');
  await b.close();
  process.exit(pass === P.length ? 0 : 1);
})();
