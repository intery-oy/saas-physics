/*
 * SaaS Physics — Step 1C: the Experiment drawer is the only place a law is changed.
 *
 *   COMPANY      every lever on a lens is a readout and a way in: a click opens the Experiment
 *                drawer at that law's row, marked and focused — and writes nothing
 *   SYSTEM       every valve and law mark on the map routes the same way (Flows, Customers,
 *                Monetization views), and the map rings the law while the drawer is open
 *   BASE         routing from a Base page never writes Base; the edit happens in the drawer,
 *                changes the Experiment only, and returns the view to the Experiment
 *   ONE PATH     no slider or on/off toggle outside the drawer on any Company lens or System
 *                view; in the source, only the drawer, the world/preset loaders and recompute
 *                assign the Experiment's laws
 *   READOUTS     lever values follow the viewed world
 */
const H = require('./accept-harness.js');
const path = require('path'), fs = require('fs');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

(async () => {
  const br = await H.launch();
  const errs = [];
  const open = async (pk, w, h) => { const p = await br.newPage({ viewport: { width: w || 1440, height: h || 900 } }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL); await p.evaluate(() => window.__SP_DEBUG.useBase('wA')); await p.waitForTimeout(600);
    await p.evaluate(pk => { document.getElementById('welcome-enter').click(); document.getElementById('play').click(); window.__SP_DEBUG.useBase(pk); }, pk); await p.waitForTimeout(300);
    await p.evaluate(() => { const s = document.getElementById('scrub'); s.value = '36'; s.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(200);
    return p; };
  const worlds = p => p.evaluate(() => { const D = window.__SP_DEBUG; return JSON.stringify([D.expA, D.baseA]); });
  const focusState = p => p.evaluate(() => { const f = document.querySelector('.force.law-focus'), c = f && f.querySelector('[id^="f-"],[id^="t-"]');
    return { open: document.querySelector('.app').classList.contains('rail-open'), row: c ? c.id.replace(/^[ft]-/, '') : null, active: (document.activeElement || {}).id || null, view: window.__SP_DEBUG.viewedWorld }; });
  const closeDrawer = p => p.evaluate(() => document.getElementById('rail-close').click());

  /* ---- COMPANY ---- */
  const pg = await open('wA');
  const comp = {}, w0 = await worlds(pg);
  for (const lens of ['growth', 'monetization']) {
    await pg.evaluate(l => document.querySelector('.lensnav .btn[data-lens="' + l + '"]').click(), lens); await pg.waitForTimeout(250);
    const keys = await pg.evaluate(l => [...document.querySelectorAll('#lens-' + l + ' .lever')].map(b => b.dataset.law), lens);
    for (const k of keys) {
      const box = await pg.evaluate(k => { const b = document.querySelector('.lever[data-law="' + k + '"]'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, k);
      await pg.mouse.click(box.x, box.y); await pg.waitForTimeout(300);
      comp[k] = await focusState(pg); await closeDrawer(pg); await pg.waitForTimeout(150);
    }
  }
  const w1 = await worlds(pg);
  rec('COMPANY: every lever on the Growth and Monetization lenses opens the Experiment drawer at its own law — row marked, control focused — and writes nothing',
      Object.keys(comp).length >= 6 && Object.entries(comp).every(([k, s]) => s.open && s.row === k && (s.active === 'f-' + k || s.active === 't-' + k)) && w0 === w1, JSON.stringify(comp));
  const noEdit = await pg.evaluate(() => { const out = {}; ['company', 'customers', 'growth', 'monetization', 'cash'].forEach(l => { document.querySelector('.lensnav .btn[data-lens="' + l + '"]').click();
      out[l] = document.querySelectorAll('#side input[type=range], #side .nulltog').length; }); return out; });

  /* ---- SYSTEM ---- */
  const clickHit = async (p, h) => { const pt = await p.evaluate(h => { const c = document.getElementById('scene').getBoundingClientRect(), f = window.__SP_DEBUG.sysFit;
      return { x: c.left + f.ox + h.x * f.s, y: c.top + f.oy + h.y * f.s }; }, h); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(300); };
  const sys = {}, sysNo = {};
  for (const v of ['customers', 'monetization']) {
    await pg.evaluate(v => { document.getElementById('menu-mech').click(); document.getElementById('sysview-' + v).click(); }, v); await pg.waitForTimeout(500);
    const hits = await pg.evaluate(() => { const D = window.__SP_DEBUG; return D.valveHits.map(h => ({ key: h.key, x: h.x, y: h.y })).concat(D.lawHits.map(h => ({ key: h.key, x: h.x + h.w / 2, y: h.y + h.h / 2 }))); });
    sysNo[v] = await pg.evaluate(() => document.querySelectorAll('.figbox input[type=range], #lawhost *').length);
    for (const h of hits) { if (sys[v + ':' + h.key]) continue;
      await clickHit(pg, h); const s = await focusState(pg), ring = await pg.evaluate(() => window.__SP_DEBUG.openChip);
      sys[v + ':' + h.key] = { ok: s.open && s.row === h.key && ring === h.key, row: s.row }; await closeDrawer(pg); await pg.waitForTimeout(150); }
  }
  const w2 = await worlds(pg);
  rec('MECHANICS: every valve and law mark on the Customers and Monetization mechanisms opens the Experiment drawer at its law, rings it on the map while open, and writes nothing',
      Object.keys(sys).length >= 5 && Object.values(sys).every(x => x.ok) && w1 === w2, JSON.stringify(sys));
  rec('ONE PATH (screen): no slider or on/off toggle outside the Experiment drawer on any Company lens or Model Mechanics view; the map carries no law chips of its own',
      Object.values(noEdit).every(n => n === 0) && Object.values(sysNo).every(n => n === 0), JSON.stringify({ company: noEdit, system: sysNo }));

  /* ---- BASE ---- */
  const b = await open('wA');
  await b.evaluate(() => { const i = document.getElementById('f-rd'); i.value = +i.value * 1.2; i.dispatchEvent(new Event('input', { bubbles: true })); }); await b.waitForTimeout(250);
  await b.evaluate(() => { document.querySelector('[data-vw="base"]').click(); document.querySelector('.lensnav .btn[data-lens="growth"]').click(); }); await b.waitForTimeout(250);
  const baseBefore = await b.evaluate(() => JSON.stringify(window.__SP_DEBUG.baseA)), expBefore = await b.evaluate(() => JSON.stringify(window.__SP_DEBUG.expA));
  const lvBase = await b.evaluate(() => document.getElementById('lv-sm').textContent);
  const box = await b.evaluate(() => { const e = document.querySelector('.lever[data-law="sm"]'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await b.mouse.click(box.x, box.y); await b.waitForTimeout(300);
  const routed = await focusState(b), baseAfterRoute = await b.evaluate(() => JSON.stringify(window.__SP_DEBUG.baseA)), expAfterRoute = await b.evaluate(() => JSON.stringify(window.__SP_DEBUG.expA));
  await b.evaluate(() => { const i = document.getElementById('f-sm'); i.value = 1500000; i.dispatchEvent(new Event('input', { bubbles: true })); }); await b.waitForTimeout(300);
  const after = await b.evaluate(() => { const D = window.__SP_DEBUG; return { base: JSON.stringify(D.baseA), sm: D.expA.sm, view: D.viewedWorld }; });
  await closeDrawer(b); await b.waitForTimeout(150);
  const lvExp = await b.evaluate(() => document.getElementById('lv-sm').textContent);
  rec('BASE: from a Base page a law opens the Experiment at that law with Base and the Experiment untouched and the view still Base; the edit then changes only the Experiment and returns the view to it',
      routed.open && routed.row === 'sm' && routed.view === 'base' && baseAfterRoute === baseBefore && expAfterRoute === expBefore && after.base === baseBefore && after.sm === 1500000 && after.view === 'exp',
      JSON.stringify({ routed, sm: after.sm, view: after.view, baseSame: after.base === baseBefore }));
  rec('READOUTS: a lever reads the viewed world — Base\'s S&M on the Base page, the Experiment\'s after the edit', lvBase === '€700k' && lvExp === '€1.50m', JSON.stringify({ lvBase, lvExp }));

  /* ---- ONE PATH (source) ---- */
  const tpl = fs.readFileSync(path.resolve(__dirname, 'v1.template.html'), 'utf8').split('\n');
  let fn = '(top)'; const writers = new Set(), baseWriters = new Set();
  const shadow = l => /var V_ = VW\(\)/.test(l) || /var P = T\.pre, expA = T\.a\(\)/.test(l);   /* local read-only copies, not the state */
  tpl.forEach(l => { const m = l.match(/^  function ([A-Za-z0-9_]+)\(/); if (m) fn = m[1]; else if (/^  var /.test(l)) fn = '(top)';
    if (/\bexpA\s*(\[[^\]]*\])?\s*=[^=]/.test(l) && !shadow(l)) writers.add(fn);
    if (/\b(baseA|baseStart)\s*(\[[^\]]*\])?\s*=[^=]/.test(l) && !shadow(l)) baseWriters.add(fn); });
  const allowed = ['(top)', 'recompute', 'resetExperiment', 'applyScenario'];
  rec('ONE PATH (source): the Experiment\'s laws are assigned only by the drawer (its control target), the preset loader, Reset and recompute — nothing on Company or System writes a law',
      [...writers].every(f => allowed.includes(f)), JSON.stringify([...writers]));
  rec('FROZEN BASE (source): the Base is assigned only where it is declared and in adoptFrozenBase — Freeze Base is the one way it changes',
      [...baseWriters].every(f => ['(top)', 'adoptFrozenBase'].includes(f)) && baseWriters.has('adoptFrozenBase'), JSON.stringify([...baseWriters]));

  rec('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await br.close();
  let ok = 0; for (const [n, p, d] of P) { console.log((p ? '  PASS  ' : '  FAIL  ') + n + (d && !p ? '\n        ' + d : '')); if (p) ok++; }
  console.log('========================================================================================');
  console.log(ok + ' / ' + P.length + ' laws-accept checks passed');
  process.exit(ok === P.length ? 0 : 1);
})();
