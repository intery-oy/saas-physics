/*
 * SaaS Physics — recurring-revenue reporting basis (MRR ⇄ ARR).
 *
 * Pure presentation transform. This module is never required by engine.js,
 * kpi.js or integrity.js, and never mutates anything they produce. It only
 * converts an already-computed ARR-denominated number into the basis the
 * user has chosen to read it in. (The engine's own state became MRR-native
 * in a later refactor — see engine.js's header — but it still exposes every
 * field this module reads as ARR, exactly 12x the native MRR value, so
 * nothing here changed.)
 *
 *   MRR = ARR / 12
 *   ARR = MRR × 12
 *
 * No rounding happens inside this transform — display rounding is the
 * caller's job, applied after toBasis.
 *
 * MRR is the v1 default: the engine steps monthly, and New/Expansion/
 * Leakage are monthly state movements, so a monthly reporting basis is the
 * one that matches the simulation's own resolution.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsBasis = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var MONTHS_PER_YEAR = 12;
  var DEFAULT_BASIS = 'MRR';
  var BASES = ['MRR', 'ARR'];

  /* v is an ARR-denominated number exactly as the engine reports it —
     recurring-revenue STATE or a recurring-revenue MOVEMENT. Never pass a
     period financial flow (Revenue/GP/FCF/S&M), a stock like cash, a ratio
     (GRR/NRR/Expansion %/Gross margin/CAC) or an acquisition-cost figure:
     those are not recurring-revenue quantities and this switch must not
     touch them. Callers decide what is eligible; this function only does
     the arithmetic once that choice is made. */
  function toBasis(v, basis) {
    return basis === 'MRR' ? v / MONTHS_PER_YEAR : v;
  }

  return {
    MONTHS_PER_YEAR: MONTHS_PER_YEAR,
    DEFAULT_BASIS: DEFAULT_BASIS,
    BASES: BASES,
    toBasis: toBasis
  };
});
