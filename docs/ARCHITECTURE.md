# Economic architecture — Prototype 0 (model v0.1)

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

## Acquisition (the deliberately simple part)

New ARR is generated, never assumed:

```
New ARR = Monthly S&M × 12 ÷ (CAC payback months × Gross margin)
```

This inverts the definition of CAC payback on gross profit
(`CAC = payback × (New ARR / 12) × GM`). It is linear, instantaneous and unbounded in S&M.
No sales capacity, rep ramp, pipeline, conversion, diminishing returns or acquisition delay.
The interface states the formula on screen next to the controls that drive it.

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
| **RATE** | GRR, expansion rate, gross margin, CAC payback |
| **CONTROL** | S&M, R&D, G&A investment |

## Files

| File | Role |
|---|---|
| `engine.js` | The engine. Pure, deterministic, no DOM, no I/O. UMD. |
| `integrity.js` | The 12 economic-integrity assertions. UMD. |
| `checks.js` | Node CLI for the assertions. |
| `scenarios.js` | Node CLI for Scenarios A–E. |
| `ui.template.html` | Inspection interface. |
| `build.js` | Inlines `engine.js` + `integrity.js` into the single-file UI. |
| `saas-physics-prototype-0.html` | Built artifact. |

The browser runs the same `engine.js` and the same `integrity.js` as the Node CLI — the build
step inlines them rather than reimplementing them, which is what makes integrity check 8
("one engine") a structural fact rather than a claim.
