# SaaS Physics — Prototype 0.2.1

A deterministic monthly economic engine for a SaaS business, plus a deliberately simple
inspection interface. It answers one question:

> **What kind of company does a given set of operating assumptions create over 60 months?**

This is an economic simulation, not a forecast spreadsheet. Outputs emerge from upstream
assumptions: NRR, growth, EBITA margin, burn and cash are all calculated, never entered.
Company ARR is only ever the sum of a portfolio of cohorts.

Not built yet, by design: enterprise value, multiples, 3D, real company data, customer-level
modelling, churn/contraction split, pricing, usage, working capital, debt, tax, capex,
pipeline, headcount, probabilistic simulation, AI commentary. **We are proving the physics first.**

## Run it

```bash
node checks.js       # 26 economic- and measurement-integrity checks
node scenarios.js    # Scenarios A–E
node build.js        # build the single-file inspection interface
open saas-physics-prototype-0.html
```

No dependencies. The browser UI inlines the same `engine.js` and `integrity.js` the CLI uses.

## Controls

| Class | Assumption | Default |
|---|---|---|
| CONTROL | Monthly S&M investment | €900k |
| CONTROL | Monthly R&D investment | €700k |
| CONTROL | Monthly G&A investment | €350k |
| TRANSITION | CAC / New ARR | 1.20× |
| TRANSITION | Annual persistence coefficient | 90% |
| TRANSITION | Annual expansion coefficient | 10% |
| TRANSITION | Gross margin | 80% |
| STATE | Opening ARR | €20.0m |
| STATE | Opening cash | €10.0m |

Illustrative defaults. No real company data is connected.

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

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the economic architecture and every equation
- [`docs/RESULTS.md`](docs/RESULTS.md) — reconciliation, integrity results and Scenarios A–E
- [`docs/MEASUREMENT.md`](docs/MEASUREMENT.md) — **reality vs measurement**: the two-layer
  architecture, why 90% reads as 89.56%, canonical KPI definitions, inverse calibration, what GRR
  and NRR cannot tell you, and the provenance audit
- [`docs/MATCHED-NRR.md`](docs/MATCHED-NRR.md) — the matched-NRR experiment: two businesses this
  model cannot tell apart, why, and what physics would have to exist for them to diverge
- [`docs/FINDINGS.md`](docs/FINDINGS.md) — **Where the physics break**: conceptual weaknesses
  this prototype exposed, and what to change next

## Model version

v0.2.1. The one v0.1 equation that was conceptually wrong — gross margin generating ARR — has been
corrected by inverting the acquisition primitive. Everything else that looked weak is still built
as specified and flagged in `FINDINGS.md` rather than quietly patched. The point of the prototype
is to surface weaknesses, not bury them.

The built file keeps the name `saas-physics-prototype-0.html` across iterations so the published
link stays stable; the page header carries the model version.
