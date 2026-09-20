/*
 * SaaS Physics — Information hierarchy / cognitive-load pass, DOM-level acceptance checks.
 * Runs the built single file in headless Chromium and checks the interaction architecture
 * the pass introduced (docs/COGNITIVE-LOAD-AUDIT.md):
 *
 *   CHANGE      the rail is a drawer: closed by default, opened from the header, closed by
 *               Close, the scrim or Escape; Details discloses the definitions
 *   LENSES      the five lenses are navigation: one lens on screen, hero above it, figure beneath
 *   P&L         the monthly P&L waterfall lives inside Economics & cash, nowhere else
 *   SYSTEM      the machine takes the stage; Notes is a drawer; drill-down and back work
 *   SCENARIOS   an experiment reads what changed · what stayed the same · what emerged ·
 *               why it matters; the full mechanism and the boundaries are behind disclosure
 *   COMPARE     primary rows first; secondary effects collapsed with a count; nothing lost
 *   INSPECT     the chain is hero + defining rows; bought-under rows are behind disclosure
 *   METHOD      no release archaeology in the current-model text; every boundary conditional
 *   RESPONSIVE  1024 / 768 / 390: navigation reachable, drawer full width on the phone,
 *               hero before lenses before figure, no horizontal scroll
 *
 * No economics are asserted here — the economic suites do that. This suite asserts hierarchy.
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
  const vis = (pg, sel) => pg.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  const rect = (pg, sel) => pg.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, sel);
  const sideText = pg => pg.evaluate(() => document.getElementById('side').innerText);

  const pg = await open(1440, 900);
  await click(pg, '#rail-toggle'); await click(pg, '#pack-wA'); await click(pg, '#rail-close'); await scrub(pg, 36);

  /* ---- CHANGE: a drawer ---- */
  const r0 = await rect(pg, '.rail'), open0 = await pg.evaluate(() => document.querySelector('.app').classList.contains('rail-open'));
  rec('CHANGE: the rail is closed by default — off screen, and the app is not in rail-open', !open0 && r0 && r0.r <= 0, JSON.stringify(r0));
  await click(pg, '#rail-toggle');
  const r1 = await rect(pg, '.rail'), open1 = await pg.evaluate(() => document.querySelector('.app').classList.contains('rail-open')), scrim1 = await vis(pg, '.scrim');
  rec('CHANGE: the header button opens the drawer at the left edge over the company, with a scrim', open1 && r1.l === 0 && r1.w >= 400 && scrim1, JSON.stringify(r1));
  const detailOff = await pg.evaluate(() => { const d = document.querySelector('.rail .force-sub'); return d ? getComputedStyle(d).display : 'none'; });
  await click(pg, '#rail-detail');
  const detailOn = await pg.evaluate(() => { const d = document.querySelector('.rail .force-sub'); return d ? getComputedStyle(d).display : 'none'; });
  await click(pg, '#rail-detail');
  rec('CHANGE: definitions are behind Details — hidden in the compact default, shown when Details is on', detailOff === 'none' && detailOn !== 'none', detailOff + ' → ' + detailOn);
  await click(pg, '#rail-close');
  const open2 = await pg.evaluate(() => document.querySelector('.app').classList.contains('rail-open'));
  await click(pg, '#rail-toggle'); await pg.keyboard.press('Escape'); await pg.waitForTimeout(250);
  const open3 = await pg.evaluate(() => document.querySelector('.app').classList.contains('rail-open'));
  await click(pg, '#rail-toggle'); await pg.evaluate(() => document.getElementById('scrim').click()); await pg.waitForTimeout(250);
  const open4 = await pg.evaluate(() => document.querySelector('.app').classList.contains('rail-open'));
  rec('CHANGE: Close, Escape and the scrim each close the drawer', !open2 && !open3 && !open4, JSON.stringify([open2, open3, open4]));
  const label0 = await pg.evaluate(() => document.getElementById('rail-toggle').textContent);
  await click(pg, '#rail-toggle'); await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 900000; i.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(400); await click(pg, '#rail-close');
  const label1 = await pg.evaluate(() => document.getElementById('rail-toggle').textContent);
  rec('CHANGE: the entry point names the state — "Change" when Experiment equals Base, "Experiment · n change(s)" when it differs', /^Change$/.test(label0) && /^Experiment · 1 change$/.test(label1), label0 + ' → ' + label1);
  const strip = await pg.evaluate(() => { const s = document.querySelector('#causal-slot .cmpstrip'); return s ? s.innerText : ''; });
  rec('COMPANY: with a change, Company carries one line only — n assumptions, the M60 and cash deltas, and a Compare link; the spine is not on Company', /1 assumption/.test(strip) && /Compare/.test(strip) && !(await pg.evaluate(() => !!document.querySelector('#causal-slot .spine'))), strip.replace(/\n/g, ' | '));
  await click(pg, '#reset'); await scrub(pg, 36);

  /* ---- LENSES: navigation ---- */
  const lens0 = await pg.evaluate(() => ({ active: document.getElementById('side').dataset.active, tabsVisible: [...document.querySelectorAll('#side .lens.tab')].filter(e => getComputedStyle(e).display !== 'none').length, hero: !!document.querySelector('#lens-company .hero'), nav: [...document.querySelectorAll('.lensnav .btn')].map(b => b.textContent) }));
  rec('LENSES: Company opens on the hero lens with no tab lens open, and five lenses as navigation', lens0.active === 'company' && lens0.tabsVisible === 0 && lens0.hero && lens0.nav.length === 5 && lens0.nav[4] === 'Economics & cash', JSON.stringify(lens0));
  await click(pg, '.lensnav .btn[data-lens="customers"]');
  const lens1 = await pg.evaluate(() => ({ active: document.getElementById('side').dataset.active, shown: [...document.querySelectorAll('#side .lens.tab')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id), on: document.querySelector('.lensnav .btn.on').dataset.lens }));
  rec('LENSES: choosing Customers shows that one lens and marks it in the navigation', lens1.active === 'customers' && lens1.shown.length === 1 && lens1.shown[0] === 'lens-customers' && lens1.on === 'customers', JSON.stringify(lens1));
  const order = await pg.evaluate(() => { const h = document.querySelector('#lens-company').getBoundingClientRect(), n = document.querySelector('.lensnav').getBoundingClientRect(), l = document.getElementById('lens-customers').getBoundingClientRect(), f = document.getElementById('figwrap').getBoundingClientRect(); return { h: h.top, n: n.top, l: l.top, figH: f.height, csH: document.getElementById('causal-slot').getBoundingClientRect().height }; });
  rec('LENSES: hero above navigation above the active lens; on Customers the formation figure and the Compare strip are not on the page at all (they belong to Company)', order.h < order.n && order.n < order.l && order.figH === 0 && order.csH === 0, JSON.stringify(order));
  await click(pg, '.lensnav .btn[data-lens="growth"]');
  const figG = await pg.evaluate(() => document.getElementById('figwrap').getBoundingClientRect().height);
  rec('LENSES: on Growth engine the formation figure is not on the page (it belongs to Company)', figG === 0, String(figG));
  await scrub(pg, 40);
  const lensKept = await pg.evaluate(() => document.getElementById('side').dataset.active);
  rec('LENSES: the active lens survives a re-render (moving the month keeps Growth engine open)', lensKept === 'growth', lensKept);

  /* ---- P&L through Economics & cash ---- */
  const plOff = await pg.evaluate(() => { const c = document.querySelector('.cascade'); return c ? getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().height > 0 : null; });
  await click(pg, '.lensnav .btn[data-lens="cash"]');
  await pg.evaluate(() => { document.getElementById('pl-details').open = true; });   /* the waterfall is secondary inspection: one disclosure inside Economics & cash */
  const plOn = await pg.evaluate(() => { const c = document.querySelector('.cascade'); const inSlot = !!c && c.parentElement && c.parentElement.id === 'pl-slot' && c.closest('#lens-cash') !== null; return { inSlot, visible: !!c && c.getBoundingClientRect().height > 0, steps: c ? c.querySelectorAll('#cascade .crow, #cascade > *').length : 0 }; });
  rec('P&L: the monthly waterfall is not on Growth engine and is inside Economics & cash behind one disclosure, with its steps', plOff === false && plOn.inSlot && plOn.visible && plOn.steps > 3, JSON.stringify({ plOff, plOn }));

  /* ---- SYSTEM ---- */
  await click(pg, '#nav-system');
  const sys0 = await pg.evaluate(() => { const fb = document.querySelector('.figbox').getBoundingClientRect(), st = document.querySelector('.stage').getBoundingClientRect(), side = document.getElementById('side').getBoundingClientRect(); return { fw: fb.width, sw: st.width, fh: fb.height, sh: st.height, sideOff: side.left >= window.innerWidth - 1, notes: document.querySelector('.app').classList.contains('notes'), view: window.__SP_DEBUG.sysView, crumb: document.querySelector('#pulsebar .btn.on') && document.querySelector('#pulsebar .btn.on').textContent }; });
  rec('SYSTEM: the machine takes the whole stage width and most of its height; the notes drawer is closed and off screen', sys0.fw >= sys0.sw - 2 && sys0.fh >= sys0.sh * 0.6 && sys0.sideOff && !sys0.notes && sys0.view === 'ontology', JSON.stringify(sys0));
  await click(pg, '#notes-toggle');
  const notesOn = await pg.evaluate(() => ({ on: document.querySelector('.app').classList.contains('notes'), left: document.getElementById('side').getBoundingClientRect().left, txt: document.getElementById('side').innerText.length }));
  await click(pg, '#notes-toggle');
  rec('SYSTEM: Notes opens the reading as a right-hand drawer and closes again', notesOn.on && notesOn.left < 1440 && notesOn.txt > 400 && !(await pg.evaluate(() => document.querySelector('.app').classList.contains('notes'))), JSON.stringify(notesOn));
  await click(pg, '#sysview-cash');
  const drill = await pg.evaluate(() => ({ view: window.__SP_DEBUG.sysView, on: document.querySelector('#sysviews .btn.on').textContent }));
  await click(pg, '#sysview-ontology');
  const back = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  rec('SYSTEM: drill-down into Cash and back to the Ontology through the view list', drill.view === 'cash' && drill.on === 'Cash' && back === 'ontology', JSON.stringify({ drill, back }));

  /* ---- SCENARIOS: an experiment ---- */
  await click(pg, '#nav-scen');
  const idx = await pg.evaluate(() => ({ rows: document.querySelectorAll('#side .scenrow').length, cards: document.querySelectorAll('#side .scencard').length, teach: /teach/.test(document.getElementById('side').innerHTML) }));
  rec('SCENARIOS: with no experiment chosen the surface is a fourteen-row index (number · name · title), not fourteen explanation cards', idx.rows === 14 && idx.cards === 0, JSON.stringify(idx));
  await pg.evaluate(() => document.querySelector('#side .scenrow[data-id="hypothesis"]').click()); await pg.waitForTimeout(500);
  const sc = await pg.evaluate(() => { const t = document.getElementById('side').innerText, all = document.getElementById('side').textContent; const eb = [...document.querySelectorAll('#side .sgrp.exp .eyebrow')].map(e => e.textContent);
    const det = [...document.querySelectorAll('#side details.bnd:not(.sec)')].map(d => ({ s: d.querySelector('summary').textContent, open: d.open })); const l2 = document.querySelector('#side .cause.l2 .mech'); return { eb, det, visSpine: !!l2 && !l2.closest('details:not([open])'), allSpine: !!l2 && /What the system did/.test(all), rows: (t.match(/\n/g) || []).length, active: window.__SP_DEBUG.activePack, id: document.querySelector('#scenlist .btn.on') && document.querySelector('#scenlist .btn.on').dataset.id }; });
  rec('SCENARIOS: an experiment reads What changed → What stayed the same → What emerged → Why it matters, in that order', sc.eb.join('|') === 'What changed|What stayed the same|What emerged|Why it matters' && sc.id === 'hypothesis', JSON.stringify(sc.eb));
  rec('SCENARIOS: the full mechanism spine and the model boundaries are present but behind closed disclosure', sc.det.length === 2 && /What the system did/.test(sc.det[0].s) && /Model boundaries/.test(sc.det[1].s) && !sc.det[0].open && !sc.det[1].open && !sc.visSpine && sc.allSpine, JSON.stringify(sc.det));
  const cascadeScen = await pg.evaluate(() => { const c = document.querySelector('.cascade'); return c ? c.getBoundingClientRect().height : 0; });
  rec('SCENARIOS: the P&L waterfall does not compete with the experiment', cascadeScen === 0, String(cascadeScen));

  /* ---- COMPARE: primary first, secondary disclosed ---- */
  await click(pg, '#nav-compare');
  const cmp = await pg.evaluate(() => { const l2 = document.querySelector('#compare-panel .cause.l2'); if (!l2) return null;
    const prim = [...l2.querySelectorAll(':scope > .mech .md')].map(e => e.textContent.trim()), sec = l2.querySelector('details.bnd.sec');
    const secRows = sec ? [...sec.querySelectorAll('.mech .md')].map(e => e.textContent.trim()) : [];
    const heads = [...l2.querySelectorAll(':scope > .mech .mh')].map(e => e.textContent);
    return { prim, heads, sum: sec ? sec.querySelector('summary').textContent : null, secOpen: sec ? sec.open : null, secRows, order: [...document.querySelectorAll('#compare-panel .cause')].map(c => c.className) }; });
  const n = cmp && cmp.sum && cmp.sum.match(/(\d+) additional change/), u = cmp && cmp.sum && cmp.sum.match(/(\d+) unchanged/);
  const secMoved = cmp ? cmp.secRows.filter(d => d !== '=').length : -1, secSame = cmp ? cmp.secRows.filter(d => d === '=').length : -1;
  rec('COMPARE: the spine keeps its three levels; primary rows are the moved rows of the layers the hypothesis entered (installed base, hypothesis), none of them "="', cmp && cmp.order.join('|') === 'cause l1|cause l2|cause l3' && cmp.prim.length >= 3 && cmp.prim.every(d => d !== '=') && cmp.heads.join('|') === 'installed base|hypothesis', JSON.stringify(cmp && { prim: cmp.prim, heads: cmp.heads }));
  rec('COMPARE: secondary effects are collapsed under one summary whose counts equal the rows inside; nothing is dropped', cmp && cmp.secOpen === false && /^Secondary effects · /.test(cmp.sum) && (n ? +n[1] : 0) === secMoved && (u ? +u[1] : 0) === secSame && cmp.secRows.length > 0, JSON.stringify({ sum: cmp && cmp.sum, secMoved, secSame }));
  await click(pg, '#scen-clear'); await click(pg, '#nav-company');
  /* a change that enters at acquisition: acquisition rows primary, everything else secondary */
  await click(pg, '#rail-toggle'); await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 900000; i.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(400); await click(pg, '#rail-close'); await click(pg, '#nav-compare');
  const cmp2 = await pg.evaluate(() => { const l2 = document.querySelector('#compare-panel .cause.l2'); return { heads: [...l2.querySelectorAll(':scope > .mech .mh')].map(e => e.textContent), sec: [...l2.querySelectorAll('details.bnd.sec .mech .mh')].map(e => e.textContent), sum: l2.querySelector('details.bnd.sec summary').textContent }; });
  rec('COMPARE: for an S&M change the primary rows are the acquisition section; the installed base moves only as a secondary effect', cmp2.heads.join('|') === 'acquisition' && cmp2.sec.indexOf('installed base') >= 0 && /additional change/.test(cmp2.sum), JSON.stringify(cmp2));
  await click(pg, '#reset'); await click(pg, '#nav-company');

  /* ---- INSPECT ---- */
  await click(pg, '.lensnav .btn[data-lens="company"]');   /* the formation canvas lives on Company only */
  await scrub(pg, 36);
  const pin = await pg.evaluate(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const x = 64 + (22 / 60) * (r.width - 84);
    for (let y = 30; y < r.height * 0.6; y += 2) { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return y; } } return null; });
  await pg.waitForTimeout(500);
  const insp = await pg.evaluate(() => { const d = document.querySelector('.dossier'); if (!d) return null; const steps = [...d.querySelectorAll('.pstep')].map(s => ({ rows: [...s.querySelectorAll(':scope > .srow')].length, more: s.querySelectorAll('details.more').length, moreOpen: [...s.querySelectorAll('details.more')].some(x => x.open) }));
    return { active: document.getElementById('side').dataset.active, back: !!document.getElementById('inspect-back'), hero: !!document.querySelector('#lens-company .hero'), tabs: [...document.querySelectorAll('#side .lens.tab')].filter(e => getComputedStyle(e).display !== 'none').length, steps, bought: /Bought under/.test(d.innerText), spend: /Spend incurred/.test(d.innerText), spendAll: /Spend incurred/.test(d.textContent) }; });
  rec('INSPECT: pinning a cohort makes Inspect the surface — hero kept, lenses replaced by the chain and a ‹ Company return', pin !== null && insp && insp.active === 'inspect' && insp.back && insp.hero && insp.tabs === 0, JSON.stringify(insp && { active: insp.active, back: insp.back, tabs: insp.tabs }));
  rec('INSPECT: every step shows at most four defining rows; the bought-under provenance is one closed disclosure whose summary names the spend month and CAC', insp && insp.steps.every(s => s.rows <= 4) && insp.steps[1].more === 1 && !insp.steps[1].moreOpen && insp.bought && !insp.spend && insp.spendAll, JSON.stringify(insp && insp.steps));
  await click(pg, '#inspect-back');
  const backL = await pg.evaluate(() => ({ active: document.getElementById('side').dataset.active, tabs: [...document.querySelectorAll('#side .lens.tab')].filter(e => getComputedStyle(e).display !== 'none').length, chain: !!document.querySelector('.dossier') }));
  rec('INSPECT: ‹ Company returns to the Company lens with its chart', backL.active === 'company' && backL.tabs === 0 && !backL.chain, JSON.stringify(backL));

  /* ---- METHOD ---- */
  await click(pg, '#keybtn');
  const key = await pg.evaluate(() => { const k = document.getElementById('key'); const h5 = [...k.querySelectorAll('h5')].map(e => e.textContent); const bi = [...k.querySelectorAll('h5')].filter(e => /Boundaries of the current model/.test(e.textContent))[0];
    const items = bi ? [...bi.parentElement.querySelectorAll('li')].slice(1).map(e => e.textContent) : []; const hist = [...k.querySelectorAll('h5')].filter(e => /History/.test(e.textContent))[0];
    return { title: document.title, txt: k.innerText, h5, items, histTxt: hist ? hist.parentElement.innerText : '' }; });
  await click(pg, '#keyclose');
  const cur = key.txt.replace(key.histTxt, '');
  rec('METHOD: the browser title is "SaaS Physics"; the current-model text carries no release tags (v1.x, Gate A–D) — history has its own section', key.title === 'SaaS Physics' && !/v1\.\d|v2 Gate|Gate [A-D]\b|\bv1\b/.test(cur) && /History/.test(key.h5.join('|')) && /1\.1–1\.3/.test(key.histTxt), (cur.match(/v1\.\d|v2 Gate|Gate [A-D]\b|\bv1\b/g) || []).join(','));
  rec('METHOD: every current boundary is conditional on a layer state — each reads "With … off/at 0/no …" and what enabling the layer changes; none states an absent layer as a fact', key.items.length >= 6 && key.items.every(t => /^(Acquisition|Expansion|Customers|Price|Cash|Fixed costs)\./.test(t)) && key.items.slice(0, 5).every(t => /With /.test(t) && /(Enabling|With a |With the lag|With a capacity|With a cost|With a billing term)/.test(t)) && !/There is no price\.|there are no customers|^FCF = EBITA\./m.test(cur), JSON.stringify(key.items.map(t => t.slice(0, 40))));
  const bt = await pg.evaluate(() => { const D = window.__SP_DEBUG; return ['acq', 'exp', 'lag', 'cust', 'mon', 'fcf', 'hyp'].map(k => D.boundText ? D.boundText(k) : ''); });
  rec('METHOD: the live boundary statements on Compare and Scenarios carry no release tags either', bt.every(t => !/v1\.\d|v2 Gate|Gate [A-D]\b/.test(t)), bt.filter(t => /v1\.\d|v2 Gate/.test(t)).join(' | '));
  await pg.close();

  /* ---- RESPONSIVE ---- */
  for (const [w, h] of [[1024, 768], [768, 1024], [390, 844]]) {
    const q = await open(w, h);
    await click(q, '#rail-toggle');
    const rr = await rect(q, '.rail');
    await click(q, '#pack-wA'); await click(q, '#rail-close'); await scrub(q, 36);
    const st = await q.evaluate(() => { const nav = ['nav-company', 'nav-compare', 'nav-system', 'nav-scen', 'rail-toggle'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.right <= window.innerWidth; });
      const h = document.querySelector('#lens-company').getBoundingClientRect(), n = document.querySelector('.lensnav').getBoundingClientRect(), f = document.getElementById('figwrap').getBoundingClientRect();
      return { nav, order: h.top < n.top && n.top < f.top, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stageScroll: document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth + 1, open: document.querySelector('.app').classList.contains('rail-open') }; });
    rec('RESPONSIVE ' + w + ': the four surfaces and Change are reachable; the drawer opens ' + (w <= 760 ? 'full width' : 'as a 460px drawer') + ' and closes; hero → lenses → figure; no horizontal scroll', st.nav.every(Boolean) && (w <= 760 ? Math.abs(rr.w - w) <= 1 : rr.w >= 400 && rr.w < w) && !st.open && st.order && !st.hscroll && !st.stageScroll, JSON.stringify({ rail: rr.w, st }));
    await click(q, '#nav-scen'); await q.evaluate(() => document.querySelector('#scenlist .btn[data-id="hypothesis"]').click()); await q.waitForTimeout(500);
    const sx = await q.evaluate(() => ({ eb: [...document.querySelectorAll('#side .sgrp.exp .eyebrow')].map(e => e.textContent).join('|'), hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
    await click(q, '#nav-system');
    const sy = await q.evaluate(() => { const fb = document.querySelector('.figbox').getBoundingClientRect(); return { fh: fb.height, notes: document.querySelector('.app').classList.contains('notes'), hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }; });
    rec('RESPONSIVE ' + w + ': the experiment grammar and the machine render at this width without page-level horizontal scroll', sx.eb === 'What changed|What stayed the same|What emerged|Why it matters' && !sx.hscroll && sy.fh >= 240 && !sy.notes && !sy.hscroll, JSON.stringify({ sx, sy }));
    await q.close();
  }
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-hierarchy-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
