# Baseline v1.3 — the re-frozen core after the physics extension

Established after v1.1 (Expansion Economics), v1.2 (Bounded Acquisition) and v1.3 (Acquisition
Timing) passed every suite. This supersedes `BASELINE-v1.0.md` as the frozen reference; that file
is kept as the record of what the extension started from.

## Protected core, byte-identical at freeze

| File | sha256 | lines | vs v1.0 |
|---|---|---|---|
| `engine.js` | `12400b0245424e281aff944a4e3a73b681d59f3b5719eab5c1ded3ddbd5a8eeb` | 840 | changed — three mechanisms, see below |
| `kpi.js` | `0bcd0f6da231059e70e6ededb19ab2446afc5a8c167f27978377c5fb0bde84d7` | 381 | changed — `acquisitionMeasures`, `expansionCostMeasures`, `companyKPIs.expansionCost` |
| `integrity.js` | `44ef1da72568bb732fcddc37a6eecfd95127cb717a324cd8b4744f5a1be8c7c6` | 604 | changed — 16 checks appended (36–51); checks 1–35 untouched |
| `capital.js` | `a3a0df75a7be2e1f142aa5f2961ff407d8d88d36ccb7f01c60dbabf700a21be5` | 148 | comment only (disclosed boundary updated) |
| `systemstate.js` | `3bb2c255d21fbd83ba0ebf23db78d0235fc7ab8075c6a3df48d530e509a85d24` | 96 | changed — reads `expansionCost`, pending fields |
| `basis.js` | `ee816509cc29485bd64496d1b974df7808cdf9583f9dc8a1a392a46492522e66` | 49 | unchanged |
| `build.js` | `f1fdb5a053adf9a1045c341cba4673d59b73ec1620d8b65233f1795cd474fa83` | 37 | unchanged |
| `v1.template.html` | `cb26f99ee774ae27642c48e71c4043e963b78044ea0cbc3559bd45cd76e383d5` | 2519 | changed — controls, Observe, Scenarios 7–9, Inspect, System map |
| `saas-physics-v1.html` (built) | `e53e5053fbd4b9a7d0785726e8c6f8ae373aad16d4c974235a5d4512f95aaac2` | — | rebuilt from the above |

## Exactly what changed in the protected files, and why

**`engine.js`**
- `DEFAULT_ASSUMPTIONS`: `expansionCostPerARR: 0`, `maxMonthlyNewARR: null`,
  `acquisitionLagMonths: 0` — the null settings, so every existing caller is unchanged.
- `newARRPerMonth()`: the saturating response when the bound is on; the linear law otherwise.
  New `saturationEnabled()`, `acquisitionResponse()` (analytical average/marginal CAC).
- `run()`: per-cohort `expansionCost` and the company line (v1.1); the pending ledger, realise
  step, cohort provenance `spendMonth` / `lagMonths` / `cacCoefficientAtCreation` (v1.3);
  `cacPerARRAtCreation` now the realised cost per €1 (v1.2). New month fields
  (`expansionCost`, `acquisitionLawNewARR`, `pendingNewARR`, `pendingSpend`, `pendingCount`,
  `realisedFromSpendMonth`), new result fields (`mechanisms`, `derived.acquisition`,
  `derived.acquisitionLagMonths`, `derived.expansionCostPerARR`, `acquisitionLedger`,
  `pendingAtHorizon`), `modelVersion` `'0.3'` → `'1.3'`.
- `summarise()`: `cumExpansionCost`, `averageCAC`, `marginalCAC`, `acquisitionUtilisation`,
  `firstCohortMonth`, `pendingNewARRAtHorizon`, `pendingSpendAtHorizon`.
- `TAXONOMY` and `cohortSnapshot()` extended accordingly.

**`kpi.js`** — additive only: two measurement functions and one field. No economics.

**`integrity.js`** — additive only: EXP-COST (36–40), ACQ-BOUND (41–46), ACQ-LAG (47–51).

## Suites passing at freeze

| Suite | Result |
|---|---|
| `node checks.js` | 51 / 51 |
| `node physics-checks.js` | 41 / 41 (ALL-NULL exact: worst |Δ| €0.00e+0 on all six fixture worlds) |
| `node mrr-native-checks.js` | 20 / 20 |
| `node basis-checks.js` | 12 / 12 |
| `node clarity-checks.js` | 46 / 46 |
| `node attribution-checks.js` | 22 / 22 |
| `node research-checks.js` | 19 / 19 |
| `node clarity-accept.js` (Playwright) | 15 / 15 |
| `node attribution-accept.js` (Playwright) | 14 / 14 |
| `node physics-accept.js` (Playwright) | 22 / 22 |

Total: 262 checks (183 at v1.0 + 79 added). Headline Base figures unchanged from v1.0:
M60 ARR €62,926,223.19 · ending cash €59,571,254.64 · trough €6,100,740.28 (M13) ·
New ARR €750,000/mo · CAC payback 18.0 months.

## Rule from here

The three protected files are frozen again at the checksums above. The next physics change
repeats the same discipline: capture (this file becomes the "before"), one mechanism with a
null setting, named checks, an all-null replay against a captured fixture, then a new baseline
note. `baseline-v1.0.json` stays as the fixture until a release deliberately changes the null
world — which none of v1.1–v1.3 did.
