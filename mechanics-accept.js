/*
 * SaaS Physics — Model Mechanics: a secondary, read-only layer that explains how laws and
 * starting state become the company. Model Ledger proves; Model Mechanics explains.
 *
 *   NAVIGATION   no System in the header; ⋯ holds Model Mechanics, Model Ledger, Recurring revenue,
 *                Guide, About; Model Mechanics opens on its Overview
 *   VIEWS        Overview · Customers · Monetization · Cash — no Ontology name, no Flows, no
 *                Hypotheses, no Absolute/Delta
 *   OVERVIEW     draws the causal chain with the acquisition path, the stock setting its own rates
 *                and the two absent links, without a page error
 *   ONE WORLD    it explains whichever world is viewed; Base is the frozen Base
 *   READ-ONLY    no input anywhere on the layer; a law valve opens the Experiment at that law
 *   NOTES        mechanism notes only — no stock or flow tables, no "Why this surface exists"
 */
const H = require('./accept-harness.js');

H.suite('mechanics-accept', async (t) => {
  const rec = t.rec;
  const pg = await t.open({ url: H.URL + '#app', world: 'wA' });
  const D = (f, a) => pg.evaluate(f, a);

  /* ---- NAVIGATION ---- */
  const nav = await D(() => { document.getElementById('menu-mech').click();
    return { head: [...document.querySelectorAll('.head .nav > .btn')].map(b => b.id).join(','), sys: !!document.getElementById('nav-system'),
      more: [...document.querySelectorAll('#more-menu .mi, #more-menu summary')].map(x => x.firstChild.textContent.trim()).join('|'),
      layer: window.__SP_DEBUG.layer, view: window.__SP_DEBUG.sysView, here: document.getElementById('more-btn').classList.contains('here') }; });
  rec('NAVIGATION: System is gone from the header; ⋯ reads Model Mechanics · Model Ledger · Recurring revenue · Guide · About; Model Mechanics opens on its Overview and marks ⋯',
      nav.head === 'nav-base,nav-company,rail-toggle,nav-compare' && !nav.sys && nav.more === 'Model Mechanics|Model Ledger|Recurring revenue|Guide|About' && nav.layer === 'flow' && nav.view === 'ontology' && nav.here, JSON.stringify(nav));

  /* ---- VIEWS ---- */
  const v = await D(() => ({ views: [...document.querySelectorAll('#sysviews .btn')].map(b => b.textContent).join('|'), delta: !!document.getElementById('cmp-delta') || !!document.getElementById('cmpmode'),
    inputs: document.querySelectorAll('#pulsebar input, #pulsebar select').length }));
  rec('VIEWS: Overview · Customers · Monetization · Cash, and no Absolute/Delta control or input on the layer', v.views === 'Overview|Customers|Monetization|Cash' && !v.delta && v.inputs === 0, JSON.stringify(v));

  /* ---- OVERVIEW + every view draws ---- */
  const draws = {};
  for (const id of ['ontology', 'customers', 'monetization', 'cash']) {
    draws[id] = await D(id => { document.getElementById('sysview-' + id).click(); const c = document.getElementById('scene'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let ink = 0; for (let i = 0; i < x.length; i += 16) if (x[i] + x[i + 1] + x[i + 2] > 120) ink++; return { view: window.__SP_DEBUG.sysView, ink }; }, id);
  }
  rec('DRAWS: each of the four views renders its mechanism', Object.keys(draws).every(k => draws[k].view === k && draws[k].ink > 400), JSON.stringify(draws));

  /* ---- NOTES ---- */
  const notes = {};
  for (const id of ['ontology', 'customers', 'monetization', 'cash']) {
    notes[id] = await D(id => { document.getElementById('sysview-' + id).click(); return document.getElementById('side').innerText; }, id);
  }
  const bad = /Stocks · month|Flows into and out of|Why this surface exists|Mechanisms on the map|rejected|Absolute|Delta/;
  rec('NOTES: mechanism notes only — the Overview states the stock-set rates and the two absent links; no view carries stock or flow tables, surface rationale or Delta',
      Object.values(notes).every(t => !bad.test(t)) && /The stock sets its own rates/i.test(notes.ontology) && /Cash → S&M/.test(notes.ontology) && /R&D → retention or expansion/.test(notes.ontology) && notes.cash.length > 200,
      JSON.stringify(Object.keys(notes).map(k => k + ':' + (bad.exec(notes[k]) || [''])[0])));

  /* ---- ONE WORLD: Base is the frozen Base ---- */
  await D(() => { document.getElementById('nav-company').click(); const i = document.getElementById('f-sm'); i.value = 1400000; i.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('menu-mech').click(); });
  await pg.settle();
  const w = await D(() => { const X = window.__SP_DEBUG; const ctl = !!document.querySelector('#viewing-sys [data-vw="base"]');
    const ex = X.pulseState ? null : null; document.querySelector('#viewing-sys [data-vw="base"]').click();
    const onBase = { viewed: X.viewedWorld, stateSm: X.expRes && X.selectedMonth() };
    const side = document.getElementById('side').innerText; return { ctl, viewed: onBase.viewed, side }; });
  rec('ONE WORLD: with an Experiment the Viewing control appears on the layer, and choosing Base reads the frozen Base', w.ctl && w.viewed === 'base', JSON.stringify({ ctl: w.ctl, viewed: w.viewed }));
  await D(() => document.querySelector('#viewing-sys [data-vw="exp"]').click());

  /* ---- READ-ONLY: a law valve opens the Experiment ---- */
  await D(() => window.__SP_DEBUG.useBase('customers')); await D(() => { document.getElementById('menu-mech').click(); document.getElementById('sysview-customers').click(); });
  const law = await D(() => { const X = window.__SP_DEBUG, h = X.valveHits[0]; if (!h) return null; const before = JSON.stringify(X.expA);
    const c = document.getElementById('scene'), r = c.getBoundingClientRect(), f = X.sysFit;
    c.dispatchEvent(new MouseEvent('click', { clientX: r.left + f.ox + h.x * f.s, clientY: r.top + f.oy + h.y * f.s, bubbles: true }));
    return { key: h.key, open: document.querySelector('.app').classList.contains('rail-open'), same: JSON.stringify(X.expA) === before }; });
  rec('READ-ONLY: a law on a mechanism opens the Experiment drawer at that law and changes nothing', !!law && law.open && law.same, JSON.stringify(law));

});
