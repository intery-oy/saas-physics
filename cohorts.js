/*
 * SaaS Physics v1 — Cohorts surface (composition + honesty + age toggle).
 *
 * Presentation only. Reads the same engine cohort rows, yearly mix buckets
 * and kpi.js R12M / ageComposition series Company and System already use.
 * Adds no coefficients, no triangle math, no blended-NRR "truth".
 * Missing / off / incomplete window → null (rendered "—").
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./kpi.js'));
  else root.SaaSPhysicsCohorts = factory(root.SaaSPhysicsKPI);
})(typeof self !== 'undefined' ? self : globalThis, function (K) {
  'use strict';

  var MISSING = '—';
  var MONEY_UNIT = '€000';
  var QUESTION = 'Which vintage is carrying/leaking the book — and is blended NRR lying?';

  /* Yearly display layers — same buckets as engine.arrMix (base + Y1–Y5). */
  var YEAR_LAYERS = [
    { id: 'base', label: 'm0 · opening', acqFrom: 0, acqTo: 0 },
    { id: 'y1',   label: 'm1–12',        acqFrom: 1, acqTo: 12 },
    { id: 'y2',   label: 'm13–24',       acqFrom: 13, acqTo: 24 },
    { id: 'y3',   label: 'm25–36',       acqFrom: 25, acqTo: 36 },
    { id: 'y4',   label: 'm37–48',       acqFrom: 37, acqTo: 48 },
    { id: 'y5',   label: 'm49–60',       acqFrom: 49, acqTo: 60 }
  ];

  /* Honesty strip vintages: opening + a cohort born every 12 months. */
  var HONESTY_VINTAGES = [0, 12, 24, 36, 48];

  /* 12-month display buckets of existing cohort ages — not a fourth engine band.
     Engine transition bands stay Early / Developing / Mature (0–11 / 12–23 / 24+). */
  var AGE_BUCKETS = [
    { id: '0-11',  label: '0–11',  min: 0,  max: 11 },
    { id: '12-23', label: '12–23', min: 12, max: 23 },
    { id: '24-35', label: '24–35', min: 24, max: 35 },
    { id: '36-47', label: '36–47', min: 36, max: 47 },
    { id: '48-60', label: '48–60', min: 48, max: 60 }
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

  function closingAt(c, t) {
    if (t <= 0) return c.acquisitionMonth === 0 ? c.initialARR : 0;
    var r = K.rowAt(c, t);
    return r ? r.closingARR : 0;
  }

  function groupThousands(n) {
    var s = n < 0 ? '\u2212' : '';
    return s + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatEur000(v) {
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return MISSING;
    return groupThousands(Math.round(v / 1000));
  }

  function formatPct(v, d) {
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return MISSING;
    return (v * 100).toFixed(d === undefined ? 1 : d) + '%';
  }

  /* ------------------------------------------------------------------ *
   * Composition (K2) — yearly vintage stocks over time + birth flows.
   * Stocks are sums of existing cohort.rows[].closingARR, grouped the
   * same way engine.arrMix groups them. Births are months[].newARR.
   * ------------------------------------------------------------------ */
  function compositionSeries(res) {
    var H = res.horizon;
    var layers = YEAR_LAYERS.map(function (L) {
      var arr = [];
      var t, i, c, am, sum;
      for (t = 0; t <= H; t++) {
        sum = 0;
        for (i = 0; i < res.cohorts.length; i++) {
          c = res.cohorts[i];
          am = c.acquisitionMonth;
          if (am < L.acqFrom || am > L.acqTo) continue;
          sum += closingAt(c, t);
        }
        arr.push(sum);
      }
      return { id: L.id, label: L.label, arr: arr };
    });
    var total = [];
    var births = [];
    var t2, s, k;
    for (t2 = 0; t2 <= H; t2++) {
      s = 0;
      for (k = 0; k < layers.length; k++) s += layers[k].arr[t2];
      total.push(s);
      births.push({
        t: t2,
        arr: t2 === 0 ? 0 : res.months[t2 - 1].newARR
      });
    }
    return {
      horizon: H,
      layers: layers,
      total: total,
      births: births,
      openingARR: res.start.openingARR,
      unit: MONEY_UNIT
    };
  }

  /* First complete 12-month window of one acquisition month.
     Same definition as kpi.measureR12M contributions / rateDiagnostics:
     GRR = (opening − leakage) / opening, NRR = closing / opening.
     Birth-month row (opening 0) is skipped for acquired vintages so the
     window is the installed vintage, not the midpoint birth. */
  function vintageFirstWindow(res, acqMonth) {
    var cohorts = res.cohorts.filter(function (c) { return c.acquisitionMonth === acqMonth; });
    if (!cohorts.length) return null;
    var opening = 0, leak = 0, expn = 0, closing = 0, contraction = 0, logoChurn = 0;
    var monthsUsed = 0;
    var logos = logoOn(res);
    cohorts.forEach(function (c) {
      var win, o;
      if (acqMonth === 0) {
        win = c.rows.slice(0, 12);
        o = c.initialARR;
      } else {
        win = c.rows.slice(1, 13);
        o = win.length ? win[0].openingARR : 0;
      }
      if (!win.length || !(o > 0)) return;
      opening += o;
      win.forEach(function (r) {
        leak += r.leakage;
        expn += r.expansion;
        if (logos) {
          contraction += r.contraction || 0;
          logoChurn += r.logoChurn || 0;
        }
      });
      closing += win[win.length - 1].closingARR;
      monthsUsed = Math.max(monthsUsed, win.length);
    });
    if (!(opening > 0)) return null;
    var complete = monthsUsed >= 12;
    return {
      acqMonth: acqMonth,
      complete: complete,
      monthsUsed: monthsUsed,
      openingARR: opening,
      leakage: leak,
      expansion: expn,
      closingARR: closing,
      grr: complete ? (opening - leak) / opening : null,
      nrr: complete ? closing / opening : null,
      expansionRate: complete ? expn / opening : null,
      contractionRate: (complete && logos) ? contraction / opening : null,
      logoChurnRate: (complete && logos) ? logoChurn / opening : null
    };
  }

  function vintageAt(res, acqMonth, t) {
    var cohorts = res.cohorts.filter(function (c) { return c.acquisitionMonth === acqMonth; });
    if (!cohorts.length) return null;
    var initial = 0, current = 0;
    cohorts.forEach(function (c) {
      initial += c.initialARR;
      current += closingAt(c, t);
    });
    return {
      acqMonth: acqMonth,
      initialARR: initial,
      currentARR: current,
      retainedShare: initial > 0 ? current / initial : null
    };
  }

  /* Current R12M window for one acquisition month — the same contribution
     kpi.measureR12M already computed. First-year window is only a fallback
     when the vintage is not yet eligible (born inside the window). */
  function vintageWindowRates(res, acqMonth, T) {
    if (T < 12) return vintageFirstWindow(res, acqMonth);
    var kpi = K.measureR12M(res, T);
    if (!kpi || !kpi.contributions) return vintageFirstWindow(res, acqMonth);
    var hits = kpi.contributions.filter(function (c) { return c.acquisitionMonth === acqMonth; });
    if (!hits.length) return vintageFirstWindow(res, acqMonth);
    var opening = 0, leak = 0, expn = 0, closing = 0;
    hits.forEach(function (c) {
      opening += c.openingARR;
      leak += c.leakage;
      expn += c.expansion;
      closing += c.closingARR;
    });
    if (!(opening > 0)) return vintageFirstWindow(res, acqMonth);
    var logos = logoOn(res);
    var contraction = 0, logoChurn = 0;
    if (logos) {
      var start = kpi.windowStart, t, i, c, r;
      for (i = 0; i < res.cohorts.length; i++) {
        c = res.cohorts[i];
        if (c.acquisitionMonth !== acqMonth) continue;
        for (t = start; t <= T; t++) {
          r = K.rowAt(c, t);
          if (!r) continue;
          contraction += r.contraction || 0;
          logoChurn += r.logoChurn || 0;
        }
      }
    }
    return {
      acqMonth: acqMonth,
      complete: true,
      fromR12M: true,
      monthsUsed: 12,
      openingARR: opening,
      leakage: leak,
      expansion: expn,
      closingARR: closing,
      grr: (opening - leak) / opening,
      nrr: closing / opening,
      expansionRate: expn / opening,
      contractionRate: logos ? contraction / opening : null,
      logoChurnRate: logos ? logoChurn / opening : null
    };
  }

  function verdictOf(share) {
    if (share === null || share === undefined || !isFinite(share)) return null;
    return share >= 1 ? 'carries' : 'leaks';
  }

  /* ------------------------------------------------------------------ *
   * Honesty (K1) — always on. Blended NRR is a warning, not a hero.
   * Carry / leak is retainedShare of that vintage at the horizon (or t).
   * Contraction is the logo-split field; — when the logo bound is off.
   * ------------------------------------------------------------------ */
  function honesty(res, t) {
    var T = t == null ? res.horizon : t;
    if (T < 1) T = 1;
    if (T > res.horizon) T = res.horizon;
    var kpi = T >= 12 ? K.measureR12M(res, T) : null;
    var flat = !!res.bandsAreFlat;
    var logos = logoOn(res);
    var book = T === 0 ? res.start.openingARR : res.months[T - 1].closingARR;
    var vintages = HONESTY_VINTAGES.map(function (m) {
      var first = vintageWindowRates(res, m, T);
      var now = vintageAt(res, m, T);
      if (!now && !first) {
        return {
          month: m, label: 'm' + m, present: false,
          first: null, now: null, verdict: null, shareOfBook: null
        };
      }
      return {
        month: m,
        label: 'm' + m,
        present: true,
        first: first,
        now: now,
        verdict: now ? verdictOf(now.retainedShare) : null,
        shareOfBook: now && book > 0 ? now.currentARR / book : null
      };
    });

    var nrrs = [];
    vintages.forEach(function (v) {
      if (v.first && v.first.nrr != null) nrrs.push(v.first.nrr);
    });
    var spread = 0;
    if (nrrs.length >= 2) {
      spread = Math.max.apply(null, nrrs) - Math.min.apply(null, nrrs);
    }
    var mixHides = !flat && spread > 0.005;

    var warning;
    if (!kpi) {
      warning = 'R12M NRR needs 12 months — blended is ' + MISSING + ' until then.';
    } else if (mixHides) {
      warning = 'Blended NRR ' + formatPct(kpi.nrr) + ' mixes vintages that do not share a rate \u2014 not the hero number.';
    } else if (flat) {
      warning = 'Blended NRR ' + formatPct(kpi.nrr) + ' is the vintage NRR. Tenure is flat \u2014 mix is a no-op, not a cohort story.';
    } else {
      warning = 'Blended NRR ' + formatPct(kpi.nrr) + ' \u2014 vintage NRRs agree; blended is not hiding a mix.';
    }

    return {
      t: T,
      blendedGRR: kpi ? kpi.grr : null,
      blendedNRR: kpi ? kpi.nrr : null,
      blendedExpansion: kpi ? kpi.expansionRate : null,
      contractionRate: (kpi && logos) ? kpi.contractionRate : null,
      logoOn: logos,
      bandsAreFlat: flat,
      mixHides: mixHides,
      nrrSpread: spread,
      vintages: vintages,
      warning: warning,
      logosNote: 'Logos \u2260 ARR. Logo count is a customer stock; ARR is the recurring-state stock.',
      flatNote: flat
        ? 'Flat-law vintage mix is a no-op \u2014 do not claim the stack. Tenure / Scenario 6 give age a rate.'
        : null,
      contractionNote: logos
        ? 'NRR \u2212 GRR = expansion (measured). Contraction is the residual of leakage after logo churn.'
        : 'NRR \u2212 GRR = expansion (measured). Contraction is ' + MISSING + ' while the logo bound is off \u2014 leakage is one number.'
    };
  }

  /* ------------------------------------------------------------------ *
   * Age profile (K3) — horizon (or t) ARR by age, plus GRR/NRR by age
   * from measureR12M.contributions (weighted by opening ARR).
   * ------------------------------------------------------------------ */
  function ageProfile(res, t) {
    var T = t == null ? res.horizon : t;
    if (T < 1) T = 1;
    if (T > res.horizon) T = res.horizon;
    var engineComp = K.ageComposition(res, T);
    var buckets = AGE_BUCKETS.map(function (b) {
      return { id: b.id, label: b.label, arr: 0, share: 0, logos: null };
    });
    var logos = logoOn(res);
    var total = 0;
    res.cohorts.forEach(function (c) {
      var r = K.rowAt(c, T);
      if (!r) return;
      total += r.closingARR;
      var i;
      for (i = 0; i < AGE_BUCKETS.length; i++) {
        if (r.age >= AGE_BUCKETS[i].min && r.age <= AGE_BUCKETS[i].max) {
          buckets[i].arr += r.closingARR;
          if (logos) {
            buckets[i].logos = (buckets[i].logos || 0) + (r.customersClosing || 0);
          }
          break;
        }
      }
    });
    buckets.forEach(function (b) { b.share = total > 0 ? b.arr / total : 0; });

    var kpi = T >= 12 ? K.measureR12M(res, T) : null;
    var rates = AGE_BUCKETS.map(function (b) {
      return { id: b.id, label: b.label, grr: null, nrr: null, gap: null, openingARR: 0 };
    });
    if (kpi && kpi.contributions) {
      kpi.contributions.forEach(function (c) {
        var age = c.ageAtOpening, i;
        for (i = 0; i < AGE_BUCKETS.length; i++) {
          if (age >= AGE_BUCKETS[i].min && age <= AGE_BUCKETS[i].max) {
            rates[i].openingARR += c.openingARR;
            rates[i]._grrN = (rates[i]._grrN || 0) + c.grr * c.openingARR;
            rates[i]._nrrN = (rates[i]._nrrN || 0) + c.nrr * c.openingARR;
            break;
          }
        }
      });
      rates.forEach(function (r) {
        if (r.openingARR > 0) {
          r.grr = r._grrN / r.openingARR;
          r.nrr = r._nrrN / r.openingARR;
          r.gap = r.nrr - r.grr;
        }
        delete r._grrN;
        delete r._nrrN;
      });
    }

    return {
      t: T,
      totalARR: total,
      engineBands: engineComp,
      buckets: buckets,
      rates: rates,
      logoOn: logos,
      bandsAreFlat: !!res.bandsAreFlat,
      ratesAvailable: !!(kpi && kpi.contributions),
      logosNote: logos
        ? 'Bars are ARR. Logo counts are a different stock \u2014 logos \u2260 ARR.'
        : 'Bars are ARR. Logo counts are ' + MISSING + ' while the logo bound is off.'
    };
  }

  function model(res, t) {
    return {
      question: QUESTION,
      unit: MONEY_UNIT,
      composition: compositionSeries(res),
      honesty: honesty(res, t),
      age: ageProfile(res, t)
    };
  }

  return {
    MISSING: MISSING,
    MONEY_UNIT: MONEY_UNIT,
    QUESTION: QUESTION,
    YEAR_LAYERS: YEAR_LAYERS,
    HONESTY_VINTAGES: HONESTY_VINTAGES,
    AGE_BUCKETS: AGE_BUCKETS,
    experimentDiffers: experimentDiffers,
    defaultWorld: defaultWorld,
    compositionSeries: compositionSeries,
    vintageFirstWindow: vintageFirstWindow,
    vintageWindowRates: vintageWindowRates,
    vintageAt: vintageAt,
    honesty: honesty,
    ageProfile: ageProfile,
    model: model,
    formatEur000: formatEur000,
    formatPct: formatPct
  };
});
