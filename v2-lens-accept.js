/*
 * SaaS Physics — Economic lens redesign, DOM-level acceptance checks.
 * "Change one assumption and see its impact through the economic system."
 *
 * Runs the built single file in headless Chromium on the Enterprise SaaS acceptance
 * world (Customer, Monetization and Cash physics on) and asserts, lens by lens:
 *
 *   BASE        each lens shows its economic object: the identity customers × ARPA = ARR,
 *               the two bridges, the acquisition flow with its valves, composition apart
 *               from movement, the two paths
 *   RETENTION   logo retention 95% → 97%: the mark sits on Customers, the delta reaches
 *               customers, NRR, EBITA and cash; acquisition is stated unchanged
 *   ACQUISITION S&M €700k → €1.20m under a €1.5m capacity: the constraint tightens, the
 *               marginal euro does less, average and marginal CAC worsen
 *   MONETIZATION usage growth 20% → 30%: composition shifts toward usage, the cause bar
 *               reads usage-led, customers are unchanged
 *   BILLING     billing term 12 → 1 month: the P&L is untouched, only the cash path moves
 *   PHONE       the flows and the paths stack in one column at 390px
 *
 * No economics are asserted; every number here is read back from the engine through
 * window.__SP_DEBUG and compared with the text on screen.
 */
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (w, h) => { const pg = await br.newPage({ viewport: { width: w, height: h } }); pg.on('pageerror', e => errs.push(w + ': ' + String(e)));
    await pg.goto(URL); await pg.waitForTimeout(800); await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); document.getElementById('side').dataset.reading = 'all'; }); await pg.waitForTimeout(200); return pg; };
  const click = async (pg, sel) => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); await pg.waitForTimeout(350); };
  const scrub = async (pg, v) => { await pg.evaluate(v => { const s = document.getElementById('scrub'); s.value = v; s.dispatchEvent(new Event('input')); }, v); await pg.waitForTimeout(250); };
  const set = async (pg, id, v) => { await pg.evaluate(([id, v]) => { const i = document.getElementById(id); if (!i) throw new Error('no control ' + id); i.value = v; i.dispatchEvent(new Event('input')); }, [id, v]); await pg.waitForTimeout(450); };
  const world = async (pg) => { await click(pg, '#rail-toggle'); await click(pg, '#pack-wA'); await click(pg, '#rail-close'); await scrub(pg, 36); };
  const lens = (pg, id) => pg.evaluate(id => { const l = document.getElementById('lens-' + id); return { txt: l.innerText, marks: [...l.querySelectorAll('.mark')].map(m => m.innerText.replace(/\n/g, ' ')), vs: [...l.querySelectorAll('.vs')].map(v => v.textContent), same: [...l.querySelectorAll('.same')].map(v => v.textContent) }; }, id);
  const D = (pg, f) => pg.evaluate(f);

  const pg = await open(1440, 900);
  await world(pg);

  /* ---- BASE: each lens shows its object ---- */
  const co = await lens(pg, 'company'), cu = await lens(pg, 'customers'), gr = await lens(pg, 'growth'), mo = await lens(pg, 'monetization'), ca = await lens(pg, 'cash');
  const eng = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1]; return { m, cust: em.customers.closing, arr: em.closingARR, sm: em.sm, committed: em.acquisitionLawNewARR, fixed: em.monetization.fixedARR, variable: em.monetization.variableARR, cash: em.cashClosing, hasBase: !!W.baseRes.months[m - 1].cash }; });
  rec('BASE · COMPANY: hero on Base, no marks, no deltas; the absent-layer sentence is gone because every layer is on', /on Base/.test(co.txt) && co.marks.length === 0 && co.vs.length === 0 && !/carries no/.test(co.txt), co.txt.slice(0, 120).replace(/\n/g, ' | '));
  rec('BASE · CUSTOMERS: the identity customers × MRR per customer = MRR leads the lens, then logo retention, GRR, NRR and derived persistence, then the two bridges side by side and the growth decomposition',
      new RegExp(Math.round(eng.cust).toLocaleString('en-GB') + '\\ncustomers\\n×\\n€[\\d.]+k?\\nMRR per customer · derived\\n=\\n€[\\d.]+m\\nMRR').test(cu.txt) && /logo retention · R12M[\s\S]*gross dollar retention · R12M[\s\S]*net dollar retention · R12M[\s\S]*persistence ·/.test(cu.txt) &&
      /CUSTOMER BASE · LOGOS[\s\S]*− left · churned[\s\S]*CUSTOMER ECONOMICS · MRR[\s\S]*− left · churned logos[\s\S]*− stayed but shrank · contraction[\s\S]*\+ expanded · price \+ usage \+ adoption[\s\S]*\+ new customers/.test(cu.txt) && /MRR GROWTH = CUSTOMER GROWTH × ARPA DEVELOPMENT/.test(cu.txt) && cu.vs.length === 0,
      cu.txt.slice(0, 160).replace(/\n/g, ' | '));
  const decomp = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), a = W.expRes.months[m - 1], b = W.expRes.months[m - 13]; const gc = a.customers.closing / b.customers.closing - 1, ga = (a.closingARR / a.customers.closing) / (b.closingARR / b.customers.closing) - 1; return { gc, ga, gA: a.closingARR / b.closingARR - 1, txt: document.getElementById('lens-customers').innerText }; });
  const rel = v => (v >= 0 ? '+' : '−') + (Math.abs(v) * 100).toFixed(1) + '%';
  rec('BASE · CUSTOMERS: the decomposition is exact — (1 + customer growth)(1 + ARPA growth) − 1 equals the R12M MRR growth, and the three printed rates are the engine\'s',
      Math.abs((1 + decomp.gc) * (1 + decomp.ga) - 1 - decomp.gA) < 1e-9 && decomp.txt.includes(rel(decomp.gc) + '\ncustomers') && decomp.txt.includes(rel(decomp.ga) + '\nARPA') && decomp.txt.includes(rel(decomp.gA) + '\nMRR'), JSON.stringify(decomp.gc + ' ' + decomp.ga + ' ' + decomp.gA));
  rec('BASE · GROWTH ENGINE: one vertical flow — S&M in → ⋈ CAC coefficient → ⌈⌉ capacity in use → MRR committed → ⋈ lag with the committed-not-arrived stock → MRR arrives as the cohort; the coefficient reads as a law, average and marginal CAC as measurements',
      /S&M this month · capital in\n⋈ CAC coefficient [\d.]+×[\s\S]*⌈⌉ capacity €1\.50m\/mo · \d+% used[\s\S]*MRR committed this month\n⋈ lag 4 mo · €[\d.]+k committed, not yet arrived[\s\S]*MRR arrives · cohort M36/.test(gr.txt) && /MEASURED · AT THIS SPEND\nAverage CAC\n→ [\d.]+×\nMarginal CAC · next euro\n→ [\d.]+×/.test(gr.txt) && gr.same.length === 0 && gr.vs.length === 0,
      gr.txt.slice(0, 200).replace(/\n/g, ' | '));
  const curve = await D(pg, () => ({ svg: !!document.querySelector('#lens-growth svg.curve'), basePt: !!document.querySelector('#lens-growth svg.curve circle[stroke-dasharray]'), where: /WHERE THE GROWTH CAME FROM/.test(document.getElementById('lens-growth').innerText) }));
  rec('BASE · GROWTH ENGINE: the response curve is drawn under the capacity with the Experiment point only (no Base point while they agree); "where the growth came from" splits acquisition from the installed base', curve.svg && !curve.basePt && curve.where, JSON.stringify(curve));
  rec('BASE · MONETIZATION: composition (MRR = platform · fixed + usage · variable, per customer) sits above a rule; movement (before → new customers → churn → contraction → price → usage → adoption → now) and the cause bar beneath',
      /COMPOSITION · WHAT MRR IS MADE OF[\s\S]*platform · fixed · \d+%[\s\S]*usage · variable · \d+%[\s\S]*per customer €[\d.]+k = €[\d.]+k platform \+ €[\d.]+k usage[\s\S]*MOVEMENT · WHY MRR CHANGED[\s\S]*\+ price[\s\S]*\+ usage[\s\S]*\+ adoption[\s\S]*INSTALLED-BASE GROWTH BY CAUSE[\s\S]*(usage-led|price-led|adoption-led|mixed)/.test(mo.txt) && mo.vs.length === 0,
      mo.txt.slice(0, 160).replace(/\n/g, ' | '));
  const paths = await D(pg, () => ({ two: document.querySelectorAll('#lens-cash .paths .path').length, merged: !!document.querySelector('#lens-cash .paths.merged'), plClosed: !document.getElementById('pl-details').open, cascadeIn: !!document.querySelector('#pl-slot .cascade') }));
  rec('BASE · ECONOMICS & CASH: two paths side by side (Path 1 revenue → gross profit → EBITA; Path 2 billings → Δ deferred → collections → Δ receivables → cash FCF → cash), primary readouts above them, the waterfall closed beneath',
      paths.two === 2 && !paths.merged && /PATH 1 · ECONOMICS[\s\S]*revenue\n⋈ gross margin[\s\S]*gross profit[\s\S]*EBITA[\s\S]*PATH 2 · CASH[\s\S]*billings · invoiced\n⋈ billed 12 mo advance[\s\S]*collections\n⋈ collected \+2 mo[\s\S]*cash FCF[\s\S]*cash · M36/.test(ca.txt) && /capital required/.test(ca.txt) && paths.plClosed && paths.cascadeIn && ca.vs.length === 0,
      JSON.stringify(paths));

  /* ---- A · RETENTION: logo retention 95% → 97% ---- */
  await click(pg, '#rail-toggle'); await set(pg, 'f-logoRetentionAnnual', 0.97); await click(pg, '#rail-close'); await scrub(pg, 36);
  const A = { co: await lens(pg, 'company'), cu: await lens(pg, 'customers'), gr: await lens(pg, 'growth'), mo: await lens(pg, 'monetization'), ca: await lens(pg, 'cash') };
  const Ae = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), x = W.expRes.months[m - 1], b = W.baseRes.months[m - 1]; return { dCust: x.customers.closing - b.customers.closing, dARR: x.closingARR - b.closingARR, dCash: x.cashClosing - b.cashClosing, sameNew: Math.abs(x.newARR - b.newARR) < 1, sameSM: x.sm === b.sm }; });
  rec('RETENTION · COMPANY: the hero states the MRR delta vs Base, the changed law reads "Logo retention ⋈ 95.0% → 97.0%" with the month the effect begins, and customers, NRR and cash carry their deltas',
      Ae.dARR > 1 && /vs Base/.test(A.co.txt) && A.co.marks.join('|').includes('LOGO RETENTION ⋈ 95.0% → 97.0%') && /MRR leaves Base from M1/.test(A.co.txt) && A.co.vs.some(v => /^\+\d+ vs Base$/.test(v)) && A.co.vs.some(v => /pp vs Base/.test(v)) && A.co.vs.some(v => /^\+€[\d.]+[km]? vs Base$/.test(v)),
      JSON.stringify({ marks: A.co.marks, vs: A.co.vs }));
  rec('RETENTION · CUSTOMERS: the mark sits at the law that moved; the identity carries +customers and +MRR vs Base; logo retention, GRR and NRR carry pp deltas; the bridge\'s churn row reads ⋈ 97%',
      A.cu.marks.join('|').includes('LOGO RETENTION ⋈ 95.0% → 97.0%') && A.cu.vs.some(v => v === '+' + Math.round(Ae.dCust) + ' vs Base') && A.cu.vs.filter(v => /pp vs Base/.test(v)).length >= 3 && /− left · churned⋈ 97%/.test(A.cu.txt) && A.cu.same.length === 0,
      JSON.stringify({ marks: A.cu.marks, vs: A.cu.vs }));
  rec('RETENTION · GROWTH ENGINE: no mark, no delta on the flow, and the finding is stated — ACQUISITION · unchanged vs Base', Ae.sameNew && Ae.sameSM && A.gr.marks.length === 0 && A.gr.vs.length === 0 && A.gr.same.join('|') === 'Acquisition · unchanged vs Base', JSON.stringify({ same: A.gr.same, vs: A.gr.vs }));
  rec('RETENTION · MONETIZATION: no mark; the laws are stated unchanged while the base they act on moved', A.mo.marks.length === 0 && A.mo.same.join('|') === 'Monetization laws · unchanged vs Base' && /the base they act on moved/.test(A.mo.txt), JSON.stringify({ same: A.mo.same, marks: A.mo.marks }));
  rec('RETENTION · ECONOMICS & CASH: no mark; EBITA and cash carry positive deltas vs Base on the readouts and at the end of each path', A.ca.marks.length === 0 && Ae.dCash > 1 && A.ca.vs.filter(v => /^\+€[\d.]+[km]? vs Base$/.test(v)).length >= 4 && /EBITA · [\d.]+% margin\n\+€/.test(A.ca.txt) && /cash · M36\n\+€/.test(A.ca.txt), JSON.stringify(A.ca.vs));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- B · ACQUISITION: S&M €700k → €1.20m under the €1.5m capacity ---- */
  await click(pg, '#rail-toggle'); await set(pg, 'f-sm', 1200000); await click(pg, '#rail-close'); await scrub(pg, 36);
  const B = { co: await lens(pg, 'company'), cu: await lens(pg, 'customers'), gr: await lens(pg, 'growth'), ca: await lens(pg, 'cash') };
  const Be = await D(pg, () => { const W = window.__SP_DEBUG, x = W.expRes.derived.acquisition, b = W.baseRes.derived.acquisition, m = W.selectedMonth(); return { util: x.utilisation, utilB: b.utilisation, avg: x.averageCAC, avgB: b.averageCAC, marg: x.marginalCAC, margB: b.marginalCAC, dCommitted: W.expRes.months[m - 1].acquisitionLawNewARR - W.baseRes.months[m - 1].acquisitionLawNewARR, dEbita: W.expRes.months[m - 1].cumulative.ebita - W.baseRes.months[m - 1].cumulative.ebita, basePt: !!document.querySelector('#lens-growth svg.curve circle[stroke-dasharray]') }; });
  rec('ACQUISITION · GROWTH ENGINE: the mark reads "S&M €700k → €1.20m" on the flow; the constraint tightens (utilisation +pp vs Base); committed MRR rises less than proportionally; average CAC worsens and marginal CAC worsens faster; the response curve shows the Base point',
      B.gr.marks.join('|').includes('S&M €700k → €1.20m') && Be.util > Be.utilB && B.gr.vs.some(v => /^\+[\d.]+ pp vs Base$/.test(v)) && Be.dCommitted > 1 && Be.dCommitted < 500000 * 0.4 && Be.avg > Be.avgB && (Be.marg - Be.margB) > (Be.avg - Be.avgB) &&
      B.gr.txt.includes('Average CAC\n→ ' + Be.avg.toFixed(2) + '×\n+' + (Be.avg - Be.avgB).toFixed(2) + '× vs Base') && B.gr.txt.includes('Marginal CAC · next euro\n→ ' + Be.marg.toFixed(2) + '×\n+' + (Be.marg - Be.margB).toFixed(2) + '× vs Base') && Be.basePt && B.gr.same.length === 0,
      JSON.stringify({ marks: B.gr.marks, vs: B.gr.vs, util: [Be.util, Be.utilB], avg: [Be.avg, Be.avgB], marg: [Be.marg, Be.margB] }));
  rec('ACQUISITION · COMPANY and CUSTOMERS: the hero carries the MRR delta; customers carry +n vs Base without any mark on the customer laws', /vs Base/.test(B.co.txt) && B.co.marks.join('|').includes('S&M') && B.cu.marks.length === 0 && B.cu.vs.some(v => /^\+\d+ vs Base$/.test(v)), JSON.stringify(B.cu.vs));
  rec('ACQUISITION · ECONOMICS & CASH: more capital in shows as EBITA and cash below Base (negative deltas), capital required above Base', Be.dEbita < -1 && B.ca.vs.some(v => /^−€[\d.]+[km]? vs Base$/.test(v)) && /capital required · opening cash drawn\n\+€/.test(B.ca.txt), JSON.stringify(B.ca.vs));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- C · MONETIZATION: usage growth 20% → 30% ---- */
  await click(pg, '#rail-toggle'); await set(pg, 'f-monetization.components[1].usageGrowthAnnual', 0.30); await click(pg, '#rail-close'); await scrub(pg, 36);
  const C = { co: await lens(pg, 'company'), cu: await lens(pg, 'customers'), gr: await lens(pg, 'growth'), mo: await lens(pg, 'monetization'), ca: await lens(pg, 'cash') };
  const Ce = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), x = W.expRes.months[m - 1], b = W.baseRes.months[m - 1]; const vs = q => q.monetization.variableARR / (q.monetization.fixedARR + q.monetization.variableARR); return { dShare: vs(x) - vs(b), dCust: x.customers.closing - b.customers.closing, dARR: x.closingARR - b.closingARR }; });
  rec('MONETIZATION · MONETIZATION: the mark reads on the usage component (20% → 30%); the variable share carries +pp vs Base; the cause bar reads usage-led', C.mo.marks.join('|').includes('USAGE GROWTH') && /20\.0% → 30\.0%/.test(C.mo.marks.join('|')) && Ce.dShare > 0.005 && C.mo.vs.some(v => /^\+[\d.]+ pp vs Base$/.test(v)) && /usage-led/.test(C.mo.txt) && C.mo.same.length === 0, JSON.stringify({ marks: C.mo.marks, vs: C.mo.vs, dShare: Ce.dShare }));
  rec('MONETIZATION · CUSTOMERS: customers are unchanged (no customer delta, the finding stated), MRR per customer carries the delta', Math.abs(Ce.dCust) < 0.05 && !C.cu.vs.some(v => /^\+\d+ vs Base$/.test(v)) && C.cu.same.join('|') === 'Customer base · unchanged vs Base' && C.cu.vs.some(v => /^\+€[\d.]+k? vs Base$/.test(v)), JSON.stringify({ same: C.cu.same, vs: C.cu.vs }));
  rec('MONETIZATION · GROWTH ENGINE and ECONOMICS: acquisition is stated unchanged; EBITA and cash carry positive deltas', C.gr.same.join('|') === 'Acquisition · unchanged vs Base' && C.gr.marks.length === 0 && Ce.dARR > 1 && C.ca.vs.filter(v => /^\+€[\d.]+[km]? vs Base$/.test(v)).length >= 3, JSON.stringify({ same: C.gr.same, vs: C.ca.vs }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- D · BILLING: billing term 12 → 1 month, the P&L untouched ---- */
  await click(pg, '#rail-toggle'); await set(pg, 'f-billingTermMonths', 1); await click(pg, '#rail-close'); await scrub(pg, 36);
  const Dl = { co: await lens(pg, 'company'), cu: await lens(pg, 'customers'), gr: await lens(pg, 'growth'), mo: await lens(pg, 'monetization'), ca: await lens(pg, 'cash') };
  const De = await D(pg, () => { const W = window.__SP_DEBUG; let dE = 0, dA = 0, dC = 0; for (let t = 0; t < 60; t++) { dE = Math.max(dE, Math.abs(W.expRes.months[t].ebita - W.baseRes.months[t].ebita)); dA = Math.max(dA, Math.abs(W.expRes.months[t].closingARR - W.baseRes.months[t].closingARR)); dC = Math.max(dC, Math.abs(W.expRes.months[t].cashClosing - W.baseRes.months[t].cashClosing)); } return { dE, dA, dC }; });
  rec('BILLING · COMPANY: MRR stays on Base (hero "on Base", "MRR stays on Base · cash from Mn"), the mark reads "Billing term ⋈ 12 mo → 1 mo", only cash carries a delta',
      De.dA < 1e-6 && De.dE < 1e-6 && De.dC > 1e5 && /on Base/.test(Dl.co.txt) && /MRR stays on Base · cash from M\d+/.test(Dl.co.txt) && Dl.co.marks.join('|').includes('BILLING TERM') && /12 mo → 1 mo/.test(Dl.co.marks.join('|')) && Dl.co.vs.length === 1 && /vs Base$/.test(Dl.co.vs[0]),
      JSON.stringify({ marks: Dl.co.marks, vs: Dl.co.vs, De }));
  rec('BILLING · CUSTOMERS, GROWTH ENGINE, MONETIZATION: untouched — no marks, no deltas, no unchanged-lines needed', [Dl.cu, Dl.gr, Dl.mo].every(l => l.marks.length === 0 && l.vs.length === 0), JSON.stringify([Dl.cu.vs, Dl.gr.vs, Dl.mo.vs]));
  rec('BILLING · ECONOMICS & CASH: the mark sits on Path 2; EBITA carries no delta while cash FCF, cash, the trough and capital required do; the finding is stated — P&L · unchanged vs Base, only the cash path moved',
      Dl.ca.marks.join('|').includes('BILLING TERM') && !/EBITA · [\d.]+% margin\n[+−]€/.test(Dl.ca.txt) && /cash · M36\n[+−]€/.test(Dl.ca.txt) && /cash FCF · -?[\d.]+× EBITA\n[+−]€/.test(Dl.ca.txt) && /P&L · unchanged vs Base — only the cash path moved/i.test(Dl.ca.txt) && /⋈ billed 1 mo advance/.test(Dl.ca.txt),
      JSON.stringify({ marks: Dl.ca.marks, vs: Dl.ca.vs }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close');

  /* ---- OFF WORLDS: the reduced representations are visibly reduced ---- */
  await click(pg, '#rail-toggle'); await click(pg, '#pack-arr'); await click(pg, '#rail-close'); await scrub(pg, 36);
  const off = await D(pg, () => ({ cu: document.getElementById('lens-customers').innerText, mo: document.getElementById('lens-monetization').innerText, ca: document.getElementById('lens-cash').innerText, reduced: document.querySelectorAll('#side .reduced').length, merged: !!document.querySelector('#lens-cash .paths.merged'), pathsOff: document.querySelectorAll('#lens-cash .path.off').length, ident: document.querySelectorAll('#lens-customers .ident .it').length }));
  rec('OFF · CUSTOMERS reads INSTALLED BASE · MRR ONLY with "Customer Physics off — MRR is modelled without logos"; one balance, one leakage row, no identity of three terms', /INSTALLED BASE · MRR ONLY/.test(off.cu) && /Customer Physics off — MRR is modelled without logos/.test(off.cu) && /− leakage/.test(off.cu) && !/− left · churned/.test(off.cu) && off.ident === 1, '');
  rec('OFF · MONETIZATION reads MONETIZATION OFF · ONE BALANCE with a single undivided bar and a reduced movement; ECONOMICS & CASH merges the two paths with "Cash Physics off — modelled FCF = EBITA"', /MONETIZATION OFF · ONE BALANCE/.test(off.mo) && /no components/.test(off.mo) && !/INSTALLED-BASE GROWTH BY CAUSE/.test(off.mo) && off.merged && off.pathsOff === 1 && /Cash Physics off — modelled FCF = EBITA/.test(off.ca) && off.reduced === 2, JSON.stringify({ merged: off.merged, pathsOff: off.pathsOff, reduced: off.reduced }));
  await pg.close();

  /* ---- PHONE: the flows and the paths stack ---- */
  const q = await open(390, 844); await world(q);
  const ph = await D(q, () => { const g = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).gridTemplateColumns.split(' ').length : null; }; return { engine: g('#lens-growth .engine'), paths: g('#lens-cash .paths'), two: g('#lens-customers .two'), hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stage: document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth + 1 }; });
  rec('PHONE 390: the growth-engine flow, the two paths and the two bridges each stack into one column; no horizontal scroll', ph.engine === 1 && ph.paths === 1 && ph.two === 1 && !ph.hscroll && !ph.stage, JSON.stringify(ph));
  await q.close();
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-lens-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
