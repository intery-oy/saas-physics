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

  /* ---- C · CONTROLS ---- */
  await pg.click('#t-billingTermMonths'); await pg.waitForTimeout(400);
  const c0b = await pg.evaluate(() => ({
    A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-billingTermMonths').textContent, Tv: document.getElementById('v-billingTermMonths').textContent,
    tim: document.getElementById('t-billingTiming').textContent, Dv: document.getElementById('v-collectionDelayMonths').textContent, Ddis: document.getElementById('f-collectionDelayMonths').disabled,
    summary: document.getElementById('experiment-summary').innerText, opening: window.__SP_DEBUG.expRes.derived.cash.openingDeferredRevenue
  }));
  rec('C · CONTROLS: the billing-term toggle switches Cash Physics on at 12 months in advance; the timing button and delay slider enable; the opening book\'s deferred balance is derived (€9.17m); the summary names the change',
      c0b.A.billingTermMonths === 12 && c0b.A.billingTiming === 'advance' && c0b.mech.cashPhysics && c0b.tog === 'on' && c0b.Tv === '12 mo' && c0b.tim === 'advance' && !c0b.Ddis && c0b.Dv === '0 mo' &&
      Math.abs(c0b.opening - 20e6 / 12 * 11 / 2) < 1e-6 && /Billing term\s+off → 12 mo/.test(c0b.summary), JSON.stringify({ Tv: c0b.Tv, tim: c0b.tim, Dv: c0b.Dv }));
  await pg.click('#t-billingTiming'); await pg.waitForTimeout(300);
  await setSlider('f-collectionDelayMonths', 2);
  const c1b = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, tim: document.getElementById('t-billingTiming').textContent, opening: window.__SP_DEBUG.expRes.derived.cash.openingDeferredRevenue, summary: document.getElementById('experiment-summary').innerText }));
  rec('C · CONTROLS: the timing button cycles to arrears (the opening balance becomes a contract asset, −€9.17m) and the delay slider drives the engine; the summary lists all three',
      c1b.A.billingTiming === 'arrears' && c1b.A.collectionDelayMonths === 2 && c1b.tim === 'arrears' && Math.abs(c1b.opening + 20e6 / 12 * 11 / 2) < 1e-6 && /3 assumptions changed/.test(c1b.summary) && /Billing timing\s+in advance → in arrears/.test(c1b.summary) && /Collection delay\s+0 mo → 2 mo/.test(c1b.summary),
      c1b.summary.replace(/\n/g, ' | '));
  await pg.click('#t-billingTiming'); await pg.waitForTimeout(300);
  await setSlider('f-collectionDelayMonths', 1);

  /* ---- C · OBSERVE + WATERFALL ---- */
  await setScrub(36);
  const co = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.selectedMonth(); return { m, c: D.expRes.months[m - 1].cash, fcf: D.expRes.months[m - 1].fcf, ebita: D.expRes.months[m - 1].ebita, txt: document.getElementById('side').innerText,
    wf: [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent), wfv: [...document.querySelectorAll('.cascade .crow.wf .cv')].map(e => e.textContent) }; });
  const indepC = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { billingTermMonths: 12, collectionDelayMonths: 1 }));
  const icC = indepC.months[co.m - 1].cash;
  const fmtC = v => Math.abs(v) >= 1e6 ? '€' + (v / 1e6).toFixed(2) + 'm' : '€' + Math.round(v / 1e3) + 'k';
  rec('C · OBSERVE: the "Cash beneath EBITA" block is on screen; billings, deferred revenue, receivables and cash FCF tie to an independent Node run; EBITA and cash FCF are shown as two rows',
      co.txt.includes('CASH BENEATH EBITA') && Math.abs(co.c.billings - icC.billings) < 1e-6 && Math.abs(co.c.deferredClosing - icC.deferredClosing) < 1e-6 && Math.abs(co.fcf - (icC.collections - icC.cashCosts)) < 1e-6 &&
      co.txt.includes('Deferred revenue\n' + fmtC(icC.deferredClosing)) && co.txt.includes('Receivables\n' + fmtC(icC.receivablesClosing)) && co.txt.includes('EBITA · this month') && co.txt.includes('Cash FCF · this month'),
      co.txt.slice(co.txt.indexOf('CASH BENEATH'), co.txt.indexOf('CASH BENEATH') + 220).replace(/\n/g, ' | '));
  rec('C · WATERFALL: the P&L waterfall continues below EBITA — "= EBITA", "± Δ deferred revenue", "± Δ receivables", "= Cash FCF" (10 steps) — and the printed cash FCF equals the engine\'s fcf',
      co.wf.length === 10 && co.wf[6] === '= EBITA' && /Δ deferred revenue$/.test(co.wf[7]) && /Δ receivables$/.test(co.wf[8]) && co.wf[9] === '= Cash FCF' && co.wfv[9] === fmtC(co.fcf) && Math.abs(co.fcf - co.ebita) > 1000, JSON.stringify(co.wf) + ' ' + co.wfv[9]);

  /* ---- C · INSPECT: a cohort's invoicing ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await setScrub(24);
  const pinC = await pg.evaluate(() => {
    const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const geoL = 64, geoR = 20, W = r.width; const x = geoL + (23 / 60) * (W - geoL - geoR);
    let hit = null;
    for (let y = 30; y < r.height * 0.6 && hit === null; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); hit = y; }
    }
    return { hit, txt: document.getElementById('side').innerText };
  });
  rec('C · INSPECT: the pinned cohort\'s dossier shows what it invoiced this month and its deferred revenue (billed at birth, trued up at renewal)',
      pinC.hit !== null && /Invoiced this month/.test(pinC.txt) && /(Deferred revenue|Unbilled \(contract asset\))\s+€[\d.]+[km]? · billed at birth, trued up at renewal/.test(pinC.txt),
      pinC.hit === null ? 'no cohort hit' : pinC.txt.slice(pinC.txt.indexOf('Invoiced'), pinC.txt.indexOf('Invoiced') + 160).replace(/\n/g, ' | '));
  await pg.evaluate(() => { const cv = document.getElementById('scene'); cv.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

  /* ---- C · SYSTEM ---- */
  await pg.click('#nav-system'); await pg.waitForTimeout(500);
  const cs = await pg.evaluate(() => document.getElementById('side').innerText);
  rec('C · SYSTEM: the side panel states the billing policy, cash FCF vs EBITA this month, and the deferred and receivables balances between the P&L and the cash stock',
      cs.includes('Cash physics · 12-month term in advance, +1 mo to collect') && cs.includes('cash FCF') && cs.includes('deferred revenue') && cs.includes('of receivables'), cs.slice(cs.indexOf('Cash physics'), cs.indexOf('Cash physics') + 200).replace(/\n/g, ' | '));
  await pg.click('#cmp-delta'); await pg.waitForTimeout(400); await pg.click('#cmp-abs'); await pg.waitForTimeout(300);

  /* ---- C · SCENARIO 13 ---- */
  await pg.click('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="billing"]').click()); await pg.waitForTimeout(500);
  const s13 = await pg.evaluate(() => { const D = window.__SP_DEBUG; let wE = 0; for (let t = 0; t < 60; t++) wE = Math.max(wE, Math.abs(D.expRes.months[t].ebita - D.baseRes.months[t].ebita));
    return { txt: document.getElementById('side').innerText, wE, xm: D.expRes.mechanisms, bm: D.baseRes.mechanisms, bc: D.baseRes.months[59].cashClosing, xc: D.expRes.months[59].cashClosing }; });
  rec('C · SCENARIO 13: Base FCF = EBITA, Experiment billed annually in advance and collected a month later; EBITA identical every month, ending cash differs; the match block and the cash rows are on screen',
      !s13.bm.cashPhysics && s13.xm.cashPhysics && s13.wE < 1e-6 && Math.abs(s13.xc - s13.bc) > 1e6 && s13.txt.includes('THE TWO WORLDS AGREE ON EVERYTHING ABOVE THE CASH LINE') && s13.txt.includes('Cumulative cash FCF') && s13.txt.includes('Deferred revenue at M60') && s13.txt.includes('Receivables at M60') && s13.txt.includes('Cumulative EBITA'),
      'M60 cash ' + (s13.bc / 1e6).toFixed(2) + 'm → ' + (s13.xc / 1e6).toFixed(2) + 'm');
  rec('C · SCENARIO 13: the FCF boundary reads the live billing policy', (await pg.evaluate(() => document.getElementById('side').textContent)).includes('billed per the 12-month term in advance and collected 1 months later'), '');

  /* ---- C · NULL ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await pg.click('#reset'); await pg.waitForTimeout(300);
  const cn = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-billingTermMonths').textContent, wf: [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent), txt: document.getElementById('side').innerText }));
  rec('C · NULL-ON-SCREEN: Reset switches Cash Physics off; the waterfall ends at "= Modeled FCF (= EBITA)" (7 steps); no cash block on screen',
      cn.A.billingTermMonths === null && cn.A.collectionDelayMonths === 0 && !cn.mech.cashPhysics && cn.tog === 'off' && cn.wf.length === 7 && cn.wf[6] === '= Modeled FCF (= EBITA)' && !cn.txt.includes('CASH BENEATH EBITA'), JSON.stringify(cn.wf));

  /* ---- D · CONTROLS ---- */
  await pg.click('#t-interventions'); await pg.waitForTimeout(400);
  const d0 = await pg.evaluate(() => ({
    A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-interventions').textContent, Hv: document.getElementById('v-interventions').textContent,
    tgt: document.getElementById('t-interventions[0].target').textContent, Ev: document.getElementById('v-interventions[0].value').textContent, Edis: document.getElementById('f-interventions[0].value').disabled,
    Dv: document.getElementById('v-interventions[0].durationMonths').textContent, Dt: document.getElementById('t-interventions[0].durationMonths').textContent,
    summary: document.getElementById('experiment-summary').innerText, sched: window.__SP_DEBUG.expRes.derived.interventions
  }));
  rec('D · CONTROLS: the Hypothesis toggle switches one costed programme on (persistence × 1.05, decided M6, lag 3, 24 months); the target button, effect, timing and cost sliders enable; the schedule is resolved (in force M9–M32); the summary names it',
      d0.A.interventions.length === 1 && d0.A.interventions[0].target === 'persistenceAnnual' && d0.mech.interventions && d0.tog === 'on' && d0.Hv === '1 active' && d0.tgt === 'persistence' && d0.Ev === '1.05×' && !d0.Edis && d0.Dv === '24 mo' && d0.Dt === 'on' &&
      d0.sched[0].effectiveFrom === 9 && d0.sched[0].effectiveTo === 32 && /Hypothesis\s+off → 1 active/.test(d0.summary), JSON.stringify({ Hv: d0.Hv, tgt: d0.tgt, Ev: d0.Ev, Dv: d0.Dv }));
  await pg.click('[id="t-interventions[0].target"]'); await pg.waitForTimeout(300);
  const d1 = await pg.evaluate(() => ({ t: window.__SP_DEBUG.expA.interventions[0].target, tgt: document.getElementById('t-interventions[0].target').textContent }));
  rec('D · CONTROLS: the target button cycles to the next law that is on (persistence → expansion coefficient, since the customer layer is off)', d1.t === 'expansionCoefficientAnnual' && d1.tgt === 'expansion coefficient', JSON.stringify(d1));
  /* cycle back to persistence */
  for (let i = 0; i < 6; i++) { const t = await pg.evaluate(() => window.__SP_DEBUG.expA.interventions[0].target); if (t === 'persistenceAnnual') break; await pg.click('[id="t-interventions[0].target"]'); await pg.waitForTimeout(150); }
  await pg.click('[id="t-interventions[0].durationMonths"]'); await pg.waitForTimeout(300);
  const d2 = await pg.evaluate(() => ({ d: window.__SP_DEBUG.expA.interventions[0].durationMonths, Dv: document.getElementById('v-interventions[0].durationMonths').textContent, to: window.__SP_DEBUG.expRes.derived.interventions[0].effectiveTo }));
  rec('D · CONTROLS: the duration toggle switches the programme to permanent (null): the schedule runs to the horizon', d2.d === null && d2.Dv === 'off' && d2.to === 60, JSON.stringify(d2));
  await pg.click('[id="t-interventions[0].durationMonths"]'); await pg.waitForTimeout(300);

  /* ---- D · OBSERVE + WATERFALL ---- */
  await setScrub(20);
  const dob = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.selectedMonth(); return { m, iv: D.expRes.months[m - 1].interventions, cost: D.expRes.months[m - 1].interventionCost, txt: document.getElementById('side').innerText,
    wf: [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent), wfv: [...document.querySelectorAll('.cascade .crow.wf .cv')].map(e => e.textContent) }; });
  rec('D · OBSERVE: the "Hypotheses" block shows the programme in force with what it changed (persistence 90.0% → 94.5%), months in force, cost to date, and this month\'s cost',
      dob.txt.includes('HYPOTHESES') && /in force · persistence 90\.0% → 94\.5%/.test(dob.txt) && /12 months in force/.test(dob.txt) && dob.txt.includes('Hypothesis cost · this month\n€50k') && dob.iv.active[0] === 'h1' && dob.cost === 50000,
      dob.txt.slice(dob.txt.indexOf('HYPOTHESES'), dob.txt.indexOf('HYPOTHESES') + 260).replace(/\n/g, ' | '));
  rec('D · WATERFALL: a "− Hypothesis cost" step appears before FCF and prints the engine\'s cost line (€50k)',
      dob.wf.includes('− Hypothesis cost') && dob.wfv[dob.wf.indexOf('− Hypothesis cost')] === '−€50k', JSON.stringify(dob.wf));

  /* ---- D · SYSTEM ---- */
  await pg.click('#nav-system'); await pg.waitForTimeout(500);
  const ds = await pg.evaluate(() => document.getElementById('side').innerText);
  rec('D · SYSTEM: the side panel names the hypothesis in force, the valve it moves (persistence 90.0% → 94.5%) and its cost to date',
      ds.includes('Hypotheses · 1') && /h1 moves persistence 90\.0% → 94\.5%/.test(ds) && ds.includes('cost this month €50k'), ds.slice(ds.indexOf('Hypotheses ·'), ds.indexOf('Hypotheses ·') + 200).replace(/\n/g, ' | '));
  await pg.click('#cmp-delta'); await pg.waitForTimeout(400); await pg.click('#cmp-abs'); await pg.waitForTimeout(300);

  /* ---- D · INSPECT: a cohort's provenance ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await setScrub(24);
  const pinD = await pg.evaluate(() => {
    const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const geoL = 64, geoR = 20, W = r.width; const x = geoL + (23 / 60) * (W - geoL - geoR);
    let hit = null;
    for (let y = 30; y < r.height * 0.6 && hit === null; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); hit = y; }
    }
    return { hit, txt: document.getElementById('side').innerText };
  });
  rec('D · INSPECT: the pinned cohort\'s dossier states the hypotheses in force when its spend was committed', pinD.hit !== null && /Hypotheses at spend\s+h1 · the law this cohort was bought under/.test(pinD.txt),
      pinD.hit === null ? 'no cohort hit' : pinD.txt.slice(pinD.txt.indexOf('Hypotheses at spend'), pinD.txt.indexOf('Hypotheses at spend') + 120).replace(/\n/g, ' | '));
  await pg.evaluate(() => { const cv = document.getElementById('scene'); cv.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

  /* ---- D · SCENARIO 14 ---- */
  await pg.click('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="hypothesis"]').click()); await pg.waitForTimeout(500);
  const s14 = await pg.evaluate(() => { const D = window.__SP_DEBUG; let same = true; for (let t = 0; t < 8; t++) if (D.expRes.months[t].closingARR !== D.baseRes.months[t].closingARR) same = false;
    return { txt: document.getElementById('side').innerText, same, bm: D.baseRes.mechanisms, xm: D.expRes.mechanisms, cost: D.K.interventionMeasures(D.expRes, 60).cumulativeCost }; });
  rec('D · SCENARIO 14: Base has no hypothesis, Experiment the retention programme; months 1–8 identical; the panel shows the window, the cost (€1.55m), the month cash overtakes Base and the boundary',
      !s14.bm.interventions && s14.xm.interventions && s14.same && Math.abs(s14.cost - 1550000) < 1e-6 && s14.txt.includes('Hypothesis window\ndecided M6 · in force M9–M32') && s14.txt.includes('Hypothesis cost (Experiment)\n−€1.55m') && /Cash overtakes Base\nmonth 26/.test(s14.txt),
      s14.txt.slice(s14.txt.indexOf('CONSEQUENCE'), s14.txt.indexOf('CONSEQUENCE') + 220).replace(/\n/g, ' | '));
  rec('D · SCENARIO 14: the boundary states what a hypothesis cannot do', (await pg.evaluate(() => document.getElementById('side').textContent)).includes('cannot switch a layer on or off'), '');

  /* ---- D · NULL ---- */
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await pg.click('#reset'); await pg.waitForTimeout(300);
  const dn = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-interventions').textContent, txt: document.getElementById('side').innerText, wf: [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent) }));
  rec('D · NULL-ON-SCREEN: Reset removes the hypothesis; no Hypotheses block, no cost step', dn.A.interventions.length === 0 && !dn.mech.interventions && dn.tog === 'off' && !dn.txt.includes('HYPOTHESES') && !dn.wf.includes('− Hypothesis cost'), '');

  /* ---- FINAL · rail by layer, restraint, packs, hierarchical map ---- */
  const rail = await pg.evaluate(() => ({ heads: [...document.querySelectorAll('.layerhead .lh-name')].map(e => e.textContent), kinds: [...document.querySelectorAll('#forces .fgrp-kind')].map(e => e.textContent),
    hidden: ['f-collectionDelayMonths', 'f-interventions[0].value', 'f-monetization.components[1].usageGrowthAnnual'].map(id => document.getElementById(id).closest('.force').style.display === 'none') }));
  rec('FINAL · RAIL: the Change surface is grouped by layer in order (ARR physics → Customer → Monetization → Cash → Hypotheses) with a header per layer stating on/off; the financial levers sit inside the ARR layer; a layer that is off shows only its switch',
      rail.heads.length === 5 && /ARR physics/.test(rail.heads[0]) && /Customer physics.*off/.test(rail.heads[1]) && /Monetization physics.*off/.test(rail.heads[2]) && /Cash physics.*off/.test(rail.heads[3]) && /Hypotheses.*off/.test(rail.heads[4]) &&
      rail.kinds.indexOf('Financial levers') < rail.kinds.indexOf('Customer physics') && rail.hidden.every(Boolean), JSON.stringify(rail.heads));
  await pg.click('#pack-full'); await pg.waitForTimeout(500);
  const pk = await pg.evaluate(() => ({ pack: window.__SP_DEBUG.activePack, mech: window.__SP_DEBUG.expRes.mechanisms, bmech: window.__SP_DEBUG.baseRes.mechanisms, summary: document.getElementById('experiment-summary').innerText,
    heads: [...document.querySelectorAll('.layerhead .lh-name')].map(e => e.textContent), shown: document.getElementById('f-collectionDelayMonths').closest('.force').style.display !== 'none' }));
  rec('FINAL · PACKS: "+ Hypothesis" sets Base = Experiment = every layer on with a costed programme (0 assumptions changed); every layer header reads on; the dependent controls appear',
      pk.pack === 'full' && pk.mech.customerPhysics && pk.mech.monetization && pk.mech.cashPhysics && pk.mech.interventions && pk.bmech.interventions && /0 assumptions changed/.test(pk.summary) && pk.heads.every(h => !/off/.test(h)) && pk.shown, JSON.stringify(pk.mech));
  await setSlider('f-sm', 1200000);
  await pg.click('#reset'); await pg.waitForTimeout(400);
  const pk2 = await pg.evaluate(() => ({ pack: window.__SP_DEBUG.activePack, sm: window.__SP_DEBUG.expA.sm, mech: window.__SP_DEBUG.expRes.mechanisms }));
  rec('FINAL · PACKS: Reset returns to the active pack\'s world (S&M back to €900k, every layer still on), not to the v1.3 Base', pk2.pack === 'full' && pk2.sm === 900000 && pk2.mech.cashPhysics && pk2.mech.interventions, JSON.stringify(pk2));
  await pg.click('#nav-system'); await pg.waitForTimeout(400);
  const viewsOK = [];
  for (const v of ['customers', 'monetization', 'cash', 'hypotheses', 'company']) { await pg.click('#sysview-' + v); await pg.waitForTimeout(350); viewsOK.push(await pg.evaluate(() => window.__SP_DEBUG.sysView)); }
  rec('FINAL · SYSTEM MAP: the hierarchical map offers a sub-view per layer that is on; each renders without a page error and the company view returns', viewsOK.join(',') === 'customers,monetization,cash,hypotheses,company' && errs.length === 0, viewsOK.join(','));
  await pg.click('#nav-company'); await pg.waitForTimeout(200);
  await pg.click('#pack-arr'); await pg.waitForTimeout(400);
  const disabled = await pg.evaluate(() => ['customers', 'monetization', 'cash', 'hypotheses'].map(v => document.getElementById('sysview-' + v).disabled));
  rec('FINAL · SYSTEM MAP: with the ARR pack the layer sub-views are disabled (nothing to draw) and the map is the v1.3 company view', disabled.every(Boolean) && (await pg.evaluate(() => window.__SP_DEBUG.sysView)) === 'company', '');

  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));

  let pass = 0;
  P.forEach(([name, ok2, detail]) => { console.log('  ' + (ok2 ? 'PASS' : 'FAIL') + '  ' + name); if (detail) console.log('        ' + detail); if (ok2) pass++; });
  console.log('\n' + pass + ' / ' + P.length + ' v2-accept checks passed\n');
  await b.close();
  process.exit(pass === P.length ? 0 : 1);
})();
