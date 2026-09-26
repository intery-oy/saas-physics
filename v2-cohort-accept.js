/*
 * SaaS Physics — COHORT ISOLATION (Inspect's own figure), DOM-level acceptance checks.
 *
 * Clicking a stratum in Company formation changes the question from "how did this company
 * form?" to "what happened to THIS cohort?". The figure must change with the question:
 *
 *   ISOLATION      the formation canvas and its controls leave; one cohort's two charts arrive,
 *                  titled by vintage, with the approved provenance chain still above them
 *   NO COMPANY     nothing company-level is plotted: no other strata, no company ARR, no company
 *                  YoY growth, no Base trajectory — the value axis itself is cohort-scale
 *   RECONCILIATION every plotted and printed number is the frozen engine's own cohort row
 *                  (closingARR, cumGrossProfit) or capital.js's attribution of it
 *   DECOMPOSITION  the life chart carries the cumulative layers that make the balance:
 *                  original + expansion − contraction − churn = cohort ARR with the customer
 *                  layer on, original + expansion − leakage = cohort ARR with it off
 *   PAYBACK        the marked payback month is the first month cumulative GP >= acquisition cost,
 *                  and the gap readout flips from "still unrecovered" to "beyond acquisition cost"
 *   TIME           the global month keeps working while the cohort stays selected: the cursor
 *                  moves, the age advances, the values follow; a click on a cohort chart scrubs
 *   RETURN         "< Company" restores the formation exactly as it was
 *
 * The acceptance world is the Enterprise SaaS configuration (pack wA), read at month 36.
 *
 * Run: node v2-cohort-accept.js
 */
const H = require('./accept-harness.js');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');

/* the product's own formatters, replicated so the test asserts what the reader sees */
const eur = v => { const a = Math.abs(v); return a >= 1e6 ? '€' + (v / 1e6).toFixed(2) + 'm' : a >= 1e3 ? '€' + Math.round(v / 1e3) + 'k' : '€' + Math.round(v); };
const mrr = v => eur(v / 12);                       /* the default basis is MRR; the engine stays ARR-native */
/* the value the reader sees beside a named right-edge label on chart `i` */
const val = (f, i, name) => { const p = (f.pairs[i] || []).filter(q => q[0] === name)[0]; return p ? p[1] : null; };

(async () => {
  const br = await H.launch();
  const errs = [];
  const pg = await br.newPage({ viewport: { width: 1440, height: 1000 } });
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(URL); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(800);
  await pg.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); });
  await pg.waitForTimeout(200);
  const D = (f, a) => pg.evaluate(f, a);
  const scrub = async v => { await D(v => { const s = document.getElementById('scrub'); s.value = v; s.dispatchEvent(new Event('input')); }, v); await pg.waitForTimeout(300); };
  const click = async sel => { await D(s => { const el = document.querySelector(s); if (!el) throw new Error('no element ' + s); el.click(); }, sel); await pg.waitForTimeout(400); };

  await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(400); await scrub(36);

  /* ---------- the formation, before any cohort is chosen ---------- */
  const before = await D(() => ({ canvasH: document.querySelector('.figbox').getBoundingClientRect().height,
    ctlH: document.querySelector('.figctl').getBoundingClientRect().height,
    title: document.getElementById('fig-title').textContent, life: document.getElementById('cohort-life').hidden,
    legend: window.__SP_DEBUG.figLegend, arrM36: window.__SP_DEBUG.expRes.months[35].closingARR }));

  /* ---------- pin a cohort: scan the mass at month 20 until the canvas offers a pointer ---------- */
  const pin = await D(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const x = 64 + (20 / 60) * (r.width - 64 - 78);
    for (let y = 26; y < r.height * 0.85; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return y; }
    } return null; });
  await pg.waitForTimeout(600);

  /* everything the figure shows about this one cohort */
  const fig = () => D(() => {
    const h = document.getElementById('cohort-life'), svgs = [...h.querySelectorAll('svg.ch')];
    const num = t => { const m = String(t).match(/€(-?[\d.]+)(m|k)?/); if (!m) return null; return parseFloat(m[1]) * (m[2] === 'm' ? 1e6 : m[2] === 'k' ? 1e3 : 1); };
    return { hidden: h.hidden, canvasH: document.querySelector('.figbox').getBoundingClientRect().height,
      ctlH: document.querySelector('.figctl').getBoundingClientRect().height,
      title: document.getElementById('fig-title').textContent, hint: document.getElementById('fig-hint').textContent,
      charts: svgs.length, blocks: [...h.querySelectorAll('.chb')].length,
      titles: [...h.querySelectorAll('.chb .eyebrow')].map(e => e.textContent),
      tags: [...h.querySelectorAll('.chb .basis')].map(e => e.textContent),
      lines: svgs.map(s => s.querySelectorAll('path.ln').length), baseLines: svgs.map(s => s.querySelectorAll('path.ln.base').length),
      margins: svgs.map(s => s.dataset.l + '/' + s.dataset.r), geo: svgs.map(s => { const r = s.getBoundingClientRect(); return { left: Math.round(r.left * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; }),
      curX: svgs.map(s => s.querySelector('.cur') && s.querySelector('.cur').getAttribute('x1')),
      axTop: svgs.map(s => Math.max(...[...s.querySelectorAll('.ax')].map(t => num(t.textContent)).filter(v => v !== null))),
      rv: [...h.querySelectorAll('.rv')].map(e => e.textContent), rl: [...h.querySelectorAll('.rl')].map(e => e.textContent),
      pairs: svgs.map(s => [...s.querySelectorAll('g.rg')].map(g => [g.querySelector('.rl').textContent, g.querySelector('.rv').textContent])),
      areas: svgs.map(s => [...s.querySelectorAll('path.ar')].map(p => p.getAttribute('fill') + '@' + p.getAttribute('opacity'))),
      lastLine: svgs.map(s => { const l = [...s.querySelectorAll('path.ln')]; const p = l[l.length - 1]; return p && p.getAttribute('stroke') + '/' + p.getAttribute('stroke-width'); }),
      marks: [...h.querySelectorAll('.mk')].map(e => e.textContent), bkl: [...h.querySelectorAll('.bkl')].map(e => e.textContent),
      vr: svgs.map(s => s.querySelectorAll('.vr').length), rows: [...h.querySelectorAll('.comp-l')].map(e => e.innerText.replace(/\n/g, ' ')),
      txt: h.innerText, steps: document.querySelectorAll('.dossier .pstep').length,
      dossier: document.querySelector('.dossier') ? document.querySelector('.dossier').innerText : '',
      cl: window.__SP_DEBUG.cohortLife, pinned: window.__SP_DEBUG.pinned };
  });
  /* the frozen engine's own numbers for the pinned cohort, read straight off the run */
  const eng = () => D(() => { const k = window.__SP_DEBUG.pinned, W = window.__SP_DEBUG, c = W.expRes.cohorts[k], m = W.selectedMonth();
    const idx = t => window.SaaSPhysics.rowIndexAt(c, t);   /* the engine's own rule, not a copy */
    const rows = {}; [12, 24, 36, 48, 60].concat([c.acquisitionMonth || 1]).forEach(t => { const r = c.rows[idx(t)]; if (r) rows[t] = { arr: r.closingARR, cum: r.cumGrossProfit, age: r.age }; });
    let pb = null, pbAge = null;
    if (c.acquisitionCost !== null) for (let i = 0; i < c.rows.length; i++) { if (c.rows[i].cumGrossProfit >= c.acquisitionCost) { pb = c.rows[i].t; pbAge = c.rows[i].age; break; } }
    const row = c.rows[idx(m)] || null;
    let cc2 = 0, ck = 0, split = false, worst = 0;
    for (const r of c.rows) { if (r.customers) { split = true; cc2 += r.customers.contractionARR; ck += r.customers.logoChurnARR; }
      if (r.t > m) continue; }
    let sC = 0, sK = 0; const comp = {};
    for (const r of c.rows) { if (r.customers) { sC += r.customers.contractionARR; sK += r.customers.logoChurnARR; }
      const lhs = split ? c.initialARR + r.cumExpansion - sC - sK : c.initialARR + r.cumExpansion - r.cumLeakage;
      worst = Math.max(worst, Math.abs(lhs - r.closingARR));
      if (r.t === m) { comp.expansion = r.cumExpansion; comp.contraction = sC; comp.churn = sK; comp.leakage = r.cumLeakage; } }
    return { k, m, acquisitionMonth: c.acquisitionMonth, initialARR: c.initialARR, cost: c.acquisitionCost, rows, pb, pbAge, split, comp, identityWorst: worst,
      now: row && { arr: row.closingARR, cum: row.cumGrossProfit, age: row.age, cumExpansion: row.cumExpansion, cumLeakage: row.cumLeakage },
      companyARR: W.expRes.months[m - 1].closingARR, cohorts: W.expRes.cohorts.length }; });

  const f36 = await fig(), e36 = await eng();

  rec('ISOLATION: clicking a stratum replaces Company formation with the cohort\'s own figure — the canvas and its Compare/leakage controls leave, two aligned charts arrive, and the figure is titled by vintage',
      pin !== null && f36.pinned !== null && !f36.hidden && f36.canvasH === 0 && f36.ctlH === 0 && before.canvasH > 400 && before.life === true &&
      f36.charts === 2 && f36.blocks === 2 && /^Cohort life · vintage M\d+$/.test(f36.title) && f36.title === 'Cohort life · vintage M' + e36.acquisitionMonth &&
      f36.titles[0] === 'Cohort MRR life' && f36.titles[1] === 'Capital recovery',
      JSON.stringify({ pin, title: f36.title, titles: f36.titles, canvasH: f36.canvasH, ctlH: f36.ctlH, beforeH: before.canvasH }));

  rec('ISOLATION: the two cohort charts share the instrument\'s frame — identical margins, identical left/width/height, one cursor each at the same month',
      f36.margins.every(m => m === f36.margins[0]) && Math.abs(f36.geo[0].left - f36.geo[1].left) < 0.6 && Math.abs(f36.geo[0].width - f36.geo[1].width) < 0.6 &&
      Math.abs(f36.geo[0].height - f36.geo[1].height) < 0.6 && f36.curX[0] === f36.curX[1] && f36.curX[0] !== null,
      JSON.stringify({ margins: f36.margins, geo: f36.geo, curX: f36.curX }));

  rec('ISOLATION: the approved provenance chain is untouched above the figure — six steps, still reading this cohort',
      f36.steps === 6, String(f36.steps));

  rec('NO COMPANY SERIES: the figure plots this cohort only — no Base trajectory, no company YoY growth, and every right-edge label names one of this cohort\'s own quantities',
      f36.lines.join(',') === '5,2' && f36.baseLines.every(n => n === 0) && !/y\/y|YOY/i.test(f36.txt) &&
      f36.rl.map(x => x.toLowerCase()).sort().join('|') === ['cohort mrr', 'original', 'expansion', 'contraction', 'churn', 'acquisition cost', 'cumulative gross profit'].sort().join('|'),
      JSON.stringify({ lines: f36.lines, base: f36.baseLines, rl: f36.rl }));

  rec('NO COMPANY SERIES: the value axis is cohort-scale, not company-scale — the top tick of the cohort MRR chart is a fraction of company MRR, and no printed value on the figure equals the company\'s MRR',
      f36.axTop[0] > 0 && f36.axTop[0] < e36.companyARR / 12 * 0.2 && f36.rv.indexOf(mrr(e36.companyARR)) < 0 && !f36.txt.includes(mrr(e36.companyARR)),
      JSON.stringify({ axTop: f36.axTop, cohortMRR: mrr(e36.now.arr), companyMRR: mrr(e36.companyARR) }));

  rec('COHORT ARR RECONCILIATION: the plotted series is the engine\'s own cohort row at every month, and the right-edge value is that month\'s closing ARR in the reporting basis',
      Object.keys(e36.rows).every(t => Math.abs(f36.cl.arr[t] - e36.rows[t].arr) < 1e-6) &&
      f36.cl.arr[e36.acquisitionMonth - 1] === 0 && f36.cl.currentARR === e36.now.arr &&
      val(f36, 0, 'cohort MRR') === mrr(e36.now.arr) && val(f36, 0, 'original') === mrr(e36.initialARR) && f36.cl.age === e36.now.age,
      JSON.stringify({ pairs: f36.pairs[0], expect: [mrr(e36.now.arr), mrr(e36.initialARR)], rows: e36.rows }));

  rec('COHORT ARR RECONCILIATION: the acquisition month is marked on the chart, and the two flows that produced the path — cumulative expansion and leakage since acquisition — are printed beneath it',
      f36.marks.indexOf('acquired M' + e36.acquisitionMonth) >= 0 && f36.vr[0] === 1 &&
      f36.rows[0].includes('+' + mrr(e36.now.cumExpansion)) && f36.rows[0].includes(mrr(e36.now.arr)) &&
      (e36.split ? f36.rows[0].includes('−' + mrr(e36.comp.contraction)) && f36.rows[0].includes('−' + mrr(e36.comp.churn))
                 : f36.rows[0].includes('−' + mrr(e36.now.cumLeakage))),
      JSON.stringify({ marks: f36.marks, row: f36.rows[0], exp: mrr(e36.now.cumExpansion), comp: e36.comp }));

  rec('CAPITAL RECOVERY RECONCILIATION: cumulative gross profit and the acquisition cost are the engine\'s own, in plain euro (never the reporting basis), and the recovered share is their ratio',
      Object.keys(e36.rows).every(t => Math.abs(f36.cl.cum[t] - e36.rows[t].cum) < 1e-6) &&
      f36.cl.acquisitionCost === e36.cost && f36.cl.cumGP === e36.now.cum &&
      val(f36, 1, 'acquisition cost') === eur(e36.cost) && val(f36, 1, 'cumulative gross profit') === eur(e36.now.cum) &&
      f36.rows[1].includes((Math.min(1, e36.now.cum / e36.cost) * 100).toFixed(0) + '%') && f36.rows[1].includes(eur(e36.cost)),
      JSON.stringify({ pairs: f36.pairs[1], expect: [eur(e36.cost), eur(e36.now.cum)], row: f36.rows[1] }));

  rec('CAPITAL RECOVERY RECONCILIATION: before payback the gap at the selected month reads as the amount still unrecovered, and it equals acquisition cost minus cumulative gross profit',
      e36.now.cum < e36.cost && f36.bkl[1] === eur(e36.cost - e36.now.cum) + ' still unrecovered' && f36.cl.unrecovered === e36.cost - e36.now.cum,
      JSON.stringify({ bkl: f36.bkl, expect: eur(e36.cost - e36.now.cum) }));

  /* ---------- DECOMPOSITION: the layers that carry the original balance to the balance now ---------- */
  rec('DECOMPOSITION: with the customer layer on, the life chart carries three cumulative layers — expansion above the original, contraction under it, logo churn under that — and the cohort line is drawn last, on top of them',
      e36.split && f36.areas[0].length === 3 && f36.areas[0][0] === 'var(--in)@0.2' && f36.areas[0][1] === 'var(--out)@0.14' && f36.areas[0][2] === 'var(--out)@0.32' &&
      f36.lastLine[0].split('/')[1] === '2' && /rgba\(/.test(f36.lastLine[0]) &&
      f36.pairs[0].map(p => p[0]).join('|') === ['expansion', 'cohort MRR', 'original', 'contraction', 'churn'].sort((a, b) => f36.pairs[0].findIndex(p => p[0] === a) - f36.pairs[0].findIndex(p => p[0] === b)).join('|'),
      JSON.stringify({ areas: f36.areas[0], last: f36.lastLine[0], labels: f36.pairs[0].map(p => p[0]) }));

  rec('DECOMPOSITION: every layer value at the selected month is the engine\'s own cumulative flow for this cohort, and the identity original + expansion − contraction − churn = cohort ARR closes at EVERY month of its life',
      val(f36, 0, 'expansion') === '+' + mrr(e36.comp.expansion) && val(f36, 0, 'contraction') === '−' + mrr(e36.comp.contraction) &&
      val(f36, 0, 'churn') === '−' + mrr(e36.comp.churn) && val(f36, 0, 'cohort MRR') === mrr(e36.now.arr) &&
      e36.identityWorst < 1e-6 && Math.abs(e36.comp.contraction + e36.comp.churn - e36.now.cumLeakage) < 1e-6,
      JSON.stringify({ shown: f36.pairs[0], engine: e36.comp, worst: e36.identityWorst }));

  const geo1 = await D(() => { const s = [...document.querySelectorAll('#cohort-life svg.ch')][0], W = window.__SP_DEBUG, m = W.selectedMonth();
    const L = +s.dataset.l, R = +s.dataset.r, xq = L + (m / 60) * (640 - L - R), r2 = v => Math.round(v * 100) / 100;
    const at = d => { const p = d.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number), o = []; for (let i = 0; i + 1 < p.length; i += 2) if (Math.abs(p[i] - xq) < 0.35) o.push(p[i + 1]); return o; };
    const bands = [...s.querySelectorAll('path.ar')].map(p => { const y = at(p.getAttribute('d')); return { fill: p.getAttribute('fill'), op: p.getAttribute('opacity'), top: r2(Math.min(...y)), bot: r2(Math.max(...y)) }; });
    const cl = W.cohortLife, yOf = {};
    return { bands, cl: { orig: cl.orig[m], top: cl.stackTop[m], aC: cl.afterContraction[m], aK: cl.afterLogoChurn[m], arr: cl.arr[m] } }; });
  rec('DECOMPOSITION: the layers are contiguous and never overlap — expansion runs from the original level to original + expansion, contraction hangs from the original, churn hangs from the foot of contraction — and the levels they are drawn from satisfy the identity exactly',
      Math.abs(geo1.bands[0].bot - geo1.bands[1].top) < 0.2 && Math.abs(geo1.bands[1].bot - geo1.bands[2].top) < 0.2 &&
      geo1.bands[0].top < geo1.bands[0].bot && geo1.bands[2].top > geo1.bands[1].top &&
      Math.abs((geo1.cl.top - (geo1.cl.orig - geo1.cl.aC) - (geo1.cl.aC - geo1.cl.aK)) - geo1.cl.arr) < 1e-6,
      JSON.stringify(geo1));

  /* ---------- PAYBACK: the month the cohort earns its acquisition cost back ---------- */
  rec('PAYBACK: the marked payback month is the first month this cohort\'s cumulative gross profit reaches its acquisition cost, with the age it reached it at',
      e36.pb !== null && f36.cl.paybackMonth === e36.pb && f36.cl.paybackAge === e36.pbAge &&
      f36.marks.indexOf('payback M' + e36.pb + ' · age ' + e36.pbAge) >= 0 && f36.vr[1] === 1,
      JSON.stringify({ marks: f36.marks, pb: e36.pb, pbAge: e36.pbAge, model: [f36.cl.paybackMonth, f36.cl.paybackAge] }));

  await scrub(e36.pb);
  const fPb = await fig(), ePb = await eng();
  rec('PAYBACK: scrubbing to the payback month flips the gap from unrecovered to earned back — cumulative gross profit has reached the acquisition cost and the readout says paid back',
      fPb.cl.m === e36.pb && ePb.now.cum >= e36.cost && /beyond acquisition cost/.test(fPb.bkl[1]) &&
      fPb.rows[1].includes('Paid back in M' + e36.pb) && fPb.rows[1].includes('100%'),
      JSON.stringify({ bkl: fPb.bkl, row: fPb.rows[1] }));

  /* ---------- TIME: the global month keeps working while the cohort stays selected ---------- */
  await scrub(50);
  const f50 = await fig(), e50 = await eng();
  rec('TIME: the global month control still moves while the cohort is selected — the cohort stays pinned, the cursor advances, the age advances with it, and every value is the new month\'s',
      f50.pinned === f36.pinned && !f50.hidden && f50.cl.m === 50 && f50.cl.age === 50 - e36.acquisitionMonth && f50.cl.age === e50.now.age &&
      parseFloat(f50.curX[0]) > parseFloat(f36.curX[0]) && f50.curX[0] === f50.curX[1] &&
      f50.tags[0] === 'M50 · age ' + f50.cl.age && f50.tags[1] === 'CUM · M1–M50' &&
      val(f50, 0, 'cohort MRR') === mrr(e50.now.arr) && f50.cl.cumGP === e50.now.cum,
      JSON.stringify({ pinned: f50.pinned, tags: f50.tags, age: f50.cl.age, curX: [f36.curX[0], f50.curX[0]] }));

  await scrub(Math.max(1, e36.acquisitionMonth - 6));
  const fPre = await fig();
  rec('TIME: scrubbing back before the cohort was acquired keeps it selected and says so, rather than printing a state it did not have',
      fPre.pinned === f36.pinned && fPre.cl.born === false && fPre.tags[0] === 'M' + fPre.cl.m + ' · not yet acquired' &&
      /Not yet acquired at M\d+ — this cohort enters in month \d+/.test(fPre.rows[0]),
      JSON.stringify({ tag: fPre.tags[0], row: fPre.rows[0] }));

  /* a click on a cohort chart is the same clock as the transport */
  await D(() => { const s = document.querySelector('#cohort-life svg.ch'), r = s.getBoundingClientRect();
    s.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width * 0.75, clientY: r.top + r.height * 0.5, bubbles: true })); });
  await pg.waitForTimeout(400);
  const fClick = await fig();
  rec('TIME: clicking inside a cohort chart moves the global month there and keeps the cohort selected',
      fClick.pinned === f36.pinned && fClick.cl.m > 38 && fClick.cl.m === await D(() => window.__SP_DEBUG.selectedMonth()) &&
      fClick.cl.m === Number(await D(() => document.getElementById('scrub').value)),
      JSON.stringify({ m: fClick.cl.m, pinned: fClick.pinned }));

  /* ---------- RETURN ---------- */
  await scrub(36);
  await click('#inspect-back');
  await pg.waitForTimeout(400);
  const after = await D(() => ({ pinned: window.__SP_DEBUG.pinned, life: document.getElementById('cohort-life').hidden,
    canvasH: document.querySelector('.figbox').getBoundingClientRect().height, ctlH: document.querySelector('.figctl').getBoundingClientRect().height,
    title: document.getElementById('fig-title').textContent, hint: document.getElementById('fig-hint').textContent,
    legend: window.__SP_DEBUG.figLegend, dossier: !!document.querySelector('.dossier'), lenses: document.querySelectorAll('#side .lensnav .btn').length }));
  rec('RETURN: "‹ Company" puts the formation back exactly as it was — the canvas, its controls, its title, its hint and its strata legend — and the cohort figure is gone',
      after.pinned === null && after.life === true && after.canvasH > 400 && after.ctlH > 0 && !after.dossier && after.lenses === 5 &&
      after.title === before.title && after.legend === before.legend && /click a stratum to inspect that cohort/.test(after.hint),
      JSON.stringify({ after: { title: after.title, legend: after.legend, canvasH: after.canvasH }, before: { title: before.title, legend: before.legend } }));

  /* ---------- the opening base: no stamped acquisition cost, so recovery is not attributable ---------- */
  await scrub(36);
  const pinBase = await D(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const x = 64 + (20 / 60) * (r.width - 64 - 78);
    for (let y = r.height * 0.82; y > 26; y -= 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer' && window.__SP_DEBUG.expRes.cohorts[0]) { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return window.__SP_DEBUG.pinned; }
    } return null; });
  await pg.waitForTimeout(500);
  const fBase = await fig();
  rec('OPENING BASE: the oldest stratum still gets its own life chart, and the capital-recovery chart is replaced by the reason it cannot be drawn — no stamped acquisition cost',
      pinBase === 0 && fBase.cl.acquisitionMonth === 0 && fBase.charts === 1 && fBase.titles.join('|') === 'Cohort MRR life|Capital recovery' &&
      fBase.tags[1] === 'not attributable' && /predates the simulation/.test(fBase.txt) && fBase.title === 'Cohort life · opening base',
      JSON.stringify({ pinBase, charts: fBase.charts, titles: fBase.titles, tags: fBase.tags }));

  rec('DECOMPOSITION: the Inspect panel names the same movements as the chart — cumulative expansion, contraction and churn on the cohort step, churn + contraction on the customer step — and no longer calls the split flow leakage',
      /− contraction \+ churn, cumulative\s+€.* contraction · €.* churn/.test(f36.dossier) && /Churn \+ contraction this month/.test(f36.dossier) &&
      !/− leakage, cumulative/.test(f36.dossier) && !/lost logos/.test(f36.dossier) &&
      f36.dossier.includes(mrr(e36.comp.contraction)) && f36.dossier.includes(mrr(e36.comp.churn)),
      JSON.stringify({ d: f36.dossier.slice(f36.dossier.indexOf('Original'), f36.dossier.indexOf('Original') + 200).replace(/\n/g, ' | ') }));

  /* ---------- the ARR-only world: one combined flow, and it says so ---------- */
  await click('#inspect-back');
  await pg.evaluate(() => window.__SP_DEBUG.useBase('arr')); await pg.waitForTimeout(400); await scrub(36);
  const pinArr = await D(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect();
    const x = 64 + (20 / 60) * (r.width - 64 - 78);
    for (let y = 26; y < r.height * 0.85; y += 3) {
      cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return window.__SP_DEBUG.pinned; }
    } return null; });
  await pg.waitForTimeout(600);
  const fArr = await fig(), eArr = await eng();
  rec('DECOMPOSITION · CUSTOMER PHYSICS OFF: the life chart falls back to two layers — expansion above the original and one combined leakage below it — the readout and the Inspect panel say leakage, and original + expansion − leakage = cohort ARR at every month',
      pinArr !== null && !eArr.split && fArr.areas[0].length === 2 && fArr.areas[0][1] === 'var(--out)@0.22' &&
      fArr.rl.map(x => x.toLowerCase()).indexOf('leakage') >= 0 && fArr.rl.map(x => x.toLowerCase()).indexOf('churn') < 0 && fArr.rl.map(x => x.toLowerCase()).indexOf('contraction') < 0 &&
      val(fArr, 0, 'leakage') === '−' + mrr(eArr.comp.leakage) && val(fArr, 0, 'expansion') === '+' + mrr(eArr.comp.expansion) && val(fArr, 0, 'cohort MRR') === mrr(eArr.now.arr) &&
      /Leakage −/.test(fArr.rows[0]) && /− leakage, cumulative/.test(fArr.dossier) && !/churn/i.test(fArr.dossier) && eArr.identityWorst < 1e-6,
      JSON.stringify({ areas: fArr.areas[0], labels: fArr.pairs[0], row: fArr.rows[0], worst: eArr.identityWorst }));
  await click('#inspect-back');
  await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(400); await scrub(36);

  /* ---------- LABELS: the cohort figure stays legible at desktop, tablet and phone ---------- */
  const widths = {};
  for (const w of [1440, 1024, 768, 390]) {
    const p2 = await br.newPage({ viewport: { width: w, height: 900 } });
    p2.on('pageerror', e => errs.push(w + ': ' + String(e)));
    await p2.goto(URL); await p2.evaluate(() => window.__SP_DEBUG.useBase('wA')); await p2.waitForTimeout(700);
    await p2.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); }); await p2.waitForTimeout(200);
    await p2.evaluate(() => { const s = document.getElementById('scrub'); s.value = 40; s.dispatchEvent(new Event('input')); }); await p2.waitForTimeout(300);
    const k = await p2.evaluate(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const x = 64 + (20 / 60) * (r.width - 142);
      for (let y = 26; y < r.height * 0.85; y += 3) { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
        if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return window.__SP_DEBUG.pinned; } } return null; });
    await p2.waitForTimeout(400);
    let coll = 0, narrow = 0, hs = false;
    for (const m of [12, 24, 36, 48, 60]) {
      await p2.evaluate(m => { const s = document.getElementById('scrub'); s.value = m; s.dispatchEvent(new Event('input')); }, m); await p2.waitForTimeout(200);
      const r = await p2.evaluate(() => { const svgs = [...document.querySelectorAll('#cohort-life svg.ch')]; let c = 0;
        svgs.forEach(s => { const els = [...s.querySelectorAll('g.rg, text.bkl, text.mk')].map(e => e.getBoundingClientRect());
          for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b2 = els[j]; if (a.top < b2.bottom && b2.top < a.bottom && a.left < b2.right && b2.left < a.right) c++; } });
        return { c, wid: svgs.length ? Math.round(svgs[0].getBoundingClientRect().width) : 0, over: svgs.some(s => s.getBoundingClientRect().right > window.innerWidth + 1),
          hs: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
      coll += r.c; if (r.wid < (w <= 390 ? 300 : w <= 768 ? 600 : 780) || r.over) narrow++; if (r.hs) hs = true;
      widths[w] = { coll, narrow, hs, wid: r.wid, pinned: k };
    }
    await p2.close();
  }
  rec('LABELS: on both cohort charts the marks, the gap readout and the right-edge values never print over each other, the charts use the full column and nothing overflows — at 1440, 1024, 768 and 390',
      Object.values(widths).every(r => r.coll === 0 && r.narrow === 0 && !r.hs && r.pinned !== null), JSON.stringify(widths));

  /* ---------- SCOPE ---------- *
   * Inspect commandeers the figure box — it hides the formation canvas to put the cohort's own
   * figure in its place. That hold belongs to Company. Nothing released it on the way out, so a
   * cohort left pinned followed the reader to System and Compare as a display:none
   * they never set, blanking whatever those layers draw in the box. */
  const p3 = await br.newPage({ viewport: { width: 1440, height: 900 } });
  p3.on('pageerror', e => errs.push('scope: ' + e.message));
  await p3.goto(URL); await p3.evaluate(() => window.__SP_DEBUG.useBase('wA')); await p3.waitForTimeout(700);
  await p3.evaluate(() => { const b = document.getElementById('welcome-enter'); if (b) b.click(); }); await p3.waitForTimeout(500);
  await p3.evaluate(() => { const cv = document.getElementById('scene'), r = cv.getBoundingClientRect(); const x = 64 + (20 / 60) * (r.width - 84);
    for (let y = 30; y < r.height * 0.7; y += 3) { cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + x, clientY: r.top + y, bubbles: true }));
      if (cv.style.cursor === 'pointer') { cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + x, clientY: r.top + y, bubbles: true })); return; } } });
  await p3.waitForTimeout(700);
  const look = () => p3.evaluate(() => { const cv = document.getElementById('scene').getBoundingClientRect(), cl = document.getElementById('cohort-life');
    return { pinned: window.__SP_DEBUG.pinned, canvas: Math.round(cv.width * cv.height), cohortFigure: !cl.hidden, dossier: !!document.querySelector('.dossier') }; });
  const scope = { pinned: await look() };
  for (const nav of ['menu-mech', 'nav-compare']) {
    await p3.evaluate(n => document.getElementById(n).click(), nav); await p3.waitForTimeout(600);
    scope[nav] = await look();
  }
  await p3.evaluate(() => document.getElementById('nav-company').click()); await p3.waitForTimeout(700);
  scope.back = await look();
  await p3.close();
  rec('SCOPE: a cohort left pinned does not follow the reader out of Company — System and Compare each get their own figure back, the cohort figure steps aside, and returning to Company restores Inspect exactly as it was',
      scope.pinned.canvas === 0 && scope.pinned.cohortFigure && scope.pinned.dossier &&
      ['menu-mech', 'nav-compare'].every(n => scope[n].canvas > 10000 && !scope[n].cohortFigure && scope[n].pinned === scope.pinned.pinned) &&
      scope.back.canvas === 0 && scope.back.cohortFigure && scope.back.dossier && scope.back.pinned === scope.pinned.pinned,
      JSON.stringify(scope));

  rec('no page errors across the whole run', errs.length === 0, errs.join(' | '));
  await br.close();

  let pass = 0; for (const [n, ok, d] of P) { if (ok) pass++; console.log((ok ? '  PASS  ' : '  FAIL  ') + n + (ok || !d ? '' : '\n        ' + d)); }
  console.log(pass + ' / ' + P.length + ' v2-cohort-accept checks passed');
  process.exit(pass === P.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
