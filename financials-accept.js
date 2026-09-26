/*
 * SaaS Physics — Financials: statements that form with the clock. DOM-level acceptance.
 *
 *   EQUIVALENCE  the month tick (targeted update) prints exactly what a full rebuild prints:
 *                after every scrub, the visible surface (Company headline, lens navigation,
 *                Financials) is compared byte for byte with a fresh build at the same month —
 *                worlds A and C and a Cash-off world, Experiment / Base / Δ, across year
 *                boundaries and backward scrubs
 *   FORMATION    at month T: closed years are annual statements; the year in progress is its
 *                year to date (flows summed through T, balances at T, movements from the prior
 *                year-end); years not begun are blank, never forecast
 *   BACKWARD     scrubbing back unforms the statements exactly
 *   BOUNDARY     Base and Experiment are cut at the same month; Financials has no Δ mode (Compare owns differences)
 *   COST         a month change on Financials is a tick, never a build; the hidden lenses and
 *                the chart's paths are not rebuilt; a structural change forces a build
 *   MOBILE       with the period row hidden, the year in progress still reads YTD
 */
const H = require('./accept-harness.js');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

(async () => {
  const br = await H.launch();
  const errs = [];
  const open = async (w, h) => { const pg = await br.newPage({ viewport: { width: w, height: h } }); pg.on('pageerror', e => errs.push(w + ': ' + String(e)));
    await pg.goto(URL); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(800); await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); }); await pg.waitForTimeout(200); return pg; };
  const D = (pg, f, a) => pg.evaluate(f, a);
  const pack = async (pg, id) => { await D(pg, id => window.__SP_DEBUG.useBase(id), id); await pg.waitForTimeout(400); };
  const lens = async (pg, id) => { await D(pg, id => document.querySelector('.lensnav .btn[data-lens="' + id + '"]').click(), id); await pg.waitForTimeout(250); };
  const experiment = async pg => { await D(pg, () => { const i = document.querySelector('input[data-k="sm"], #f-sm'); i.value = +i.value * 1.4; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }); await pg.waitForTimeout(400); };
  /* Base / Experiment is the page-level viewing control (Step 1B); Company, Financials included, shows one world (Step 1D) */
  const view = async (pg, v) => { await D(pg, v => { const q = s => document.querySelector(s);
    if (v === 'base') { q('[data-vw="base"]').click(); return; }
    q('[data-vw="exp"]').click();
    const on = q('[data-finv="exp"]');                     /* present only while Δ is on */
    if (v === 'exp' && on) on.click(); }, v); await pg.waitForTimeout(200); };
  /* scrub the way the transport does, then report whether the month was a tick */
  const scrub = (pg, m) => D(pg, m => { const s = window.__SP_DEBUG.finStats, b = s.builds, t = s.ticks, sc = document.getElementById('scrub');
    sc.value = String(m); sc.dispatchEvent(new Event('input', { bubbles: true })); return { tick: s.ticks === t + 1 && s.builds === b }; }, m);
  const visible = pg => D(pg, () => ['lens-company', 'lens-cash'].map(id => document.getElementById(id).outerHTML).join('') + document.querySelector('#side .lensnav').outerHTML);
  const MONTHS = [1, 2, 5, 11, 12, 13, 24, 25, 30, 36, 37, 40, 47, 48, 49, 59, 60, 44, 36, 12, 3, 1];

  /* ---- EQUIVALENCE ---- */
  const cases = [['wA', null], ['wA', 'exp'], ['wA', 'base'], ['wC', null], ['wC', 'base'], ['arr', null], ['arr', 'base']];
  const eq = {};
  for (const [pk, v] of cases) {
    const pg = await open(1440, 900); await pack(pg, pk); if (v) await experiment(pg); await lens(pg, 'cash'); if (v) await view(pg, v);
    const bad = [], notTick = [];
    await scrub(pg, 6);   /* leave wherever the clock stood, so the first counted scrub is a real month change */
    for (const m of MONTHS) {
      const r = await scrub(pg, m); if (!r.tick) notTick.push(m);
      const a = await visible(pg); await D(pg, () => window.__SP_DEBUG.finRebuild()); const f = await visible(pg);
      if (a !== f) { let i = 0; while (i < a.length && a[i] === f[i]) i++; bad.push(m + '@' + a.slice(Math.max(0, i - 40), i + 40)); }
    }
    eq[pk + (v ? ':' + v : '')] = { bad: bad.slice(0, 2), notTick };
    await pg.close();
  }
  rec('EQUIVALENCE: after every month change the targeted update is byte-identical to a full rebuild — Company headline, lens navigation and Financials — in worlds A, C and Cash off, under Experiment, Base and Δ, across every year boundary and backward scrubs; and every one of those month changes was a tick, not a build',
      Object.values(eq).every(x => x.bad.length === 0 && x.notTick.length === 0), JSON.stringify(eq));

  /* ---- FORMATION at M40, world A with an experiment ---- */
  const pg = await open(1440, 900); await pack(pg, 'wA'); await experiment(pg); await lens(pg, 'cash'); await scrub(pg, 40);
  const cols = (pg) => D(pg, () => { const t = [...document.querySelectorAll('#lens-cash table.fs')];
    const row = (ti, re) => { const r = [...t[ti].querySelectorAll('tbody tr')].find(tr => re.test((tr.querySelector('td.l') || {}).textContent || '')); return r ? [...r.querySelectorAll('td[data-fr]')].map(td => td.textContent) : null; };
    return { heads: [...t[0].querySelectorAll('th[data-fs]')].map(th => th.textContent), wcHeads: [...t[1].querySelectorAll('th[data-fs]')].map(th => th.textContent),
      sel: [...t[0].querySelectorAll('th[data-fh]')].map(th => th.className), period: document.querySelector('#lens-cash [data-fp]').textContent,
      rev: row(0, /^Revenue/), ebita: row(0, /^EBITA\d?$/), ar: row(1, /^Receivables/), nwc: row(1, /^Net working capital/), dnwc: row(1, /^Change in net working capital/),
      fcf: row(2, /^Cash free cash flow\d?$/), cashO: row(2, /^Cash at beginning/), cashC: row(2, /^Cash at end/), chk: row(2, /^Check/), ok: (document.querySelector('#lens-cash [data-fc]') || {}).textContent }; });
  const fk = v => { if (Math.abs(v) < 0.5) return '—'; const k = Math.round(v / 1000); if (k === 0) return '0'; const r = Math.abs(k).toLocaleString('en-GB'); return v < 0 ? '(' + r + ')' : r; };
  const eng = (pg, which, m) => D(pg, ([which, m]) => { const R = window.__SP_DEBUG[which], s = R.months, out = [];
    for (let y = 1; y <= 5; y++) { const a = 12 * y - 11; if (m < a) { out.push(null); continue; } const b = Math.min(12 * y, m); let r = 0, e = 0, f = 0;
      for (let t = a; t <= b; t++) { r += s[t - 1].revenue; e += s[t - 1].ebita; f += s[t - 1].fcf; }
      const nw = q => q.cash.receivablesClosing - q.cash.deferredClosing, prior = a === 1 ? s[0].cash.receivablesOpening - s[0].cash.deferredOpening : nw(s[a - 2]);
      out.push({ r, e, f, ar: s[b - 1].cash.receivablesClosing, nwc: nw(s[b - 1]), dnwc: nw(s[b - 1]) - prior, cO: s[a - 1].cashOpening, cC: s[b - 1].cashClosing }); }
    return out; }, [which, m]);
  const c40 = await cols(pg), e40 = await eng(pg, 'expRes', 40);
  const same = (arr, key, E) => arr.every((v, i) => E[i] === null ? v === '' : v === fk(E[i][key]));
  rec('FORMATION M40: Y1–Y3 are annual statements, Y4 reads M37–M40 YTD (working capital "at M40"), Y5 is blank and names the month it opens; the highlight is on Y4; the period reads "Statements through M40"',
      c40.heads.join('|') === 'M1–M12|M13–M24|M25–M36|M37–M40 YTD|opens M49' && c40.wcHeads.join('|') === 'M1–M12|M13–M24|M25–M36|at M40|opens M49' && c40.sel.join('|') === '|||sel|fut' && c40.period === 'Statements through M40',
      JSON.stringify({ heads: c40.heads, wc: c40.wcHeads, sel: c40.sel, period: c40.period }));
  rec('FORMATION M40: flows are the actual months summed through T, never annualised (revenue, EBITA, cash FCF); balances are at T (receivables, NWC); ΔNWC runs from the prior year-end (M36) and Y1\'s from the M0 opening; cash opens at the year-start balance and closes at T; the direct-method check agrees',
      same(c40.rev, 'r', e40) && same(c40.ebita, 'e', e40) && same(c40.fcf, 'f', e40) && same(c40.ar, 'ar', e40) && same(c40.nwc, 'nwc', e40) && same(c40.dnwc, 'dnwc', e40) && same(c40.cashO, 'cO', e40) && same(c40.cashC, 'cC', e40) && c40.chk[3] === c40.fcf[3] && c40.chk[4] === '' && /^✓ agrees .* every period to date$/.test(c40.ok),
      JSON.stringify({ rev: c40.rev, fcf: c40.fcf, dnwc: c40.dnwc, cashC: c40.cashC }));

  /* ---- BOUNDARY ---- */
  await view(pg, 'base'); const b40 = await cols(pg), eb = await eng(pg, 'baseRes', 40);
  const noDelta = await D(pg, () => document.querySelectorAll('#lens-cash [data-finv]').length);
  rec('BOUNDARY: viewing Base, Financials is cut at the same month as the Experiment — Base\'s Y4 is its own M37–M40, Y5 blank — and there is no Δ vs Base mode: Financials states one world',
      same(b40.rev, 'r', eb) && same(b40.fcf, 'f', eb) && b40.heads.join('|') === c40.heads.join('|') && noDelta === 0, JSON.stringify({ base: b40.rev, noDelta }));
  await view(pg, 'exp');

  /* ---- BACKWARD ---- */
  await scrub(pg, 20); const c20 = await cols(pg), e20 = await eng(pg, 'expRes', 20);
  await scrub(pg, 40); const back = await cols(pg);
  rec('BACKWARD: scrubbing from M40 back to M20 unforms the statements — Y2 becomes M13–M20 YTD, Y3–Y5 blank, figures the months through M20 — and returning to M40 restores them exactly',
      c20.heads.join('|') === 'M1–M12|M13–M20 YTD|opens M25|opens M37|opens M49' && same(c20.rev, 'r', e20) && same(c20.cashC, 'cC', e20) && c20.rev.slice(2).every(v => v === '') && JSON.stringify(back) === JSON.stringify(c40),
      JSON.stringify({ heads: c20.heads, rev: c20.rev }));

  /* ---- COST ---- */
  const cost = await D(pg, async () => { const W = window.__SP_DEBUG, s = W.finStats, b = s.builds, t = s.ticks;
    const hid = document.getElementById('lens-growth'), cell = document.querySelector('#lens-cash td[data-fr]'), path = document.querySelector('#lens-cash svg path.ln');
    const sc = document.getElementById('scrub'); sc.value = '10'; sc.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('play').click(); await new Promise(r => setTimeout(r, 1800)); document.getElementById('play').click();
    return { months: Math.round(+sc.value) - 10, builds: s.builds - b, ticks: s.ticks - t, hidden: document.body.contains(hid), cell: document.body.contains(cell), path: document.body.contains(path) }; });
  rec('COST: while the clock plays on Financials every month change is a tick and none is a build; the hidden lenses, the statement cells and the chart\'s paths are the same nodes throughout',
      cost.months >= 2 && cost.builds === 0 && cost.ticks >= cost.months && cost.hidden && cost.cell && cost.path, JSON.stringify(cost));
  const struct = await D(pg, () => { const s = window.__SP_DEBUG.finStats, b = s.builds; document.querySelector('[data-vw="base"]').click(); const v1 = s.builds - b;
    document.querySelector('[data-vw="exp"]').click(); document.querySelector('.lensnav .btn[data-lens="growth"]').click(); document.querySelector('.lensnav .btn[data-lens="cash"]').click();
    const sc = document.getElementById('scrub'), t = s.ticks; sc.value = '33'; sc.dispatchEvent(new Event('input', { bubbles: true })); return { view: v1, afterLens: s.ticks - t }; });
  rec('STRUCTURE: a structural change (the viewed world, a lens change) forces a full build, after which month changes are ticks again', struct.view === 1 && struct.afterLens === 1, JSON.stringify(struct));
  await pg.close();

  /* ---- MOBILE ---- */
  const mb = await open(390, 844); await pack(mb, 'wA'); await lens(mb, 'cash'); await scrub(mb, 40);
  const mob = await D(mb, () => ({ top: [...document.querySelectorAll('#lens-cash table.fs')[0].querySelectorAll('th[data-fh]')].map(th => th.innerText.trim()),
    wc: [...document.querySelectorAll('#lens-cash table.fs')[1].querySelectorAll('th[data-fh]')].map(th => th.innerText.trim()), sub: getComputedStyle(document.querySelector('#lens-cash tr.sub-h')).display,
    hs: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
  rec('MOBILE: with the period row hidden, the year in progress reads "Y4 YTD" (working capital "Y4 M40") and the page does not scroll sideways', mob.sub === 'none' && mob.top[3] === 'Y4 YTD' && mob.wc[3] === 'Y4 M40' && mob.top[4] === 'Y5' && !mob.hs, JSON.stringify(mob));
  await mb.close();

  rec('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await br.close();
  let ok = 0; for (const [n, p, d] of P) { console.log((p ? '  PASS  ' : '  FAIL  ') + n + (d && !p ? '\n        ' + d : '')); if (p) ok++; }
  console.log('========================================================================================');
  console.log(ok + ' / ' + P.length + ' financials-accept checks passed');
  process.exit(ok === P.length ? 0 : 1);
})();
