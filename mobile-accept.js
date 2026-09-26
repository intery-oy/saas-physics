/*
 * SaaS Physics — MOBILE acceptance checks.
 *
 * The product shipped without a viewport meta tag, so every phone laid it out at the 980px
 * fallback width and scaled the result down: the opening page's Enter button rendered about
 * fifteen physical pixels tall and no phone breakpoint in the stylesheet ever ran on a phone.
 * These checks hold the fix in place:
 *
 *   VIEWPORT    the page declares device-width, so the phone CSS is the CSS that runs
 *   ENTRY       a first visit can leave the opening page with one tap, without hunting
 *   FITS        no horizontal scroll at any phone width
 *   TARGETS     controls a finger can hit: buttons and sliders large enough on a coarse pointer
 *   WORKS       the five lenses, the Change drawer and Inspect all respond to taps
 *   REACH       the time transport is on screen on a tablet, whose browser keeps a toolbar
 *
 * Run: node mobile-accept.js
 */
const H = require('./accept-harness.js');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, 'saas-physics-v1.html');
const PHONES = [[360, 740, 'small android'], [390, 844, 'iPhone 14'], [430, 932, 'iPhone Pro Max']];

H.suite('mobile-accept', async (t) => {
  const rec = t.rec, errs = t.errs;
  const phone = async (w, h) => { const pg = await t.browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    pg.on('pageerror', e => errs.push(w + ': ' + e.message));
    await pg.goto(URL); await pg.evaluate(() => window.__SP_DEBUG.useBase('wA')); await pg.waitForTimeout(700); return pg; };

  /* ---- VIEWPORT: the root cause, guarded ---- */
  const pg = await phone(390, 844);
  const vp = await pg.evaluate(() => { const m = document.querySelector('meta[name="viewport"]');
    return { content: m ? m.getAttribute('content') : null, layoutWidth: innerWidth, screenWidth: screen.width }; });
  rec('VIEWPORT: the page declares a device-width viewport, so a phone lays it out at its own width instead of the 980px fallback it scales down',
      !!vp.content && /width\s*=\s*device-width/.test(vp.content) && /initial-scale\s*=\s*1/.test(vp.content) && vp.layoutWidth === 390,
      JSON.stringify(vp));

  /* ---- ENTRY: one tap out of the opening page ---- */
  const enter = await pg.evaluate(() => { const b = document.getElementById('welcome-enter'), r = b.getBoundingClientRect();
    return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), inFirstScreen: r.top >= 0 && r.bottom <= innerHeight,
      onTop: (document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)) || {}).id,
      welcomeShown: document.getElementById('welcome').classList.contains('on') }; });
  await pg.tap('#welcome-enter'); await pg.waitForTimeout(500);
  const entered = await pg.evaluate(() => ({ shown: document.getElementById('welcome').classList.contains('on'),
    app: !!document.querySelector('.app') && document.querySelector('.app').getBoundingClientRect().height > 100 }));
  rec('ENTRY: on a first visit the opening page\'s Enter button sits inside the first screen at a real size, nothing covers it, and one tap reaches the portal',
      enter.welcomeShown && enter.inFirstScreen && enter.h >= 30 && enter.w >= 56 && enter.onTop === 'welcome-enter' && !entered.shown && entered.app,
      JSON.stringify({ enter, entered }));

  /* ---- TARGETS ---- */
  const targets = await pg.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.width > 0 && getComputedStyle(e).display !== 'none'; };
    const btns = [...document.querySelectorAll('.btn')].filter(vis).map(e => ({ id: e.id || e.textContent.trim().slice(0, 14), h: Math.round(e.getBoundingClientRect().height) }));
    return { small: btns.filter(b => b.h < 32), n: btns.length, coarse: matchMedia('(pointer:coarse)').matches }; });
  await pg.tap('#rail-toggle'); await pg.waitForTimeout(500);
  const sliders = await pg.evaluate(() => { const s = [...document.querySelectorAll('.rail input[type=range]')].filter(e => e.getBoundingClientRect().height > 0)
      .map(e => ({ k: e.id, h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) }));
    return { n: s.length, small: s.filter(x => x.h < 28 || x.w < 120), railOpen: document.querySelector('.app').classList.contains('rail-open') }; });
  rec('TARGETS: on a touch pointer every visible button is at least 32px tall and every Change slider at least 28px tall and 120px wide — a finger can hit them without zooming',
      targets.coarse && targets.small.length === 0 && targets.n > 10 && sliders.railOpen && sliders.n > 5 && sliders.small.length === 0,
      JSON.stringify({ buttons: targets.n, tooSmall: targets.small.slice(0, 4), sliders: sliders.n, slidersTooSmall: sliders.small.slice(0, 3) }));

  /* ---- WORKS: the portal responds to taps ---- */
  await pg.evaluate(() => { const b = document.getElementById('rail-close'); if (b) b.click(); }); await pg.waitForTimeout(400);
  const lensOrder = ['customers', 'growth', 'monetization', 'cash', 'company'];
  const lensSeen = [];
  for (const id of lensOrder) { await pg.tap('.lensnav .btn[data-lens="' + id + '"]'); await pg.waitForTimeout(400);
    lensSeen.push(await pg.evaluate(() => document.getElementById('side').dataset.active)); }
  rec('WORKS: each of the five lenses opens on a tap', lensSeen.join('|') === lensOrder.join('|'), lensSeen.join('|'));

  const box = await pg.evaluate(() => { const r = document.getElementById('scene').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  await pg.tap('#scene', { position: { x: Math.round(box.w * 0.5), y: Math.round(box.h * 0.75) } }); await pg.waitForTimeout(600);
  const pinned = await pg.evaluate(() => ({ k: window.__SP_DEBUG.pinned, dossier: !!document.querySelector('.dossier'),
    life: !document.getElementById('cohort-life').hidden }));
  await pg.evaluate(() => { const b = document.getElementById('inspect-back'); if (b) b.click(); }); await pg.waitForTimeout(400);
  const back = await pg.evaluate(() => ({ k: window.__SP_DEBUG.pinned, life: document.getElementById('cohort-life').hidden }));
  rec('WORKS: tapping the formation pins that cohort — the provenance chain and the cohort figure open — and ‹ Company returns',
      pinned.k !== null && pinned.dossier && pinned.life && back.k === null && back.life, JSON.stringify({ pinned, back }));
  await pg.close();

  /* ---- FITS: no horizontal scroll at any phone width ---- */
  const fits = {};
  for (const [w, h, name] of PHONES) {
    const q = await phone(w, h);
    await q.tap('#welcome-enter'); await q.waitForTimeout(500);
    fits[name] = await q.evaluate(() => { const over = [...document.querySelectorAll('.head, .transport, .stagecol, #side, .figwrap, #scene, .lensnav, .cascade')]
        .filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.id || e.className.split(' ')[0]);
      return { hs: document.documentElement.scrollWidth > innerWidth + 1, over, transport: document.querySelector('.transport').getBoundingClientRect().bottom <= innerHeight + 1,
        scene: Math.round(document.getElementById('scene').getBoundingClientRect().height) }; });
    await q.close();
  }
  rec('FITS: at 360, 390 and 430 the portal fits its width — no horizontal scroll, nothing overflowing the screen, the transport on screen and the figure given real height',
      Object.values(fits).every(f => !f.hs && f.over.length === 0 && f.transport && f.scene > 200), JSON.stringify(fits));

  /* ---- REACH: the transport on a tablet, where the browser keeps a toolbar ---- */
  /* iOS reports 100vh as the viewport WITHOUT its toolbars, so a layout pinned to it hangs its
     last row below the fold — which is where the time transport went on an iPad. The height has
     to come from a dynamic viewport unit. The emulator has no toolbar, so it cannot reproduce
     the symptom: the declaration is what is checked, alongside the layout it produces. */
  const TABLETS = [[768, 1024, 'iPad mini portrait'], [820, 1180, 'iPad Air portrait'], [1180, 820, 'iPad Air landscape'], [1024, 1366, 'iPad Pro portrait']];
  const reach = {};
  for (const [w, h, name] of TABLETS) {
    const q = await phone(w, h);
    await q.tap('#welcome-enter'); await q.waitForTimeout(500);
    reach[name] = await q.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;top:-9999px;left:0;width:1px;height:100dvh';
      document.body.appendChild(probe); const dvh = probe.getBoundingClientRect().height; probe.remove();
      const t = document.querySelector('.transport'), r = t.getBoundingClientRect();
      const app = document.querySelector('.app');
      const declares = u => { const out = []; for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
          for (const ru of rules) { if (ru.selectorText && ru.selectorText.split(',').map(x => x.trim()).indexOf(u) >= 0 && /dvh/.test(ru.cssText)) out.push(ru.selectorText); } } return out; };
      return { dvh: Math.round(dvh), innerH: innerHeight, appH: Math.round(app.getBoundingClientRect().height),
        appFromDvh: Math.abs(app.getBoundingClientRect().height - dvh) <= 1,
        transportBottom: Math.round(r.bottom), onScreen: r.bottom <= innerHeight + 1 && r.top >= 0,
        scrub: Math.round(document.getElementById('scrub').getBoundingClientRect().width),
        play: Math.round(document.getElementById('play').getBoundingClientRect().height),
        dvhRules: declares('.app').length > 0 && declares('html').concat(declares('body')).length > 0,
        hs: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    await q.close();
  }
  rec('REACH: on a tablet the time transport is on screen and usable — the layout takes its height from the viewport actually visible (a dynamic viewport unit), not from the taller one a browser reports with its toolbars hidden',
      Object.values(reach).every(r => r.dvhRules && r.appFromDvh && r.onScreen && !r.hs && r.scrub > 120 && r.play >= 32),
      JSON.stringify(reach));

  });
