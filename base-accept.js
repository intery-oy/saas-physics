/*
 * SaaS Physics — the frozen-baseline architecture.
 *
 *   NO HIDDEN BASE   a fresh load has a draft and no Base: it opens on Base Settings, and Company,
 *                    Experiment, Compare, Model Mechanics and the Ledger wait for the first freeze
 *   FREEZE           Freeze Base deep-copies the draft into an immutable Base (a write throws) and
 *                    starts the Experiment as an exact clone of it
 *   DRAFT            editing Base Settings changes only the draft
 *   EXPERIMENT       editing the Experiment changes only the Experiment
 *   RESET            Reset reproduces the frozen Base exactly, month by month
 *   PRESETS          Browse presets offers change recipes only, and none writes the frozen Base
 *   EXAMPLES         an Example is a Base Settings template: freezing it sets up its matched Experiment
 *   RE-FREEZE        with an Experiment it asks once; Cancel changes nothing, Confirm replaces the
 *                    Base and resets the Experiment; with none it does not ask
 *   VIEWING BASE     is the frozen Base: the Ledger under Base equals the Ledger of a page whose
 *                    Experiment is the frozen Base
 *   NO WORLDS        no World menu, no world switch, no "Preset world"
 *   SOURCE           the Base is assigned in one function (checked by laws-accept, FROZEN BASE)
 */
const H = require('./accept-harness.js');
const path = require('path');
const P = [];
function rec(name, pass, detail) { P.push([name, pass, detail || '']); }
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html') + '#app';

(async () => {
  const br = await H.launch();
  const errs = [];
  const open = async () => { const p = await br.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL); await p.waitForTimeout(600); return p; };
  const D = (p, f, a) => p.evaluate(f, a);
  const slide = (p, id, v) => D(p, ([id, v]) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);

  /* ---- NO HIDDEN BASE ---- */
  const pg = await open();
  const fresh = await D(pg, () => { const X = window.__SP_DEBUG;
    return { layer: X.layer, base: X.baseA, frozen: X.frozenBase, draft: X.draftBase && X.draftBase.label,
      off: ['nav-company', 'nav-compare', 'rail-toggle', 'menu-mech', 'menu-ledger'].every(id => document.getElementById(id).disabled),
      state: document.getElementById('bp-state').textContent, freeze: document.getElementById('base-freeze').textContent }; });
  rec('NO HIDDEN BASE: a fresh load opens on Base Settings with a draft (Enterprise) and no Base; every surface that reads a company waits for the first freeze',
      fresh.layer === 'base' && fresh.base === null && fresh.frozen === null && fresh.draft === 'Enterprise' && fresh.off && /No Base frozen/.test(fresh.state) && fresh.freeze === 'Freeze Base', JSON.stringify(fresh));
  await D(pg, () => document.getElementById('nav-company').click());
  rec('NO HIDDEN BASE: Company cannot be opened before a freeze', (await D(pg, () => window.__SP_DEBUG.layer)) === 'base', '');

  /* ---- FREEZE ---- */
  await D(pg, () => document.getElementById('base-freeze').click()); await pg.waitForTimeout(300);
  const fz = await D(pg, () => { 'use strict'; const X = window.__SP_DEBUG, F = X.frozenBase;
    let threw = false; try { (function(){ 'use strict'; F.a.sm = 1; })(); } catch (e) { threw = true; }
    let deep = false; try { (function(){ 'use strict'; F.a.monetization.components[1].unitsCap = 1; })(); } catch (e) { deep = true; }
    return { layer: X.layer, n: F.n, same: X.baseA === F.a && X.baseStart === F.start, threw, deep,
      draftShared: X.draftBase.a === F.a, expIsClone: X.expA !== F.a && JSON.stringify(X.expA) === JSON.stringify(F.a), state: (document.getElementById('nav-base').click(), document.getElementById('bp-state').textContent),
      disabled: document.getElementById('base-freeze').disabled }; });
  rec('FREEZE: the draft is deep-copied into an immutable Base (a write to it throws, at any depth); the Experiment starts as a clone; Company opens; Base Settings says "Base frozen ✓" and offers nothing to freeze',
      fz.layer === 'stock' && fz.n === 1 && fz.same && fz.threw && fz.deep && !fz.draftShared && fz.expIsClone && /^Base frozen ✓ · Enterprise/.test(fz.state) && fz.disabled, JSON.stringify(fz));

  /* ---- DRAFT ---- */
  const snap = p => D(p, () => ({ base: JSON.stringify(window.__SP_DEBUG.frozenBase), exp: JSON.stringify(window.__SP_DEBUG.expA), draft: JSON.stringify(window.__SP_DEBUG.draftBase.a) }));
  const s0 = await snap(pg);
  await slide(pg, 'bs-f-sm', 1500000); await slide(pg, 'bs-s-openingCash', 20000000);
  const s1 = await snap(pg), dn = await D(pg, () => ({ freeze: document.getElementById('base-freeze').disabled, note: document.getElementById('bp-draft').textContent, pend: document.getElementById('nav-base').classList.contains('pending') }));
  rec('DRAFT: editing Base Settings changes only the draft — the frozen Base and the Experiment are untouched, and the page says the draft differs until it is frozen',
      s1.base === s0.base && s1.exp === s0.exp && s1.draft !== s0.draft && !dn.freeze && /differs from the frozen Base/.test(dn.note) && dn.pend, JSON.stringify(dn));

  /* ---- EXPERIMENT ---- */
  await D(pg, () => document.getElementById('nav-company').click());
  await slide(pg, 'f-cacPerARR', 1.2);
  const s2 = await snap(pg);
  rec('EXPERIMENT: editing the Experiment changes only the Experiment — the frozen Base and the draft are untouched',
      s2.base === s0.base && s2.draft === s1.draft && s2.exp !== s1.exp, '');

  /* ---- RE-FREEZE: ask once ---- */
  await D(pg, () => { document.getElementById('nav-base').click(); document.getElementById('base-freeze').click(); });
  const ask = await D(pg, () => ({ shown: !document.getElementById('freeze-confirm').hidden, text: document.getElementById('freeze-confirm').innerText }));
  await D(pg, () => document.getElementById('freeze-no').click());
  const s3 = await snap(pg);
  rec('RE-FREEZE: with an Experiment it asks "Freeze new Base? This replaces the current baseline and resets the Experiment."; Cancel changes nothing outside the draft',
      ask.shown && /Freeze new Base\?/.test(ask.text) && /replaces the current baseline and resets the Experiment/.test(ask.text) && s3.base === s0.base && s3.exp === s2.exp && s3.draft === s1.draft, JSON.stringify(ask));
  await D(pg, () => { document.getElementById('base-freeze').click(); document.getElementById('freeze-yes').click(); }); await pg.waitForTimeout(300);
  const rf = await D(pg, () => { const X = window.__SP_DEBUG; return { n: X.frozenBase.n, sm: X.baseA.sm, cash: X.baseStart.openingCash, exp: JSON.stringify(X.expA) === JSON.stringify(X.frozenBase.a), chip: document.getElementById('rail-toggle').textContent, preset: X.activeScenario }; });
  rec('RE-FREEZE: Confirm replaces the Base with the draft (laws and opening state) and resets the Experiment to it', rf.n === 2 && rf.sm === 1500000 && rf.cash === 20000000 && rf.exp && rf.chip === 'Experiment' && rf.preset === null, JSON.stringify(rf));
  await D(pg, () => { document.getElementById('nav-base').click(); document.getElementById('tpl-wC').click(); document.getElementById('base-freeze').click(); }); await pg.waitForTimeout(300);
  const quiet = await D(pg, () => ({ n: window.__SP_DEBUG.frozenBase.n, asked: !document.getElementById('freeze-confirm').hidden, src: window.__SP_DEBUG.baseSource }));
  rec('RE-FREEZE: with no Experiment there is nothing to lose, so it does not ask', quiet.n === 3 && !quiet.asked && quiet.src === 'wC', JSON.stringify(quiet));

  /* ---- RESET ---- */
  await slide(pg, 'f-sm', 900000); await slide(pg, 'f-grossMargin', 0.6);
  await D(pg, () => document.getElementById('reset').click());
  const rs = await D(pg, () => { const X = window.__SP_DEBUG; let worst = 0;
    for (let t = 0; t < 60; t++) worst = Math.max(worst, Math.abs(X.expRes.months[t].closingARR - X.baseRes.months[t].closingARR), Math.abs(X.expRes.months[t].cashClosing - X.baseRes.months[t].cashClosing));
    return { a: JSON.stringify(X.expA) === JSON.stringify(X.frozenBase.a), start: X.expStart === X.baseStart, worst }; });
  rec('RESET: the Experiment reproduces the frozen Base exactly — the same laws, the same opening state, the same run to the euro', rs.a && rs.start && rs.worst === 0, JSON.stringify(rs));

  /* ---- PRESETS ---- */
  const presets = [];
  for (const base of ['arr', 'customers', 'wA', 'wB', 'wC']) {
    presets.push(await D(pg, b => { const X = window.__SP_DEBUG; X.useBase(b); const before = JSON.stringify(X.frozenBase), out = [];
      document.querySelectorAll('#preset-list .prow').forEach(r => { if (r.disabled || r.hidden) return; r.click();
        out.push({ id: r.dataset.id, loaded: X.activeScenario && X.activeScenario.id, base: JSON.stringify(X.frozenBase) === before && X.baseA === X.frozenBase.a });
        document.getElementById('reset').click(); });
      return { b, n: out.length, ok: out.every(o => o.loaded === o.id && o.base), bad: out.filter(o => !(o.loaded === o.id && o.base)) }; }, base));
  }
  const rows = await D(pg, () => [...document.querySelectorAll('#preset-list .prow')].map(r => r.dataset.id).join(','));
  rec('PRESETS: Browse presets holds the eight change recipes and nothing else; on every Base each one offered loads and none writes the frozen Base',
      presets.every(p => p.ok) && presets[0].n === 8 && rows === 'retention,expansion,efficiency,margin,bounded,lag,billing,hypothesis', JSON.stringify({ rows, bases: presets.map(p => p.b + ':' + p.n + (p.ok ? '' : ' BAD ' + JSON.stringify(p.bad))) }));
  const ex = await D(pg, () => { const X = window.__SP_DEBUG, out = [];
    for (const id of ['pair', 'history', 'expcost', 'customers', 'monetization', 'mix']) { X.useBase('ex-' + id);
      out.push({ id, set: X.activeScenario && X.activeScenario.id === id, base: X.baseA === X.frozenBase.a && X.baseSource === 'ex-' + id, differs: JSON.stringify(X.expA) !== JSON.stringify(X.baseA) || X.expStart !== X.baseStart });
      document.getElementById('reset').click(); out[out.length - 1].reset = !X.activeScenario && JSON.stringify(X.expA) === JSON.stringify(X.frozenBase.a) && X.expStart === X.baseStart; }
    return out; });
  rec('EXAMPLES: each of the six lives under Base Settings → Examples; freezing it sets up its matched Experiment against it, and Reset returns to that Base',
      ex.every(e => e.set && e.base && e.differs && e.reset), JSON.stringify(ex.filter(e => !(e.set && e.base && e.differs && e.reset))));
  const cmp6 = await D(pg, () => { const X = window.__SP_DEBUG; X.useBase('ex-history'); document.getElementById('nav-compare').click();
    return { h: document.querySelector('#compare-panel h4').textContent, l1: document.querySelector('#compare-panel .cause.l1').innerText, idle: !!document.querySelector('#compare-panel .causal.idle'), ev: !!document.getElementById('preset-evidence'), mature: X.baseStart.openingCohorts[0].age, young: X.expStart.openingCohorts[0].age }; });
  rec('EXAMPLE 6: its Base is the mature book, its Experiment the young one; Compare names the opening-state change and shows the evidence — never "Experiment equals Base"',
      cmp6.h === 'Example 6 · Same KPIs, different history' && /Opening base · age at M0 · 24 months → 0 months/.test(cmp6.l1) && !cmp6.idle && cmp6.ev && cmp6.mature === 24 && cmp6.young === 0, JSON.stringify(cmp6));
  const eq = await D(pg, () => { window.__SP_DEBUG.useBase('arr'); document.getElementById('nav-compare').click(); return document.querySelector('#compare-panel h4').textContent; });
  rec('COMPARE: with no change it says the Experiment equals the frozen Base', eq === 'Experiment equals Base', eq);

  /* ---- VIEWING BASE = the frozen Base, down to the Ledger ---- */
  const ledgerOf = async (change, view) => { const p = await open();
    await D(p, () => { window.__SP_DEBUG.useBase('wA'); });
    if (change) await slide(p, 'f-sm', 1400000);
    await D(p, () => document.getElementById('menu-ledger').click()); await p.waitForTimeout(300);
    if (view) await D(p, v => window.__SP_DEBUG.setViewed(v), view); await p.waitForTimeout(300);
    const h = await D(p, () => document.getElementById('ledgerscroll').innerHTML); await p.close(); return h; };
  const lb = await ledgerOf(true, 'base'), l0 = await ledgerOf(false, null), le = await ledgerOf(true, 'exp');
  rec('VIEWING BASE: the Ledger under Base is exactly the Ledger of the frozen Base itself, and differs from the Experiment\'s', lb === l0 && lb !== le && lb.length > 5000, JSON.stringify({ same: lb === l0, differs: lb !== le }));

  /* ---- NO WORLDS ---- */
  const nw = await D(pg, () => ({ btn: !!document.getElementById('world-btn'), menu: !!document.getElementById('world-menu'), text: /Preset world|Switch world/.test(document.body.innerText + document.documentElement.innerHTML),
    nav: [...document.querySelectorAll('.head .nav > .btn')].map(b => b.id).join(',') }));
  rec('NO WORLDS: no World menu or world switch remains; the header reads Base Settings · Company · Experiment · Compare', !nw.btn && !nw.menu && !nw.text && nw.nav === 'nav-base,nav-company,rail-toggle,nav-compare', JSON.stringify(nw));

  rec('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await br.close();
  let ok = 0; for (const [n, p, d] of P) { console.log((p ? '  PASS  ' : '  FAIL  ') + n + (d && !p ? '\n        ' + d : '')); if (p) ok++; }
  console.log('========================================================================================');
  console.log(ok + ' / ' + P.length + ' base-accept checks passed');
  process.exit(ok === P.length ? 0 : 1);
})();
