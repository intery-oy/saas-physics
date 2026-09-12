/*
 * SaaS Physics v1 — Notebook table (lab notebook).
 *
 * Presentation only. Reads the same engine month records and kpi.js R12M
 * measurements System already uses. Adds no coefficients, no LTV, no
 * parallel math. Missing / off / not-yet-measurable → null (rendered "—").
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./kpi.js'));
  else root.SaaSPhysicsNotebook = factory(root.SaaSPhysicsKPI);
})(typeof self !== 'undefined' ? self : globalThis, function (K) {
  'use strict';

  var MISSING = '—';
  var MONEY_UNIT = '€000';   /* display only — engine cells stay in full euros */
  var DEFAULT_OPEN = {
    revenue: true,
    retention: true,
    unit: false,
    capital: true,
    logos: false
  };

  /* Groups that are always in the table. Logos is always present even when
     the logo bound is off (cells then read "—"). */
  var GROUPS = [
    { id: 'revenue',   title: 'Recurring stock', unit: MONEY_UNIT },
    { id: 'retention', title: 'Retention' },
    { id: 'unit',      title: 'Unit economics' },
    { id: 'capital',   title: 'Model cash',      unit: MONEY_UNIT },
    { id: 'logos',     title: 'Logos' }
  ];

  function startKey(s) {
    if (!s) return 'default';
    return JSON.stringify({
      openingARR: s.openingARR,
      openingCash: s.openingCash,
      openingCohorts: s.openingCohorts || null,
      openingCustomers: s.openingCustomers || null
    });
  }

  function experimentDiffers(baseRes, expRes) {
    var ba = baseRes.assumptions, ea = expRes.assumptions;
    var seen = {}, keys = Object.keys(ba).concat(Object.keys(ea)), i, k;
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      if (seen[k] || k === 'bands') continue;
      seen[k] = true;
      if (ba[k] !== ea[k]) return true;
    }
    if (JSON.stringify(baseRes.bands) !== JSON.stringify(expRes.bands)) return true;
    if (startKey(baseRes.start) !== startKey(expRes.start)) return true;
    return false;
  }

  function defaultWorld(baseRes, expRes) {
    return experimentDiffers(baseRes, expRes) ? 'experiment' : 'base';
  }

  function logoOn(res) { return !!(res.derived && res.derived.logoLayerOn); }
  function smDistinguished(res) { return !!(res.derived && res.derived.smIsUnconstrained === false); }

  /* Column catalogue. kind: stock (defined at month 0) | flow (period, null at 0)
     | measure (R12M, null before month 12) | const (assumption-level). */
  function columnsFor(res) {
    var cols = [
      { id: 'arr',       group: 'revenue',   label: 'Closing ARR',      kind: 'eur',     src: 'stock' },
      { id: 'newARR',    group: 'revenue',   label: 'New ARR',          kind: 'eur',     src: 'flow' },
      { id: 'expansion', group: 'revenue',   label: 'Expansion ARR',    kind: 'eur',     src: 'flow' },
      { id: 'leakage',   group: 'revenue',   label: 'Leakage',          kind: 'eur',     src: 'flow' }
    ];
    /* Engine term is Leakage when the logo layer is off. When it is on,
       leakage still exists and contraction is the residual split — not a
       second churn engine. */
    if (logoOn(res)) {
      cols.push({ id: 'contraction', group: 'revenue', label: 'Contraction ARR (logo churn and contraction split)', short: 'Contraction ARR', kind: 'eur', src: 'flow' });
    }
    cols.push({ id: 'netNew', group: 'revenue', label: 'Net new ARR', kind: 'eur', src: 'flow' });
    /* GRR and NRR are a pair — always adjacent, always both present. */
    cols.push(
      { id: 'grr', group: 'retention', label: 'R12M GRR', kind: 'pct', src: 'r12m' },
      { id: 'nrr', group: 'retention', label: 'R12M NRR', kind: 'pct', src: 'r12m' }
    );
    cols.push({ id: 'sm', group: 'unit', label: 'S&M', kind: 'eur', src: 'flow' });
    if (smDistinguished(res)) {
      cols.push({ id: 'smIntended', group: 'unit', label: 'S&M intended', kind: 'eur', src: 'flow' });
    }
    cols.push(
      { id: 'cac',      group: 'unit',    label: 'CAC / New ARR',      kind: 'x',      src: 'const' },
      { id: 'payback',  group: 'unit',    label: 'CAC payback months', kind: 'months', src: 'const' },
      { id: 'cash',     group: 'capital', label: 'Model cash',         kind: 'eur',    src: 'stock' },
      { id: 'fcf',      group: 'capital', label: 'FCF (EBITA proxy)',  kind: 'eur',    src: 'flow' },
      { id: 'ebita',    group: 'capital', label: 'EBITA',              kind: 'eur',    src: 'flow' },
      { id: 'logos',    group: 'logos',   label: 'Logo count',         kind: 'count',  src: 'logos' },
      { id: 'logoRet',  group: 'logos',   label: 'Logo retention',     kind: 'pct',    src: 'logos-r12m' }
    );
    return cols;
  }

  function r12m(res, t) {
    if (!K || t < 12) return null;
    return K.measureR12M(res, t);
  }

  /* One month of the table. t=0 is the opening snapshot (stocks only).
     Flows, R12M and logo measurements that do not exist yet are null. */
  function cellsAt(res, t) {
    var on = logoOn(res);
    var cac = res.assumptions.cacPerARR;
    var payback = res.derived.cacPaybackMonths;
    if (t === 0) {
      var m0 = res.months[0];
      return {
        arr: res.start.openingARR,
        mrr: m0.openingMRR,
        newARR: null, expansion: null, leakage: null, contraction: null, netNew: null,
        grr: null, nrr: null,
        sm: null, smIntended: null,
        cac: cac, payback: payback,
        cash: res.start.openingCash,
        burn: null, fcf: null, ebita: null,
        logos: on ? m0.customersOpening : null,
        logoRet: null
      };
    }
    var m = res.months[t - 1];
    var kpi = r12m(res, t);
    return {
      arr: m.closingARR,
      mrr: m.closingMRR,
      newARR: m.newARR,
      expansion: m.expansion,
      leakage: m.leakage,
      contraction: on ? m.contraction : null,
      /* Same identity System prints as "net change in the stock". */
      netNew: m.newARR + m.expansion - m.leakage,
      grr: kpi ? kpi.grr : null,
      nrr: kpi ? kpi.nrr : null,
      sm: m.sm,
      smIntended: m.smIntended,
      cac: cac,
      payback: payback,
      cash: m.cashClosing,
      burn: m.burn,
      fcf: m.fcf,
      ebita: m.ebita,
      logos: on ? m.customersClosing : null,
      logoRet: on && kpi && kpi.logoRetention !== null && kpi.logoRetention !== undefined ? kpi.logoRetention : null
    };
  }

  function groupOpenMap(override) {
    var out = {}, i;
    for (i = 0; i < GROUPS.length; i++) out[GROUPS[i].id] = DEFAULT_OPEN[GROUPS[i].id];
    if (override) {
      for (i = 0; i < GROUPS.length; i++) {
        if (typeof override[GROUPS[i].id] === 'boolean') out[GROUPS[i].id] = override[GROUPS[i].id];
      }
    }
    return out;
  }

  function visibleColumns(res, groupsOpen) {
    var open = groupOpenMap(groupsOpen);
    return columnsFor(res).filter(function (c) { return open[c.group]; });
  }

  function tableModel(res, groupsOpen) {
    var open = groupOpenMap(groupsOpen);
    var cols = columnsFor(res);
    var rows = [];
    var t;
    for (t = 0; t <= res.horizon; t++) rows.push({ month: t, cells: cellsAt(res, t) });
    var empty = { logos: !logoOn(res), unit: true };
    return { groups: GROUPS, groupsOpen: open, columns: cols, rows: rows, horizon: res.horizon, empty: empty };
  }

  /* M(t−1) → flows → M(t) identity. Engine euros; display layer rounds to €000. */
  function monthAudit(res, t) {
    if (t == null || t < 1) {
      return {
        t: 0,
        openingARR: res.start.openingARR,
        newARR: null, expansion: null, leakage: null,
        closingARR: res.start.openingARR,
        residual: 0,
        cashOpening: res.start.openingCash,
        fcf: null,
        cashClosing: res.start.openingCash,
        cashResidual: 0,
        revenue: null, grossProfit: null, sm: null, rd: null, ga: null,
        formula: 'M0 is the opening snapshot — no period flows yet.'
      };
    }
    var m = res.months[t - 1];
    var residual = m.openingARR + m.newARR + m.expansion - m.leakage - m.closingARR;
    var cashResidual = m.cashOpening + m.fcf - m.cashClosing;
    return {
      t: t,
      openingARR: m.openingARR,
      newARR: m.newARR,
      expansion: m.expansion,
      leakage: m.leakage,
      closingARR: m.closingARR,
      residual: residual,
      cashOpening: m.cashOpening,
      fcf: m.fcf,
      cashClosing: m.cashClosing,
      cashResidual: cashResidual,
      revenue: m.revenue,
      grossProfit: m.grossProfit,
      sm: m.sm,
      rd: m.rd,
      ga: m.ga,
      formula: 'closing ARR = opening ARR + New + Expansion − Leakage'
    };
  }

  function groupThousands(n) {
    var s = n < 0 ? '-' : '';
    var abs = String(Math.abs(n));
    return s + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* Money cells are engine euros ÷ 1000, rounded. Rates, payback months and
     logo counts are not scaled. Missing stays "—". */
  function formatValue(kind, v) {
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return MISSING;
    if (kind === 'eur') return groupThousands(Math.round(v / 1000));
    if (kind === 'pct') return (v * 100).toFixed(2) + '%';
    if (kind === 'x') return (v).toFixed(2) + '\u00d7';
    if (kind === 'months') return (v).toFixed(1);
    if (kind === 'count') {
      if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
      return v.toFixed(1);
    }
    return String(v);
  }

  function csvNumber(kind, v) {
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return '';
    if (kind === 'pct') return (v * 100).toFixed(6);
    return String(v);
  }

  function toCSV(model) {
    var cols = model.columns.filter(function (c) { return model.groupsOpen[c.group]; });
    var lines = [['Month'].concat(cols.map(function (c) { return c.short || c.label; })).join(',')];
    model.rows.forEach(function (row) {
      lines.push([row.month].concat(cols.map(function (c) { return csvNumber(c.kind, row.cells[c.id]); })).join(','));
    });
    return lines.join('\n') + '\n';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function groupVisible(model, g) {
    if (model.empty && model.empty[g.id]) return false;
    return true;
  }

  function renderTable(model, opts) {
    opts = opts || {};
    var selected = opts.selectedMonth;
    var open = model.groupsOpen;
    var i, g, cols, span, row, c, v, cls, lab;
    var h = '<caption>Money in ' + esc(MONEY_UNIT) + ' · rates unscaled · one precision</caption>';
    h += '<thead><tr class="nb-groups"><th class="nb-month" rowspan="2">Month</th>';
    for (i = 0; i < model.groups.length; i++) {
      g = model.groups[i];
      if (!groupVisible(model, g)) continue;
      cols = model.columns.filter(function (col) { return col.group === g.id; });
      span = open[g.id] ? cols.length : 1;
      h += '<th class="nb-g" data-group="' + g.id + '" colspan="' + span + '">' +
        '<button type="button" class="nb-gbtn' + (open[g.id] ? ' open' : '') + '" data-group="' + g.id + '">' +
        (open[g.id] ? '\u25be ' : '\u25b8 ') + esc(g.title) +
        (g.unit ? ' <span class="nb-unit">' + esc(g.unit) + '</span>' : '') +
        '</button></th>';
    }
    h += '</tr><tr class="nb-cols">';
    for (i = 0; i < model.groups.length; i++) {
      g = model.groups[i];
      if (!groupVisible(model, g)) continue;
      cols = model.columns.filter(function (col) { return col.group === g.id; });
      if (!open[g.id]) {
        h += '<th class="nb-collapsed" data-group="' + g.id + '"></th>';
        continue;
      }
      cols.forEach(function (col) {
        lab = col.short || col.label;
        h += '<th title="' + esc(col.label) + '" data-col="' + col.id + '" data-group="' + g.id + '">' + esc(lab) + '</th>';
      });
    }
    h += '</tr></thead><tbody>';
    for (i = 0; i < model.rows.length; i++) {
      row = model.rows[i];
      cls = (selected !== undefined && selected !== null && Number(selected) === row.month) ? ' class="on"' : '';
      h += '<tr data-month="' + row.month + '"' + cls + '><th class="nb-month" scope="row">' + row.month + '</th>';
      for (g = 0; g < model.groups.length; g++) {
        if (!groupVisible(model, model.groups[g])) continue;
        cols = model.columns.filter(function (col) { return col.group === model.groups[g].id; });
        if (!open[model.groups[g].id]) {
          h += '<td class="nb-collapsed" data-group="' + model.groups[g].id + '"></td>';
          continue;
        }
        cols.forEach(function (col) {
          v = row.cells[col.id];
          h += '<td data-col="' + col.id + '" data-month="' + row.month + '" data-raw="' +
            (v === null || v === undefined ? '' : String(v)) + '">' + esc(formatValue(col.kind, v)) + '</td>';
        });
      }
      h += '</tr>';
    }
    h += '</tbody>';
    return h;
  }

  /* Omitted on purpose: LTV:CAC. The engine has no honest LTV (no cost-to-serve,
     no discounting, no churn/contraction lifetime). Do not invent the ratio. */
  var OMITTED = ['LTV:CAC'];

  return {
    MISSING: MISSING,
    MONEY_UNIT: MONEY_UNIT,
    DEFAULT_OPEN: DEFAULT_OPEN,
    GROUPS: GROUPS,
    OMITTED: OMITTED,
    experimentDiffers: experimentDiffers,
    defaultWorld: defaultWorld,
    columnsFor: columnsFor,
    cellsAt: cellsAt,
    tableModel: tableModel,
    monthAudit: monthAudit,
    visibleColumns: visibleColumns,
    formatValue: formatValue,
    toCSV: toCSV,
    renderTable: renderTable,
    groupOpenMap: groupOpenMap
  };
});
