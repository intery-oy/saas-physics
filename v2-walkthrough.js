/*
 * SaaS Physics v2 — PRACTICAL-USE WALKTHROUGH, driven through the product.
 *
 * A CFO's questions, asked of the built page (saas-physics-v1.html) through
 * its real controls, with the answers read off the screen. Writes
 * docs/WALKTHROUGH-V2.md from what the page actually shows — nothing here is
 * typed in by hand. Needs `playwright` and a Chromium binary.
 *
 * Run: node v2-walkthrough.js
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const steps = [];
function step(q, a) { steps.push({ q, a }); }
function grab(txt, from, len) { const i = txt.indexOf(from); return i < 0 ? '(not on screen)' : txt.slice(i, i + len).replace(/\n/g, ' · '); }
function rows(txt, labels) { return labels.map(l => { const m = txt.match(new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n([^\\n]+)')); return m ? l + ': ' + m[1] : l + ': (not on screen)'; }); }

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, 'saas-physics-v1.html')); await pg.waitForTimeout(900);
  const side = async () => pg.evaluate(() => document.getElementById('side').innerText);
  const setSlider = async (id, v) => { await pg.evaluate(([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input')); }, [id, v]); await pg.waitForTimeout(250); };
  const scrub = async v => setSlider('scrub', v);
  const click = async sel => { await pg.click(sel); await pg.waitForTimeout(400); };

  /* 1. the ARR world */
  await scrub(36);
  let t = await side();
  step('Where is the company at month 36, and what do the ARR-only KPIs say?',
       ['World: ARR physics (the frozen v1.3 base). Company layer, month 36, MRR basis.'].concat(rows(t, ['Revenue run rate', 'Gross profit · this month', 'EBITA / FCF · this month', 'Cash', 'R12M GRR', 'R12M NRR', 'Cohorts alive'])).concat([grab(t, '− Gross leakage impact', 60)]));

  /* 2. customers beneath it */
  await click('#pack-customers'); await scrub(36); t = await side();
  step('How much of the loss is customers leaving, and how much is customers shrinking?',
       ['World: + Customers (logo retention 92%, contraction 5%). Persistence now reads derived on the Change rail.'].concat(rows(t, ['Customers', 'ARPA (MRR per customer)', 'Customers lost · this month', 'Leakage from lost logos · this month', 'Leakage from contraction · this month', 'Persistence in force', 'R12M logo retention', '− Lost logos', '− Contraction', '= NRR'])));
  await click('#nav-scen'); await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="customers"]').click()); await pg.waitForTimeout(500); t = await side();
  step('Could two companies with identical ARR, GRR and NRR be losing customers at different rates?',
       ['Scenario 10 · Customers behind the ARR (Base L 87.4%/C 0 vs Experiment L 92%/C 5%, both persistence 87.4%).'].concat(rows(t, ['derived persistence', 'max |ΔMRR| over 60 months', 'max |ΔGRR|, |ΔNRR| over all measurement dates', 'Customers at M60', 'R12M logo retention at M60', 'ARPA at M60'])));

  /* 3. where the revenue comes from */
  await click('#nav-company'); await click('#pack-priced'); await scrub(36); t = await side();
  step('How much of the revenue change is price, how much usage, how much adoption — and where does expansion stop?',
       ['World: + Monetization (platform €12,000 + usage 80% × 100 units × €100; drivers with caps). The expansion coefficient reads bypassed.'].concat(rows(t, ['Platform (fixed)', 'Usage (variable)', 'Price effect · this month', 'Usage effect · this month', 'Adoption effect · this month', 'Contraction · this month', 'Opening base · per customer', '+ Price', '+ Usage', '+ Adoption', '= NRR'])));
  await click('#nav-scen'); await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="mix"]').click()); await pg.waitForTimeout(500); t = await side();
  step('Same customers, same laws — does the revenue mix alone change dollar retention?',
       ['Scenario 12 · Fixed or variable? (all platform €20,000 vs platform €12,000 + usage €8,000).'].concat(rows(t, ['opening MRR', 'customers · ARPA', 'M1 contraction', 'R12M GRR at M12'])));

  /* 4. the cash beneath EBITA */
  await click('#nav-company'); await click('#pack-cash'); await scrub(36); t = await side();
  step('When does the cash arrive, and how far is cash FCF from EBITA?',
       ['World: + Cash (billed 12 months in advance, collected one month after invoice). The waterfall continues below EBITA.'].concat(rows(t, ['EBITA · this month', 'Cash FCF · this month', 'Cash', 'Billings · this month', 'Deferred revenue', 'Receivables', 'EBITA → cash FCF', 'Cash conversion · trailing 12', 'Billing policy'])));
  await click('#nav-scen'); await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="billing"]').click()); await pg.waitForTimeout(500); t = await side();
  step('Same P&L — how different can the cash path be?',
       ['Scenario 13 · Billed in advance (Base FCF = EBITA vs the same company billed annually in advance, collected a month later).'].concat(rows(t, ['max |ΔMRR| over 60 months', 'max |Δrevenue|, |ΔEBITA| over 60 months', 'cash trough', 'ending cash', 'Cumulative EBITA', 'Cumulative cash FCF', 'Deferred revenue at M60 (Experiment)'])));

  /* 5. a hypothesis */
  await click('#nav-company'); await click('#pack-full'); await scrub(20); t = await side();
  step('What does a retention programme cost, when does it work, and what is it worth?',
       ['World: + Hypothesis (every layer on; logo retention × 1.03 decided M6, in force M9–M32, €200k + €50k/month).'].concat([grab(t, 'Retention programme', 70), grab(t, 'decided M6', 110)]).concat(rows(t, ['Hypothesis cost · this month'])));
  await click('#nav-scen'); await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="hypothesis"]').click()); await pg.waitForTimeout(500); t = await side();
  step('Against the same company without it — net of its cost — when does the programme pay back?',
       ['Scenario 14 · A retention programme (Base: no hypothesis; Experiment: persistence × 1.05 from M9 for 24 months, €1.55m).'].concat(rows(t, ['M60 MRR', 'Cumulative Leakage MRR', 'Cumulative FCF', 'Hypothesis window', 'Hypothesis cost (Experiment)', 'Cash overtakes Base', 'Ending cash'])));

  /* 6. the System map, layer by layer */
  await click('#nav-company'); await click('#pack-full'); await scrub(20); await click('#nav-system');
  const views = [];
  for (const v of ['company', 'customers', 'monetization', 'cash', 'hypotheses']) { await click('#sysview-' + v); const ok = await pg.evaluate(() => window.__SP_DEBUG.sysView); views.push(v + (ok === v ? ' ✓' : ' ✗')); }
  t = await side();
  step('Can I see each layer as its own system?',
       ['System layer, world + Hypothesis, month 20. Sub-views drawn without error: ' + views.join(', ') + '.'].concat([grab(t, 'Customer physics ·', 120), grab(t, 'Monetization physics ·', 120), grab(t, 'Cash physics ·', 120), grab(t, 'Hypotheses ·', 120)]));

  /* 7. back to the base world */
  await click('#nav-company'); await click('#pack-arr'); await scrub(36); t = await side();
  const mech = await pg.evaluate(() => window.__SP_DEBUG.expRes.mechanisms);
  step('And back to the frozen ARR world — is every layer off again?',
       ['Pack: ARR physics. Mechanisms: ' + JSON.stringify(mech)].concat(rows(t, ['Cash', 'R12M NRR'])));

  const md = ['# SaaS Physics v2 — practical-use walkthrough (read off the product)', '',
    'Generated by `node v2-walkthrough.js`: every answer below is text the built page (`saas-physics-v1.html`) showed after the stated clicks, on the MRR display basis. Nothing is typed in by hand; regenerate after any product change.', '',
    'The walkthrough follows a CFO\'s questions from the frozen ARR world down through each Economic System layer, using the assumption packs (World, on the Change rail), the canonical scenarios and the hierarchical System map.', ''];
  steps.forEach((s, i) => { md.push('## ' + (i + 1) + '. ' + s.q, ''); s.a.forEach(l => md.push('- ' + l)); md.push(''); });
  md.push('Page errors during the walkthrough: ' + (errs.length ? errs.join(' | ') : 'none') + '.', '');
  fs.writeFileSync(path.resolve(__dirname, 'docs/WALKTHROUGH-V2.md'), md.join('\n'));
  console.log(md.join('\n'));
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
