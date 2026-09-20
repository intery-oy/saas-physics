# SaaS Physics — Economic System Programme · final build report

Branch `v2-economic-system`, six commits above the frozen v1.3 ARR Physics baseline
(`v1.3-arr-physics` @ `44f7652`). Nothing pushed. Sections follow the programme brief.

## 1. Programme summary

Four gated layers were added beneath the frozen ARR physics, each nullable, each reproducing
the layer below exactly, each with its own module, checks, research note and product surfaces:
Customer Physics (A), Monetization Physics (B), Cash Physics (C), Interventions (D). The
complete v1.3 state replays exactly under every layer's null (737,109 fields, twelve worlds).

## 2. Commits (in order)

| Commit | Content |
|---|---|
| `ed064e8` | foundation — `docs/ARCHITECTURE-V2.md`, `baseline-v1.3-full.json.gz` (full-state witness) |
| `78a4690` | Gate A — `customers.js`, engine dispatch, `customerMeasures`, checks, Scenario 10, RN |
| `34c575f` | Gate B — `monetization.js`, revenue derived from components, `monetizationMeasures`, Scenarios 11–12, RN |
| `766db46` | Gate C — `cash.js`, billings / deferred / receivables / cash FCF, `cashMeasures`, Scenario 13, RN |
| `c1d3f93` | Gate D — `interventions.js`, `lawAt(t)`, cost line, provenance, `interventionMeasures`, Scenario 14, RN |
| `a4ec41d` | final hardening — rail by layer, packs, hierarchical System map, walkthrough, review, BASELINE-v2 |

## 3. Architecture (what is primary, what is derived)

Per `docs/ARCHITECTURE-V2.md`: cohort MRR is the primary stock until Monetization, then derived
from per-customer components; ARPA is always ARR ÷ customers; persistence is an input (ARR
world), derived L(1 − C) (Customers), emergent from the mix (Monetization); revenue is
recognised as v1.3, billings = revenue + Δdeferred, collections = billings shifted, cash FCF =
collections − cash costs; interventions are hypotheses resolved by `lawAt(t)`, never
coefficients. Engine orchestrates; the four layer modules are pure and stateless.

## 4. Gate exits, each proven by a named check

- **A**: ARR reconciles to customer state (A-RECONCILE, 1,890 rows, €0); logo and dollar
  retention distinct (A-DISTINCT); ARPA derived (A-ARPA-DERIVED); null = v1.3 (ALL-NULL-V13);
  provenance (A-PROVENANCE); matched world — same ARR/GRR/NRR, 2,157 / 2,505 / 3,046 customers
  (A-MATCHED-WORLD).
- **B**: one source of truth (B-ONE-SOURCE, €7e-10); generic expansion bypassed (B-BYPASS);
  expansion saturates at caps (B-SATURATION); mix alone moves GRR 92.00 / 90.21 / 87.40%
  (B-MIX-MATCHED); price-only vs usage-only told apart (study B.4).
- **C**: billings / collections / FCF identities every month in six worlds (C-RECONCILE);
  P&L untouched (C-UNTOUCHED); the timing layer creates no money (C-STEADY); same P&L, ending
  cash €30.44m–€79.87m (C-FCF-NE-EBITA).
- **D**: before / during / after (D-LAWAT); decision-dated cost (D-COST); stamped at spend
  (D-PROVENANCE); 15 rejections at the boundary (D-BOUNDS); order, duration, layer targets.

## 5. Null world and the witness

`baseline-v1.3-full.json.gz` (generated from the engine at `44f7652`) is replayed by
ALL-NULL-V13 as the first check of every commit: worst |Δ| €0.00e+0 in every world. The v1.0
witness still replays through `physics-checks.js`.

## 6. Suites

Node: v2-checks 104, checks 53, physics-checks 69, mrr-native 20, basis 12, clarity 46,
attribution 22, research 21. Playwright: v2-accept 46, physics-accept 24, clarity-accept 15,
attribution-accept 14; v2-walkthrough 11 questions, no page errors. 446 checks, all green.

## 7. Research notes and findings

`RN-CUSTOMER-PHYSICS`, `RN-MONETIZATION-PHYSICS`, `RN-CASH-PHYSICS`, `RN-INTERVENTION-PHYSICS`
(question · object · null · invariants · falsification · result · boundary, every figure
printed by `v2-study.js`). FINDINGS #15, #18, #21 resolved, #13 bounded, #31–#42 added.

## 8. Product

Change grouped by layer with restraint; assumption packs; Observe blocks per layer; the
P&L waterfall continues below EBITA and carries the hypothesis cost; Inspect dossiers carry
customers, per-customer revenue, invoicing and hypotheses at spend; Compare via Scenarios
10–14 with on-screen proofs of each premise; the System map is hierarchical with a sub-view
per layer, every valve reading the law in force.

## 9. Practical use

`docs/WALKTHROUGH-V2.md`, regenerated from the product by `node v2-walkthrough.js`.

## 10. Adversarial review

`docs/REVIEW-V2.md`: twelve findings fixed before their gate commits (the staggered-book phase
bug caught by a month-by-month steady-state identity; the source scan whose `indexOf` always
inspected the first occurrence), deliberate limits, six open items.

## 11. Re-freeze

`docs/BASELINE-v2.md`: checksums of the protected core; `integrity.js`, `capital.js`,
`systemstate.js`, `basis.js` byte-identical to v1.3.

## 12. Deliberately not built

Per-customer simulation, heterogeneity and concentration, a pricing taxonomy, price
elasticity, payables / tax / capex / financing / bad debt, mechanisms for why a law moves,
per-layer attribution, a multi-hypothesis editor, valves on the Monetization and Cash sub-views.

## 13. Headline figures

Null world unchanged: M60 ARR €62,926,223.19 · ending cash €59,571,254.64 · trough
€6,100,740.28 (M13). Full system on: every identity every month, worst residual €4.5e-8,
7.8 ms per run.

## 14. Repository state

`v2-economic-system` @ `a4ec41d`, clean working tree, six commits above `44f7652`. Remote
branches: `origin/main` (the older v0.4 line, not the base) and `origin/v1.3-arr-physics` @
`44f7652`. **Nothing pushed**; the frozen v1.3 branch is untouched.
