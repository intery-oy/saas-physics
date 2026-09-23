/*
 * SaaS Physics — LIVE acceptance checks: the instrument while the clock is running.
 *
 * Time running used to make the portal unusable. The clock rebuilds the stage's markup about
 * eleven times a second, and a rebuild between a press and its release destroys the very node
 * being pressed — after which the browser dispatches no click at all. Every control on the
 * stage was therefore dead until the run reached month 60: the lens tabs did not switch, the
 * disclosures did not open, a chart could not be clicked to a month, a stratum could not be
 * inspected. The press was real; the click never existed.
 *
 * These checks hold the repair, and the two things the repair must not cost:
 *
 *   TABS        the five lenses switch while the clock runs
 *   NAV         the four layers switch while the clock runs
 *   DISCLOSE    a section opened under a running clock opens, and stays open as months pass
 *   SCRUB       a click on a lens chart moves the month there and stops the clock — transport included
 *   INSPECT     a stratum can be pinned and released while the clock runs
 *   TIME        holding a press does not stop time, and does not lose the months it spans
 *   LEVERS      a lever drag still moves its consequence live, under the finger
 *
 * Run: node live-accept.js
 */
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

/* a real press: down, a human-length hold, up — the sequence the bug ate. Playwright's click()
   is too fast to reproduce it reliably, so every check here presses by hand. */
async function press(pg, sel, ms) {
  const b = await pg.evaluate(s => { const e = document.querySelector(s); if (!e) return null;
    e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), h: r.height }; }, sel);
  if (!b || b.h <= 0) return false;
  await pg.mouse.move(b.x, b.y); await pg.mouse.down(); await pg.waitForTimeout(ms || 120); await pg.mouse.up();
  await pg.waitForTimeout(320); return true;
}
const running = pg => pg.evaluate(() => document.getElementById('play').classList.contains('play'));
async function run(pg, want) { const is = await running(pg);
  if (is !== want) { await pg.evaluate(() => document.getElementById('play').click()); await pg.waitForTimeout(250); } }

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL); await pg.waitForTimeout(700);
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });
  await pg.waitForTimeout(400);
  await run(pg, true);

  /* ---- TABS ---- */
  const seen = [];
  for (const id of ['customers', 'growth', 'monetization', 'cash', 'company']) {
    await press(pg, '.lensnav .btn[data-lens="' + id + '"]');
    seen.push(await pg.evaluate(() => document.getElementById('side').dataset.active));
  }
  rec('TABS: with the clock running, one press on each of the five lens tabs switches to that lens',
      seen.join('|') === 'customers|growth|monetization|cash|company' && await running(pg), seen.join('|'));

  /* ---- NAV ---- */
  const navs = [];
  for (const id of ['nav-compare', 'nav-system', 'nav-company']) {
    await press(pg, '#' + id);
    navs.push(await pg.evaluate(i => document.getElementById(i).classList.contains('on'), id));
  }
  /* presets live in the Experiment drawer: the chip, then Browse presets */
  await press(pg, '#rail-toggle'); await press(pg, '#nav-scen');
  navs.push(await pg.evaluate(() => document.getElementById('nav-scen').classList.contains('on') && !document.querySelector('.app').classList.contains('rail-open')));
  await press(pg, '#nav-company');
  rec('NAV: with the clock running, Compare, System and Company each take the layer on one press, and the presets open from the Experiment drawer',
      navs.every(Boolean) && await running(pg), JSON.stringify(navs));

  /* ---- FINANCIALS ---- */
  /* with the clock running, Financials forms in place: the month tick re-prints the figures that
     depend on the month and nothing is rebuilt; a press on its link still lands */
  await run(pg, true);
  await press(pg, '.lensnav .btn[data-lens="cash"]');
  const f0 = await pg.evaluate(() => ({ st: Object.assign({}, window.__SP_DEBUG.finStats), m: Math.round(+document.getElementById('scrub').value), cell: document.querySelector('#lens-cash td[data-fr]'), period: document.querySelector('#lens-cash [data-fp]').textContent }));
  await pg.evaluate(() => { window.__finCell = document.querySelector('#lens-cash td[data-fr]'); window.__finPath = document.querySelector('#lens-cash svg path.ln'); });
  await pg.waitForTimeout(1500);
  const f1 = await pg.evaluate(() => ({ st: Object.assign({}, window.__SP_DEBUG.finStats), m: Math.round(+document.getElementById('scrub').value), kept: document.body.contains(window.__finCell) && document.body.contains(window.__finPath), period: document.querySelector('#lens-cash [data-fp]').textContent }));
  const went = await press(pg, '.fin-go[data-go="cash"]');
  const landed = await pg.evaluate(() => ({ sys: document.getElementById('nav-system').classList.contains('on'), view: window.__SP_DEBUG.sysView }));
  rec('FINANCIALS: under a running clock the statements form in place — months pass, the period reads the new month, no rebuild, cells and chart paths are the same nodes — and a press on "Mechanism · System → Cash" lands there',
      f1.m > f0.m && f1.st.ticks > f0.st.ticks && f1.st.builds === f0.st.builds && f1.kept && f1.period !== f0.period && went && landed.sys && landed.view === 'cash',
      JSON.stringify({ f0: { st: f0.st, m: f0.m, period: f0.period }, f1, landed }));
  await press(pg, '#nav-company');

  /* ---- SCRUB ---- */
  await press(pg, '.lensnav .btn[data-lens="customers"]'); await run(pg, true);
  const target = await pg.evaluate(() => { const s = document.querySelector('#side svg.ch:not([data-x])'); if (!s) return null;
    s.scrollIntoView({ block: 'center' }); const r = s.getBoundingClientRect(), L = +s.dataset.l, R = +s.dataset.r, vw = 640;
    const frac = 0.8, px = r.width * frac;
    return { x: Math.round(r.x + px), y: Math.round(r.y + r.height / 2),
      want: Math.round(Math.max(0, Math.min(60, ((px / r.width * vw) - L) / (vw - L - R) * 60))) }; });
  if (target) { await pg.mouse.move(target.x, target.y); await pg.mouse.down(); await pg.waitForTimeout(120); await pg.mouse.up(); await pg.waitForTimeout(400); }
  const scrubbed = await pg.evaluate(() => ({ m: Math.round(+document.getElementById('scrub').value),
    running: document.getElementById('play').classList.contains('play'),
    glyph: document.getElementById('play').innerHTML.indexOf('rect') >= 0 ? 'pause' : 'play' }));
  rec('SCRUB: a press on a lens chart while the clock runs moves the month to that point and stops the clock — and the transport shows a stopped clock, not a running one',
      !!target && Math.abs(scrubbed.m - target.want) <= 1 && scrubbed.running === false && scrubbed.glyph === 'play',
      JSON.stringify({ target: target && target.want, scrubbed }));

  /* ---- INSPECT ---- */
  await press(pg, '#nav-company'); await press(pg, '.lensnav .btn[data-lens="company"]'); await run(pg, true);
  const scene = await pg.evaluate(() => { const r = document.getElementById('scene').getBoundingClientRect();
    return { x: Math.round(r.x + r.width * 0.5), y: Math.round(r.y + r.height * 0.75) }; });
  await pg.mouse.move(scene.x, scene.y); await pg.mouse.down(); await pg.waitForTimeout(120); await pg.mouse.up(); await pg.waitForTimeout(500);
  const pin = await pg.evaluate(() => ({ k: window.__SP_DEBUG.pinned, dossier: !!document.querySelector('.dossier'),
    life: !document.getElementById('cohort-life').hidden }));
  await run(pg, true);
  const backed = await press(pg, '#inspect-back');
  const home = await pg.evaluate(() => ({ k: window.__SP_DEBUG.pinned, life: document.getElementById('cohort-life').hidden }));
  rec('INSPECT: with the clock running a stratum can be pinned — chain and cohort figure open — and ‹ Company releases it',
      pin.k !== null && pin.dossier && pin.life && backed && home.k === null && home.life, JSON.stringify({ pin, home }));

  /* ---- TIME: a held press must not stop the clock ---- */
  await run(pg, true);
  const t0 = await pg.evaluate(() => +document.getElementById('scrub').value);
  /* a press on the lens heading: on the stage, so it is held, but it commands nothing */
  const dead = await pg.evaluate(() => { const e = document.querySelector('#side .lens-head'); const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + r.width * 0.5), y: Math.round(r.y + r.height * 0.5) }; });
  await pg.mouse.move(dead.x, dead.y); await pg.mouse.down(); await pg.waitForTimeout(1000); await pg.mouse.up();
  await pg.waitForTimeout(250);
  const t1 = await pg.evaluate(() => ({ v: +document.getElementById('scrub').value,
    label: document.getElementById('tlabel').textContent, running: document.getElementById('play').classList.contains('play') }));
  const labelM = parseInt((t1.label.match(/Month\s+(\d+)/) || [])[1], 10);
  rec('TIME: holding a press for a second suspends the rebuild, not time — the clock advances through the hold and the month label catches up on release',
      t1.v - t0 > 1.5 && t1.running && Math.abs(labelM - Math.round(t1.v)) <= 1,
      JSON.stringify({ from: +t0.toFixed(2), to: +t1.v.toFixed(2), label: t1.label }));

  /* ---- LEVERS: a lever on a lens is a way into the Experiment; the drag that must NOT be held back is the drawer's ---- */
  await run(pg, false);
  await press(pg, '.lensnav .btn[data-lens="growth"]');
  const readout = () => pg.evaluate(() => [].map.call(document.querySelectorAll('#lens-growth .dv'), function(e){ return e.textContent.trim(); }).join(' | '));
  await press(pg, '#lens-growth .lever[data-law="sm"]');
  const routed = await pg.evaluate(() => { const f = document.querySelector('.force.law-focus'); return { open: document.querySelector('.app').classList.contains('rail-open'), row: f && f.querySelector('#f-sm') ? 'sm' : null }; });
  const lev = await pg.evaluate(() => { const i = document.getElementById('f-sm'); i.scrollIntoView({ block: 'center' }); const r = i.getBoundingClientRect();
    return { x: Math.round(r.x + r.width * 0.3), y: Math.round(r.y + r.height / 2) }; });
  const before = await readout();
  await pg.mouse.move(lev.x, lev.y); await pg.mouse.down(); await pg.waitForTimeout(120);
  await pg.mouse.move(lev.x + 70, lev.y, { steps: 8 }); await pg.waitForTimeout(400);
  const during = await readout();
  await pg.mouse.up(); await pg.waitForTimeout(350);
  rec('LEVERS: a press on a lens lever opens the Experiment at that law, and the drawer slider\'s drag is not held back — the growth lens\'s readouts move under the finger, mid-drag',
      routed.open && routed.row === 'sm' && !!before && !!during && during !== before, JSON.stringify({ routed, before, during }));
  await pg.evaluate(() => document.getElementById('rail-close').click());

  rec('no page errors', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' live-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
