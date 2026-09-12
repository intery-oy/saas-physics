# SaaS Physics — Roadmap horizons

*12 September 2026. Research note for owner review. Not a launch plan, not a backlog dump.*

This file is the sequenced outline a CFO can react to: **what the instrument can already answer, what it still cannot, and which named procedures Intery should keep as reusable diligence IP.** It cites existing docs and code. It does not add physics, UI, or a commercialisation path.

Read first, in this order: [`README.md`](../README.md) (constitution), [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) (instrument state after A1 + overnight bounds), [`docs/FINDINGS.md`](FINDINGS.md) (what the numbers taught), this file (horizons). Architecture and admission rules: [`ARCHITECTURE.md`](ARCHITECTURE.md). In-flight chrome/voice (not yet on `main`): PR #7 [`docs/TRUST-SPINE.md`](https://github.com/intery-oy/saas-physics/blob/cursor/trust-spine-t0-t1-5af1/docs/TRUST-SPINE.md) on `cursor/trust-spine-t0-t1-5af1`.

---

## How to read this

SaaS Physics is an **educational / diligence instrument**: a deterministic 60-month cohort engine plus inspection surfaces. The job, from [`BRIEF.md`](BRIEF.md) §1, is to make the hidden physics of a SaaS company inspectable so a serious person can spar with the mechanism — not to report a company, and not to sell a seat.

**Intery IP, later.** The portable asset is the *methodology*: Layer A transition laws (`engine.js`), Layer B measurements (`kpi.js`), named experiments (state sufficiency, SKSG, matched NRR, capital recovery), and the constitution that keeps those layers apart. That methodology is meant to analyse **any** SaaS book later — opening state in, trajectory and measurements out — without bending the engine around a source system ([`ARCHITECTURE.md`](ARCHITECTURE.md) “Engine portability”). Horizon D is that portability. It is not a product shopfront.

**Default world is the checksum, not a company.** Year-5 ARR €62,926,223.19, one age-0 vintage, linear S&M, unconstrained cash, FCF = EBITA, free expansion, no customer stock. Engine `modelVersion` `'0.4'`. Every overnight coefficient is opt-in. Quoting the default as a result about SaaS is a category error ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §4.10).

**Vocabulary on this page.** Default / A / B / Base / Exp as in the trust-spine note. Vintage reading, carry·leak, unmodeled link, conceal variation. Coefficients ≠ reported KPIs. FIBC-60 is forward installed-base gross profit, not value. LAND / RAMP / RETAIN is Frends portal IA and a rejected-for-now lifecycle hypothesis ([`DESIGN.md`](DESIGN.md), [`MATCHED-NRR.md`](MATCHED-NRR.md)); this instrument’s tenure language is Early / Developing / Mature.

---

## Standing rules (unchanged)

From [`ARCHITECTURE.md`](ARCHITECTURE.md) constitution and [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §2:

1. One mechanism at a time. A cash or ARR move must attribute to a named law.
2. Null / default reproduces the prior world bit-identically. Year-5 ARR is the drift check.
3. **Bounds before benefits.** A constraint on an already-too-optimistic mechanism needs less evidence than a claimed causal benefit (R&D → retention is the worked example).
4. A proposed mechanism starts from a **blocked CFO question**, then adds the minimum state, flow, constraint, transition or policy that answers it.
5. If hidden state is added or changed, re-run the KPI-sufficiency / observability gate ([`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md)).
6. No company-specific field enters `engine.js` or `kpi.js`. An adapter, if it ever exists, emits `{openingARR, openingCash, openingCohorts[]}` and stays outside the engine.
7. Weaknesses are filed in [`FINDINGS.md`](FINDINGS.md), not silently patched.

Admission criteria (all seven): real economic object; qualitatively new CFO question; economic interpretation; null that reproduces the prior version; named integrity check; System-map link; observability gate if hidden state changes.

---

## 1. Mechanism register — exists / planned / weak

Status words:

| Word | Means |
|---|---|
| **Exists** | In `engine.js` / `kpi.js` / a derived module, with a named check. Default may still be off. |
| **Surfaced** | A guest can turn it or read it on v1 without opening a CLI study. |
| **Under-surfaced** | Computed and checked; the glass does not make it a first-class instrument. |
| **Planned** | Named in FINDINGS / PRODUCT_ASSESSMENT as next physics or craft, not built. |
| **Weak** | Specified and implemented; the limitation is load-bearing and should stay visible. |

### Layer A — the world (`engine.js`)

| Mechanism | Status | Null / default | CFO question it answers (or still blocks) | Paths |
|---|---|---|---|---|
| Cohort spine; company ARR = Σ cohorts | **Exists, surfaced** | One age-0 €20m book | What kind of company do these assumptions create over 60 months? | `engine.js` `run()`, check 2 / 2b; [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Acquisition primitive `cacPerARR` | **Exists, surfaced** | 1.20× | How much New ARR does a euro of S&M buy? (GM does not generate ARR — v0.2) | `newARRPerMonth()`; Finding 0/v0.2 in [`FINDINGS.md`](FINDINGS.md) |
| A1 acquisition saturation `acqSaturationSpend` | **Exists, on rail, under-surfaced as a *stop* instrument** | `null` = linear `New ARR = S&M ÷ cacPerARR` | When does the next euro of S&M buy vanishing New ARR? | Finding 10; `derived.newARRLinear`, `derived.acqAMax`; PR #7 System caption |
| Cash constrains S&M `smCashReserve` | **Exists, on rail** | `null` = spend even if cash is negative | Can we spend S&M we do not have? | Finding / overnight; `effectiveSM()`; `months[].smIntended`, `smConstrained` |
| Prepaid billings `billingAdvanceMonths` | **Exists, on rail, weak form** | `null` = FCF aliased to EBITA | How does billing timing move liquidity vs EBITA? | Finding 15; `Δdeferred = N × ΔMRR`; **smooth, not invoices** |
| Expansion cost `expansionCacPerARR` | **Exists, on rail** | `0` = free | What incremental resources does Expansion consume? | Finding 14; cash-only — ARR path unchanged |
| Logo vs contraction `logoRetentionAnnual` | **Exists, on rail** | `null` = no customer stock | How much leakage is lost logos vs contraction? | Finding 18; **disclosure only — ARR unchanged** |
| Three-band tenure (Early / Developing / Mature) | **Exists, on rail, coarse** | Flat = Homogeneous Control World | Does age change forward ARR dynamics? | Finding 12; `BAND_EDGES` 12 / 24; Scenario 6 owns `SCEN6_BANDS` |
| Opening state + vintage mix | **Exists, on rail** | One age-0 vintage | What if we already have a book? | Finding 19; `{openingARR, openingCash, openingCohorts[]}` — **no adapter** |
| Cohort acquisition-cost stamp | **Exists, Inspect / capital track** | Opening vintages `null` (unknown, not zero) | What capital created this euro — without feeding it forward? | Finding 7; `acquisitionCost`, `cacPerARRAtCreation`; [`CAPITAL-LOOP.md`](CAPITAL-LOOP.md) |
| Expansion saturation | **Planned** (next physics after craft) | — | Can an account exhaust? | Finding 13 — first bound that changes an *existing* cohort’s ARR path |
| Acquisition lag | **Planned** | — | Where is the cash pain of a growth push (hire → capacity, not spend → ARR same month)? | Finding 17 |
| Price as a first-class lever | **Planned, do not invent a form** | — | How much of a revenue change came from price? | Finding 21; ARPA today is a logo *unit*, not a price law |
| R&D → retention / expansion | **Planned as user-stated intervention only** | R&D is a cost with no modelled benefit | What is the causal return on product investment? | Finding 16 — **benefit, higher evidence bar** |
| Opening-state adapter | **Documented, out of v1** | — | Translate a real book into the engine’s start object | [`ARCHITECTURE.md`](ARCHITECTURE.md) portability section |

### Layer B and derived — measurements, not laws

| Mechanism | Status | Notes | Paths |
|---|---|---|---|
| Canonical R12M GRR / expansion / NRR | **Exists, surfaced** | Frozen eligible cohort; New ARR excluded; `GRR + expansion = NRR` | `kpi.js` `measureR12M()`; [`MEASUREMENT.md`](MEASUREMENT.md) |
| Coefficient ≠ KPI (`decompose`, `rateDiagnostics`) | **Exists, partly surfaced** | 90% persistence measures as 89.56% GRR; entire residual is within-period interaction | `kpi.js` `decompose()`; `engine.js` `rateDiagnostics()` |
| Inverse calibration `K.calibrate()` | **Exists, on rail, overclaim risk** | Flat-law closed form only; refused when bands are non-flat; **not a forecast** | `kpi.js` `calibrate()`; check 34; [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §4.4 |
| FIBC-60 / existing-base GP density | **Exists in Layer B + research CLI, under-surfaced on v1** | Undiscounted 60-month GP of the T0 installed base; not value, not a KPI | `kpi.js` `forwardEconomics()`; `research.js` `fibc60`, `stateFIBC` |
| SKSG (SaaS KPI Sufficiency Gap) | **Exists as a research procedure, under-surfaced** | Searched max FIBC-60 spread among observationally identical states; conditional on **non-monotone** tenure | [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md); `research.js` `sksg`; Scenario 6 narrative |
| Age composition | **Exists, Cohorts age profile** | Three engine bands; display buckets are grouping, not a fourth law | `kpi.js` `ageComposition()`; [`COHORTS.md`](COHORTS.md) |
| Capital recovery (payback as a crossing) | **Exists, Inspect / collapsed track** | First month `cumGP ≥ acquisitionCost`; portfolio outstanding / recovered | `capital.js` `cohortCapital`, `portfolioCapital`, `gpByVintage` |
| Experiment attribution N / g / interaction | **Exists, gated, under-shouted when invalid** | Valid only for flat-band, same-state experiments; billing and expansion CAC correctly excluded (cash-only) | `v1.template.html` attribution; `attribution-checks.js` |
| System readout | **Exists; contract is default-world** | `systemstate.js` / `pulse.js` still treat FCF ≈ EBITA in residuals | [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §3 |

### Surfaces (craft, no physics)

| Surface | Status | Question it is for |
|---|---|---|
| Company (two planes: recurring stock, cash) | Shipped | What is the accumulated state at the selected month? |
| System (valves + ⊘ unmodeled links) | Shipped; PR #7 tightens period/basis labels | What causal topology does the engine actually contain? |
| Scenarios 1–6 | Shipped | Change one declared assumption; especially **5** (same ARR, different capital) and **6** (same KPIs, different history) |
| Cohorts v1 | Shipped 12 Sep | Which vintage is carrying / leaking — and does blended NRR conceal variation? [`COHORTS.md`](COHORTS.md) |
| Appendix (month × KPI table) | Shipped 12 Sep | Lab-notebook substrate; charts later. [`NOTEBOOK_TABLE_SPEC.md`](NOTEBOOK_TABLE_SPEC.md) |
| Inspect / capital track | Shipped, contextual | One cohort’s provenance and payback crossing |
| Trust spine (identity chips, optional-bounds disclosure, voice) | **In flight on PR #7**, not on `main` at this writing | Engine decides; UI narrates. Default is the immutable reference world |

### What is still weak (implemented as specified)

These are not bugs. They are the model’s current boundary ([`FINDINGS.md`](FINDINGS.md) “Still broken” + Phase 0/1):

| # | Weakness | Why it matters to a CFO |
|---|---|---|
| 12 | Three step-function tenure bands; edges 12 / 24 are assumptions | Cannot represent a smooth survival curve. Do not refine until there is evidence about shape. |
| 13 | Expansion unbounded | Nothing exhausts an account; expansion headroom is invisible; matched-NRR pair still ties on the ARR *path*. |
| 15 (form) | Prepaid term is `N × ΔMRR`, opening deferred is `openingMRR × N/2` | Not an invoice calendar, not a trial balance. |
| 16 | R&D reaches no valve | The only modelled conclusion about product spend is *spend less*. |
| 17 | No acquisition lag | Growth-push cash pain lives in the lag the engine does not have. |
| 20 | Midpoint revenue | Trapezoid on a geometrically moving stock. Small; kept because it is legible. |
| 21 | No price | Expansion and leakage are quantity effects. |
| 23 | Hidden state has a finite lifetime | Once every euro is in the unbounded Mature band, composition is inert. Distinguishing state is **recent acquisition**. |
| — | Attribution / N-g story | Holds on default opening + flat bands only. Vintage mix or tenure edits invalidate it. |
| — | `systemstate.js` / `pulse.js` | Consistent with each other and with FCF = EBITA. Not consistent once billings or expansion CAC is on. |

**What held up** (do not reopen): cohort spine to ~10⁻⁸ €; lever separation (retention / acquisition / GM); sunk cost stays sunk (check 32); v0.4 null coefficients reproduce v0.3; same-world gate on Scenario 6 to `0.00e+0`; SKSG result that **retention ratios carry no identifying power** while the **ARR path** collapses the gap in twelve months ([`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md) §9).

---

## 2. Under-surfaced engine capabilities

The binding constraint on the *demo* is no longer a missing coefficient ([`FINDINGS.md`](FINDINGS.md) “Suggested order”; [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §3). It is grouping, language, and a set of **already-computed** quantities that a diligence reader would use and that v1 still treats as footnotes, CLI output, or Inspect-only.

Horizon A is mostly this list — **surface, do not re-derive.**

| Capability already in code | What it already computes | Where a guest meets it today | Diligence use if first-class |
|---|---|---|---|
| `derived.newARRLinear` vs applied New ARR; `derived.acqAMax` | Linear counterfactual vs saturating New ARR; asymptote `k / cacPerARR` | Saturation slider; PR #7 System caption | **Stop-spend test:** at this `k`, the next euro of S&M buys how much New ARR, and what is `A_max`? |
| Realized CAC stamp `cacPerARRAtCreation` | Under finite `k`, stamp = `S&M / New ARR` (rising average CAC) | Cohort Inspect | Stated payback stays `cacPerARR × 12 / GM`; realized CAC is a different object. |
| `smIntended` / `sm` / `smConstrained` | Cash-capped spend vs intended | Reserve slider; System Cash→S&M link | **Operating constraint:** which months is S&M cut, and how much New ARR is thereby refused? |
| `billings`, `deferredOpening` / `deferredClosing`, `deltaDeferred` | Smooth WC: `billings = revenue + N×ΔMRR` | Waterfall when term is on; Appendix capital | **Liquidity vs earnings:** growing ARR is cash-generative at the WC line. Opening deferred is a midpoint, not a TB. |
| `expansionCost` (month + cumulative) | `Expansion ARR × c` off EBITA | Waterfall step (often €0) | **Matched-NRR tax:** on Scenario 1 vs 2 (or the MATCHED-NRR pair) cash separation is linear in extra expansion × `c`. |
| Logo split: `logoChurn`, `contraction`, customer stock, `measureR12M.logoRetention` | Persistence still drives leakage; split is disclosure | Rail + Cohorts contraction `—` until on | **Leakage anatomy:** 98% logo survival can coexist with 10% ARR leakage labelled as contraction. |
| `arrMix`, `cohortSnapshot`, yearly vintage stocks | Opening vs Y1–Y5 shares; per-cohort age / band / carry | Company composition; Cohorts composition | Provenance of the book. Under *flat* laws this is not a retention story ([`COHORTS.md`](COHORTS.md)). |
| `measureR12M.contributions` | Per-vintage GRR / NRR at window T | Cohorts vintage reading | **Conceal-variation test:** does blended R12M NRR mix disagreeing vintages? |
| `K.ageComposition` | ARR in Early / Developing / Mature | Cohorts age profile (hidden under flat on PR #7) | Position of the base in the band structure — the state trailing KPIs cannot see ([`STATE-SUFFICIENCY.md`](STATE-SUFFICIENCY.md) §F observability). |
| `K.forwardEconomics` / `research.js` FIBC-60 | T0-base GP over 60 months; `existingBaseGPDensity` | Scenario 6 prose; `node research-study.js` | **Forward density:** € of future GP per € of identically-reported ARR. Not a multiple. |
| `research.js` `sksg` / lenses | SKSG by snapshot / 12 / 24 / 36M; ARR-path vs rates-only | Memo + Scenario 6 | **Sufficiency procedure:** which disclosure identifies the state? On this domain, twelve months of ARR history; GRR history never. |
| `K.decompose` / `E.rateDiagnostics` | Closed-form coefficient → measured KPI gap | Company coefficient→measured line (partial) | **Board-pack invert:** you cannot type 90% GRR as 90% persistence. |
| `K.calibrate` | Inverse: target measured GRR / expansion → coefficients | Inverse-calibration box | Same invert, writable. Refuses non-flat bands. |
| `capital.js` `portfolioCapital` | Deployed / recovered / outstanding; pre-payback vs paid-back counts | Collapsed capital track; Inspect | **Capital still out** at month T — the quantity ARR refuses to show (Finding 11, reclassified). |
| `capital.js` `gpByVintage` | Which vintages produce *this* month’s GP | Capital track (stated as ARR mix × GM/12 under current physics) | Today’s output by birth month. Under uniform GM this *is* the ARR mix scaled by a constant — say so. |
| `capital.js` `deployedSeries` | Cumulative S&M to T | Little used | Pair with ARR path for Scenario 5’s lesson. |
| Attribution N / g / interaction | Recurring-state delta split; cash stand-alone vs added-last | Company when valid | Multi-lever experiments. Must go quiet when `expStart` or non-flat bands are on. |
| `summarise()` cash trough, first profit, first negative cash, mix shares | Named extrema of the run | Scattered chips | Diligence extrema card — already computed in `engine.js`. |
| `impliedAnnualNRR`, `impliedCACPerNewARR` | Coefficient-side products | Rarely labelled as such | Keep them off the KPI chips. |

**UI holes that are not physics holes** ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §4): slider reserve `0` writes `null` (unconstrained), so “spend only the cash you have, no reserve” is unsettable from the rail; off-states that print `0.00` read as a measurement; PRESETS in `v1.template.html` are dead code; Playwright accept tests are machine-local.

---

## 3. Signature instruments

Reusable procedures. Each is already implied by a scenario, a check, or a memo. Horizon work should make these *callable*, not invent new scores.

| Instrument | Question | What you turn / read | What it does *not* claim | Source |
|---|---|---|---|---|
| **1. Capital-path test** | Two routes to the same ARR — where did the capital go? | Scenario 5; `capital.js` outstanding; cumulative S&M | ARR is not a capital ledger. Finding 11 is a validated result, not a defect. | [`CAPITAL-LOOP.md`](CAPITAL-LOOP.md); Scenario 5 |
| **2. Vintage-concealment test** | Same ARR + same trailing GRR / NRR — can forward installed-base GP still differ? | Scenario 6; Cohorts vintage reading; FIBC-60 density | Conditional on **non-monotone** tenure. Under monotone bands the matched construction was infeasible. | [`STATE-SUFFICIENCY.md`](STATE-SUFFICIENCY.md); [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md); [`COHORTS.md`](COHORTS.md) |
| **3. ARR-path identifiability test** | What is the cheapest disclosure that identifies the hidden state? | SKSG lenses: rates-only vs ARR-path vs both, W = 0 / 12 / 24 / 36 | On the declared domain, twelve months of ARR history; 36 months of GRR adds nothing. Not an empirical claim about every SaaS book. | [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md) §§8–9 |
| **4. Stop-spend test** | When does S&M stop buying New ARR? | Finite `acqSaturationSpend`; compare `newARRLinear` vs applied; watch cash keep falling | `k` is a half-saturation spend, not a TAM. | Finding 10; `engine.js` saturation block |
| **5. Cash-floor test** | Does the operating plan spend through a cash floor? | Finite `smCashReserve`; `smConstrained` months | Not a financing model. R&D and G&A stay uncapped. | Overnight cash; System ⊘ → present link |
| **6. Prepaid-liquidity test** | Does growth generate cash at the WC line? | Finite `billingAdvanceMonths` = 12 for “annual prepaid” | Smooth approximation. No invoices, collections lag, refunds, tax, capex, debt. | Finding 15 |
| **7. Expansion-tax test** | At what cost per euro of Expansion does the expansion-heavy book become poorer? | `expansionCacPerARR` on the matched-NRR pair | Linear in extra expansion × `c`. If the real world has a *threshold*, the missing physics is saturation (Finding 13), not cost. | [`MATCHED-NRR.md`](MATCHED-NRR.md) Class B |
| **8. Leakage-anatomy test** | Is ARR leakage lost customers or contraction on survivors? | `logoRetentionAnnual` + opening ARPA | Persistence still drives ARR. Logos can “look fine” while the book leaks. | Finding 18; [`COHORTS.md`](COHORTS.md) |
| **9. Coefficient–KPI invert** | What transition coefficients reproduce a reported GRR / expansion? | `K.calibrate()` / `decompose()` | Flat laws only. Not a forecast. Not “paste a board pack” as science. | [`MEASUREMENT.md`](MEASUREMENT.md) §D |
| **10. Homogeneous-control check** | Is age even doing any work? | Flat bands vs Scenario 6 / tenure editor | Under flat laws, vintage mix is a no-op on ARR and cash. Maturity itself creates nothing. | [`STATE-SUFFICIENCY.md`](STATE-SUFFICIENCY.md) §E; [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md) §2 |

Ten instruments. No quality score, no Rule of 40, no “ARR quality.” Several are **off at Default** and must stay labelled that way.

---

## 4. Horizons A–D

Horizons are capability layers, not calendar. Do not interleave A-craft with C-benefits in the same sitting. Do not start a commercialisation track ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §5).

### Horizon A — Diligence glass

**Blocked question:** a guest (or a later Intery analyst) cannot tell which knobs are the company, which are optional bounds, and which already-computed procedures are the ones to run.

**No new coefficients.** This is craft, language, and surfacing. Highest leverage for not overclaiming ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §5a).

**In flight (PR #7, not yet `main`):** identity chips `Default | A | B` · `M##` · scenario · `Base | Exp`; optional bounds collapsed; reserve-binding chip; A1 linear-vs-applied caption; Company rail demoted from Year-5 hero; Scenario 5 A/B ledger; waterfall `not modeled` when a cash bound is off; Cohorts null-check under Default/flat; Appendix month audit. Voice: vintage reading / conceal variation — not a moral label. See that branch’s `docs/TRUST-SPINE.md`.

**Still in A after that PR lands** (same constitution, still no physics):

1. **One sentence per bound stating the null**, on the glass, not only in Method. Company (opening, tenure, mix) vs bounds (saturation, reserve, billing, expansion CAC, logos).
2. **Attribution gate.** When `expStart` is set or bands are non-flat, mark N / g / waterfall-as-attribution as not the story. Numbers may still compute.
3. **`systemstate.js` / `pulse.js` contract.** Keep them default-only and say so, *or* extend both together so FCF ≠ EBITA when billing / expansion CAC is on. Do not patch one file ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §5a.3).
4. **Off ≠ zero.** Logo / deferred / expansion-cost chips read “off” / “unmodeled” when the bound is null (PR #7 starts this on the waterfall).
5. **Make instruments 1–10 callable from v1** without opening `node research-study.js`. Minimum: FIBC-60 density on Scenario 6 / Cohorts; linear-vs-applied New ARR whenever `k` is on; portfolio capital outstanding next to the ARR chart on Scenario 5; `rateDiagnostics` gap wherever coefficients and R12M sit together.
6. **Portable accept tests** next to `clarity-accept.js` (paths that resolve on a clean machine). Hygiene, not a product.

**Stop condition:** if a new control cannot name its null, or cannot be turned off without moving Year-5 ARR, it does not ship.

**CFO reaction this horizon is for:** “I can run the ten instruments on the Default world and on Scenarios 5 and 6 without being told that a bound is a property of SaaS.”

### Horizon B — Remaining bounds on optimistic mechanisms

**Blocked questions:** Finding 13 (expansion never exhausts), Finding 17 (no lag), Finding 12 (coarse tenure) — in that order, because MATCHED-NRR and FINDINGS already ranked them.

One at a time. Null default = prior world. Named check. System-map link. Observability gate only if hidden state changes (A1 did not; expansion saturation *does* change an existing cohort’s ARR path, so treat the gate as in-scope).

| Order | Mechanism | Shape (do not invent a fancier one) | Why this order |
|---|---|---|---|
| B1 | **Expansion saturation** | One `k` (or a multiple of initial ARR). Diminishing expansion on retained ARR. Symmetric in spirit with A1, but it is the first law that bends the *installed-base* ARR path. | Finding 13; [`MATCHED-NRR.md`](MATCHED-NRR.md) Class A; FINDINGS suggested order #1 |
| B2 | **Acquisition lag** | Hire → capacity, not S&M → ARR in the same month. One delay parameter, null = instantaneous (prior). | Finding 17. Cash pain of a growth push lives here. |
| B3 | **Tenure resolution** | Only if a *stated* empirical shape requires more than three bands. Band edges stay assumptions. | Finding 12. Fidelity limit, not a structural gap. Hidden-state lifetime (Finding 23) changes if the terminal band is no longer unbounded. |

**Not in B:** price, R&D benefit, concentration, customer-level distributions, invoice calendars, debt/tax/capex. Those are either Horizon C (higher bar) or anti-goals.

**CFO reaction this horizon is for:** “The model can now refuse unbounded expansion and instantaneous acquisition — still without asserting a universal SaaS curve.”

### Horizon C — Levers the engine cannot yet represent

**Blocked questions:** Finding 21 (price), Finding 16 (product investment).

Higher evidence bar. These are not conservative constraints on an existing optimistic mechanism. Price is the highest-leverage control a CFO actually holds and it has **no specified form** — do not invent one in a sitting. R&D as a universal coefficient is forbidden; R&D as a **user-owned intervention** (“€2m extra over 12 months → expansion +3pp after a 9-month delay”) is the constitution’s eventual fix ([`FINDINGS.md`](FINDINGS.md) #16).

Admission for C:

- The user states the hypothesis; the engine simulates it; the glass labels it a thesis, not a law of SaaS.
- Null / off reproduces Horizon B’s default world exactly.
- Delay, if shown, must be a delay the engine actually computes. If the instrument cannot show a lag without inventing one, C waits ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §5a.5).

**Not in C:** LAND → RAMP → RETAIN as a built-in lifecycle ([`MATCHED-NRR.md`](MATCHED-NRR.md) “do not implement it next”). If a lifecycle layer is ever built, it is user-settable phase boundaries + a normalisation that reproduces the flat-rate world at multipliers = 1 — and it still needs evidence that churn and expansion have *different* age profiles, or the matched-NRR pair will not separate.

**CFO reaction this horizon is for:** “I can put *my* price or product thesis on the book and see the path — and I can turn it off.”

### Horizon D — Any-company methodology (still not a product)

**Blocked question:** can the same Layer A / Layer B / instruments 1–10 be pointed at a *real* opening state without contaminating the engine?

This is Intery’s reusable IP. It is **not** auth, deploy, a CRM, or a diligence SaaS.

| D piece | What it is | What it is not |
|---|---|---|
| **Adapter (specified, not in-engine)** | Translate subscription / invoice / cash records → `{openingARR, openingCash, openingCohorts[]}` plus *estimated* coefficients. Failures and assumed vintages stay on the adapter. | A field inside `engine.js`. A Stripe feature. “v1.” [`ARCHITECTURE.md`](ARCHITECTURE.md) already drew this boundary *before* real data exists. |
| **Empirical SKSG** | KPI-SUFFICIENCY §15: do real bases show non-monotone tenure? How large is tenure dispersion? Is the ARR-path result robust to seasonality? | A claim that 23.43% is typical. A quality ranking of companies. |
| **Instrument pack** | The ten procedures above, run on that opening state, with Default still the synthetic checksum. | A board-report template, a Signals feed, or Frends LAND/RAMP portal cards ([`DESIGN.md`](DESIGN.md)). |
| **Observability gate as a product of research** | Re-run SKSG when D or B changes hidden state. Disclose KPI set, window, law set, domain, horizon, normalisation. | A single SKSG number on a marketing page. |

**CFO reaction this horizon is for:** “If I give Intery a book, I know exactly which object I am handing over, which laws I am assuming, and which instruments will be run — and I know the engine was not rewritten for my billing system.”

---

## 5. Anti-goals

Do not schedule these as horizons. Several are useful *later projects*; they are a different instrument if started now.

| Anti-goal | Why it is out |
|---|---|
| Auth, tenancy, pricing page, deploy-as-product, telemetry product | Commercialisation. Constitution and [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §2 close this. |
| Valuation, DCF, multiples, terminal value, “what is this company worth” | FIBC-60 exists so we do not need those words. |
| Quality scores, Rule of 40, weighted “ARR quality,” risk coefficients | Exactly the papering-over [`MATCHED-NRR.md`](MATCHED-NRR.md) and the brief forbid. |
| AI commentary that explains the chart | A second narrator on top of Layer B. |
| Adapter fields inside `engine.js` / `kpi.js` | Turns 66 integrity checks into one company’s pipeline. |
| LAND / RAMP / RETAIN as this product’s IA or as the next physics | Not in v1. Frends portal vocabulary ([`DESIGN.md`](DESIGN.md)). MATCHED-NRR assessed the lifecycle hypothesis and deferred it. Tenure here is Early / Developing / Mature, user-set, flat by default. |
| A universal SaaS tenure curve shipped as Default | Would assert a law the project has spent its life refusing to invent. Homogeneous Control World stays the default. |
| Silent equation patches / “improving” FINDINGS in place | Constitution. Implement as specified; file the weakness. |
| Invoice-faithful billing, collections, tax, capex, debt, headcount, pipeline, usage | Out of the current simulation boundary. Prepaid term is already the optional WC *bound*. |
| Concentration / customer-level distributions | [`MATCHED-NRR.md`](MATCHED-NRR.md): large step, high judgment, out of scope. |
| Making Default “more realistic” without an opt-in | Breaks comparability across five model versions. |
| Shareable experiment URL as the next craft item | Useful later; not Horizon A. |
| Moralising labels (“honest,” “lying,” “where the company really is”) | Trust-spine vocabulary list. Mechanisms have names; readings have conditions. |

---

## 6. What a CFO should react to

This section is the ask. Not estimates — **judgments**.

**On the existing world**

1. Are the **ten signature instruments** the right pack? Drop, rename, or add one — but adding one must name the blocked question and the code path that already computes it (or admit it is Horizon B/C).
2. Scenario 5 (same ARR / different capital) and Scenario 6 (same KPIs / different history) are the two results that already change how a board pack is read ([`PROJECT_STATUS.md`](../PROJECT_STATUS.md) §6). Are those the two you would put in front of another CFO first?
3. SKSG’s load-bearing condition is a **non-monotone** tenure profile. Under monotone laws the KPI set may be nearly sufficient. Is the empirical question — “does this book have a mid-life trough?” — the one worth taking outside the simulator ([`BRIEF.md`](BRIEF.md) Q4; [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md) §15)?

**On sequencing**

4. Horizon A before any new coefficient — including expansion saturation — matches [`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md). If you would rather see B1 (expansion cap) first, that is a constitution-legal disagreement about *leverage*, not about commercialisation. Say so.
5. Cash→S&M (done, optional) vs R&D→retention (Horizon C, benefit): the constitution already picked bounds first ([`BRIEF.md`](BRIEF.md) Q2). Confirm that still holds.
6. Horizon D’s adapter is **specified so it cannot leak into the engine**. When, if ever, is a *synthetic* opening state no longer enough for Intery’s own use — and what is the minimum adapter that would be?

**On language**

7. Prepaid = working-capital approximation; logos ≠ ARR; calibration ≠ forecast; saturation ≠ market; vintage mix under flat laws = no-op. Which of those five overclaims ([`PRODUCT_ASSESSMENT.md`](../PRODUCT_ASSESSMENT.md) §4) would you actually make in a meeting today, and which should the glass block?

**On what this is for**

8. The standing use is mechanism literacy and diligence on **any** SaaS company later. If you want a planning model, a valuation, or a connected source system, that is a different project — and this file should stay the thing that refuses it.

---

## 7. Citation index

| Claim in this note | Path |
|---|---|
| Constitution, admission, bounds-before-benefits, adapter boundary | `docs/ARCHITECTURE.md` |
| Instrument state, overclaims, sequenced craft vs physics | `PRODUCT_ASSESSMENT.md` |
| Owner demo review, overnight table, “not an MVP” | `PROJECT_STATUS.md` |
| Findings 10–26, suggested physics order | `docs/FINDINGS.md` |
| Original ask, two-layer claim, Q1–Q5 | `docs/BRIEF.md` |
| FIBC-60, SKSG, ARR-path vs rates, scope condition | `docs/KPI-SUFFICIENCY.md`, `research.js`, `research-study.js` |
| Matched construction, observability window, sunk vs forward | `docs/STATE-SUFFICIENCY.md` |
| Matched NRR tie; Class A/B; LAND/RAMP deferred | `docs/MATCHED-NRR.md` |
| Coefficient ≠ KPI; calibrate | `docs/MEASUREMENT.md`, `kpi.js` |
| Vintage reading rules | `docs/COHORTS.md`, `cohorts.js` |
| Appendix substrate | `docs/NOTEBOOK_TABLE_SPEC.md`, `notebook.js` |
| Capital as measured distance | `docs/CAPITAL-LOOP.md`, `capital.js` |
| Tokens; not Frends LAND/RAMP IA | `docs/DESIGN.md` |
| Trust-spine vocabulary (PR #7) | `docs/TRUST-SPINE.md` on `cursor/trust-spine-t0-t1-5af1` |
| Equations, optional coefficients, derived object | `engine.js` (`derived.*`, `TAXONOMY`, `run`) |
| System residuals still EBITA-shaped | `systemstate.js`, `pulse.js` |

Reproduce the research numbers: `node research-study.js`, `node research-checks.js`, `node state-sufficiency.js`, `node checks.js`. Default Year-5 ARR checksum: `node notebook-checks.js` / Appendix month 60.

---

*SaaS Physics v0.4 engine · v1 diligence instrument · Default world = v0.3 · illustrative assumptions · no real company data · no valuation · no commercialisation. Intery methodology IP: analyse any SaaS opening state later without rewriting Layer A.*
