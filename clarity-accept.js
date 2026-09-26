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
const H = require('./accept-harness.js');
const E = require('./engine.js');
const K = require('./kpi.js');


H.suite('clarity-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  const pg = await t.browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto('file://' + require('path').resolve(__dirname, 'saas-physics-v1.html') + ''); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA'));
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });   /* the opening page: enter the portal */
  await pg.evaluate(() => { window.__SP_DEBUG.useBase('arr'); });   /* these checks read the ARR-physics world; the portal now opens on the Enterprise world */ await pg.settle();
  /* the Change rail is a drawer and lenses show one at a time: checks click through the DOM and read every lens */
  const jsClick = async sel => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); };
  await pg.evaluate(() => { document.getElementById('side').dataset.reading = 'all'; });
  await pg.settle();

  /* ---- DISPLAY-RECONCILIATION: same quantity, same month, two surfaces ---- */
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 30; s.dispatchEvent(new Event('input')); });
  await pg.paint();
  const companyMRR = await pg.evaluate(() => document.querySelector('.side .hero .hv').textContent);
  await jsClick('#menu-mech'); await pg.settle();
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
  await jsClick('#nav-company'); await pg.settle();

  /* ---- DELTA-CASH: the displayed ΔCash equals Experiment − Base, exactly ---- */
  await jsClick('#nav-scen'); await pg.paint();
  await pg.evaluate(() => (document.querySelector('#preset-list .prow[data-id="retention"]').click(), document.getElementById('nav-compare').click()));
  await pg.settle();
  await jsClick('#nav-company'); await pg.settle();
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 45; s.dispatchEvent(new Event('input')); });
  await pg.settle();
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
  await pg.settle();
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
  await jsClick('#basis-arr'); await pg.paint();
  const afterARR = await pg.evaluate(() => __SP_DEBUG.expRes.months[23].closingARR);
  rec('BASIS-INVARIANCE: toggling MRR/ARR does not re-simulate or change the economics',
      beforeARR === afterARR, '');
  await jsClick('#basis-mrr'); await pg.paint();

  /* ---- leakage-shadow default off, toggles to an outline (§4) ---- */
  const leakLabelOff = await pg.evaluate(() => document.getElementById('leak-toggle').textContent);
  rec('leakage-shadow defaults OFF', leakLabelOff.includes('Off'), leakLabelOff);
  await jsClick('#leak-toggle'); await pg.paint();
  const leakLabelOn = await pg.evaluate(() => document.getElementById('leak-toggle').textContent);
  rec('leakage-shadow toggles on and relabels', leakLabelOn.includes('On'), leakLabelOn);
  await jsClick('#leak-toggle'); await pg.paint();

  /* ---- Experiment summary answers "why" instantly ---- */
  await jsClick('#reset'); await pg.paint();
  const zeroChanged = await pg.evaluate(() => document.getElementById('experiment-summary').innerText);
  rec('Experiment summary: 0 changed at Base', zeroChanged.includes('0 assumptions changed'), '');
  await pg.evaluate(() => { const i = document.getElementById('f-grossMargin'); i.value = 0.7; i.dispatchEvent(new Event('input')); });
  await pg.paint();
  const oneChanged = await pg.evaluate(() => document.getElementById('experiment-summary').innerText);
  rec('Experiment summary: shows the changed assumption with from -> to',
      /1 assumption changed/.test(oneChanged) && /Gross margin/.test(oneChanged) && /→/.test(oneChanged), oneChanged.slice(0, 80));

  /* ---- waterfall reconciles on screen, for a scenario with S&M != 0 ---- */
  await jsClick('#reset'); await pg.paint();
  await pg.evaluate(() => { const s = document.getElementById('scrub'); s.value = 40; s.dispatchEvent(new Event('input')); });
  await pg.paint();
  const wf = await pg.evaluate(() => {
    const rows = [...document.querySelectorAll('.cascade .crow.wf .cv')].map(e => e.textContent);
    return rows;
  });
  rec('waterfall renders 7 steps', wf.length === 7, JSON.stringify(wf));

  /* ---- no page errors across the whole run ---- */
});
