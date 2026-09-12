/*
 * SaaS Physics — assumption pack (Horizon C1).
 *
 * Versioned driver pack. Maps 1:1 onto the engine's existing assumption
 * object (DEFAULT_ASSUMPTIONS + known bounds) and start object
 * (DEFAULT_START). One-way into those objects — never writes engine.js.
 *
 * Diff is driver-level only. Not a second analytics GRR. Load of the
 * Default pack reproduces the Default world; Year-5 ARR checksum holds.
 *
 * JSON is canonical. YAML is a restricted sibling of the same object.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.SaaSPhysicsPack = factory(root.SaaSPhysics);
})(typeof self !== 'undefined' ? self : globalThis, function (E) {
  'use strict';

  var SCHEMA = 'saas-physics.assumption-pack';
  var SCHEMA_VERSION = 1;
  var DIFF_SCHEMA = 'saas-physics.assumption-pack-diff';
  var MODEL_VERSION = '0.4';
  var DEFAULT_Y5_ARR = 62926223.19;

  var ASSUMPTION_KEYS = [
    'sm', 'cacPerARR', 'acqSaturationSpend', 'smCashReserve',
    'billingAdvanceMonths', 'expansionCacPerARR', 'logoRetentionAnnual',
    'persistenceAnnual', 'expansionCoefficientAnnual', 'grossMargin',
    'rd', 'ga'
  ];
  var START_KEYS = ['openingARR', 'openingCash', 'openingCohorts', 'openingCustomers'];
  var BAND_KEYS = ['name', 'maxAgeExclusive', 'persistenceAnnual', 'expansionCoefficientAnnual'];
  var COHORT_KEYS = ['arr', 'age'];

  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }

  function same(a, b) {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b)) {
      return a === b;
    }
    return JSON.stringify(canonicalValue(a)) === JSON.stringify(canonicalValue(b));
  }

  function canonicalValue(v) {
    if (v === undefined) return null;
    return v;
  }

  function pickAssumptions(a) {
    var src = Object.assign({}, E.DEFAULT_ASSUMPTIONS, a || {});
    var out = {};
    var i, k;
    for (i = 0; i < ASSUMPTION_KEYS.length; i++) {
      k = ASSUMPTION_KEYS[i];
      out[k] = src[k] === undefined ? null : src[k];
    }
    var bands = bandsOrNull(a && a.bands, src);
    out.bands = bands;
    return out;
  }

  function bandsOrNull(bands, scalars) {
    if (!bands || bands.length !== 3) return null;
    var mapped = bands.map(function (b, i) {
      return {
        name: b.name || E.BAND_NAMES[i],
        maxAgeExclusive: b.maxAgeExclusive == null ? E.BAND_EDGES[i] : b.maxAgeExclusive,
        persistenceAnnual: b.persistenceAnnual,
        expansionCoefficientAnnual: b.expansionCoefficientAnnual
      };
    });
    var flat = mapped.every(function (b) {
      return b.persistenceAnnual === scalars.persistenceAnnual &&
             b.expansionCoefficientAnnual === scalars.expansionCoefficientAnnual;
    });
    return flat ? null : mapped;
  }

  function pickStart(s) {
    var src = Object.assign({}, E.DEFAULT_START, s || {});
    var cohorts = src.openingCohorts;
    if (cohorts && !cohorts.length) cohorts = null;
    return {
      openingARR: src.openingARR,
      openingCash: src.openingCash,
      openingCohorts: cohorts ? cohorts.map(function (c) {
        return { arr: c.arr, age: c.age };
      }) : null,
      openingCustomers: src.openingCustomers == null ? null : src.openingCustomers
    };
  }

  function isDefaultStart(s) {
    var n = pickStart(s);
    var d = pickStart(E.DEFAULT_START);
    return same(n, d);
  }

  function emptyPack() {
    return {
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      modelVersion: MODEL_VERSION,
      kind: 'assumption-pack',
      label: 'Default',
      assumptions: pickAssumptions(E.DEFAULT_ASSUMPTIONS),
      start: pickStart(E.DEFAULT_START)
    };
  }

  function fromWorld(assumptions, start, meta) {
    meta = meta || {};
    var pack = {
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      modelVersion: (assumptions && assumptions.modelVersion) || MODEL_VERSION,
      kind: 'assumption-pack',
      label: meta.label || null,
      assumptions: pickAssumptions(assumptions),
      start: pickStart(start)
    };
    if (!pack.label) {
      pack.label = same(pack.assumptions, pickAssumptions(E.DEFAULT_ASSUMPTIONS)) &&
                   same(pack.start, pickStart(E.DEFAULT_START)) ? 'Default' : 'Custom';
    }
    return pack;
  }

  function defaultPack() { return fromWorld(E.DEFAULT_ASSUMPTIONS, E.DEFAULT_START, { label: 'Default' }); }

  function unknownKeys(obj, allowed) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    return Object.keys(obj).filter(function (k) { return allowed.indexOf(k) === -1; });
  }

  function err(msg) {
    var e = new Error(msg);
    e.name = 'AssumptionPackError';
    return e;
  }

  /* ------------------------------------------------------------------ *
   * Value validation.
   *
   * Structural validation (unknown keys, shape) already refuses a pack that
   * is not a pack. This refuses a pack that IS a pack but carries a value the
   * engine cannot mean anything by. Two failure modes it closes:
   *
   *   - a non-number, null or NaN on a REQUIRED driver. E.run merges over
   *     DEFAULT_ASSUMPTIONS with Object.assign, which does not restore a
   *     default for an explicit null — so `"sm": null` propagates straight
   *     into the arithmetic and the whole 60-month world silently becomes
   *     NaN. No check downstream would name the cause.
   *   - an out-of-domain number on an OPTIONAL driver. The engine's
   *     saturationSpendOf / logoRetentionOf / ... coerce garbage to "off",
   *     so a typo reads as a deliberate choice and the loaded world is
   *     quietly not the one in the file.
   *
   * Bounds are the MODEL domain, not the UI slider range: a pack is allowed
   * to carry a world the sliders cannot reach, but not one the equations
   * cannot evaluate. Throws AssumptionPackError, which the Frame/Close pack
   * UI already catches and displays.
   * ------------------------------------------------------------------ */
  var DRIVER_RULES = {
    /* required — no null; these reach the arithmetic unguarded */
    sm:                         { min: 0 },
    cacPerARR:                  { min: 0, exclusiveMin: true },
    persistenceAnnual:          { min: 0, max: 1 },
    expansionCoefficientAnnual: { min: 0 },
    grossMargin:                { min: 0, max: 1 },
    rd:                         { min: 0 },
    ga:                         { min: 0 },
    /* optional — null (or 0, where the engine reads 0 as off) means off */
    acqSaturationSpend:         { nullable: true, min: 0 },
    smCashReserve:              { nullable: true, min: 0 },
    billingAdvanceMonths:       { nullable: true, min: 0 },
    expansionCacPerARR:         { nullable: true, min: 0 },
    logoRetentionAnnual:        { nullable: true, min: 0, max: 1 }
  };

  var START_RULES = {
    openingARR:       { min: 0 },
    openingCash:      {},                                  // may legitimately be negative
    openingCustomers: { nullable: true, min: 0, exclusiveMin: true }
  };

  /* Names the offending value unambiguously — "900000" (a string) must not
     read like 900000 (a number) in the message a user is shown. */
  function fmtBadValue(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return 'the string ' + JSON.stringify(v);
    if (Array.isArray(v)) return 'an array';
    if (typeof v === 'object') return 'an object';
    return typeof v + ' ' + String(v);
  }

  function describeRange(rule) {
    var lo = rule.min === undefined ? null : (rule.exclusiveMin ? '> ' + rule.min : '>= ' + rule.min);
    var hi = rule.max === undefined ? null : '<= ' + rule.max;
    if (lo && hi) return lo + ' and ' + hi;
    return lo || hi || 'a finite number';
  }

  /* One value against one rule. `path` is only used to name the failure. */
  function checkValue(path, v, rule) {
    if (v === null || v === undefined) {
      if (rule.nullable) return;
      throw err(path + ' must be a finite number (' + describeRange(rule) + '), not ' + fmtBadValue(v) + '.');
    }
    if (typeof v !== 'number' || !isFinite(v)) {
      throw err(path + ' must be a finite number (' + describeRange(rule) + '), not ' + fmtBadValue(v) + '.');
    }
    if (rule.min !== undefined) {
      if (rule.exclusiveMin ? !(v > rule.min) : !(v >= rule.min)) {
        throw err(path + ' must be ' + describeRange(rule) + '; got ' + v + '.');
      }
    }
    if (rule.max !== undefined && !(v <= rule.max)) {
      throw err(path + ' must be ' + describeRange(rule) + '; got ' + v + '.');
    }
  }

  /* A key absent from the pack takes the engine default, which is valid by
     construction — so only keys the pack actually states are checked. An
     explicit `undefined` is not absence: pickAssumptions turns it into null,
     so it is checked like one. */
  function stated(obj, k) {
    return obj && Object.prototype.hasOwnProperty.call(obj, k);
  }

  function validateValues(aIn, sIn) {
    var i, k;
    for (i = 0; i < ASSUMPTION_KEYS.length; i++) {
      k = ASSUMPTION_KEYS[i];
      if (stated(aIn, k)) checkValue('assumptions.' + k, aIn[k], DRIVER_RULES[k]);
    }
    if (aIn && aIn.bands != null) {
      aIn.bands.forEach(function (b, bi) {
        var p = 'assumptions.bands[' + bi + ']';
        if (!b || typeof b !== 'object' || Array.isArray(b)) throw err(p + ' must be an object.');
        if (stated(b, 'name') && b.name != null && typeof b.name !== 'string') throw err(p + '.name must be a string or null.');
        /* maxAgeExclusive: null takes the standard band edge; the top band's
           edge is Infinity, which JSON cannot carry and reads back as null. */
        if (stated(b, 'maxAgeExclusive') && b.maxAgeExclusive != null) {
          var mx = b.maxAgeExclusive;
          if (typeof mx !== 'number' || isNaN(mx) || !(mx > 0)) {
            throw err(p + '.maxAgeExclusive must be a number > 0 (or null for the standard edge); got ' + fmtBadValue(mx) + '.');
          }
        }
        checkValue(p + '.persistenceAnnual', b.persistenceAnnual, DRIVER_RULES.persistenceAnnual);
        checkValue(p + '.expansionCoefficientAnnual', b.expansionCoefficientAnnual, DRIVER_RULES.expansionCoefficientAnnual);
      });
    }
    for (i = 0; i < START_KEYS.length; i++) {
      k = START_KEYS[i];
      if (k === 'openingCohorts') continue;
      if (stated(sIn, k)) checkValue('start.' + k, sIn[k], START_RULES[k]);
    }
    if (sIn && sIn.openingCohorts != null) {
      sIn.openingCohorts.forEach(function (c, ci) {
        var p = 'start.openingCohorts[' + ci + ']';
        if (!c || typeof c !== 'object' || Array.isArray(c)) throw err(p + ' must be an object.');
        checkValue(p + '.arr', c.arr, { min: 0 });
        checkValue(p + '.age', c.age, { min: 0 });
      });
    }
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') throw err('Pack is not an object.');
    if (raw.schema !== SCHEMA) throw err('Unknown pack schema (expected ' + SCHEMA + ').');
    if (raw.schemaVersion !== SCHEMA_VERSION) throw err('Unsupported pack schemaVersion ' + raw.schemaVersion + '.');
    if (raw.kind && raw.kind !== 'assumption-pack') throw err('Pack kind must be assumption-pack.');
    var topUnknown = unknownKeys(raw, [
      'schema', 'schemaVersion', 'modelVersion', 'kind', 'label', 'assumptions', 'start'
    ]);
    if (topUnknown.length) throw err('Unknown pack fields: ' + topUnknown.join(', ') + '.');
    var aIn = raw.assumptions || {};
    var aUnknown = unknownKeys(aIn, ASSUMPTION_KEYS.concat(['bands']));
    if (aUnknown.length) throw err('Unknown assumption drivers: ' + aUnknown.join(', ') + '.');
    if (aIn.bands != null) {
      if (!Array.isArray(aIn.bands) || aIn.bands.length !== 3) throw err('assumptions.bands must be three bands or null.');
      aIn.bands.forEach(function (b, i) {
        var u = unknownKeys(b, BAND_KEYS);
        if (u.length) throw err('Unknown band field on bands[' + i + ']: ' + u.join(', ') + '.');
      });
    }
    var sIn = raw.start || {};
    var sUnknown = unknownKeys(sIn, START_KEYS);
    if (sUnknown.length) throw err('Unknown start drivers: ' + sUnknown.join(', ') + '.');
    if (sIn.openingCohorts != null) {
      if (!Array.isArray(sIn.openingCohorts)) throw err('start.openingCohorts must be an array or null.');
      sIn.openingCohorts.forEach(function (c, i) {
        var u = unknownKeys(c, COHORT_KEYS);
        if (u.length) throw err('Unknown openingCohorts[' + i + '] field: ' + u.join(', ') + '.');
      });
    }
    validateValues(aIn, sIn);
    return fromWorld(aIn, sIn, { label: raw.label || null });
  }

  function toEngine(pack) {
    var n = normalize(pack);
    var assumptions = {};
    var i, k;
    for (i = 0; i < ASSUMPTION_KEYS.length; i++) {
      k = ASSUMPTION_KEYS[i];
      assumptions[k] = n.assumptions[k];
    }
    if (n.assumptions.bands) assumptions.bands = clone(n.assumptions.bands);
    var start = pickStart(n.start);
    return { assumptions: assumptions, start: start };
  }

  function runPack(pack) {
    var w = toEngine(pack);
    return E.run(w.assumptions, w.start);
  }

  function year5ARR(pack) {
    return E.summarise(runPack(pack)).finalARR;
  }

  function isDefault(pack) {
    var n = normalize(pack);
    var d = defaultPack();
    return same(n.assumptions, d.assumptions) && same(n.start, d.start);
  }

  function pathPush(out, path, from, to) {
    if (same(from, to)) return;
    out.push({ path: path, from: canonicalValue(from), to: canonicalValue(to) });
  }

  function diffBands(a, b, out) {
    if (a == null && b == null) return;
    if (a == null || b == null || a.length !== b.length) {
      pathPush(out, 'assumptions.bands', a, b);
      return;
    }
    var i, k;
    for (i = 0; i < a.length; i++) {
      for (k = 0; k < BAND_KEYS.length; k++) {
        pathPush(out, 'assumptions.bands.' + (a[i].name || i) + '.' + BAND_KEYS[k],
          a[i][BAND_KEYS[k]], b[i][BAND_KEYS[k]]);
      }
    }
  }

  function diffCohorts(a, b, out) {
    if (a == null && b == null) return;
    if (a == null || b == null || a.length !== b.length) {
      pathPush(out, 'start.openingCohorts', a, b);
      return;
    }
    var i;
    for (i = 0; i < a.length; i++) {
      pathPush(out, 'start.openingCohorts[' + i + '].arr', a[i].arr, b[i].arr);
      pathPush(out, 'start.openingCohorts[' + i + '].age', a[i].age, b[i].age);
    }
  }

  function diff(packA, packB) {
    var a = normalize(packA);
    var b = normalize(packB);
    var changed = [];
    var i, k;
    for (i = 0; i < ASSUMPTION_KEYS.length; i++) {
      k = ASSUMPTION_KEYS[i];
      pathPush(changed, 'assumptions.' + k, a.assumptions[k], b.assumptions[k]);
    }
    diffBands(a.assumptions.bands, b.assumptions.bands, changed);
    for (i = 0; i < START_KEYS.length; i++) {
      k = START_KEYS[i];
      if (k === 'openingCohorts') continue;
      pathPush(changed, 'start.' + k, a.start[k], b.start[k]);
    }
    diffCohorts(a.start.openingCohorts, b.start.openingCohorts, changed);
    return {
      schema: DIFF_SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      changed: changed
    };
  }

  function stringifyJSON(pack) {
    return JSON.stringify(normalize(pack), null, 2) + '\n';
  }

  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function yamlScalar(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number' && isFinite(v)) return String(v);
    var s = String(v);
    if (/^[-]?(\d+\.?\d*|\.\d+)$/.test(s) || /[:#{}[\],&*?|<>=!%@`]/.test(s) || /[\s]/.test(s) || s === '' ||
        s === 'true' || s === 'false' || s === 'null' || s === 'yes' || s === 'no') {
      return JSON.stringify(s);
    }
    return s;
  }

  function yamlWrite(value, indent) {
    indent = indent || 0;
    var pad = new Array(indent + 1).join('  ');
    var i, k, keys, lines;
    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      lines = [];
      for (i = 0; i < value.length; i++) {
        if (isPlainObject(value[i])) {
          keys = Object.keys(value[i]);
          lines.push(pad + '- ' + keys[0] + ': ' + yamlScalar(value[i][keys[0]]));
          for (k = 1; k < keys.length; k++) {
            lines.push(pad + '  ' + keys[k] + ': ' + yamlScalar(value[i][keys[k]]));
          }
        } else {
          lines.push(pad + '- ' + yamlScalar(value[i]));
        }
      }
      return lines.join('\n');
    }
    if (isPlainObject(value)) {
      keys = Object.keys(value);
      lines = [];
      for (i = 0; i < keys.length; i++) {
        k = keys[i];
        if (isPlainObject(value[k]) || (Array.isArray(value[k]) && value[k].length && isPlainObject(value[k][0]))) {
          lines.push(pad + k + ':');
          lines.push(yamlWrite(value[k], indent + 1));
        } else if (Array.isArray(value[k]) && !value[k].length) {
          lines.push(pad + k + ': []');
        } else {
          lines.push(pad + k + ': ' + yamlScalar(value[k]));
        }
      }
      return lines.join('\n');
    }
    return pad + yamlScalar(value);
  }

  function stringifyYAML(pack) {
    return yamlWrite(normalize(pack), 0) + '\n';
  }

  function parseScalar(raw) {
    var s = raw.replace(/\s+#.*$/, '').trim();
    if (s === 'null' || s === '~' || s === '') return null;
    if (s === 'true') return true;
    if (s === 'false') return false;
    if ((s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') ||
        (s.charAt(0) === "'" && s.charAt(s.length - 1) === "'")) {
      return JSON.parse(s.charAt(0) === '"' ? s : '"' + s.slice(1, -1).replace(/"/g, '\\"') + '"');
    }
    if (/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s)) return Number(s);
    return s;
  }

  function parseYAML(text) {
    var lines = String(text).replace(/\r\n/g, '\n').split('\n');
    var i = 0;
    function indentOf(line) {
      var n = 0;
      while (n < line.length && line.charAt(n) === ' ') n++;
      return n;
    }
    function peek() {
      while (i < lines.length) {
        var t = lines[i];
        if (!t.trim() || t.trim().charAt(0) === '#') { i++; continue; }
        return t;
      }
      return null;
    }
    function parseBlock(minIndent) {
      var line = peek();
      if (line == null) return {};
      if (line.trim().charAt(0) === '-') return parseSeq(minIndent);
      return parseMap(minIndent);
    }
    function parseMap(minIndent) {
      var obj = {};
      var line, ind, m, key, rest;
      while ((line = peek()) != null) {
        ind = indentOf(line);
        if (ind < minIndent) break;
        if (line.trim().charAt(0) === '-') break;
        i++;
        m = line.trim().match(/^([^:]+):(.*)$/);
        if (!m) throw err('YAML: cannot parse ' + line.trim());
        key = m[1].trim();
        rest = m[2].replace(/\s+#.*$/, '').trim();
        if (rest === '' || rest === '|') {
          var next = peek();
          if (next == null || indentOf(next) <= ind) obj[key] = null;
          else obj[key] = parseBlock(indentOf(next));
        } else if (rest === '[]') {
          obj[key] = [];
        } else {
          obj[key] = parseScalar(rest);
        }
      }
      return obj;
    }
    function parseSeq(minIndent) {
      var arr = [];
      var line, ind, rest, item, next;
      while ((line = peek()) != null) {
        ind = indentOf(line);
        if (ind < minIndent) break;
        if (line.trim().charAt(0) !== '-') break;
        i++;
        rest = line.trim().slice(1).trim();
        if (!rest) {
          next = peek();
          arr.push(next ? parseBlock(indentOf(next)) : null);
        } else if (rest.indexOf(':') !== -1) {
          item = parseMapFromInline(rest);
          next = peek();
          if (next && indentOf(next) > ind && next.trim().charAt(0) !== '-') {
            Object.assign(item, parseMap(indentOf(next)));
          }
          arr.push(item);
        } else {
          arr.push(parseScalar(rest));
        }
      }
      return arr;
    }
    function parseMapFromInline(rest) {
      var m = rest.match(/^([^:]+):(.*)$/);
      if (!m) return parseScalar(rest);
      var obj = {};
      var val = m[2].replace(/\s+#.*$/, '').trim();
      obj[m[1].trim()] = val === '' ? null : parseScalar(val);
      return obj;
    }
    var parsed = parseBlock(0);
    return normalize(parsed);
  }

  function looksLikeYAML(text) {
    var t = String(text).replace(/^\uFEFF/, '').trim();
    if (!t) return false;
    if (t.charAt(0) === '{') return false;
    return /^schema:\s/.test(t);
  }

  function parse(text) {
    if (text && typeof text === 'object') return normalize(text);
    var s = String(text).replace(/^\uFEFF/, '');
    if (!s.trim()) throw err('Empty pack.');
    if (looksLikeYAML(s)) return parseYAML(s);
    try {
      return normalize(JSON.parse(s));
    } catch (e) {
      if (e.name === 'AssumptionPackError') throw e;
      return parseYAML(s);
    }
  }

  function formatDiff(d) {
    if (!d.changed.length) return 'No drivers differ.';
    return d.changed.map(function (c) {
      return c.path + ': ' + fmtDriver(c.from) + ' → ' + fmtDriver(c.to);
    }).join('\n');
  }

  function fmtDriver(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  return {
    SCHEMA: SCHEMA,
    SCHEMA_VERSION: SCHEMA_VERSION,
    DIFF_SCHEMA: DIFF_SCHEMA,
    MODEL_VERSION: MODEL_VERSION,
    DEFAULT_Y5_ARR: DEFAULT_Y5_ARR,
    ASSUMPTION_KEYS: ASSUMPTION_KEYS,
    START_KEYS: START_KEYS,
    defaultPack: defaultPack,
    emptyPack: emptyPack,
    fromWorld: fromWorld,
    normalize: normalize,
    parse: parse,
    toEngine: toEngine,
    runPack: runPack,
    year5ARR: year5ARR,
    isDefault: isDefault,
    isDefaultStart: isDefaultStart,
    diff: diff,
    formatDiff: formatDiff,
    stringifyJSON: stringifyJSON,
    stringifyYAML: stringifyYAML,
    parseYAML: parseYAML
  };
});
