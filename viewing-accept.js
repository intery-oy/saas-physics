/*
 * SaaS Physics — Step 1B: one viewed world on Company, System and the Model Ledger.
 *
 *   INVARIANT    a page that says Base shows exactly what the same world shows with no Experiment
 *                at all — the side panel's markup, the canvas pixels and the ledger table, on all
 *                five Company lenses, every System view and the Ledger, in several worlds
 *   UNCHANGED    viewing the Experiment reproduces the build before this step (b9365f6) exactly,
 *                apart from the control itself and Financials' retired Experiment / Base buttons
 *   HIT-TESTS    hover and click on the formation resolve against the viewed world's strata:
 *                pixel for pixel, Base view pins what the no-Experiment page pins
 *   INSPECT      a cohort opened while viewing Base carries Base's figures; switching world
 *                releases whatever was held open
 *   LIFECYCLE    viewing never changes either world; editing any law returns the view to the
 *                Experiment; with no Experiment there is no control; Compare has none
 */
const H = require('./accept-harness.js');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
/* the build before Step 1B, taken from git: UNCHANGED and COMPARE hold this step to "viewing the
   Experiment is exactly what it was". A migration guard — later steps may change these pages. */
const PREV_COMMIT = 'b9365f6';
const PREV_FILE = path.join(require('os').tmpdir(), 'saas-physics-' + PREV_COMMIT + '.html');
require('fs').writeFileSync(PREV_FILE, require('child_process').execSync('git show ' + PREV_COMMIT + ':saas-physics-v1.html', { cwd: __dirname, maxBuffer: 1 << 26 }));
const PREV = 'file://' + PREV_FILE;

H.suite('viewing-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  /* Wait for the page, not the clock. Every app handler here runs synchronously; the only deferred work
     is setLayer's 220 ms resize-and-render when the page changes, and the canvas's next animation frame. */
  const frames = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const settle = p => p.evaluate(() => new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 230)));
  const open = async (url, pk, exp, view) => { const p = await t.browser.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url); await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(() => window.__SP_DEBUG && document.getElementById('welcome-enter'));
    await p.evaluate(() => window.__SP_DEBUG.useBase && window.__SP_DEBUG.useBase('wA'));
    await p.evaluate(pk => { document.getElementById('welcome-enter').click(); document.getElementById('play').click(); if (window.__SP_DEBUG.useBase) window.__SP_DEBUG.useBase(pk); else document.getElementById('pack-' + pk).click(); }, pk);   /* the previous build still chose its world from a menu */
    await p.waitForFunction(() => { const D = window.__SP_DEBUG; return D.expRes && (!('layer' in D) || D.layer === 'stock'); });   /* the previous build has no layer getter */
    if (exp) await p.evaluate(() => { for (const [k, f] of [['sm', 1.4], ['grossMargin', 0.9]]) { const i = document.getElementById('f-' + k); i.value = +i.value * f; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    if (view) await p.evaluate(v => document.querySelector('[data-vw="' + v + '"]').click(), view);
    await p.evaluate(() => { const s = document.getElementById('scrub'); s.value = '36'; s.dispatchEvent(new Event('input', { bubbles: true })); });
    await settle(p);
    return p; };
  const openPair = (a, b) => Promise.all([open(...a), open(...b)]);   /* the two pages are independent */
  const act = (p, f, a) => p.evaluate(f, a);
  const cap = (p, what) => p.evaluate(what => {
    const strip = h => h.replace(/<span class="viewing"[\s\S]*?<\/button><\/span>/g, '').replace('<span class="hd flat">on Base</span>', '')
      .replace(/<div class="btn-row fin-per">[\s\S]*?<\/div>/, '').replace(/ data-finv="[a-z]+"/g, '');
    /* Step 1C turned the lens levers from sliders into ways into the Experiment: they are compared by laws-accept, not here */
    const sd = document.getElementById('side').cloneNode(true); sd.querySelectorAll('.levers').forEach(e => e.remove());
    return { side: strip(sd.innerHTML), strip: document.getElementById('causal-slot').innerHTML,
      canvas: what.canvas ? document.getElementById('scene').toDataURL() : '', ledger: what.ledger ? ((document.querySelector('#ledger table') || {}).outerHTML || '') : '' }; }, what);
  async function surfaces(A, B, ledgerOnly) {
    const out = [];
    const both = f => Promise.all([A, B].map(f));
    const cmp = async (name, what, layerChanged) => { await both(layerChanged ? settle : frames); const [a, b] = await both(p => cap(p, what));
      const bad = Object.keys(a).filter(k => a[k] !== b[k]); if (bad.length) { const k = bad[0]; let i = 0; while (i < a[k].length && a[k][i] === b[k][i]) i++; out.push(name + ' ' + k + '@' + i + ': ' + a[k].slice(Math.max(0, i - 50), i + 50)); } };
    if (!ledgerOnly) {
      for (const L of ['company', 'customers', 'growth', 'monetization', 'cash']) { await both(p => act(p, L => document.querySelector('.lensnav .btn[data-lens="' + L + '"]').click(), L)); await cmp('Company·' + L, { canvas: L === 'company' }); }
      for (const v of ['ontology', 'customers', 'monetization', 'cash']) { await both(p => act(p, v => { (document.getElementById('menu-mech') || document.getElementById('nav-system')).click(); const b = document.getElementById('sysview-' + v); if (b && !b.disabled) b.click(); }, v)); await cmp('Mechanics·' + v, { canvas: true }, true); }
    }
    await both(p => act(p, () => document.getElementById('menu-ledger').click())); await cmp('Ledger', { ledger: true }, true);
    await both(p => act(p, () => document.getElementById('nav-company').click()));
    return out;
  }

  /* ---- INVARIANT and UNCHANGED ---- */
  const inv = {}, unch = {};
  for (const pk of ['wA', 'wC', 'arr']) {
    const [A, B] = await openPair([URL, pk, true, 'base'], [URL, pk, false, null]);
    inv[pk] = await surfaces(A, B); await A.close(); await B.close();
  }
  for (const pk of ['wA', 'arr']) {
    const [A, B] = await openPair([URL, pk, true, 'exp'], [PREV, pk, true, null]);
    /* Company became one world on purpose (company-accept holds it) and System became Model Mechanics (mechanics-accept);
       the Model Ledger stays exactly as it was, and is all this check compares */
    unch[pk] = await surfaces(A, B, true); await A.close(); await B.close();
  }
  rec('INVARIANT: viewing Base with an Experiment present, every Company lens, Model Mechanics view and the Model Ledger is identical — markup, canvas pixels, ledger table — to the same world with no Experiment at all (worlds A, C and ARR physics)',
      Object.values(inv).every(x => x.length === 0), JSON.stringify(inv).slice(0, 600));
  rec('UNCHANGED: viewing the Experiment reproduces the previous build exactly on the Ledger (Company is one world since Step 1D — company-accept; System is now Model Mechanics — mechanics-accept)',
      Object.values(unch).every(x => x.length === 0), JSON.stringify(unch).slice(0, 600));

  /* ---- HIT-TESTS and INSPECT ---- */
  const [A, B, X] = await Promise.all([open(URL, 'wC', true, 'base'), open(URL, 'wC', false, null), open(URL, 'wC', true, 'exp')]);
  const probe = async p => { const r = await p.evaluate(() => { const c = document.getElementById('scene').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; }); const out = [];
    for (let i = 0; i < 14; i++) { const x = r.x + r.w * 0.52, y = r.y + r.h * (0.2 + i * 0.05); await p.mouse.move(x, y); await p.waitForTimeout(30); out.push(await p.evaluate(() => window.__SP_DEBUG.hover)); }
    return out; };
  const hA = await probe(A), hB = await probe(B), hX = await probe(X);
  rec('HIT-TESTS: hovering the formation while viewing Base resolves, pixel for pixel, to the strata the no-Experiment page resolves to — not to the Experiment\'s (which differ on this line)',
      JSON.stringify(hA) === JSON.stringify(hB) && hA.some(v => v !== null) && JSON.stringify(hA) !== JSON.stringify(hX), JSON.stringify({ base: hA, noExp: hB, exp: hX }));
  const pin = async p => { const r = await p.evaluate(() => { const c = document.getElementById('scene').getBoundingClientRect(); return { x: c.left + c.width * 0.52, y: c.top + c.height * 0.45 }; });
    await p.mouse.move(r.x, r.y); await p.waitForTimeout(40); await p.mouse.click(r.x, r.y); await p.waitForTimeout(300);
    return p.evaluate(() => { const D = window.__SP_DEBUG, k = D.pinned, h = document.querySelector('.dossier h4'); return { k, title: h ? h.textContent : null, dossier: (document.querySelector('.dossier') || {}).innerText || '',
      baseARR: k !== null ? D.baseRes.cohorts[k].initialARR : null, expARR: k !== null ? D.expRes.cohorts[k].initialARR : null }; }); };
  const iA = await pin(A), iB = await pin(B);
  rec('INSPECT: a cohort opened while viewing Base is Base\'s — the dossier is word for word the one the no-Experiment page opens for the same click',
      iA.k !== null && iA.k === iB.k && iA.dossier === iB.dossier && iA.dossier.length > 50, JSON.stringify({ kA: iA.k, kB: iB.k, same: iA.dossier === iB.dossier }));
  const rel = await A.evaluate(() => { document.querySelector('[data-vw="exp"]').click(); return { pinned: window.__SP_DEBUG.pinned, v: window.__SP_DEBUG.viewedWorld }; });
  rec('INSPECT: switching the viewed world releases the cohort that was open — it was picked in the other world', rel.pinned === null && rel.v === 'exp', JSON.stringify(rel));

  /* ---- LIFECYCLE ---- */
  const life = await A.evaluate(() => { const D = window.__SP_DEBUG, before = JSON.stringify(D.expA), bRes = D.expRes, baseRes = D.baseRes;
    document.querySelector('[data-vw="base"]').click(); const v1 = D.viewedWorld; document.querySelector('[data-vw="exp"]').click(); document.querySelector('[data-vw="base"]').click();
    const same = JSON.stringify(D.expA) === before && D.expRes === bRes && D.baseRes === baseRes;
    const i = document.getElementById('f-rd'); i.value = +i.value * 1.1; i.dispatchEvent(new Event('input', { bubbles: true }));
    return { v1, same, afterEdit: D.viewedWorld, chip: document.getElementById('rail-toggle').textContent }; });
  rec('LIFECYCLE: choosing a world to view never changes either world (same assumptions, same runs); editing any law returns the view to the Experiment', life.v1 === 'base' && life.same && life.afterEdit === 'exp', JSON.stringify(life));
  const where = async p => p.evaluate(() => { const vis = sel => [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().height > 0).length; const out = {};
    document.getElementById('nav-company').click(); out.company = vis('.viewing');
    document.getElementById('menu-mech').click(); out.system = vis('.viewing');
    document.getElementById('menu-ledger').click(); out.ledger = vis('.viewing');
    document.getElementById('nav-compare').click(); out.compare = vis('.viewing'); document.getElementById('nav-company').click(); return out; });
  const wX = await where(X), wB = await where(B);
  rec('CONTROL: exactly one "Viewing" control on Company, System and the Ledger while an Experiment exists; none on Compare; none anywhere without an Experiment',
      wX.company === 1 && wX.system === 1 && wX.ledger === 1 && wX.compare === 0 && Object.values(wB).every(n => n === 0), JSON.stringify({ exp: wX, none: wB }));
  const guards = await A.evaluate(() => { document.querySelector('[data-vw="base"]').click(); document.getElementById('nav-company').click(); const t = document.getElementById('side').innerText;
    document.querySelector('.lensnav .btn[data-lens="cash"]').click(); const fin = !!document.querySelector('#lens-cash [data-finv]');
    document.getElementById('menu-mech').click(); const delta = !!document.getElementById('cmpmode');
    document.getElementById('nav-company').click(); return { vsBase: /vs Base/.test(t), strip: document.getElementById('causal-slot').innerHTML.length, fin, delta }; });
  rec('BASE PAGE: no "vs Base" marks, no Compare strip, no Financials Δ, no Flows Absolute/Delta — nothing that reads the Experiment', !guards.vsBase && guards.strip === 0 && !guards.fin && !guards.delta, JSON.stringify(guards));

  /* ---- COMPARE is untouched: it always reads both worlds, whatever was being viewed ---- */
  const [C1, C0] = await openPair([URL, 'wA', true, 'base'], [PREV, 'wA', true, null]);
  const cmpCap = p => p.evaluate(() => { document.getElementById('nav-compare').click(); return new Promise(r => setTimeout(() => r({ panel: document.getElementById('compare-panel').innerHTML, canvas: document.getElementById('scene').toDataURL() }), 400)); });
  const k1 = await cmpCap(C1), k0 = await cmpCap(C0);
  /* the attribution block is excluded on purpose: the previous build re-ran its variants from the engine's
     default opening state instead of the world's, so on world A it attributed +€11m to an installed-base
     law nobody had changed. Its variants now run from the frozen Base's opening state. */
  const noAttr = h => h.replace(/<details class="bnd"><summary>What is driving the delta\?<\/summary>[\s\S]*?<\/details>/, '');
  k1.panel = noAttr(k1.panel); k0.panel = noAttr(k0.panel);
  rec('COMPARE: unchanged from the previous build (bar the corrected attribution) — the causal panel and the Base-and-Experiment figure — even when Base was the world being viewed before opening it', k1.panel === k0.panel && k1.canvas === k0.canvas && k1.panel.length > 200, JSON.stringify({ panel: k1.panel === k0.panel, canvas: k1.canvas === k0.canvas }));

  });
