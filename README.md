# SaaS Physics — Prototype 0

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
node checks.js       # 12 economic-integrity checks
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
| RATE | CAC payback | 18 months |
| RATE | Annual GRR | 90% |
| RATE | Annual expansion | 10% |
| RATE | Gross margin | 80% |
| STATE | Opening ARR | €20.0m |
| STATE | Opening cash | €10.0m |

Illustrative defaults. No real company data is connected. NRR is deliberately **not** an
assumption — it emerges as 99.0% from GRR × (1 + expansion).

## Documents

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the economic architecture and every equation
- [`docs/RESULTS.md`](docs/RESULTS.md) — reconciliation, integrity results and Scenarios A–E
- [`docs/FINDINGS.md`](docs/FINDINGS.md) — **Where the physics break**: conceptual weaknesses
  this prototype exposed, and what to change in v0.2

## Model version

v0.1, implemented faithfully to the Prototype 0 specification. Where an equation looked
conceptually weak it was built as specified and flagged in `FINDINGS.md` rather than quietly
corrected — the point of the prototype is to surface weaknesses, not bury them.
