# Economic architecture — SaaS Physics v1.3 (model v1.3)

> **v1.1 → v1.3.** Three nullable mechanisms on top of the v0.3 cohort physics, one per release,
> each admitted under the development constitution below (a blocked CFO question, one minimum
> mechanism, a null setting that reproduces the previous version exactly, a named check, a link
> on the System Map). **v1.1 Expansion Economics** — `expansionCostPerARR`, a cost line on
> expansion ARR that reaches EBITA/FCF/cash and never the ARR transition. **v1.2 Bounded
> Acquisition** — `maxMonthlyNewARR`, a saturating acquisition response with `cacPerARR` kept as
> the low-spend primitive; a bound, not a benefit. **v1.3 Acquisition Timing** —
> `acquisitionLagMonths`, S&M spent at t becomes a cohort at t + L through an explicit pending
> stock. With all three at null the engine reproduces the v1.0 world exactly
> (`physics-checks.js` ALL-NULL against `baseline-v1.0.json`). Equations in §"v1.1–v1.3
> mechanisms" below; measured results in `RN-EXPANSION-ECONOMICS.md`,
> `RN-ACQUISITION-SATURATION.md`, `RN-ACQUISITION-TIMING.md`.

> **v0.3.** One new state dimension: **cohort maturity**. Transition coefficients may vary by the
> age band a cohort occupies (0–11, 12–23, 24+ months), giving six transition parameters. The
> shipped default is **flat** — every band inherits the scalar coefficients — so the default world
> is exactly v0.2.1 and age carries no economic meaning until a user gives it some. Cohorts also
> carry acquisition-cost provenance, stamped at creation and never read by any forward transition.

> **v0.2.1.** The simulator is now explicitly two layers: this document describes **Layer A, the
> economic / state-transition engine**. The KPI measurement layer is documented separately in
> [`MEASUREMENT.md`](MEASUREMENT.md). The parameters below are TRANSITION COEFFICIENTS, not the
> CFO-reported KPIs of similar name.

> **v0.1 → v0.2.** The acquisition primitive is inverted: CAC per €1 of New ARR is now the
> input and CAC payback is an output. Nothing else about the engine changed. `cacPerARR = 1.20`
> with GM 80% reproduces the v0.1 baseline exactly (`payback × GM / 12 = 18 × 0.80 / 12 = 1.20`),
> so every Prototype 0 number is preserved.

## Shape of the system

```
CONTROL (S&M, R&D, G&A)  ─┐
RATE (CAC, GM)           ─┴─► acquisition response ──► [capacity bound] ──► [pending, lag L] ──► new cohort at t + L
                                                                                                   │
RATE (persistence, expansion) ───────────────────────────────────────────────────────────► cohort ageing
                                                                                                   │
                                                                                 Σ cohorts ──► ARR (STATE)
                                                                                                   │
                                                                                        midpoint ──► Revenue (FLOW)
                                                                                                   ├─► Gross profit ──► [− expansion realisation cost] ──► EBITA ──► FCF ──► Cash (STATE)
                                                                                                   └─► NRR, growth, EBITA margin (emergent)
```

Bracketed elements are the v1.1–v1.3 mechanisms; each is absent at its null setting. Nothing
downstream is an input. NRR, growth, EBITA margin, burn and cash are all read off the
simulation; the only things a user can set are three management controls, four transition
coefficients, and the three nullable mechanism parameters.

## Time

60 monthly periods. The whole future is recomputed from month 1 on every assumption change —
there is no incremental update path, which is what makes Base and Experiment provably
comparable.

## The company is a portfolio of cohorts

There is no aggregate ARR variable that is maintained separately. Opening ARR (€20.0m) enters
as a single `base` cohort; every simulated month creates one acquisition cohort. Company ARR
is defined as the sum of cohort balances and nothing else — integrity check 2 asserts this to
floating point on all 60 months, and check 2b asserts the same for revenue.

Each cohort stores, per month: acquisition month, age, initial ARR, opening ARR, retained ARR,
leakage, expansion, closing ARR, and running cumulative revenue and gross profit.

## ARR physics

Rates convert geometrically so that twelve monthly steps reproduce the stated annual figure
exactly:

```
monthly GRR       = annual GRR ^ (1/12)
monthly expansion = (1 + annual expansion) ^ (1/12) − 1
```

Per cohort, per month:

```
retained  = opening × monthly GRR
leakage   = opening − retained          (churn and contraction combined; reactivation = 0)
expansion = retained × monthly expansion   (expansion applies to RETAINED ARR)
closing   = retained + expansion
```

The new acquisition cohort is added after the existing base has aged, so it neither churns nor
expands in its birth month.

Company identity, asserted every month:

```
Closing ARR = Opening ARR + New ARR + Expansion − Leakage
```

## Acquisition (v0.2)

The primitive is **acquisition productivity** — a dimensionless ratio:

```
cacPerARR = acquisition spend ÷ New ARR generated
```

New ARR is generated from spend and productivity alone:

```
New ARR per year of spend = Monthly S&M × 12 ÷ cacPerARR
New ARR added per month   = Monthly S&M ÷ cacPerARR
```

**Units.** `sm` is €/month, `cacPerARR` is dimensionless, so `newARRPerMonth` is € of ARR (an
annualised run-rate quantity) added to the ARR stock each month — the same interpretation the v0.1
engine used, which is why every downstream identity, cohort rule and reconciliation is untouched.
Worked example from the brief: €500k/month at 1.5× → €500k × 12 ÷ 1.5 = **€4.0m of New ARR per
year of spend**, i.e. €333k added to the stock each month.

**Gross margin does not appear.** That is the point of v0.2. CAC payback becomes an output:

```
CAC payback = cacPerARR × 12 ÷ Gross margin
```

Derivation: the cost of €1 of New ARR is `cacPerARR`; the monthly gross profit that €1 of ARR
throws off is `GM / 12`; so recovery takes `cacPerARR ÷ (GM / 12)` months. At 1.00× and GM 80%
that is 15.0 months; at the 1.20× default and GM 80%, 18.0 months.

So: **acquisition productivity determines how much ARR the spend creates; gross margin determines
how fast that investment is economically recovered.** Integrity check A1 asserts structurally that
neither `cacPayback` nor `grossMargin` appears anywhere in the New ARR generator.

Still linear, instantaneous and unbounded in S&M — no sales capacity, rep ramp, pipeline,
conversion, diminishing returns or acquisition delay. The interface states the formula on screen
next to the controls that drive it.

## Stock to flow

```
average ARR     = (opening ARR + closing ARR) / 2
monthly revenue = average ARR / 12
gross profit    = revenue × GM
COGS            = revenue × (1 − GM)
EBITA           = gross profit − S&M − R&D − G&A
FCF             = EBITA                       ← v0.1 simplification, disclosed in the UI
cash closing    = cash opening + FCF
```

The midpoint rule is applied per cohort as well as company-wide, which is why the two
reconcile exactly: a birth-month cohort contributes `(0 + New ARR) / 2 ÷ 12`.

## NRR

Computed from the eligible opening installed base only, with New ARR excluded by construction:

```
monthly NRR    = (retained + expansion) / opening ARR
annualised NRR = product of the trailing 12 monthly NRRs, annualised
```

At constant rates this resolves to `GRR × (1 + expansion)` — 99.0% at the defaults — which is
asserted as check 6 rather than assumed. Check 5 proves the exclusion empirically: multiplying
S&M by 10 leaves the NRR series bit-identical.

### Rate conversion — a documented subtlety

Twelve compounded monthly steps reproduce the intended annual NRR **exactly**
(`mGRR¹² × (1+mExp)¹² = GRR × (1+expansion)`). The **decomposition** does not survive the
conversion. Measured the way a finance team would — flows over the first twelve months of the
opening cohort ÷ its opening ARR — the defaults produce:

| | Input | Realised | Gap |
|---|---|---|---|
| Gross retention | 90.00% | 89.56% | −0.44pp |
| Expansion | 10.00% | 9.44% | −0.56pp |
| **NRR** | **99.00%** | **99.00%** | **exact** |

Both flows accrue on a base that moves during the year, and expansion accrues on the *post-churn*
base. The two errors offset exactly, so NRR is right while each reported component is slightly
understated. `E.rateDiagnostics()` computes all of this and the interface displays it under the
ARR anatomy, rather than leaving it as an unstated assumption.

## v1.1–v1.3 mechanisms — exact forms

### v1.1 Expansion realisation cost

```
expansionCost (cohort, month) = expansionARR (cohort, month) × expansionCostPerARR
expansionCost (company)       = Σ cohorts
EBITA                         = grossProfit − S&M − R&D − G&A − expansionCost
```

Computed after a cohort's closing balance is fixed and read by nothing in the transition.
Carried as its own P&L line (`months[].expansionCost`, `cohort.rows[].expansionCost`,
cumulatives); not classified as COGS, S&M or CSM. Null: `expansionCostPerARR = 0`.

### v1.2 Bounded acquisition

```
N(S&M) = S&M ÷ (cacPerARR + S&M ÷ maxMonthlyNewARR)        bound on
N(S&M) = S&M ÷ cacPerARR                                    bound off (null / non-finite capacity)

average CAC  = S&M ÷ N = cacPerARR + S&M ÷ capacity
dN/dS&M      = cacPerARR ÷ (cacPerARR + S&M ÷ capacity)²
marginal CAC = 1 ÷ (dN/dS&M)
utilisation  = N ÷ capacity
payback      = CAC × 12 ÷ GM        (coefficient, average or marginal CAC)
```

`E.acquisitionResponse(a, sm)` returns all of these analytically. A cohort stamps
`cacPerARRAtCreation` = realised cost per €1 (= average CAC at spend) and
`cacCoefficientAtCreation` / `capacityAtSpend` from its pending entry;
`acquisitionCost = initialARR × cacPerARRAtCreation` still holds. A finite capacity of 0 is not
"off": it yields N = 0 with S&M still spent. Null: `maxMonthlyNewARR = null` (±Infinity is
canonicalised to null; negative or NaN is rejected).

Vocabulary: **CAC coefficient** (`cacPerARR`), **Average CAC**, **Marginal CAC**, **Cohort
CAC (realised)**, **Measured CAC · trailing 12**; **Coefficient / Average / Marginal
payback**, **Cohort payback**. See `FINDINGS.md` #27.

### v1.3 Acquisition timing

```
month t:
  age existing cohorts (leak, then expand)                                  unchanged
  spend:   ledger ← pendingEntry(a, t, L, N(S&M))                            S&M expensed now
           = { spendMonth t, matureMonth t+L, lagMonths L, sm, newARR,
               cacPerARRAtSpend, maxMonthlyNewARRAtSpend (null = bound off) }
  realise: entries with matureMonth = t → realiseCohort(t, entries, band, GM) after ageing
           NO entry matured → NO cohort this month (no zero-ARR placeholder)
  closing = retained + expansion + realised New ARR
```

`realiseCohort` takes no assumption object: `acquisitionCost`, `initialARR`,
`cacCoefficientAtCreation`, `capacityAtSpend`, `spendMonth`, `lagMonths` are all read from the
entries, so the provenance of committed spend is fixed at spend and cannot be rewritten by later
assumptions (integrity check "SPEND-TIME PROVENANCE" proves it on a synthetic entry). The cohort
count is realised cohorts only; a cohort's age starts at its realisation month.

State returned: `months[].pendingNewARR / pendingSpend / pendingCount / cohortCreated /
acquisitionLawNewARR / realisedFromSpendMonth`, `res.acquisitionLedger`, `res.pendingAtHorizon`.
Spend maturing beyond the horizon stays pending and is reported, never realised inside it.
Null: `acquisitionLagMonths = 0`.

**Validation at the engine boundary.** `acquisitionLagMonths` must be an integer ≥ 0; a
negative, fractional, NaN, infinite, non-numeric or null value throws `RangeError` — never
clamped, rounded or allowed to date entries to NaN. `maxMonthlyNewARR` is canonicalised:
null / undefined / ±Infinity → null (no bound); a finite value < 0 or NaN throws; 0 is kept
(no acquisition capacity, N = 0).

**Capital.** Acquisition capital is deployed when spent:
`deployed(t) = Σ acquisitionCost of realised cohorts + Σ sm of entries pending at t = Σ S&M
through t`. `capital.portfolioCapital` reports `realisedDeployed`, `pendingCapital`, `deployed`
and `outstanding` (pending is outstanding in full); the identity is asserted every month.

### Order and separability

The three are orthogonal by construction and checked to be (`physics-checks.js` SAT+LAG,
COST+SAT): the cost never changes the response, the bound never changes an existing cohort's
transition, the lag never changes the response function. `res.mechanisms` reports which are on.

## v2 — the Economic System layers

v2 turns the ARR-first engine into a layered economic system; the ontology and the
source-of-truth hierarchy are fixed in [`ARCHITECTURE-V2.md`](ARCHITECTURE-V2.md) and each
layer's mechanics in its research note. Every layer has a null under which the layer below is
reproduced exactly; with all at null the engine reproduces the complete frozen v1.3 state
(`baseline-v1.3-full.json.gz`, ALL-NULL-V13 in `v2-checks.js`).

### Gate A — Customer Physics (`customers.js`)

```
l = L^(1/12)   cM = 1 − (1 − C)^(1/12)   e = (1 + X)^(1/12) − 1
n₁          = n₀ × l
logo churn  = openingMRR × (1 − l)
contraction = openingMRR × l × cM
retained    = openingMRR × l(1 − cM)              g = l(1 − cM):  P = L(1 − C), DERIVED
expansion   = retained × e
closing     = retained + expansion               (the v1.3 identity, with g generated)
```

`persistenceAnnual` is not read while the layer is on. A new cohort's customers are
`Σ entry.newARR ÷ entry.newLogoARPAAtSpend`, stamped on the pending entry at spend. ARPA is
ARR ÷ customers everywhere and never a stock. Age bands cannot be combined with the layer
(rejected at the boundary). Measured: `K.customerMeasures` — R12M logo retention, the GRR
decomposition into lost-logo and contraction euros, ARPA path.

## Scenario architecture

`BASE_A` is a frozen assumption object; the Experiment is a separate object that is copied,
never mutated in place. Both are passed to the same `E.run()` — one entry point, one output
schema. Nothing in the engine knows which scenario it is running.

## Variable classification

Kept explicit in code as `TAXONOMY`, and surfaced as chips in the interface, because collapsing
these into one bucket called "KPIs" is what makes SaaS models unreadable:

| Class | Members |
|---|---|
| **STATE** | ARR (opening/closing), cash, cohort balances, **cohort age / maturity band**, **pending acquisition (v1.3)**, **cohort customers (v2 Gate A)** |
| **FLOW** | New ARR, expansion, leakage, revenue, COGS, gross profit, **expansion realisation cost (v1.1)**, EBITA, FCF |
| **TRANSITION** | persistence coefficient (an input only while Customer Physics is off; derived L(1 − C) when on), expansion coefficient, gross margin, **CAC / New ARR** — each of the first two may vary by age band; **expansionCostPerARR (v1.1), maxMonthlyNewARR (v1.2), acquisitionLagMonths (v1.3)**; **logoRetentionAnnual, contractionAnnual (v2 Gate A)** |
| **CONTROL** | S&M, R&D, G&A investment |
| **MEASURED** | **R12M GRR / expansion / NRR**, **R12M logo retention and the lost-logo / contraction decomposition of GRR, ARPA (v2 Gate A)**, **Coefficient / Average / Marginal payback**, **Cohort CAC (realised)**, **Measured CAC · trailing 12**, pending stock, utilisation, ARR growth, EBITA margin, burn — produced by Layer B, never settable. Every CAC is € of S&M per €1 of ARR, in either display basis. |

## Files

| File | Role |
|---|---|
| `engine.js` | **Layer A** — the economic engine. Pure, deterministic, no DOM, no I/O. UMD. Orchestrates one monthly loop and owns every stock; v2 layer transitions are pure functions in their own modules. |
| `customers.js` | **v2 Gate A** — Customer Physics transition (logo survival · contraction · survivor expansion). Pure, stateless, UMD; inlined before the engine by `build.js`. |
| `kpi.js` | **Layer B** — the KPI measurement engine, plus forward economic content and the v1.1–v1.3 measurements (`acquisitionMeasures`, `expansionCostMeasures`). Contains no economics of its own. UMD. |
| `integrity.js` | The 51 economic, measurement and state assertions (35 original + 16 for v1.1–v1.3). UMD. |
| `checks.js` | Node CLI for the assertions. |
| `physics-checks.js` | v1.1–v1.3 cross-mechanism, release-gate (ALL-NULL vs `baseline-v1.0.json`), extreme-probe and sweep checks. |
| `physics-study.js` | The three v1.1–v1.3 experiments, printed with measured results. |
| `physics-accept.js` | Playwright acceptance checks for the v1.1–v1.3 product surfaces. |
| `v2-checks.js` | v2 release gate (ALL-NULL-V13 vs `baseline-v1.3-full.json.gz`, the complete v1.3 state for twelve worlds) and the per-gate law checks. |
| `v2-study.js` | The v2 experiments, printed with measured results. |
| `v2-accept.js` | Playwright acceptance checks for the v2 product surfaces. |
| `scenarios.js` | Node CLI for Scenarios A–E and the 0.2/0.2.1 experiments. |
| `state-sufficiency.js` | Node CLI for the v0.3 State Sufficiency Experiment. |
| `v1.template.html` | The product surface (SaaS Physics v1). |
| `ui.template.html` | Inspection interface (research archive). |
| `build.js` | Inlines the engine, KPI, integrity and derived modules into the single-file surfaces. |
| `saas-physics-v1.html` | Built product. |

The browser runs the same `engine.js` and the same `integrity.js` as the Node CLI — the build
step inlines them rather than reimplementing them, which is what makes integrity check 8
("one engine") a structural fact rather than a claim.

---

# Development constitution

Adopted after the Phase 0/1 research iteration. Every future physics extension
must begin with a **blocked CFO question** — *what can the current engine not
answer?* — and then add ONE minimum mechanism.

## Admission criteria

A proposed mechanism is admissible only if all seven hold:

1. It is a real economic **state, flow, constraint, transition or policy**.
2. It enables a **qualitatively new** CFO question or behaviour.
3. It has a clear **economic interpretation**.
4. It has a **null/default setting that reproduces the previous version exactly**.
5. It gets at least one **new named integrity check**.
6. Its causal link is added to the **System Map**.
7. The **KPI sufficiency / observability gate is rerun** if the mechanism
   introduces or changes hidden state.

## Governing principle: bounds before benefits

> Under uncertainty, adding a conservative **constraint** to an existing
> optimistic mechanism requires less evidence than adding a new positive
> economic **benefit**.

A constraint makes an over-permissive model less wrong in a direction that is
already known to be wrong. A benefit asserts a causal channel the model would
then rely on, and a wrong benefit is not conservative in any direction.

Worked examples:

| Proposal | Class | Evidence bar |
|---|---|---|
| Diminishing acquisition productivity in S&M | **bound** on an existing optimistic mechanism (Finding 10: the model can always buy growth) | lower |
| Cash constraining S&M | **bound** — the capital loop is currently drawn open because it *is* open | lower |
| R&D → improved retention | **claimed benefit** (Finding 16) | materially higher |
| Expansion carrying a cost | **bound** on a currently free mechanism (Finding 14) | lower |

This principle does **not** license arbitrary functional forms. A bound still
needs a null setting that reproduces the previous version exactly, an economic
interpretation, and a named check.

## Current state of the gate

The Phase 0/1 gate ran on v0.3 and returned **PROCEED TO ACQUISITION-NONLINEARITY
DESIGN** — a bound, not a benefit. See [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md).

The homogeneous reduced form `ARR(t+1) = g·ARR(t) + N` holds for flat bands with same-month
acquisition (lag 0); under a capacity it still holds with a smaller constant N; under an
acquisition lag it does not (`research-checks.js` REDUCTION-IS-LAG-CONDITIONAL: 22.6% off at
lag 6). The product's Experiment Attribution re-runs the engine rather than using the reduced
form, so its terms still sum exactly under a lag, and it says so on screen.

v1.1–v1.3 admitted three mechanisms under the criteria above. Two are bounds (capacity, cost);
one is a timing state (lag). Criterion 7 (rerun the observability gate when hidden state is
introduced): the pending-acquisition stock is new hidden state, but it is fully determined by
the S&M history and the lag — a reader with the spend series and L can reconstruct it exactly —
so it adds no *unobservable* state to the domain the Phase 0/1 study enumerated. Recorded here
rather than re-run. The expansion cost adds no state; the bound adds none.

---

# Engine portability and the opening-state boundary

**Documented now, while no real data has entered.** That timing is deliberate:
a portability boundary drawn after the first real company has been wired in is
not a boundary, it is a description of whatever happened.

## The two layers

### ENGINE — pure, synthetic-capable economic methodology

`engine.js` and `kpi.js`. Takes an opening state and a set of assumptions;
produces a deterministic trajectory. It knows nothing about where its opening
state came from, and it must stay that way.

Everything the engine accepts today is already generic: an opening ARR, an
opening cash balance, and optionally a list of `{ arr, age }` cohorts. There is
no company identifier, no product, no currency assumption beyond a symbol, no
fiscal calendar, no chart of accounts.

### OPENING-STATE ADAPTER — not implemented, and out of scope

A future layer whose only job is to translate a real company's records into
that opening state: subscription or invoice data in, `{ openingARR, openingCash,
openingCohorts[] }` out, plus an estimate of the transition coefficients.

## The rule

> No company-specific field, source-system concept, or data-quality workaround
> may enter `engine.js` or `kpi.js`. If real data does not fit the engine's
> opening state, the adapter converts it — or the engine's limitation is
> recorded as a finding. The engine is never bent to fit a source system.

## Why this matters more than it looks

The pressure will not arrive as a request to change the engine. It arrives as a
small convenience: a nullable field for customers who lack a start date, a flag
for a migrated contract, a special case for one billing system. Each is
reasonable alone, and together they turn a portable methodology into one
company's model — at which point the 35 integrity checks are testing that
company's data pipeline rather than the economics.

The adapter is also where the honest failures belong. A real base will not have
clean cohort vintages; the adapter must state what it assumed, and that
assumption becomes an input to the state-sufficiency question rather than a
hidden one.

## Status

**Not implemented. Do not implement in v1.** The boundary is documented so that
future integration cannot contaminate the portable engine by accident.
