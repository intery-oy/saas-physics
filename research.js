/*
 * SaaS Physics — PHASE 0/1 RESEARCH MODULE
 * State sufficiency, observability and conditioning.
 *
 * This file adds NO economic physics. Every quantity is derived from the frozen
 * v0.3 engine (engine.js) and the frozen KPI layer (kpi.js). It contains:
 *
 *   §2  the analytical reduction of the HOMOGENEOUS CONTROL WORLD
 *   §3  the same-world predicate for matched-state constructions
 *   §4  FIBC-60, the forward installed-base contribution
 *   §5  SKSG, the SaaS KPI Sufficiency Gap
 *   §6  the observation lenses
 *   §7  the state domain and its exhaustive enumeration
 *   §8  the conditioning machinery
 *
 * Nothing here is a valuation. FIBC-60 is undiscounted gross profit, with no
 * terminal value and no multiple, and it is never called "value" or "quality".
 */
'use strict';

var E = require('./engine.js');
var K = require('./kpi.js');

/* ------------------------------------------------------------------ *
 * §1  THE HOMOGENEOUS CONTROL WORLD
 *
 * The flat-law default is NOT "neutral" — it is a control case with a name.
 * Under it the persistence and expansion laws do not vary with cohort age, so
 * every euro of installed ARR is acted on by the same transition. Cohort
 * vintage remains economically meaningful for PROVENANCE (which spend created
 * which euro, and whether that spend has been recovered), but it is
 * DYNAMICALLY REDUNDANT for forward ARR evolution.
 * ------------------------------------------------------------------ */
var HOMOGENEOUS_CONTROL_WORLD =
  'In the Homogeneous Control World, the cohort strata carry provenance ' +
  'but not differential forward ARR dynamics.';

/* ------------------------------------------------------------------ *
 * §2  MASTER REDUCTION OF THE HOMOGENEOUS WORLD
 *
 *     ARR_{t+1} = g · ARR_t + N
 *
 * with, under the engine's own conventions,
 *
 *     gm = P^(1/12)                     monthly persistence
 *     l  = 1 − gm                       monthly leakage fraction
 *     em = (1+X)^(1/12) − 1             monthly expansion, applied to RETAINED
 *     g  = gm · (1 + em) = (1 − l)(1 + em)
 *     N  = E.newARRPerMonth(a)     // S&M / cacPerARR at the linear default;
 *                                  // saturates when acqSaturationSpend is finite
 *
 * ORDER MATTERS and is taken from the engine, not assumed: existing cohorts
 * leak, the survivors expand, and only then is the new cohort created. That is
 * why expansion multiplies the retained balance and why N is a pure addend
 * rather than being scaled by g.
 *
 * g is an UNDERLYING TRANSITION MULTIPLIER. It is not reported R12M NRR, and
 * the two must never be equated casually: NRR is a Layer-B measurement over a
 * frozen cohort, g is a Layer-A coefficient. They coincide only in the special
 * case noted in MEASUREMENT.md.
 *
 * This is a verified analytical reduction of the existing engine, not a
 * replacement for it.
 * ------------------------------------------------------------------ */
function reduction(assumptions) {
  var a = Object.assign({}, E.DEFAULT_ASSUMPTIONS, assumptions || {});
  var gm = E.toMonthlyPersistence(a.persistenceAnnual);
  var em = E.toMonthlyExpansion(a.expansionCoefficientAnnual);
  var g = gm * (1 + em);
  var N = E.newARRPerMonth(a);
  return {
    monthlyPersistence: gm,
    monthlyLeakageFraction: 1 - gm,
    monthlyExpansion: em,
    g: g,
    N: N,
    /* step and closed forms */
    step: function (arr) { return g * arr + N; },
    closedForm: function (arr0, t) {
      if (Math.abs(g - 1) < 1e-15) return arr0 + N * t;
      return Math.pow(g, t) * arr0 + N * (Math.pow(g, t) - 1) / (g - 1);
    },
    /* iterate the reduction for t months */
    path: function (arr0, t) {
      var out = [arr0], v = arr0;
      for (var i = 1; i <= t; i++) { v = g * v + N; out.push(v); }
      return out;
    }
  };
}

/* Does the reduction reproduce the homogeneous engine's aggregate ARR path? */
function reductionResidual(assumptions, start, horizon) {
  var res = E.run(assumptions, start, horizon);
  var r = reduction(res.assumptions);
  var arr0 = res.months[0].openingARR;
  var worstStep = 0, worstClosed = 0;
  var path = r.path(arr0, res.horizon);
  for (var t = 1; t <= res.horizon; t++) {
    var actual = res.months[t - 1].closingARR;
    worstStep = Math.max(worstStep, Math.abs(path[t] - actual) / actual);
    worstClosed = Math.max(worstClosed, Math.abs(r.closedForm(arr0, t) - actual) / actual);
  }
  return { g: r.g, N: r.N, worstRelIterated: worstStep, worstRelClosedForm: worstClosed, horizon: res.horizon };
}

/* ------------------------------------------------------------------ *
 * §3  SAME-WORLD PREDICATE
 *
 * A matched-state construction is only meaningful if both states inhabit the
 * SAME economic world. Two runs are same-world iff every transition law and
 * every non-state assumption is identical. Age-band laws are compared on their
 * declared coefficients AND on the monthly rates the engine derived from them.
 *
 * Per-portfolio calibration of laws to achieve a KPI match is precisely what
 * this predicate exists to detect and forbid.
 * ------------------------------------------------------------------ */
function lawSignature(res) {
  return JSON.stringify({
    bands: res.bands.map(function (b) {
      return [b.name,
              b.maxAgeExclusive === Infinity ? 'inf' : b.maxAgeExclusive,
              b.persistenceAnnual, b.expansionCoefficientAnnual, b.g, b.e];
    }),
    /* every assumption that is a law or a control, but NOT the state */
    scalars: ['cacPerARR', 'persistenceAnnual', 'expansionCoefficientAnnual',
              'grossMargin', 'sm', 'rd', 'ga'].map(function (k) { return [k, res.assumptions[k]]; })
  });
}
function sameWorld(resA, resB) {
  var sa = lawSignature(resA), sb = lawSignature(resB);
  return { same: sa === sb, signatureA: sa, signatureB: sb };
}

/* ------------------------------------------------------------------ *
 * §4  FIBC-60 — FORWARD INSTALLED-BASE CONTRIBUTION, 60 MONTHS
 *
 *   FIBC60(s) = Σ_{t=1..60} GrossProfit_t of the Time-0 installed base
 *
 * Only cohorts that already exist at T0 are counted. Cohorts acquired after T0
 * are excluded, so the measure is a property of the state s and not of future
 * acquisition policy. The existing transition laws continue to operate; gross
 * margin follows the engine.
 *
 * NOT a valuation: no discounting, no terminal value, no multiple, no future
 * acquisition contribution. Do not call it "value".
 *
 * Computed by direct cohort-level summation using the engine's own rows, not
 * by an aggregate approximation.
 * ------------------------------------------------------------------ */
var FIBC_HORIZON = 60;

function fibc60(res, T0, horizon) {
  var Hf = horizon || FIBC_HORIZON;
  var end = Math.min(res.horizon, T0 + Hf);
  var total = 0, perCohort = [];
  res.cohorts.forEach(function (c) {
    if (c.acquisitionMonth > T0) return;            // acquired after T0 — excluded
    var gp = 0;
    for (var t = T0 + 1; t <= end; t++) {
      var r = K.rowAt(c, t);
      if (r) gp += r.grossProfit;
    }
    total += gp;
    perCohort.push({ id: c.id, acquisitionMonth: c.acquisitionMonth, gp: gp });
  });
  var arrT0 = res.months[T0 - 1].closingARR;
  return {
    T0: T0, months: end - T0, fibc60: total,
    arrAtT0: arrT0,
    perEuroOfARR: arrT0 > 0 ? total / arrT0 : 0,
    cohortsCounted: perCohort.length,
    perCohort: perCohort
  };
}

/* ------------------------------------------------------------------ *
 * §6  OBSERVATION LENSES
 *
 * The reporting lens is exactly what kpi.js already defines — no cleaner
 * observables are invented for the research. At each measurement date T the
 * observer reads:
 *
 *     ARR_T / ARR_T0     the ARR path, normalised (see the scale note below)
 *     R12M GRR_T
 *     R12M expansion_T
 *
 * R12M NRR is reported too but is NOT an independent coordinate: the KPI layer
 * satisfies NRR = GRR + expansion identically, verified to 3.3e-16 by the
 * existing checks. Including it would double-count one constraint.
 *
 * SCALE. The engine is exactly linear in scale: multiplying the opening base
 * and S&M by λ multiplies every ARR, revenue and gross-profit figure by λ and
 * leaves every ratio KPI unchanged. Absolute ARR is therefore always matchable
 * by choosing λ, and carries no information about composition. Normalising the
 * ARR path by ARR_T0 removes exactly that one degree of freedom and keeps the
 * SHAPE of the path, which is informative.
 *
 * WARM-UP. A W-month history of R12M measures ending at T0 requires
 * T0 >= W + 11, because the first R12M measurement needs 12 months behind it.
 * T0 is therefore held FIXED at 47 for every window, so that changing W changes
 * only how much history is disclosed — never how much the state has aged.
 * Letting T0 move with W would confound observation with ageing.
 * ------------------------------------------------------------------ */
var T0_FIXED = 47;
var WINDOWS = [1, 12, 24, 36];        // 1 = the snapshot lens

/* LENSES. 'full' is the reporting lens of §6. The other two exist only to
   attribute the identifying power to one observable or the other in §9, and are
   never used to state a headline result. */
var LENSES = {
  full:  { arrPath: true,  rates: true,  label: 'ARR path + R12M GRR + R12M expansion' },
  rates: { arrPath: false, rates: true,  label: 'R12M GRR + R12M expansion only (no ARR path)' },
  arr:   { arrPath: true,  rates: false, label: 'ARR path only (no retention metrics)' }
};

/* Observations are kept in TWO channels, because they are measured in different
   units and — critically for §8 — carry different measurement error. `arr` is a
   normalised balance; `rates` are reported percentages. A perturbation test must
   be able to loosen one without touching the other. */
function observe(res, T0, W, lens) {
  var L = LENSES[lens || 'full'];
  var arr = [], rates = [], arrT0 = res.months[T0 - 1].closingARR;
  for (var T = T0 - W + 1; T <= T0; T++) {
    var k = K.measureR12M(res, T);
    if (!k) return null;                              // insufficient history
    if (L.arrPath) arr.push(res.months[T - 1].closingARR / arrT0);
    if (L.rates) { rates.push(k.grr); rates.push(k.expansionRate); }
  }
  return { arr: arr, rates: rates };
}

/* Equivalent iff BOTH channels agree within their own tolerance. */
function obsEqual(a, b, tolARR, tolRate) {
  if (!a || !b) return false;
  if (a.arr.length !== b.arr.length || a.rates.length !== b.rates.length) return false;
  var i;
  for (i = 0; i < a.arr.length; i++) if (Math.abs(a.arr[i] - b.arr[i]) > tolARR) return false;
  for (i = 0; i < a.rates.length; i++) if (Math.abs(a.rates[i] - b.rates[i]) > tolRate) return false;
  return true;
}
function obsDistance(a, b) {           /* retained for reporting only */
  if (!a || !b) return Infinity;
  var w = 0, i;
  for (i = 0; i < a.arr.length; i++) w = Math.max(w, Math.abs(a.arr[i] - b.arr[i]));
  for (i = 0; i < a.rates.length; i++) w = Math.max(w, Math.abs(a.rates[i] - b.rates[i]));
  return w;
}

/* ------------------------------------------------------------------ *
 * §7  THE STATE DOMAIN
 *
 * A state must be reachable by the frozen engine, which takes CONSTANT
 * assumptions. The reachable Time-0 states are therefore generated by:
 *
 *   - an opening installed base at month 0, split across a grid of seed ages;
 *   - a constant acquisition rate over the warm-up, which deposits one cohort
 *     per month and so populates the young ages at T0.
 *
 * Acquisition must be permitted, and that is itself a result. With acquisition
 * off, every euro surviving a W-month observation window is necessarily at
 * least W months old at T0, so for W >= 24 the whole base sits in the terminal
 * age band and no hidden composition can exist. The interesting states are only
 * reachable when the company is acquiring.
 *
 * The domain below is finite, exhaustively enumerated, and declared with every
 * result. It is NOT a claim about the space of real SaaS companies.
 * ------------------------------------------------------------------ */
/* WHY THE ACQUISITION PATH MUST BE ALLOWED TO VARY — a structural result.
 *
 * A cohort seeded at month 0 with age a has age a + T0 at T0. With T0 = 47,
 * every directly-seeded euro is therefore at least 47 months old at T0 and sits
 * in the terminal age band. Verified: seeded ages 50, 80 and 120 all give
 * FIBC-60 per euro of 4.778638602 — identical to nine decimals. Once the whole
 * base is in the terminal band, composition carries NO forward difference.
 *
 * So the only Time-0 state that can differ economically is RECENT ACQUISITION:
 * ARR young enough to still face the discriminating band. Under a CONSTANT
 * acquisition rate that mass is pinned by the rate itself, which the ARR path
 * already reveals. The hidden state therefore lives in the SHAPE of the recent
 * acquisition path, and the domain must contain paths that are not constant.
 *
 * The path is segmented into an early phase and a recent 12-month phase. Each
 * segment is an ordinary frozen-engine run; the second is seeded with the exact
 * cohort state the first ended on, which is exact (see the SEGMENTATION check).
 * No new physics: only the existing engine, run in two stages. */
var DOMAIN = {
  seedAges: [0, 12, 24, 36],                   // age at month 0 of the opening base
  mixWeights: [0.35, 0.65],                    // two-point mixes, plus every pure state
  acquisitionEarly:  [0, 0.006, 0.014, 0.025], // months 1 .. T0−12,  New ARR ÷ opening ARR per month
  acquisitionRecent: [0, 0.006, 0.014, 0.025], // months T0−11 .. T0
  recentPhase: 12,
  openingARR: 20000000,                        // scale is irrelevant (see §6) — fixed for readability
  T0: T0_FIXED,
  forwardHorizon: FIBC_HORIZON
};

function enumerateStates(domain) {
  var d = domain || DOMAIN, out = [], ages = d.seedAges;
  var mixes = [];
  ages.forEach(function (a) { mixes.push({ label: 'age ' + a, parts: [{ age: a, w: 1 }] }); });
  for (var i = 0; i < ages.length; i++) {
    for (var j = i + 1; j < ages.length; j++) {
      d.mixWeights.forEach(function (w) {
        mixes.push({ label: Math.round(w * 100) + '% age ' + ages[i] + ' / ' + Math.round((1 - w) * 100) + '% age ' + ages[j],
                     parts: [{ age: ages[i], w: w }, { age: ages[j], w: 1 - w }] });
      });
    }
  }
  mixes.forEach(function (mx) {
    d.acquisitionEarly.forEach(function (r1) {
      d.acquisitionRecent.forEach(function (r2) {
        out.push({ mix: mx, rhoEarly: r1, rhoRecent: r2,
                   label: mx.label + ' | acq ' + (r1 * 100).toFixed(1) + '→' + (r2 * 100).toFixed(1) + '%/mo' });
      });
    });
  });
  return out;
}

/* Take the exact cohort state a run holds at the end of month T. */
function snapshotAt(res, T) {
  var out = [];
  res.cohorts.forEach(function (c) {
    var r = K.rowAt(c, T);
    if (r && r.closingARR > 0) out.push({ arr: r.closingARR, age: r.age });
  });
  return out;
}

/* Run a segment of the frozen engine: given a cohort state, a constant monthly
   New ARR and a length, return the run. S&M is chosen so that
   S&M / cacPerARR = newARR, leaving the acquisition primitive untouched. */
function segment(cohorts, bands, newARR, months) {
  var arr = cohorts.reduce(function (s, c) { return s + c.arr; }, 0);
  return E.run(Object.assign({}, E.DEFAULT_ASSUMPTIONS,
                 { bands: bands, sm: newARR * E.DEFAULT_ASSUMPTIONS.cacPerARR }),
               { openingARR: arr, openingCash: 0, openingCohorts: cohorts }, months);
}

/* Realise one state under a given law set.
 *
 *   phase 1  months 1 .. T0−12      acquisition at rhoEarly
 *   phase 2  months T0−11 .. T0     acquisition at rhoRecent
 *   forward  60 months              acquisition OFF, because FIBC-60 measures
 *                                   the installed base only (§4)
 *
 * The observation history spans both warm-up phases, so it is assembled from
 * the two segments joined at the phase boundary. Each join carries the exact
 * cohort state, which the SEGMENTATION check verifies is lossless. */
function realise(state, bands, domain) {
  var d = domain || DOMAIN;
  var A0 = d.openingARR, rp = d.recentPhase;
  var seed = state.mix.parts.map(function (p) { return { arr: A0 * p.w, age: p.age }; });

  var early = segment(seed, bands, state.rhoEarly * A0, d.T0 - rp);
  var recent = segment(snapshotAt(early, d.T0 - rp), bands, state.rhoRecent * A0, rp);

  /* one continuous month record and one continuous cohort set, for the KPI layer */
  var joined = joinRuns(early, recent, d.T0 - rp);
  var arrT0 = joined.months[d.T0 - 1].closingARR;
  var fwd = segment(snapshotAt(recent, rp), bands, 0, d.forwardHorizon);

  return { state: state, warm: joined, forward: fwd, arrAtT0: arrT0,
           cohortsAtT0: snapshotAt(recent, rp).length };
}

/* Join two consecutive segments into one run object the KPI layer can measure.
 * Cohort rows are re-stamped onto the continuous month index; a cohort carried
 * across the boundary keeps ONE row series, so R12M windows that straddle the
 * boundary see an unbroken history and no future information can leak backwards
 * (the HISTORY check tests exactly this). */
function joinRuns(a, b, split) {
  var months = a.months.concat(b.months.map(function (m) {
    return Object.assign({}, m, { t: m.t + split });
  }));
  var cohorts = [];
  /* cohorts that existed at the split: their rows continue */
  a.cohorts.forEach(function (c) {
    var tail = null;
    /* find the segment-b cohort seeded from this one, by age at the boundary */
    var rowAtSplit = K.rowAt(c, split);
    if (rowAtSplit && rowAtSplit.closingARR > 0) {
      tail = b.cohorts.filter(function (x) {
        return x.acquisitionMonth === 0 && Math.abs(x.initialAge - rowAtSplit.age) < 1e-9 &&
               Math.abs(x.initialARR - rowAtSplit.closingARR) < 1e-6;
      })[0];
    }
    var rows = c.rows.slice();
    if (tail) tail.rows.forEach(function (r) { rows.push(Object.assign({}, r, { t: r.t + split })); });
    cohorts.push(Object.assign({}, c, { rows: rows, live: tail ? tail.live : c.live }));
  });
  /* cohorts acquired inside segment b */
  b.cohorts.forEach(function (c) {
    if (c.acquisitionMonth === 0) return;
    cohorts.push(Object.assign({}, c, {
      acquisitionMonth: c.acquisitionMonth + split,
      rows: c.rows.map(function (r) { return Object.assign({}, r, { t: r.t + split }); })
    }));
  });
  return Object.assign({}, a, { months: months, cohorts: cohorts, horizon: a.horizon + b.horizon });
}

/* FIBC-60 of a realised state. The forward run contains ONLY the T0 base
   (acquisition is off), so its whole gross profit is the installed base's. */
function stateFIBC(realised) {
  var gp = 0, f = realised.forward;
  for (var t = 1; t <= f.horizon; t++) gp += f.months[t - 1].grossProfit;
  return { fibc60: gp, arrAtT0: realised.arrAtT0, perEuroOfARR: gp / realised.arrAtT0 };
}

/* ------------------------------------------------------------------ *
 * §5  SKSG — THE SaaS KPI SUFFICIENCY GAP
 *
 * Among states that look identical through a chosen reporting lens, how
 * different can their forward installed-base economics still be?
 *
 *   I(K,W,L) = { s : Observations_W(s) = K, within tolerance }
 *
 *   SKSG = max_{s_i,s_j ∈ I} |FIBC60(s_i) − FIBC60(s_j)|
 *          ------------------------------------------------
 *              ( FIBC60(s_i) + FIBC60(s_j) ) / 2
 *
 * WHY THIS NORMALISATION. The symmetric (midpoint) denominator is chosen over
 * dividing by either endpoint because it is order-invariant: swapping s_i and
 * s_j cannot change the number, so the metric cannot be inflated by choosing
 * which state to call the baseline. It is bounded above by 2 and is well
 * behaved as long as FIBC-60 is strictly positive, which it is whenever the
 * base has positive ARR and positive gross margin — so the denominator cannot
 * approach zero while the numerator stays finite.
 *
 * States are compared AT MATCHED ARR. Because the engine is exactly linear in
 * scale, every state is rescaled so ARR at T0 is identical; the ratio above is
 * then equivalent to the ratio of FIBC-60 per euro of current ARR.
 *
 * IMPORTANT — THIS IS A SEARCHED MAXIMUM, NOT A THEOREM. The maximisation runs
 * over the finite declared domain in §7. It is a lower bound on the true
 * ambiguity over any larger state space, and it is reported as such. No claim
 * of global maximality is made.
 * ------------------------------------------------------------------ */
function sksgPair(fibcA, fibcB) {
  var mid = (fibcA + fibcB) / 2;
  return mid > 0 ? Math.abs(fibcA - fibcB) / mid : 0;
}

function sksg(realisedStates, W, tol, domain, lens) {
  var d = domain || DOMAIN;
  var tolARR  = (tol && typeof tol === 'object') ? tol.arr  : tol;
  var tolRate = (tol && typeof tol === 'object') ? tol.rate : tol;
  var pts = realisedStates.map(function (r) {
    return { label: r.state.label, obs: observe(r.warm, d.T0, W, lens), fibc: stateFIBC(r).perEuroOfARR };
  }).filter(function (p) { return p.obs; });

  var best = { gap: 0, a: null, b: null }, classes = [], counted = 0;
  for (var i = 0; i < pts.length; i++) {
    for (var j = i + 1; j < pts.length; j++) {
      if (!obsEqual(pts[i].obs, pts[j].obs, tolARR, tolRate)) continue;
      counted++;
      var gap = sksgPair(pts[i].fibc, pts[j].fibc);
      if (gap > best.gap) best = { gap: gap, a: pts[i], b: pts[j] };
    }
  }
  /* equivalence classes, for reporting the dimension of the ambiguity */
  var seen = new Array(pts.length).fill(false);
  for (var p = 0; p < pts.length; p++) {
    if (seen[p]) continue;
    var cls = [pts[p]]; seen[p] = true;
    for (var q = p + 1; q < pts.length; q++) {
      if (!seen[q] && obsEqual(pts[p].obs, pts[q].obs, tolARR, tolRate)) { cls.push(pts[q]); seen[q] = true; }
    }
    classes.push(cls);
  }
  var multi = classes.filter(function (c) { return c.length > 1; });
  return {
    W: W, tolerance: { arr: tolARR, rate: tolRate }, statesSearched: pts.length,
    equivalentPairs: counted,
    classes: classes.length,
    ambiguousClasses: multi.length,
    largestClass: classes.reduce(function (m, c) { return Math.max(m, c.length); }, 0),
    identifiable: multi.length === 0,
    sksg: best.gap, witness: best.gap > 0 ? { a: best.a.label, b: best.b.label,
      fibcA: best.a.fibc, fibcB: best.b.fibc } : null,
    lens: (LENSES[lens || 'full']).label,
    disclosure: {
      kpiSet: (LENSES[lens || 'full']).label + ' — as defined by kpi.js',
      historyWindow: W === 1 ? 'snapshot (single R12M measurement at T0)' : W + ' monthly measurements ending at T0',
      lawSet: 'fixed and identical across every state',
      stateDomain: 'declared finite grid, ' + pts.length + ' states, exhaustively enumerated',
      forwardHorizon: (domain || DOMAIN).forwardHorizon + ' months',
      normalisation: 'symmetric midpoint; states compared at matched ARR'
    }
  };
}

/* ------------------------------------------------------------------ *
 * §8  CONDITIONING
 *
 * Identifiability is not enough. A state can be uniquely determined in exact
 * arithmetic and still be useless in practice if a measurement error the size
 * of a rounding convention admits a wildly different forward economics.
 *
 * The test: widen the observational tolerance from exact to the size of a
 * realistic reporting error (±0.1 percentage point on the reported rates) and
 * re-measure the ambiguity. The AMPLIFICATION is the ratio of the admissible
 * FIBC-60 spread at ±0.1pp to the spread at exact equality.
 *
 * Only the observations are perturbed. The law set, the state domain and the
 * forward horizon are untouched — the CONDITIONING check verifies that.
 * ------------------------------------------------------------------ */
var PERTURBATION = 0.001;                 // 0.1 percentage point on a reported rate
var ARR_PERTURBATION = 0.001;             // 0.1% on the normalised ARR path
var EXACT = 1e-9;

/* Three scenarios, each perturbing exactly one thing, so the result attributes
   the sensitivity to a named observable rather than to "noise" in general. */
function conditioning(realisedStates, W, domain, lens) {
  var exact  = sksg(realisedStates, W, { arr: EXACT, rate: EXACT }, domain, lens);
  var ratesN = sksg(realisedStates, W, { arr: EXACT, rate: PERTURBATION }, domain, lens);
  var arrN   = sksg(realisedStates, W, { arr: ARR_PERTURBATION, rate: EXACT }, domain, lens);
  var bothN  = sksg(realisedStates, W, { arr: ARR_PERTURBATION, rate: PERTURBATION }, domain, lens);
  function amp(x) { return exact.sksg > 1e-12 ? x / exact.sksg : (x > 1e-12 ? Infinity : 1); }
  return {
    W: W,
    ratePerturbationPP: PERTURBATION * 100,
    arrPerturbationPct: ARR_PERTURBATION * 100,
    sksgExact: exact.sksg,
    sksgRatesPerturbed: ratesN.sksg,
    sksgARRPerturbed: arrN.sksg,
    sksgBothPerturbed: bothN.sksg,
    amplificationRates: amp(ratesN.sksg),
    amplificationARR: amp(arrN.sksg),
    classesExact: exact.ambiguousClasses,
    classesRates: ratesN.ambiguousClasses,
    classesARR: arrN.ambiguousClasses,
    witness: bothN.witness
  };
}

module.exports = {
  PERTURBATION: PERTURBATION,
  conditioning: conditioning,
  HOMOGENEOUS_CONTROL_WORLD: HOMOGENEOUS_CONTROL_WORLD,
  reduction: reduction,
  reductionResidual: reductionResidual,
  lawSignature: lawSignature,
  sameWorld: sameWorld,
  FIBC_HORIZON: FIBC_HORIZON,
  fibc60: fibc60,
  T0_FIXED: T0_FIXED,
  WINDOWS: WINDOWS,
  observe: observe,
  LENSES: LENSES,
  obsEqual: obsEqual,
  obsDistance: obsDistance,
  EXACT: EXACT,
  ARR_PERTURBATION: ARR_PERTURBATION,
  DOMAIN: DOMAIN,
  enumerateStates: enumerateStates,
  realise: realise,
  stateFIBC: stateFIBC,
  sksgPair: sksgPair,
  sksg: sksg,
  snapshotAt: snapshotAt,
  segment: segment,
  joinRuns: joinRuns
};
