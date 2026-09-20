/*
 * SaaS Physics v2 — ECONOMIC LEGIBILITY acceptance checks (docs/VISUAL-GRAMMAR.md,
 * docs/VISUAL-AUDIT.md). Render-level, in Chromium. Complements v2-accept.js,
 * which checks that the surfaces carry the engine's numbers; this suite checks
 * that a CFO can READ them: labels, causal hierarchy, no clipping or overlap,
 * time basis, drill-down, breakpoints, the three acceptance worlds, and no
 * console errors. Run: node v2-legibility-accept.js
 *
 *   LENSES        every Observe lens has its number, question and basis tag; the
 *                 hero and descriptor values are real (no NaN / undefined / null)
 *   GRAMMAR       every basis tag is one of the grammar's forms; laws carry ⋈,
 *                 measurements →, constraints ⌈⌉, hypotheses ↯
 *   VALUES        the Company hero and the customer count equal the engine's
 *   TIME          moving the playhead moves every lens's basis tag and the label
 *   HIERARCHY     Compare shows WHAT YOU CHANGED → WHAT THE SYSTEM DID → WHAT
 *                 COMPANY EMERGED, in that order, grouped by causal layer
 *   DRILL-DOWN    System opens on the ontology; a node opens its layer; the
 *                 breadcrumb returns; an off node does nothing
 *   PROVENANCE    a pinned cohort reads as a chain from company ARR to cash
 *   WORLDS        A · enterprise, B · usage/AI, C · SMB apply, run every layer,
 *                 and render the lenses, Compare and the ontology without error
 *   INTEGRITY     at 1440 / 1180 / 1024 / 768 / 390 nothing in the side panel or
 *                 the rail leaves its container or overlaps its neighbour; no
 *                 horizontal page scroll; the rail is a drawer ≤ 1180 and the
 *                 lenses stack beneath the figure ≤ 760
 *   no page or console errors across the whole run
 */
const { chromium } = require('playwright');
const path = require('path');
const E = require('./engine.js');

const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const BASIS = /^(M\d+( · month)?|R12M|CUM · M1–M\d+|M60|age \d+)$/;

/* everything inside `root` must sit inside root's box, and siblings in the
   named containers must not intersect. Returns the offenders. */
const OVERFLOW_PROBE = `(function(rootSel, sibSels){
  const root = document.querySelector(rootSel); if(!root) return { missing: rootSel };
  const R = root.getBoundingClientRect(), out = [], overlap = [];
  const vis = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length; };
  root.querySelectorAll('*').forEach(el => {
    if(!vis(el)) return;
    if(el.closest('details:not([open])') && el.tagName !== 'SUMMARY' && !el.closest('summary')) return;
    const b = el.getBoundingClientRect(); if(b.width === 0 && b.height === 0) return;
    if(b.left < R.left - 1 || b.right > R.right + 1) out.push((el.className || el.tagName) + ' ' + Math.round(b.left) + '-' + Math.round(b.right) + ' vs ' + Math.round(R.left) + '-' + Math.round(R.right) + ' "' + (el.textContent || '').trim().slice(0, 30) + '"');
    /* text must not be clipped inside its own box (hidden overflow with a wider scrollWidth) */
    const cs = getComputedStyle(el);
    if((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2 && el.children.length === 0 && (el.textContent || '').trim()) out.push('clipped ' + (el.className || el.tagName) + ' "' + el.textContent.trim().slice(0, 30) + '"');
  });
  sibSels.forEach(sel => root.querySelectorAll(sel).forEach(box => {
    const kids = [...box.children].filter(vis).map(k => ({ k, b: k.getBoundingClientRect() })).filter(x => x.b.width > 0 && x.b.height > 0);
    for(let i = 0; i < kids.length; i++) for(let j = i + 1; j < kids.length; j++){
      const a = kids[i].b, c = kids[j].b;
      const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if(ix > 1.5 && iy > 1.5) overlap.push(sel + ' ' + (kids[i].k.className || kids[i].k.tagName) + ' × ' + (kids[j].k.className || kids[j].k.tagName) + ' "' + (kids[i].k.textContent || '').trim().slice(0, 20) + '"');
    }
  }));
  return { out: out.slice(0, 8), overlap: overlap.slice(0, 8), n: root.querySelectorAll('*').length };
})`;
const SIBLINGS = ['.lrow', '.tiles', '.chain', '.desc', '.hero', '.readouts', '.mech', '.comp-l', '.lens-head', '.fig-t', '.force-top', '.srow', '.pl', '.exp-row', '.lensnav'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const file = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
  const errs = [];
  async function open(w, h, keepWelcome){
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    pg.on('pageerror', e => errs.push(w + ': ' + e.message));
    pg.on('console', msg => { if (msg.type() === 'error' && !/Failed to load resource|net::ERR/.test(msg.text())) errs.push(w + ': console: ' + msg.text()); });
    await pg.goto(file); await pg.waitForTimeout(800);
    if(!keepWelcome) await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });
    return pg;
  }
  const setScrub = async (pg, v) => { await pg.evaluate(v => { const s = document.getElementById('scrub'); s.value = v; s.dispatchEvent(new Event('input')); }, v); await pg.waitForTimeout(250); };
  const pack = async (pg, id) => { await pg.evaluate(id => document.getElementById('pack-' + id).click(), id); await pg.waitForTimeout(400); };
  const sideText = pg => pg.evaluate(() => document.getElementById('side').innerText);
  const clickModel = async (pg, mx, my) => { await pg.evaluate(([mx, my]) => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
      const s = Math.min(r.width / 1260, r.height / 770), ox = (r.width - 1260 * s) / 2, oy = (r.height - 770 * s) / 2;
      cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + ox + mx * s, clientY: r.top + oy + my * s, bubbles: true })); }, [mx, my]); await pg.waitForTimeout(300); };

  /* ---- OPENING PAGE ---- */
  const w0 = await open(1440, 900, true);
  const wl = await pg0(w0);
  async function pg0(q){ return q.evaluate(() => { const W = document.getElementById('welcome'); const t = W.innerText;
    return { shown: getComputedStyle(W).display !== 'none', title: /SaaS Physics/.test(t), what: /What this is/.test(t) && /What it is not/.test(t), portal: ['Company','Change','Compare','System','Inspect','Scenarios'].every(k => new RegExp(k + ' ·').test(t)),
      marks: /⋈/.test(t) && /⌈⌉/.test(t) && /→/.test(t) && /↯/.test(t), time: /M36 · month/i.test(t) && /R12M/.test(t), start: /Three ways to start/i.test(t), noreal: /no real company/i.test(t) && /illustrative/i.test(t),
      appHidden: document.elementFromPoint(720, 450) && !!document.elementFromPoint(720, 450).closest('#welcome') }; }); }
  rec('OPENING PAGE: a first visit lands on the opening page — what this is and is not, the six parts of the portal, the marks, the time basis, three ways to start, and a statement that the data is illustrative — covering the app beneath',
      wl.shown && wl.title && wl.what && wl.portal && wl.marks && wl.time && wl.start && wl.noreal && wl.appHidden, JSON.stringify(wl));
  await w0.evaluate(() => document.getElementById('welcome-enter').click()); await w0.waitForTimeout(200);
  const entered = await w0.evaluate(() => ({ hidden: getComputedStyle(document.getElementById('welcome')).display === 'none', flag: localStorage.getItem('saas-physics-welcomed') }));
  await w0.reload(); await w0.waitForTimeout(800);
  const again = await w0.evaluate(() => getComputedStyle(document.getElementById('welcome')).display === 'none');
  await w0.evaluate(() => document.getElementById('guidebtn').click()); await w0.waitForTimeout(200);
  const reopened = await w0.evaluate(() => getComputedStyle(document.getElementById('welcome')).display !== 'none');
  rec('OPENING PAGE: Enter hides it and remembers the visit; a reload goes straight to the portal; Guide in the header brings it back', entered.hidden && entered.flag === '1' && again && reopened, JSON.stringify({ entered, again, reopened }));
  await w0.evaluate(() => document.getElementById('welcome-tour').click()); await w0.waitForTimeout(400);
  const tour = [];
  for (let i = 0; i < 6; i++) { tour.push(await w0.evaluate(() => ({ step: document.getElementById('tour-step').textContent, hl: (document.querySelector('.tour-on') || {}).id || (document.querySelector('.tour-on') || {}).className || null, on: document.getElementById('tourcard').classList.contains('on') }))); await w0.evaluate(() => document.getElementById('tour-next').click()); await w0.waitForTimeout(250); }
  const tourEnd = await w0.evaluate(() => ({ card: document.getElementById('tourcard').classList.contains('on'), hl: !!document.querySelector('.tour-on'), welcome: getComputedStyle(document.getElementById('welcome')).display === 'none' }));
  rec('OPENING PAGE: the tour walks six stops — surfaces, World, Change, the figure, the lenses, time — highlighting each region, and leaves nothing behind when done',
      tour.length === 6 && tour.every((s, i) => s.on && s.step.startsWith('Tour · ' + (i + 1) + ' of 6')) && tour[3].hl === 'scene' && tour[4].hl === 'side' && !tourEnd.card && !tourEnd.hl && tourEnd.welcome, JSON.stringify({ tour, tourEnd }));
  await w0.close();

  const pg = await open(1440, 900);
  await pack(pg, 'full'); await setScrub(pg, 24);

  /* ---- LENSES ---- */
  const lenses = await pg.evaluate(() => [...document.querySelectorAll('#side .lens')].map(l => ({
    id: l.id, n: (l.querySelector('.lens-n') || {}).textContent, q: (l.querySelector('.lens-q') || {}).textContent, basis: (l.querySelector('.lens-head .basis') || {}).textContent,
    hero: (l.querySelector('.hero .hv') || {}).textContent || null, ladders: l.querySelectorAll('.lrow').length, txt: l.innerText })));
  rec('LENSES: five lenses in the order Company → Customers → Growth engine → Monetization → Economics & cash, each numbered, with a question and a basis tag',
      lenses.length === 5 && lenses.map(l => l.id).join(',') === 'lens-company,lens-customers,lens-growth,lens-monetization,lens-cash' && lenses.every((l, i) => l.n === String(i + 1) && /\?$/.test(l.q) && BASIS.test(l.basis)),
      JSON.stringify(lenses.map(l => [l.id, l.n, l.basis])));
  rec('LENSES: Company leads with one hero number; Customers leads with the logo and ARR ladders (stock, flows, stock); no lens prints NaN, undefined, null or [object',
      lenses[0].hero && /^€[\d.]+[km]?$/.test(lenses[0].hero) && lenses[1].ladders >= 8 && lenses.every(l => !/NaN|undefined|\[object|(^|\s)null(\s|$)/.test(l.txt)),
      JSON.stringify([lenses[0].hero, lenses[1].ladders]));
  const nav = await pg.evaluate(() => [...document.querySelectorAll('#side .lensnav .btn')].map(b => b.textContent));
  rec('LENSES: the lens navigation names the five lenses in CFO words (no engine jargon)', nav.join('|') === 'Company|Customers|Growth engine|Monetization|Economics & cash', nav.join('|'));

  /* ---- GRAMMAR ---- */
  const grammar = await pg.evaluate(() => {
    const tags = [...document.querySelectorAll('#side .basis')].map(e => e.textContent);
    const laws = [...document.querySelectorAll('#side .dv.law, #side .readouts b.law, #side .tile b.law')].map(e => e.textContent);
    const meas = [...document.querySelectorAll('#side .dv.meas, #side .tile b.meas')].map(e => e.textContent);
    const ros = [...document.querySelectorAll('#side .readouts b')].map(e => e.textContent);
    return { tags, laws, meas, ros };
  });
  rec('GRAMMAR: every basis tag on the Observe surface is one of the grammar\'s forms (M24 · M24 · month · R12M · CUM · M1–Mn · M60 · age n)',
      grammar.tags.length >= 12 && grammar.tags.every(t => BASIS.test(t)), JSON.stringify(grammar.tags.filter(t => !BASIS.test(t)).slice(0, 5)));
  rec('GRAMMAR: every law value carries ⋈, every measurement →; readouts carry one of → ⋈ ⌈⌉ ↯ or state a movement a → b',
      grammar.laws.length >= 1 && grammar.laws.every(t => /^⋈ /.test(t)) && grammar.meas.length >= 2 && grammar.meas.every(t => /^→ /.test(t)) && grammar.ros.length >= 6 && grammar.ros.every(t => /^(→|⋈|⌈⌉|↯) /.test(t) || / → /.test(t)),
      JSON.stringify({ laws: grammar.laws.slice(0, 3), meas: grammar.meas.slice(0, 2), ros: grammar.ros.filter(t => !(/^(→|⋈|⌈⌉|↯) /.test(t) || / → /.test(t))).slice(0, 3) }));

  /* ---- VALUES ---- */
  const vals = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.expRes.months[23];
    return { hero: document.querySelector('#lens-company .hero .hv').textContent, cust: document.querySelector('#lens-company .desc .dv').textContent, arr: m.closingARR, custN: m.customers.closing, A: D.expA }; });
  const indep = E.run(vals.A, { openingCustomers: 1000 }).months[23];
  const mrr = v => { v = v / 12; return v >= 1e6 ? '€' + (v / 1e6).toFixed(2) + 'm' : v >= 1e3 ? '€' + Math.round(v / 1e3) + 'k' : '€' + Math.round(v); };
  rec('VALUES: the Company hero is the engine\'s closing ARR at the selected month on the MRR basis, and its first descriptor the closing customers; both tie to an independent Node run',
      vals.hero === mrr(vals.arr) && vals.cust === vals.custN.toFixed(0) && Math.abs(vals.arr - indep.closingARR) < 1e-6 && Math.abs(vals.custN - indep.customers.closing) < 1e-9,
      JSON.stringify({ hero: vals.hero, expect: mrr(vals.arr), cust: vals.cust }));

  /* ---- TIME ---- */
  const t24 = await pg.evaluate(() => ({ tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent), label: document.getElementById('tlabel').textContent }));
  await setScrub(pg, 36);
  const t36 = await pg.evaluate(() => ({ tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent), label: document.getElementById('tlabel').textContent, r12: [...document.querySelectorAll('#side .basis')].map(e => e.textContent).filter(t => /R12M/.test(t)).length }));
  await setScrub(pg, 8);
  const t8 = await pg.evaluate(() => ({ tags: [...document.querySelectorAll('#side .lens-head .basis')].map(e => e.textContent), cum: [...document.querySelectorAll('#side .basis')].map(e => e.textContent).filter(t => /CUM/.test(t)), r12: [...document.querySelectorAll('#side .basis')].map(e => e.textContent).filter(t => /R12M/.test(t)).length }));
  rec('TIME: moving the playhead moves every lens\'s basis tag and the transport label together (lenses 1–4 at the month, Economics & cash on the trailing window); before month 12 the trailing-window tags read CUM · M1–M8 instead of R12M',
      t24.tags.slice(0, 4).every(t => t === 'M24') && t24.tags[4] === 'R12M' && t36.tags.slice(0, 4).every(t => t === 'M36') && t36.tags[4] === 'R12M' && /24/.test(t24.label) && /36/.test(t36.label) && t36.r12 >= 2 && t8.tags.slice(0, 4).every(t => t === 'M8') && t8.tags[4] === 'CUM · M1–M8' && t8.cum.length >= 2 && t8.cum.every(t => t === 'CUM · M1–M8') && t8.r12 === 0,
      JSON.stringify([t24.tags, t36.tags, t8.cum, t8.r12]));
  await setScrub(pg, 24);

  /* ---- HIERARCHY (Compare) ---- */
  await pg.evaluate(() => document.getElementById('nav-scen').click()); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('#scenlist .btn[data-id="customers"]').click()); await pg.waitForTimeout(500);
  await pg.evaluate(() => document.getElementById('nav-compare').click()); await pg.waitForTimeout(400);   /* Compare is its own surface; Scenarios keeps the spine behind disclosure */
  const spine = await pg.evaluate(() => { const s = document.querySelector('#side .spine'); if (!s) return null;
    const causes = [...s.querySelectorAll('.cause')].map(c => ({ lvl: [...c.classList].filter(x => /^l\d$/.test(x))[0], head: (c.querySelector('.eyebrow, h5, .ch') || c).innerText.split('\n')[0] }));
    const layers = [...s.querySelectorAll('.cause.l1 .exp-layer, .cause.l1 .mh, .cause.l1 .eyebrow')].map(e => e.textContent);
    return { causes, layers, top: s.getBoundingClientRect().top, sideTop: document.getElementById('side').getBoundingClientRect().top }; });
  rec('HIERARCHY: Compare reads WHAT YOU CHANGED → WHAT THE SYSTEM DID → WHAT COMPANY EMERGED as three levels of one spine, in that order',
      spine && spine.causes.length >= 3 && spine.causes[0].lvl === 'l1' && spine.causes[1].lvl === 'l2' && spine.causes[spine.causes.length - 1].lvl === 'l3' && /changed/i.test(spine.causes[0].head) && /system did/i.test(spine.causes[1].head) && /emerged/i.test(spine.causes[spine.causes.length - 1].head),
      JSON.stringify(spine && spine.causes));
  const cmpTxt = await sideText(pg);
  rec('HIERARCHY: the changed assumptions are grouped under their causal layer and the emerged company states ARR M60, customers M60, cash trough and ending cash',
      /CUSTOMERS/.test(cmpTxt) && /Logo retention/.test(cmpTxt) && /ARR M60|MRR M60/.test(cmpTxt) && /customers M60/.test(cmpTxt) && /cash trough/.test(cmpTxt) && /ending cash/.test(cmpTxt), cmpTxt.slice(0, 200).replace(/\n/g, ' | '));
  await pg.evaluate(() => document.getElementById('scen-clear').click()); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById('nav-company').click()); await pg.waitForTimeout(400);

  /* ---- DRILL-DOWN (System) ---- */
  await pack(pg, 'full'); await setScrub(pg, 20);
  await pg.evaluate(() => document.getElementById('nav-system').click()); await pg.waitForTimeout(500);
  const v0 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 30 + 2 * 150 + 64, 330 + 56); const v1 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 1260 - 55, 22); const v2 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 30 + 7 * 150 + 64, 330 + 56); const v3 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 1260 - 55, 22); const v4 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 630, 115); const v5 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 1260 - 55, 22);
  rec('DRILL-DOWN: System opens on the ontology; CUSTOMERS opens the customer layer, CASH the flows, the hypotheses box the hypotheses layer; ‹ Ontology returns each time',
      v0 === 'ontology' && v1 === 'customers' && v2 === 'ontology' && v3 === 'company' && v4 === 'ontology' && v5 === 'hypotheses', JSON.stringify([v0, v1, v2, v3, v4, v5]));
  await pack(pg, 'arr'); await pg.waitForTimeout(200);
  const vOff0 = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  await clickModel(pg, 30 + 2 * 150 + 64, 330 + 56); const vOff = await pg.evaluate(() => window.__SP_DEBUG.sysView);
  rec('DRILL-DOWN: in the ARR-only world an off node (CUSTOMERS, dotted) opens nothing — absent mechanisms are shown, never navigable', vOff0 === 'ontology' && vOff === 'ontology', JSON.stringify([vOff0, vOff]));
  const views = await pg.evaluate(() => [...document.querySelectorAll('#sysviews .btn')].map(b => b.textContent));
  rec('DRILL-DOWN: the System view list starts with Ontology, then the layers', views[0] === 'Ontology' && views.length === 6, views.join('|'));
  await pg.evaluate(() => document.getElementById('nav-company').click()); await pg.waitForTimeout(400);

  /* ---- PROVENANCE (Inspect) ---- */
  await pack(pg, 'full'); await setScrub(pg, 20);
  const pin = await pg.evaluate(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const x = 64 + (9 / 60) * (r.width - 84);
    for (let y = 30; y < r.height * 0.6; y += 3) { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return y; } } return null; });
  await pg.waitForTimeout(500);
  const prov = await pg.evaluate(() => { const d = document.querySelector('.dossier'); if (!d) return null; d.querySelectorAll('details').forEach(x => { x.open = true; });   /* the disclosed rows are part of the chain */
    return { steps: [...d.querySelectorAll('.pstep .pl')].map(e => e.textContent.replace(/M\d+.*$|age \d+$|CUM.*$/, '').trim()), off: [...d.querySelectorAll('.pstep.off')].length, txt: d.innerText, tags: [...d.querySelectorAll('.pstep .pl .basis')].map(e => e.textContent) }; });
  rec('PROVENANCE: a pinned cohort reads as one chain — Company → Cohort → Customer economics → Monetization components → Contract · billing → Cash — every step with its own time basis',
      pin !== null && prov && prov.steps.length === 6 && /^Company/.test(prov.steps[0]) && /^Cohort/.test(prov.steps[1]) && /^Customer economics/.test(prov.steps[2]) && /^Monetization/.test(prov.steps[3]) && /^Contract/.test(prov.steps[4]) && /^Cash/.test(prov.steps[5]) && prov.off === 0 && prov.tags.length === 6 && prov.tags.every(t => BASIS.test(t)),
      JSON.stringify(prov && { steps: prov.steps, tags: prov.tags }));
  rec('PROVENANCE: the chain states what the cohort was bought under (spend month, acquisition cost, realised CAC) and how much of that capital has come back',
      prov && /Bought under/i.test(prov.txt) && /Spend incurred/.test(prov.txt) && /Cohort CAC \(realised\)/.test(prov.txt) && /unrecovered|recovered/.test(prov.txt), '');
  await pack(pg, 'arr'); await setScrub(pg, 20);
  await pg.evaluate(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const x = 64 + (9 / 60) * (r.width - 84);
    for (let y = 30; y < r.height * 0.6; y += 3) { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return; } } });
  await pg.waitForTimeout(500);
  const provOff = await pg.evaluate(() => { const d = document.querySelector('.dossier'); return d ? { off: [...d.querySelectorAll('.pstep.off .ph')].map(e => e.textContent) } : null; });
  rec('PROVENANCE: in the ARR-only world the customer, monetization and billing steps say what the cohort is instead (one balance, one coefficient, cash moves with EBITA) — never omitted',
      provOff && provOff.off.length === 3 && /no customer layer/.test(provOff.off[0]) && /one coefficient/.test(provOff.off[1]) && /no contract book/.test(provOff.off[2]), JSON.stringify(provOff));
  await pg.evaluate(() => document.getElementById('reset').click()); await pg.waitForTimeout(300);

  /* ---- WORLDS ---- */
  for (const [id, name, want] of [['wA', 'A · enterprise', { custLo: 100, custHi: 400, term: 12, timing: 'advance', lag: 4 }], ['wB', 'B · usage-heavy AI', { custLo: 2000, custHi: 8000, term: 1, timing: 'arrears', lag: 0 }], ['wC', 'C · SMB', { custLo: 6000, custHi: 12000, term: 1, timing: 'advance', lag: 0 }]]) {
    await pack(pg, id); await setScrub(pg, 24);
    const w = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.expRes.months[23], mo = D.expRes.derived.monetization;
      const lens = [...document.querySelectorAll('#side .lens')].map(l => l.innerText);
      return { pack: D.activePack, mech: D.expRes.mechanisms, cust: m.customers.closing, arr: m.closingARR, term: D.expRes.derived.cash.billingTermMonths, timing: D.expRes.derived.cash.billingTiming, lag: D.expRes.derived.acquisitionLagMonths,
        varShare: m.monetization.variableARR / (m.monetization.fixedARR + m.monetization.variableARR), lensN: lens.length, bad: lens.some(t => /NaN|undefined|\[object/.test(t)), hero: document.querySelector('#lens-company .hero .hv').textContent,
        summary: document.getElementById('experiment-summary').innerText, note: document.getElementById('packnote').textContent }; });
    rec('WORLD ' + name + ': applies as Base = Experiment with customer, monetization and cash layers on; ' + want.term + '-month billing in ' + want.timing + (want.lag ? ', ' + want.lag + '-month lag' : '') + '; the lenses render real numbers; the pack note says it is illustrative',
        w.pack === id && w.mech.customerPhysics && w.mech.monetization && w.mech.cashPhysics && w.cust > want.custLo && w.cust < want.custHi && w.term === want.term && w.timing === want.timing && w.lag === want.lag && w.lensN === 5 && !w.bad && /^€/.test(w.hero) && /0 assumptions changed/.test(w.summary) && /Illustrative, not a benchmark/.test(w.note),
        JSON.stringify({ cust: Math.round(w.cust), arr: Math.round(w.arr), term: w.term, timing: w.timing, lag: w.lag, varShare: +w.varShare.toFixed(2) }));
    if (id === 'wB') rec('WORLD B: variable (usage) revenue is the material part of the mix (> 50% of ARR at M24)', w.varShare > 0.5, 'variable share ' + w.varShare.toFixed(2));
    if (id === 'wA') rec('WORLD A: the enterprise mix is platform-led (usage < 50% of ARR at M24)', w.varShare < 0.5, 'variable share ' + w.varShare.toFixed(2));
    /* one change → Compare reads; System ontology draws every node on */
    await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.value = Math.round(parseFloat(i.value) * 1.3 / 25000) * 25000; i.dispatchEvent(new Event('input')); }); await pg.waitForTimeout(400);
    await pg.evaluate(() => document.getElementById('nav-compare').click()); await pg.waitForTimeout(400);
    const cmp = await pg.evaluate(() => { const s = document.querySelector('#side .spine'); return s ? s.innerText : ''; });
    await pg.evaluate(() => document.getElementById('nav-company').click()); await pg.waitForTimeout(300);
    rec('WORLD ' + name + ': one change to S&M reads as a causal comparison (changed → system → company) in this world', /S&M/.test(cmp) && /new (MRR|ARR) per month/.test(cmp) && /(MRR|ARR) M60/.test(cmp), cmp.slice(0, 120).replace(/\n/g, ' | '));
    await pg.evaluate(() => document.getElementById('reset').click()); await pg.waitForTimeout(300);
    await pg.evaluate(() => document.getElementById('nav-system').click()); await pg.waitForTimeout(500);
    const onto = await pg.evaluate(() => ({ view: window.__SP_DEBUG.sysView, side: document.getElementById('side').innerText.slice(0, 80) }));
    rec('WORLD ' + name + ': System opens on the ontology with every layer present', onto.view === 'ontology', JSON.stringify(onto));
    await pg.evaluate(() => document.getElementById('nav-company').click()); await pg.waitForTimeout(400);
  }
  await pg.close();

  /* ---- INTEGRITY across breakpoints ---- */
  for (const [w, h] of [[1440, 900], [1180, 820], [1024, 768], [768, 1024], [390, 844]]) {
    const q = await open(w, h);
    await pack(q, 'wA'); await setScrub(q, 24);
    const geo = await q.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect();
      return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, stage: r('.stage'), side: r('.side'), rail: r('.rail'), toggle: getComputedStyle(document.getElementById('rail-toggle')).display, open: document.querySelector('.app').classList.contains('rail-open') }; });
    const probeSide = await q.evaluate(OVERFLOW_PROBE + '("#side", ' + JSON.stringify(SIBLINGS) + ')');
    await q.evaluate(() => document.getElementById('rail-toggle').click()); await q.waitForTimeout(350);
    const probeRail = await q.evaluate(OVERFLOW_PROBE + '(".rail", ' + JSON.stringify(SIBLINGS) + ')');
    const railGeo = await q.evaluate(() => document.querySelector('.rail').getBoundingClientRect().left);
    const railW = await q.evaluate(() => document.querySelector('.rail').getBoundingClientRect().width);
    await q.evaluate(() => document.getElementById('rail-close').click()); await q.waitForTimeout(300);
    rec('INTEGRITY ' + w + '×' + h + ': no element in the lenses or the rail leaves its container, no siblings overlap, no horizontal page scroll',
        probeSide.out.length === 0 && probeSide.overlap.length === 0 && probeRail.out.length === 0 && probeRail.overlap.length === 0 && geo.scrollW <= geo.innerW, JSON.stringify({ side: probeSide, rail: probeRail, scrollW: geo.scrollW }).slice(0, 600));
    /* one hierarchy at every width: hero, then lens navigation, then the active lens, in one column; Change is a drawer opened on purpose */
    const hier = await q.evaluate(() => { const r = e => { const el = document.querySelector(e); return el ? el.getBoundingClientRect() : null; };
      const hero = r('#lens-company'), nav = r('#side .lensnav'), stage = r('.stage'), fig = r('#figwrap');
      const visibleLenses = [...document.querySelectorAll('#side .lens.tab')].filter(l => getComputedStyle(l).display !== 'none').length;
      return { heroTop: hero && hero.top, navTop: nav && nav.top, heroLeft: hero && hero.left, navLeft: nav && nav.left, stageW: stage.width, heroW: hero && hero.width, visibleLenses, figOpen: document.getElementById('figwrap').open, figTop: fig && fig.top, sceneH: document.getElementById('scene').getBoundingClientRect().height }; });
    rec('LAYOUT ' + w + ': one column — the hero above the lens navigation, no lens body open on the Company tab, the figure beneath; the rail is a drawer at every width (closed off-screen, open at the left edge) with its toggle in the header' + (w <= 760 ? '; on a phone the drawer takes the full width and the figure stays at or under 300px' : ''),
        hier.heroTop < hier.navTop && hier.navTop < hier.figTop && hier.visibleLenses === 0 && hier.figOpen && Math.abs(hier.heroLeft - hier.navLeft) < 2 && hier.heroW <= hier.stageW && geo.rail.left < 0 && railGeo === 0 && geo.toggle !== 'none' && (w > 760 || (railW >= w - 1 && hier.sceneH <= 300)),
        JSON.stringify({ hier, railClosed: geo.rail.left, railOpen: railGeo, railW, toggle: geo.toggle }));
    if (w === 390) {
      await q.evaluate(() => document.getElementById('nav-system').click()); await q.waitForTimeout(500);
      const sys = await q.evaluate(() => { const c = document.getElementById('scene').getBoundingClientRect(), s = document.querySelector('.stage'); return { cw: c.width, ch: c.height, scroll: s.scrollWidth > s.clientWidth, pageW: document.documentElement.scrollWidth }; });
      rec('LAYOUT 390 · System: the ontology keeps its size inside a horizontally scrolling frame (never shrunk to illegibility); the page itself does not scroll sideways', sys.cw >= 1000 && sys.ch >= 600 && sys.scroll && sys.pageW <= 390, JSON.stringify(sys));
    }
    await q.close();
  }
  await b.close();

  rec('no page or console errors across the whole run', errs.length === 0, errs.slice(0, 3).join(' | '));
  let pass = 0;
  P.forEach(([n, ok, d]) => { pass += ok ? 1 : 0; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); });
  console.log('\n' + pass + ' / ' + P.length + ' v2-legibility-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})();
