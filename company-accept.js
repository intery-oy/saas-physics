/*
 * SaaS Physics — Step 1D: Company is a single-world surface.
 *
 * @accept-serial — runs alone. Like viewing-accept, VALUES compares two live pages
 * pixel for pixel and flakes for reasons that are not the product. Pre-existing;
 * see viewing-accept's header for what was measured and ruled out.
 *
 *   ONE WORLD    viewing the Experiment, every Company lens (markup and canvas) is identical to the
 *                page on which the Experiment's company is the only world — nothing on Company
 *                depends on Base. (Viewing Base is held to the same rule by viewing-accept.)
 *   NO DELTAS    no Company text says "vs Base", "on Base", "Base", Δ, or names changed assumptions;
 *                no dashed Base series, no Compare strip, no Financials Δ control
 *   VALUES       the headline is the viewed world's own closing MRR, and switching the view
 *                switches it to the other world's
 *   HOVER        hovering the formation resolves to the viewed world's cohorts
 *   INSPECT      the capital track of a pinned cohort carries no Base ghost or Base payback text
 */
const H = require('./accept-harness.js');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
const LENSES = ['company', 'customers', 'growth', 'monetization', 'cash'];

H.suite('company-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  const open = async pk => { const p = await t.browser.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL); await p.evaluate(() => window.__SP_DEBUG.useBase('wA')); await p.settle();
    await p.evaluate(pk => { document.getElementById('welcome-enter').click(); document.getElementById('play').click(); window.__SP_DEBUG.useBase(pk); }, pk); await p.paint();
    await p.evaluate(() => { for (const [k, f] of [['sm', 1.4], ['grossMargin', 0.9], ['cacPerARR', 0.8]]) { const i = document.getElementById('f-' + k); i.value = +i.value * f; i.dispatchEvent(new Event('input', { bubbles: true })); } });
    await p.paint();
    await p.evaluate(() => { const s = document.getElementById('scrub'); s.value = '36'; s.dispatchEvent(new Event('input', { bubbles: true })); }); await p.paint();
    return p; };
  const cap = (p, canvas) => p.evaluate(canvas => { const sd = document.getElementById('side').cloneNode(true);
    sd.querySelectorAll('.viewing').forEach(e => e.remove());
    return { side: sd.innerHTML, strip: document.getElementById('causal-slot').innerHTML, canvas: canvas ? document.getElementById('scene').toDataURL() : '' }; }, canvas);
  const lens = (p, L) => p.evaluate(L => document.querySelector('.lensnav .btn[data-lens="' + L + '"]').click(), L);

  /* ---- ONE WORLD ---- */
  const one = {};
  for (const pk of ['wA', 'wC', 'arr']) {
    const X = await open(pk), Q = await open(pk); await Q.evaluate(() => window.__SP_DEBUG.rebaseToExperiment()); await Q.paint();
    const bad = [];
    for (const L of LENSES) { for (const p of [X, Q]) await lens(p, L); await X.paint(); await Q.paint();
      const a = await cap(X, L === 'company'), b = await cap(Q, L === 'company');
      for (const k of Object.keys(a)) if (a[k] !== b[k]) { let i = 0; while (i < a[k].length && a[k][i] === b[k][i]) i++; bad.push(L + '·' + k + '@' + i + ': ' + a[k].slice(Math.max(0, i - 50), i + 50)); } }
    one[pk] = bad; await X.close(); await Q.close();
  }
  rec('ONE WORLD: viewing the Experiment, all five Company lenses — markup and formation canvas — are identical to the page on which the Experiment\'s company is the only world (worlds A, C and ARR physics)',
      Object.values(one).every(b => b.length === 0), JSON.stringify(one).slice(0, 700));

  /* ---- NO DELTAS, VALUES ---- */
  const pg = await open('wA');
  const audit = await pg.evaluate(L => { const out = {};
    L.forEach(l => { document.querySelector('.lensnav .btn[data-lens="' + l + '"]').click();
      /* the page's own text; the Viewing control names both worlds by design and is not part of the company */
      const txt = e => { const c = e.cloneNode(true); c.querySelectorAll('.viewing').forEach(v => v.remove()); document.body.appendChild(c); const s = c.innerText; c.remove(); return s; };
      const el = document.getElementById('lens-' + l), t = txt(el) + ' ' + txt(document.getElementById('lens-company'));
      out[l] = { words: (t.match(/vs Base|on Base|\bBase\b|Δ|Experiment − Base|assumptions? changed|effect from M/g) || []), baseSeries: el.querySelectorAll('path.ln.base').length,
        finv: el.querySelectorAll('[data-finv]').length }; });
    out.strip = document.getElementById('causal-slot').innerHTML.length; return out; }, LENSES);
  rec('NO DELTAS: no Company lens or headline says "vs Base", "on Base", "Base", Δ or names changed assumptions; no dashed Base series; no Compare strip; no Financials Δ control',
      LENSES.every(l => audit[l].words.length === 0 && audit[l].baseSeries === 0 && audit[l].finv === 0) && audit.strip === 0, JSON.stringify(audit));
  const vals = await pg.evaluate(() => { const D = window.__SP_DEBUG, m = D.selectedMonth(), hv = () => document.querySelector('#lens-company .hero .hv').textContent;
    document.querySelector('.lensnav .btn[data-lens="company"]').click(); const e = hv(); document.querySelector('[data-vw="base"]').click(); const b = hv(); document.querySelector('[data-vw="exp"]').click();
    const f = v => { const a = Math.abs(v / 12); return '€' + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : Math.round(a / 1e3) + 'k'); };
    return { e, b, eWant: f(D.expRes.months[m - 1].closingARR), bWant: f(D.baseRes.months[m - 1].closingARR) }; });
  rec('VALUES: the headline is the viewed world\'s own closing MRR — the Experiment\'s, and after switching, Base\'s — with no difference printed beside it',
      vals.e === vals.eWant && vals.b === vals.bWant && vals.e !== vals.b, JSON.stringify(vals));

  /* ---- HOVER and INSPECT ---- */
  const X = await open('wC'), Q = await open('wC'); await Q.evaluate(() => window.__SP_DEBUG.rebaseToExperiment()); await Q.paint();
  const probe = async p => { await lens(p, 'company'); await p.paint(); const r = await p.evaluate(() => { const c = document.getElementById('scene').getBoundingClientRect(); return { x: c.left, y: c.top, w: c.width, h: c.height }; }); const out = [];
    for (let i = 0; i < 14; i++) { await p.mouse.move(r.x + r.w * 0.52, r.y + r.h * (0.2 + i * 0.05)); await p.paint(); out.push(await p.evaluate(() => window.__SP_DEBUG.hover)); } return out; };
  const hX = await probe(X), hQ = await probe(Q);
  rec('HOVER: hovering the formation resolves, pixel for pixel, to the cohorts of the company on screen', JSON.stringify(hX) === JSON.stringify(hQ) && hX.some(v => v !== null), JSON.stringify({ exp: hX, only: hQ }));
  const pin = async p => { const r = await p.evaluate(() => { const c = document.getElementById('scene').getBoundingClientRect(); return { x: c.left + c.width * 0.52, y: c.top + c.height * 0.45 }; });
    await p.mouse.click(r.x, r.y); await p.settle(); return p.evaluate(() => ({ k: window.__SP_DEBUG.pinned, canvas: document.getElementById('scene').toDataURL(), txt: document.getElementById('side').innerText })); };
  const iX = await pin(X), iQ = await pin(Q);
  rec('INSPECT: a pinned cohort\'s figure and dossier match the single-world page — no Base ghost line, no "Base: same" / "Base age" payback text',
      iX.k !== null && iX.k === iQ.k && iX.canvas === iQ.canvas && !/Base: same|Base age|Base: not reached/.test(iX.txt), JSON.stringify({ k: iX.k, canvas: iX.canvas === iQ.canvas }));

  });
