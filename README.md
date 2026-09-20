# SaaS Physics — Prototype 0.3

A deterministic monthly economic engine for a SaaS business, plus a deliberately simple
inspection interface. It answers one question:

> **What kind of company does a given set of operating assumptions create over 60 months?**

This is an economic simulation, not a forecast spreadsheet. Outputs emerge from upstream
assumptions: NRR, growth, EBITA margin, burn and cash are all calculated, never entered.
Company ARR is only ever the sum of a portfolio of cohorts.

Not built yet, by design: enterprise value, multiples, 3D, real company data, customer-level
modelling, churn/contraction split, pricing, usage, working capital, debt, tax, capex,
pipeline, headcount, probabilistic simulation, AI commentary. **We are proving the physics first.**

## SaaS Physics v1

| | |
|---|---|
| **Engine version** | v2.0 (in progress on `v2-economic-system`) — the frozen v1.3 ARR physics (`docs/BASELINE-v1.3.md`, `44f7652`) plus the Economic System layers, each nullable, each reproducing the layer below exactly. Gates A (Customer Physics), B (Monetization Physics), C (Cash Physics) and D (Interventions) are in. |
| **Reporting basis default** | **MRR** — a global, persistent MRR ⇄ ARR switch (§2 below) |

`engine.js`, `kpi.js` and `integrity.js` are the economic core: they stay untouched by
convention, not by schedule — a change to any of them is deliberate, reviewed and re-frozen,
never incidental.

**Physics extension v1.1–v1.3 (a deliberate, chartered engine change).** Three mechanisms,
each with a null setting under which the prior world is reproduced *exactly* — the ALL-NULL
release gate replays `baseline-v1.0.json` to €0.00e+0:

| Release | Mechanism | Parameter (null) | What it touches | What it never touches |
|---|---|---|---|---|
| **v1.1 Expansion Economics** | expansion realisation cost | `expansionCostPerARR` (0) | a named P&L line → EBITA, FCF, cash | any ARR quantity, GRR, NRR, the acquisition response |
| **v1.2 Bounded Acquisition** | saturating acquisition response `N = S&M ÷ (CAC + S&M ÷ capacity)`, with average and marginal CAC derived analytically | `maxMonthlyNewARR` (null = linear) | how much New ARR each month of spend creates | existing cohorts' transitions, retention KPIs |
| **v1.3 Acquisition Timing** | S&M at t → explicit pending stock (with the law in force at spend) → cohort at t + L; no cohort exists before maturity; capital is deployed when spent | `acquisitionLagMonths` (0; integer ≥ 0, anything else is rejected) | when ARR appears; the cash path; what is still pending at M60 | how much per euro; retention; the provenance of spend already committed |

Measured results are in the three research notes — [`docs/RN-EXPANSION-ECONOMICS.md`](docs/RN-EXPANSION-ECONOMICS.md),
[`docs/RN-ACQUISITION-SATURATION.md`](docs/RN-ACQUISITION-SATURATION.md),
[`docs/RN-ACQUISITION-TIMING.md`](docs/RN-ACQUISITION-TIMING.md) — and the headline: the matched-NRR pair
(same ARR, same NRR) now ends `c × €13.79m` apart in cash for a cost `c` per €1 of expansion
ARR; at Base spend under a €2.0m/month capacity the average CAC is 1.65× and the marginal
2.27×; a 6-month lag leaves New ARR per euro unchanged and moves the cash trough from €6.10m to
€2.29m. The product gained three controls (Change), the corresponding rows (Observe), Scenarios
7–9 (Compare), spend/pending/creation provenance per cohort (Inspect) and the new causal links on
the System map. `FINDINGS.md` #10, #14 and #17 are reclassified, not deleted; #27–#30 are new.
Regression suites: `node checks.js` (53 — 18 new, named EXP-COST / ACQ-BOUND / ACQ-LAG,
including SPEND-TIME PROVENANCE and the lag-validation check), `node physics-checks.js` (69 —
ALL-NULL-FULL against the complete v1.0 snapshot, NO-PHANTOM-COHORTS, CAPITAL-RECONCILIATION,
SATURATION-INDEPENDENT, CAC-UNITS, SAT+LAG, COST+SAT, ALL-ON, RETENTION-ISO, DETERMINISM,
EXTREMES, SWEEP), `node physics-accept.js` (Playwright, 24), `node physics-study.js` (the
experiments). Vocabulary is canonical (`docs/FINDINGS.md` #27): CAC coefficient, Average CAC,
Marginal CAC, Cohort CAC (realised), Measured CAC · trailing 12; Coefficient / Average /
Marginal / Cohort payback — every CAC per €1 of ARR, in either display basis.

Four passes ran between the v1 product shipping and this extension:

**Integrity + Experiment Attribution pass.** Fixed a real trust defect — the Company chart's
printed Cash and cumulative-leakage figures read a continuously interpolated position while
every other surface (side panel, waterfall, System) read the exact snapped month, so scrubbing
to a non-integer month could show two different Cash numbers on one screen. Both now resolve
through one canonical `selectedMonth()` accessor. Also fixed a colliding Experiment/Base payback
label in the capital-recovery track (merged into one sentence) and an unlabelled "capital out"
figure (renamed to state exactly what it is: unrecovered acquisition capital, cumulative to
date). Added Experiment Attribution: re-running the frozen engine — never a share, percentage or
Shapley value — decomposes a multi-lever Experiment's recurring-state delta into Acquisition (N),
Installed-base law (g) and their Interaction (the residual, by construction), and decomposes its
Cash delta per lever into Stand-alone and Added-last views, which are not forced to sum. Valid
only for flat-band, same-state experiments; explicitly unavailable for Scenario 6's
state-dependent construction. Added dynamic model-boundary disclosure and a coefficient→KPI
interaction note (shown only when the actual measured gap is real). Made the capital-recovery
track contextual — expanded automatically for the Efficiency and Pair scenarios or a pinned
cohort, collapsed elsewhere behind a compact `payback · Base` summary — and relabelled R&D/G&A
from "fixed operating costs, not levers" to **Financial levers** that move FCF and Cash directly.
Confirmed Scenario 6's same-world construction (`LawSet_A=LawSet_B`, `State_A≠State_B`,
`ObservedKPIs_A=ObservedKPIs_B`, `ForwardEconomics_A≠ForwardEconomics_B`) was already an
authoritative, always-run check in `research-checks.js`'s SAME-WORLD block — added the one
missing assertion (`State_A≠State_B`) there rather than duplicating the suite. Regression
suites: `node attribution-checks.js` (pure Node — ATTRIBUTION-TOTAL, ADDED-LAST,
ATTRIBUTION-SCOPE) and `node attribution-accept.js` (Playwright — SCREEN-RECONCILIATION,
BOUNDARY-DISCLOSURE, and the on-screen attribution table).

**MRR-native engine refactor (explicitly requested; a unit change, not new physics).** The
only pass that touched `engine.js` itself. The recurring-revenue state the engine carries and
evolves month to month is now MRR — `Revenue = (OpeningMRR + ClosingMRR) / 2`, no `/12`
anywhere in the transition — and ARR is a DERIVED reporting view, `ARR = 12 × MRR`, exact to
float precision at every month and every cohort row. The acquisition assumption itself
(`cacPerARR`, still 1.20× by default) and every existing field name, transition coefficient,
intra-month order, KPI definition and canonical scenario are unchanged; the new
`derived.cacPerMRR` (14.40×, `= cacPerARR × 12`) is an additive reporting figure only. CAC
payback is unchanged (18.0 months). Verified against a captured pre-refactor baseline (Base
and all six canonical scenarios, at seven checkpoint months): worst absolute divergence
1.5×10⁻⁷ € on cumulative FCF over 60 months — floating-point noise, not an economic change.
Regression suite: `node mrr-native-checks.js` (ARR-EQUALS-12X-MRR, REVENUE-INVARIANCE,
CAC-PAYBACK-INVARIANCE, SCENARIO-INVARIANCE).

**MRR/ARR reporting basis.** One consistent recurring-revenue basis switch (MRR ⇄ ARR)
across Company, System, Scenarios and Inspect, matching the Revenue Portal waterfall. A pure
presentation transformation — `MRR = ARR / 12`, computed and displayed, never rounded before
the transform. Regression suite: `node basis-checks.js` (BASIS-12X, FINANCIAL-INVARIANCE,
SCENARIO-INVARIANCE).

**Clarity & Semantic Precision pass.** Made the existing economics easier to perceive without
implying the model contains more than it does: Company split into two synchronised planes
(recurring-asset MRR/ARR space, and a Cash-only financial-consequence space with an explicit
ΔCash wedge); the leakage shadow defaulted off and, when shown, drawn as a subdued outline
labelled *cumulative historical leakage* rather than a second filled mass; a real monthly
P&L waterfall stepping from Revenue to modeled FCF; the measured R12M GRR/Expansion/NRR shown
directly beneath the Persistence/Expansion coefficients that imply them; an Experiment summary
naming exactly which assumptions changed; an Installed-base net (Expansion − Leakage) regime
readout; an honest R12M decomposition that never invents a churn/contraction split the engine
doesn't have; a corrected color ontology (green reserved for genuinely favourable deltas, New/
Expansion kept in Experiment copper, Leakage in its own muted rose); and quarter-grouped
cohort-strata display (presentation only — Inspect still resolves to one exact month).
Regression suites: `node clarity-checks.js` (pure Node — TWO-PLANE-UNITS, INSTALLED-BASE-NET,
FINANCIAL-WATERFALL, NO-FAKE-MOVEMENTS) and `node clarity-accept.js` (Playwright —
DISPLAY-RECONCILIATION, DELTA-CASH, KPI-MEASUREMENT, BASIS-INVARIANCE, and the full six-viewport
scenario matrix).

All 53 economic integrity checks, 69 physics-extension checks, 21 research checks, 12 MRR/ARR
basis-switch regression checks, 46 clarity regression checks, 20 MRR-native engine-refactor
checks and 22 Integrity + Experiment Attribution checks pass; so do the 15 + 14 + 24 Playwright
acceptance checks.

## The product

**[SaaS Physics v1](saas-physics-v1.html)** — the consolidated CFO instrument.
Four actions: **Observe → Change → Compare → Inspect**.

| Surface | Purpose |
|---|---|
| **Company** | Observe the accumulated recurring economic state and where it came from. |
| **System** | A model audit: the causal topology the engine actually contains, with ⊘ marking the links it does not. |
| **Scenarios** | Nine canonical scenarios. Change one declared assumption against a frozen Base and read the consequence. 7–9 exercise the v1.1–v1.3 mechanisms: same ARR / different economics, linear vs bounded response, same law / later ARR. |
| **Inspect** | Contextual. Click a cohort for its provenance and capital-recovery history. |

A global **MRR ⇄ ARR** switch (default MRR) sets the reporting basis for every recurring-revenue
stock and movement — the stock itself, New/Expansion/Leakage, cohort original/current values —
consistently across all four surfaces, and persists as you move between them. It never touches
Revenue, gross profit, FCF, cash, S&M, acquisition cost or any ratio (GRR, NRR, gross margin,
CAC, CAC payback): those stay on their own basis, labelled as period flows where useful
(`Revenue · this month`).

Controls are grouped by *what kind of thing* they are — management input,
installed-base laws, acquisition efficiency, economic conversion — because they
are not equivalent. R&D and G&A are grouped as Financial levers: they move
modeled FCF and Cash directly, but v1 models no effect from them on
recurring-state dynamics.

There is deliberately no "buy more growth" scenario: acquisition is linear and
unbounded in the null world, and canonising "increase S&M" there would teach a known model
limitation as though it were economic truth. Scenario 8 switches the bound on instead and shows
the response curve — diminishing New ARR, worsening average and marginal CAC — without declaring
where to stop, because the model has no objective function.

## Research archive

The two earlier surfaces are kept inspectable, out of the product's navigation.



**[Visual Prototype 1](saas-physics-visual-1.html)** — the living system. Watch a SaaS company
evolve over 60 months as a mass of cohort strata, change a force and see the future bend away from
its own ghost. Built on the frozen engine; adds no economics.

**[Prototype 0.3 inspection interface](saas-physics-prototype-0.html)** — the instrument. Every
identity, bridge, measurement and integrity check, in numbers.

## Run it

```bash
node checks.js              # 53 economic, measurement and state integrity checks (35 + EXP-COST, ACQ-BOUND, ACQ-LAG)
node physics-checks.js      # v1.1–v1.3: ALL-NULL-FULL gate vs the complete v1.0 snapshot, no-phantom-cohorts, capital reconciliation, independent saturation, cross-mechanism, extremes, S&M sweep
node physics-study.js       # v1.1–v1.3: the three experiments with measured results (quoted in docs/RN-*.md)
node physics-accept.js      # v1.1–v1.3 DOM/render checks — needs playwright
node v2-checks.js           # v2: ALL-NULL-V13 gate vs the complete v1.3 snapshot (12 worlds), then the per-gate law checks (A: reconciliation, logo vs dollar retention, matched world; B: one source of truth, bypass, saturation, mix, decomposition; C: billings/collections/FCF identities, P&L untouched, opening book, steady state; D: lawAt(t) before/during/after, decision-dated cost, provenance at spend, bounds, order, layer targets)
node v2-study.js            # v2: the experiments with measured results (quoted in docs/RN-*-PHYSICS.md)
node v2-accept.js           # v2 DOM/render checks — needs playwright
node mrr-native-checks.js   # MRR-native engine refactor checks (ARR-EQUALS-12X-MRR, REVENUE-INVARIANCE, CAC-PAYBACK-INVARIANCE, SCENARIO-INVARIANCE)
node basis-checks.js        # MRR/ARR reporting-basis regression checks (BASIS-12X, FINANCIAL-INVARIANCE, SCENARIO-INVARIANCE)
node clarity-checks.js      # Clarity pass regression checks (TWO-PLANE-UNITS, INSTALLED-BASE-NET, FINANCIAL-WATERFALL, NO-FAKE-MOVEMENTS)
node clarity-accept.js      # Clarity pass DOM/render checks — needs playwright (DISPLAY-RECONCILIATION, DELTA-CASH, KPI-MEASUREMENT, BASIS-INVARIANCE)
node attribution-checks.js  # Integrity + Attribution pass checks (ATTRIBUTION-TOTAL, ADDED-LAST, ATTRIBUTION-SCOPE)
node attribution-accept.js  # Integrity + Attribution pass DOM/render checks — needs playwright (SCREEN-RECONCILIATION, BOUNDARY-DISCLOSURE)
node research-checks.js     # 19 Phase 0/1 research checks
node research-study.js    # state sufficiency, observability, conditioning, decision gate
node scenarios.js         # Scenarios A–E and the 0.2 / 0.2.1 experiments
node state-sufficiency.js # the v0.3 State Sufficiency Experiment
node capital-study.js     # Capital Loop concept study: payback calibration and experiments
node pulse-study.js       # Flow / Pulse concept study: intra-month law and reconciliation
node build.js             # build all three single-file surfaces
open saas-physics-v1.html
```

No dependencies. The browser UI inlines the same `engine.js` and `integrity.js` the CLI uses.

## Controls

| Class | Assumption | Default |
|---|---|---|
| CONTROL | Monthly S&M investment | €900k |
| CONTROL | Monthly R&D investment | €700k |
| CONTROL | Monthly G&A investment | €350k |
| TRANSITION | CAC coefficient (€ of S&M per €1 of New ARR, low-spend law) | 1.20× |
| TRANSITION | Annual persistence coefficient | 90% (per age band; flat by default) |
| TRANSITION | Annual expansion coefficient | 10% (per age band; flat by default) |
| TRANSITION | Gross margin | 80% |
| TRANSITION (v1.1) | Expansion realisation cost per €1 of expansion ARR | 0 (free) |
| TRANSITION (v1.2) | Acquisition capacity (New ARR per month the response approaches) | off (linear) |
| TRANSITION (v1.3) | Acquisition lag | 0 months |
| TRANSITION (v2 A) | Logo retention (12-month customer survival) | off (no customer layer) |
| TRANSITION (v2 A) | Contraction (12-month revenue shrink among survivors) | 0 |
| POLICY (v2 A) | ARR per new logo | opening ARPA |
| STATE (v2 A) | Opening customers (read only with the layer on) | 1,000 |
| TRANSITION (v2 B) | Monetization: per-customer components (platform fee, usage) with price growth, usage growth and adoption to caps | off (revenue is a carried balance) |
| CONTROL (v2 C) | Billing term (months per invoice), billing timing (advance / arrears), collection delay | off (FCF = EBITA) |
| HYPOTHESIS (v2 D) | Interventions: target law, effect, decision month, lag, duration, one-off and monthly cost | none |
| STATE | Opening ARR | €20.0m |
| STATE | Opening cash | €10.0m |

Illustrative defaults. No real company data is connected.

The flat-law default is the **Homogeneous Control World**, not a "neutral" setting: in it the
cohort strata carry provenance but not differential forward ARR dynamics, and the whole engine
reduces exactly to `ARR(t+1) = g·ARR(t) + N`. Age carries economic meaning only when someone
gives it some.

The simulator is two layers. **Layer A** is the economic engine: its parameters are *transition
coefficients* that govern how cohort ARR evolves. **Layer B** is the KPI measurement engine: it
observes the resulting world and reports CFO-facing metrics over a frozen 12-month cohort. They
are not the same objects — a 90% persistence coefficient measures as **89.56% R12M GRR**, and the
gap is the within-period interaction of decay and expansion, not an error.

Two things are deliberately **not** assumptions. **R12M NRR** emerges as 99.0% from P × (1 + X).
**Coefficient payback** emerges as 18.0 months from `CAC coefficient × 12 ÷ GM` — in v0.1 it was an input, and
inverting it is the main change in 0.2. Acquisition productivity decides how much ARR the spend
creates; gross margin decides how fast that investment is recovered.

## Documents

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the economic architecture and every equation
- [`docs/RESULTS.md`](docs/RESULTS.md) — reconciliation, integrity results and Scenarios A–E
- [`docs/PULSE.md`](docs/PULSE.md) — **Flow as stock and flow**: ARR and Cash as stocks, the
  assumptions as valves, and the two feedbacks the engine does not have drawn as absences — plus
  the record of the Pulse prototype that failed and why
- [`docs/CAPITAL-LOOP.md`](docs/CAPITAL-LOOP.md) — **the capital loop concept study**: capital
  leaves today and returns gradually as a cohort's gross profit, which turns CAC payback from a
  ratio into a measured distance
- [`docs/VISUAL-1.md`](docs/VISUAL-1.md) — the visual model, interaction guide, design rationale,
  and what became clearer (and what is still unresolved) by seeing the engine behave spatially
- [`docs/STATE-SUFFICIENCY.md`](docs/STATE-SUFFICIENCY.md) — **the state sufficiency experiment**:
  two portfolios with the same ARR and the same trailing KPIs whose existing ARR carries 26.5%
  different forward economic content, the mechanism, and the flat-law control that proves maturity
  itself creates nothing
- [`docs/MEASUREMENT.md`](docs/MEASUREMENT.md) — **reality vs measurement**: the two-layer
  architecture, why 90% reads as 89.56%, canonical KPI definitions, inverse calibration, what GRR
  and NRR cannot tell you, and the provenance audit
- [`docs/MATCHED-NRR.md`](docs/MATCHED-NRR.md) — the matched-NRR experiment: two businesses this
  model cannot tell apart, why, and what physics would have to exist for them to diverge
- [`docs/KPI-SUFFICIENCY.md`](docs/KPI-SUFFICIENCY.md) — **When are SaaS KPIs sufficient
  statistics?** The Phase 0/1 research memo: the same-world gate, FIBC-60, the SKSG metric, and
  the finding that the retention ratios carry *no* identifying power while the ARR path carries
  all of it
- [`docs/FINDINGS.md`](docs/FINDINGS.md) — **Where the physics break**: conceptual weaknesses
  this prototype exposed, and what to change next
- [`docs/RN-EXPANSION-ECONOMICS.md`](docs/RN-EXPANSION-ECONOMICS.md),
  [`docs/RN-ACQUISITION-SATURATION.md`](docs/RN-ACQUISITION-SATURATION.md),
  [`docs/RN-ACQUISITION-TIMING.md`](docs/RN-ACQUISITION-TIMING.md) — the three v1.1–v1.3
  research notes (question · new object · null world · invariants · falsification · result ·
  boundary), with measured results
- [`docs/BASELINE-v1.0.md`](docs/BASELINE-v1.0.md), [`docs/BASELINE-v1.3.md`](docs/BASELINE-v1.3.md)
  — the pre- and post-extension frozen baselines (checksums, suites, the re-freeze discipline)
- [`docs/ARCHITECTURE-V2.md`](docs/ARCHITECTURE-V2.md) — **the Economic System architecture**:
  what is primary state, what is derived, what is a law, what is a policy, what is a hypothesis;
  the source-of-truth hierarchy the v2 layers obey
- [`docs/RN-CUSTOMER-PHYSICS.md`](docs/RN-CUSTOMER-PHYSICS.md) — **v2 Gate A**: customers beneath
  the ARR; persistence derived as L(1 − C); the matched-world result (same ARR, GRR, NRR;
  1.41× the customers at 71% of the ARPA)
- [`docs/RN-MONETIZATION-PHYSICS.md`](docs/RN-MONETIZATION-PHYSICS.md) — **v2 Gate B**: revenue
  derived from per-customer components; expansion as price + usage + adoption, bounded by caps;
  the mix alone moves GRR (92.00 / 90.21 / 87.40%); price-only vs usage-only told apart
- [`docs/RN-CASH-PHYSICS.md`](docs/RN-CASH-PHYSICS.md) — **v2 Gate C**: billings, deferred
  revenue, receivables and cash FCF beneath an untouched EBITA; the same P&L under seven cash
  physics; the growth push that funds itself under advance billing and does not under arrears
- [`docs/RN-INTERVENTION-PHYSICS.md`](docs/RN-INTERVENTION-PHYSICS.md) — **v2 Gate D**: hypotheses
  as explicit costed, lagged, temporary objects resolved by lawAt(t); provenance at spend; the
  retention programme against the same company without it

## Model version

v0.3. The one v0.1 equation that was conceptually wrong — gross margin generating ARR — has been
corrected by inverting the acquisition primitive. Everything else that looked weak is still built
as specified and flagged in `FINDINGS.md` rather than quietly patched. The point of the prototype
is to surface weaknesses, not bury them.

Each iteration's default reproduces the previous one exactly — v0.3's flat bands give v0.2.1,
v0.2.1's rename gives v0.2, and v0.2's inverted primitive reproduces v0.1's baseline — so results
stay comparable across all four versions.

The built file keeps the name `saas-physics-prototype-0.html` across iterations so the published
link stays stable; the page header carries the model version.
