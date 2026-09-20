# Baseline v2.0 — the Economic System, frozen at the end of the programme

Established on `v2-economic-system` after the foundation commit and Gates A–D, the final
hardening commit included. It supersedes `docs/BASELINE-v1.3.md` as the frozen reference;
that file and `baseline-v1.3-full.json.gz` remain the witness every v2 commit replays.

## Protected core, byte-identical at freeze

| File | sha256 | lines | vs v1.3 |
|---|---|---|---|
| `engine.js` | `56463b6bae8bad1ce9a259f503748146e148337433dc4a16a6ee897a4899f50e` | 1340 | changed — layer dispatch (A/B/C), `lawAt(t)` (D); every v1.3 line kept for the null world |
| `kpi.js` | `b48a4a7ec36e15f7f128f4202d727842f88d17f0645480bccb71518f8545f359` | 531 | changed — `customerMeasures`, `monetizationMeasures`, `cashMeasures`, `interventionMeasures` |
| `integrity.js` | `bae107a51a0d7ead6fd16254529c59a5884ba940561a8bfdcf50a667437632d5` | 666 | **unchanged** |
| `capital.js` | `c9ff52248de50a7cdf11ca5f21c6017c0bab0f68b15a061969912db23982eb96` | 181 | **unchanged** |
| `systemstate.js` | `3bb2c255d21fbd83ba0ebf23db78d0235fc7ab8075c6a3df48d530e509a85d24` | 97 | **unchanged** |
| `basis.js` | `ee816509cc29485bd64496d1b974df7808cdf9583f9dc8a1a392a46492522e66` | 49 | **unchanged** |
| `customers.js` | `6cb63cb755738e758972f3e5b502c93f0b85b9dc082f0113db9e1977c074ebdc` | 83 | new — Gate A |
| `monetization.js` | `a2a3dbaef27561f7de336f833a556acd06aee3db91bc8921a82c7c8dbbd9ca87` | 141 | new — Gate B |
| `cash.js` | `2e3ac7a8c497a819064b85a63dc7c9e84ef251ae917023daa3c0421df1279f03` | 111 | new — Gate C |
| `interventions.js` | `095331919a07023346e7883779907e98df03e33f8d23b75de86d01f5b069821b` | 189 | new — Gate D |
| `build.js` | `7926d13f33daa6743f56a6ebcfb0b80a75af103b63a6dfe759d352e12af88fd1` | 42 | changed — inlines the four layer modules before the engine |
| `v1.template.html` | `6835cfa0d8bb26771203526d2bc26c6f12890340aad66a31d19d434dff6fc5f7` | 3340 | changed — layer-grouped Change rail, packs, Observe/Inspect/Compare per layer, hierarchical System map, Scenarios 10–14 |
| `saas-physics-v1.html` (built) | `5a8a7fd1d3b3915c8ffbf3fdba81f0701cd5ff2235153253cf97b9dc62291497` | — | rebuilt from the above |
| `baseline-v1.3-full.json.gz` (witness) | `b8c4716c49f57e0503112d2901653850834a148e3284ae3539ff5cbbabf4777b` | — | the complete v1.3 state, from the engine at `44f7652` |
| `baseline-v1.0-full.json.gz` (witness) | `970cc4d7c6dcbd01be79a487e5c8002cb811ee427a499870e629647704b35f08` | — | unchanged |

## The null rule, proven

With `logoRetentionAnnual: null`, `monetization: null`, `billingTermMonths: null`,
`collectionDelayMonths: 0`, `interventions: []` (the defaults) the engine reproduces the complete
v1.3 state — every month field, every cohort scalar and row, R12M / acquisition /
expansion-cost measures at every T, summary, derived, bands, ledger, pending, portfolio capital
— for twelve worlds including every v1.3 mechanism on: **737,109 fields, worst |Δ| €0.00e+0**
(`v2-checks.js` ALL-NULL-V13, the first check of every commit). The v1.0 witness still replays
through `physics-checks.js` ALL-NULL-FULL.

## Suites passing at freeze

| Suite | Result |
|---|---|
| `node v2-checks.js` | 104 / 104 — ALL-NULL-V13 (26), Gate A (21), Gate B (16), Gate C (21), Gate D (14), FINAL (6) |
| `node checks.js` | 53 / 53 |
| `node physics-checks.js` | 69 / 69 |
| `node mrr-native-checks.js` | 20 / 20 |
| `node basis-checks.js` | 12 / 12 |
| `node clarity-checks.js` | 46 / 46 (NO-FAKE-MOVEMENTS restated for the layers that now produce churn and contraction) |
| `node attribution-checks.js` | 22 / 22 |
| `node research-checks.js` | 21 / 21 |
| `node v2-accept.js` (Playwright) | 46 / 46 |
| `node physics-accept.js` (Playwright) | 24 / 24 |
| `node clarity-accept.js` (Playwright) | 15 / 15 |
| `node attribution-accept.js` (Playwright) | 14 / 14 |
| `node v2-walkthrough.js` (Playwright) | 11 questions, no page errors → `docs/WALKTHROUGH-V2.md` |

Total: 446 checks (296 at v1.3 + 150 added). Headline Base figures unchanged from v1.0/v1.3:
M60 ARR €62,926,223.19 · ending cash €59,571,254.64 · trough €6,100,740.28 (M13) · New ARR
€750,000/mo · coefficient payback 18.0 months. Full system on (every layer, two hypotheses, lag
6, capacity, cost): every identity every month, worst residual €4.5e-8; 7.8 ms per run.

## Rule from here

The protected files are frozen at the checksums above. The next physics change repeats the
discipline: capture (this file becomes the "before"), one mechanism with a null setting, named
checks, a full-state replay against a captured snapshot of the world it must reproduce, then a
new baseline note. `baseline-v1.3-full.json.gz` stays as the witness until a release
deliberately changes the null world — which none of v2 A–D did.
