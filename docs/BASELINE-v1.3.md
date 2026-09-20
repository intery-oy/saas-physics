# Baseline v1.3 — the re-frozen core after the physics extension and its fix pass

Established after v1.1 (Expansion Economics), v1.2 (Bounded Acquisition) and v1.3 (Acquisition
Timing) landed in `f08f992`, were adversarially reviewed, and the review's findings were fixed
in the follow-up commit. This supersedes `BASELINE-v1.0.md` as the frozen reference; that file
is kept as the record of what the extension started from and holds the two fixtures the
ALL-NULL gates replay.

## Protected core, byte-identical at freeze

| File | sha256 | lines | vs v1.0 |
|---|---|---|---|
| `engine.js` | `1e8f132e900735e9352c37eec45b0cc567c97ecd27e1c94c9f1e6a9f18c33df3` | 916 | changed — three mechanisms; `validateAssumptions`, `pendingEntry`, `realiseCohort` |
| `kpi.js` | `0bcd0f6da231059e70e6ededb19ab2446afc5a8c167f27978377c5fb0bde84d7` | 381 | changed — `acquisitionMeasures`, `expansionCostMeasures`, `companyKPIs.expansionCost` |
| `integrity.js` | `bae107a51a0d7ead6fd16254529c59a5884ba940561a8bfdcf50a667437632d5` | 666 | changed — 18 checks appended (36–53); checks 1–35 untouched |
| `capital.js` | `c9ff52248de50a7cdf11ca5f21c6017c0bab0f68b15a061969912db23982eb96` | 181 | changed — `portfolioCapital` includes pending capital; `pendingAt` |
| `systemstate.js` | `3bb2c255d21fbd83ba0ebf23db78d0235fc7ab8075c6a3df48d530e509a85d24` | 97 | changed — reads `expansionCost`, pending fields |
| `basis.js` | `ee816509cc29485bd64496d1b974df7808cdf9583f9dc8a1a392a46492522e66` | 49 | unchanged |
| `build.js` | `f1fdb5a053adf9a1045c341cba4673d59b73ec1620d8b65233f1795cd474fa83` | 37 | unchanged |
| `v1.template.html` | `42666428d56d6fda73cb312e74c9341d64ca35e30d7b83d343e80dd70aac85de` | 2532 | changed — controls, Observe, Scenarios 7–9, Inspect, System map, canonical CAC vocabulary |
| `saas-physics-v1.html` (built) | `e34c6f7edcc3113ef8c020c19fcfa733f0dd1157f8fd839db0c5836782109f4b` | — | rebuilt from the above |
| `baseline-v1.0-full.json.gz` (fixture) | `970cc4d7c6dcbd01be79a487e5c8002cb811ee427a499870e629647704b35f08` | — | the complete v1.0 snapshot, from the engine at `ba98265` |

## What the fix pass changed in the protected files, and why

**`engine.js`**
- `validateAssumptions()` at the boundary: `acquisitionLagMonths` must be an integer ≥ 0 —
  negative, fractional, NaN, ±Infinity, non-numeric or null throws `RangeError` (a coerced lag
  reshaped the cash path; a NaN lag dated every entry to never mature). `maxMonthlyNewARR`
  canonicalised: null/undefined/±Infinity → null; negative or NaN throws; 0 kept.
- `pendingEntry(a, t, L, newARR)`: the ledger entry now carries `cacPerARRAtSpend`,
  `maxMonthlyNewARRAtSpend` (null = bound off) and `lagMonths` beside `sm` and `newARR`.
- `realiseCohort(t, matured, bandName, grossMargin)`: takes no assumption object; every
  provenance stamp (`acquisitionCost`, `initialARR`, `cacPerARRAtCreation`,
  `cacCoefficientAtCreation`, `capacityAtSpend`, `spendMonth`, `lagMonths`, `sourceEntries`)
  comes from the entries. Called **only when an entry matured** — no zero-ARR placeholder
  cohort exists before maturity; the cohort count is realised cohorts only.
- `months[].cohortCreated`; `summarise().cohortCount`.

**`capital.js`** — `portfolioCapital` reports `realisedDeployed`, `pendingCapital`,
`pendingNewARR`, `deployed` (= realised + pending = Σ S&M), `outstanding` (pending is
outstanding in full), `outstandingRealised`, and a `pending` state/count. `pendingAt(res, t)`.

**`integrity.js`** — check 43 rewritten to evaluate the law only (second differences of N, a
forward-difference marginal CAC); check 48 asserts no phantom cohorts; new SPEND-TIME
PROVENANCE (synthetic entry realised with no assumption object) and lag-validation checks;
check 51 re-indexed for real cohorts.

**`kpi.js`, `systemstate.js`, `basis.js`, `build.js`** — unchanged in the fix pass.

## Suites passing at freeze

| Suite | Result |
|---|---|
| `node checks.js` | 53 / 53 |
| `node physics-checks.js` | 69 / 69 — ALL-NULL-FULL: 331,662 fields vs the complete v1.0 snapshot, worst \|Δ\| €0.00e+0; CAPITAL-RECONCILIATION €0.00e+0 at lags 0/6/12/72, zero S&M, through maturity; SATURATION-INDEPENDENT marginal CAC 3.2e-10 rel |
| `node mrr-native-checks.js` | 20 / 20 |
| `node basis-checks.js` | 12 / 12 |
| `node clarity-checks.js` | 46 / 46 |
| `node attribution-checks.js` | 22 / 22 |
| `node research-checks.js` | 21 / 21 (REDUCTION-IS-LAG-CONDITIONAL, REDUCTION-HOLDS-UNDER-CAPACITY added) |
| `node clarity-accept.js` (Playwright) | 15 / 15 |
| `node attribution-accept.js` (Playwright) | 14 / 14 |
| `node physics-accept.js` (Playwright) | 24 / 24 (CAC-UNITS basis invariance, real cohort count added) |

Total: 296 checks (183 at v1.0 + 113 added). Headline Base figures unchanged from v1.0:
M60 ARR €62,926,223.19 · ending cash €59,571,254.64 · trough €6,100,740.28 (M13) ·
New ARR €750,000/mo · coefficient payback 18.0 months.

## Rule from here

The three protected files are frozen again at the checksums above. The next physics change
repeats the same discipline: capture (this file becomes the "before"), one mechanism with a
null setting, named checks, an all-null replay against the captured full snapshot, then a new
baseline note. `baseline-v1.0-full.json.gz` stays as the fixture until a release deliberately
changes the null world — which none of v1.1–v1.3 did.
