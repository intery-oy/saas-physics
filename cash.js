/*
 * SaaS Physics v2 — CASH PHYSICS (Gate C). Pure billing and collection functions.
 *
 * Through Gate B, cash moved with EBITA: FCF = EBITA (FINDINGS #15). Cash
 * Physics separates three things the P&L does not distinguish:
 *
 *   revenue      recognised monthly, exactly as before (midpoint MRR) — unchanged
 *   billings     what is invoiced: revenue + Δ deferred revenue, BY CONSTRUCTION
 *   collections  billings shifted by the collection delay; the gap is receivables
 *
 *   cash FCF = collections − cash costs = EBITA + Δdeferred − Δreceivables
 *
 * Costs are cash when incurred (COGS, S&M, R&D, G&A, expansion cost) — no
 * payables. EBITA is untouched by this layer; only the cash path changes.
 *
 * BILLING UNITS. A cohort is billed through units { share, phase, deferred }:
 *   advance  — at the start of each T-month period the unit is invoiced the
 *              period's run-rate, T × MRR, TRUED UP for whatever the previous
 *              period left in deferred (expansion recognised beyond what was
 *              billed sits as negative deferred — an unbilled contract asset —
 *              until the next invoice); between invoices deferred falls by
 *              the revenue recognised.
 *   arrears  — revenue accrues as a contract asset (negative deferred) and is
 *              invoiced at the end of each period.
 * An acquisition cohort has ONE unit anchored at its birth. The opening base
 * has T units with staggered phases — a book of contracts whose renewal dates
 * are spread evenly over the term — and starts with the deferred balance (or
 * contract asset) such a book carries: MRR × (T − 1) / 2. That opening
 * balance is DERIVED state, reported, never an input.
 *
 * This module keeps no state and knows nothing about revenue recognition or
 * the P&L. The engine passes a cohort's units, run-rate and recognised revenue
 * in and takes the billings and the new balances out.
 */
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaaSPhysicsCash = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  function enabled(a) { return a.billingTermMonths !== null && a.billingTermMonths !== undefined; }

  function validate(a) {
    var T = a.billingTermMonths, tm = a.billingTiming, d = a.collectionDelayMonths;
    if (T === undefined) a.billingTermMonths = null;
    else if (T !== null && (typeof T !== 'number' || !isFinite(T) || T < 1 || Math.floor(T) !== T))
      throw new RangeError('billingTermMonths must be null (Cash Physics off) or an integer >= 1 (got ' + String(T) + ')');
    if (tm === undefined) a.billingTiming = 'advance';
    else if (tm !== 'advance' && tm !== 'arrears')
      throw new RangeError('billingTiming must be "advance" or "arrears" (got ' + String(tm) + ')');
    if (d === undefined) a.collectionDelayMonths = 0;
    else if (typeof d !== 'number' || !isFinite(d) || d < 0 || Math.floor(d) !== d)
      throw new RangeError('collectionDelayMonths must be an integer >= 0 (got ' + String(d) + ')');
    if (!enabled(a) && a.collectionDelayMonths > 0)
      throw new RangeError('collectionDelayMonths needs a billing term (billingTermMonths: 1 bills monthly); with Cash Physics off cash moves with EBITA');
    return a;
  }

  /* Billing units for a cohort. An acquisition cohort: one unit, phase 0
     (invoiced in its birth month under advance billing). The opening base:
     T staggered units, each already inside a period, carrying the deferred
     (advance, +) or accrued (arrears, −) balance of that position. */
  function unitsFor(T, timing, openingMRR, staggered) {
    if (!staggered) return [{ share: 1, phase: 0, deferred: 0 }];
    var out = [];
    for (var k = 0; k < T; k++) {
      /* bill() invoices unit k under advance billing in the months where
         (age + k) % T == 0, i.e. first in month T + 1 − k (k > 0) or month 1
         (k = 0): it has T − k months of its current period still deferred.
         Under arrears its period ends where (age + k + 1) % T == 0, i.e. in
         month T − k (k > 0) or month T (k = 0): it has accrued k months
         unbilled. Either way the book's total is MRR × (T − 1) / 2. */
      var def = timing === 'advance' ? (k === 0 ? 0 : T - k) * openingMRR / T : -(k * openingMRR / T);
      out.push({ share: 1 / T, phase: k, deferred: def });
    }
    return out;
  }
  function openingBalance(T, timing, openingMRR) {
    var v = openingMRR * (T - 1) / 2;
    return timing === 'advance' ? v : -v;
  }

  /* One cohort, one month. age = months since the cohort's anchor (0 in the
     birth month); runRate = the MRR the period is invoiced at; revenue = what
     this month recognised. Mutates unit.deferred; returns the month's flows. */
  function bill(units, T, timing, age, runRate, revenue) {
    var billings = 0, deferred = 0;
    for (var i = 0; i < units.length; i++) {
      var u = units[i], rev = revenue * u.share, inv = 0;
      if (timing === 'advance') {
        if ((age + u.phase) % T === 0) { inv = T * runRate * u.share - u.deferred; u.deferred += inv; }
        u.deferred -= rev;
      } else {
        u.deferred -= rev;
        if ((age + u.phase + 1) % T === 0) { inv = -u.deferred; u.deferred = 0; }
      }
      billings += inv; deferred += u.deferred;
    }
    return { billings: billings, deferred: deferred };
  }

  /* Company receivables: a FIFO of billings awaiting collection. */
  function collect(queue, billings, delay) {
    queue.push(billings);
    var collected = queue.length > delay ? queue.shift() : 0;
    var receivables = 0; for (var i = 0; i < queue.length; i++) receivables += queue[i];
    return { collections: collected, receivables: receivables };
  }

  return { enabled: enabled, validate: validate, unitsFor: unitsFor, openingBalance: openingBalance, bill: bill, collect: collect };
});
