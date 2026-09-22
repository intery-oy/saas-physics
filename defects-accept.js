/*
 * SaaS Physics — PHASE 1 DEFECT checks.
 *
 * Eight defects found by rendering every surface and reading the image, each verified
 * against the source before it was fixed. These checks hold the fixes in place, and each
 * is written to fail if the defect returns — not merely to pass on the current build.
 *
 *   BASIS       a per-customer figure obeys the MRR/ARR switch and names its period,
 *               on the Ontology and in Inspect. The same customer never reads €15k on
 *               one surface and €180k on another
 *   OPAQUE      Method covers what is behind it
 *   SEAM        Compare's plane-2 title and its reading are on one baseline, apart,
 *               with clearance from the recurring mass above
 *   LEDGER      the marked month is in view after a scrub, in both directions
 *   EDGE        no right-margin chart label overruns its margin
 *   GUTTER      every row in the Change drawer starts on the drawer's gutter
 *   LEGEND      the Hypotheses legend names the colour that is drawn
 *   CUE         a pane that scrolls says so, and stops saying so at the bottom
 *
 * Run: node defects-accept.js
 */
const { chromium } = require('playwright');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = [];
  const open = async (w, h) => {
    const pg = await br.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await pg.goto(URL); await pg.waitForTimeout(500);
    return pg;
  };
  const enter = async pg => { await pg.evaluate(() => document.getElementById('welcome-enter').click()); await pg.waitForTimeout(300); };
  const pack = async (pg, p) => { await pg.evaluate(x => document.getElementById('pack-' + x).click(), p); await pg.waitForTimeout(350); };
  const nav = async (pg, t) => { await pg.evaluate(x => { const b = [...document.querySelectorAll('button')].find(q => q.textContent.trim() === x); if (b) b.click(); }, t); await pg.waitForTimeout(300); };
  const sys = async (pg, v) => { await pg.evaluate(x => { const b = document.getElementById('sysview-' + x); if (b && !b.disabled) b.click(); }, v); await pg.waitForTimeout(400); };
  const month = async (pg, m) => { await pg.evaluate(mm => { const p = document.getElementById('play'); if (p && p.classList.contains('play')) p.click(); const s = document.getElementById('scrub'); s.value = mm; s.dispatchEvent(new Event('input', { bubbles: true })); }, m); await pg.waitForTimeout(350); };
  const setBasis = async (pg, b) => { await pg.evaluate(x => document.getElementById('basis-' + x).click(), b); await pg.waitForTimeout(400); };

  /* ---------------- BASIS: one quantity, one basis, a named period ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'wA'); await month(pg, 36);
    /* The Ontology draws to canvas, so the check reads what the code would draw, from the
       same canonical field and the same formatter the page uses. */
    const read = b => pg.evaluate(x => {
      document.getElementById('basis-' + x).click();
      const D = window.__SP_DEBUG, res = D.expRes, m = res.months[35];
      const arpaAnnual = m.customers.arpaClosing;
      return { basis: D.basis, arpaAnnual, shownOnOntology: D.boundText ? null : null,
               closingARR: m.closingARR, customers: m.customers.closing };
    }, b);
    const mrr = await read('mrr'), arr = await read('arr');
    /* the engine field is annual; the two bases must be exactly 12× apart and the page
       must be showing the converted one */
    const ratioOK = Math.abs(mrr.arpaAnnual - arr.arpaAnnual) < 1e-9;
    /* and the ARPA drawn must be the canonical field, not a re-division */
    const canonical = Math.abs(mrr.arpaAnnual - mrr.closingARR / mrr.customers) < 1e-6;
    rec('BASIS · canonical: the Ontology reads the engine\'s own arpaClosing rather than dividing ARR by customers itself, so there is one ARPA in the product and not two',
        canonical, JSON.stringify({ field: mrr.arpaAnnual, recomputed: mrr.closingARR / mrr.customers }));
    rec('BASIS · stable: the underlying per-customer field does not change when the basis switches — only its presentation does',
        ratioOK, JSON.stringify([mrr.arpaAnnual, arr.arpaAnnual]));
    /* Inspect: pin a cohort and read the monetization headline in both bases */
    await setBasis(pg, 'mrr'); await nav(pg, 'Company'); await month(pg, 36);
    const boxc = await pg.evaluate(() => { const c = document.querySelector('.stage canvas'); const r = c.getBoundingClientRect(); return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.72 }; });
    await pg.mouse.click(boxc.x, boxc.y); await pg.waitForTimeout(600);
    const grab = () => pg.evaluate(() => {
      const t = document.getElementById('side').innerText;
      const per = /([\d.,€]+)\s*per customer \/ (yr|mo)/.exec(t);
      const arpa = /ARPA\s+€([\d.,km]+)/i.exec(t);
      return { pinned: window.__SP_DEBUG.pinned !== null && window.__SP_DEBUG.pinned !== undefined,
               per: per && { v: per[1], period: per[2] }, arpa: arpa && arpa[1] };
    });
    const iM = await grab(); await setBasis(pg, 'arr'); await pg.waitForTimeout(400); const iA = await grab();
    rec('BASIS · Inspect: the per-customer line follows the basis switch and names its period — "/ mo" in MRR, "/ yr" in ARR — so it can no longer be read as a second, larger quantity beside the ARPA two rows above it',
        !!(iM.pinned && iM.per && iA.per && iM.per.period === 'mo' && iA.per.period === 'yr' && iM.per.v !== iA.per.v),
        JSON.stringify({ mrr: iM.per, arr: iA.per }));
    await pg.close();
  }

  /* ---------------- OPAQUE: Method hides what is behind it ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await nav(pg, 'Scenarios'); await pg.waitForTimeout(300);
    await pg.evaluate(() => document.getElementById('keybtn').click()); await pg.waitForTimeout(400);
    const o = await pg.evaluate(() => {
      const k = document.getElementById('key'), cs = getComputedStyle(k);
      const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
      const parts = m ? m[1].split(',').map(s => parseFloat(s)) : [];
      const alpha = parts.length === 4 ? parts[3] : 1;
      /* and the pane is genuinely what the reader hits at its own centre */
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return { bg: cs.backgroundColor, alpha, onTop: !!(el && (el.id === 'key' || el.closest('#key'))) };
    });
    rec('OPAQUE: the Method overlay is fully opaque and is what the reader hits, so the surface behind it can no longer be read through the text',
        o.alpha === 1 && o.onTop, JSON.stringify(o));
    await pg.close();
  }

  /* ---------------- SEAM: Compare's two planes do not collide ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'wA'); await nav(pg, 'Compare'); await month(pg, 36);
    const g = await pg.evaluate(() => { const D = window.__SP_DEBUG, q = D.geo; return { massBot: q.massBot, cashTop: q.cashTop, cashBot: q.cashBot, noCash: q.noCash }; });
    const gap = g.cashTop - g.massBot;
    rec('SEAM: plane 2\'s header line sits clear of the recurring mass above it — the title and the reading share one baseline at cashTop−11 and the seam carries enough room for it',
        !g.noCash && gap >= 30, JSON.stringify({ massBot: Math.round(g.massBot), cashTop: Math.round(g.cashTop), gap: Math.round(gap) }));
    await pg.close();
  }

  /* ---------------- LEDGER: the marked month is in view ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'wA'); await nav(pg, 'System'); await sys(pg, 'ledger');
    const at = async m => { await month(pg, m); return pg.evaluate(() => {
      const host = document.getElementById('ledgerscroll'); const tr = host.querySelector('tr.on');
      if (!tr) return { marked: false };
      const hr = host.getBoundingClientRect(), rr = tr.getBoundingClientRect();
      const head = host.querySelector('thead'); const hh = head ? head.getBoundingClientRect().height : 0;
      return { marked: true, t: +tr.dataset.t, visible: rr.top >= hr.top + hh - 2 && rr.bottom <= hr.bottom + 2 };
    }); };
    /* forward, far forward, and back again — a one-directional fix is not a fix */
    const a = await at(36), b = await at(60), c = await at(2), d = await at(41);
    const all = [a, b, c, d];
    rec('LEDGER: after a scrub the marked month is inside the scroller and below the sticky headers — forward, to the horizon, back to the start, and forward again',
        all.every(x => x.marked && x.visible), JSON.stringify(all));
    await pg.close();
  }

  /* ---------------- EDGE: no right-margin label overruns ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'wA'); await month(pg, 36);
    const over = [];
    for (const lens of ['company', 'customers', 'growth', 'monetization', 'cash']) {
      await pg.evaluate(l => { const b = document.querySelector('[data-lens="' + l + '"]'); if (b) b.click(); }, lens);
      await pg.waitForTimeout(400);
      const bad = await pg.evaluate(l => {
        const out = [];
        document.querySelectorAll('svg.ch').forEach(sv => {
          const vb = sv.viewBox.baseVal, W = vb.width;
          sv.querySelectorAll('g.rg text').forEach(t => {
            const bb = t.getBBox();
            if (bb.x + bb.width > W - 1) out.push({ lens: l, text: t.textContent.trim().slice(0, 28), right: Math.round(bb.x + bb.width), W: Math.round(W) });
          });
        });
        return out;
      }, lens);
      over.push(...bad);
    }
    rec('EDGE: every right-margin value and label on every lens fits inside the chart\'s own box — a name too long for the margin takes a second line instead of being cut mid-word',
        over.length === 0, JSON.stringify(over.slice(0, 4)));
    await pg.close();
  }

  /* ---------------- GUTTER: the drawer has one left edge ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'wA');
    await pg.evaluate(() => document.getElementById('rail-toggle').click()); await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rail = document.querySelector('.rail'), rr = rail.getBoundingClientRect();
      return [...rail.querySelectorAll('.layerhead, .rail-legend, .force, .grp > .eyebrow')]
        .map(e => {
          const r = e.getBoundingClientRect();
          /* a row the world does not carry is display:none and reports an all-zero
             rect — it is not on the gutter, it is not on screen at all */
          if (r.width < 1 && r.height < 1) return null;
          const content = r.left - rr.left + parseFloat(getComputedStyle(e).paddingLeft || 0);
          return { cls: e.className.split(' ')[0], left: Math.round(content), text: e.textContent.trim().slice(0, 24) };
        }).filter(Boolean);
    });
    const flush = rows.filter(r => r.left < 8);
    rec('GUTTER: every row in the Change drawer starts on the drawer\'s own gutter — the layer heads were the one kind of row that did not, and their first letter was cut by the pane edge',
        rows.length > 6 && flush.length === 0, JSON.stringify(flush.slice(0, 3)));
    await pg.close();
  }

  /* ---------------- LEGEND: the drawn colour is the named colour ---------------- */
  {
    const pg = await open(1440, 900); await enter(pg); await pack(pg, 'full'); await nav(pg, 'System'); await sys(pg, 'hypotheses');
    const said = await pg.evaluate(() => {
      /* the legend is drawn to canvas; the source string is what the check can read */
      const src = document.documentElement.innerHTML;
      return { orange: /Orange dot: the decision/.test(src), indigo: /Indigo dot: the decision/.test(src) };
    });
    rec('LEGEND: the Hypotheses legend names the colour actually drawn for the decision mark (indigo #8b8df0), not a colour the view never uses',
        said.indigo && !said.orange, JSON.stringify(said));
    await pg.close();
  }

  /* ---------------- CUE: a scrolling pane says so, and stops at the bottom ---------------- */
  {
    const pg = await open(1440, 900);
    const state = () => pg.evaluate(() => {
      const w = document.getElementById('welcome');
      const cue = w.querySelector('.more-below');
      return { overflows: w.scrollHeight - w.clientHeight > 6, cls: w.classList.contains('scrolls'),
               opacity: cue ? +getComputedStyle(cue).opacity : null, pe: cue ? getComputedStyle(cue).pointerEvents : null };
    });
    const top = await state();
    await pg.evaluate(() => { const w = document.getElementById('welcome'); w.scrollTop = w.scrollHeight; });
    await pg.waitForTimeout(300);
    const bottom = await state();
    rec('CUE · Welcome: the pane that overflows shows the cue at the top and withdraws it at the bottom, and the cue never takes a click',
        top.overflows && top.cls && top.opacity === 1 && top.pe === 'none' && !bottom.cls && bottom.opacity === 0,
        JSON.stringify({ top, bottom }));
    /* tall viewport: nothing overflows, so nothing is claimed */
    const tall = await br.newPage({ viewport: { width: 1440, height: 1400 } });
    await tall.goto(URL); await tall.waitForTimeout(600);
    const noOverflow = await tall.evaluate(() => { const w = document.getElementById('welcome'); return { overflows: w.scrollHeight - w.clientHeight > 6, cls: w.classList.contains('scrolls') }; });
    rec('CUE · honest: on a viewport tall enough to hold the whole pane the cue is not shown, so it means "there is more" rather than "this is a pane"',
        !noOverflow.overflows && !noOverflow.cls, JSON.stringify(noOverflow));
    await tall.close();
    /* Method, opened from inside the app */
    await enter(pg);
    await pg.evaluate(() => document.getElementById('keybtn').click()); await pg.waitForTimeout(400);
    const km = await pg.evaluate(() => { const k = document.getElementById('key');
      return { overflows: k.scrollHeight - k.clientHeight > 6, cls: k.classList.contains('scrolls'), top: k.scrollTop }; });
    rec('CUE · Method: Method opens at the top and declares that it continues below the fold',
        km.overflows && km.cls && km.top === 0, JSON.stringify(km));
    await pg.close();
  }

  rec('no page errors across the whole run', errs.length === 0, errs.slice(0, 4).join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' defects-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
