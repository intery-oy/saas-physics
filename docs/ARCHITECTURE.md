# Economic architecture — Prototype 0.2.1 (model v0.2.1)

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
the simulation; the only things a user can set are three management controls and four
coefficients.

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

## Scenario architecture

`BASE_A` is a frozen assumption object; the Experiment is a separate object that is copied,
never mutated in place. Both are passed to the same `E.run()` — one entry point, one output
schema. Nothing in the engine knows which scenario it is running.

## Variable classification

Kept explicit in code as `TAXONOMY`, and surfaced as chips in the interface, because collapsing
these into one bucket called "KPIs" is what makes SaaS models unreadable:

| Class | Members |
|---|---|
| **STATE** | ARR (opening/closing), cash, cohort balances |
| **FLOW** | New ARR, expansion, leakage, revenue, COGS, gross profit, EBITA, FCF |
| **TRANSITION** | persistence coefficient, expansion coefficient, gross margin, **CAC / New ARR** |
| **CONTROL** | S&M, R&D, G&A investment |
| **MEASURED** | **R12M GRR / expansion / NRR**, **CAC payback**, ARR growth, EBITA margin, burn — produced by Layer B, never settable |

## Files

| File | Role |
|---|---|
| `engine.js` | **Layer A** — the economic engine. Pure, deterministic, no DOM, no I/O. UMD. |
| `kpi.js` | **Layer B** — the KPI measurement engine. Contains no economics. UMD. |
| `integrity.js` | The 26 economic- and measurement-integrity assertions. UMD. |
| `checks.js` | Node CLI for the assertions. |
| `scenarios.js` | Node CLI for Scenarios A–E. |
| `ui.template.html` | Inspection interface. |
| `build.js` | Inlines `engine.js` + `integrity.js` into the single-file UI. |
| `saas-physics-prototype-0.html` | Built artifact. |

The browser runs the same `engine.js` and the same `integrity.js` as the Node CLI — the build
step inlines them rather than reimplementing them, which is what makes integrity check 8
("one engine") a structural fact rather than a claim.
