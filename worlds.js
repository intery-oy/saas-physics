/*
 * SaaS Physics — the law sets used by the Phase 0/1 research, in ONE place.
 *
 * The state-sufficiency study, the research checks and the memo all import from
 * here, so "same world" is enforced by construction: both portfolios of the
 * flagship experiment receive the SAME band array object, not two equal copies.
 *
 * No new physics. These are parameterisations of the frozen v0.3 engine.
 */
'use strict';
var E = require('./engine.js');

/* Two coefficient pairs. A USER ASSUMPTION about a world, never a claimed law
   of SaaS. Band 2 is read as a mid-life renewal / re-contracting window. */
var STABLE = { persistenceAnnual: 0.94, expansionCoefficientAnnual: 0.14 };
var RISKY  = { persistenceAnnual: 0.78, expansionCoefficientAnnual: 0.06 };

function band(name, maxAgeExclusive, c) {
  return { name: name, maxAgeExclusive: maxAgeExclusive,
           persistenceAnnual: c.persistenceAnnual,
           expansionCoefficientAnnual: c.expansionCoefficientAnnual };
}

/* STATE-DEPENDENT WORLD. Non-monotone by construction: bands 1 and 3 share
   coefficients, so a cohort measured in band 1 and one measured in band 3 report
   IDENTICAL KPIs while facing different futures. That non-monotonicity is what
   makes an exact matched construction possible, and it is a scope condition on
   every result that follows — see the memo. */
var PROFILE = [band('Early', 12, STABLE), band('Developing', 24, RISKY), band('Mature', Infinity, STABLE)];

/* HOMOGENEOUS CONTROL WORLD. Age carries no differential forward dynamics. */
var FLAT = [band('Early', 12, STABLE), band('Developing', 24, STABLE), band('Mature', Infinity, STABLE)];

/* Direction control: invert the profile and the ranking must flip, proving the
   model privileges no direction of age. */
var INVERTED = [band('Early', 12, RISKY), band('Developing', 24, STABLE), band('Mature', Infinity, RISKY)];

/* ------------------------------------------------------------------ *
 * The flagship matched construction, in ONE definition.
 *
 *   young   every euro is age 12 at T0 — it has NOT yet crossed band 2
 *   mature  every euro is age 36 at T0 — it crossed band 2 long ago
 *
 * Both receive the SAME PROFILE array. No per-portfolio calibration exists or
 * is possible here.
 * ------------------------------------------------------------------ */
var FLAGSHIP = { T0: 12, forward: 60, openingARR: 20000000, openingCash: 10000000 };

function flagship(which, sm) {
  var seedAge = which === 'young' ? 0 : 24;
  return E.run(
    Object.assign({}, E.DEFAULT_ASSUMPTIONS, { bands: PROFILE, sm: sm === undefined ? 0 : sm }),
    { openingARR: FLAGSHIP.openingARR, openingCash: FLAGSHIP.openingCash,
      openingCohorts: [{ arr: FLAGSHIP.openingARR, age: seedAge }] },
    FLAGSHIP.T0 + FLAGSHIP.forward);
}

/* The same pair under a chosen law set, for the counterfactuals. */
function pairUnder(bands, sm) {
  return [0, 24].map(function (age) {
    return E.run(
      Object.assign({}, E.DEFAULT_ASSUMPTIONS, { bands: bands, sm: sm === undefined ? 0 : sm }),
      { openingARR: FLAGSHIP.openingARR, openingCash: FLAGSHIP.openingCash,
        openingCohorts: [{ arr: FLAGSHIP.openingARR, age: age }] },
      FLAGSHIP.T0 + FLAGSHIP.forward);
  });
}

module.exports = {
  STABLE: STABLE, RISKY: RISKY,
  PROFILE: PROFILE, FLAT: FLAT, INVERTED: INVERTED,
  FLAGSHIP: FLAGSHIP, flagship: flagship, pairUnder: pairUnder
};
