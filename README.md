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
| **Engine version** | v0.4 (`engine.js` — A1 acquisition saturation, null default = v0.3 linear generator; `kpi.js` untouched) |
| **Reporting basis default** | **MRR** — a global, persistent MRR ⇄ ARR switch (§2 below) |

`kpi.js` and `integrity.js` are the economic core: they stay untouched by convention, not by
schedule — a change to either is deliberate and reviewed, never incidental. `engine.js` follows
the same discipline with one recorded exception below. Four passes have run since v1 shipped:

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

All economic integrity checks (35 prior + 9 NL / Finding 10), 19 research checks, 12 MRR/ARR basis-switch regression
checks, 46 clarity regression checks, 20 MRR-native engine-refactor checks and 22 Integrity +
Experiment Attribution checks pass.

## The product

**[SaaS Physics v1](saas-physics-v1.html)** — the consolidated CFO instrument.
Four actions: **Observe → Change → Compare → Inspect**.

| Surface | Purpose |
|---|---|
| **Company** | Observe the accumulated recurring economic state and where it came from. |
| **System** | A model audit: the causal topology the engine actually contains, with ⊘ marking the links it does not. |
| **Scenarios** | Six canonical scenarios. Change one declared assumption against a frozen Base and read the consequence. |
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

There is still no "buy more growth" scenario. Acquisition is linear at the
default (`acqSaturationSpend` off). A saturation spend on the Forces rail is
the v0.4 bound that lets the model say *stop*; demo it there, not as a seventh
canonical scenario.

## Research archive

The two earlier surfaces are kept inspectable, out of the product's navigation.



**[Visual Prototype 1](saas-physics-visual-1.html)** — the living system. Watch a SaaS company
evolve over 60 months as a mass of cohort strata, change a force and see the future bend away from
its own ghost. Built on the frozen engine; adds no economics.

**[Prototype 0.3 inspection interface](saas-physics-prototype-0.html)** — the instrument. Every
identity, bridge, measurement and integrity check, in numbers.

## Run it

```bash
node checks.js              # 48 economic, measurement, state, NL and OPEN integrity checks
node opening-checks.js      # B1+B2 opening-state UI + inverse-calibration contract
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
| TRANSITION | CAC / New ARR | 1.20× (small-spend / linear) |
| TRANSITION | Saturation spend | off (null) — finite `k` saturates New ARR |
| TRANSITION | Annual persistence coefficient | 90% (per age band; flat by default) |
| TRANSITION | Annual expansion coefficient | 10% (per age band; flat by default) |
| TRANSITION | Gross margin | 80% |
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
**CAC payback** emerges as 18.0 months from `CAC/New ARR × 12 ÷ GM` — in v0.1 it was an input, and
inverting it is the main change in 0.2. Acquisition productivity decides how much ARR the spend
creates; gross margin decides how fast that investment is recovered.

## Documents

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — owner-facing demo review (maturity, gaps, overnight build pick)
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

## Model version

v0.4. Acquisition may saturate in S&M (`acqSaturationSpend`). The default is null, so the
shipped world is exactly v0.3. The one v0.1 equation that was conceptually wrong — gross margin
generating ARR — was corrected in v0.2 by inverting the acquisition primitive. Everything else
that looked weak is still built as specified and flagged in `FINDINGS.md` rather than quietly
patched. The point of the prototype is to surface weaknesses, not bury them.

Each iteration's default reproduces the previous one exactly — v0.4's null saturation gives v0.3,
v0.3's flat bands give v0.2.1, v0.2.1's rename gives v0.2, and v0.2's inverted primitive
reproduces v0.1's baseline — so results stay comparable across versions.

The built file keeps the name `saas-physics-prototype-0.html` across iterations so the published
link stays stable; the page header carries the model version.
