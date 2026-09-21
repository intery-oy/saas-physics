/*
 * SaaS Physics — MODEL LEDGER acceptance checks.
 *
 * The ledger is an auditor's surface, and an auditor's surface is worth exactly as much as its
 * fidelity: if it recomputed the economics it displays, its reconciliations would be circular and
 * would prove nothing about the engine. These checks hold both halves of that claim — that every
 * cell is the engine's own published state, and that the identities close on those cells.
 *
 *   REACHABLE    the ledger opens from System, as a table rather than a drawing
 *   PROJECTION   every value in the table equals the engine state the page is holding
 *   CHECKS       every check column reads 0, in five worlds × 60 months
 *   BREAKS       a deliberately corrupted figure is CAUGHT — the checks are live, not decorative
 *   BRIDGES      the named identities are present: recurring revenue, customers, cash, pipeline
 *   TIMING       produced and landed are separate columns, and the lag is visible between them
 *   WARM         a warm start shows its pre-window landings; a cold one shows the empty months
 *   SHAPE        one row per model month, columns unique and grouped in causal order
 *   VIEWS        Core is a subset of Full; both keep the month column and the grouped header
 *   STICKY       the month column and both header rows stay put when the table is scrolled
 *   MONTH        a row moves the portal's month; the clock only re-marks, never rebuilds
 *   OFF          a layer that is off publishes nothing, and its block is absent rather than empty
 *
 * Run: node ledger-accept.js
 */
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

const openLedger = async (pg, pack) => {
  if (pack) { await pg.evaluate(p => { const b = document.getElementById('pack-' + p); if (b) b.click(); }, pack); await pg.waitForTimeout(500); }
  await pg.evaluate(() => document.getElementById('nav-system').click()); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById('sysview-ledger').click()); await pg.waitForTimeout(400);
};
const setView = async (pg, v) => { await pg.evaluate(x => document.getElementById('ldg-' + x).click(), v); await pg.waitForTimeout(500); };

/* read the whole table out of the DOM, as a reader sees it */
const readTable = pg => pg.evaluate(() => {
  const tb = document.querySelector('table.ldg'); if (!tb) return null;
  const groups = [...tb.tHead.rows[0].cells].map(c => ({ n: c.textContent, span: c.colSpan }));
  const hdr = [...tb.tHead.rows[1].cells].map(c => c.textContent);
  const rows = [...tb.tBodies[0].rows].map(r => ({ t: +r.dataset.t, cells: [...r.cells].map(c => c.textContent), on: r.classList.contains('on') }));
  return { groups, hdr, rows, basis: document.getElementById('basis-mrr').classList.contains('on') ? 'MRR' : 'ARR',
    status: document.getElementById('ldg-status').textContent, statusOK: document.getElementById('ldg-status').classList.contains('ok') };
});
const num = s => { if (s === '—' || s === '' || /pre-window|off|FCF|^M/.test(s)) return null;
  const v = parseFloat(String(s).replace(/[€,×%\s]/g, '').replace('−', '-')); return isFinite(v) ? v : null; };

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const pg = await br.newPage({ viewport: { width: 1600, height: 950 } });
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(URL); await pg.waitForTimeout(700);
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); }); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const p = document.getElementById('play'); if (p.classList.contains('play')) p.click(); }); await pg.waitForTimeout(250);

  /* ---- REACHABLE ---- */
  const views = await pg.evaluate(() => [...document.querySelectorAll('#sysviews .btn')].map(b => b.textContent));
  await openLedger(pg, null);
  const opened = await pg.evaluate(() => ({ view: window.__SP_DEBUG.sysView, shown: !document.getElementById('ledger').hidden,
    table: !!document.querySelector('table.ldg'), coversCanvas: (() => { const l = document.getElementById('ledger').getBoundingClientRect(),
      c = document.getElementById('scene').getBoundingClientRect(); return l.width >= c.width - 1 && l.height >= c.height - 1; })() }));
  rec('REACHABLE: the Model Ledger is a System view, and it opens as a table over the machine rather than another drawing',
      views[views.length - 1] === 'Model Ledger' && opened.view === 'ledger' && opened.shown && opened.table && opened.coversCanvas,
      JSON.stringify({ views, opened }));

  /* ---- PROJECTION + CHECKS, across every world the product ships ---- */
  const PACKS = ['arr', 'customers', 'priced', 'cash', 'full', 'wA', 'wB', 'wC'];
  const proj = {}, chk = {}, dup = {};
  for (const pack of PACKS) {
    await openLedger(pg, pack); await setView(pg, 'full');
    const r = await pg.evaluate(() => {
      const res = window.__SP_DEBUG.expRes, tb = document.querySelector('table.ldg');
      const hdr = [...tb.tHead.rows[1].cells].map(c => c.textContent);
      const at = n => hdr.indexOf(n);
      const f = s => { if (s === '—' || s === '' || /pre-window|off/.test(s)) return null;
        const v = parseFloat(String(s).replace(/[€,×%\s]/g, '').replace('−', '-')); return isFinite(v) ? v : null; };
      const B = document.getElementById('basis-mrr').classList.contains('on') ? 'MRR' : 'ARR';
      const div = B === 'MRR' ? 12 : 1;
      const rows = [...tb.tBodies[0].rows];
      /* every one of these is a euro figure the engine published: the table must be showing
         that number, not one it worked out for itself */
      const want = m => [
        ['Opening ' + B, m.openingARR / div], ['+ New ' + B, m.newARR / div], ['+ Expansion', m.expansion / div],
        ['= Closing ' + B, m.closingARR / div], ['Retained', m.retainedARR / div], ['Leakage (total)', m.leakage / div],
        [B + ' produced', m.acquisitionLawNewARR / div], [B + ' landed', m.newARR / div],
        ['Pipeline closing', m.pendingNewARR / div], ['Pipeline spend closing', m.pendingSpend],
        ['S&M €', m.sm], ['Revenue', m.revenue], ['− COGS', m.cogs], ['= Gross profit', m.grossProfit],
        ['= EBITA', m.ebita], ['Opening cash', m.cashOpening], ['+ FCF', m.fcf], ['= Closing cash', m.cashClosing],
        ['MRR-native opening', m.openingMRR], ['MRR-native closing', m.closingMRR]
      ].concat(m.customers ? [['Opening customers', m.customers.opening], ['= Closing customers', m.customers.closing],
        ['− Logo churn', m.customers.logoChurn], ['− Contraction', m.customers.contractionARR / div], ['− Churn', m.customers.logoChurnARR / div]] : [])
       .concat(m.monetization ? [['Fixed', m.monetization.fixedARR / div], ['Variable', m.monetization.variableARR / div]] : [])
       .concat(m.cash ? [['Billings', m.cash.billings], ['Collections', m.cash.collections],
        ['Deferred closing', m.cash.deferredClosing], ['Receivables closing', m.cash.receivablesClosing]] : []);
      let worst = 0, worstAt = '', compared = 0;
      for (let i = 0; i < rows.length; i++) {
        const c = [...rows[i].cells].map(x => x.textContent), m = res.months[i];
        for (const [col, v] of want(m)) { const j = at(col); if (j < 0) { worst = Infinity; worstAt = 'missing column ' + col; continue; }
          const got = f(c[j]); if (got === null) continue; compared++;
          const d = Math.abs(got - Math.round(v)); if (d > worst) { worst = d; worstAt = 'M' + (i + 1) + ' ' + col + ' dom=' + got + ' engine=' + v; } }
      }
      /* every check column must read 0 on every row */
      const chkCols = hdr.map((h, i) => ({ h, i })).filter(x => /[Cc]heck$/.test(x.h));
      const broken = [];
      for (let i = 0; i < rows.length; i++) { const c = [...rows[i].cells];
        for (const { h, i: ci } of chkCols) { const t = c[ci].textContent; if (t !== '0' && t !== '—') broken.push('M' + (i + 1) + ' ' + h + '=' + t); } }
      const dupes = [...new Set(hdr.filter((h, i) => hdr.indexOf(h) !== i))];
      const status = document.getElementById('ldg-status');
      return { worst, worstAt, compared, nChk: chkCols.length, broken: broken.slice(0, 3), nBroken: broken.length,
        rows: rows.length, months: res.months.length, dupes, statusOK: status.classList.contains('ok'), status: status.textContent,
        rowStatus: [...rows].every(r => r.cells[r.cells.length - 1].textContent === 'ok') };
    });
    proj[pack] = r; chk[pack] = r; dup[pack] = r.dupes;
  }
  const allProj = Object.values(proj);
  rec('PROJECTION: every figure in the table is the number the engine published for that month — compared cell by cell against the run the page is holding, in all eight worlds',
      allProj.every(r => r.worst <= 0.5 && r.compared > 1000),
      JSON.stringify(Object.keys(proj).map(k => k + ': ' + proj[k].compared + ' cells, worst ' + proj[k].worst + (proj[k].worst > 0.5 ? ' @ ' + proj[k].worstAt : ''))));
  rec('CHECKS: every check column reads 0 on every month in every world, and the ledger says so in its own status',
      allProj.every(r => r.nBroken === 0 && r.nChk >= 10 && r.statusOK && r.rowStatus),
      JSON.stringify(Object.keys(chk).map(k => k + ': ' + chk[k].nChk + ' checks, ' + chk[k].nBroken + ' broken, ' + chk[k].status)));
  rec('SHAPE: exactly one row per model month, and no two columns share a name — in a table this wide a column has to name itself',
      allProj.every(r => r.rows === r.months && r.rows === 60 && r.dupes.length === 0), JSON.stringify(dup));

  /* ---- BREAKS: the checks have to be able to fail ---- */
  await openLedger(pg, 'wA'); await setView(pg, 'full');
  const broke = await pg.evaluate(() => {
    /* corrupt ONE published figure in the page's own run and re-render the ledger from it.
       Nothing else is touched: if the checks are live, the bridges that use closing ARR break
       and the row says so. The corruption is reverted immediately afterwards. */
    const res = window.__SP_DEBUG.expRes, m = res.months[23], keep = m.closingARR;
    m.closingARR = keep + 1000000;
    window.__SP_DEBUG.renderLedger(true);
    const tb = document.querySelector('table.ldg'), hdr = [...tb.tHead.rows[1].cells].map(c => c.textContent);
    const row = [...tb.tBodies[0].rows[23].cells].map(c => c.textContent);
    const caught = hdr.map((h, i) => ({ h, v: row[i] })).filter(x => /[Cc]heck$/.test(x.h) && x.v !== '0' && x.v !== '—');
    const status = document.getElementById('ldg-status').textContent;
    const rowCell = row[row.length - 1];
    m.closingARR = keep; window.__SP_DEBUG.renderLedger(true);
    const after = document.getElementById('ldg-status').textContent;
    return { caught: caught.map(x => x.h), status, rowCell, after };
  });
  rec('BREAKS: the checks are live — corrupting one published figure in the run breaks the identities that read it, the row is flagged, and the ledger stops saying every check closes',
      broke.caught.length >= 2 && /broken/.test(broke.status) && /broken/.test(broke.rowCell) && broke.after === 'all checks close',
      JSON.stringify(broke));

  /* ---- BRIDGES: the identities the ledger is for ---- */
  const t = await readTable(pg);
  const has = n => t.hdr.indexOf(n) >= 0;
  const groupNames = t.groups.map(g => g.n);
  rec('BRIDGES: the named reconciliations are all on screen — recurring revenue, customers, the acquisition pipeline, P&L, cash, deferred revenue and receivables',
      ['MRR check', 'Customer check', 'Pipeline check', 'Spend check', 'EBITA check', 'Cash check', 'Deferred check', 'Receivables check', 'Split check'].every(has),
      t.hdr.filter(h => /[Cc]heck$/.test(h)).join(' · '));
  rec('SHAPE: the columns are grouped in causal order — time and the laws, then acquisition, customers, recurring revenue, retention, monetization, P&L, cash, derived, integrity',
      groupNames.join('|') === ['Time · laws in force', 'Acquisition · spend → pipeline → landing', 'Customers', 'MRR · the recurring-revenue bridge',
        'Retention', 'Monetization', 'Revenue & P&L', 'Cash', 'Derived', 'Integrity'].join('|'), groupNames.join(' | '));

  /* ---- TIMING + WARM: the first-year shape, diagnosable ---- */
  const warm = await pg.evaluate(() => {
    const tb = document.querySelector('table.ldg'), hdr = [...tb.tHead.rows[1].cells].map(c => c.textContent);
    const at = n => hdr.indexOf(n), rows = [...tb.tBodies[0].rows];
    const col = n => rows.slice(0, 6).map(r => r.cells[at(n)].textContent);
    return { lag: rows[0].cells[at('Lag (months)')].textContent, from: col('from spend month'),
      produced: col('MRR produced'), landed: col('MRR landed'), pipe: col('Pipeline closing') };
  });
  rec('WARM: with a loaded pipeline the first months land ARR bought before month 1 — the ledger names the pre-window spend month each landing came from, which is what a warm start means',
      warm.lag === '4' && warm.from.slice(0, 4).every(x => /pre-window/.test(x)) && warm.landed.every(x => x !== '€0'),
      JSON.stringify(warm));

  /* the same world, cold: the diagnostic the ledger exists for */
  const cold = await pg.evaluate(async () => {
    const tog = document.getElementById('t-openingPipelineMonths');
    if (!tog) return { err: 'no opening-pipeline null switch' };
    tog.click();                                /* null the initial condition: an empty pipeline */
    await new Promise(z => setTimeout(z, 600));
    window.__SP_DEBUG.renderLedger(true);
    const tb = document.querySelector('table.ldg'), hdr = [...tb.tHead.rows[1].cells].map(c => c.textContent);
    const at = n => hdr.indexOf(n), rows = [...tb.tBodies[0].rows];
    const col = n => rows.slice(0, 6).map(r => r.cells[at(n)].textContent);
    const out = { produced: col('MRR produced'), landed: col('MRR landed'), pipe: col('Pipeline closing'), from: col('from spend month'),
      pipeOpen: rows[0].cells[at('Pipeline opening')].textContent };
    if (tog) tog.click(); await new Promise(z => setTimeout(z, 600));
    return out;
  });
  rec('TIMING: produced and landed are separate columns, so a cold pipeline reads off the table directly — four months producing ARR, landing none, the pipeline filling behind them',
      cold.pipeOpen === '€0' && cold.landed.slice(0, 4).every(x => x === '€0') && cold.produced.slice(0, 4).every(x => x !== '€0') &&
      cold.from.slice(0, 4).every(x => x === '—') && cold.landed[4] !== '€0' && new Set(cold.pipe.slice(0, 4)).size === 4,
      JSON.stringify(cold));

  /* ---- VIEWS ---- */
  await openLedger(pg, 'wA');
  await setView(pg, 'core'); const core = await readTable(pg);
  await setView(pg, 'full'); const full = await readTable(pg);
  rec('VIEWS: Core carries the economically important columns and Full exposes everything the engine publishes — Core is a strict subset, and both keep the month column and the grouped header',
      core.hdr.length < full.hdr.length && core.hdr.length > 30 && full.hdr.length > 100 &&
      core.hdr.every(h => full.hdr.indexOf(h) >= 0) && core.hdr[0] === 'Month' && full.hdr[0] === 'Month' &&
      core.groups.length === full.groups.length,
      JSON.stringify({ core: core.hdr.length, full: full.hdr.length, groups: core.groups.length }));

  /* ---- STICKY ---- */
  const sticky = await pg.evaluate(async () => {
    const sc = document.getElementById('ledgerscroll'), tb = document.querySelector('table.ldg');
    const scrollable = sc.scrollWidth > sc.clientWidth + 50;
    sc.scrollLeft = 1200; sc.scrollTop = 400; await new Promise(z => setTimeout(z, 200));
    const moCell = tb.tBodies[0].rows[20].cells[0], moHead = tb.tHead.rows[1].cells[0], grpHead = tb.tHead.rows[0].cells[0];
    const scr = sc.getBoundingClientRect();
    const inside = e => { const r = e.getBoundingClientRect(); return r.left >= scr.left - 1 && r.left < scr.left + 140 && r.top >= scr.top - 1 && r.bottom <= scr.bottom + 1; };
    const headOnTop = tb.tHead.rows[1].cells[8].getBoundingClientRect().top < scr.top + 60;
    const st = getComputedStyle(moCell).position, stH = getComputedStyle(tb.tHead.rows[1].cells[4]).position;
    sc.scrollLeft = 0; sc.scrollTop = 0;
    return { scrollable, monthCellStays: inside(moCell), monthHeadStays: inside(moHead), groupHeadStays: inside(grpHead), headOnTop, st, stH,
      scrollW: sc.scrollWidth, clientW: sc.clientWidth };
  });
  rec('STICKY: the table scrolls horizontally, and the month column and both header rows stay put — a column read a thousand pixels to the right still has a name and a month',
      sticky.scrollable && sticky.monthCellStays && sticky.monthHeadStays && sticky.groupHeadStays && sticky.headOnTop &&
      sticky.st === 'sticky' && sticky.stH === 'sticky', JSON.stringify(sticky));

  /* ---- MONTH ---- */
  const month = await pg.evaluate(async () => {
    const sc = document.getElementById('ledgerscroll'), tb = document.querySelector('table.ldg');
    const before = document.querySelector('table.ldg tr.on');
    const target = tb.tBodies[0].rows[35];
    target.scrollIntoView({ block: 'center' }); await new Promise(z => setTimeout(z, 150));
    const r = target.getBoundingClientRect();
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 40, clientY: r.top + 5 }));
    await new Promise(z => setTimeout(z, 400));
    return { was: before ? +before.dataset.t : null, m: Math.round(+document.getElementById('scrub').value),
      on: +document.querySelector('table.ldg tr.on').dataset.t, running: document.getElementById('play').classList.contains('play') };
  });
  const marked = await pg.evaluate(async () => {
    /* moving the month must re-mark a row, never rebuild 60 x 117 cells: the build counter is
       the honest test of that, and the table node staying the same object confirms it */
    const builds0 = window.__SP_DEBUG.ledgerBuilds, node0 = document.querySelector('table.ldg');
    const s = document.getElementById('scrub');
    for (const v of [9, 22, 41, 3]) { s.value = v; s.dispatchEvent(new Event('input')); await new Promise(z => setTimeout(z, 220)); }
    return { on: +document.querySelector('table.ldg tr.on').dataset.t, builds: window.__SP_DEBUG.ledgerBuilds - builds0,
      sameTable: document.querySelector('table.ldg') === node0 };
  });
  rec('MONTH: clicking a row moves the whole portal to that month, and moving the month elsewhere only re-marks the row — the clock never rebuilds the table underneath the reader',
      month.m === 36 && month.on === 36 && !month.running && marked.on === 3 && marked.builds === 0 && marked.sameTable,
      JSON.stringify({ month, marked }));

  /* ---- OFF ---- */
  await openLedger(pg, 'arr'); await setView(pg, 'full');
  const off = await readTable(pg);
  rec('OFF: a layer that is off publishes nothing, so its block is absent rather than a column of dashes — and the ledger says which layers are off',
      off.groups.map(g => g.n).indexOf('Customers') < 0 && off.groups.map(g => g.n).indexOf('Monetization') < 0 &&
      off.hdr.indexOf('Billings') < 0 && off.hdr.indexOf('Identity') >= 0 &&
      /layers off: Customers, Monetization, Cash/.test(await pg.evaluate(() => document.getElementById('ldg-note').textContent)),
      off.groups.map(g => g.n).join(' | '));

  /* ---- LAYER: the table is a System surface and stays there ---- */
  await openLedger(pg, 'wA');
  const leak = {};
  for (const nav of ['nav-company', 'nav-compare', 'nav-scen']) {
    await pg.evaluate(n => document.getElementById(n).click(), nav); await pg.waitForTimeout(400);
    leak[nav] = await pg.evaluate(() => { const e = document.getElementById('ledger'), r = e.getBoundingClientRect();
      return { hidden: e.hidden, display: getComputedStyle(e).display, area: Math.round(r.width * r.height) }; });
  }
  await pg.evaluate(() => document.getElementById('nav-system').click()); await pg.waitForTimeout(400);
  const back = await pg.evaluate(() => ({ view: window.__SP_DEBUG.sysView, shown: !document.getElementById('ledger').hidden,
    table: !!document.querySelector('table.ldg') }));
  /* the ledger sits INSIDE the figure box, over the canvas, and nothing else moved into it:
     an unclosed tag here would silently adopt the cohort figure and collapse it under Inspect,
     which is a failure the ledger's own checks would never see */
  const nest = await pg.evaluate(() => {
    const led = document.getElementById('ledger'), life = document.getElementById('cohort-life'), fw = document.getElementById('figwrap');
    return { ledgerParent: led.parentElement.className, lifeParent: life.parentElement.id,
      lifeInFigbox: !!life.closest('.figbox'), figboxChildren: [...document.querySelector('.figbox').children].map(c => c.id || c.tagName.toLowerCase()) };
  });
  rec('LAYER: the ledger is a System surface — leaving System puts it away rather than leaving a table over the company figure, and coming back restores it on the view it was left on; the table lives inside the figure box and has adopted nothing else',
      Object.values(leak).every(l => l.hidden && l.display === 'none' && l.area === 0) &&
      back.view === 'ledger' && back.shown && back.table &&
      nest.ledgerParent === 'figbox' && nest.lifeParent === 'figwrap' && !nest.lifeInFigbox &&
      nest.figboxChildren.join('|') === 'scene|lawhost|ledger',
      JSON.stringify({ leak, back, nest }));

  rec('no page errors', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' ledger-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
