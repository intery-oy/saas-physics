/*
 * SaaS Physics — the accept-suite harness.
 *
 * Twenty-one browser suites used to re-derive the same primitives: launching a
 * browser, opening the product in a world, changing a law, moving the clock,
 * recording a result, printing a summary, choosing an exit code. The copies
 * drifted — three incompatible printouts, five law-change helpers with two
 * different event semantics, five error formats, nine of twenty-one with an
 * error path. This module is the one place those live.
 *
 * Grown in two steps: first launch(), so the suites can run anywhere; then the
 * page surface and the suite runner.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var playwright = require('playwright');

/* The browser. The suites used to hardcode the cloud sandbox's chromium, which
   is why none of them ran outside that container. In order: an explicit
   PW_CHROMIUM, the sandbox path when it is really there, otherwise the browser
   playwright downloaded for itself. */
var SANDBOX = '/opt/pw-browsers/chromium';

function executablePath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  try { if (fs.existsSync(SANDBOX)) return SANDBOX; } catch (e) { /* not there */ }
  return undefined;   /* playwright resolves its own */
}

function launch(opts) {
  var o = Object.assign({}, opts || {});
  var exe = executablePath();
  if (exe) o.executablePath = exe;
  return playwright.chromium.launch(o);
}

/* The product under test: the built single-file page, not a template. */
var PRODUCT = path.resolve(__dirname, 'saas-physics-v1.html');
var URL = 'file://' + PRODUCT;

module.exports = { launch: launch, executablePath: executablePath, PRODUCT: PRODUCT, URL: URL };
