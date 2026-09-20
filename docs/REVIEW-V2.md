# SaaS Physics v2 — adversarial review of the Economic System programme

Reviewed at the end of the programme, against the branch `v2-economic-system` (five commits on
top of the frozen `v1.3-arr-physics` @ `44f7652`). Method: the constitution's questions
(determinism, null reproduces the prior world, no silent improvement, bounds before benefits,
observability), the identities of every layer run with every layer on, the extreme worlds, and
every product surface driven through Playwright. Findings are listed with what was done.

## A. Found during the programme and fixed before the gate commit

| # | Where | Finding | Fix | Proof |
|---|---|---|---|---|
| 1 | Gate A engine | The realisation row recorded new customers as negative logo churn (`logoChurn = opening − closing` with opening 0) | `customerRow` carries `newCustomers`; logo churn = opening + new − closing | A-RECONCILE (1,890 rows, €0) |
| 2 | Gate A engine | A loop scalar `cr` shadowed the customer-rates object; `derived.customers` printed `undefined` | rates object renamed `cuR` | A-ON |
| 3 | Gate B product | The persistence valve printed `0.0%` under Monetization (`pct(null)`), and the "stock sets its own rates" sentence quoted the unread coefficient | valve reads "emergent"; the sentence reads the run's derived rates or the customer laws | v2-accept B · SYSTEM |
| 4 | Gate B product | Single-lever attribution variants threw at the engine boundary (a lone `monetization` on a Base without customers; a component present on one side only) and crashed the surface | bundle rule (monetization ↔ customer layer), `compare()` emits component objects, invalid variants dropped, `MO.validate` rejects non-objects | v2-accept, no page errors |
| 5 | Gate C engine | **Staggered opening-book units carried the right total and the wrong per-unit balances** (phase k held k/T of MRR where it should hold (T − k)/T): Σ billings over 12 months was exact while monthly billings were wrong | `unitsFor` assigns (T − k)/T (advance) and −k/T (arrears) | C-STEADY month by month (fcf = ebita on a flat book, €4.7e-10); FINDINGS #38 |
| 6 | Gate C product | The `Cumulative FCF` consequence row was renamed conditionally and broke the basis-invariance source scan | row kept verbatim; a separate `Cumulative EBITA` row under Cash | basis-checks 12/12 |
| 7 | Gate D product | Control ids with brackets/dots (`t-interventions[0].target`) are not valid CSS selectors; the page failed to initialise | attribute selectors `[id="…"]` in the template and the acceptance suite | v2-accept loads |
| 8 | Gate D product | The Observe hypothesis row printed `decided Mundefined` (fields missing from `interventionMeasures`) | `startMonth`, `lagMonths`, `effectiveFrom`, `effectiveTo` added | v2-accept D · OBSERVE |
| 9 | Gate D product | System-map valves showed the base setting while a hypothesis had moved the law | every valve reads the law in force this month (`lv(key)`) | screenshot; D · SYSTEM |
| 10 | Final product | Layer predicates read `expRes` before the first run and threw at initialisation | predicates guard on `expRes` | v2-accept FINAL |
| 11 | clarity-checks | The NO-FAKE-MOVEMENTS scan used `indexOf(match)` and therefore always inspected the first occurrence's context — every mention passed against the same window | scan iterates real match positions; allow-list extended to the layers that now produce churn/contraction | 46/46, with 76 contexts actually checked |
| 12 | v2-checks | Three expectation errors in my own checks (true-up sign, trough direction, float equality of `900000 × 1.1`) | expectations corrected, tolerance comparisons | 104/104 |

Items 5 and 11 are the ones that matter: a totals-only check and a scan with a hidden bug
both passed while the thing they guarded was wrong. Both are now checked at the granularity
where the error lived.

## B. Deliberate limits, recorded (not defects)

- **Persistence changes owner twice.** Input (ARR world) → derived L(1 − C) (Customers) →
  emergent from the mix (Monetization). The engine reports the source on every run; the
  product changes what the slider and the valve say. A reader who does not read the label will
  be misled; the label is always present (FINDINGS #31, #34).
- **Order-dependent attribution of survivor revenue change** to contraction / price / usage /
  adoption (FINDINGS #35). The identity is order-free; the split is not.
- **The opening book's deferred balance is a convention** (uniform stagger, `MRR × (T − 1)/2`),
  reported as derived state (FINDINGS #37). An opening-state adapter would replace it.
- **Costs are cash when incurred.** No payables, prepaid, tax, capex, financing, bad debt.
- **A hypothesis cannot switch a layer on or change the billing policy**, and the model has no
  mechanism for why a law moves or whether it will (FINDINGS #41).
- **Homogeneity within a cohort** everywhere: one ARPA (A), one per-customer state (B), one
  billing cycle (C). No heterogeneity or concentration.
- **Canonical scenarios run from the v1.3 Base** even when a pack has changed the world; packs
  are assumptions only. Stated on the rail.

## C. Open items for the next programme

1. **One hypothesis slot in the product.** The engine takes any number of interventions (the
   final probe runs two); the Change rail edits one. A list editor is UI work, not physics.
2. **No valves on the Monetization and Cash sub-views.** The law chips are keyed on flat
   assumption names; nested component leaves and the billing policy have no chip. The
   sub-views show the laws as labels.
3. **`Object.freeze(packA)` is shallow.** Nested spec objects are never mutated in place
   (`setK` deep-copies), so this is a discipline, not a guarantee.
4. **Attribution groups.** Customer, monetization and cash levers are folded into the
   installed-base group (or, for cash, appear only in the per-lever cash attribution); a
   per-layer attribution would be its own study.
5. **Performance** is fine (7.8 ms per full-system run; the rail re-runs the engine plus the
   attribution variants on every slider move) but the cash queue and the per-cohort billing
   units are O(cohorts × units); a 10-year horizon with monthly billing would be the first
   thing to profile.
6. **Bands remain the ARR-only path's mechanism**; the customer laws are flat. Age-dependent
   logo retention is the obvious next Customer Physics object.

## D. Verdict

Every gate's exit criterion is met by a named check, the complete v1.3 state replays exactly
under every layer's null (737,109 fields, twelve worlds), every identity of every layer holds
with every layer and every v1.x mechanism on at once (worst residual €4.5e-8), and every
product surface is exercised without a page error. Nothing has been pushed.
