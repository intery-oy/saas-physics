/*
 * SaaS Physics — Five-lens design, DOM-level acceptance checks.
 * One instrument: each lens has a question, a small headline, one or two 60-month charts
 * on the same grammar, and levers only where they improve exploration.
 *
 * Runs the built single file in headless Chromium on the Enterprise SaaS world (Customer,
 * Monetization and Cash physics on) and checks:
 *
 *   COMPANY        headline (ARR, YoY, NRR, GM, EBITA margin, cash); the formation canvas
 *                  carries no cash plane; the model chip replaces the absent-layer prose
 *   CUSTOMERS      headline with YoY; the customer-base chart (customers, ARR/customer, Base
 *                  dashed) and the cumulative growth split (new customers vs existing base)
 *                  — and that split ties to the engine exactly
 *   GROWTH ENGINE  headline (S&M, new ARR, average/marginal CAC, payback); levers mirrored to
 *                  the rail; two charts (CAC, payback) that reshape when S&M moves
 *   MONETIZATION   headline (ARR, ARR/customer, fixed %, variable %); levers; one stacked
 *                  composition chart whose right-edge values equal the month's engine fields
 *   ECONOMICS      headline; economics chart (revenue, gross profit, EBITA); cash chart with the
 *                  trough marked and the zero line; waterfall behind disclosure
 *   GRAMMAR        every chart shares margins, the Y1–Y5 axis, the cursor at the selected month
 *   OFF WORLDS     customers / monetization / cash off are stated, not imitated
 *   PHONE          charts fit at 390px, no horizontal scroll
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
  const lens = (pg, id) => pg.evaluate(id => { const l = document.getElementById('lens-' + id); return { txt: l.innerText, charts: l.querySelectorAll('svg.ch').length, rv: [...l.querySelectorAll('svg.ch .rv')].map(e => e.textContent), rl: [...l.querySelectorAll('svg.ch .rl')].map(e => e.textContent), legend: [...l.querySelectorAll('.lg')].map(e => e.innerText), levers: [...l.querySelectorAll('.lever')].map(e => e.dataset.k), marks: [...l.querySelectorAll('.mark')].map(m => m.innerText.replace(/\n/g, ' ')), desc: [...l.querySelectorAll('.desc .dl')].map(e => e.textContent) }; }, id);
  const D = (pg, f) => pg.evaluate(f);

  const pg = await open(1440, 900);
  await world(pg);
  const eng = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1], s = W.expRes.months; let cumNew = 0, cumEx = 0; for (let i = 0; i < m; i++) { cumNew += s[i].newARR; cumEx += s[i].expansion - s[i].leakage; }
    return { m, arr: em.closingARR, cust: em.customers.closing, cash: em.cashClosing, fixed: em.monetization.fixedARR, variable: em.monetization.variableARR, cumNew, cumEx, opening: s[0].openingARR, avg: W.expRes.derived.acquisition.averageCAC, marg: W.expRes.derived.acquisition.marginalCAC, ebita: em.ebita, rev: em.revenue, trough: W.expRes.months.reduce((a, x) => Math.min(a, x.cashClosing), Infinity) }; });
  const mrr = v => { const a = Math.abs(v / 12); return '€' + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : Math.round(a)); };
  const mrrS = v => (v >= 0 ? '+' : '−') + mrr(v);
  const eurF = v => { const a = Math.abs(v); return (v < 0 ? '€-' : '€') + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : Math.round(a)); };

  /* ---- COMPANY ---- */
  const co = await lens(pg, 'company');
  const fig = await D(pg, () => { const fw = document.getElementById('figwrap'); return { open: fw.open, title: document.getElementById('fig-title').textContent, hint: document.getElementById('fig-hint').textContent, canvasH: document.getElementById('scene').getBoundingClientRect().height }; });
  rec('COMPANY: headline = ARR, YoY growth, NRR, gross margin (law), EBITA margin, cash · trough; no customer or ARPA descriptors here', /^€[\d.]+[km]?\nMRR\n\+[\d.]+% y\/y\non Base/.test(co.txt.split('\n').slice(3).join('\n')) && co.desc.join('|') === 'net dollar retention · R12M|gross margin · law|EBITA margin · R12M|cash · trough ' + eurF(eng.trough) + ' at M' + (await D(pg, () => window.__SP_DEBUG.expRes.months.reduce((a, x, i) => x.cashClosing < a.v ? { v: x.cashClosing, m: i + 1 } : a, { v: Infinity, m: 0 }).m)), JSON.stringify(co.desc));
  rec('COMPANY: the model chip names the active layers instead of prose about absent ones; no marks or deltas on Base', /MODEL · ARR · CUSTOMERS · MONETIZATION · CASH/.test(co.txt) && !/carries no/.test(co.txt) && co.marks.length === 0, co.txt.slice(-120).replace(/\n/g, ' | '));
  rec('COMPANY: the formation figure is open beneath the hero, titled Company formation, with the cohort-strata and YoY-line hint, and no cash plane (the canvas is one register)', fig.open && fig.title === 'Company formation · 60 months' && /opening base \+ successive cohorts as strata · YoY growth as a line/.test(fig.hint) && fig.canvasH >= 400 && (await D(pg, () => window.__SP_DEBUG.geo && window.__SP_DEBUG.geo.noCash === true)), JSON.stringify(fig));
  const canvasProbe = await D(pg, () => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const ctx = cv.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = (x, y) => { const d = ctx.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data; return d; }; let lit = 0; for (let y = r.height - 30; y > 20; y -= 4) { const d = px(r.width - 40, y); if (d[0] + d[1] + d[2] > 60) lit++; } return { lit }; });
  rec('COMPANY: the right edge of the canvas carries the selected-month values (pixels are painted in the right margin)', canvasProbe.lit > 3, JSON.stringify(canvasProbe));

  /* ---- CUSTOMERS ---- */
  await click(pg, '.lensnav .btn[data-lens="customers"]');
  const cu = await lens(pg, 'customers');
  const figCu = await D(pg, () => document.getElementById('figwrap').open);
  rec('CUSTOMERS: headline = customers, ARR/customer, ARR (each with YoY), logo retention, NRR; the formation figure collapses to a strip here', cu.desc.join('|') === 'customers|MRR per customer|MRR|logo retention · R12M|net dollar retention · R12M' && (cu.txt.match(/% y\/y/g) || []).length === 3 && !figCu, JSON.stringify({ desc: cu.desc, figCu }));
  rec('CUSTOMERS: chart 1 is the customer-base development — a customers pane over an ARR/customer pane — and chart 2 the cumulative growth split; three svgs on one grammar, same width', cu.charts === 3 && /CUSTOMER BASE DEVELOPMENT[\s\S]*WHERE MRR GROWTH CAME FROM · CUMULATIVE SINCE M0/.test(cu.txt) && (await D(pg, () => { const w = [...document.querySelectorAll('#lens-customers svg.ch')].map(s => Math.round(s.getBoundingClientRect().width)); return w.every(x => x === w[0]) && w[0] > 500; })), JSON.stringify({ charts: cu.charts }));
  rec('CUSTOMERS: the right-edge values at the selected month are the engine\'s — customers, ARR/customer, new customers, existing base, total — and the split sums to ARR − opening ARR', cu.rv.indexOf(Math.round(eng.cust).toLocaleString('en-GB')) >= 0 && cu.rv.indexOf(mrrS(eng.cumNew)) >= 0 && cu.rv.indexOf(mrrS(eng.cumEx)) >= 0 && cu.rv.indexOf(mrrS(eng.arr - eng.opening)) >= 0 && Math.abs(eng.cumNew + eng.cumEx - (eng.arr - eng.opening)) < 1e-6 && cu.rl.join('|').indexOf('new customers') >= 0 && cu.rl.join('|').indexOf('existing base') >= 0, JSON.stringify({ rv: cu.rv, rl: cu.rl, cumNew: eng.cumNew, cumEx: eng.cumEx }));
  rec('CUSTOMERS: no bridges, no decomposition, no separate retention or movement charts', !/CUSTOMER BASE · LOGOS|CUSTOMER ECONOMICS|GROWTH = CUSTOMER GROWTH|− left · churned/.test(cu.txt) && cu.levers.length === 0, '');

  /* ---- GROWTH ENGINE ---- */
  await click(pg, '.lensnav .btn[data-lens="growth"]');
  const gr = await lens(pg, 'growth');
  rec('GROWTH ENGINE: headline = S&M/month, new ARR/month, average CAC, marginal CAC, payback — the two CACs distinct and measured (→)', gr.desc.join('|') === 'S&M · month|new MRR · month|average CAC · € per €1 of new ARR|marginal CAC · the next euro|payback · average' && gr.txt.includes('→ ' + eng.avg.toFixed(2) + '×') && gr.txt.includes('→ ' + eng.marg.toFixed(2) + '×') && eng.marg > eng.avg, JSON.stringify(gr.desc));
  rec('GROWTH ENGINE: levers for S&M, the CAC coefficient and the capacity sit on the lens, mirroring the rail', gr.levers.join('|') === 'sm|cacPerARR|maxMonthlyNewARR', JSON.stringify(gr.levers));
  rec('GROWTH ENGINE: two charts of the same height and width — acquisition efficiency (average, marginal, measured CAC) and CAC payback (average, marginal, realised by vintage) — with the selected-month values at the right edge', gr.charts === 2 && /ACQUISITION EFFICIENCY[\s\S]*ACQUISITION PAYBACK · AVERAGE, MARGINAL, REALISED/.test(gr.txt) && gr.rl.slice().sort().join('|') === 'average|average|marginal|marginal|measured' && gr.rv.indexOf(eng.avg.toFixed(2) + '×') >= 0 && gr.rv.indexOf(eng.marg.toFixed(2) + '×') >= 0 && (await D(pg, () => { const b = [...document.querySelectorAll('#lens-growth svg.ch')].map(s => s.getBoundingClientRect()); return Math.abs(b[0].width - b[1].width) < 1 && Math.abs(b[0].height - b[1].height) < 1 && Math.abs(b[0].left - b[1].left) < 1; })), JSON.stringify({ rv: gr.rv, rl: gr.rl }));
  rec('GROWTH ENGINE: the acquisition-machine diagram is gone from the lens', !/S&M this month · capital in|MRR committed this month|MEASURED · AT THIS SPEND/.test(gr.txt), '');
  /* drive S&M from the lens lever: the economics below reshape */
  await pg.evaluate(() => { const i = document.querySelector('#lens-growth .lever input[data-for="sm"]'); i.value = 1200000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(450);
  const gr2 = await lens(pg, 'growth');
  const q2 = await D(pg, () => ({ sm: window.__SP_DEBUG.expA.sm, avg: window.__SP_DEBUG.expRes.derived.acquisition.averageCAC, marg: window.__SP_DEBUG.expRes.derived.acquisition.marginalCAC, baseLines: document.querySelectorAll('#lens-growth svg.ch path[stroke-dasharray]').length }));
  rec('GROWTH ENGINE: moving the S&M lever to €1.20m raises average and marginal CAC (marginal faster), marks the change, and the charts show the Base lines dashed beneath the Experiment', q2.sm === 1200000 && q2.avg > eng.avg && (q2.marg - eng.marg) > (q2.avg - eng.avg) && gr2.rv.indexOf(q2.avg.toFixed(2) + '×') >= 0 && gr2.marks.join('|').includes('S&M €700k → €1.20m') && q2.baseLines >= 4 && /Base/.test(gr2.legend.join('|')), JSON.stringify({ q2, marks: gr2.marks }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- MONETIZATION ---- */
  await click(pg, '.lensnav .btn[data-lens="monetization"]');
  const mo = await lens(pg, 'monetization');
  const vShare = eng.variable / (eng.fixed + eng.variable);
  rec('MONETIZATION: headline = ARR, ARR/customer, fixed %, variable %; levers for platform fee, usage growth, adoption', mo.desc.join('|') === 'MRR|MRR per customer|platform · fixed|usage · variable' && mo.txt.includes((Math.round((1 - vShare) * 100)) + '%\nplatform · fixed') && mo.levers.join('|') === 'monetization.components[0].priceAnnual|monetization.components[1].usageGrowthAnnual|monetization.components[1].adoptionAnnual', JSON.stringify({ desc: mo.desc, levers: mo.levers }));
  rec('MONETIZATION: one stacked composition chart (platform · fixed beneath usage · variable) whose right-edge values are the month\'s fixed and variable ARR; no movement ladder, no cause bar', mo.charts === 1 && /MRR COMPOSITION/.test(mo.txt) && mo.rv.indexOf(mrr(eng.fixed)) >= 0 && mo.rv.indexOf(mrr(eng.variable)) >= 0 && /platform · \d+%/.test(mo.rl.join('|')) && /usage · \d+%/.test(mo.rl.join('|')) && !/MOVEMENT|GROWTH BY CAUSE|− churn/.test(mo.txt), JSON.stringify({ rv: mo.rv, rl: mo.rl }));
  await pg.evaluate(() => { const i = document.querySelector('#lens-monetization .lever input[data-for="monetization.components[1].usageGrowthAnnual"]'); i.value = 0.30; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(450);
  const mo2 = await lens(pg, 'monetization');
  const v2 = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), x = W.expRes.months[m - 1].monetization; return { share: x.variableARR / (x.fixedARR + x.variableARR), law: W.expRes.assumptions.monetization.components[1].usageGrowthAnnual }; });
  rec('MONETIZATION: the usage-growth lever (20% → 30%) reshapes the composition — the variable share rises — with the mark on the lens and the Base total dashed', Math.abs(v2.law - 0.30) < 1e-9 && v2.share > vShare + 0.005 && mo2.marks.join('|').includes('USAGE GROWTH') && /Base/.test(mo2.legend.join('|')), JSON.stringify({ v2, vShare, marks: mo2.marks }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- ECONOMICS & CASH ---- */
  await click(pg, '.lensnav .btn[data-lens="cash"]');
  const ca = await lens(pg, 'cash');
  const paths = await D(pg, () => ({ plClosed: !document.getElementById('pl-details').open, cascadeIn: !!document.querySelector('#pl-slot .cascade'), zero: document.querySelectorAll('#lens-cash svg.ch .zero').length, trough: [...document.querySelectorAll('#lens-cash svg.ch .mk')].map(e => e.textContent), align: (() => { const b = [...document.querySelectorAll('#lens-cash svg.ch')].map(s => s.getBoundingClientRect()); return b.length === 2 && Math.abs(b[0].width - b[1].width) < 1 && Math.abs(b[0].left - b[1].left) < 1; })() }));
  rec('ECONOMICS & CASH: headline = revenue, EBITA, EBITA margin, cash, cash trough, capital required', ca.desc.join('|') === 'revenue · R12M|EBITA · R12M|EBITA margin · R12M|cash · M36|cash trough · M' + (await D(pg, () => window.__SP_DEBUG.expRes.months.reduce((a, x, i) => x.cashClosing < a.v ? { v: x.cashClosing, m: i + 1 } : a, { v: Infinity, m: 0 }).m)) + '|capital required · opening cash drawn', JSON.stringify(ca.desc));
  rec('ECONOMICS & CASH: the economics chart carries revenue, gross profit and EBITA per month with the selected-month values; the cash chart is the balance with the trough marked and a zero line; both aligned; the waterfall is closed beneath', ca.charts === 2 && /ECONOMICS · MONTHLY[\s\S]*CASH/.test(ca.txt) && ca.rv.indexOf(eurF(eng.rev)) >= 0 && ca.rv.indexOf(eurF(eng.ebita)) >= 0 && ca.rv.indexOf(eurF(eng.cash)) >= 0 && paths.zero >= 1 && paths.trough.some(t => /^trough €-?[\d.]+[km]? · M\d+$/.test(t)) && paths.align && paths.plClosed && paths.cascadeIn, JSON.stringify({ rv: ca.rv, paths }));
  rec('ECONOMICS & CASH: the flow diagrams are gone from the lens', !/PATH 1 · ECONOMICS|PATH 2 · CASH|billings · invoiced/.test(ca.txt), '');

  /* ---- GRAMMAR across the instrument ---- */
  const gram = await D(pg, () => { const svgs = [...document.querySelectorAll('#side svg.ch')]; return { n: svgs.length, ls: svgs.map(s => s.dataset.l + '/' + s.dataset.r), axes: svgs.map(s => [...s.querySelectorAll('.ax')].filter(t => /^Y[1-5]$/.test(t.textContent)).length), cursors: svgs.map(s => s.querySelectorAll('.cur').length), curX: svgs.map(s => s.querySelector('.cur') && s.querySelector('.cur').getAttribute('x1')) }; });
  rec('GRAMMAR: every lens chart shares the same left/right margins, a Y1–Y5 axis and one cursor at the same x for the selected month', gram.n === 8 && gram.ls.every(x => x === gram.ls[0]) && gram.axes.every(a => a === 5) && gram.cursors.every(c => c === 1) && gram.curX.every(x => x === gram.curX[0]), JSON.stringify(gram));
  await scrub(pg, 48);
  const moved = await D(pg, () => ({ curX: [...document.querySelectorAll('#side svg.ch .cur')].map(c => c.getAttribute('x1')), tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent) }));
  rec('GRAMMAR: moving the global month moves every chart\'s cursor together and every lens\'s basis tag', moved.curX.every(x => x === moved.curX[0]) && moved.curX[0] !== gram.curX[0] && moved.tags.join('|') === 'M48|M48|M48|M48|R12M', JSON.stringify(moved));
  await pg.evaluate(() => { const s = document.querySelector('#lens-cash svg.ch'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5 })); }); await pg.waitForTimeout(300);
  const clicked = await D(pg, () => window.__SP_DEBUG.selectedMonth());
  rec('GRAMMAR: clicking a chart moves the month there (the chart is a scrubber too)', clicked > 20 && clicked < 40, String(clicked));
  await scrub(pg, 36);

  /* ---- OFF WORLDS ---- */
  await click(pg, '#rail-toggle'); await click(pg, '#pack-arr'); await click(pg, '#rail-close'); await scrub(pg, 36);
  const off = await D(pg, () => ({ cu: document.getElementById('lens-customers').innerText, mo: document.getElementById('lens-monetization').innerText, ca: document.getElementById('lens-cash').innerText, co: document.getElementById('lens-company').innerText, cuCharts: document.querySelectorAll('#lens-customers svg.ch').length, moCharts: document.querySelectorAll('#lens-monetization svg.ch').length, moLevers: document.querySelectorAll('#lens-monetization .lever').length }));
  rec('OFF · CUSTOMERS states that customers and ARR/customer are not modelled, keeps only the cumulative growth split; MONETIZATION states one balance with a single-series chart and no levers; the model chip reads MODEL · ARR', /Customer physics off/i.test(off.cu) && /are not modelled/.test(off.cu) && off.cuCharts === 1 && /Monetization physics off/i.test(off.mo) && off.moCharts === 1 && off.moLevers === 0 && /MODEL · ARR\n/.test(off.co + '\n') && !/CUSTOMERS · MONETIZATION/.test(off.co), JSON.stringify({ cuCharts: off.cuCharts, moCharts: off.moCharts }));
  rec('OFF · ECONOMICS & CASH says FCF = EBITA in the cash legend when cash physics is off', /FCF = EBITA · cash physics off/.test(off.ca), '');
  await pg.close();

  /* ---- PHONE ---- */
  const q = await open(390, 844); await world(q);
  const ph = await D(q, () => ({ hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stage: document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth + 1, chartW: [...document.querySelectorAll('#side svg.ch')].map(s => Math.round(s.getBoundingClientRect().width)), side: document.getElementById('side').getBoundingClientRect().width }));
  rec('PHONE 390: every chart fits the column; no horizontal scroll', ph.chartW.every(w => w <= ph.side + 1 && w > 200) && !ph.hscroll && !ph.stage, JSON.stringify(ph));
  await q.close();
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-lens-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
