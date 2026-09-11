# Economic architecture — Prototype 0.4 (model v0.4)

> **v0.4.** One new transition coefficient in the generator: **acquisition saturation**
> (`acqSaturationSpend`). New ARR may saturate in S&M. The shipped default is **null** —
> the linear v0.2 / v0.3 generator — so the default world is exactly v0.3 and the model
> asserts no saturation scale until a user sets one. Finding 10's blocked question
> (*when should we stop increasing S&M?*) is answerable only when `k` is finite. No new
> hidden state; the Phase 0/1 observability gate was not re-run.
>
> Optional overnight coefficients, all null/flat at the default so Year-5 ARR is
> unchanged: `smCashReserve` (cash may cap S&M), `billingAdvanceMonths` (FCF may
> leave EBITA), `expansionCacPerARR` (expansion may cost cash), `logoRetentionAnnual`
> (customer stock; ARR path unchanged), plus UI for opening state and the existing
> three-band tenure array. Equations below. See [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md).

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
RATE (payback, GM)       ─┴─► New ARR ──► new cohort each month
                                              │
RATE (GRR, expansion) ──────────────────► cohort ageing
                                              │
                            Σ cohorts ──► ARR (STATE)
                                              │
                                   midpoint ──► Revenue (FLOW)
                                              ├─► Gross profit ──► EBITA ──► FCF ──► Cash (STATE)
                                              └─► NRR, growth, EBITA margin (emergent)
```

Nothing downstream is an input. NRR, growth, EBITA margin, burn and cash are all read off
the simulation. At the default a user sets three management controls and four coefficients;
optional overnight coefficients (saturation, cash reserve, prepaid term, expansion CAC,
logo retention) are off unless set. Opening state and tenure bands are UI on existing
engine fields.

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

## Acquisition (v0.2 primitive, v0.4 optional saturation)

The primitive is **acquisition productivity** — a dimensionless ratio, now the *small-spend*
(linear) productivity:

```
cacPerARR = acquisition spend ÷ New ARR generated     (when spend is well below saturation)
```

**Null / default** (`acqSaturationSpend` absent, null, 0 or Infinity) — exact v0.2 / v0.3 generator:

```
New ARR added per month   = Monthly S&M ÷ cacPerARR
New ARR per year of spend = Monthly S&M × 12 ÷ cacPerARR
```

**Saturating** (finite `k = acqSaturationSpend`, €/month of S&M):

```
New ARR added per month = (k / cacPerARR) × S&M / (S&M + k)
                        = linear × k / (S&M + k)
```

`k` is the monthly S&M at which *average* productivity has fallen to half the linear prediction.
Equivalent rising-CAC form: average CAC = `cacPerARR × (1 + S&M/k)`. As S&M → ∞, New ARR →
`A_max = k / cacPerARR`. Marginal New ARR = `A_max × k / (S&M + k)²` is strictly decreasing in
S&M — that is the bound that lets the model say *stop*.

**Units.** `sm` is €/month, `cacPerARR` is dimensionless, so `newARRPerMonth` is € of ARR (an
annualised run-rate quantity) added to the ARR stock each month — the same interpretation the v0.1
engine used, which is why every downstream identity, cohort rule and reconciliation is untouched.
Worked example from the brief, k off: €500k/month at 1.5× → €500k × 12 ÷ 1.5 = **€4.0m of New ARR per
year of spend**, i.e. €333k added to the stock each month.

**Gross margin does not appear.** That is the point of v0.2 and it still holds under saturation.
Stated CAC payback remains an output of the *linear* primitive:

```
CAC payback = cacPerARR × 12 ÷ Gross margin
```

Realized CAC (`S&M / New ARR`) rises with spend when `k` is finite; it is stamped on each
acquisition cohort as `cacPerARRAtCreation` so cost = initialARR × stamp. Under the linear
default the stamp equals the stated `cacPerARR`, bit-identically.

So: **small-spend productivity determines the linear slope; saturation determines when that
slope bends; gross margin determines how fast the stated investment is economically recovered.**
Integrity check A1 asserts structurally that neither `cacPayback` nor `grossMargin` appears
anywhere in the New ARR generator. The NL checks assert the null default is bit-identical to
v0.3 and that a finite `k` is a genuine bound.

Still instantaneous — no sales capacity, rep ramp, pipeline, conversion or acquisition delay.
Saturation is the one new bound. The interface states both formulae on screen next to the
controls that drive them.

**Cash may constrain S&M.** `smCashReserve` omitted / null / Infinity is the prior
unconstrained contract: intended S&M is spent in full every month, even if cash is already
negative. A finite reserve `r` ≥ 0 (including 0) caps this month's S&M at
`max(0, cashOpening − r)` and New ARR is recomputed from that capped spend. R&D and G&A
are not capped — this is not a financing model.

## Stock to flow

```
average ARR     = (opening ARR + closing ARR) / 2
monthly revenue = average ARR / 12
gross profit    = revenue × GM
COGS            = revenue × (1 − GM)
EBITA           = gross profit − S&M − R&D − G&A − expansionCost
                  expansionCost = Expansion ARR × expansionCacPerARR   (0 at default)
FCF             = EBITA                       ← null billing term (prior alias)
                = EBITA + N × ΔMRR            ← finite billingAdvanceMonths N
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

## Scenario architecture

`BASE_A` is a frozen assumption object; the Experiment is a separate object that is copied,
never mutated in place. Both are passed to the same `E.run()` — one entry point, one output
schema. Nothing in the engine knows which scenario it is running.

## Variable classification

Kept explicit in code as `TAXONOMY`, and surfaced as chips in the interface, because collapsing
these into one bucket called "KPIs" is what makes SaaS models unreadable:

| Class | Members |
|---|---|
| **STATE** | ARR (opening/closing), cash, cohort balances, **cohort age / maturity band** |
| **FLOW** | New ARR, expansion, leakage, revenue, COGS, gross profit, EBITA, FCF |
| **TRANSITION** | persistence coefficient, expansion coefficient, gross margin, **CAC / New ARR**, **acquisition saturation spend** (null = linear) — each of the first two may vary by age band |
| **CONTROL** | S&M, R&D, G&A investment |
| **MEASURED** | **R12M GRR / expansion / NRR**, **CAC payback**, ARR growth, EBITA margin, burn — produced by Layer B, never settable |

## Files

| File | Role |
|---|---|
| `engine.js` | **Layer A** — the economic engine. Pure, deterministic, no DOM, no I/O. UMD. |
| `kpi.js` | **Layer B** — the KPI measurement engine, plus forward economic content. Contains no economics of its own. UMD. |
| `integrity.js` | The economic, measurement, state and NL (Finding 10) assertions. UMD. |
| `checks.js` | Node CLI for the assertions. |
| `scenarios.js` | Node CLI for Scenarios A–E and the 0.2/0.2.1 experiments. |
| `state-sufficiency.js` | Node CLI for the v0.3 State Sufficiency Experiment. |
| `ui.template.html` | Inspection interface. |
| `build.js` | Inlines `engine.js` + `integrity.js` into the single-file UI. |
| `saas-physics-prototype-0.html` | Built artifact. |

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
**v0.4 implements that bound.** It adds no hidden state, so the observability
gate was not re-run.

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
