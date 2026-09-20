/* Deployment packaging — downstream of the normal SaaS Physics build.
 *
 *   node build.js            → saas-physics-v1.html (the validated product, self-contained)
 *   node deploy-build.js     → runs that build, then copies saas-physics-v1.html
 *                              byte-for-byte to dist/index.html for static hosting
 *
 * No second template, no second engine: dist/index.html IS saas-physics-v1.html
 * under the filename a static host serves at "/". The step fails loudly if the
 * product build did not produce its output or the copy is not byte-identical. */
'use strict';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var execFileSync = require('child_process').execFileSync;

var root = __dirname;
var product = path.join(root, 'saas-physics-v1.html');
var distDir = path.join(root, 'dist');
var target = path.join(distDir, 'index.html');

execFileSync(process.execPath, [path.join(root, 'build.js')], { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(product)) { console.error('deploy-build: ' + product + ' missing after build.js'); process.exit(1); }
var bytes = fs.readFileSync(product);
if (bytes.length < 100000 || bytes.indexOf('/*__ENGINE__*/') !== -1) { console.error('deploy-build: saas-physics-v1.html is not a complete build'); process.exit(1); }

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(target, bytes);

var same = Buffer.compare(fs.readFileSync(target), bytes) === 0;
if (!same) { console.error('deploy-build: dist/index.html differs from saas-physics-v1.html'); process.exit(1); }
var sha = crypto.createHash('sha256').update(bytes).digest('hex');
console.log('packaged dist/index.html — ' + (bytes.length / 1024).toFixed(1) + ' KB, byte-identical to saas-physics-v1.html, sha256 ' + sha);
