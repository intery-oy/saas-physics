# Baseline v1.0 — Cohort Physics Baseline, captured before the physics extension

Captured on the `main` branch at commit `ba98265`, before any equation was changed for
v1.1 (Expansion Economics), v1.2 (Bounded Acquisition) and v1.3 (Acquisition Timing).

## Protected core, byte-identical at capture

| File | sha256 | lines |
|---|---|---|
| `engine.js` | `fe88acadb35f00fa3e884897c420a949a71dbf075b3f7ec59b7660e8ea95a8ac` | 658 |
| `kpi.js` | `a70bbdbc5ed7265aa48060b9b673a8ccad2e19ff5ef248861989a1ec86b98f0f` | 316 |
| `integrity.js` | `911277628a8b8a11b34d03c876b232200699a0815ef51cdbfedf3ab136e971ed` | 413 |
| `capital.js` | `8877e1dd4712ad5f5bc77d96b064e42e506324ec17d6ba0f295a294da62f40ca` | 142 |
| `systemstate.js` | `40ca1678e05c7f899ee3a2c1e5889ba8c2d512a4f26af4fd5092afa92e1da43e` | 88 |
| `v1.template.html` | `164af320a81636057b8a95436873f8bb9ac0c2152ea74e37783ddd2d04b18c8e` | 2249 |

## Suites passing at capture

| Suite | Result |
|---|---|
| `node checks.js` | 35 / 35 |
| `node mrr-native-checks.js` | 20 / 20 |
| `node basis-checks.js` | 12 / 12 |
| `node clarity-checks.js` | 46 / 46 |
| `node attribution-checks.js` | 22 / 22 |
| `node research-checks.js` | 19 / 19 |
| `node clarity-accept.js` (Playwright) | 15 / 15 |
| `node attribution-accept.js` (Playwright) | 14 / 14 |

Total: 183 checks. The two Playwright suites carried a stale absolute path
(`/home/user/experiments/...`); they now resolve `saas-physics-v1.html` relative to their
own directory. That is the only change made before capture.

## Trajectory fixture

`baseline-v1.0.json` holds, for Base and the five canonical parameter scenarios
(retention, expansion, efficiency, margin, pair-spend), every month's closing ARR, New ARR,
expansion, leakage, revenue, gross profit, EBITA, FCF, cash and chained NRR, plus the final
per-cohort ARR / cumulative GP / acquisition cost, the month-36 R12M measurement and
`E.summarise()`. The all-mechanisms-null release gate (`physics-checks.js`, ALL-NULL) replays
the extended engine against this fixture.

Headline Base figures at capture: M60 ARR €62,926,223.19 · ending cash €59,571,254.64 ·
cash trough €6,100,740.28 (M18) · New ARR €750,000/mo · CAC payback 18.0 months.

## The controlled re-freeze

Byte immutability of `engine.js` / `kpi.js` / `integrity.js` cannot hold across an
intentional physics release. The discipline used instead:

1. this baseline is preserved (checksums above, fixture on disk);
2. each mechanism is added with an explicit null setting;
3. the all-null world is replayed against the fixture at the project's own tolerance
   (`1e-6` €);
4. once every suite passes, the new checksums are recorded in `docs/BASELINE-v1.3.md` and
   become the frozen baseline for whatever comes next.
