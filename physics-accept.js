/*
 * SaaS Physics v1.1–v1.3 — DOM/render-level acceptance checks for the physics
 * extension. Complements physics-checks.js (pure Node). Needs `playwright` and
 * a Chromium binary. Run: node physics-accept.js
 *
 *   CONTROLS         the three new controls exist, read their null state, and
 *                    drive the engine (page assumption === engine assumption)
 *   OBSERVE          expansion-cost row, pending row, average/marginal payback
 *                    appear only when the mechanism is on; figures tie to the
 *                    page's own engine object
 *   WATERFALL        the expansion-cost step appears only when the line exists
 *   SCENARIOS 7–9    each applies, renders its consequence rows, and 7 shows
 *                    the ARR/NRR match on screen
 *   INSPECT          a lagged cohort's dossier shows spend month, wait, creation
 *   SYSTEM           both compare modes render with the mechanisms on, and the
 *                    pending stock reads the engine's pendingNewARR
 *   WARM START       the opening pipeline: the default world carries one, the control drives it,
 *                    a cohort bought out of it says so, and dropping the lag empties it instead
 *                    of throwing
 *   NULL-ON-SCREEN   Reset returns every mechanism to null
 *   no page errors across the whole run
 */
const H = require('./accept-harness.js');
const E = require('./engine.js');

const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }

(async () => {
  const b = await H.launch();
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', msg => { if (msg.type() === 'error' && !/Failed to load resource|net::ERR/.test(msg.text())) errs.push('console: ' + msg.text()); });
  await pg.goto('file://' + require('path').resolve(__dirname, 'saas-physics-v1.html')); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA'));
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });   /* the opening page: enter the portal */
  await pg.evaluate(() => { (window.__SP_DEBUG.useBase('arr'), 0)   /* a world change over an Experiment asks first */ });   /* these checks read the ARR-physics world; the portal now opens on the Enterprise world */ await pg.waitForTimeout(400);
  /* the Change rail is a drawer and lenses show one at a time: checks click through the DOM and read every lens */
  const jsClick = async sel => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); };
  await pg.evaluate(() => { document.getElementById('side').dataset.reading = 'all'; });
  await pg.waitForTimeout(900);
  const setSlider = async (id, v) => { await pg.evaluate(([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input')); }, [id, v]); await pg.waitForTimeout(250); };
  const setScrub = async v => setSlider('scrub', v);
  const side = async () => pg.evaluate(() => document.getElementById('side').innerText);

  /* ---- CONTROLS ---- */
  const ctrls = await pg.evaluate(() => ({
    cost: !!document.getElementById('f-expansionCostPerARR'), cap: !!document.getElementById('f-maxMonthlyNewARR'),
    capTog: document.getElementById('t-maxMonthlyNewARR') && document.getElementById('t-maxMonthlyNewARR').textContent,
    lag: !!document.getElementById('f-acquisitionLagMonths'),
    capVal: document.getElementById('v-maxMonthlyNewARR').textContent, lagVal: document.getElementById('v-acquisitionLagMonths').textContent,
    costVal: document.getElementById('v-expansionCostPerARR').textContent,
    A: window.__SP_DEBUG.expA
  }));
  rec('CONTROLS: the three new controls exist and read their null state (capacity switch off, lag 0 mo, cost 0.00×)',
      ctrls.cost && ctrls.cap && ctrls.lag && ctrls.capTog === 'off' && ctrls.capVal === '' /* the switch states off; the value is not repeated */ && ctrls.lagVal === '0 mo' && ctrls.costVal === '0.00×', JSON.stringify(ctrls).slice(0, 200));
  rec('CONTROLS: the page\'s Experiment assumptions carry the null settings the engine defaults to',
      ctrls.A.expansionCostPerARR === 0 && ctrls.A.maxMonthlyNewARR === null && ctrls.A.acquisitionLagMonths === 0, '');

  await jsClick('#t-maxMonthlyNewARR'); await pg.waitForTimeout(300);
  const capOn = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA.maxMonthlyNewARR, tog: document.getElementById('t-maxMonthlyNewARR').textContent, val: document.getElementById('v-maxMonthlyNewARR').textContent, mech: window.__SP_DEBUG.expRes.mechanisms }));
  rec('CONTROLS: the capacity toggle switches the bound on at the slider value, and the run reports the mechanism on',
      capOn.A === 2000000 && capOn.tog === 'on' && capOn.val === '€2.00m/mo' && capOn.mech.acquisitionSaturation === true, JSON.stringify(capOn));
  await setSlider('f-acquisitionLagMonths', 6);
  await setSlider('f-expansionCostPerARR', 0.25);
  const allOn = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, summary: document.getElementById('experiment-summary').innerText }));
  rec('CONTROLS: lag and cost sliders drive the engine; all three mechanisms report on',
      allOn.A.acquisitionLagMonths === 6 && allOn.A.expansionCostPerARR === 0.25 && allOn.mech.expansionCost && allOn.mech.acquisitionLag && allOn.mech.acquisitionSaturation, JSON.stringify(allOn.mech));
  rec('CONTROLS: the Experiment summary names all three changed assumptions with from → to',
      /3 assumptions changed/.test(allOn.summary) && /Acquisition capacity/.test(allOn.summary) && /off → €2.00m\/mo/.test(allOn.summary) && /Acquisition lag/.test(allOn.summary) && /Expansion realisation cost/.test(allOn.summary), allOn.summary.replace(/\n/g, ' | ').slice(0, 200));

  /* ---- OBSERVE: independent recomputation vs the page ---- */
  await setScrub(30);
  const obs = await pg.evaluate(() => {
    const D = window.__SP_DEBUG, m = D.selectedMonth(), em = D.expRes.months[m - 1];
    const txt = document.getElementById('side').innerText;
    return { m, expCost: em.expansionCost, pending: em.pendingNewARR, txt };
  });
  const indep = E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS, { maxMonthlyNewARR: 2000000, acquisitionLagMonths: 6, expansionCostPerARR: 0.25 }));
  const im = indep.months[obs.m - 1];
  rec('OBSERVE: page expansion cost and pending New ARR at the selected month match an independent Node recomputation',
      Math.abs(obs.expCost - im.expansionCost) < 1e-6 && Math.abs(obs.pending - im.pendingNewARR) < 1e-6, 'page ' + obs.expCost + '/' + obs.pending + ' node ' + im.expansionCost + '/' + im.pendingNewARR);
  const fmtEur = v => Math.abs(v) >= 1e6 ? '€' + (v / 1e6).toFixed(2) + 'm' : '€' + Math.round(v / 1e3) + 'k';
  const gcond = await pg.evaluate(() => { const g = document.getElementById('lens-growth'), q = window.__SP_DEBUG.expRes.derived.acquisition; const wf = [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent);
    return { cost: wf.some(t => /Expansion realisation cost/.test(t)), cap: (g.querySelector('.lever[data-law="maxMonthlyNewARR"] .lv') || {}).textContent === '€2.00m'   /* a lever reads its value, or "off"; it is changed in the Experiment */, law: /⋈CAC floor/.test(g.innerText), meas: g.innerText.includes('average CAC') && g.innerText.includes('marginal CAC'), spread: q.marginalCAC > q.averageCAC, rv: [...g.querySelectorAll('svg.ch .rv')].map(e => e.textContent) }; });
  rec('OBSERVE: the Growth engine shows the capacity lever on at €2.00m, the CAC floor as a law beside the average and marginal measurements, marginal above average under the bound, and the P&L waterfall carries the expansion-cost line — only because the mechanisms are on',
      gcond.cost && gcond.cap && gcond.law && gcond.meas && gcond.spread, JSON.stringify(gcond));
  const pb = await pg.evaluate(() => { const q = window.__SP_DEBUG.expRes.derived.acquisition; return { avg: q.averagePaybackMonths, marg: q.marginalPaybackMonths }; });
  rec('OBSERVE: average and marginal payback on screen equal the engine\'s acquisitionResponse (avg CAC × 12 ÷ GM, marginal CAC × 12 ÷ GM)',
      gcond.rv.indexOf(pb.avg.toFixed(1) + ' mo') >= 0 && gcond.rv.indexOf(pb.marg.toFixed(1) + ' mo') >= 0 &&
      Math.abs(pb.avg - indep.derived.acquisition.averagePaybackMonths) < 1e-9 && Math.abs(pb.marg - indep.derived.acquisition.marginalPaybackMonths) < 1e-9, JSON.stringify(pb));

  /* ---- WATERFALL ---- */
  const wf = await pg.evaluate(() => [...document.querySelectorAll('.cascade .crow.wf .cl')].map(e => e.textContent));
  rec('WATERFALL: an "− Expansion realisation cost" step appears between G&A and FCF when the line exists (8 steps)',
      wf.length === 8 && wf[6] === '− Expansion realisation cost' && wf[7].startsWith('= Modeled FCF'), JSON.stringify(wf));
  const wfTie = await pg.evaluate(() => {
    const D = window.__SP_DEBUG, m = D.selectedMonth(), em = D.expRes.months[m - 1];
    const rows = [...document.querySelectorAll('.cascade .crow.wf')];
    const r = rows.find(x => x.querySelector('.cl').textContent === '− Expansion realisation cost');
    return { shown: r.querySelector('.cv').textContent, engine: em.expansionCost };
  });
  rec('WATERFALL: the printed cost step equals the engine\'s month field', wfTie.shown === '−' + fmtEur(wfTie.engine), JSON.stringify(wfTie));

  /* ---- INSPECT: a lagged cohort ---- */
  await jsClick('#nav-company'); await pg.waitForTimeout(200);
  await setScrub(20);
  const dossier = await pg.evaluate(() => {
    const D = window.__SP_DEBUG;
    /* pin cohort M12 (created month 12 from month-6 spend under a 6-month lag) via the canvas hit-test is fragile; use the page's own state through the mass click */
    const cv = document.getElementById('scene'); const r = cv.getBoundingClientRect();
    return { w: r.width, h: r.height, cohort: D.expRes.cohorts.filter(c => c.id === 'M12')[0], count12: D.expRes.cohorts.filter(c => c.acquisitionMonth > 0 && c.acquisitionMonth <= 12).length, first: D.expRes.cohorts[1].id };
  });
  rec('INSPECT (engine): under a 6-month lag the first cohort is M7, 6 cohorts exist by M12 (no phantoms), and cohort M12 records spendMonth 6, lag 6, acquisition cost €0.90m, realised CAC = average CAC',
      dossier.first === 'M7' && dossier.count12 === 6 && dossier.cohort.spendMonth === 6 && dossier.cohort.lagMonths === 6 && Math.abs(dossier.cohort.acquisitionCost - 900000) < 1e-6 &&
      Math.abs(dossier.cohort.cacPerARRAtCreation - indep.derived.acquisition.averageCAC) < 1e-9, JSON.stringify({ s: dossier.cohort.spendMonth, l: dossier.cohort.lagMonths, c: dossier.cohort.acquisitionCost, cac: dossier.cohort.cacPerARRAtCreation }));
  /* click into the mass at the top stratum near month 20 to pin a cohort, then read the dossier */
  const pinned = await pg.evaluate(() => {
    const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    /* walk down from the top of the mass region at x for month 19 until a cohort is hit */
    const geoL = 64, geoR = 20, W = r.width; const x = geoL + (19 / 60) * (W - geoL - geoR);
    let hit = null;
    for (let y = 30; y < r.height * 0.6 && hit === null; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); hit = y; }
    }
    return { hit, txt: (document.querySelectorAll('#side details').forEach(function(d){ d.open = true; }), document.getElementById('side').innerText) };
  });
  await pg.waitForTimeout(300);
  const dText = pinned.txt;
  rec('INSPECT (screen): the pinned cohort\'s dossier shows when the spend was incurred, how long it was pending, and when the cohort was created',
      pinned.hit !== null && /Spend incurred\s+month \d+ · pending 6 months/.test(dText) && /Cohort created\s+month \d+/.test(dText) && /Cohort CAC \(realised\)/.test(dText),
      (pinned.hit === null ? 'no cohort hit' : dText.slice(dText.indexOf('Cohort acquired'), dText.indexOf('Cohort acquired') + 260).replace(/\n/g, ' | ')));

  /* ---- CAC-UNITS: the pinned cohort's CAC does not change when the display basis changes ---- */
  const cacMRR = await pg.evaluate(() => { const t = (document.querySelectorAll('#side details').forEach(function(d){ d.open = true; }), document.getElementById('side').innerText); const m = t.match(/Cohort CAC \(realised\)\s+([^\n]+)/); return m ? m[1] : null; });
  await jsClick('#basis-arr'); await pg.waitForTimeout(300);
  const cacARR = await pg.evaluate(() => { const t = (document.querySelectorAll('#side details').forEach(function(d){ d.open = true; }), document.getElementById('side').innerText); const m = t.match(/Cohort CAC \(realised\)\s+([^\n]+)/); return m ? m[1] : null; });
  await jsClick('#basis-mrr'); await pg.waitForTimeout(200);
  rec('CAC-UNITS: switching the MRR/ARR display basis leaves the cohort CAC string unchanged (CAC is per €1 of ARR, never ×12)',
      cacMRR !== null && cacMRR === cacARR && /1\.65× · CAC floor 1\.20×/.test(cacMRR), 'MRR basis: ' + cacMRR + ' | ARR basis: ' + cacARR);
  await pg.evaluate(() => { const b = document.getElementById('inspect-back'); if (b) b.click(); });   /* Inspect is its own surface: back to the lenses */
  await pg.waitForTimeout(300);
  const alive = await pg.evaluate(() => { const m = String(window.__SP_DEBUG.figLegend).match(/OPENING BASE \+ (\d+) COHORTS/); return m ? +m[1] + 1 : null; });   /* the formation legend counts the cohorts drawn */
  rec('OBSERVE (screen): the Growth engine\'s cohort node at month 20 under a 6-month lag counts the opening base + 14 realised cohorts alive, not 20', alive === 15, 'shown ' + alive);

  /* ---- SYSTEM ---- */
  await jsClick('#menu-mech'); await pg.waitForTimeout(500);
  const sysAbs = await pg.evaluate(() => ({ txt: document.getElementById('side').textContent, pending: window.__SP_DEBUG.SS.stateAt(window.__SP_DEBUG.expRes, window.__SP_DEBUG.selectedMonth()).pendingNewARR }));
  rec('MECHANICS: the Overview notes explain structure only — the stock setting its own rates and the links the engine does not have — and leave the live settings to the drawer and Compare',
      !sysAbs.txt.includes('Mechanisms on the map') && sysAbs.txt.includes('The stock sets its own rates') && sysAbs.txt.includes('Two links the engine does not have'), '');
  rec('SYSTEM: systemstate.stateAt exposes the engine\'s pending stock at the selected month, equal to the month record',
      Math.abs(sysAbs.pending - indep.months[19].pendingNewARR) < 1e-6, sysAbs.pending + ' vs ' + indep.months[19].pendingNewARR);
  const sysDelta = await pg.evaluate(() => ({ delta: !!document.getElementById('cmp-delta'), tables: /Stocks · month|Flows into and out of/.test(document.getElementById('side').textContent) }));
  rec('MECHANICS: no Delta mode and no stock or flow tables — Compare owns Base against Experiment, Company and the Ledger own the figures', !sysDelta.delta && !sysDelta.tables, JSON.stringify(sysDelta));

  /* ---- SCENARIOS 7–9 ---- */
  await jsClick('#nav-company'); await pg.waitForTimeout(400);   /* the Forces rail (and Reset) is hidden on the System layer */
  await jsClick('#reset'); await pg.waitForTimeout(300);
  await jsClick('#nav-scen'); await pg.waitForTimeout(300);
  await pg.evaluate(() => (window.__SP_DEBUG.useBase('ex-expcost'), document.getElementById('nav-compare').click())); await pg.waitForTimeout(500);
  const s7 = await pg.evaluate(() => ({ txt: document.getElementById('side').textContent, bA: window.__SP_DEBUG.baseA, xA: window.__SP_DEBUG.expA,
    dARR: Math.max(...window.__SP_DEBUG.expRes.months.map((m, i) => Math.abs(m.closingARR - window.__SP_DEBUG.baseRes.months[i].closingARR))),
    dCash: window.__SP_DEBUG.expRes.months[59].cashClosing - window.__SP_DEBUG.baseRes.months[59].cashClosing }));
  rec('SCENARIO 7: both sides carry cost 0.25×, the ARR paths agree to floating point, and cash diverges',
      s7.bA.expansionCostPerARR === 0.25 && s7.xA.expansionCostPerARR === 0.25 && s7.dARR < 1e-5 && s7.dCash < -1e6,
      'max ΔARR ' + s7.dARR.toExponential(1) + ', ΔCash M60 ' + s7.dCash.toFixed(0));
  rec('SCENARIO 7: the panel proves the match on screen (GRR 96/90, NRR equal, max |ΔMRR| shown) and lists the cost consequence',
      s7.txt.includes('The two worlds agree on ARR and NRR') && s7.txt.includes('expansion realisation cost') && /R12M NRR at M12105\.6000% · 105\.6000%/.test(s7.txt) && s7.txt.includes('Same ARR, different system'), s7.txt.slice(0, 160).replace(/\n/g, ' | '));
  await pg.evaluate(() => (window.__SP_DEBUG.useBase('arr'), document.querySelector('#preset-list .prow[data-id="bounded"]').click(), document.getElementById('nav-compare').click())); await pg.waitForTimeout(500);
  const s8 = await pg.evaluate(() => ({ txt: document.getElementById('side').textContent, cap: window.__SP_DEBUG.expA.maxMonthlyNewARR, q: window.__SP_DEBUG.expRes.derived.acquisition }));
  rec('SCENARIO 8: the bound is on at €2.0m, the panel shows average vs marginal CAC and the response-curve table, and no optimum is declared',
      s8.cap === 2000000 && s8.txt.includes('Average CAC') && s8.txt.includes('Marginal CAC') && s8.txt.includes('Floor payback') && s8.txt.includes('Average payback') && s8.txt.includes('Marginal payback') && s8.txt.includes('Acquisition response in the Experiment') &&
      s8.txt.includes(s8.q.marginalCAC.toFixed(2) + '×') && !/optimal|should stop|should invest/i.test(s8.txt), s8.txt.slice(0, 100).replace(/\n/g, ' | '));
  await pg.evaluate(() => (document.getElementById('reset').click(), document.querySelector('#preset-list .prow[data-id="lag"]').click(), document.getElementById('nav-compare').click())); await pg.waitForTimeout(500);
  const s9 = await pg.evaluate(() => ({ txt: (document.querySelectorAll('#side details').forEach(function(d){ d.open = true; }), document.getElementById('side').innerText), lag: window.__SP_DEBUG.expA.acquisitionLagMonths, pend: window.__SP_DEBUG.expRes.pendingAtHorizon.newARR }));
  rec('SCENARIO 9: lag 6 is on; the spine shows the first cohort M1 → M7 (+6 mo), the pending stock at M60 and the cash-trough shift',
      s9.lag === 6 && /first cohort\nM1 → M7\n\+6 mo/.test(s9.txt) && /pending at M60\n€0 → €375k/.test(s9.txt) && /cash trough\n€6\.10m M13 → €[\d.]+m M\d+/.test(s9.txt) && Math.abs(s9.pend - 6 * 750000) < 1e-6, s9.txt.slice(s9.txt.indexOf('ACQUISITION'), s9.txt.indexOf('ACQUISITION') + 160).replace(/\n/g, ' | '));

  /* ---- boundary text is live ---- */
  const bounds9 = await pg.evaluate(() => document.getElementById('side').textContent);
  rec('BOUNDARIES: scenario 9 discloses the lag boundary with the live lag and the horizon rule',
      bounds9.includes('creates its cohort in month t + 6') && bounds9.includes('mature beyond M60 and stay pending'), '');

  /* ---- WARM START: the pipeline a going concern opens with ---- */
  await jsClick('#nav-company');   /* the earlier sections left the portal on another layer */
  await pg.evaluate(() => { const b = document.getElementById('inspect-back'); if (b) b.click(); }); await pg.waitForTimeout(200);
  await jsClick('#reset'); await pg.waitForTimeout(300);
  await pg.evaluate(() => (window.__SP_DEBUG.useBase('wA'), 0)   /* a world change over an Experiment asks first */); await pg.waitForTimeout(600);
  const warm = await pg.evaluate(() => { const D = window.__SP_DEBUG, M = D.expRes.months;
    return { pipe: D.expRes.derived.openingPipelineMonths, lag: D.expRes.derived.acquisitionLagMonths, mech: D.expRes.mechanisms.warmStart,
      inFlight: D.expRes.derived.openingPipelineARR, priorSM: D.expRes.derived.openingPipelinePriorSM,
      first: M.slice(0, 5).map(m => m.newARR), pending1: M[0].pendingNewARR,
      ctl: (document.getElementById('v-openingPipelineMonths') || {}).textContent,
      tog: (document.getElementById('t-openingPipelineMonths') || {}).textContent,
      cumSM: M[59].cumulative.sm, m60: M[59].closingARR, cohorts: D.expRes.cohorts.length }; });
  rec('WARM START: the Enterprise world opens with the pipeline its four-month lag implies already in flight — new ARR from month 1, the pipeline stock at its steady level, the control reading 4 mo, and the mechanism reported on',
      warm.pipe === 4 && warm.lag === 4 && warm.mech === true && warm.first.every(v => v > 0) && warm.tog === 'on' && /4 mo/.test(String(warm.ctl)) &&
      Math.abs(warm.pending1 - 4 * warm.first[0]) < 1e-6 && Math.abs(warm.inFlight - 4 * warm.first[0]) < 1e-6 && warm.priorSM === 4 * 700000,
      JSON.stringify({ pipe: warm.pipe, ctl: warm.ctl, tog: warm.tog, first: warm.first.map(Math.round), inFlight: Math.round(warm.inFlight) }));

  const coldAgain = await (async () => { await pg.evaluate(() => { const t = document.getElementById('t-openingPipelineMonths'); if (t) t.click(); }); await pg.waitForTimeout(500);
    return pg.evaluate(() => { const D = window.__SP_DEBUG, M = D.expRes.months;
      return { pipe: D.expRes.derived.openingPipelineMonths, mech: D.expRes.mechanisms.warmStart, first: M.slice(0, 5).map(m => m.newARR),
        cumSM: M[59].cumulative.sm, m60: M[59].closingARR, cohorts: D.expRes.cohorts.length }; }); })();
  rec('WARM START: switching the pipeline off empties it — the first four months book nothing, four fewer cohorts exist and ARR at the horizon falls, while the S&M spent inside the window is unchanged',
      coldAgain.pipe === 0 && coldAgain.mech === false && coldAgain.first.slice(0, 4).every(v => v === 0) && coldAgain.first[4] > 0 &&
      coldAgain.cumSM === warm.cumSM && coldAgain.cohorts === warm.cohorts - 4 && coldAgain.m60 < warm.m60,
      JSON.stringify({ pipe: coldAgain.pipe, first: coldAgain.first.map(Math.round), cohorts: coldAgain.cohorts, m60: [Math.round(warm.m60), Math.round(coldAgain.m60)] }));

  await pg.evaluate(() => { const t = document.getElementById('t-openingPipelineMonths'); if (t) t.click(); }); await pg.waitForTimeout(400);
  await setSlider('f-acquisitionLagMonths', 0); await pg.waitForTimeout(400);
  const clamped = await pg.evaluate(() => ({ pipe: window.__SP_DEBUG.expA.openingPipelineMonths, lag: window.__SP_DEBUG.expA.acquisitionLagMonths,
    tog: (document.getElementById('t-openingPipelineMonths') || {}).textContent }));
  rec('WARM START: dropping the lag to zero under a loaded pipeline empties the pipeline instead of raising the engine\'s boundary error — there is no pipeline without a lag',
      clamped.lag === 0 && (clamped.pipe === null || clamped.pipe === 0) && errs.length === 0, JSON.stringify(clamped));

  /* a cohort bought out of the opening pipeline says so, and has no cost inside the window to recover */
  await pg.evaluate(() => (window.__SP_DEBUG.useBase('wA'), 0)   /* a world change over an Experiment asks first */); await pg.waitForTimeout(600);
  await setScrub(36);
  /* the newest stratum at month 2 IS a pipeline cohort: scan down from the top of the mass */
  const pre = await pg.evaluate(() => { const D = window.__SP_DEBUG, cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const x = 64 + (2 / 60) * (r.width - 64 - 78);
    for (let y = 26; y < r.height * 0.9; y += 2) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor !== 'pointer') continue;
      cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (D.pinned !== null && D.expRes.cohorts[D.pinned].preWindow)
        return { k: D.pinned, am: D.expRes.cohorts[D.pinned].acquisitionMonth, cost: D.expRes.cohorts[D.pinned].acquisitionCost, cac: D.expRes.cohorts[D.pinned].cacPerARRAtCreation };
      if (D.pinned !== null) cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
    }
    return null; });
  await pg.waitForTimeout(500);
  const preTxt = await pg.evaluate(() => { const d = document.querySelector('.dossier'); if (!d) return ''; d.querySelectorAll('details').forEach(x => { x.open = true; }); return d.innerText; });
  rec('WARM START: a cohort bought out of the opening pipeline carries no acquisition cost and no realised CAC, and the Inspect chain says the spend happened before month 1 rather than calling it an opening base',
      pre !== null && pre.cost === null && pre.cac === null && /before month 1/.test(preTxt) && /outside this window/.test(preTxt) &&
      /bought out of the opening pipeline/.test(preTxt) && !/predates the simulation/.test(preTxt),
      JSON.stringify(pre) + ' | ' + preTxt.slice(preTxt.indexOf('Spend incurred'), preTxt.indexOf('Spend incurred') + 160).replace(/\n/g, ' | '));
  await pg.evaluate(() => { const b = document.getElementById('inspect-back'); if (b) b.click(); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => { (window.__SP_DEBUG.useBase('arr'), 0)   /* a world change over an Experiment asks first */ }); await pg.waitForTimeout(500);

  /* ---- NULL-ON-SCREEN ---- */
  await jsClick('#reset'); await pg.waitForTimeout(300);
  const nul = await pg.evaluate(() => ({ A: window.__SP_DEBUG.expA, mech: window.__SP_DEBUG.expRes.mechanisms, tog: document.getElementById('t-maxMonthlyNewARR').textContent,
    wf: [...document.querySelectorAll('.cascade .crow.wf .cl')].length }));
  rec('NULL-ON-SCREEN: Reset returns every mechanism to null (cost 0, capacity off, lag 0), the run reports none on, and the waterfall is back to 7 steps',
      nul.A.expansionCostPerARR === 0 && nul.A.maxMonthlyNewARR === null && nul.A.acquisitionLagMonths === 0 && !nul.mech.expansionCost && !nul.mech.acquisitionSaturation && !nul.mech.acquisitionLag && nul.tog === 'off' && nul.wf === 7, JSON.stringify(nul.mech) + ' wf=' + nul.wf);

  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));

  let pass = 0;
  P.forEach(([name, ok2, detail]) => { console.log('  ' + (ok2 ? 'PASS' : 'FAIL') + '  ' + name); if (detail) console.log('        ' + detail); if (ok2) pass++; });
  console.log('\n' + pass + ' / ' + P.length + ' physics-accept checks passed\n');
  await b.close();
  process.exit(pass === P.length ? 0 : 1);
})();
