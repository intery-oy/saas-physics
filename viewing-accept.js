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
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
/* the build before Step 1B, taken from git: UNCHANGED and COMPARE hold this step to "viewing the
   Experiment is exactly what it was". A migration guard — later steps may change these pages. */
const PREV_COMMIT = 'b9365f6';
const PREV_FILE = path.join(require('os').tmpdir(), 'saas-physics-' + PREV_COMMIT + '.html');
require('fs').writeFileSync(PREV_FILE, require('child_process').execSync('git show ' + PREV_COMMIT + ':saas-physics-v1.html', { cwd: __dirname, maxBuffer: 1 << 26 }));
const PREV = 'file://' + PREV_FILE;

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (url, pk, exp, view) => { const p = await br.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(url); await p.waitForTimeout(600);
    await p.evaluate(pk => { document.getElementById('welcome-enter').click(); document.getElementById('play').click(); document.getElementById('pack-' + pk).click(); }, pk); await p.waitForTimeout(300);
    if (exp) { await p.evaluate(() => { for (const [k, f] of [['sm', 1.4], ['grossMargin', 0.9]]) { const i = document.getElementById('f-' + k); i.value = +i.value * f; i.dispatchEvent(new Event('input', { bubbles: true })); } }); await p.waitForTimeout(300); }
    if (view) await p.evaluate(v => document.querySelector('[data-vw="' + v + '"]').click(), view);
    await p.evaluate(() => { const s = document.getElementById('scrub'); s.value = '36'; s.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(200);
    return p; };
  const act = (p, f, a) => p.evaluate(f, a);
  const cap = (p, what) => p.evaluate(what => {
    const strip = h => h.replace(/<span class="viewing"[\s\S]*?<\/button><\/span>/g, '').replace('<span class="hd flat">on Base</span>', '')
      .replace(/<div class="btn-row fin-per">[\s\S]*?<\/div>/, '').replace(/ data-finv="[a-z]+"/g, '');
    return { side: strip(document.getElementById('side').innerHTML), strip: document.getElementById('causal-slot').innerHTML,
      canvas: what.canvas ? document.getElementById('scene').toDataURL() : '', ledger: what.ledger ? ((document.querySelector('#ledger table') || {}).outerHTML || '') : '' }; }, what);
  async function surfaces(A, B) {
    const out = [];
    const cmp = async (name, what) => { await A.waitForTimeout(250); await B.waitForTimeout(250); const a = await cap(A, what), b = await cap(B, what);
      const bad = Object.keys(a).filter(k => a[k] !== b[k]); if (bad.length) { const k = bad[0]; let i = 0; while (i < a[k].length && a[k][i] === b[k][i]) i++; out.push(name + ' ' + k + '@' + i + ': ' + a[k].slice(Math.max(0, i - 50), i + 50)); } };
    for (const L of ['company', 'customers', 'growth', 'monetization', 'cash']) { for (const p of [A, B]) await act(p, L => document.querySelector('.lensnav .btn[data-lens="' + L + '"]').click(), L); await cmp('Company·' + L, { canvas: L === 'company' }); }
    for (const v of ['ontology', 'company', 'customers', 'monetization', 'cash']) { for (const p of [A, B]) await act(p, v => { document.getElementById('nav-system').click(); const b = document.getElementById('sysview-' + v); if (b && !b.disabled) b.click(); }, v); await A.waitForTimeout(350); await cmp('System·' + v, { canvas: true }); }
    for (const p of [A, B]) await act(p, () => document.getElementById('sysview-ledger').click()); await cmp('Ledger', { ledger: true });
    for (const p of [A, B]) await act(p, () => document.getElementById('nav-company').click());
    return out;
  }

  /* ---- INVARIANT and UNCHANGED ---- */
  const inv = {}, unch = {};
  for (const pk of ['wA', 'wC', 'arr']) {
    let A = await open(URL, pk, true, 'base'), B = await open(URL, pk, false, null);
    inv[pk] = await surfaces(A, B); await A.close(); await B.close();
  }
  for (const pk of ['wA', 'arr']) {
    const A = await open(URL, pk, true, 'exp'), B = await open(PREV, pk, true, null);
    unch[pk] = await surfaces(A, B); await A.close(); await B.close();
  }
  rec('INVARIANT: viewing Base with an Experiment present, every Company lens, System view and the Model Ledger is identical — markup, canvas pixels, ledger table — to the same world with no Experiment at all (worlds A, C and ARR physics)',
      Object.values(inv).every(x => x.length === 0), JSON.stringify(inv).slice(0, 600));
  rec('UNCHANGED: viewing the Experiment reproduces the previous build exactly on every Company lens, System view and the Ledger, apart from the control and Financials\' retired Experiment / Base buttons',
      Object.values(unch).every(x => x.length === 0), JSON.stringify(unch).slice(0, 600));

  /* ---- HIT-TESTS and INSPECT ---- */
  const A = await open(URL, 'wC', true, 'base'), B = await open(URL, 'wC', false, null), X = await open(URL, 'wC', true, 'exp');
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
    document.getElementById('nav-system').click(); out.system = vis('.viewing');
    document.getElementById('sysview-ledger').click(); out.ledger = vis('.viewing');
    document.getElementById('nav-compare').click(); out.compare = vis('.viewing'); document.getElementById('nav-company').click(); return out; });
  const wX = await where(X), wB = await where(B);
  rec('CONTROL: exactly one "Viewing" control on Company, System and the Ledger while an Experiment exists; none on Compare; none anywhere without an Experiment',
      wX.company === 1 && wX.system === 1 && wX.ledger === 1 && wX.compare === 0 && Object.values(wB).every(n => n === 0), JSON.stringify({ exp: wX, none: wB }));
  const guards = await A.evaluate(() => { document.querySelector('[data-vw="base"]').click(); document.getElementById('nav-company').click(); const t = document.getElementById('side').innerText;
    document.querySelector('.lensnav .btn[data-lens="cash"]').click(); const fin = !!document.querySelector('#lens-cash [data-finv]');
    document.getElementById('nav-system').click(); document.getElementById('sysview-company').click(); const delta = !document.getElementById('cmpmode').hidden;
    document.getElementById('nav-company').click(); return { vsBase: /vs Base/.test(t), strip: document.getElementById('causal-slot').innerHTML.length, fin, delta }; });
  rec('BASE PAGE: no "vs Base" marks, no Compare strip, no Financials Δ, no Flows Absolute/Delta — nothing that reads the Experiment', !guards.vsBase && guards.strip === 0 && !guards.fin && !guards.delta, JSON.stringify(guards));

  /* ---- COMPARE is untouched: it always reads both worlds, whatever was being viewed ---- */
  const C1 = await open(URL, 'wA', true, 'base'), C0 = await open(PREV, 'wA', true, null);
  const cmpCap = p => p.evaluate(() => { document.getElementById('nav-compare').click(); return new Promise(r => setTimeout(() => r({ panel: document.getElementById('compare-panel').innerHTML, canvas: document.getElementById('scene').toDataURL() }), 400)); });
  const k1 = await cmpCap(C1), k0 = await cmpCap(C0);
  rec('COMPARE: unchanged from the previous build — the causal panel and the Base-and-Experiment figure — even when Base was the world being viewed before opening it', k1.panel === k0.panel && k1.canvas === k0.canvas && k1.panel.length > 200, JSON.stringify({ panel: k1.panel === k0.panel, canvas: k1.canvas === k0.canvas }));

  rec('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await br.close();
  let ok = 0; for (const [n, p, d] of P) { console.log((p ? '  PASS  ' : '  FAIL  ') + n + (d && !p ? '\n        ' + d : '')); if (p) ok++; }
  console.log('========================================================================================');
  console.log(ok + ' / ' + P.length + ' viewing-accept checks passed');
  process.exit(ok === P.length ? 0 : 1);
})();
