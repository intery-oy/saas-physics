/*
 * SaaS Physics — leave-behind kit (Horizon C2).
 *
 * Deterministic residue of the current world stamp: assumption pack,
 * appendix CSV, selected-month audit, bind snapshot, short index.
 * Offline-friendly. Not a QoE, not a valuation, not packaging.
 *
 * Adds no physics. Reads engine / notebook / capital objects the glass
 * already shows.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./engine.js'),
      require('./pack.js'),
      require('./notebook.js'),
      require('./capital.js')
    );
  } else {
    root.SaaSPhysicsKit = factory(
      root.SaaSPhysics, root.SaaSPhysicsPack, root.SaaSPhysicsNotebook, root.SaaSPhysicsCapital
    );
  }
})(typeof self !== 'undefined' ? self : globalThis, function (E, PACK, NB, CAP) {
  'use strict';

  function eur(v) {
    if (v == null || !isFinite(v)) return '—';
    var n = Math.round(v);
    var s = n < 0 ? '−' : '';
    return s + '€' + Math.abs(n).toLocaleString('en-US');
  }
  function xfmt(v) { return (v).toFixed(2) + '×'; }

  function defaultStamp(res, month) {
    month = month == null ? E.HORIZON : month;
    return {
      world: 'Default',
      month: 'M' + String(month).padStart(2, '0'),
      scenario: 'Default',
      reading: 'Base|Exp',
      bind: bindChip(res, month),
      year5ARR: E.summarise(res).finalARR,
      selectedMonth: month
    };
  }

  function bindChip(res, month) {
    if (!res || res.derived.smCashReserve == null) return 'no operating constraint binding';
    var mm = month >= 1 ? res.months[month - 1] : null;
    var lab = 'reserve ' + eur(res.derived.smCashReserve);
    return lab + (mm && mm.smConstrained ? ' · binding' : ' · not binding');
  }

  function saturationLabel(res) {
    var k = res.derived.acqSaturationSpend;
    if (k == null) return 'linear · unbounded (k off)';
    return 'saturates · k=' + eur(k) +
      ' · linear would be ' + eur(res.derived.newARRLinear) +
      ' · applied ' + eur(res.derived.newARRPerMonth);
  }

  function bindSnapshot(res, month) {
    month = month == null ? E.HORIZON : month;
    var d = res.derived;
    var mm = month >= 1 ? res.months[month - 1] : null;
    var k = d.acqSaturationSpend;
    return {
      month: month,
      reserve: {
        on: d.smCashReserve != null,
        value: d.smCashReserve,
        binding: !!(mm && mm.smConstrained),
        chip: bindChip(res, month)
      },
      saturation: {
        on: k != null,
        k: k,
        linearNewARR: d.newARRLinear,
        appliedNewARR: d.newARRPerMonth,
        aMax: k == null ? null : d.acqAMax,
        label: saturationLabel(res)
      },
      linear: {
        acquisition: k == null ? 'linear · unbounded' : 'saturates',
        cash: d.smCashReserve == null ? 'no operating constraint binding' : bindChip(res, month)
      }
    };
  }

  function auditText(res, month) {
    month = month == null ? E.HORIZON : month;
    var au = NB.monthAudit(res, month);
    var lines = [];
    lines.push('Selected-month audit · M' + (month < 1 ? '0' : ((month - 1) + ' → flows → M' + month)));
    lines.push(au.formula);
    lines.push('');
    if (month < 1) {
      lines.push('Opening ARR  ' + eur(au.openingARR));
      lines.push('Opening cash ' + eur(au.cashOpening));
    } else {
      lines.push('M' + (month - 1) + ' closing ARR  ' + eur(au.openingARR));
      lines.push('+ New ARR             ' + eur(au.newARR));
      lines.push('+ Expansion           ' + eur(au.expansion));
      lines.push('− Leakage             ' + eur(au.leakage));
      lines.push('= M' + month + ' closing ARR  ' + eur(au.closingARR));
      if (Math.abs(au.residual) > 1e-6) lines.push('Engine residual       ' + au.residual);
      lines.push('');
      lines.push('Model cash M' + (month - 1) + '     ' + eur(au.cashOpening));
      lines.push('+ FCF                 ' + eur(au.fcf));
      lines.push('= Model cash M' + month + '     ' + eur(au.cashClosing));
      lines.push('');
      lines.push('Revenue this month    ' + eur(au.revenue));
      lines.push('GP this month         ' + eur(au.grossProfit));
      lines.push('S&M / R&D / G&A       ' + eur(au.sm) + ' / ' + eur(au.rd) + ' / ' + eur(au.ga));
    }
    lines.push('');
    lines.push('Money is engine euros. Appendix glass rounds to €000.');
    return lines.join('\n') + '\n';
  }

  function sc5Ledger(baseRes, expRes, baseA, expA) {
    if (!baseRes || !expRes) return null;
    var b = E.summarise(baseRes);
    var x = E.summarise(expRes);
    return {
      cacPerARR: { A: baseA.cacPerARR, B: expA.cacPerARR },
      sm: { A: baseA.sm, B: expA.sm },
      newARRPerMonth: { A: baseRes.derived.newARRPerMonth, B: expRes.derived.newARRPerMonth },
      endingCash: { A: b.endingCash, B: x.endingCash }
    };
  }

  function formatSc5(ledger) {
    if (!ledger) return '';
    return [
      '## Sc5 ledger (Capital ≠ ARR)',
      '',
      'A = efficiency · B = spend. Same New ARR, different capital.',
      '',
      '- CAC / €1 New ARR  A ' + xfmt(ledger.cacPerARR.A) + ' · B ' + xfmt(ledger.cacPerARR.B),
      '- S&M / month       A ' + eur(ledger.sm.A) + ' · B ' + eur(ledger.sm.B),
      '- New ARR / month   A ' + eur(ledger.newARRPerMonth.A) + ' · B ' + eur(ledger.newARRPerMonth.B) + ' · invariant',
      '- Ending Model cash A ' + eur(ledger.endingCash.A) + ' → B ' + eur(ledger.endingCash.B),
      ''
    ].join('\n');
  }

  function indexMarkdown(stamp, pack, bind, ledger) {
    var chips = [stamp.world, stamp.month, stamp.scenario, stamp.reading].join(' · ');
    var lines = [
      '# SaaS Physics leave-behind',
      '',
      'Residue of one run. Same engine as the instrument. Offline.',
      'Not a real-book quality-of-earnings, not a valuation, not a product seat.',
      '',
      '## World stamp',
      '',
      '- Chips: `' + chips + '`',
      '- Bind: ' + stamp.bind,
      '- Year-5 ARR: ' + eur(stamp.year5ARR),
      '- Pack label: ' + (pack.label || '—'),
      '- Selected month: M' + String(stamp.selectedMonth).padStart(2, '0'),
      '',
      '## Files',
      '',
      '- `pack.json` / `pack.yaml` — assumption pack (schema v' + PACK.SCHEMA_VERSION + ')',
      '- `appendix.csv` — month × KPI of this run (engine euros)',
      '- `audit.txt` — selected-month M(t−1) → flows → M(t)',
      '- `bind.json` — reserve / saturation / linear as shown',
      '',
      '## Bind snapshot',
      '',
      '- Reserve: ' + bind.reserve.chip,
      '- Saturation: ' + bind.saturation.label,
      '- Acquisition: ' + bind.linear.acquisition,
      '- Cash: ' + bind.linear.cash,
      ''
    ];
    if (ledger) lines.push(formatSc5(ledger));
    lines.push('C3 multi-pack shelf is not in this kit.');
    lines.push('');
    return lines.join('\n');
  }

  function appendixCSV(res) {
    var open = {
      revenue: true, retention: true, unit: true, capital: true,
      logos: !!(res.derived && res.derived.logoLayerOn)
    };
    return NB.toCSV(NB.tableModel(res, open));
  }

  function assemble(opts) {
    opts = opts || {};
    var assumptions = opts.assumptions || E.DEFAULT_ASSUMPTIONS;
    var start = opts.start;
    var res = opts.res || E.run(assumptions, start);
    var month = opts.selectedMonth == null ? E.HORIZON : opts.selectedMonth;
    var pack = opts.pack || PACK.fromWorld(assumptions, start || res.start, { label: opts.label });
    var stamp = Object.assign(defaultStamp(res, month), opts.stamp || {});
    stamp.selectedMonth = month;
    stamp.year5ARR = stamp.year5ARR != null ? stamp.year5ARR : E.summarise(res).finalARR;
    stamp.bind = stamp.bind || bindChip(res, month);
    var bind = bindSnapshot(res, month);
    var ledger = opts.sc5Ledger || null;
    var files = {
      'INDEX.md': indexMarkdown(stamp, pack, bind, ledger),
      'pack.json': PACK.stringifyJSON(pack),
      'pack.yaml': PACK.stringifyYAML(pack),
      'appendix.csv': appendixCSV(res),
      'audit.txt': auditText(res, month),
      'bind.json': JSON.stringify(bind, null, 2) + '\n'
    };
    return { files: files, pack: pack, stamp: stamp, bind: bind, res: res };
  }

  /* Store-only ZIP (no compression). Deterministic timestamps = 0. */
  var CRC_TABLE = (function () {
    var t = new Array(256), n, c, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF, i;
    for (i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8Bytes(str) {
    if (typeof Buffer === 'function') {
      var buf = Buffer.from(String(str), 'utf8');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    return new TextEncoder().encode(String(str));
  }

  function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
  function u32(n) {
    return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  }

  function zipStore(files) {
    var names = Object.keys(files).sort();
    var locals = [];
    var centrals = [];
    var offset = 0;
    var i, name, data, nameB, crc, local, central;
    function concat(parts) {
      var len = 0, j, out, p, o = 0;
      for (j = 0; j < parts.length; j++) len += parts[j].length;
      out = new Uint8Array(len);
      for (j = 0; j < parts.length; j++) {
        p = parts[j];
        out.set(p, o);
        o += p.length;
      }
      return out;
    }
    for (i = 0; i < names.length; i++) {
      name = names[i];
      data = utf8Bytes(files[name]);
      nameB = utf8Bytes(name);
      crc = crc32(data);
      local = concat([
        new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(crc)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameB.length)),
        new Uint8Array(u16(0)),
        nameB,
        data
      ]);
      central = concat([
        new Uint8Array([0x50, 0x4B, 0x01, 0x02]),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(20)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(crc)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u32(data.length)),
        new Uint8Array(u16(nameB.length)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u16(0)),
        new Uint8Array(u32(0)),
        new Uint8Array(u32(offset)),
        nameB
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    }
    var centralOff = offset;
    var centralSize = 0;
    for (i = 0; i < centrals.length; i++) centralSize += centrals[i].length;
    var eocd = concat([
      new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
      new Uint8Array(u16(0)),
      new Uint8Array(u16(0)),
      new Uint8Array(u16(names.length)),
      new Uint8Array(u16(names.length)),
      new Uint8Array(u32(centralSize)),
      new Uint8Array(u32(centralOff)),
      new Uint8Array(u16(0))
    ]);
    return concat(locals.concat(centrals).concat([eocd]));
  }

  return {
    assemble: assemble,
    bindSnapshot: bindSnapshot,
    bindChip: bindChip,
    auditText: auditText,
    sc5Ledger: sc5Ledger,
    defaultStamp: defaultStamp,
    zipStore: zipStore,
    appendixCSV: appendixCSV
  };
});
