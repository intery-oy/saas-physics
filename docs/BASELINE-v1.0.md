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

## Trajectory fixtures

Two fixtures, both generated from the v1.0 engine (`git show ba98265:engine.js` and
`kpi.js`), for Base and the five canonical parameter scenarios (retention 0.96, expansion 0.18,
efficiency 0.80, margin 0.65, pair cac 0.80 + sm 1.35m):

- `baseline-v1.0.json` (168 KB, readable) — a subset: per month `t, closingARR, newARR,
  expansion, leakage, revenue, grossProfit, ebita, fcf, cashClosing, nrrAnnualised`; final
  per-cohort ARR / cumulative GP / acquisition cost; R12M at M36; `summarise()`. Regenerating it
  from the `ba98265` engine reproduces the committed file byte-for-byte.
- `baseline-v1.0-full.json.gz` (589 KB gzipped, 8.7 MB expanded) — **everything the v1.0
  engine emitted**: every month field including the `cumulative` object, every cohort scalar and
  every cohort row, `measureR12M` at every T = 12…60 including per-cohort contributions,
  `summarise()` including `mix`, `derived`, `bands`. Read with Node's built-in `zlib`.

Generator (run against the v1.0 engine files):

```js
var out = {}; Object.keys(scen).forEach(function (k) {
  var r = E0.run(Object.assign({}, E0.DEFAULT_ASSUMPTIONS, scen[k])), r12 = [];
  for (var T = 12; T <= 60; T++) r12.push(K0.measureR12M(r, T));
  out[k] = { months: r.months, cohorts: r.cohorts, r12m: r12, summary: E0.summarise(r), derived: r.derived, bands: r.bands };
});
fs.writeFileSync('baseline-v1.0-full.json.gz', zlib.gzipSync(Buffer.from(JSON.stringify(out)), { level: 9 }));
```

**What ALL-NULL-FULL compares** (`physics-checks.js`): it walks the v1.0 object recursively and
looks up the same path in the v1.3 run at null; numbers must agree within €1e-6, strings /
booleans / nulls exactly, array lengths exactly; a v1.0 path missing in v1.3 fails. The one
JSON artefact — `bands[2].maxAgeExclusive`, `Infinity` in the engine and `null` in the file —
is accepted at that path only. **What is not in the fixture**, because v1.0 did not emit it:
the v1.3-only fields (`expansionCost`, `acquisitionLawNewARR`, `pendingNewARR`, `pendingSpend`,
`pendingCount`, `realisedFromSpendMonth`, `cohortCreated`, `cacCoefficientAtCreation`,
`capacityAtSpend`, `spendMonth`, `lagMonths`, `sourceEntries`, `mechanisms`,
`derived.acquisition` / `acquisitionLagMonths` / `expansionCostPerARR`, `acquisitionLedger`,
`pendingAtHorizon`, and the new `summarise` fields). Those are asserted separately to be at
their null values in the null world. 331,662 fields are compared across the six worlds.

Headline Base figures at capture: M60 ARR €62,926,223.19 · ending cash €59,571,254.64 ·
cash trough €6,100,740.28 (M13) · New ARR €750,000/mo · coefficient payback 18.0 months.

## The controlled re-freeze

Byte immutability of `engine.js` / `kpi.js` / `integrity.js` cannot hold across an
intentional physics release. The discipline used instead:

1. this baseline is preserved (checksums above, fixture on disk);
2. each mechanism is added with an explicit null setting;
3. the all-null world is replayed against the fixture at the project's own tolerance
   (`1e-6` €);
4. once every suite passes, the new checksums are recorded in `docs/BASELINE-v1.3.md` and
   become the frozen baseline for whatever comes next.
