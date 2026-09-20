/*
 * SaaS Physics v2 — DOM/render-level acceptance checks for the economic-system
 * layers. Complements v2-checks.js (pure Node). Needs `playwright` and a
 * Chromium binary. Run: node v2-accept.js
 *
 *   A · CONTROLS   the customer controls exist, read null, and drive the engine;
 *                  persistence reads "derived" once the layer is on
 *   A · OBSERVE    the customer block appears only with the layer on and ties to
 *                  the page's own engine object and an independent Node run
 *   A · SCENARIO   Scenario 10 applies, shows the ARR/NRR match and customer rows
 *   A · SYSTEM     the map draws the customer valves and the side panel reads the
 *                  derived persistence; both compare modes render
 *   A · INSPECT    a pinned cohort's dossier shows its customers and the stamped
 *                  ARR-per-logo
 *   NULL           Reset returns the layer to off
 *   no page errors across the whole run
 */
const { chromium } = require('playwright');
const E = require('./engine.js');
const K = require('./kpi.js');

const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', msg => { if (msg.type() === 'error' && !/Failed to load resource|net::ERR/.test(msg.text())) errs.push('console: ' + msg.text()); });
  await pg.goto('file://' + require('path').resolve(__dirname, 'saas-physics-v1.html'));
  await pg.waitForTimeout(900);
  const setSlider = async (id, v) => { await pg.evaluate(([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input')); }, [id, v]); await pg.waitForTimeout(250); };
  const setScrub = async v => setSlider('scrub', v);
  const side = async () => pg.evaluate(() => document.getElementById('side').innerText);

  /* ---- A · CONTROLS ---- */
  const c0 = await pg.evaluate(() => ({
    L: !!document.getElementById('f-logoRetentionAnnual'), C: !!document.getElementById('f-contractionAnnual'), K: !!document.getElementById('f-newLogoARPA'),
    tog: document.getElementById('t-logoRetentionAnnual').textContent, Lv: document.getElementById('v-logoRetentionAnnual').textContent,
    Kv: document.getElementById('v-newLogoARPA').textContent, Pv: document.getElementById('v-persistenceAnnual').textContent,
    Pdis: document.getElementById('f-persistenceAnnual').disabled, A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms,
    group: [...document.querySelectorAll('.fgrp-kind')].map(e => e.textContent)
  }));
  rec('A · CONTROLS: the three customer controls exist in their own "Customer physics" group, read null (logo retention off, ARR per new logo = opening ARPA), and persistence is an ordinary input',
      c0.L && c0.C && c0.K && c0.tog === 'off' && c0.Lv === 'off' && c0.Kv === 'opening ARPA' && c0.Pv === '90.0%' && !c0.Pdis && c0.A.logoRetentionAnnual === null && c0.mech.customerPhysics === false && c0.group.includes('Customer physics'),
      JSON.stringify({ tog: c0.tog, Lv: c0.Lv, Kv: c0.Kv, Pv: c0.Pv, groups: c0.group }));
  await pg.click('#t-logoRetentionAnnual'); await pg.waitForTimeout(300);
  await setSlider('f-contractionAnnual', 0.05);
  const c1 = await pg.evaluate(() => ({
    A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, P: window.__SP_DEBUG.expRes.derived.persistenceAnnualEffective,
    tog: document.getElementById('t-logoRetentionAnnual').textContent, Pv: document.getElementById('v-persistenceAnnual').textContent,
    Pdis: document.getElementById('f-persistenceAnnual').disabled, summary: document.getElementById('experiment-summary').innerText
  }));
  rec('A · CONTROLS: the toggle switches the layer on at 92%; contraction 5% → the run reports customerPhysics on, persistence reads "derived 87.4% = L × (1 − C)" and its slider is disabled',
      c1.A.logoRetentionAnnual === 0.92 && c1.A.contractionAnnual === 0.05 && c1.mech.customerPhysics === true && Math.abs(c1.P - 0.874) < 1e-12 && c1.tog === 'on' && c1.Pv === 'derived 87.4% = L × (1 − C)' && c1.Pdis,
      JSON.stringify({ Pv: c1.Pv, P: c1.P }));
  rec('A · CONTROLS: the Experiment summary names the two changed customer assumptions with from → to',
      /2 assumptions changed/.test(c1.summary) && /Logo retention\s+off → 92\.0%/.test(c1.summary) && /Contraction\s+0\.0% → 5\.0%/.test(c1.summary), c1.summary.replace(/\n/g, ' | ').slice(0, 160));

  /* ---- A · OBSERVE ---- */
  await setScrub(36);
  const obs = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.selectedMonth(); return { m, cu: D.expRes.months[m - 1].customers, txt: document.getElementById('side').innerText }; });
  const indep = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 0.92, contractionAnnual: 0.05 }));
  const im = indep.months[obs.m - 1].customers, icm = K.customerMeasures(indep, obs.m);
  rec('A · OBSERVE: the "Customers beneath the MRR" block is on screen and its customers, ARPA and R12M logo retention tie to an independent Node run',
      obs.txt.includes('CUSTOMERS BENEATH THE MRR') && Math.abs(obs.cu.closing - im.closing) < 1e-6 && obs.txt.includes('Customers\n' + im.closing.toFixed(0)) &&
      obs.txt.includes('R12M logo retention\n' + (icm.logoRetentionR12M * 100).toFixed(1) + '%') && obs.txt.includes('Persistence in force\n87.4% = 92.0% × (1 − 5.0%)'),
      obs.txt.slice(obs.txt.indexOf('CUSTOMERS BENEATH'), obs.txt.indexOf('CUSTOMERS BENEATH') + 200).replace(/\n/g, ' | '));
  const ikpi = K.measureR12M(indep, obs.m);
  rec('A · OBSERVE: the R12M installed-base evolution separates lost logos from contraction, and the two sum to the GRR leakage measureR12M reports',
      obs.txt.includes('− Lost logos\n−' + (icm.dollarChurnFromLogosR12M * 100).toFixed(1) + '%') && obs.txt.includes('− Contraction\n−' + (icm.dollarChurnFromContractionR12M * 100).toFixed(1) + '%') &&
      Math.abs((icm.dollarChurnFromLogosR12M + icm.dollarChurnFromContractionR12M) - (1 - ikpi.grr)) < 1e-9, '');

  /* ---- A · INSPECT: pin a cohort ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await setScrub(24);
  const pinned = await pg.evaluate(() => {
    const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const geoL = 64, geoR = 20, W = r.width; const x = geoL + (23 / 60) * (W - geoL - geoR);
    let hit = null;
    for (let y = 30; y < r.height * 0.6 && hit === null; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); hit = y; }
    }
    return { hit, txt: document.getElementById('side').innerText };
  });
  rec('A · INSPECT: the pinned cohort\'s dossier shows customers now / acquired, ARPA, this month\'s lost-logo and contraction leakage, and the ARR-per-logo stamped at spend',
      pinned.hit !== null && /Customers now\s+[\d.]+ of [\d.]+ acquired/.test(pinned.txt) && /ARPA now/.test(pinned.txt) && /lost logos · .* contraction/.test(pinned.txt) && /Customers acquired\s+[\d.]+ = .* ÷ .* per logo, stamped at spend/.test(pinned.txt),
      pinned.hit === null ? 'no cohort hit' : pinned.txt.slice(pinned.txt.indexOf('Customers now'), pinned.txt.indexOf('Customers now') + 200).replace(/\n/g, ' | '));

  /* ---- A · SYSTEM ---- */
  await pg.click('#nav-system'); await pg.waitForTimeout(500);
  const sys = await pg.evaluate(() => ({ txt: document.getElementById('side').innerText, chips: ['logoRetentionAnnual', 'contractionAnnual'].map(k => !!document.getElementById('chip-' + k)) }));
  rec('A · SYSTEM (absolute): the side panel states the customer layer with its live laws and the derived persistence; the customer law chips exist for the map\'s valves',
      sys.txt.includes('Customer physics · logo retention 92.0%, contraction 5.0%') && sys.txt.includes('87.4% = L × (1 − C)') && sys.chips.every(Boolean), sys.txt.slice(sys.txt.indexOf('Customer physics'), sys.txt.indexOf('Customer physics') + 160).replace(/\n/g, ' | '));
  await pg.click('#cmp-delta'); await pg.waitForTimeout(400);
  const sysD = await pg.evaluate(() => document.getElementById('side').innerText.length);
  await pg.click('#cmp-abs'); await pg.waitForTimeout(300);
  rec('A · SYSTEM (delta): the map and side panel render in delta mode with the layer on', sysD > 500 && errs.length === 0, '');

  /* ---- A · SCENARIO 10 ---- */
  await pg.click('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="customers"]').click()); await pg.waitForTimeout(500);
  const s10 = await pg.evaluate(() => ({ txt: document.getElementById('side').innerText, bA: window.__SP_DEBUG.baseA, xA: window.__SP_DEBUG.expA,
    b: window.__SP_DEBUG.baseRes.months[59].closingARR, x: window.__SP_DEBUG.expRes.months[59].closingARR,
    cb: window.__SP_DEBUG.baseRes.months[59].customers.closing, cx: window.__SP_DEBUG.expRes.months[59].customers.closing }));
  rec('A · SCENARIO 10: both worlds carry the layer (L 87.4%/C 0 vs L 92%/C 5%), M60 ARR identical, customers differ, and the panel shows the match block and the customer consequence rows',
      s10.bA.logoRetentionAnnual === 0.874 && s10.xA.logoRetentionAnnual === 0.92 && Math.abs(s10.b - s10.x) < 1e-6 && Math.abs(s10.cb - s10.cx) > 50 &&
      s10.txt.includes('THE TWO WORLDS AGREE ON EVERYTHING ARR CAN SHOW') && /max \|ΔMRR\| over 60 months\n€0/.test(s10.txt) && s10.txt.includes('Customers at M60') && s10.txt.includes('R12M logo retention at M60\n87.4% → 92.0%') && s10.txt.includes('Cumulative leakage from contraction'),
      s10.txt.slice(0, 200).replace(/\n/g, ' | '));
  rec('A · SCENARIO 10: the boundary discloses the customer layer\'s limits (continuous count, no heterogeneity, flat laws)',
      (await pg.evaluate(() => document.getElementById('side').textContent)).includes('continuous cohort count with one ARPA per cohort'), '');

  /* ---- NULL ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await pg.click('#reset'); await pg.waitForTimeout(300);
  const nul = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-logoRetentionAnnual').textContent,
    Pv: document.getElementById('v-persistenceAnnual').textContent, Pdis: document.getElementById('f-persistenceAnnual').disabled, txt: document.getElementById('side').innerText }));
  await setScrub(36);
  const nulTxt = await side();
  rec('NULL-ON-SCREEN: Reset switches the layer off; persistence is an input again (90.0%, enabled); no customer block, no Contraction or Lost-logos row on screen (NO-FAKE-MOVEMENTS holds with the layer off)',
      nul.A.logoRetentionAnnual === null && nul.mech.customerPhysics === false && nul.tog === 'off' && nul.Pv === '90.0%' && !nul.Pdis && !nulTxt.includes('CUSTOMERS BENEATH') &&
      !nulTxt.includes('− Contraction') && !nulTxt.includes('− Lost logos') && nulTxt.includes('− Gross leakage impact'), '');

  /* ---- B · CONTROLS ---- */
  await pg.click('#t-monetization'); await pg.waitForTimeout(400);
  const b0 = await pg.evaluate(() => ({
    A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-monetization').textContent,
    Lt: document.getElementById('t-logoRetentionAnnual').textContent, Xv: document.getElementById('v-expansionCoefficientAnnual').textContent, Xdis: document.getElementById('f-expansionCoefficientAnnual').disabled,
    Kv: document.getElementById('v-newLogoARPA').textContent, Pv: document.getElementById('v-persistenceAnnual').textContent,
    Uv: document.getElementById('v-monetization.components[1].usageGrowthAnnual').textContent, Udis: document.getElementById('f-monetization.components[1].usageGrowthAnnual').disabled,
    summary: document.getElementById('experiment-summary').innerText, openingARR: window.__SP_DEBUG.expRes.months[0].openingARR
  }));
  rec('B · CONTROLS: the Monetization toggle switches the layer on (and the customer layer it needs); expansion coefficient reads "bypassed" and is disabled, ARR per new logo reads "derived", persistence reads "emergent"; the component sliders enable; opening ARR is derived as €20m',
      b0.A.monetization && b0.A.logoRetentionAnnual === 0.92 && b0.mech.monetization && b0.mech.genericExpansionBypassed && b0.tog === 'on' && b0.Lt === 'on' && b0.Xv === 'bypassed — price + usage + adoption' && b0.Xdis &&
      /^derived/.test(b0.Kv) && /^emergent/.test(b0.Pv) && b0.Uv === '15.0%' && !b0.Udis && b0.openingARR === 20000000,
      JSON.stringify({ Xv: b0.Xv, Kv: b0.Kv, Pv: b0.Pv, Uv: b0.Uv }));
  rec('B · CONTROLS: the Experiment summary names the layer and the customer layer it switched on', /2 assumptions changed/.test(b0.summary) && /Logo retention\s+off → 92\.0%/.test(b0.summary) && /Monetization\s+off → on/.test(b0.summary), b0.summary.replace(/\n/g, ' | '));
  await setSlider('f-monetization.components[1].usageGrowthAnnual', 0.30);
  const b1 = await pg.evaluate(() => ({ u: window.__SP_DEBUG.expA.monetization.components[1].usageGrowthAnnual, summary: document.getElementById('experiment-summary').innerText, base: window.__SP_DEBUG.baseA.monetization }));
  rec('B · CONTROLS: a nested component slider writes the nested key (usage growth 15% → 30%) without mutating Base; against a Base without the layer the whole layer is the change, so the summary keeps "Monetization off → on"',
      b1.u === 0.30 && b1.base === null && /Monetization\s+off → on/.test(b1.summary) && !/Usage growth/.test(b1.summary), b1.summary.replace(/\n/g, ' | '));
  /* nested leaf changes are listed when BOTH worlds carry the layer */
  const leaf = E.compare(E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 0.92, monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 20000 }] } })),
                         E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 0.92, monetization: { components: [{ kind: 'fixed', units: 1, priceAnnual: 20000, priceGrowthAnnual: 0.04 }] } }))).changed;
  rec('B · CONTROLS: with the layer on in both worlds, compare() lists the changed component leaf by its path (monetization.components[0].priceGrowthAnnual 0 → 0.04)',
      leaf.length === 1 && leaf[0].key === 'monetization.components[0].priceGrowthAnnual' && leaf[0].from === 0 && leaf[0].to === 0.04, JSON.stringify(leaf));
  await setSlider('f-monetization.components[1].usageGrowthAnnual', 0.15);

  /* ---- B · OBSERVE ---- */
  await setScrub(36);
  const bo = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.selectedMonth(); return { m, mo: D.expRes.months[m - 1].monetization, txt: document.getElementById('side').innerText }; });
  const indepB = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { logoRetentionAnnual: 0.92, contractionAnnual: 0, monetization: { components: [
    { name: 'platform', kind: 'fixed', units: 1, priceAnnual: 12000, priceGrowthAnnual: 0.03 },
    { name: 'usage', kind: 'variable', penetration: 0.8, units: 100, priceAnnual: 100, priceGrowthAnnual: 0.02, usageGrowthAnnual: 0.15, unitsCap: 300, adoptionAnnual: 0.10, penetrationCap: 0.95 } ] } }));
  const imB = indepB.months[bo.m - 1].monetization, mmB = K.monetizationMeasures(indepB, bo.m);
  const fmtK = v => Math.abs(v) >= 1e6 ? '€' + (v / 1e6).toFixed(2) + 'm' : '€' + Math.round(v / 1e3) + 'k';
  rec('B · OBSERVE: the "Where the MRR comes from" block is on screen; fixed/variable ARR and the three effects tie to an independent Node run; the R12M panel decomposes expansion into price, usage and adoption',
      bo.txt.includes('WHERE THE MRR COMES FROM') && Math.abs(bo.mo.fixedARR - imB.fixedARR) < 1e-6 && Math.abs(bo.mo.usageARR - imB.usageARR) < 1e-6 &&
      bo.txt.includes('Platform (fixed)\n' + fmtK(imB.fixedARR / 12)) && bo.txt.includes('+ Price\n+' + (mmB.priceEffectR12M * 100).toFixed(1) + '%') && bo.txt.includes('+ Usage\n+' + (mmB.usageEffectR12M * 100).toFixed(1) + '%') && bo.txt.includes('+ Adoption\n+' + (mmB.adoptionEffectR12M * 100).toFixed(1) + '%') &&
      bo.txt.includes('Opening MRR derived'),
      bo.txt.slice(bo.txt.indexOf('WHERE THE MRR'), bo.txt.indexOf('WHERE THE MRR') + 260).replace(/\n/g, ' | '));

  /* ---- B · SYSTEM ---- */
  await pg.click('#nav-system'); await pg.waitForTimeout(500);
  const bs = await pg.evaluate(() => document.getElementById('side').innerText);
  rec('B · SYSTEM: the side panel states Monetization on with the three effects and the emergent persistence; the rate sentence no longer quotes a coefficient',
      bs.includes('Monetization physics · on') && bs.includes('price + usage + adoption') && bs.includes('departing customers') && !bs.includes('Expansion is the retained balance ×'), bs.slice(bs.indexOf('Monetization physics'), bs.indexOf('Monetization physics') + 160).replace(/\n/g, ' | '));
  await pg.click('#cmp-delta'); await pg.waitForTimeout(400); await pg.click('#cmp-abs'); await pg.waitForTimeout(300);

  /* ---- B · SCENARIOS 11, 12 ---- */
  await pg.click('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="monetization"]').click()); await pg.waitForTimeout(500);
  const s11 = await pg.evaluate(() => ({ txt: document.getElementById('side').innerText, bm: window.__SP_DEBUG.baseRes.mechanisms, xm: window.__SP_DEBUG.expRes.mechanisms, b0: window.__SP_DEBUG.baseRes.months[0].openingARR, x0: window.__SP_DEBUG.expRes.months[0].openingARR }));
  rec('B · SCENARIO 11: Base is the customer world with a coefficient, Experiment the same customers priced as components (same €20m opening); the panel shows cumulative price/usage/adoption effects, the R12M decomposition and the headroom used',
      !s11.bm.monetization && s11.xm.monetization && s11.b0 === 20000000 && s11.x0 === 20000000 && s11.txt.includes('Cumulative price effect') && /R12M expansion at M60\n[\d.]+% \(coefficient\) → [\d.]+% = [\d.]+% price \+ [\d.]+% usage \+ [\d.]+% adoption/.test(s11.txt) && s11.txt.includes('Opening base headroom used at M60'),
      s11.txt.slice(s11.txt.indexOf('CONSEQUENCE'), s11.txt.indexOf('CONSEQUENCE') + 200).replace(/\n/g, ' | '));
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="mix"]').click()); await pg.waitForTimeout(500);
  const s12 = await pg.evaluate(() => ({ txt: document.getElementById('side').innerText, b: window.__SP_DEBUG.baseRes, x: window.__SP_DEBUG.expRes }));
  const gb12 = await pg.evaluate(() => { const D = window.__SP_DEBUG; return { gb: D.K.measureR12M(D.baseRes, 12).grr, gx: D.K.measureR12M(D.expRes, 12).grr, cb: D.baseRes.months[0].monetization.contractionARR, cx: D.expRes.months[0].monetization.contractionARR, ob: D.baseRes.months[0].openingARR, ox: D.expRes.months[0].openingARR }; });
  rec('B · SCENARIO 12: same opening ARR, customers and laws; contraction €0 in the all-platform Base and > 0 in the mixed Experiment; GRR differs; the match block is on screen',
      gb12.ob === gb12.ox && gb12.cb === 0 && gb12.cx > 0 && Math.abs(gb12.gb - 0.92) < 1e-9 && gb12.gx < gb12.gb - 0.01 && s12.txt.includes('SAME START, DIFFERENT DOLLAR RETENTION') && s12.txt.includes('M1 contraction'),
      'GRR ' + (gb12.gb * 100).toFixed(2) + '% vs ' + (gb12.gx * 100).toFixed(2) + '%');
  rec('B · SCENARIO 12: the boundary discloses the monetization layer\'s limits (one per-customer state, contraction reaches usage only, caps are the only bounds, no price elasticity)',
      (await pg.evaluate(() => document.getElementById('side').textContent)).includes('no price elasticity'), '');

  /* ---- B · NULL ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await pg.click('#reset'); await pg.waitForTimeout(300);
  const bn = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-monetization').textContent, Xv: document.getElementById('v-expansionCoefficientAnnual').textContent, Xdis: document.getElementById('f-expansionCoefficientAnnual').disabled, txt: document.getElementById('side').innerText }));
  rec('B · NULL-ON-SCREEN: Reset switches Monetization off; the expansion coefficient is an input again (10.0%, enabled); no composition block on screen',
      bn.A.monetization === null && !bn.mech.monetization && bn.tog === 'off' && bn.Xv === '10.0%' && !bn.Xdis && !bn.txt.includes('WHERE THE MRR COMES FROM'), '');

  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));

  let pass = 0;
  P.forEach(([name, ok2, detail]) => { console.log('  ' + (ok2 ? 'PASS' : 'FAIL') + '  ' + name); if (detail) console.log('        ' + detail); if (ok2) pass++; });
  console.log('\n' + pass + ' / ' + P.length + ' v2-accept checks passed\n');
  await b.close();
  process.exit(pass === P.length ? 0 : 1);
})();
