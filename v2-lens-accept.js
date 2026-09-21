/*
 * SaaS Physics — Five-lens visual rebuild, DOM-level acceptance checks.
 *
 * The acceptance world is the Enterprise SaaS configuration with Customer, Monetization and
 * Cash physics ON (pack wA), read at month 36. Every check below is about the rendered
 * hierarchy, not selector existence:
 *
 *   STRUCTURE   per lens: question · headline row · [controls] · the specified charts, nothing
 *               else — no formation canvas or Compare strip beneath the other four lenses
 *   COUNTS      Company 1 canvas · Customers 2 · Growth engine 2 · Monetization 1 · Economics 2
 *   GEOMETRY    on two-chart pages the charts have identical left, width and height; every chart
 *               on the instrument shares the same margins and Y1–Y5 positions
 *   TIME        one cursor per chart at the same x; the global month moves them all; a click on
 *               a chart moves the month
 *   BASE        Base is dashed and thin, present only when it differs; Experiment solid
 *   VALUES      right-edge values are the engine's own fields at the selected month
 *   LABELS      no right-edge label collisions at 1440, 1024 and 768
 *   OFF         null-physics fallbacks render but are not the acceptance state
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
    await pg.goto(URL); await pg.waitForTimeout(800); await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); }); await pg.waitForTimeout(200); return pg; };
  const click = async (pg, sel) => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); await pg.waitForTimeout(350); };
  const scrub = async (pg, v) => { await pg.evaluate(v => { const s = document.getElementById('scrub'); s.value = v; s.dispatchEvent(new Event('input')); }, v); await pg.waitForTimeout(250); };
  const world = async (pg) => { await click(pg, '#rail-toggle'); await click(pg, '#pack-wA'); await click(pg, '#rail-close'); await scrub(pg, 36); };
  const D = (pg, f, a) => pg.evaluate(f, a);
  /* what is actually on the page for one lens: the visible lens body, its charts, and anything beneath it */
  const page = (pg, id) => D(pg, id => { const l = document.getElementById('lens-' + id); const svgs = [...l.querySelectorAll('svg.ch')];
    const rects = svgs.map(s => { const r = s.getBoundingClientRect(); return { left: Math.round(r.left * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; });
    const vis = e => { const r = e.getBoundingClientRect(); return r.height > 0 && getComputedStyle(e).display !== 'none'; };
    let collide = 0; svgs.forEach(s => { const gs = [...s.querySelectorAll('g.rg')].map(g => g.getBoundingClientRect()); for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) { const a = gs[i], b = gs[j]; if (a.top < b.bottom && b.top < a.bottom && a.left < b.right && b.left < a.right) collide++; } });
    return { visible: vis(l), charts: svgs.length, rects, collide,
      figVisible: vis(document.getElementById('figwrap')), stripVisible: vis(document.getElementById('causal-slot')),
      cursors: svgs.map(s => s.querySelectorAll('.cur').length), curX: svgs.map(s => (s.querySelector('.cur') || {}).getAttribute && s.querySelector('.cur').getAttribute('x1')),
      margins: svgs.map(s => s.dataset.l + '/' + s.dataset.r), y1x: svgs.map(s => [...s.querySelectorAll('.ax')].filter(t => t.textContent === 'Y1').map(t => t.getAttribute('x'))[0]),
      baseLines: svgs.map(s => s.querySelectorAll('path.ln.base').length), solid: svgs.map(s => [...s.querySelectorAll('path.ln:not(.base)')].every(p => !p.getAttribute('stroke-dasharray'))),
      rv: [...l.querySelectorAll('svg.ch .rv')].map(e => e.textContent), rl: [...l.querySelectorAll('svg.ch .rl')].map(e => e.textContent),
      titles: [...l.querySelectorAll('.chb .eyebrow')].map(e => e.textContent), legend: [...l.querySelectorAll('.lg')].map(e => e.innerText.replace(/\n/g, ' ')),
      hl: [...l.querySelectorAll('.hl .dl')].map(e => e.textContent), levers: [...l.querySelectorAll('.lever')].map(e => e.dataset.k), q: (l.querySelector('.lens-q') || {}).textContent,
      prose: [...l.querySelectorAll('.offnote, .marks, .reduced, .vflow, .paths, .ident, .two, .decomp, .readouts')].filter(vis).length,
      blocks: [...l.children].map(c => c.className.split(' ')[0]), txt: l.innerText }; }, id);
  const mrr = v => { const a = Math.abs(v / 12); return '€' + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : Math.round(a)); };
  const mrrS = v => (v >= 0 ? '+' : '−') + mrr(v);
  const eurF = v => { const a = Math.abs(v); return (v < 0 ? '€-' : '€') + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : Math.round(a)); };
  const sameGeo = r => r.length === 2 && Math.abs(r[0].left - r[1].left) < 0.6 && Math.abs(r[0].width - r[1].width) < 0.6 && Math.abs(r[0].height - r[1].height) < 0.6;

  /* ---- DEFAULT WORLD: a fresh page load, no world chosen ---- */
  const fresh = await open(1440, 900); await scrub(fresh, 36);
  const boot = await D(fresh, () => ({ pack: window.__SP_DEBUG.activePack, mech: window.__SP_DEBUG.expRes.mechanisms, on: (document.querySelector('#worldlist .btn.on') || {}).textContent, model: (document.querySelector('#lens-company .model') || {}).textContent }));
  await click(fresh, '.lensnav .btn[data-lens="customers"]');
  const bootCu = await page(fresh, 'customers');
  rec('DEFAULT WORLD: a fresh page load opens on A · Enterprise with Customer, Monetization and Cash physics ON — the model chip reads MODEL · ARR · CUSTOMERS · MONETIZATION · CASH', boot.pack === 'wA' && boot.mech.customerPhysics && boot.mech.monetization && boot.mech.cashPhysics && /A · Enterprise/.test(boot.on) && /MODEL · ARR · Customers · Monetization · Cash/i.test(boot.model), JSON.stringify(boot));
  rec('DEFAULT WORLD: opening Customers on a fresh load shows the full lens — five headline items, chart 1 customer base development, chart 2 where ARR growth came from, no fallback note', bootCu.hl.join('|') === 'customers|MRR per customer|MRR|logo retention · R12M|net dollar retention · R12M' && bootCu.charts === 2 && bootCu.titles.join('|') === 'Customer base development|Where did MRR growth come from? · cumulative since M0' && sameGeo(bootCu.rects) && !/physics off/i.test(bootCu.txt), JSON.stringify({ hl: bootCu.hl, titles: bootCu.titles, charts: bootCu.charts }));
  await click(fresh, '.lensnav .btn[data-lens="monetization"]');
  const bootMo = await page(fresh, 'monetization');
  rec('DEFAULT WORLD: opening Monetization on a fresh load shows ARR, ARR/customer, fixed %, variable %, the three controls and the stacked FIXED/VARIABLE composition chart', bootMo.hl.join('|') === 'MRR|MRR per customer|fixed revenue|variable revenue' && bootMo.levers.length === 3 && bootMo.charts === 1 && bootMo.titles[0] === 'MRR composition over time' && /fixed · \d+%/.test(bootMo.rl.join('|')) && /variable · \d+%/.test(bootMo.rl.join('|')) && !/physics off/i.test(bootMo.txt), JSON.stringify({ hl: bootMo.hl, levers: bootMo.levers, rl: bootMo.rl }));
  await click(fresh, '.lensnav .btn[data-lens="cash"]');
  const bootCa = await page(fresh, 'cash');
  const bootCash = await D(fresh, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1]; return { cashOn: !!em.cash, term: W.expRes.derived.cash.billingTermMonths, delay: W.expRes.derived.cash.collectionDelayMonths, fcfNeEbita: Math.abs(em.fcf - em.ebita) > 1 }; });
  rec('DEFAULT WORLD: opening Economics & cash on a fresh load shows revenue, EBITA, margin, cash, trough, the economics chart and the cash chart with Cash physics active (billed 12 months in advance, collected two months later, FCF ≠ EBITA)', bootCa.hl.length === 5 && bootCa.charts === 2 && bootCa.titles.join('|') === 'Economics over time · monthly|Cash over time' && bootCash.cashOn && bootCash.term === 12 && bootCash.delay === 2 && bootCash.fcfNeEbita && !/physics off/i.test(bootCa.txt), JSON.stringify({ hl: bootCa.hl, bootCash }));
  await fresh.close();

  const pg = await open(1440, 900);
  await world(pg);
  const eng = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1], s = W.expRes.months; let cumNew = 0, cumExp = 0, cumLoss = 0; for (let i = 0; i < m; i++) { cumNew += s[i].newARR; cumExp += s[i].expansion; cumLoss += s[i].leakage; } const cumEx = cumExp - cumLoss;
    const tr = s.reduce((a, x, i) => x.cashClosing < a.v ? { v: x.cashClosing, m: i + 1 } : a, { v: Infinity, m: 0 });
    return { m, mech: W.expRes.mechanisms, arr: em.closingARR, yoy: em.arrGrowthYoY, cust: em.customers.closing, cash: em.cashClosing, fixed: em.monetization.fixedARR, variable: em.monetization.variableARR, cumNew, cumEx, cumExp, cumLoss, opening: s[0].openingARR, avg: W.expRes.derived.acquisition.averageCAC, marg: W.expRes.derived.acquisition.marginalCAC, gm: W.expRes.assumptions.grossMargin, ebita: em.ebita, rev: em.revenue, gp: em.grossProfit, trough: tr.v, troughM: tr.m }; });
  rec('WORLD: the acceptance world has Customer, Monetization and Cash physics on, at month 36, with acquisition capacity and lag in force', eng.mech.customerPhysics && eng.mech.monetization && eng.mech.cashPhysics && eng.mech.acquisitionSaturation && eng.mech.acquisitionLag && eng.m === 36, JSON.stringify(eng.mech));

  /* ---- COMPANY ---- */
  const co = await page(pg, 'company');
  const fig = await D(pg, () => { const fw = document.getElementById('figwrap'); const cv = document.getElementById('scene').getBoundingClientRect(); return { open: fw.open, title: document.getElementById('fig-title').textContent, h: cv.height, noCash: window.__SP_DEBUG.geo.noCash, legend: window.__SP_DEBUG.figLegend }; });
  rec('COMPANY · structure: question · hero (ARR, YoY, vs Base) · headline row (NRR, gross margin, EBITA margin, cash) · model chip · nothing else', /What kind of company did these assumptions create\?/.test(co.q) && co.hl.join('|') === 'net dollar retention · R12M|gross margin · law|EBITA margin · R12M|cash · M36' && co.blocks.join(',') === 'lens-head,hero,hl,model' && co.charts === 0 && co.prose === 0, JSON.stringify(co.blocks));
  rec('COMPANY · model state reads MODEL · ARR · CUSTOMERS · MONETIZATION · CASH as one small line; no customer count or ARR/customer on this lens', /MODEL · ARR · CUSTOMERS · MONETIZATION · CASH/.test(co.txt) && !/\ncustomers\n/.test(co.txt) && !/per customer/.test(co.txt), '');
  rec('COMPANY · one chart: the formation canvas is open beneath the hero, one register (no cash plane), strata legend "opening base + n cohorts", with the YoY line and right-edge values', fig.open && fig.title === 'Company formation · 60 months' && fig.noCash === true && fig.h >= 400 && /OPENING BASE \+ \d+ COHORTS/.test(fig.legend) && co.figVisible, JSON.stringify(fig));
  const painted = await D(pg, () => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1); let lit = 0; for (let y = r.height - 30; y > 20; y -= 3) { const d = ctx.getImageData(Math.round((r.width - 40) * dpr), Math.round(y * dpr), 1, 1).data; if (d[0] + d[1] + d[2] > 60) lit++; } return lit; });
  rec('COMPANY · the selected-month ARR and YoY values are painted in the right margin of the canvas', painted > 3, String(painted));

  /* ---- CUSTOMERS ---- */
  await click(pg, '.lensnav .btn[data-lens="customers"]');
  const cu = await page(pg, 'customers');
  rec('CUSTOMERS · structure: question · headline (customers, ARR/customer, ARR with YoY; logo retention; NRR) · chart 1 · chart 2 · nothing else; no formation canvas or Compare strip beneath', /How is the customer base developing\?/.test(cu.q) && cu.hl.join('|') === 'customers|MRR per customer|MRR|logo retention · R12M|net dollar retention · R12M' && (cu.txt.match(/% y\/y/g) || []).length === 3 && cu.blocks.join(',') === 'lens-head,hl,chb,chb' && cu.charts === 2 && !cu.figVisible && !cu.stripVisible && cu.prose === 0, JSON.stringify(cu.blocks));
  rec('CUSTOMERS · chart 1 is customer base development (customers on the left axis, ARR/customer on a quiet right axis); chart 2 is where ARR growth came from; both the same geometry', cu.titles.join('|') === 'Customer base development|Where did MRR growth come from? · cumulative since M0' && sameGeo(cu.rects) && cu.rects[0].width > 600 && (await D(pg, () => document.querySelectorAll('#lens-customers svg.ch .ax2').length)) === 3, JSON.stringify({ titles: cu.titles, rects: cu.rects }));
  rec('CUSTOMERS · chart 2 decomposes cumulative growth into three components — new customers, existing-base expansion, existing-base contraction + churn — with a net line; every right-edge value is the engine\'s cumulative flow and the identities close exactly',
      cu.rv.indexOf(Math.round(eng.cust).toLocaleString('en-GB')) >= 0 && cu.rv.indexOf(mrrS(eng.cumNew)) >= 0 && cu.rv.indexOf(mrrS(eng.cumExp)) >= 0 && cu.rv.indexOf(mrrS(-eng.cumLoss)) >= 0 && cu.rv.indexOf(mrrS(eng.arr - eng.opening)) >= 0 &&
      Math.abs((eng.cumExp - eng.cumLoss) - eng.cumEx) < 1e-6 && Math.abs(eng.cumNew + eng.cumExp - eng.cumLoss - (eng.arr - eng.opening)) < 1e-6 &&
      cu.rl.join('|').indexOf('new MRR') >= 0 && cu.rl.join('|').indexOf('expansion') >= 0 && cu.rl.join('|').indexOf('leakage') >= 0 && cu.rl.join('|').indexOf('net growth') >= 0 &&
      cu.legend.join(' ').indexOf('existing base · contraction + churn') >= 0 && cu.legend.join(' ').indexOf('existing base · expansion') >= 0 && cu.legend.join(' ').indexOf('new customers') >= 0,
      JSON.stringify({ rv: cu.rv, rl: cu.rl, legend: cu.legend }));
  const dec = await D(pg, () => { const s = [...document.querySelectorAll('#lens-customers svg.ch')][1], W = window.__SP_DEBUG, m = W.selectedMonth();
    const zeroY = s.querySelector('.zero') ? +s.querySelector('.zero').getAttribute('y1') : null;
    const ys = d => (d.match(/-?[\d.]+ (-?[\d.]+)/g) || []).map(t => parseFloat(t.split(' ')[1]));
    const areas = [...s.querySelectorAll('path.ar')].map(p => ({ fill: p.getAttribute('fill'), min: Math.min(...ys(p.getAttribute('d'))), max: Math.max(...ys(p.getAttribute('d'))) }));
    const loss = areas.filter(a => a.fill === 'var(--out)')[0], exp = areas.filter(a => a.fill === 'var(--in)')[0], nw = areas.filter(a => a.fill === 'var(--exp)')[0];
    return { zeroY, areas: areas.length, lossBelow: loss && zeroY !== null && loss.max > zeroY + 1, expAbove: exp && zeroY !== null && exp.min < zeroY - 1 && exp.max <= zeroY + 1.5,
      newAboveExp: nw && exp && nw.min < exp.min, cursors: s.querySelectorAll('.cur').length, lines: s.querySelectorAll('path.ln').length }; });
  rec('CUSTOMERS · the decomposition is drawn as the identity: contraction + churn below the zero line, expansion above it, new customers stacked on top of expansion, one thin net line — three areas, no fourth chart',
      dec.areas === 3 && dec.zeroY !== null && dec.lossBelow && dec.expAbove && dec.newAboveExp && cu.charts === 2, JSON.stringify(dec));
  rec('CUSTOMERS · no bridges and no separate churn, contraction, expansion, GRR or NRR charts — the decomposition lives in chart 2 and nowhere else', !/CUSTOMER BASE · LOGOS|GROWTH = CUSTOMER GROWTH|− left · churned|MOVEMENT/.test(cu.txt) && cu.charts === 2, '');

  /* ---- GROWTH ENGINE ---- */
  await click(pg, '.lensnav .btn[data-lens="growth"]');
  const gr = await page(pg, 'growth');
  rec('GROWTH ENGINE · structure: question · headline (S&M, new ARR, average CAC, marginal CAC, payback) · one control strip (S&M, CAC coefficient, capacity) · chart 1 · chart 2 · nothing else', /How efficiently is growth investment becoming new MRR\?/.test(gr.q) && gr.hl.join('|') === 'S&M · month|new MRR · month|average CAC|marginal CAC|payback · average' && gr.levers.join('|') === 'sm|cacPerARR|maxMonthlyNewARR' && gr.blocks.join(',') === 'lens-head,hl,lever-slot,chb,chb' && gr.charts === 2 && !gr.figVisible && !gr.stripVisible && gr.prose === 0, JSON.stringify(gr.blocks));
  rec('GROWTH ENGINE · chart 1 acquisition efficiency (average vs marginal CAC, measured as thin reference) and chart 2 acquisition payback (average, marginal, realised dots), identical geometry; values at the right edge are the engine\'s', gr.titles[0] === 'Acquisition efficiency' && /^Acquisition payback/.test(gr.titles[1]) && sameGeo(gr.rects) && gr.rv.indexOf(eng.avg.toFixed(2) + '×') >= 0 && gr.rv.indexOf(eng.marg.toFixed(2) + '×') >= 0 && gr.rv.indexOf((eng.avg * 12 / eng.gm).toFixed(1) + ' mo') >= 0 && gr.rv.indexOf((eng.marg * 12 / eng.gm).toFixed(1) + ' mo') >= 0 && eng.marg > eng.avg, JSON.stringify({ titles: gr.titles, rv: gr.rv }));
  rec('GROWTH ENGINE · on Base no dashed Base lines are drawn; Experiment lines are solid', gr.baseLines.every(n => n === 0) && gr.solid.every(Boolean) && !/Base/.test(gr.legend.join('|')), JSON.stringify({ baseLines: gr.baseLines, legend: gr.legend }));
  await D(pg, () => { const i = document.querySelector('#lens-growth .lever input[data-for="sm"]'); i.value = 1200000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(450);
  const gr2 = await page(pg, 'growth');
  const q2 = await D(pg, () => ({ sm: window.__SP_DEBUG.expA.sm, avg: window.__SP_DEBUG.expRes.derived.acquisition.averageCAC, marg: window.__SP_DEBUG.expRes.derived.acquisition.marginalCAC }));
  rec('GROWTH ENGINE · moving the S&M lever to €1.20m: average CAC rises, marginal CAC rises faster (the spread widens toward the capacity); both charts draw Base dashed and thin beneath the solid Experiment', q2.sm === 1200000 && q2.avg > eng.avg && (q2.marg - eng.marg) > (q2.avg - eng.avg) && gr2.rv.indexOf(q2.avg.toFixed(2) + '×') >= 0 && gr2.baseLines.every(n => n >= 2) && /Base/.test(gr2.legend.join('|')) && (await D(pg, () => [...document.querySelectorAll('#lens-growth path.ln.base')].every(p => p.getAttribute('stroke-dasharray') && parseFloat(p.getAttribute('stroke-width')) <= 1.2))), JSON.stringify({ q2, baseLines: gr2.baseLines }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- MONETIZATION ---- */
  await click(pg, '.lensnav .btn[data-lens="monetization"]');
  const mo = await page(pg, 'monetization');
  const vShare = eng.variable / (eng.fixed + eng.variable);
  rec('MONETIZATION · structure: question · headline (ARR, ARR/customer, fixed %, variable %) · control strip (platform fee, usage growth, adoption) · ONE composition chart · nothing else', /What are customers paying for\?/.test(mo.q) && mo.hl.join('|') === 'MRR|MRR per customer|fixed revenue|variable revenue' && mo.txt.includes(Math.round((1 - vShare) * 100) + '%\nfixed revenue') && mo.levers.join('|') === 'monetization.components[0].priceAnnual|monetization.components[1].usageGrowthAnnual|monetization.components[1].adoptionAnnual' && mo.blocks.join(',') === 'lens-head,hl,lever-slot,chb' && mo.charts === 1 && !mo.figVisible && !mo.stripVisible && mo.prose === 0, JSON.stringify(mo.blocks));
  rec('MONETIZATION · the chart stacks exactly FIXED and VARIABLE (the engine\'s components) over 60 months; right-edge values are the month\'s fixed and variable ARR with their shares and the total', mo.titles[0] === 'MRR composition over time' && mo.legend.join('|').indexOf('fixed') >= 0 && mo.legend.join('|').indexOf('variable') >= 0 && !/platform|usage|AI|process/.test(mo.legend.join('|')) && mo.rv.indexOf(mrr(eng.fixed)) >= 0 && mo.rv.indexOf(mrr(eng.variable)) >= 0 && mo.rv.indexOf(mrr(eng.fixed + eng.variable)) >= 0 && /fixed · \d+%/.test(mo.rl.join('|')) && /variable · \d+%/.test(mo.rl.join('|')), JSON.stringify({ rv: mo.rv, rl: mo.rl, legend: mo.legend }));
  await D(pg, () => { const i = document.querySelector('#lens-monetization .lever input[data-for="monetization.components[1].usageGrowthAnnual"]'); i.value = 0.30; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(450);
  const mo2 = await page(pg, 'monetization');
  const v2 = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), x = W.expRes.months[m - 1].monetization; return { share: x.variableARR / (x.fixedARR + x.variableARR) }; });
  rec('MONETIZATION · the usage-growth lever reshapes the composition (variable share rises) and the Base total appears as a quiet dashed reference', v2.share > vShare + 0.005 && mo2.baseLines[0] === 1 && /Base total/.test(mo2.legend.join('|')), JSON.stringify({ v2, vShare, baseLines: mo2.baseLines }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- ECONOMICS & CASH ---- */
  await click(pg, '.lensnav .btn[data-lens="cash"]');
  const ca = await page(pg, 'cash');
  const cashBits = await D(pg, () => ({ zero: document.querySelectorAll('#lens-cash svg.ch .zero').length, marks: [...document.querySelectorAll('#lens-cash svg.ch .mk')].map(e => e.textContent), plClosed: !document.getElementById('pl-details').open, cascadeIn: !!document.querySelector('#pl-slot .cascade') }));
  rec('ECONOMICS & CASH · structure: question · headline (revenue, EBITA, EBITA margin, cash, cash trough) · chart 1 · chart 2 · the waterfall behind one disclosure · nothing else', /How does MRR turn into profit and cash\?/.test(ca.q) && ca.hl.join('|') === 'revenue · R12M|EBITA · R12M|EBITA margin · R12M|cash · M36|cash trough · M' + eng.troughM && ca.blocks.join(',') === 'lens-head,hl,chb,chb,bnd' && ca.charts === 2 && !ca.figVisible && !ca.stripVisible && ca.prose === 0 && cashBits.plClosed && cashBits.cascadeIn, JSON.stringify(ca.blocks));
  rec('ECONOMICS & CASH · chart 1 economics over time (revenue, gross profit, EBITA per month) and chart 2 cash over time (balance, zero line, trough marker with month), identical geometry; right-edge values are the month\'s', ca.titles.join('|') === 'Economics over time · monthly|Cash over time' && sameGeo(ca.rects) && ca.rv.indexOf(eurF(eng.rev)) >= 0 && ca.rv.indexOf(eurF(eng.gp)) >= 0 && ca.rv.indexOf(eurF(eng.ebita)) >= 0 && ca.rv.indexOf(eurF(eng.cash)) >= 0 && cashBits.zero >= 1 && cashBits.marks.some(t => t === 'trough ' + eurF(eng.trough) + ' · M' + eng.troughM), JSON.stringify({ titles: ca.titles, rv: ca.rv, marks: cashBits.marks }));
  rec('ECONOMICS & CASH · no flow diagrams, no primary waterfall', !/PATH 1|PATH 2|billings · invoiced/.test(ca.txt) && cashBits.plClosed, '');

  /* ---- ONE INSTRUMENT ---- */
  const all = await D(pg, () => { const svgs = [...document.querySelectorAll('#side svg.ch')]; return { n: svgs.length, margins: svgs.map(s => s.dataset.l + '/' + s.dataset.r), y1: svgs.map(s => [...s.querySelectorAll('.ax')].filter(t => t.textContent === 'Y1')[0].getAttribute('x')), vb: svgs.map(s => s.getAttribute('viewBox')), curX: svgs.map(s => s.querySelector('.cur').getAttribute('x1')), cursors: svgs.map(s => s.querySelectorAll('.cur').length) }; });
  rec('INSTRUMENT · every chart shares one viewBox height, the same margins, the same Y1–Y5 x positions and one cursor at the same x', all.n === 7 && all.margins.every(x => x === all.margins[0]) && all.y1.every(x => x === all.y1[0]) && all.vb.every(v => v === all.vb[0]) && all.cursors.every(c => c === 1) && all.curX.every(x => x === all.curX[0]), JSON.stringify(all));
  await scrub(pg, 48);
  const moved = await D(pg, () => ({ curX: [...document.querySelectorAll('#side svg.ch .cur')].map(c => c.getAttribute('x1')), tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent), legend: window.__SP_DEBUG.figLegend }));
  rec('TIME · moving the global month moves every chart\'s cursor together, every lens\'s basis tag and the formation legend', moved.curX.every(x => x === moved.curX[0]) && moved.curX[0] !== all.curX[0] && moved.tags.join('|') === 'M48|M48|M48|M48|R12M', JSON.stringify(moved));
  await D(pg, () => { const s = document.querySelector('#lens-cash svg.ch'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5 })); }); await pg.waitForTimeout(300);
  const clicked = await D(pg, () => window.__SP_DEBUG.selectedMonth());
  rec('TIME · clicking a chart moves the global month there', clicked > 20 && clicked < 40, String(clicked));
  await scrub(pg, 36);
  await pg.close();

  /* ---- LABELS at representative widths ---- */
  for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024]]) {
    const q = await open(w, h); await world(q);
    const res = {};
    for (const id of ['customers', 'growth', 'monetization', 'cash']) { await click(q, '.lensnav .btn[data-lens="' + id + '"]'); const p = await page(q, id); res[id] = { collide: p.collide, geo: p.rects.length < 2 || sameGeo(p.rects), w: p.rects[0] && p.rects[0].width, fig: p.figVisible }; }
    const hs = await D(q, () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 || document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth + 1);
    rec('LABELS ' + w + ': no right-edge label collisions on any lens; two-chart pages keep identical geometry; charts use the full column; no horizontal scroll; no formation canvas beneath the other lenses', Object.values(res).every(r => r.collide === 0 && r.geo && r.w > (w <= 768 ? 500 : 700) && !r.fig) && !hs, JSON.stringify(res));
    await q.close();
  }

  /* ---- OFF (fallback only) ---- */
  const o = await open(1440, 900); await click(o, '#rail-toggle'); await click(o, '#pack-arr'); await click(o, '#rail-close'); await scrub(o, 36);
  const off = await D(o, () => ({ cu: document.getElementById('lens-customers').innerText, mo: document.getElementById('lens-monetization').innerText, cuCharts: document.querySelectorAll('#lens-customers svg.ch').length, moCharts: document.querySelectorAll('#lens-monetization svg.ch').length, moLevers: document.querySelectorAll('#lens-monetization .lever').length, notes: [...document.querySelectorAll('#side .offnote')].map(e => e.innerText.length) }));
  rec('OFF · with the layers off each lens still renders (one short line says what is not modelled; charts reduce to what exists); this is a fallback, not the acceptance state', /Customer physics off/i.test(off.cu) && off.cuCharts === 1 && /Monetization physics off/i.test(off.mo) && off.moCharts === 1 && off.moLevers === 0 && off.notes.every(n => n < 160), JSON.stringify({ cuCharts: off.cuCharts, moCharts: off.moCharts, notes: off.notes }));
  await o.close();
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-lens-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
