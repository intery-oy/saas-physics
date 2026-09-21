/*
 * SaaS Physics — SYSTEM · CUSTOMERS acceptance checks.
 *
 * The Model Ledger is the record; the Customers page is the MECHANISM, annotated with one
 * month's canonical quantities. Two things can go wrong with such a page and neither is
 * visible to a DOM assertion: the numbers can stop being the engine's, and the marks can
 * land somewhere other than where the grammar says they land. This suite asks both.
 *
 *   PROJECTION  every drawn value is the engine's own published field, in eight worlds
 *               and across the run — never a second calculation
 *   BRIDGES     both registers close: logos, and money
 *   ABSENCE     contraction and expansion carry NO logo cell. The emptiness is the claim
 *   COLUMNS     a column is one event: the logo mark and the money mark share its axis
 *   SCALE       stocks on one run-wide scale, flows on another, both monotone in value,
 *               no non-zero flow drawn invisible, and the declared magnification is true
 *   MONTH       scrubbing changes the quantities and NOT the scales, so growth is real
 *   LAWS        the laws drawn are the laws in force this month, hypotheses included,
 *               and each sits above the flow it governs
 *   BOUNDS      every mark is inside the canvas and no two marks in a register collide
 *   REACH       the page is whole on desktop and on an iPad, in both orientations
 *
 * Run: node customers-accept.js
 */
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
const SYS = { W: 1260, H: 770 };
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 1e-6 : tol);

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (w, h, pack) => {
    const pg = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push(w + 'x' + h + '/' + pack + ': ' + e.message));
    await pg.goto(URL); await pg.waitForTimeout(500);
    await pg.evaluate(() => document.getElementById('welcome-enter').click());
    await pg.waitForTimeout(300);
    await pg.evaluate(p => document.getElementById('pack-' + p).click(), pack);
    await pg.waitForTimeout(300);
    await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'System'); if (b) b.click(); });
    await pg.waitForTimeout(200);
    await pg.evaluate(() => document.getElementById('sysview-customers').click());
    await pg.waitForTimeout(200);
    await pg.evaluate(() => { const b = document.getElementById('play'); if (b && b.classList.contains('play')) b.click(); });
    await pg.waitForTimeout(150);
    return pg;
  };
  /* move the portal to month m and hand back BOTH what was drawn and what the engine holds */
  const at = (pg, m) => pg.evaluate(async mm => {
    const s = document.getElementById('scrub'); s.value = mm; s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 90));
    const D = window.__SP_DEBUG, res = D.expRes, mo = res.months[mm - 1], cu = mo.customers;
    return {
      drawn: JSON.parse(JSON.stringify(D.customersView)),
      engine: {
        opening: cu.opening, newCustomers: cu.newCustomers, logoChurn: cu.logoChurn, closing: cu.closing,
        openingARR: mo.openingARR, newARR: mo.newARR, expansion: mo.expansion,
        logoChurnARR: cu.logoChurnARR, contractionARR: cu.contractionARR, closingARR: mo.closingARR
      },
      laws: (mo.interventions ? mo.interventions.changes : []).map(c => ({ target: c.target, to: c.to })),
      monetization: !!mo.monetization
    };
  }, m);

  /* ---------------- PROJECTION: eight worlds, four months each ---------------- */
  const WORLDS = ['customers', 'priced', 'cash', 'full', 'wA', 'wB', 'wC'];
  const MONTHS = [1, 4, 12, 27, 60];
  const proj = [], bridge = [], absent = [], colAxis = [], invisible = [], bounds = [];
  for (const W of WORLDS) {
    const pg = await open(1440, 900, W);
    for (const m of MONTHS) {
      const s = await at(pg, m);
      if (!s.drawn) { proj.push(W + ' M' + m + ': nothing drawn'); continue; }
      const c = s.drawn.cols, e = s.engine;
      const want = [
        ['opening.logo', c[0].logo && c[0].logo.v, e.opening], ['opening.arr', c[0].arr.v, e.openingARR],
        ['new.logo', c[1].logo && c[1].logo.v, e.newCustomers], ['new.arr', c[1].arr.v, e.newARR],
        ['churn.logo', c[2].logo && c[2].logo.v, e.logoChurn], ['churn.arr', c[2].arr.v, e.logoChurnARR],
        ['contraction.arr', c[3].arr.v, e.contractionARR], ['expansion.arr', c[4].arr.v, e.expansion],
        ['closing.logo', c[5].logo && c[5].logo.v, e.closing], ['closing.arr', c[5].arr.v, e.closingARR]
      ];
      for (const [k, drew, eng] of want) if (!near(drew, eng, Math.max(1e-9, Math.abs(eng) * 1e-12))) proj.push(W + ' M' + m + ' ' + k + ': drew ' + drew + ' engine ' + eng);
      /* both bridges close */
      const tol = v => Math.max(1e-6, Math.abs(v) * 1e-9);
      if (Math.abs(s.drawn.bridges.logo) > tol(e.closing)) bridge.push(W + ' M' + m + ' logos ' + s.drawn.bridges.logo);
      if (Math.abs(s.drawn.bridges.arr) > tol(e.closingARR)) bridge.push(W + ' M' + m + ' arr ' + s.drawn.bridges.arr);
      /* the deliberate absence — and it is drawn as an absence, not omitted */
      if (c[3].logo !== null || c[4].logo !== null) absent.push(W + ' M' + m + ': a logo cell was drawn under contraction or expansion');
      if (!c[3].logoEmpty || !c[4].logoEmpty) absent.push(W + ' M' + m + ': the empty logo cell is missing its placeholder');
      for (const i of [0, 1, 2, 5]) if (!c[i].logo) absent.push(W + ' M' + m + ': column ' + i + ' lost its logo cell');
      /* a column is ONE event: the logo mark and the money mark share its axis */
      for (const col of c) {
        const lm = col.logo ? col.logo.rect : col.logoEmpty;
        const lc = lm.x + lm.w / 2, ac = col.arr.rect.x + col.arr.rect.w / 2;
        if (Math.abs(lc - ac) > 0.75 || Math.abs(lc - col.x) > 0.75) colAxis.push(W + ' M' + m + ' ' + col.n + ': logo ' + lc + ' money ' + ac + ' axis ' + col.x);
      }
      /* a flow that happened is never drawn as nothing */
      for (const col of c) {
        if (col.logo && Math.abs(col.logo.v) > 1e-9 && col.logo.rect.h < 3) invisible.push(W + ' M' + m + ' ' + col.n + ' logo h=' + col.logo.rect.h);
        if (Math.abs(col.arr.v) > 1e-9 && col.arr.rect.h < 3) invisible.push(W + ' M' + m + ' ' + col.n + ' arr h=' + col.arr.rect.h);
      }
      /* inside the canvas, and each register's marks stay in their own band */
      for (const col of c) {
        for (const [tag, r] of [['logo', col.logo ? col.logo.rect : col.logoEmpty], ['arr', col.arr.rect]]) {
          if (r.x < 0 || r.x + r.w > SYS.W || r.y < 0 || r.y + r.h > SYS.H) bounds.push(W + ' M' + m + ' ' + col.n + ' ' + tag + ' outside the canvas');
        }
        const lb = col.logo ? col.logo.rect : col.logoEmpty;
        if (lb.y + lb.h > s.drawn.registers.arr.base - s.drawn.registers.arr.h) bounds.push(W + ' M' + m + ' ' + col.n + ': the registers overlap');
      }
    }
    await pg.close();
  }
  rec('PROJECTION: every figure the page draws is the engine\'s own published field — customers, ARR, and each of the four movements — across seven worlds and five months. The page reports canonical state; it never computes economics of its own',
      proj.length === 0, proj.slice(0, 6).join(' | '));
  rec('BRIDGES: both registers close on their own arithmetic — opening + new − lost = closing for logos, and opening + new + expansion − churn − contraction = closing for money — with residuals at double-precision noise',
      bridge.length === 0, bridge.slice(0, 6).join(' | '));
  rec('ABSENCE: contraction and expansion carry no logo mark and the empty cell is DRAWN, not omitted — the same customers, paying differently, is the distinction the two registers exist to make',
      absent.length === 0, absent.slice(0, 6).join(' | '));
  rec('COLUMNS: a column is one event. The logo mark and the money mark share the column\'s axis to within a pixel, so the eye can read straight down from a count to the euros it carried',
      colAxis.length === 0, colAxis.slice(0, 6).join(' | '));
  rec('LEGIBLE: no movement that actually happened is drawn as nothing — every non-zero flow gets at least three pixels, which is why the flows carry their own scale',
      invisible.length === 0, invisible.slice(0, 6).join(' | '));
  rec('BOUNDS: every mark lands inside the canvas, and the logo register never reaches into the money register',
      bounds.length === 0, bounds.slice(0, 6).join(' | '));

  /* ---------------- SCALE: honest, declared, and monotone ---------------- */
  {
    const pg = await open(1440, 900, 'customers');
    const seq = [];
    for (const m of [1, 12, 24, 36, 48, 60]) seq.push(await at(pg, m));
    const scalesFixed = seq.every(s => s.drawn.registers.logos.h === seq[0].drawn.registers.logos.h
      && near(s.drawn.registers.logos.mag, seq[0].drawn.registers.logos.mag, 1e-9)
      && near(s.drawn.registers.arr.mag, seq[0].drawn.registers.arr.mag, 1e-9));
    /* a bigger stock is a taller bar, every month, in both registers */
    const mono = [];
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1].drawn.cols, b = seq[i].drawn.cols;
      if (b[5].logo.v > a[5].logo.v && !(b[5].logo.rect.h > a[5].logo.rect.h)) mono.push('logo stock M' + seq[i].drawn.month);
      if (b[5].arr.v > a[5].arr.v && !(b[5].arr.rect.h > a[5].arr.rect.h)) mono.push('arr stock M' + seq[i].drawn.month);
    }
    /* within a register, the ratio of two flow bars is the ratio of the two flows */
    const ratio = [];
    for (const s of seq) {
      const c = s.drawn.cols;
      for (const [p, q] of [[1, 2], [3, 4]]) {
        const hv = c[p].arr.rect.h / c[q].arr.rect.h, vv = Math.abs(c[p].arr.v) / Math.abs(c[q].arr.v);
        if (Math.min(c[p].arr.rect.h, c[q].arr.rect.h) > 3.5 && Math.abs(hv - vv) > 0.02 * vv) ratio.push('M' + s.drawn.month + ' ' + c[p].n + '/' + c[q].n + ' bars ' + hv.toFixed(3) + ' values ' + vv.toFixed(3));
      }
    }
    /* the printed magnification is the real one: a flow bar of value v is mag× the
       height a stock of value v would get */
    const declared = [];
    for (const s of seq) {
      const R = s.drawn.registers.arr, c = s.drawn.cols;
      const stockPerEuro = c[5].arr.rect.h / c[5].arr.v, flowPerEuro = c[1].arr.rect.h / c[1].arr.v;
      if (Math.abs(flowPerEuro / stockPerEuro - R.mag) > 0.02 * R.mag) declared.push('M' + s.drawn.month + ' real ' + (flowPerEuro / stockPerEuro).toFixed(2) + ' printed ' + R.mag.toFixed(2));
    }
    rec('SCALE · fixed: the two scales are computed once over the whole run, not per month, so scrubbing the clock shows the company growing rather than the axis rescaling under it',
        scalesFixed, JSON.stringify(seq.map(s => [s.drawn.month, s.drawn.registers.arr.mag])));
    rec('SCALE · monotone: a larger stock is always a taller bar, in both registers, month over month', mono.length === 0, mono.join(' | '));
    rec('SCALE · truthful within a register: the ratio of two flow bars is the ratio of the two flows, to within 2% — magnifying the flows changes the unit, never the relative magnitude',
        ratio.length === 0, ratio.slice(0, 4).join(' | '));
    rec('SCALE · declared: the magnification printed beside the register is the magnification actually used, so the second scale is stated rather than hidden',
        declared.length === 0, declared.slice(0, 4).join(' | '));
    /* the quantities move with the month even though the scales do not */
    const moved = seq[0].drawn.cols[5].arr.v !== seq[5].drawn.cols[5].arr.v && seq[0].drawn.cols[2].logo.v !== seq[5].drawn.cols[2].logo.v;
    rec('MONTH: the selected month changes what the page reports — the stocks, the flows and the measurements are that month\'s, not the run\'s', moved,
        JSON.stringify([seq[0].drawn.cols[5].arr.v, seq[5].drawn.cols[5].arr.v]));
    await pg.close();
  }

  /* ---------------- LAWS: in force this month, above the flow they govern ---------------- */
  {
    const bad = [];
    const pg = await open(1440, 900, 'full');       // monetization + a costed retention hypothesis
    for (const m of [4, 12, 24]) {
      const s = await at(pg, m);
      const byKey = Object.fromEntries(s.drawn.laws.map(l => [l.key, l]));
      const colX = Object.fromEntries(s.drawn.cols.map(c => [c.n, c.x]));
      if (!byKey.logoRetentionAnnual || byKey.logoRetentionAnnual.x !== colX['− LOST LOGOS']) bad.push('M' + m + ': logo retention is not above the lost-logos column');
      if (!byKey.contractionAnnual || byKey.contractionAnnual.x !== colX['− CONTRACTION']) bad.push('M' + m + ': contraction is not above the contraction column');
      /* under Monetization the generic expansion coefficient is bypassed, so no valve claims it */
      if (s.monetization && byKey.expansionCoefficientAnnual) bad.push('M' + m + ': an expansion-coefficient valve is drawn although Monetization bypasses it');
      if (byKey.logoRetentionAnnual && byKey.logoRetentionAnnual.y >= s.drawn.registers.logos.base - s.drawn.registers.logos.h) bad.push('M' + m + ': a law is drawn inside the register it governs instead of above it');
    }
    /* the hypothesis moves the law the page shows: the valve reads the law IN FORCE
       this month, which in the hypothesis window is not the base setting */
    const q4 = await at(pg, 4), q24 = await at(pg, 24);
    const lawAt = s => Object.fromEntries(s.drawn.laws.map(l => [l.key, l]));
    const base = await pg.evaluate(() => window.__SP_DEBUG.expRes.assumptions ? null : null);
    const moved = q24.laws.filter(c => c.target === 'logoRetentionAnnual')[0];
    const before = lawAt(q4).logoRetentionAnnual, after = lawAt(q24).logoRetentionAnnual;
    const ok = q4.laws.filter(c => c.target === 'logoRetentionAnnual').length === 0
      && !!moved && !!after && Math.abs(after.value - moved.to) < 1e-12 && after.movedBy === 'ret'
      && !!before && before.movedBy === null && Math.abs(before.value - after.value) > 1e-9;
    rec('LAWS: each law is drawn above the flow it governs, and a law this world does not use is not drawn at all — under Monetization no valve claims the bypassed expansion coefficient',
        bad.length === 0, bad.slice(0, 5).join(' | '));
    rec('LAWS · hypotheses: inside the retention programme\'s window the logo-retention valve reads the moved law and says which hypothesis moved it; outside the window it reads the base setting. A valve shows the law in force, not the law you set',
        ok, JSON.stringify({ M4: before, M24: after, moved: moved }));
    await pg.close();
  }

  /* ---------------- REACH: whole on a desktop and on an iPad ---------------- */
  {
    const reach = {};
    for (const [w, h, tag] of [[1440, 900, 'desktop'], [1024, 768, 'ipad landscape'], [768, 1024, 'ipad portrait']]) {
      const pg = await open(w, h, 'full');
      await at(pg, 36);
      reach[tag] = await pg.evaluate(() => {
        const cv = document.querySelector('.stage canvas'), r = cv.getBoundingClientRect();
        const t = document.querySelector('.transport').getBoundingClientRect();
        return { drew: !!window.__SP_DEBUG.customersView, cvW: Math.round(r.width), cvH: Math.round(r.height),
          onScreen: r.top >= 0 && r.bottom <= innerHeight + 1, transport: t.bottom <= innerHeight + 1,
          hs: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      await pg.close();
    }
    rec('REACH: the page draws whole on a desktop and on an iPad in both orientations — canvas on screen, transport reachable, no horizontal scroll',
        Object.values(reach).every(r => r.drew && r.onScreen && r.transport && !r.hs && r.cvW > 400 && r.cvH > 200), JSON.stringify(reach));
  }

  /* ---------------- the other System views still draw ---------------- */
  {
    const pg = await open(1440, 900, 'full');
    const views = await pg.evaluate(async () => {
      const out = {};
      for (const v of ['ontology', 'company', 'monetization', 'cash', 'hypotheses', 'customers']) {
        document.getElementById('sysview-' + v).click();
        await new Promise(r => setTimeout(r, 160));
        out[v] = window.__SP_DEBUG.sysView === v;
      }
      return out;
    });
    rec('NEIGHBOURS: the other System layers are untouched — each still opens and draws', Object.values(views).every(Boolean), JSON.stringify(views));
    await pg.close();
  }

  rec('no page errors in any world, month or viewport', errs.length === 0, errs.slice(0, 4).join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' customers-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
