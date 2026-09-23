# Baseline v2.0 — the Economic System, frozen at the end of the programme

Established on `v2-economic-system` after the foundation commit and Gates A–D, the final
hardening commit included. It supersedes `docs/BASELINE-v1.3.md` as the frozen reference;
that file and `baseline-v1.3-full.json.gz` remain the witness every v2 commit replays.

## Protected core, byte-identical at freeze

| File | sha256 | lines | vs v1.3 |
|---|---|---|---|
| `engine.js` | `1ad74e54bfc8c653ad9aa7ca1fcbe01fc322a0685cdc87355fd56954886e4990` | 1402 | changed — v1.4 warm start: `openingPipelineMonths`, an initial condition; null reproduces v1.3 field for field |
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
| `v1.template.html` | `7b372345fbf3db856e0a7702c578b91f398d2c3e9004ead43d4595bc3740784a` | 4902 | changed — five-lens instrument, cohort life, acquisition response curve, the opening-pipeline control |
| `saas-physics-v1.html` (built) | `76b1c6615c432b931aaf96b95213a059e9d03ecaddcedcab032c873003e4d2fe` | — | rebuilt from the above |
| `baseline-v1.3-full.json.gz` (witness) | `b8c4716c49f57e0503112d2901653850834a148e3284ae3539ff5cbbabf4777b` | — | the complete v1.3 state, from the engine at `44f7652` |
| `baseline-v1.0-full.json.gz` (witness) | `970cc4d7c6dcbd01be79a487e5c8002cb811ee427a499870e629647704b35f08` | — | unchanged |

## Re-freeze — v1.4 warm start

`engine.js` was re-frozen once after this baseline, for one initial condition:
`openingPipelineMonths`, the months of spend in flight at month 0 (docs/RN-WARM-START.md). The
freeze is not weakened by it. The release gate still replays the complete v1.3 witness field for
field at the null setting, and the new condition is proven not to reach any cost line: cumulative
S&M, R&D and G&A are identical to the cold run and deployed capital still equals the cumulative
S&M the window can see. The checksums above are the re-frozen ones.

## Amendment — monetization composition attribution

`engine.js` is amended once more, for a **reporting defect in the fixed/variable split**. No law
changes and no economic quantity moves.

**The defect.** A cohort's per-customer component state is carried through `MO.copyState()`, whose
contract is `{ penetration, units, price }` — the component *kind* is not state and comes from the
rates array. `realiseCohort()` nevertheless recovered the kind from a copied state, through
`moRatesFor()`, and so read `undefined` for every component of a newly realised cohort. On its
birth month only, **all** of a cohort's revenue was classified as variable.

**Why the previous value was wrong.** `fixedARR` on a birth row was 0 even where the world has a
fixed component, and the company record — which faithfully sums the cohort rows — inherited the
error. Fixed was understated every month by one newborn cohort's fixed revenue:
0.34%–2.17% of closing ARR across the canonical worlds, always in the same direction.

**Exact affected outputs**, and these only:
`months[].monetization.fixedARR`, `.variableARR`, `.variableShare`;
`cohorts[].rows[].monetization.fixedARR`, `.variableARR`;
`summary.finalVariableShare`;
`monetizationMeasures().companyFixedARR`, `.companyVariableARR`, `.companyVariableShare`.

**Confirmed unchanged.** A before/after audit over **621,542 numeric fields** in seven worlds —
two null worlds, the three acceptance worlds, a hypothesis world and a three-component world —
found exactly those nine paths changed, **no others, and no change of shape**. ARR, expansion and
its four named effects, revenue, gross profit, EBITA, FCF, cash, deferred revenue, receivables,
customers, GRR, NRR, CAC, payback and the cohort ladder do not move. The partition
`fixedARR + variableARR = closingARR` held before the fix and holds after it — which is why the
total was never wrong and why every existing test passed straight through the defect. The null
rule is untouched: the path is unreachable with Monetization off, both null worlds returned zero
changed fields, ALL-NULL-V13 replays the complete v1.3 witness field for field, both witness
archives are byte-identical, and the headline Base figures are identical to the cent —
M60 ARR €62,926,223.19 · ending cash €59,571,254.64 · trough €6,100,740.28 (M13) · payback 18.0.

**Amended checksum.** `engine.js` → `93927195c56d83461b4f1435923866c1ca15e24e4b5b8557b4a78f3d57d48c5c`
(1402 → 1408 lines). **`monetization.js` is not touched** and keeps
`a2a3dbaef27561f7de336f833a556acd06aee3db91bc8921a82c7c8dbbd9ca87`: the module's state contract was
correct, and the fix passes the authoritative rates array into `realiseCohort()` rather than
widening what a state copy carries. Widening `copyState()` was built and tested — bit-identical
numbers — but it changed the published shape of `state` from three keys to six, and was rejected.

**Recorded as** FINDINGS #43. Held by `monetization-split-checks.js` (10 checks), which
reconstructs the split from the spec's own component kinds for **every cohort row in every world
that actually acquires** — the check whose absence let this stand. The prior clean-room
monetization audit ran at `sm: 0`, so the only cohort was the opening base, the one cohort that
never passes through `realiseCohort()`. Reverting the fix fails three of the ten.

## Amendment — presentation and build drift

Three rows of the table above went stale during the Ledger, Customers and Phase-1 passes. They are
**presentation and build files, not the economic core**, and none of them can change an engine
output. Restated here so the table is not silently wrong:

| File | frozen at | now | why |
|---|---|---|---|
| `build.js` | `7926d13f…` | `0039a1b791f19342c436b4e562f876d4eedb5d33187216c789c3b37712e62357` | injects the short git hash as a build marker, so a cached page is distinguishable from a live one |
| `v1.template.html` | `7b372345…` | `3f2e18c76a936781fbcba3da89c229a916cf5bddf7e7ff233b55e8fa61a160b1` | the Model Ledger, the System · Customers rebuild, the Phase-1 defect fixes |
| `saas-physics-v1.html` | `76b1c661…` | `fffd2c7648a4364e7f2d24957200f6cd6f58293da80e771a9e61bf2a8380c6bf` | rebuilt from the above, and now also carrying the amended engine |

**The ten engine-layer files remain byte-identical to the freeze** apart from the single amended
`engine.js` above: `kpi.js`, `integrity.js`, `capital.js`, `systemstate.js`, `basis.js`,
`customers.js`, `monetization.js`, `cash.js`, `interventions.js` all keep their table checksums.

## Amendment — the System mechanism build (Monetization, Cash)

The System · Monetization and System · Cash views were rebuilt, a Growth Engine view was
considered and declined (FINDINGS #44), and both rebuilt views had a subtraction pass
(`20a70de`, `c2c9fe6`, `5b348de`, `211e666`, plus this close-out). **Presentation only.** Across
those commits the only files changed are `v1.template.html`, the page built from it, and
`docs/FINDINGS.md`. All ten engine-layer files keep the checksums above, `engine.js` included at
its amended `93927195…`, and `build.js` is unchanged at `0039a1b7…`.

| File | was | now |
|---|---|---|
| `v1.template.html` | `3f2e18c7…` | `b9b9bfff3b60ada63d9fcd6125b215d4c62c1ab33ec648c82bf34e98dbd1529f` |
| `saas-physics-v1.html` | `fffd2c76…` | `3caa65726f43197f2ddb9b8e04b12cd1f8b230c77af7a898fa445e2ddf0c94d5` |

The built page carries its build commit's short hash (see `build.js` above), so the Pages artifact
built by CI at the pushed commit differs from the committed page in that marker alone.

Close-out verification: Node suites 370 / 370 (`npm run all`); browser suites 306 / 306 (all
fourteen in `npm run accept`); `audit-independent.js` 27 / 27 reconciliations; dist
byte-identical to the built page; every System view across five packs and four months with no
page errors; Monetization and Cash at desktop 1440×900 and iPad 1024×768 / 768×1024 in
their representative states: positive and negative price, early and mature billing cycle, and a
one-month term. On screen with no horizontal scroll, the Monetization bridge closes, price signs
agree with their labels, the cycle is part-filled at M6 and full at M36, both cash identities
hold, and vintage selection works at every size.

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

## Addendum — the Economic Legibility pass (`v2-economic-legibility`)

Seven commits above `da4b1c7` re-represented the product (`docs/LEGIBILITY-REPORT.md`,
`docs/VISUAL-GRAMMAR.md`). Every protected file above is **byte-identical** at the end of that
pass — `engine.js`, `kpi.js`, `integrity.js`, `capital.js`, `systemstate.js`, `basis.js`,
`customers.js`, `monetization.js`, `cash.js`, `interventions.js`, `build.js` keep the checksums in
the table. Only `v1.template.html` and the built page changed. The suites above pass unchanged;
`v2-legibility-accept.js` (38 checks) is added, for 484 in total.
