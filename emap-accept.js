/*
 * SaaS Physics — the Base economic map on Base Settings.
 *
 *   SOURCE      every value shown is the chosen Base state's own field (or that state's own run,
 *               labelled derived): the draft before freezing, the frozen Base after
 *   LAYERS      a block whose layer is off says so and shows no irrelevant values
 *   NAVIGATION  each block lands on its Base Settings section
 *   READ-ONLY   the map holds no input; clicking it writes nothing
 *   DRAFT       a draft edit updates the Draft map only; the Frozen map is unchanged until Freeze Base
 *   LINKS       S&M's two effects, timing ≠ EBITA, R&D/G&A cost only, cash never constrains S&M
 */
const H = require('./accept-harness.js');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html') + '#app';

H.suite('emap-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  const pg = await t.browser.newPage({ viewport: { width: 1440, height: 900 } }); pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(URL); await pg.settle();
  const D = (f, a) => pg.evaluate(f, a);
  const map = () => D(() => { const o = {}; document.querySelectorAll('#emap-grid .emap-b').forEach(b => { o[b.dataset.b] = { off: b.classList.contains('off'),
    rows: [...b.querySelectorAll('.emap-r')].map(r => r.querySelector('.k').textContent + '=' + r.querySelector('.v').textContent.replace(/\s*•/, '').trim()) }; });
    return { title: document.getElementById('emap-title').textContent, sw: !document.getElementById('emap-sw').hidden, blocks: o, links: document.getElementById('emap-x').innerText }; });
  const val = (m, b, k) => { const r = m.blocks[b].rows.find(x => x.startsWith(k + '=')); return r ? r.slice(k.length + 1) : null; };

  /* ---- SOURCE: the draft before freezing ---- */
  const m0 = await map(), d0 = await D(() => { const X = window.__SP_DEBUG, a = X.draftBase.a; return { sm: a.sm, cac: a.cacPerARR, gm: a.grossMargin, term: a.billingTermMonths, cash: X.draftBase.start.openingCash, rd: a.rd }; });
  rec('SOURCE: before a freeze the map is the Draft Base, and its values are the draft\'s own fields (S&M, CAC floor, gross margin, billing term, opening cash, R&D)',
      /^Draft Base/.test(m0.title) && !m0.sw && val(m0, 'acq', 'S&M') === '€700k/mo' && d0.sm === 700000 && val(m0, 'acq', 'CAC floor') === d0.cac.toFixed(2) + '×' &&
      val(m0, 'econ', 'Gross margin') === (d0.gm * 100).toFixed(1) + '%' && val(m0, 'cash', 'Billing term') === d0.term + ' mo' && val(m0, 'start', 'Opening cash') === '€10.00m' && val(m0, 'econ', 'R&D') === '€700k/mo',
      JSON.stringify({ m0: m0.blocks.acq, d0 }));
  rec('SOURCE: values the engine derives are labelled derived (opening ARR and ARR per new logo under Monetization; persistence emergent from the mix)',
      /derived/.test(val(m0, 'start', 'Opening ARR')) && /derived/.test(val(m0, 'acq', 'ARR per new logo')) && /emergent.*derived/.test(val(m0, 'cust', 'Persistence')), JSON.stringify(m0.blocks.start));

  /* ---- LAYERS ---- */
  await D(() => document.getElementById('tpl-arr').click());
  const m1 = await map();
  rec('LAYERS: on the ARR-physics draft Customers carries only the persistence law and says the customer layer is off; Monetization shows the expansion coefficient and is off; Cash is off; no irrelevant values',
      m1.blocks.mon.off && m1.blocks.cash.off && !m1.blocks.acq.off && val(m1, 'cust', 'Persistence') === '90.0%' && val(m1, 'cust', 'Customer layer') === 'off' &&
      m1.blocks.mon.rows.length === 2 && m1.blocks.cash.rows.length === 1 && !m1.blocks.cash.rows.join().includes('Billing') && val(m1, 'acq', 'ARR per new logo') === null && /Cash layer off/.test(m1.links), JSON.stringify(m1.blocks));
  await D(() => document.getElementById('tpl-wA').click());

  /* ---- LINKS ---- */
  rec('LINKS: S&M\'s two effects, timing moving cash but not EBITA, R&D and G&A as cost only, and cash never constraining S&M are all stated; S&M is marked dual in both Acquisition and Economics',
      /S&M · one input, two effects/.test(m0.links) && /EBITA is unchanged/.test(m0.links) && /R&D, G&A · cost only/.test(m0.links) && /Cash never constrains S&M/.test(m0.links) &&
      (await D(() => document.querySelectorAll('#emap-grid .emap-r.dual').length)) === 2, m0.links.replace(/\n/g, ' | '));

  /* ---- NAVIGATION ---- */
  const nav = {};
  for (const [b, want] of [['start', 'bs-card-start'], ['acq', 'Acquisition response'], ['cust', 'bs-card-customers'], ['mon', 'bs-card-monetization'], ['econ', 'Economic conversion'], ['cash', 'bs-card-cash']]) {
    nav[b] = await D(async ([b, want]) => { document.querySelector('.stage').scrollTop = 0; document.querySelector('#emap-grid [data-b="' + b + '"]').click(); await new Promise(r => setTimeout(r, 1300));
      const t = want.startsWith('bs-card') ? document.getElementById(want) : document.querySelector('.fgrp[data-kind="' + want + '"]'), r = t.getBoundingClientRect();
      return r.top >= 0 && r.top < innerHeight - 60; }, [b, want]);
  }
  rec('NAVIGATION: each block lands on its Base Settings section (acquisition and economics on their groups inside ARR physics)', Object.values(nav).every(Boolean), JSON.stringify(nav));

  /* ---- READ-ONLY ---- */
  const ro = await D(() => { const X = window.__SP_DEBUG, before = JSON.stringify([X.draftBase, X.frozenBase]);
    document.querySelectorAll('#emap button, #emap .emx').forEach(b => b.click());
    return { inputs: document.querySelectorAll('#emap input, #emap select, #emap textarea').length, same: JSON.stringify([X.draftBase, X.frozenBase]) === before }; });
  rec('READ-ONLY: the map holds no input, and clicking every block and link writes nothing', ro.inputs === 0 && ro.same, JSON.stringify(ro));

  /* ---- DRAFT vs FROZEN ---- */
  await D(() => document.getElementById('base-freeze').click()); await pg.paint();
  const mf = await D(() => (document.getElementById('nav-base').click(), 0)).then(map);
  await D(() => { const i = document.getElementById('bs-f-grossMargin'); i.value = 0.6; i.dispatchEvent(new Event('input', { bubbles: true })); });
  const md = await map(), dot = await D(() => { const r = [...document.querySelectorAll('#emap-grid [data-b="econ"] .emap-r')].find(x => /Gross margin/.test(x.textContent)); return { dot: !!r.querySelector('.chg'), title: r.title }; });
  await D(() => document.querySelector('#emap-sw [data-emv="frozen"]').click());
  const mfz = await map(), fr = await D(() => window.__SP_DEBUG.frozenBase.a.grossMargin);
  rec('DRAFT vs FROZEN: after freezing the map is the frozen Base; a draft edit switches it to the Draft map, marks the changed value against the frozen one, and offers Draft | Frozen Base',
      /^Base · economic map · frozen/.test(mf.title) && /^Draft Base/.test(md.title) && md.sw && val(md, 'econ', 'Gross margin') === '60.0%' && dot.dot && /frozen: 78\.0%/.test(dot.title), JSON.stringify({ mf: mf.title, md: md.title, dot }));
  rec('DRAFT vs FROZEN: the Frozen Base map is read-only and unchanged by the draft edit until Freeze Base',
      /^Frozen Base · economic map · read-only/.test(mfz.title) && val(mfz, 'econ', 'Gross margin') === '78.0%' && fr === 0.78 && JSON.stringify(mfz.blocks) === JSON.stringify(mf.blocks), JSON.stringify({ t: mfz.title, gm: val(mfz, 'econ', 'Gross margin') }));

  });
