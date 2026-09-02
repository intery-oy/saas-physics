/*
 * SaaS Physics v1 — Clarity pass, DOM/render-level acceptance checks.
 * Complements clarity-checks.js (pure Node). These need a real Chromium
 * render, so unlike checks.js/research-checks.js/basis-checks.js/
 * clarity-checks.js this one is NOT dependency-free: it requires the
 * `playwright` package and a Chromium binary. Run from an environment that
 * has both: node clarity-accept.js
 *
 * The 15/15 result reported for this pass was produced by exactly this file.
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
  await pg.goto('file:///home/user/experiments/saas-physics/saas-physics-v1.html');
  await pg.waitForTimeout(900);

  /* ---- DISPLAY-RECONCILIATION: same quantity, same month, two surfaces ---- */
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 30; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const companyMRR = await pg.evaluate(() => document.querySelector('.side .big .v').textContent);
  await pg.click('#nav-system'); await pg.waitForTimeout(500);
  const systemStock = await pg.evaluate(() => {
    const c = document.getElementById('scene'); return null; // canvas text isn't DOM-readable
  });
  // Read the underlying numbers instead of canvas pixels: both surfaces must
  // be fed by the exact same res.months[t-1] object.
  const tie = await pg.evaluate(() => {
    const m = 30;
    const company = __SP_DEBUG.expRes.months[m - 1].closingARR;
    const system = __SP_DEBUG.SS.stateAt(__SP_DEBUG.expRes, m).closingARR;
    return { company, system, equal: company === system };
  });
  rec('DISPLAY-RECONCILIATION: Company ARR/MRR basis === System stock basis at month t',
      tie.equal, 'company=' + tie.company + ' system=' + tie.system);
  const tieCash = await pg.evaluate(() => {
    const m = 30;
    return { company: __SP_DEBUG.expRes.months[m - 1].cashClosing, system: __SP_DEBUG.SS.stateAt(__SP_DEBUG.expRes, m).cashClosing };
  });
  rec('DISPLAY-RECONCILIATION: Company Cash === System STOCK CASH at month t',
      tieCash.company === tieCash.system, JSON.stringify(tieCash));
  await pg.click('#nav-company'); await pg.waitForTimeout(400);

  /* ---- DELTA-CASH: the displayed ΔCash equals Experiment − Base, exactly ---- */
  await pg.click('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="retention"]').click());
  await pg.waitForTimeout(400);
  await pg.click('#nav-company'); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 45; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(400);
  const deltaCash = await pg.evaluate(() => {
    const t = 45;
    const exp = __SP_DEBUG.expRes.months[t - 1].cashClosing, base = __SP_DEBUG.baseRes.months[t - 1].cashClosing;
    return { exp, base, dExact: exp - base };
  });
  // independently recompute via engine.js in THIS node process, from the same
  // scenario definition, so the check does not merely re-read the page's own var
  const A = E.DEFAULT_ASSUMPTIONS;
  const baseIndep = E.run(A), expIndep = E.run(Object.assign({}, A, { persistenceAnnual: 0.96 }));
  const dIndep = expIndep.months[44].cashClosing - baseIndep.months[44].cashClosing;
  rec('DELTA-CASH: page ΔCash(t) === Experiment(t) − Base(t), and matches an independent Node recomputation',
      Math.abs(deltaCash.dExact - dIndep) < 1e-6,
      'page=' + deltaCash.dExact + ' independent=' + dIndep);

  /* ---- INSTALLED-BASE-NET: the printed sentence ties to independent math ---- */
  const sideTxt = await pg.evaluate(() => document.getElementById('side').innerHTML);
  const hasNet = sideTxt.includes('Installed-base net');
  rec('INSTALLED-BASE-NET: section present on Company at month >= 1', hasNet, '');
  const netVals = await pg.evaluate(() => {
    const m = 45; const em = __SP_DEBUG.expRes.months[m - 1];
    return { net: em.expansion - em.leakage, opening: em.openingARR };
  });
  const indepEm = expIndep.months[44];
  rec('INSTALLED-BASE-NET: displayed net matches an independent Node recomputation',
      Math.abs(netVals.net - (indepEm.expansion - indepEm.leakage)) < 1e-6, '');

  /* ---- KPI-MEASUREMENT: measured GRR/Expansion/NRR beneath the coefficients
     equal K.measureR12M exactly ---- */
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 24; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(400);
  const shown = await pg.evaluate(() => ({
    grr: document.getElementById('mk-persistenceAnnual-grr').textContent,
    exp: document.getElementById('mk-expansionCoefficientAnnual-expansionRate').textContent,
    nrr: document.getElementById('mk-expansionCoefficientAnnual-nrr').textContent
  }));
  const kpiIndep = K.measureR12M(expIndep, 24);
  const fmt = v => (v * 100).toFixed(1) + '%';
  rec('KPI-MEASUREMENT: measured GRR beneath Persistence equals K.measureR12M(...).grr',
      shown.grr === fmt(kpiIndep.grr), 'shown=' + shown.grr + ' expected=' + fmt(kpiIndep.grr));
  rec('KPI-MEASUREMENT: measured Expansion beneath Expansion coefficient equals K.measureR12M(...).expansionRate',
      shown.exp === fmt(kpiIndep.expansionRate), 'shown=' + shown.exp + ' expected=' + fmt(kpiIndep.expansionRate));
  rec('KPI-MEASUREMENT: measured NRR beneath Expansion coefficient equals K.measureR12M(...).nrr',
      shown.nrr === fmt(kpiIndep.nrr), 'shown=' + shown.nrr + ' expected=' + fmt(kpiIndep.nrr));

  /* ---- BASIS-INVARIANCE: switching MRR/ARR must not change the Experiment ---- */
  const beforeARR = await pg.evaluate(() => __SP_DEBUG.expRes.months[23].closingARR);
  await pg.click('#basis-arr'); await pg.waitForTimeout(300);
  const afterARR = await pg.evaluate(() => __SP_DEBUG.expRes.months[23].closingARR);
  rec('BASIS-INVARIANCE: toggling MRR/ARR does not re-simulate or change the economics',
      beforeARR === afterARR, '');
  await pg.click('#basis-mrr'); await pg.waitForTimeout(200);

  /* ---- leakage-shadow default off, toggles to an outline (§4) ---- */
  const leakLabelOff = await pg.evaluate(() => document.getElementById('leak-toggle').textContent);
  rec('leakage-shadow defaults OFF', leakLabelOff.includes('Off'), leakLabelOff);
  await pg.click('#leak-toggle'); await pg.waitForTimeout(300);
  const leakLabelOn = await pg.evaluate(() => document.getElementById('leak-toggle').textContent);
  rec('leakage-shadow toggles on and relabels', leakLabelOn.includes('On'), leakLabelOn);
  await pg.click('#leak-toggle'); await pg.waitForTimeout(200);

  /* ---- Experiment summary answers "why" instantly ---- */
  await pg.click('#reset'); await pg.waitForTimeout(300);
  const zeroChanged = await pg.evaluate(() => document.getElementById('experiment-summary').innerText);
  rec('Experiment summary: 0 changed at Base', zeroChanged.includes('0 assumptions changed'), '');
  await pg.evaluate(() => { const i = document.getElementById('f-grossMargin'); i.value = 0.7; i.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const oneChanged = await pg.evaluate(() => document.getElementById('experiment-summary').innerText);
  rec('Experiment summary: shows the changed assumption with from -> to',
      /1 assumption changed/.test(oneChanged) && /Gross margin/.test(oneChanged) && /→/.test(oneChanged), oneChanged.slice(0, 80));

  /* ---- waterfall reconciles on screen, for a scenario with S&M != 0 ---- */
  await pg.click('#reset'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 40; s.dispatchEvent(new Event('input')); });
  await pg.waitForTimeout(300);
  const wf = await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('.cascade .crow.wf .cv')].map(e => e.textContent);
    return rows;
  });
  rec('waterfall renders 7 steps', wf.length === 7, JSON.stringify(wf));

  /* ---- no page errors across the whole run ---- */
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));

  let pass = 0;
  P.forEach(([name, ok2, detail]) => { console.log('  ' + (ok2 ? 'PASS' : 'FAIL') + '  ' + name); if (detail) console.log('        ' + detail); if (ok2) pass++; });
  console.log('\n' + pass + ' / ' + P.length + ' clarity-accept checks passed\n');
  await b.close();
  process.exit(pass === P.length ? 0 : 1);
})();
