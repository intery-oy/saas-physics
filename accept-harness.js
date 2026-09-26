/*
 * SaaS Physics — the accept-suite harness.
 *
 * Twenty-one browser suites each re-derived the same primitives: launching a
 * browser, opening the product in a world, changing a law, moving the clock,
 * recording a result, printing a summary, choosing an exit code. The copies
 * drifted, and the drift is the point:
 *
 *   - the pass-count printout existed in three incompatible variants, so a
 *     passing check with a detail printed it in four suites and hid it in 17;
 *   - the law-change helper had five names, two event semantics (half of them
 *     dispatched `input` without bubbles) and three settle durations;
 *   - `pageerror` was recorded in five formats and `console.error` in three
 *     suites out of 21;
 *   - nine of 21 had a top-level .catch; the other twelve leaked the browser
 *     on a throw and reported a crash as an assertion failure;
 *   - the chromium executable was hardcoded to a container path, so none of
 *     them ran anywhere else.
 *
 * The thing that actually cost time was waiting: 298 fixed sleeps totalling
 * 115.7 s of source text, and far more once loops multiply them. Exactly one
 * suite waited on the page instead of the clock; commit 3a83285 took it from
 * 73 s to 23 s with its assertions unchanged. That technique lives here now.
 *
 * WAITING. Every app handler runs synchronously. The only deferred work is
 * setLayer's 220 ms resize-and-render when the page changes, and the canvas's
 * next animation frame. So: wait for a condition where one exists, two frames
 * after anything that repaints, and the 230 ms settle ONLY after something
 * that changes the page.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var playwright = require('playwright');

/* ------------------------------------------------------------------ *
 * The browser
 * ------------------------------------------------------------------ */
var SANDBOX = '/opt/pw-browsers/chromium';

function executablePath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  try { if (fs.existsSync(SANDBOX)) return SANDBOX; } catch (e) { /* not there */ }
  return undefined;   /* playwright resolves the browser it downloaded */
}

function launch(opts) {
  var o = Object.assign({}, opts || {});
  var exe = executablePath();
  if (exe) o.executablePath = exe;
  return playwright.chromium.launch(o);
}

/* The product under test: the built single-file page, never a template. */
var PRODUCT = path.resolve(__dirname, 'saas-physics-v1.html');
var URL = 'file://' + PRODUCT;

var VIEWPORT = { width: 1440, height: 900 };

/* ------------------------------------------------------------------ *
 * Page — the real Playwright Page, with the suite verbs attached, so a
 * suite that already calls page.evaluate keeps working unchanged.
 * ------------------------------------------------------------------ */
function frames(p) {
  return p.evaluate(function () {
    return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  });
}

/* After something that changes the page: setLayer's 220 ms timer, then paint. */
function settle(p) {
  return p.evaluate(function () {
    return new Promise(function (r) {
      setTimeout(function () { requestAnimationFrame(function () { requestAnimationFrame(r); }); }, 230);
    });
  });
}

function attach(p, errs, label) {
  p.on('pageerror', function (e) { errs.push((label ? label + ': ' : '') + String(e && e.message ? e.message : e)); });
  p.on('console', function (m) {
    if (m.type() !== 'error') return;
    var txt = m.text();
    if (/Failed to load resource|net::ERR/.test(txt)) return;   /* file:// favicon and friends */
    errs.push((label ? label + ': ' : '') + 'console: ' + txt);
  });

  p.frames2 = function () { return frames(p); };
  p.settle = function () { return settle(p); };

  /* window.__SP_DEBUG, passed in, so `D` never means two things again. */
  p.dbg = function (fn, arg) {
    return p.evaluate(function (payload) {
      /* eslint-disable no-new-func */
      var f = new Function('D', 'a', 'return (' + payload.src + ')(D, a);');
      return f(window.__SP_DEBUG, payload.arg);
    }, { src: fn.toString(), arg: arg === undefined ? null : arg });
  };

  /* A law. One semantics: set the value, dispatch a bubbling `input`, paint. */
  p.setLaw = function (id, v) {
    return p.evaluate(function (a) {
      var i = document.getElementById('f-' + a.id) || document.getElementById(a.id);
      if (!i) throw new Error('no control ' + a.id);
      i.value = a.v;
      i.dispatchEvent(new Event('input', { bubbles: true }));
    }, { id: id, v: v }).then(function () { return frames(p); });
  };

  /* The clock. The handler is synchronous; only the canvas is deferred. */
  p.month = function (m) {
    return p.evaluate(function (v) {
      var s = document.getElementById('scrub');
      s.value = String(v);
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }, m).then(function () { return frames(p); });
  };

  p.stopClock = function () {
    return p.evaluate(function () {
      var b = document.getElementById('play');
      if (b && /pause|⏸/i.test(b.getAttribute('aria-label') || b.textContent || '')) b.click();
      else if (b && window.__SP_DEBUG && window.__SP_DEBUG.playing !== false) b.click();
    }).then(function () { return frames(p); });
  };

  /* A click that may change the page: settle, not a guess. */
  p.tap = function (sel) {
    return p.evaluate(function (s) {
      var el = typeof s === 'string' ? (document.getElementById(s.replace(/^#/, '')) || document.querySelector(s)) : null;
      if (!el) throw new Error('no element ' + s);
      el.click();
    }, sel).then(function () { return settle(p); });
  };

  return p;
}

/* ------------------------------------------------------------------ *
 * The suite runner — owns the browser, the results, the printout and
 * the exit code, so no suite has to.
 * ------------------------------------------------------------------ */
function suite(name, body) {
  var P = [];
  var errs = [];
  var browser = null;

  function rec(n, pass, detail) { P.push([n, !!pass, detail || '']); }

  function open(opts) {
    opts = opts || {};
    return (function () {
      return browser.newPage({ viewport: opts.viewport || VIEWPORT }).then(function (p) {
        attach(p, errs, opts.label);
        return p.goto(opts.url || URL)
          .then(function () { return p.evaluate(function () { return document.fonts.ready; }); })
          /* the hook and the opening pane exist before anything is clickable */
          .then(function () { return p.waitForFunction(function () { return window.__SP_DEBUG && document.getElementById('welcome-enter'); }); })
          .then(function () {
            if (opts.welcome === false) return null;
            return p.evaluate(function () { var b = document.getElementById('welcome-enter'); if (b) b.click(); });
          })
          .then(function () {
            if (opts.clock === 'running') return null;
            return p.evaluate(function () { var b = document.getElementById('play'); if (b) b.click(); });
          })
          .then(function () {
            if (!opts.world) return null;
            return p.evaluate(function (w) { if (window.__SP_DEBUG.useBase) window.__SP_DEBUG.useBase(w); }, opts.world);
          })
          .then(function () {
            if (!opts.world) return null;
            /* a run exists and Company is up — the app's own readiness, not a sleep */
            return p.waitForFunction(function () {
              var D = window.__SP_DEBUG;
              return D.expRes && (!('layer' in D) || D.layer === 'stock' || D.layer === 'base');
            });
          })
          .then(function () { return opts.month ? p.month(opts.month) : null; })
          .then(function () { return settle(p); })
          .then(function () { return p; });
      });
    })();
  }

  function openAll(list) { return Promise.all(list.map(open)); }

  var t = {
    rec: rec, open: open, openAll: openAll, errs: errs,
    get browser() { return browser; },
    URL: URL, launch: launch, frames: frames, settle: settle
  };

  var started = Date.now();
  return launch().then(function (b) {
    browser = b;
    return body(t);
  }).then(function () {
    /* One error check, in one place, for every suite. */
    rec('no page errors', errs.length === 0, errs.slice(0, 6).join(' | '));
  }).then(function () {
    return browser ? browser.close() : null;
  }, function (e) {
    /* Every suite has an error path now. A crash is exit 2, not exit 1. */
    console.error('\n  ' + name + ' CRASHED\n');
    console.error(e && e.stack ? e.stack : e);
    return (browser ? browser.close().catch(function () {}) : Promise.resolve())
      .then(function () { flush(2); });
  }).then(function () {
    if (P.length === 0) return;
    var pass = 0;
    P.forEach(function (row) {
      var ok = row[1];
      if (ok) pass++;
      console.log((ok ? '  PASS  ' : '  FAIL  ') + row[0] + (row[2] && !ok ? '\n        ' + row[2] : ''));
    });
    console.log('='.repeat(90));
    console.log(pass + ' / ' + P.length + ' ' + name + ' checks passed  ·  ' +
                ((Date.now() - started) / 1000).toFixed(1) + 's');
    flush(pass === P.length ? 0 : 1);
  });
}

/* console.log is async on a pipe: a bare process.exit can truncate the
   summary line the whole suite exists to print. */
function flush(code) {
  process.exitCode = code;
  if (process.stdout.write('')) process.exit(code);
  else process.stdout.once('drain', function () { process.exit(code); });
}

module.exports = {
  launch: launch, executablePath: executablePath, suite: suite, attach: attach,
  frames: frames, settle: settle, PRODUCT: PRODUCT, URL: URL, VIEWPORT: VIEWPORT
};
