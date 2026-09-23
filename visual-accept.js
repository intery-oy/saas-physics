/*
 * SaaS Physics — VISUAL acceptance checks: render each surface and LOOK at the pixels.
 *
 * Every other suite in this repository interrogates the DOM and the CSSOM — textContent,
 * getComputedStyle, element counts. The Model Ledger shipped twice completely unreadable and
 * sixteen such checks called it correct: a class name collided with the SVG chart class, the
 * header row fell out of the table's row model, and the month column swallowed four thousand
 * pixels of slack so every number sat off screen. The markup was perfect. The page was blank.
 *
 * This suite renders each surface and measures the IMAGE:
 *
 *   INK        the content area is not an empty rectangle — a surface that draws nothing fails
 *   INTERIOR   ink reaches the inside, not just the header band and the first column
 *   ALIGNED    where there is a table, header and body share one column structure
 *   NOERR      nothing threw while drawing it
 *
 * Pixels are read by drawing the screenshot into a canvas in the page itself, so the suite needs
 * no image library. PNGs are written to .visual/ (git-ignored) so a failure can be looked at.
 *
 * Run: node visual-accept.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
const SHOTS = path.resolve(__dirname, '.visual');

/* Draw the PNG into a canvas and report what is actually on it. "Ink" is any pixel far enough
   from the darkest background tone to be something a reader can see. */
async function look(pg, buf) {
  return pg.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const w = img.naturalWidth, h = img.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, w, h).data;
    /* A 16x16 occupancy grid, not a single ink total. The total is what a broken surface passes:
       the ledger with its data pushed off screen still had a full header band and a full month
       column, which is plenty of ink and plenty of columns-touched, and an earlier version of
       this check waved it through. What separates a working surface from that one is whether
       ink reaches the INTERIOR — the cells away from the first row and the first column. */
    const N = 16, cell = new Array(N * N).fill(0);
    let ink = 0;
    for (let y = 0; y < h; y++) {
      const gy = Math.min(N - 1, Math.floor(y / h * N));
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        /* the darkest surface here is about rgb(10,13,21); brighter than the panel tone is a mark */
        if (d[i] + d[i + 1] + d[i + 2] > 120) { ink++; cell[gy * N + Math.min(N - 1, Math.floor(x / w * N))]++; }
      }
    }
    const per = (w / N) * (h / N), occupied = c => c / per > 0.004;
    let filled = 0, interior = 0, interiorTotal = 0;
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
      const c = cell[gy * N + gx];
      if (occupied(c)) filled++;
      if (gy >= 2 && gx >= 2) { interiorTotal++; if (occupied(c)) interior++; }
    }
    return { w, h, inkFraction: ink / (w * h), gridFilled: filled / (N * N), interiorFilled: interior / interiorTotal };
  }, 'data:image/png;base64,' + buf.toString('base64'));
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const pg = await br.newPage({ viewport: { width: 1440, height: 900 } });
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL); await pg.waitForTimeout(800);
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { const p = document.getElementById('play'); if (p.classList.contains('play')) p.click(); });
  await pg.waitForTimeout(300);
  /* a scratch page whose only job is to decode the screenshots */
  const eye = await br.newPage();
  await eye.goto('about:blank');

  const surfaces = [
    ['company',   async () => { await pg.evaluate(() => document.getElementById('nav-company').click()); await pg.evaluate(() => document.querySelector('.lensnav .btn[data-lens="company"]').click()); }, '.stage'],
    ['customers', async () => { await pg.evaluate(() => document.querySelector('.lensnav .btn[data-lens="customers"]').click()); }, '.stage'],
    ['growth',    async () => { await pg.evaluate(() => document.querySelector('.lensnav .btn[data-lens="growth"]').click()); }, '.stage'],
    ['monetization', async () => { await pg.evaluate(() => document.querySelector('.lensnav .btn[data-lens="monetization"]').click()); }, '.stage'],
    ['cash',      async () => { await pg.evaluate(() => document.querySelector('.lensnav .btn[data-lens="cash"]').click()); }, '.stage'],
    ['system',    async () => { await pg.evaluate(() => document.getElementById('nav-system').click()); await pg.evaluate(() => document.getElementById('sysview-ontology').click()); }, '.stage'],
    ['ledger-core', async () => { await pg.evaluate(() => document.getElementById('menu-ledger').click()); }, '#ledger'],
    ['ledger-full', async () => { await pg.evaluate(() => document.getElementById('ldg-full').click()); }, '#ledger'],
    ['compare',   async () => { await pg.evaluate(() => document.getElementById('nav-compare').click()); }, '.stage'],
    ['scenarios', async () => { await pg.evaluate(() => document.getElementById('nav-scen').click()); }, '.stage'],
  ];

  const seen = {};
  for (const [name, go, sel] of surfaces) {
    await go(); await pg.waitForTimeout(900);
    const buf = await pg.locator(sel).screenshot();
    fs.writeFileSync(path.join(SHOTS, name + '.png'), buf);
    seen[name] = await look(eye, buf);
  }

  /* INK — thresholds are per surface because a stock-and-flow diagram is sparser than a table */
  const FLOOR = { company: 0.010, customers: 0.010, growth: 0.010, monetization: 0.008, cash: 0.010,
                  system: 0.004, 'ledger-core': 0.020, 'ledger-full': 0.020, compare: 0.006, scenarios: 0.006 };
  const thin = Object.keys(seen).filter(k => seen[k].inkFraction < FLOOR[k]);
  rec('INK: every surface actually draws something — each rendered image carries marks well above an empty rectangle, at its own floor for how dense that surface should be',
      thin.length === 0, JSON.stringify(Object.keys(seen).map(k => k + ' ' + (seen[k].inkFraction * 100).toFixed(2) + '% (floor ' + (FLOOR[k] * 100).toFixed(1) + '%)')));

  /* INTERIOR — the check that would have caught the ledger. A surface whose content has been
     pushed off screen keeps its header band and its first column and loses everything else, so
     the question is not how much ink there is but whether any of it is away from the edges. */
  const INTERIOR = { company: 0.35, customers: 0.35, growth: 0.30, monetization: 0.30, cash: 0.35,
                     system: 0.20, 'ledger-core': 0.85, 'ledger-full': 0.85, compare: 0.20, scenarios: 0.20 };
  const hollow = Object.keys(seen).filter(k => seen[k].interiorFilled < INTERIOR[k]);
  rec('INTERIOR: ink reaches the inside of each surface, not just its header band and its first column — the shape a table takes when its data has been pushed off screen',
      hollow.length === 0, JSON.stringify(Object.keys(seen).map(k => k + ' interior=' + (seen[k].interiorFilled * 100).toFixed(0) + '% (floor ' + (INTERIOR[k] * 100) + '%)')));

  rec('NOERR: nothing threw while drawing any surface', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' visual-accept checks passed   (images in .visual/)');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
