# SaaS Physics — owner review (demo, not a product build)

*Updated 11 September 2026 after A1 + overnight items 1–6. Owner-facing status, not a launch plan. The post-build assessment, philosophy, overclaim flags and sequenced roadmap are in [`PRODUCT_ASSESSMENT.md`](PRODUCT_ASSESSMENT.md). Read the overnight sequence against this branch; the 11 September baseline below `main` was `ba98265`.*

---

## Overnight sequence — A1 then CoS+CFO items 1–6

Same branch / PR. Constitution: one mechanism at a time; null default reproduces prior; bounds before benefits. No R&D lag, valuation, auth, deploy, or real-book adapter.

| Step | Item | Status |
|---|---|---|
| 0 | **A1** acquisition nonlinearity / diminishing S&M | done (v0.4) |
| 1 | **B1+B2** opening-state controls + `kpi.calibrate()` UI | done — zero new physics |
| 2 | Cash constrains S&M | done — null = unconstrained (prior) |
| 3 | Deferred revenue / billings → FCF ≠ EBITA | done — null = FCF=EBITA (prior) |
| 4 | Expansion cost (`expansionCacPerARR`) | done — 0 = free (prior) |
| 5 | Logo vs contraction | done — null = no customers (prior) |
| 6 | Age/vintage editor on screen | done — default flat; Scenario 6 untouched |

---

## Overnight build B1+B2 — opening state + inverse calibration

Zero new physics. The engine already accepted `{openingARR, openingCash, openingCohorts[]}`; `kpi.js` already had `calibrate()`. This step only exposes both on the v1 rail.

**B1.** Opening ARR, opening cash, and a three-share vintage mix (ages 0 / 12 / 24). Default remains one age-0 €20m / €10m cash cohort, so `expStart` stays `undefined` and every prior check, attribution gate and scenario stays comparable. Scenario 6 / the calibrated pair lock the sliders and keep their own constructions. No adapter, no file, no company name.

**B2.** Inverse-calibration box calls `K.calibrate(targetGRR, targetExpansion)` and writes `persistenceAnnual` + `expansionCoefficientAnnual`. Outputs are labelled **coefficients, not reported KPIs**. Refused when bands are not flat (check 34). Flat-law closed form only.

### How to demo

1. Opening state rail: raise Opening ARR to €30m. Month-1 opening ARR moves one-for-one; New ARR is unchanged.
2. Raise Opening cash to €25m. ARR path unchanged; cash path shifts.
3. Set a 50/50 age-0 / age-24 mix. Under the default flat laws the ARR and cash paths do not move (maturity itself creates nothing). Load Scenario 6 to see why mix matters when laws are not flat.
4. Inverse calibration: type measured GRR 90% and expansion 10% → Set coefficients. Persistence becomes ~90.45%, expansion coefficient ~10.56%. Load Scenario 6: the button refuses.

---

## Overnight build — Cash constrains S&M

One coefficient: `smCashReserve` (€). **Null / omitted / Infinity = unconstrained** — S&M is spent in full every month, the prior contract, bit-identical. Finite `r` (including 0): this month’s S&M ≤ `max(0, cashOpening − r)`. New ARR is recomputed from the cash-capped spend. R&D and G&A stay unconstrained (not a financing model).

### How to demo

1. Default: reserve reads **off · unconstrained**. Cash can trough below S&M and spend continues.
2. Set **S&M cash reserve** to €8m, raise S&M. When cash approaches the floor, S&M is cut and New ARR falls with it.
3. System view: the ⊘ Cash → S&M link becomes a present link labelled with the reserve.

---

## Overnight build — Deferred revenue / billings

One coefficient: `billingAdvanceMonths`. **Null / 0 = FCF aliased to EBITA** (prior, bit-identical). Finite `N`: `FCF = EBITA + N × ΔMRR`. Annual prepaid is 12. ARR path unchanged. Growing ARR is cash-generative at the WC line. No tax, capex or debt.

### How to demo

1. Default: Prepaid term **off · FCF=EBITA**. Waterfall shows Δ deferred = €0 and FCF = EBITA.
2. Set Prepaid term to **12 mo**. Month-1 FCF exceeds EBITA by `12 × ΔMRR`. Ending cash is higher. ARR is unchanged.

```bash
node billings-checks.js
```

---

## Overnight build — Expansion cost

One coefficient: `expansionCacPerARR`. **0 / null = free expansion** (prior). Finite `c`: `expansionCost = Expansion ARR × c`, deducted from EBITA. ARR path unchanged. On the matched-NRR pair the cash gap is linear in extra expansion × c.

### How to demo

1. Default: Expansion CAC reads **0.00×**. Waterfall expansion-cost step is €0.
2. Set Expansion CAC to **1.00×**. ARR unchanged; ending cash falls by cumulative expansion ARR. Compare Retention vs Expansion scenarios — the expansion-heavy book now costs more cash.

```bash
node expansion-checks.js
```

---

## Overnight build — Logo vs contraction

One coefficient: `logoRetentionAnnual`. **Null / 0 = no customer stock** (prior). Finite: persistence still drives ARR leakage (ARR and cash paths bit-identical); leakage splits into logo-churn ARR and contraction ARR. Default ARPA €20k → 1,000 opening customers. R12M reports the split when the layer is on.

### How to demo

1. Default: Logo retention **off · no logos**. Leakage is one number.
2. Set Logo retention to **90%**. Customers appear (~1,000 opening). Leakage splits; ARR is unchanged. Raise toward 99% — more logos survive, same ARR.

```bash
node logo-checks.js
```

---

## Overnight build — Age / vintage editor

Zero new physics. Six sliders write the engine’s existing three-band array (Early / Developing / Mature × persistence / expansion). **Default is flat** — bands are omitted so age still creates nothing. Scenario 6 keeps the shared `SCEN6_BANDS` object; the editor always copies. Inverse calibration still refuses when bands are not flat.

### How to demo

1. Default: every tenure slider matches the scalars. Attribution still valid.
2. Pull Developing persistence down. ARR path changes; calibration refuses; attribution gates off.
3. Load Scenario 6: tenure sliders lock and show the shared profile.

```bash
node age-checks.js
```

---

### Checks to run

```bash
node checks.js                 # integrity checks including OPEN + CASHSM + DR
node opening-checks.js         # B1+B2 UI contract + calibrate identity
node cash-checks.js            # S&M cash-reserve null default + bound
node billings-checks.js        # prepaid term null default + FCF split
node mrr-native-checks.js
node basis-checks.js
node clarity-checks.js
node attribution-checks.js
node research-checks.js
```

---

## Overnight build A1 — acquisition nonlinearity (v0.4)

Harri picked **A1** (Finding 10), then expanded the overnight scope to B1+B2 and roadmap items 2–6 on this same PR.

**What changed.** One transition coefficient, `acqSaturationSpend` (`k`, €/month). Finite `k` saturates New ARR:

```
New ARR = (k / cacPerARR) × S&M / (S&M + k)     // also: average CAC = cacPerARR × (1 + S&M/k)
```

**Null default preserves prior behavior.** `k` omitted, null, 0 or Infinity is the exact v0.3 linear generator `New ARR = S&M ÷ cacPerARR`. Integrity check **NL · Null / omitted / 0 / ∞ saturation is bit-identical to the v0.3 linear generator** compares full 60-month / 61-cohort trajectories. Stated CAC payback, GM-does-not-create-ARR, and every pre-existing suite stay on that linear path.

**Not in the A1 commit** (landed later on this same PR): opening-state sliders, inverse-calibration box. **Still out:** adapter, auth, valuation, R&D → retention, a seventh canonical scenario, deploy-as-product.

### How to demo

```bash
node build.js
open saas-physics-v1.html          # or File → Open
```

1. On load, Experiment equals Base. Saturation spend reads **off · linear**. Year-5 ARR is still €62.93m. This *is* last night's company.
2. Forces rail → **Saturation spend** → set **€1.5m**. New ARR drops below the linear €0.75m/mo (you are already part-way up the curve at €900k S&M).
3. Raise **S&M** toward €2.5m. New ARR flattens toward `A_max = k / cacPerARR` (€1.25m/mo at these settings). Cash keeps paying full S&M. That is *stop*.
4. Reset saturation to off. Doubling S&M doubles New ARR again.
5. System view: the New ARR pipe is labelled `linear · unbounded (k off)` or `saturates · k=… · A_max=…`.

### Checks to run

```bash
node checks.js                 # 66 integrity (prior + NL + OPEN + CASHSM + DR + more)
node opening-checks.js
node cash-checks.js
node billings-checks.js
node expansion-checks.js
node logo-checks.js
node age-checks.js
node mrr-native-checks.js
node basis-checks.js
node clarity-checks.js
node attribution-checks.js
node research-checks.js
```

---

*The 11 September review below was the pre-overnight baseline. A1 (Fork A), B1+B2 (Fork B), and items 2–6 all landed on this PR. Next work is craft and language, not another coefficient and not commercialization — [`PRODUCT_ASSESSMENT.md`](PRODUCT_ASSESSMENT.md).*

---

This note is a status brief, not a vision document. Every claim below is taken from `README.md`, `docs/`, or code that was re-run for this review. Where the repo is silent, it says so.

**Verdict in one line.** A serious, check-backed *economic instrument* with a crowded first demo UI. Default world unchanged (Year-5 ARR €62.93m). Optional bounds are real. Not an MVP of a commercial SaaS. The binding constraint is now grouping and language on the rail, not a missing coefficient.

---

## 1. What the product is

**Stated problem.** Headline SaaS KPIs compress a company into a few ratios. Those ratios are easy to type into a spreadsheet and easy to treat as if they *were* the business. This project treats a SaaS company as a physical system — a stock of recurring revenue held by a portfolio of cohorts — and asks one question (`README.md`, `docs/BRIEF.md`):

> What kind of company does a given set of operating assumptions create over 60 months?

**Stated user.** A SaaS CFO. The builder’s brief is explicit: the goal is not a reporting tool. It is to reason about SaaS economics from the mechanism up, and to have a sparring instrument that argues back (`docs/BRIEF.md` §1).

**Stated value.** NRR, growth, EBITA margin, CAC payback, burn and cash are *outputs*. Company ARR is only ever the sum of cohorts. Transition coefficients (persistence, expansion, CAC/ARR, gross margin) are not the KPIs of similar name. A 90% persistence coefficient measures as 89.56% R12M GRR; that gap is a within-period interaction, not an error (`docs/MEASUREMENT.md`).

**What it is not, by written decision** (`README.md`, Method overlay in `v1.template.html`):

enterprise value, multiples, 3D, real company data, price, usage, debt, tax, capex, pipeline, headcount, probabilistic simulation, AI commentary, auth, deploy-as-product.

Optional and **off at the default** (do not read as “the company now has these”): saturation, cash-constrains-S&M, prepaid billings (smooth, not invoices), expansion CAC, logo vs contraction split, opening-state / tenure editor.

The standing rule: prove the physics before building the product. Weaknesses are filed in `docs/FINDINGS.md`, not silently patched.

---

## 2. Current maturity — demo, not MVP

Call it a **first demo of a research instrument**, not an MVP.

| Layer | Maturity | Evidence |
|---|---|---|
| Economic engine (v0.4) | Unusually complete for a demo | `engine.js` + `kpi.js` + `integrity.js`. 66/66 integrity checks. Optional overnight coefficients are null at the default, so the shipped world is still v0.3. Four model versions, each reproducing the last exactly. |
| Research programme | Complete on the declared domain | Phase 0/1 observability / KPI-sufficiency gate has run. Decision recorded: proceed to acquisition-nonlinearity design (`docs/KPI-SUFFICIENCY.md`, `docs/ARCHITECTURE.md`). |
| v1 product surface | Shippable as a *local* demo | Single-file `saas-physics-v1.html`. Four actions: Observe → Change → Compare → Inspect. Six canonical scenarios. MRR ⇄ ARR switch. Experiment attribution. Method overlay. |
| Earlier surfaces | Archive, kept inspectable | `saas-physics-visual-1.html` (living system). `saas-physics-prototype-0.html` (numeric instrument). Pulse / intra-month bridge: rejected, documented in `docs/PULSE.md`, not in v1. |
| Commercial product | Not started | No accounts, no persistence of experiments, no real-data path, no deploy, no pricing, no telemetry, no license. Private repo, empty homepage. |

### Implemented (real, not stubbed)

- Deterministic 60-month cohort engine. Opening base may be several vintages (`engine.js` `DEFAULT_START.openingCohorts`). Age bands exist (0–11 / 12–23 / 24+); default is **flat** so age carries no dynamics until someone sets them.
- KPI measurement layer with closed-form inverse calibration (`kpi.js` `calibrate`) — **wired into the v1 rail** (B2). Flat-law only; refused when bands are not flat.
- Capital-recovery readout from stamped `acquisitionCost` and cumulative gross profit (`capital.js`). CAC payback is a measured crossing, not a typed-in ratio.
- System-map state extraction (`systemstate.js`) and MRR/ARR presentation transform (`basis.js`). Neither adds physics.
- v1 UI: Company (two planes: recurring stock, cash), System (causal topology with ⊘ for absent links), Scenarios 1–6, Inspect (click a cohort). Sliders for S&M, persistence, expansion, CAC/ARR, saturation, GM, R&D, G&A, plus opening ARR/cash/vintage mix and inverse calibration. Play/scrub over 60 months. Only persisted preference: `localStorage` key `saas-physics-basis`.
- Six canonical scenarios in `v1.template.html`: Retention, Expansion, Acquisition efficiency, Margin, Efficiency vs Spend (same ARR path, different capital), Same KPIs / different history (Scenario 6 — the state-sufficiency construction).
- Check suites, re-run this review, all green:

| Suite | Result |
|---|---|
| `node checks.js` | 66 / 66 |
| `node logo-checks.js` | 4 / 4 |
| `node age-checks.js` | 5 / 5 |
| `node expansion-checks.js` | 4 / 4 |
| `node opening-checks.js` | 9 / 9 |
| `node cash-checks.js` | 5 / 5 |
| `node billings-checks.js` | 5 / 5 |
| `node research-checks.js` | 19 / 19 |
| `node basis-checks.js` | 12 / 12 |
| `node clarity-checks.js` | 46 / 46 |
| `node mrr-native-checks.js` | 20 / 20 |
| `node attribution-checks.js` | 22 / 22 |

### Stubbed, dead, or present in the engine but not on the demo

| Item | Where | Status |
|---|---|---|
| Opening-state adapter (real books → `{openingARR, openingCash, openingCohorts[]}`) | `docs/ARCHITECTURE.md` | **Not implemented. Explicitly out of scope for v1.** |
| Opening ARR / opening cash / vintage mix as v1 controls | v1 rail (B1) | **On the rail.** Default remains one age-0 €20m / €10m cash cohort. Scenario 6 / pair keep their own constructions. |
| Age-band editor | v1 rail (item 6) | **On the rail.** Default flat. Scenario 6 keeps the shared `SCEN6_BANDS` array; the editor copies, never mutates it. |
| `K.calibrate()` | v1 rail (B2) | **Wired.** Types measured GRR / expansion; writes coefficients. Refused when bands are not flat. |
| `PRESETS` (`Better retention`, `Growth through spend`, …) | `v1.template.html` | **Defined, never referenced.** Dead code. Canonical scenarios replaced them. |
| Playwright accept tests | `clarity-accept.js`, `attribution-accept.js` | Real tests, **not portable**. Hard-code `file:///home/user/experiments/saas-physics/…` and `/opt/pw-browsers/chromium`. `playwright` is not in `package.json`. |
| CI, license, `.gitignore`, deploy | repo root | **Absent.** |
| Auth, multi-tenant, billing, save/share of an experiment | — | **Absent by design**, not stubbed. |

**Historical documents.** `docs/BRIEF.md` is the original brief (check counts in its body are of their time; it now carries a dated header). Archive docs (`docs/PULSE.md`, `docs/RESULTS.md`, `docs/CAPITAL-LOOP.md`, `visual.template.html`) describe earlier surfaces and are not rewritten as if they were the current product. Current next-work is [`PRODUCT_ASSESSMENT.md`](PRODUCT_ASSESSMENT.md) and `docs/FINDINGS.md` “Suggested order.”

---

## 3. Architecture and stack

No framework. No npm dependencies. Node for CLI; the browser runs the same modules inlined.

```
assumptions + opening state
        │
        ▼
 Layer A   engine.js     world: monthly MRR transition, cohorts, P&L, cash
        │  events only
        ▼
 Layer B   kpi.js        measurements: R12M GRR / expansion / NRR, forward GP (FIBC-60)
        │
        ├── integrity.js     66 economic / measurement / state assertions
        ├── capital.js       payback distance (derived)
        ├── systemstate.js   one-month System readout (derived)
        └── basis.js         MRR ⇄ ARR display (derived; never mutates the engine)

build.js ──► saas-physics-v1.html          CFO instrument (product)
         ──► saas-physics-visual-1.html    research archive
         ──► saas-physics-prototype-0.html research archive
```

**Engine contract.** `E.run(assumptions, start, horizon)` is the only entry point. Base is a frozen assumption object; Experiment is a copy. Nothing in the engine knows which scenario it is running. Display currency is euro in the UI; the engine itself has no company, product, fiscal calendar, or chart of accounts (`docs/ARCHITECTURE.md` “Engine portability”).

**Development constitution** (`docs/ARCHITECTURE.md`). A new mechanism must start from a blocked CFO question, add one minimum mechanism, keep a null default that reproduces the previous version, add a named integrity check, update the System map, and re-run the observability gate if hidden state changes. **Bounds before benefits:** a constraint on an already-too-optimistic mechanism needs less evidence than a new claimed benefit (e.g. R&D → retention).

**Size (source, not built HTML).** ~4.3k lines of JS (engine 658, kpi 316, integrity 413, v1 template 2,249) plus ~3.4k lines of docs. History was merged from `intery-oy/experiments` on 2 September 2026.

---

## 4. How to run the demo

**No deployed URL** is recorded. The GitHub repo is private, `homepageUrl` is empty, there is no `.github/` workflow, and GitHub Pages is not accessible from this review. Demo = local file.

```bash
git clone git@github.com:intery-oy/saas-physics.git
cd saas-physics
node build.js                 # rebuilds the three HTML files from templates + JS
open saas-physics-v1.html     # or any browser: File → Open
```

No `npm install`. Google Fonts load from the network; everything else is in the file.

**Useful CLI (offline, same engine):**

```bash
node checks.js              # 66 integrity checks
node opening-checks.js cash-checks.js billings-checks.js expansion-checks.js logo-checks.js age-checks.js
node research-checks.js     # 19 Phase 0/1 checks (includes Scenario 6 same-world gate)
node scenarios.js           # Scenarios A–E + layer-separation printout
node state-sufficiency.js   # the matched-KPI / different-future experiment
npm run report              # integrity + overnight suites + basis + state-sufficiency + scenarios
```

`package.json` scripts cover only a subset (`check`, `basis`, `scenarios`, `build`, `state`, `report`). The README lists the rest as raw `node …` commands.

**Playwright accept tests will not run in a fresh checkout** until the hardcoded experiments-repo path and Chromium path are replaced. Do not treat “all 154+ checks pass” as including those two files unless the environment matches the old path.

**Demo path for a visitor.** Open v1 → Method → Scenarios 1–6 in order, especially **5 (same ARR, different capital)** and **6 (same KPIs, different history)**. Scrub month 0 → 60. Toggle MRR ⇄ ARR. Click a cohort. Do not present Prototype 0 or Visual 1 unless someone asks how the engine was inspected.

---

## 5. Gaps, risks, and what is next

Fork A (A1), Fork B (B1+B2), and overnight items 2–6 **have landed**. The table that used to say “pick one fork” is historical. Sequenced next work is in [`PRODUCT_ASSESSMENT.md`](PRODUCT_ASSESSMENT.md) §5.

### Risks if this demo is shown as “the company”

These are true **at the default** (null / off). Several have an optional bound; turning it on does not make the default world a planning model. Overclaim list: `PRODUCT_ASSESSMENT.md` §4.

1. **It can always buy growth *until saturation is set*.** Default `New ARR = S&M ÷ cacPerARR` is linear and unbounded (Finding 10). There is still no “spend more” canonical scenario. A CFO who never touches Saturation spend will conclude every growth push pays.
2. **Cash never constrains spend *until a reserve is set*.** The trough on the default run is €6.10m at month 13; nothing throttles S&M. `smCashReserve` is the optional bound. R&D and G&A stay uncapped either way.
3. **FCF = EBITA *until a prepaid term is set*.** Default has no deferred revenue (Finding 15). The optional form is a **smooth** `N×ΔMRR` approximation, not invoices. Tax, capex, debt still out.
4. **Expansion is free *until expansion CAC is set*, and still uncapped** (Findings 13–14). Matched-NRR pair still ties on ARR; cash separates only when `c > 0`. Expansion saturation is the remaining ARR-path bound.
5. **R&D buys nothing** (Finding 16). Still true. The only modelled conclusion about product spend is “spend less.” The UI says so; a hurried demo can still be misread as a verdict on R&D.
6. **One opening vintage *until the mix or tenure is set*** (Finding 19). Default overstates decay of the existing book (~30% of Year-5 ARR on the baseline). Mix under *flat* laws is a no-op on ARR — do not demo it as “older customers are more valuable” unless the bands say so.
7. **Logo retention does not change ARR.** Persistence still drives leakage. Easy to present “98% logo retention” as a healthy book while 10% of ARR still leaks as contraction.
8. **Scenario 6’s 23.4% SKSG is conditional** on a *non-monotone* tenure profile. Under monotone laws a matched construction was infeasible. The model cannot say which regime a real company is in (`docs/KPI-SUFFICIENCY.md`).
9. **Trust defect class already bitten once.** Interpolated Cash vs snapped-month Cash showed two numbers on one screen; fixed via `selectedMonth()`. Any new surface that prints a month-exact figure must use that accessor.
10. **The rail is now the product defect.** Too many optional knobs look like “the company.” A guest cannot tell which sliders are off-by-default bounds.

### Next builds (sequenced — not a dump)

Do **not** pick another physics fork until the rail is grouped. Full sequence: `PRODUCT_ASSESSMENT.md` §5.

**(a) Instrument craft.** (1) Group “the company” vs “bounds off by default.” (2) Attribution honesty when opening/tenure is non-default. (3) `systemstate.js` / `pulse.js` stay default-only or move together. (4) Portable accept tests. (5) Then, one at a time: expansion saturation → acquisition lag → price → R&D-as-intervention.

**(b) Visual / UX.** Information architecture first (collapse optional laws), then one claim per chart, then space/type, then off-states that read “off” not “0.00,” then a 60-second guest path. Not a landing page.

### Still out (wrong size, or forbidden)

| Ask | Why not |
|---|---|
| Opening-state adapter / Stripe / billing CSV | Documented out of v1. Contaminates the portable engine if rushed. |
| Price (Finding 21) | Highest-leverage *real* CFO control; not specified, do not invent a form. |
| R&D intervention with lag (Finding 16) | Benefit, not bound. User-owned hypothesis, not a SaaS law. |
| Auth, tenancy, pricing page, telemetry product | Invents a commercial product the standing rule deferred. |
| Valuation / multiples | Explicitly out. |
| “Fix” FINDINGS by patching equations | Against the constitution. |
| Shareable experiment URL | Useful later; not commercialization, but not the next craft item either. |

Hygiene still unpaid: portable Playwright paths, one GitHub Action for the Node suites, remove or wire `PRESETS`.

---

## 6. What a SaaS CFO needs later for unit economics, pricing, and ICP

Nothing in this repo is a commercial product. There are no users, prices, conversion rates, or cost-to-serve figures for SaaS Physics itself. **Do not start commercialization** (auth, billing, deploy-as-product, a pricing page). The notes below are diagnostic — *what the current work already implies*, and *what would have to be true much later* to talk about pricing and ICP without inventing them.

### What the illustrative company already is (not an ICP claim)

Default run, 60 months (`docs/RESULTS.md`, `docs/BRIEF.md`):

| Input (typed) | Default |
|---|---|
| Opening ARR / cash | €20.0m / €10.0m |
| S&M / R&D / G&A | €900k / €700k / €350k per month (€23.4m / year opex) |
| CAC / New ARR · GM · persistence · expansion | 1.20× · 80% · 90% · 10% |

| Output (not typed) | Baseline |
|---|---|
| New ARR | €0.75m / month (€9.0m per year of spend) |
| CAC payback | 18.0 months |
| R12M NRR / GRR / expansion | 99.00% / 89.56% / 9.44% |
| Year-5 ARR | €62.93m |
| Year-5 FCF · ending cash · trough | €23.58m · €59.57m · €6.10m (month 13) |

That is a **mid-market B2B SaaS silhouette** (~€20m ARR, heavy fixed opex, ~18-month payback, NRR just under 100%). It is illustrative. It is not a claimed ideal customer.

### Blocked CFO questions the engine cannot answer today

From `docs/FINDINGS.md` / the Method overlay — these are the questions a pricing or planning conversation will hit:

| # | Question | Status after this build |
|---|---|---|
| 10 | When should we stop increasing S&M? | Optional: set `acqSaturationSpend`. Default still linear. |
| 14 | What does expansion cost? | Optional: set `expansionCacPerARR`. Default still free. No saturation (Finding 13). |
| 15 | How does billing timing change cash vs EBITA? | Optional: set `billingAdvanceMonths`. Smooth `N×ΔMRR`, not invoices. Default still FCF = EBITA. |
| 16 | What is the return on product investment? | Still blocked. R&D reaches no valve. |
| 18 | How much of leakage is logo vs contraction? | Optional: set `logoRetentionAnnual`. Disclosure only — ARR unchanged. |
| 21 | How much of a revenue change came from price? | Still blocked. No price. |

A later commercial claim that “this replaces your planning model” is false until several of these are addressed. A claim that “this is a sparring instrument for mechanism-up questions” is true now.

### Results that already change how a CFO should read a board pack

These are computed, checked, and demoable. They are the seed of an ICP *hypothesis*, not a segment:

1. **ARR path ≠ capital path** (Scenario 5, Finding 11 reclassified). Two routes to the same ARR: efficiency vs spend. The difference lives in cash, cumulative S&M, and payback — correctly *not* in the ARR stock.
2. **Matched headline KPIs can hide ~23% of forward installed-base gross profit** (Scenario 6, SKSG 23.43%, order-invariant). Conditional on non-monotone tenure. Every company already has the vintage data that identifies it; GRR/NRR do not.
3. **On this domain, twelve months of ARR history identifies the hidden state; GRR/expansion never do** (`docs/KPI-SUFFICIENCY.md`). Cheap implication: ask for the ARR path, not a richer retention dashboard.
4. **Coefficients ≠ reported KPIs.** Inverse calibration exists. A later “paste a board pack” flow is a UI on existing maths, not new science — and only under flat laws.

### What is missing before anyone can price this or name an ICP

Do not invent packages. The gaps are empirical:

| Later need | What the repo would have to contain | What not to build yet |
|---|---|---|
| ICP | Who sat through Scenarios 5 and 6 and changed a decision; whether they had non-monotone tenure in *their* data; CFO vs FP&A vs PE/operator. | A persona workshop. The brief already says SaaS CFO. |
| Willingness to pay | Whether the buyer is paying for *mechanism literacy*, a recurring planning seat, or a one-off diagnostic. The standing rule says the first. | A pricing page. |
| Unit economics of *this* tool | Cost-to-serve is currently ~zero (static HTML, no backend). The real cost is research time and Harri’s attention. | Usage-based billing, seats, SSO. |
| Calibration to real books | B1+B2 are on the rail (typed opening + `K.calibrate()`). Later, an adapter that emits `{openingARR, openingCash, openingCohorts[]}` and **never** writes into `engine.js`. | Bending the engine around a billing system (`docs/ARCHITECTURE.md`). |
| “Is this my shape?” | A one-screen card of the illustrative defaults vs the visitor’s typed opening state (opex ratio, payback, NRR, cash trough). | Rule-of-40 scores, quality scores, or any invented index. The constitution forbids that language. |

**ICP hypothesis, grounded only in what was built:** the person who gets value today is a SaaS CFO (or PE/operator) who already thinks in cohorts, is willing to treat GRR/NRR as measurements, and has a question the six scenarios can land — especially *same ARR / different capital* and *same KPIs / different history*. The person who will bounce is anyone who wants a forecast, a valuation, or a connected source system. That split is already written down; it does not need a new story.

---

## Sources

- Post-build assessment: `PRODUCT_ASSESSMENT.md`
- Product intent: `README.md`, `docs/BRIEF.md`, Method overlay in `v1.template.html`
- Equations and constitution: `docs/ARCHITECTURE.md`, `docs/MEASUREMENT.md`
- Results and baseline numbers: `docs/RESULTS.md` (regenerate with `npm run report`)
- Open breaks and blocked questions: `docs/FINDINGS.md`
- Flagship experiments: `docs/STATE-SUFFICIENCY.md`, `docs/KPI-SUFFICIENCY.md`, `docs/MATCHED-NRR.md`, `docs/CAPITAL-LOOP.md`
- Engine / UI: `engine.js`, `kpi.js`, `integrity.js`, `v1.template.html`, `build.js`

*SaaS Physics v0.4 engine · v1 demo surface · default world = v0.3 · illustrative assumptions · no real company data · no valuation · no commercialization.*
