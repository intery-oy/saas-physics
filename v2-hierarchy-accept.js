/*
 * SaaS Physics — Information hierarchy / cognitive-load pass, DOM-level acceptance checks.
 * Runs the built single file in headless Chromium and checks the interaction architecture
 * the pass introduced (docs/COGNITIVE-LOAD-AUDIT.md):
 *
 *   CHANGE      the rail is a drawer: closed by default, opened from the header, closed by
 *               Close, the scrim or Escape; Details discloses the definitions
 *   LENSES      the five lenses are navigation: one lens on screen, hero above it, figure beneath
 *   P&L         the P&L is Financials' statement of operations; the monthly waterfall is on no lens
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
    await pg.goto(URL); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(800); await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); window.__SP_DEBUG.useBase('arr'); }); await pg.waitForTimeout(400); return pg; };   /* these checks read the ARR-physics world; the portal now opens on the Enterprise world */
  const click = async (pg, sel) => { await pg.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); await pg.waitForTimeout(350); };
  const scrub = async (pg, v) => { await pg.evaluate(v => { const s = document.getElementById('scrub'); s.value = v; s.dispatchEvent(new Event('input')); }, v); await pg.waitForTimeout(250); };
  const vis = (pg, sel) => pg.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
  const rect = (pg, sel) => pg.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, sel);
  const sideText = pg => pg.evaluate(() => document.getElementById('side').innerText);

  const pg = await open(1440, 900);
  await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(400); await scrub(pg, 36);

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
  await click(pg, '#rail-toggle'); await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 1200000; i.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(400); await click(pg, '#rail-close');
  const label1 = await pg.evaluate(() => document.getElementById('rail-toggle').textContent);
  rec('CHANGE: the entry point names the state — "Experiment" when it equals Base, "Experiment · n change(s)" when it differs', /^Experiment$/.test(label0) && /^Experiment · 1 change$/.test(label1), label0 + ' → ' + label1);
  /* the header reads in the order of the journey: world, then see → change → compare → understand, then ⋯ */
  const hdr = await pg.evaluate(() => ({ order: [...document.querySelectorAll('.head h1, .head .nav > .btn, #more-btn')].map(e => e.id || e.tagName),
    more: [...document.querySelectorAll('#more-menu .mi')].map(e => (e.firstChild.textContent || '').trim()), build: !!document.querySelector('#more-menu #about #build-chip'),
    about: !!document.querySelector('#more-menu details#about'), method: !!document.getElementById('keybtn') || !!document.getElementById('key'),
    gone: ['mode-chip', 'nav-scen'].map(id => { const e = document.getElementById(id); return !e || !e.closest('.head'); }), scenIn: !!document.querySelector('.rail #nav-scen') }));
  rec('HEADER: SaaS Physics · World ▾ · Company · Experiment · Compare · System · ⋯ — the ⋯ menu holds Model Ledger, recurring-revenue basis, Guide and About (with the build) — no Method page; no mode chip, no Scenarios in the header, presets entered from the Experiment drawer',
      hdr.order.join(',') === 'H1,nav-base,nav-company,rail-toggle,nav-compare,nav-system,more-btn' && hdr.more.join('|') === 'Model Ledger|Recurring revenue|Guide' && hdr.build && hdr.about && !hdr.method && hdr.gone.every(Boolean) && hdr.scenIn, JSON.stringify(hdr));
  const one = await pg.evaluate(() => ({ slot: document.getElementById('causal-slot').innerHTML.length, live: document.getElementById('nav-compare').classList.contains('live'), chip: document.getElementById('rail-toggle').textContent }));
  rec('COMPANY: with a change, Company carries no comparison of its own — no strip, no spine; the header names the Experiment ("1 change") and Compare is lit as where the difference is read', one.slot === 0 && one.live && /1 change/.test(one.chip), JSON.stringify(one));
  await click(pg, '#reset'); await scrub(pg, 36);

  /* ---- LENSES: navigation ---- */
  const lens0 = await pg.evaluate(() => ({ active: document.getElementById('side').dataset.active, tabsVisible: [...document.querySelectorAll('#side .lens.tab')].filter(e => getComputedStyle(e).display !== 'none').length, hero: !!document.querySelector('#lens-company .hero'), nav: [...document.querySelectorAll('.lensnav .btn')].map(b => b.textContent) }));
  rec('LENSES: Company opens on the hero lens with no tab lens open, and five lenses as navigation', lens0.active === 'company' && lens0.tabsVisible === 0 && lens0.hero && lens0.nav.length === 5 && lens0.nav[4] === 'Financials', JSON.stringify(lens0));
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

  /* ---- P&L through Financials ---- */
  const plOff = await pg.evaluate(() => { const c = document.querySelector('.cascade'); return c ? getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().height > 0 : null; });
  await click(pg, '.lensnav .btn[data-lens="cash"]');
  const plFin = await pg.evaluate(() => { const c = document.querySelector('.cascade'), cap = [...document.querySelectorAll('#lens-cash table.fs caption')].map(x => x.firstChild.textContent.trim());
    return { cascade: !!c && c.getBoundingClientRect().height > 0, first: cap[0], lines: document.querySelectorAll('#lens-cash table.fs')[0].querySelectorAll('tbody tr').length }; });
  rec('P&L: the monthly waterfall is on no lens; the profit and loss is read in Financials as the statement of operations, first of its three statements, line by line', plOff === false && !plFin.cascade && plFin.first === 'Statement of operations' && plFin.lines >= 9, JSON.stringify({ plOff, plFin }));

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

  /* ---- PRESETS: a browser inside the Experiment drawer; Compare analyses the loaded preset ---- */
  await pg.evaluate(() => window.__SP_DEBUG.useBase('arr')); await pg.waitForTimeout(300);   /* recipes are written for the reference model's laws */
  await click(pg, '#rail-toggle'); await click(pg, '#nav-scen');
  const idx = await pg.evaluate(() => { const l = document.getElementById('preset-list'), rows = [...l.querySelectorAll('.prow')].filter(r => !r.hidden && !r.disabled);
    return { inRail: !!l.closest('.rail'), shown: !l.hidden, rows: rows.length, ids: rows.map(r => r.dataset.id).join(','), full: rows.every(r => r.querySelector('.pname').textContent && r.querySelector('.ptitle').textContent && r.querySelector('.plesson').textContent && r.querySelector('.pchg').textContent),
      analysis: l.querySelectorAll('.cause, .recon, details, table, svg, canvas').length, layers: window.__SP_DEBUG.layer }; });
  rec('PRESETS: Browse presets opens the recipe list inside the Experiment drawer (name · title · lesson · what changes) with no analysis in it; on the reference Base all eight recipes apply and no example comparison is offered', idx.inRail && idx.shown && idx.rows === 8 && idx.full && idx.analysis === 0 &&
      idx.ids === 'retention,expansion,efficiency,margin,bounded,lag,billing,hypothesis', JSON.stringify(idx));
  const gate = await pg.evaluate(() => { const D = window.__SP_DEBUG, row = id => document.querySelector('#preset-list .prow[data-id="' + id + '"]');
    D.useBase('wA'); const onA = { ret: row('retention').disabled, why: row('retention').querySelector('.pwhy').textContent, ex: row('customers').hidden };
    D.useBase('ex-customers'); const onEx = { shown: !row('customers').hidden && !row('customers').disabled };
    const before = JSON.stringify(D.frozenBase); row('customers').click(); const after = JSON.stringify(D.frozenBase);
    const r = { onA, onEx, applied: D.activeScenario && D.activeScenario.id, baseSame: before === after, baseIsFrozen: D.baseA === D.frozenBase.a };
    D.useBase('arr'); return r; });
  rec('PRESETS: a recipe that would not mean what its lesson says on this Base is offered but disabled with the reason; an example comparison appears only while its own example Base is frozen; loading one never touches the frozen Base',
      gate.onA.ret && /customer laws/.test(gate.onA.why) && gate.onA.ex && gate.onEx.shown && gate.applied === 'customers' && gate.baseSame && gate.baseIsFrozen, JSON.stringify(gate));
  const layer0 = await pg.evaluate(() => window.__SP_DEBUG.layer);
  await pg.evaluate(() => document.querySelector('#preset-list .prow[data-id="hypothesis"]').click()); await pg.waitForTimeout(400);
  const ld = await pg.evaluate(() => ({ id: window.__SP_DEBUG.activeScenario && window.__SP_DEBUG.activeScenario.id, listHidden: document.getElementById('preset-list').hidden, railOpen: document.querySelector('.app').classList.contains('rail-open'),
    chip: document.getElementById('rail-toggle').textContent, layer: window.__SP_DEBUG.layer, viewed: window.__SP_DEBUG.viewedWorld }));
  rec('PRESETS: choosing one loads it, closes the list and the drawer, keeps the page and views the Experiment; the chip names the preset', ld.id === 'hypothesis' && ld.listHidden && !ld.railOpen && /A retention programme/.test(ld.chip) && ld.layer === layer0 && ld.viewed === 'exp', JSON.stringify(ld));
  await click(pg, '#nav-compare');
  const sc = await pg.evaluate(() => { const c = document.querySelector('#compare-panel .causal'); const det = [...document.querySelectorAll('#side details.bnd:not(.sec)')].map(d => d.querySelector('summary').textContent);
    return { h: c.querySelector('h4').textContent, t: c.querySelector('.ptitle').textContent, msg: c.querySelector('.msg').textContent, order: [...c.querySelectorAll('.cause')].map(e => e.className).join('|'), det, bnd: document.getElementById('side').textContent.includes('cannot switch a layer on or off') }; });
  rec('PRESETS: Compare keeps the preset\'s identity — name, title and lesson — above the causal comparison, and discloses the preset\'s own boundaries', sc.h === 'Preset 14 · A retention programme' && /hypothesis, not a law/.test(sc.t) && /^Moving a law is a decision/.test(sc.msg) && sc.order === 'cause l1|cause l2|cause l3' && sc.det.indexOf('How this preset is set up') >= 0 && sc.det.indexOf('Model boundaries') >= 0 && sc.bnd, JSON.stringify(sc));
  const route = await pg.evaluate(() => ({ bar: !!document.getElementById('scenbar'), clear: !!document.getElementById('scen-clear'), rows: document.querySelectorAll('.scenrow').length, html: /setLayer\('scen'\)|layer==='scen'/.test(document.documentElement.innerHTML) }));
  rec('PRESETS: no standalone Scenarios route remains (no page, bar, index or Clear)', !route.bar && !route.clear && !route.rows && !route.html, JSON.stringify(route));

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
  await click(pg, '#reset'); await click(pg, '#nav-company');
  /* a change that enters at acquisition: acquisition rows primary, everything else secondary */
  await click(pg, '#rail-toggle'); await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 1200000; i.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(400); await click(pg, '#rail-close'); await click(pg, '#nav-compare');
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

  /* ---- ABOUT: the principles, briefly (Step 2B — there is no Method page) ---- */
  const about = await pg.evaluate(() => { const d = document.getElementById('about'); d.open = true; const txt = d.innerText; d.open = false;
    return { title: document.title, txt, paras: d.querySelectorAll('p').length, words: txt.split(/\s+/).length }; });
  rec('ABOUT: the browser title is "SaaS Physics"; About states the few principles — deterministic, laws → state → outputs with KPIs measured not entered, traceable to the Model Ledger, and what it is not — briefly, without release tags or a changelog',
      about.title === 'SaaS Physics' && /Deterministic/.test(about.txt) && /Laws → state → outputs/.test(about.txt) && /measured from the run, never entered/.test(about.txt) && /Model Ledger/.test(about.txt) && /Not a forecast/.test(about.txt) &&
      about.paras === 4 && about.words < 180 && !/v1\.\d|v2 Gate|Gate [A-D]\b|History|FINDINGS/.test(about.txt), JSON.stringify({ paras: about.paras, words: about.words }));
  const bt = await pg.evaluate(() => { const D = window.__SP_DEBUG; return ['acq', 'exp', 'lag', 'cust', 'mon', 'fcf', 'hyp'].map(k => D.boundText ? D.boundText(k) : ''); });
  rec('BOUNDARIES: the live boundary statements on Compare and Scenarios carry no release tags', bt.every(t => !/v1\.\d|v2 Gate|Gate [A-D]\b/.test(t)), bt.filter(t => /v1\.\d|v2 Gate/.test(t)).join(' | '));
  await pg.close();

  /* ---- RESPONSIVE ---- */
  for (const [w, h] of [[1024, 768], [768, 1024], [390, 844]]) {
    const q = await open(w, h);
    await click(q, '#rail-toggle');
    const rr = await rect(q, '.rail');
    await q.evaluate(() => window.__SP_DEBUG.useBase('wA')); await q.waitForTimeout(400); await click(q, '#rail-close'); await scrub(q, 36);
    const st = await q.evaluate(() => { const nav = ['nav-company', 'nav-compare', 'nav-system', 'nav-scen', 'rail-toggle'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.right <= window.innerWidth; });
      const h = document.querySelector('#lens-company').getBoundingClientRect(), n = document.querySelector('.lensnav').getBoundingClientRect(), f = document.getElementById('figwrap').getBoundingClientRect();
      return { nav, order: h.top < n.top && n.top < f.top, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, stageScroll: document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth + 1, open: document.querySelector('.app').classList.contains('rail-open') }; });
    rec('RESPONSIVE ' + w + ': the four surfaces and Change are reachable; the drawer opens ' + (w <= 760 ? 'full width' : 'as a 460px drawer') + ' and closes; hero → lenses → figure; no horizontal scroll', st.nav.every(Boolean) && (w <= 760 ? Math.abs(rr.w - w) <= 1 : rr.w >= 400 && rr.w < w) && !st.open && st.order && !st.hscroll && !st.stageScroll, JSON.stringify({ rail: rr.w, st }));
    await q.evaluate(() => window.__SP_DEBUG.useBase('arr')); await click(q, '#rail-toggle'); await click(q, '#nav-scen'); const pl = await q.evaluate(() => { const r = document.querySelector('#preset-list .prow').getBoundingClientRect(); return r.width > 0 && r.right <= window.innerWidth + 1; });
    await q.evaluate(() => (document.querySelector('#preset-list .prow[data-id="hypothesis"]').click(), document.getElementById('nav-compare').click())); await q.waitForTimeout(500);
    const sx = await q.evaluate(() => ({ pl: 0, eb: document.querySelector('#compare-panel h4').textContent, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
    await click(q, '#nav-system');
    const sy = await q.evaluate(() => { const fb = document.querySelector('.figbox').getBoundingClientRect(); return { fh: fb.height, notes: document.querySelector('.app').classList.contains('notes'), hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }; });
    rec('RESPONSIVE ' + w + ': the preset list, the preset on Compare and the machine render at this width without page-level horizontal scroll', pl && sx.eb === 'Preset 14 · A retention programme' && !sx.hscroll && sy.fh >= 240 && !sy.notes && !sy.hscroll, JSON.stringify({ sx, sy }));
    await q.close();
  }
  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-hierarchy-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
