/*
 * SaaS Physics — Five-lens visual rebuild, DOM-level acceptance checks.
 *
 * The acceptance world is the Enterprise SaaS configuration with Customer, Monetization and
 * Cash physics ON (pack wA), read at month 36. Every check below is about the rendered
 * hierarchy, not selector existence:
 *
 *   STRUCTURE   per lens: question · headline row · [controls] · the specified charts, nothing
 *               else — no formation canvas or Compare strip beneath the other four lenses
 *   COUNTS      Company 1 canvas · Customers 2 · Growth engine 2 · Monetization 1 · Financials 1
 *               (Financials: three statements over Y1–Y5 and one conversion figure)
 *   RESPONSE    Growth engine chart 1 is not a time series: x is S&M per month, y is New ARR per
 *               month, and it must BE the engine's acquisition function — the operating points,
 *               the ceiling and the average/marginal slopes all read off that one curve
 *   GEOMETRY    on two-chart pages the charts have identical left, width and height; every chart
 *               on the instrument shares the same margins and Y1–Y5 positions
 *   TIME        one cursor per chart at the same x; the global month moves them all; a click on
 *               a chart moves the month
 *   BASE        Base is dashed and thin, present only when it differs; Experiment solid
 *   VALUES      right-edge values are the engine's own fields at the selected month
 *   LABELS      no right-edge label collisions at 1440, 1024 and 768
 *   OFF         null-physics fallbacks render but are not the acceptance state
 */
const H = require('./accept-harness.js');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

H.suite('v2-lens-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  const open = (w, h) => t.open({ viewport: { width: w, height: h }, world: 'wA', label: String(w) });
  const click = (pg, sel) => pg.hit(sel);
  const scrub = (pg, v) => pg.month(v);
  const world = async (pg) => { await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.settle(); await scrub(pg, 36); };
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
      baseLines: svgs.map(s => s.querySelectorAll('path.ln.base').length), solid: svgs.map(s => [...s.querySelectorAll('path.ln:not(.base):not(.sl)')].every(p => !p.getAttribute('stroke-dasharray')))   /* .sl are slope annotations, not series */,
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
  const boot = await D(fresh, () => ({ pack: window.__SP_DEBUG.baseSource, mech: window.__SP_DEBUG.expRes.mechanisms, on: (window.__SP_DEBUG.frozenBase || {}).label, model: (document.querySelector('#lens-company .model') || {}).textContent }));
  await click(fresh, '.lensnav .btn[data-lens="customers"]');
  const bootCu = await page(fresh, 'customers');
  rec('DEFAULT BASE: a fresh load drafts Enterprise and its first freeze runs it, with Customer, Monetization and Cash physics ON — the model chip reads MODEL · ARR · CUSTOMERS · MONETIZATION · CASH', boot.pack === 'wA' && boot.mech.customerPhysics && boot.mech.monetization && boot.mech.cashPhysics && /Enterprise/.test(boot.on) && /MODEL · ARR · Customers · Monetization · Cash/i.test(boot.model), JSON.stringify(boot));
  rec('DEFAULT BASE: opening Customers on a fresh load shows the full lens — five headline items, chart 1 customer base development, chart 2 where ARR growth came from, no fallback note', bootCu.hl.join('|') === 'customers|MRR per customer|MRR|logo retention · R12M|net dollar retention · R12M' && bootCu.charts === 2 && bootCu.titles.join('|') === 'Customer base development|Where did MRR growth come from? · cumulative since M0' && sameGeo(bootCu.rects) && !/physics off/i.test(bootCu.txt), JSON.stringify({ hl: bootCu.hl, titles: bootCu.titles, charts: bootCu.charts }));
  await click(fresh, '.lensnav .btn[data-lens="monetization"]');
  const bootMo = await page(fresh, 'monetization');
  rec('DEFAULT BASE: opening Monetization on a fresh load shows ARR, ARR/customer, fixed %, variable %, the three controls and the stacked FIXED/VARIABLE composition chart', bootMo.hl.join('|') === 'MRR|MRR per customer|fixed revenue|variable revenue' && bootMo.levers.length === 3 && bootMo.charts === 1 && bootMo.titles[0] === 'MRR composition over time' && /fixed · \d+%/.test(bootMo.rl.join('|')) && /variable · \d+%/.test(bootMo.rl.join('|')) && !/physics off/i.test(bootMo.txt), JSON.stringify({ hl: bootMo.hl, levers: bootMo.levers, rl: bootMo.rl }));
  await click(fresh, '.lensnav .btn[data-lens="cash"]');
  const bootCa = await page(fresh, 'cash');
  const bootCash = await D(fresh, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1]; return { cashOn: !!em.cash, term: W.expRes.derived.cash.billingTermMonths, delay: W.expRes.derived.cash.collectionDelayMonths, fcfNeEbita: Math.abs(em.fcf - em.ebita) > 1 }; });
  const bootFin = await D(fresh, () => ({ caps: [...document.querySelectorAll('#lens-cash table.fs caption')].map(c => c.firstChild.textContent.trim()), absent: !!document.querySelector('#lens-cash tr.absent'), nwc: !!document.querySelector('#lens-cash tr.nwc') }));
  rec('DEFAULT BASE: opening Financials on a fresh load shows the statement of operations, working capital and cash flow with Cash physics active (billed 12 months in advance, collected two months later, FCF ≠ EBITA) and one conversion figure', bootFin.caps.join('|') === 'Statement of operations|Working capital|Cash flow' && !bootFin.absent && bootFin.nwc && bootCa.charts === 1 && bootCash.cashOn && bootCash.term === 12 && bootCash.delay === 2 && bootCash.fcfNeEbita && !/physics off/i.test(bootCa.txt), JSON.stringify({ bootFin, bootCash }));
  await fresh.close();

  const pg = await open(1440, 900);
  await world(pg);
  const eng = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), em = W.expRes.months[m - 1], s = W.expRes.months; let cumNew = 0, cumExp = 0, cumLoss = 0; for (let i = 0; i < m; i++) { cumNew += s[i].newARR; cumExp += s[i].expansion; cumLoss += s[i].leakage; } const cumEx = cumExp - cumLoss;
    const tr = s.reduce((a, x, i) => x.cashClosing < a.v ? { v: x.cashClosing, m: i + 1 } : a, { v: Infinity, m: 0 });
    return { m, mech: W.expRes.mechanisms, arr: em.closingARR, yoy: em.arrGrowthYoY, cust: em.customers.closing, cash: em.cashClosing, fixed: em.monetization.fixedARR, variable: em.monetization.variableARR, cumNew, cumEx, cumExp, cumLoss, opening: s[0].openingARR, sm0: em.sm, avg: W.expRes.derived.acquisition.averageCAC, marg: W.expRes.derived.acquisition.marginalCAC, gm: W.expRes.assumptions.grossMargin, ebita: em.ebita, rev: em.revenue, gp: em.grossProfit, trough: tr.v, troughM: tr.m }; });
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
      cu.rl.join('|').indexOf('new MRR') >= 0 && cu.rl.join('|').indexOf('expansion') >= 0 && /contraction\s*\+\s*churn/.test(cu.rl.join('|')) && cu.rl.join('|').indexOf('net growth') >= 0 && !/leakage/i.test(cu.rl.join('|')) && !/leakage/i.test(cu.legend.join(' ')) &&
      cu.legend.join(' ').indexOf('existing base · contraction + churn') >= 0 && cu.legend.join(' ').indexOf('existing base · expansion') >= 0 && cu.legend.join(' ').indexOf('new customers') >= 0,
      JSON.stringify({ rv: cu.rv, rl: cu.rl, legend: cu.legend }));
  /* the geometry IS the equation: sample every path at the selected month's x and read the stack off the drawing */
  const dec = await D(pg, () => { const s = [...document.querySelectorAll('#lens-customers svg.ch')][1], W = window.__SP_DEBUG, m = W.selectedMonth();
    const L = +s.dataset.l, R = +s.dataset.r, xq = L + (m / 60) * (640 - L - R), r2 = v => Math.round(v * 10) / 10;
    const at = d => { const p = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number), o = []; for (let i = 0; i + 1 < p.length; i += 2) if (Math.abs(p[i] - xq) < 0.35) o.push(p[i + 1]); return o; };
    const zeroY = s.querySelector('.zero') ? +s.querySelector('.zero').getAttribute('y1') : null;
    const band = f => { const p = [...s.querySelectorAll('path.ar')].filter(q => q.getAttribute('fill') === f)[0]; if (!p) return null; const y = at(p.getAttribute('d')); return { top: Math.min(...y), bot: Math.max(...y) }; };
    const edge = f => { const p = [...s.querySelectorAll('path.ln')].filter(q => q.getAttribute('stroke') === f && !q.classList.contains('base')); return p.map(q => at(q.getAttribute('d'))[0]); };
    const loss = band('var(--out)'), exp = band('var(--in)'), nw = band('var(--exp)');
    let cn = 0, ce = 0, cl = 0; for (let i = 0; i < m; i++) { cn += W.expRes.months[i].newARR; ce += W.expRes.months[i].expansion; cl += W.expRes.months[i].leakage; }
    const net = at([...s.querySelectorAll('path.ln')].filter(q => q.getAttribute('stroke') === 'var(--ink)')[0].getAttribute('d'))[0];
    const E = zeroY - exp.top, N = exp.top - nw.top, Lo = loss.bot - zeroY;
    return { zeroY: r2(zeroY), loss: { top: r2(loss.top), bot: r2(loss.bot) }, exp: { top: r2(exp.top), bot: r2(exp.bot) }, nw: { top: r2(nw.top), bot: r2(nw.bot) },
      areas: s.querySelectorAll('path.ar').length, net: r2(net), edges: { out: edge('var(--out)').map(r2), in: edge('var(--in)').map(r2), exp: edge('var(--exp)').map(r2) },
      /* contiguity: no gap and no overlap anywhere in the stack */
      stacked: Math.abs(loss.top - zeroY) < 0.2 && Math.abs(exp.bot - zeroY) < 0.2 && Math.abs(nw.bot - exp.top) < 0.2 && loss.bot > zeroY && nw.top < exp.top,
      /* the drawn heights are the engine's numbers in the same scale */
      scaled: Math.abs(E / N - ce / cn) < 0.02 && Math.abs(Lo / N - cl / cn) < 0.02,
      /* the thin line sits exactly at new + expansion − (contraction + churn) */
      netIsIdentity: Math.abs(net - (zeroY - (E + N - Lo))) < 0.35 }; });
  rec('CUSTOMERS · the geometry is the equation: contraction + churn hangs below the zero line, expansion stands on zero, new customers stack on top of expansion with no gap or overlap, each band carries its own boundary, and the thin line sits exactly at new + expansion − contraction − churn',
      dec.areas === 3 && dec.zeroY !== null && dec.stacked && dec.scaled && dec.netIsIdentity &&
      dec.edges.out.length === 1 && Math.abs(dec.edges.out[0] - dec.loss.bot) < 0.2 &&
      dec.edges.in.length === 1 && Math.abs(dec.edges.in[0] - dec.exp.top) < 0.2 &&
      dec.edges.exp.length === 1 && Math.abs(dec.edges.exp[0] - dec.nw.top) < 0.2 && cu.charts === 2, JSON.stringify(dec));
  rec('CUSTOMERS · no bridges and no separate churn, contraction, expansion, GRR or NRR charts — the decomposition lives in chart 2 and nowhere else', !/CUSTOMER BASE · LOGOS|GROWTH = CUSTOMER GROWTH|− left · churned|MOVEMENT/.test(cu.txt) && cu.charts === 2, '');

  /* ---- GROWTH ENGINE ---- */
  await click(pg, '.lensnav .btn[data-lens="growth"]');
  const gr = await page(pg, 'growth');
  rec('GROWTH ENGINE · structure: question · headline (S&M, new ARR, average CAC, marginal CAC, payback) · one control strip (S&M, CAC floor, capacity) · the response curve · the payback chart · one readout line · nothing else', /How efficiently is growth investment becoming new MRR\?/.test(gr.q) && gr.hl.join('|') === 'S&M · month|new MRR · month|average CAC|marginal CAC|payback · average' && gr.levers.join('|') === 'sm|cacPerARR|maxMonthlyNewARR' && gr.blocks.join(',') === 'lens-head,hl,lever-slot,chb,chb,comp-l' && gr.charts === 2 && !gr.figVisible && !gr.stripVisible && gr.prose === 0, JSON.stringify(gr.blocks));
  rec('GROWTH ENGINE · chart 1 is the acquisition RESPONSE — x is S&M per month, y is new ARR per month, no clock — and chart 2 is the payback time series; both keep the instrument\'s frame and geometry',
      /^Acquisition response/.test(gr.titles[0]) && /^Acquisition payback/.test(gr.titles[1]) && sameGeo(gr.rects) &&
      (await D(pg, () => { const a = [...document.querySelectorAll('#lens-growth svg.ch')]; return a[0].dataset.x === 'spend' && a[0].querySelectorAll('.cur').length === 0 && !a[0].textContent.includes('Y1') && a[1].querySelectorAll('.cur').length === 1 && [...a[1].querySelectorAll('.ax')].some(t => t.textContent === 'Y1') && a[0].getAttribute('viewBox') === a[1].getAttribute('viewBox') && a[0].dataset.l === a[1].dataset.l && a[0].dataset.r === a[1].dataset.r; })) &&
      gr.rv.indexOf((eng.avg * 12 / eng.gm).toFixed(1) + ' mo') >= 0 && gr.rv.indexOf((eng.marg * 12 / eng.gm).toFixed(1) + ' mo') >= 0 && eng.marg > eng.avg,
      JSON.stringify({ titles: gr.titles, rv: gr.rv }));
  const curve = await D(pg, () => { const s = document.querySelector('#lens-growth svg.ch[data-x="spend"]'), W = window.__SP_DEBUG, c = W.acqCurve;
    /* the closed form the engine documents, written out independently here */
    const law = sm => c.enabled ? sm / (c.floor + sm / c.cap) : sm / c.floor;
    const worst = c.samples.reduce((a, [sm, n]) => Math.max(a, Math.abs(n - law(sm))), 0);
    const pts = s.querySelector('path.ln:not(.sl):not(.base)').getAttribute('d').replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
    const dot = [...s.querySelectorAll('circle')];
    return { worst, samples: c.samples.length, drawn: pts.length / 2, op: c.op, cap: c.cap, showCap: c.showCap, xMax: c.xMax, yMax: c.yMax,
      slopes: [...s.querySelectorAll('.bkl')].map(e => e.textContent), mark: [...s.querySelectorAll('.mk')].map(e => e.textContent),
      rg: [...s.querySelectorAll('g.rg')].map(g => [g.querySelector('.rl').textContent, g.querySelector('.rv').textContent]),
      capLine: s.querySelectorAll('.cap').length, dots: dot.length, axcap: [...s.querySelectorAll('.axcap')].map(e => e.textContent),
      monotone: c.samples.every((p, i) => i === 0 || p[1] >= c.samples[i - 1][1]),
      concave: c.samples.slice(2).every((p, i) => (p[1] - c.samples[i + 1][1]) <= (c.samples[i + 1][1] - c.samples[i][1]) + 1e-6) }; });
  rec('GROWTH ENGINE · the drawn curve IS the engine\'s acquisition law — every sample equals S&M ÷ (CAC floor + S&M ÷ capacity), the curve rises and bends over (diminishing returns), the operating point is the engine\'s response to this month\'s spend, and the capacity ceiling is drawn where the engine puts it',
      curve.worst < 1e-6 && curve.samples === 97 && curve.drawn === 97 && curve.monotone && curve.concave &&
      Math.abs(curve.op.avg - eng.avg) < 1e-9 && Math.abs(curve.op.marg - eng.marg) < 1e-9 && curve.capLine === 1 && curve.showCap &&
      curve.rg.some(r => r[0] === 'capacity' && r[1] === mrr(curve.cap)) && curve.rg.some(r => r[0] === 'new MRR' && r[1] === mrr(curve.op.n)) &&
      curve.mark.join('|') === 'S&M ' + eurF(curve.op.sm) && curve.axcap.join('|') === 'new MRR / month|S&M / month →',
      JSON.stringify({ worst: curve.worst, rg: curve.rg, mark: curve.mark, slopes: curve.slopes }));
  rec('GROWTH ENGINE · the two slopes on the curve are the two CACs: the chord from the origin is average CAC, the tangent at the operating point is marginal CAC, and the tangent is the flatter of the two because marginal is worse',
      curve.slopes.join('|') === 'average CAC ' + eng.avg.toFixed(2) + '×|marginal CAC ' + eng.marg.toFixed(2) + '×' &&
      Math.abs(1 / curve.op.dn - eng.marg) < 1e-9 && Math.abs(curve.op.n / curve.op.sm - 1 / eng.avg) < 1e-12 && curve.op.dn < curve.op.n / curve.op.sm,
      JSON.stringify({ slopes: curve.slopes, dn: curve.op.dn, chord: curve.op.n / curve.op.sm }));
  rec('GROWTH ENGINE · on Base no dashed Base lines are drawn; Experiment lines are solid', gr.baseLines.every(n => n === 0) && gr.solid.every(Boolean) && !/Base/.test(gr.legend.join('|')), JSON.stringify({ baseLines: gr.baseLines, legend: gr.legend }));
  await D(pg, () => { const i = document.getElementById('f-sm'); i.value = 1200000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.settle();
  const gr2 = await page(pg, 'growth');
  const q2 = await D(pg, () => ({ sm: window.__SP_DEBUG.expA.sm, avg: window.__SP_DEBUG.expRes.derived.acquisition.averageCAC, marg: window.__SP_DEBUG.expRes.derived.acquisition.marginalCAC }));
  const c2 = await D(pg, () => { const s = document.querySelector('#lens-growth svg.ch[data-x="spend"]'), c = window.__SP_DEBUG.acqCurve;
    return { op: c.op, base: c.base, lawMoved: c.lawMoved, floor: c.floor, cap: c.cap, baseCurves: s.querySelectorAll('path.ln.base').length,
      dots: [...s.querySelectorAll('circle')].map(x => x.getAttribute('fill')), mark: [...s.querySelectorAll('.mk')].map(e => e.textContent) }; });
  rec('GROWTH ENGINE · moving the S&M lever to €1.20m slides the operating point ALONG the curve — average CAC rises, marginal rises faster, and the curve itself does not move because the law did not change; Company shows one world, so no Base operating point is drawn (Compare owns the difference)',
      q2.sm === 1200000 && q2.avg > eng.avg && (q2.marg - eng.marg) > (q2.avg - eng.avg) &&
      c2.op.sm === 1200000 && Math.abs(c2.op.avg - q2.avg) < 1e-9 && c2.base.sm === 1200000 && !c2.lawMoved && c2.baseCurves === 0 &&
      c2.dots.length === 1 && c2.mark.length === 1 && c2.mark[0] === 'S&M €1.20m' &&   /* the run's own point only */
      gr2.rv.indexOf((q2.avg * 12 / eng.gm).toFixed(1) + ' mo') >= 0 && !/Base/.test(gr2.legend.join('|')),
      JSON.stringify({ q2, op: c2.op, base: c2.base, lawMoved: c2.lawMoved, dots: c2.dots, mark: c2.mark, legend: gr2.legend }));
  /* the law itself: a cheaper floor lifts the whole curve, a lower capacity bends it sooner */
  await D(pg, () => { const i = document.getElementById('f-cacPerARR'); i.value = 0.8; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.settle();
  const c3 = await D(pg, () => { const s = document.querySelector('#lens-growth svg.ch[data-x="spend"]'), c = window.__SP_DEBUG.acqCurve;
    const law = sm => c.enabled ? sm / (c.floor + sm / c.cap) : sm / c.floor;
    return { floor: c.floor, lawMoved: c.lawMoved, baseCurves: s.querySelectorAll('path.ln.base').length, n: c.op.n, worst: c.samples.reduce((a, [sm, n]) => Math.max(a, Math.abs(n - law(sm))), 0) }; });
  await D(pg, () => { const i = document.getElementById('f-maxMonthlyNewARR'); i.value = 600000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.settle();
  const c4 = await D(pg, () => { const c = window.__SP_DEBUG.acqCurve; return { cap: c.cap, used: c.op.used, marg: c.op.marg, n: c.op.n }; });
  rec('GROWTH ENGINE · changing the law changes the CURVE: a cheaper CAC floor lifts it (more new ARR for the same spend), with no Base law drawn beside it on Company; a lower capacity bends it sooner, so the same spend buys less and marginal CAC climbs',
      c3.floor === 0.8 && !c3.lawMoved && c3.baseCurves === 0 && c3.n > c2.op.n && c3.worst < 1e-6 &&
      c4.cap === 600000 && c4.n < c3.n && c4.marg > c2.op.marg && c4.used > c2.op.used,
      JSON.stringify({ c3, c4 }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- MONETIZATION ---- */
  await click(pg, '.lensnav .btn[data-lens="monetization"]');
  const mo = await page(pg, 'monetization');
  const vShare = eng.variable / (eng.fixed + eng.variable);
  rec('MONETIZATION · structure: question · headline (ARR, ARR/customer, fixed %, variable %) · control strip (platform fee, usage growth, adoption) · ONE composition chart · nothing else', /What are customers paying for\?/.test(mo.q) && mo.hl.join('|') === 'MRR|MRR per customer|fixed revenue|variable revenue' && mo.txt.includes(Math.round((1 - vShare) * 100) + '%\nfixed revenue') && mo.levers.join('|') === 'monetization.components[0].priceAnnual|monetization.components[1].usageGrowthAnnual|monetization.components[1].adoptionAnnual' && mo.blocks.join(',') === 'lens-head,hl,lever-slot,chb' && mo.charts === 1 && !mo.figVisible && !mo.stripVisible && mo.prose === 0, JSON.stringify(mo.blocks));
  rec('MONETIZATION · the chart stacks exactly FIXED and VARIABLE (the engine\'s components) over 60 months; right-edge values are the month\'s fixed and variable ARR with their shares and the total', mo.titles[0] === 'MRR composition over time' && mo.legend.join('|').indexOf('fixed') >= 0 && mo.legend.join('|').indexOf('variable') >= 0 && !/platform|usage|AI|process/.test(mo.legend.join('|')) && mo.rv.indexOf(mrr(eng.fixed)) >= 0 && mo.rv.indexOf(mrr(eng.variable)) >= 0 && mo.rv.indexOf(mrr(eng.fixed + eng.variable)) >= 0 && /fixed · \d+%/.test(mo.rl.join('|')) && /variable · \d+%/.test(mo.rl.join('|')), JSON.stringify({ rv: mo.rv, rl: mo.rl, legend: mo.legend }));
  await D(pg, () => { const i = document.getElementById('f-monetization.components[1].usageGrowthAnnual'); i.value = 0.30; i.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.settle();
  const mo2 = await page(pg, 'monetization');
  const v2 = await D(pg, () => { const W = window.__SP_DEBUG, m = W.selectedMonth(), x = W.expRes.months[m - 1].monetization; return { share: x.variableARR / (x.fixedARR + x.variableARR) }; });
  rec('MONETIZATION · the usage-growth lever reshapes the composition (variable share rises); Company shows one world, so no Base total is drawn', v2.share > vShare + 0.005 && mo2.baseLines[0] === 0 && !/Base/.test(mo2.legend.join('|')), JSON.stringify({ v2, vShare, baseLines: mo2.baseLines }));
  await click(pg, '#rail-toggle'); await click(pg, '#reset'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- FINANCIALS ---- */
  await click(pg, '.lensnav .btn[data-lens="cash"]');
  const ca = await page(pg, 'cash');
  /* at M36 three years have closed: Y1–Y3 are annual statements, Y4 and Y5 have not begun */
  const fin = await D(pg, () => { const t = [...document.querySelectorAll('#lens-cash table.fs')];
    const rowOf = (tab, re) => { const r = [...tab.querySelectorAll('tbody tr')].find(tr => re.test((tr.querySelector('td.l') || {}).textContent || '')); return r ? [...r.querySelectorAll('td[data-fr]')].map(td => td.textContent) : null; };
    return { caps: t.map(x => x.querySelector('caption').firstChild.textContent.trim()), heads: [...t[0].querySelectorAll('th[data-fs]')].map(th => th.textContent),
      rev: rowOf(t[0], /^Revenue/), ebita: rowOf(t[2], /^EBITA$/), fcf: rowOf(t[2], /^Cash free cash flow/), cashEnd: rowOf(t[2], /^Cash at end of period/), wcHeads: [...t[1].querySelectorAll('th[data-fs]')].map(th => th.textContent),
      ok: (document.querySelector('#lens-cash [data-fc]') || {}).textContent, pl: !!document.getElementById('pl-details'), cascadeInLens: !!document.querySelector('#lens-cash .cascade') }; });
  const fk = v => { if (Math.abs(v) < 0.5) return '—'; const k = Math.round(v / 1000); if (k === 0) return '0'; const r = Math.abs(k).toLocaleString('en-GB'); return v < 0 ? '(' + r + ')' : r; };
  const yrSum = await D(pg, () => { const s = window.__SP_DEBUG.expRes.months, out = []; for (let y = 1; y <= 3; y++) { let r = 0, e = 0, f = 0; for (let t = 12 * y - 11; t <= 12 * y; t++) { r += s[t - 1].revenue; e += s[t - 1].ebita; f += s[t - 1].fcf; } out.push({ r, e, f, c: s[12 * y - 1].cashClosing }); } return out; });
  rec('FINANCIALS · structure: question · three statements (operations, working capital, cash flow) over Y1–Y5 · one conversion figure · no formation canvas, no Compare strip, no waterfall disclosure', /translate into profit, working capital and cash\?/.test(ca.q) && fin.caps.join('|') === 'Statement of operations|Working capital|Cash flow' && ca.charts === 1 && !ca.figVisible && !ca.stripVisible && !fin.pl && !fin.cascadeInLens, JSON.stringify({ caps: fin.caps, charts: ca.charts }));
  rec('FINANCIALS · at M36 Y1–Y3 are closed annual statements and Y4–Y5 have not begun: their columns are blank and their heads name the month they open', fin.heads.join('|') === 'M1–M12|M13–M24|M25–M36|opens M37|opens M49' && fin.wcHeads.join('|') === fin.heads.join('|') && fin.rev.slice(3).every(v => v === '') && fin.cashEnd.slice(3).every(v => v === ''), JSON.stringify({ heads: fin.heads, rev: fin.rev }));
  rec('FINANCIALS · values: each closed year\'s revenue, EBITA and cash free cash flow are the sums of its twelve engine months, closing cash the engine\'s M12/M24/M36 balance, and the direct-method check agrees', [0, 1, 2].every(i => fin.rev[i] === fk(yrSum[i].r) && fin.ebita[i] === fk(yrSum[i].e) && fin.fcf[i] === fk(yrSum[i].f) && fin.cashEnd[i] === fk(yrSum[i].c)) && /^✓ agrees/.test(fin.ok) && fin.cashEnd[2] === fk(eng.cash), JSON.stringify({ rev: fin.rev, ebita: fin.ebita, cashEnd: fin.cashEnd }));

  /* ---- ONE INSTRUMENT ---- */
  const all = await D(pg, () => { const every = [...document.querySelectorAll('#side svg.ch')].filter(s => !s.closest('#lens-cash')), t = every.filter(s => !s.dataset.x), sp = every.filter(s => s.dataset.x === 'spend');
    const fs = document.querySelector('#lens-cash svg.ch');   /* the Financials figure: its own height and two panes, the same frame and clock */
    return { n: every.length, time: t.length, spend: sp.length, margins: every.map(s => s.dataset.l + '/' + s.dataset.r), vb: every.map(s => s.getAttribute('viewBox')),
      y1: t.map(s => [...s.querySelectorAll('.ax')].filter(x => x.textContent === 'Y1')[0].getAttribute('x')),
      curX: t.map(s => s.querySelector('.cur').getAttribute('x1')), cursors: t.map(s => s.querySelectorAll('.cur').length),
      spendClock: sp.map(s => s.querySelectorAll('.cur').length),
      fin: { m: fs.dataset.l + '/' + fs.dataset.r, y1: [...fs.querySelectorAll('.ax')].filter(x => x.textContent === 'Y1')[0].getAttribute('x'), cur: [...fs.querySelectorAll('.cur')].map(c => c.getAttribute('x1')) } }; });
  rec('INSTRUMENT · every chart shares one viewBox height and the same margins; the four lens time charts share the Y1–Y5 x positions and one cursor at the same x; the response curve keeps the frame but carries no clock, because its x-axis is money; the Financials figure keeps the same margins, Y1–Y5 positions and cursor x in each of its panes', all.n === 5 && all.time === 4 && all.fin.m === all.margins[0] && all.fin.y1 === all.y1[0] && all.fin.cur.length >= 1 && all.fin.cur.every(x => x === all.curX[0]) && all.spend === 1 && all.margins.every(x => x === all.margins[0]) && all.y1.every(x => x === all.y1[0]) && all.vb.every(v => v === all.vb[0]) && all.cursors.every(c => c === 1) && all.curX.every(x => x === all.curX[0]) && all.spendClock.every(c => c === 0), JSON.stringify(all));
  await scrub(pg, 48);
  const moved = await D(pg, () => ({ curX: [...document.querySelectorAll('#side svg.ch:not([data-x]) .cur')].map(c => c.getAttribute('x1')), tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent), legend: window.__SP_DEBUG.figLegend }));
  rec('TIME · moving the global month moves every chart\'s cursor together, every lens\'s basis tag and the formation legend', moved.curX.every(x => x === moved.curX[0]) && moved.curX[0] !== all.curX[0] && moved.tags.join('|') === 'M48|M48|M48|M48|Y1–Y5', JSON.stringify(moved));
  await D(pg, () => { const s = document.querySelector('#lens-cash svg.ch'); const r = s.getBoundingClientRect(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5 })); }); await pg.paint();
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
    /* the response curve carries in-plot labels the other charts do not: the axis captions, the
       ceiling tag, the two slope readings and the spend under the operating point */
    await click(q, '.lensnav .btn[data-lens="growth"]');
    const curveLab = {};
    for (const sm of [0, 700000, 1500000, 2500000]) {
      await D(q, v => { const i = document.getElementById('f-sm'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, sm);
      await q.paint();
      curveLab['sm' + sm] = await D(q, () => { const s = document.querySelector('#lens-growth svg.ch[data-x="spend"]'), box = s.getBoundingClientRect();
        const els = [...s.querySelectorAll('g.rg, text.bkl, text.mk, text.capl, text.axcap, text.ax')];
        let c = 0; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].getBoundingClientRect(), d = els[j].getBoundingClientRect();
          if (a.top < d.bottom && d.top < a.bottom && a.left < d.right && d.left < a.right) c++; }
        return { c, out: els.some(e => { const r = e.getBoundingClientRect(); return r.right > box.right + 1 || r.left < box.left - 1; }) }; });
    }
    rec('LABELS ' + w + ': on the response curve the axis captions, the ceiling tag, the two slope readings and the spend under the operating point never print over each other or leave the frame — at €0, €700k, €1.50m and €2.50m of S&M',
        Object.values(curveLab).every(r => r.c === 0 && !r.out), JSON.stringify(curveLab));
    await q.close();
  }

  /* ---- OFF (fallback only) ---- */
  const o = await open(1440, 900); await o.evaluate(() => window.__SP_DEBUG.useBase('arr')); await o.settle(); await scrub(o, 36);
  const off = await D(o, () => ({ cu: document.getElementById('lens-customers').innerText, mo: document.getElementById('lens-monetization').innerText, cuCharts: document.querySelectorAll('#lens-customers svg.ch').length, moCharts: document.querySelectorAll('#lens-monetization svg.ch').length, moLevers: document.querySelectorAll('#lens-monetization .lever').length, notes: [...document.querySelectorAll('#side .offnote')].map(e => e.innerText.length) }));
  rec('OFF · with the layers off each lens still renders (one short line says what is not modelled; charts reduce to what exists); this is a fallback, not the acceptance state', /Customer physics off/i.test(off.cu) && off.cuCharts === 1 && /Monetization physics off/i.test(off.mo) && off.moCharts === 1 && off.moLevers === 0 && off.notes.every(n => n < 160), JSON.stringify({ cuCharts: off.cuCharts, moCharts: off.moCharts, notes: off.notes }));
  await o.close();
  });
