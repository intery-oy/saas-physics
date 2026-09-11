# SaaS Physics — owner review (demo, not a product build)

*Prepared 11 September 2026 for Harri, Chief of Staff, and a SaaS CFO. Review only — no new physics, no product surface. Read against commit `ba98265` on `main`.*

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
| 6 | Age/vintage editor on screen | queued |

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

**Not in this run:** opening-state sliders, inverse-calibration box, adapter, auth, valuation, R&D → retention, a seventh canonical scenario.

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
node checks.js                 # 35 prior + 9 NL (Finding 10) + 4 OPEN integrity checks
node opening-checks.js
node mrr-native-checks.js
node basis-checks.js
node clarity-checks.js
node attribution-checks.js
node research-checks.js
```

---

*The 11 September review below is the baseline. A1 is Fork A; B1+B2 are Fork B on the same demo. Items 2–6 follow on this PR.*

---

This note is a status brief, not a vision document. Every claim below is taken from `README.md`, `docs/`, or code that was re-run for this review. Where the repo is silent, it says so.

**Verdict in one line.** A serious, check-backed *economic instrument* with a first demo UI. Not an MVP of a commercial SaaS. The overnight question is which fork to take: **advance the frozen physics**, or **make the existing demo something a visiting CFO can actually set to their shape**.

---

## 1. What the product is

**Stated problem.** Headline SaaS KPIs compress a company into a few ratios. Those ratios are easy to type into a spreadsheet and easy to treat as if they *were* the business. This project treats a SaaS company as a physical system — a stock of recurring revenue held by a portfolio of cohorts — and asks one question (`README.md`, `docs/BRIEF.md`):

> What kind of company does a given set of operating assumptions create over 60 months?

**Stated user.** A SaaS CFO. The builder’s brief is explicit: the goal is not a reporting tool. It is to reason about SaaS economics from the mechanism up, and to have a sparring instrument that argues back (`docs/BRIEF.md` §1).

**Stated value.** NRR, growth, EBITA margin, CAC payback, burn and cash are *outputs*. Company ARR is only ever the sum of cohorts. Transition coefficients (persistence, expansion, CAC/ARR, gross margin) are not the KPIs of similar name. A 90% persistence coefficient measures as 89.56% R12M GRR; that gap is a within-period interaction, not an error (`docs/MEASUREMENT.md`).

**What it is not, by written decision** (`README.md`, Method overlay in `v1.template.html`):

enterprise value, multiples, 3D, real company data, customer-level modelling, churn/contraction split, price, usage, working capital, debt, tax, capex, pipeline, headcount, probabilistic simulation, AI commentary.

The standing rule: prove the physics before building the product. Weaknesses are filed in `docs/FINDINGS.md`, not silently patched.

---

## 2. Current maturity — demo, not MVP

Call it a **first demo of a research instrument**, not an MVP.

| Layer | Maturity | Evidence |
|---|---|---|
| Economic engine (v0.3) | Unusually complete for a demo | `engine.js` + `kpi.js` + `integrity.js`. 35/35 integrity checks re-run green this review. Four model versions, each reproducing the last exactly. |
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
| Age-band editor | Engine has six transition parameters | **Only Scenario 6 sets bands.** No general UI to give age economic meaning. (Item 6 in this PR.) |
| `K.calibrate()` | v1 rail (B2) | **Wired.** Types measured GRR / expansion; writes coefficients. Refused when bands are not flat. |
| `PRESETS` (`Better retention`, `Growth through spend`, …) | `v1.template.html` | **Defined, never referenced.** Dead code. Canonical scenarios replaced them. |
| Playwright accept tests | `clarity-accept.js`, `attribution-accept.js` | Real tests, **not portable**. Hard-code `file:///home/user/experiments/saas-physics/…` and `/opt/pw-browsers/chromium`. `playwright` is not in `package.json`. |
| CI, license, `.gitignore`, deploy | repo root | **Absent.** |
| Auth, multi-tenant, billing, save/share of an experiment | — | **Absent by design**, not stubbed. |

**Stale documents (do not treat as current plan).** `docs/FINDINGS.md` “Suggested order” still lists the observability experiment as recommended next — that experiment has already been run. `docs/BRIEF.md` still says 17 research checks; the suite is 19. The v1 Method overlay still says the engine stores recurring state in ARR; `engine.js` is now MRR-native with ARR as a derived 12× view.

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
        ├── integrity.js     35 economic / measurement / state assertions
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
node checks.js              # 35 integrity checks
node research-checks.js     # 19 Phase 0/1 checks (includes Scenario 6 same-world gate)
node scenarios.js           # Scenarios A–E + layer-separation printout
node state-sufficiency.js   # the matched-KPI / different-future experiment
npm run report              # checks + basis + state-sufficiency + scenarios
```

`package.json` scripts cover only a subset (`check`, `basis`, `scenarios`, `build`, `state`, `report`). The README lists the rest as raw `node …` commands.

**Playwright accept tests will not run in a fresh checkout** until the hardcoded experiments-repo path and Chromium path are replaced. Do not treat “all 154+ checks pass” as including those two files unless the environment matches the old path.

**Demo path for a visitor.** Open v1 → Method → Scenarios 1–6 in order, especially **5 (same ARR, different capital)** and **6 (same KPIs, different history)**. Scrub month 0 → 60. Toggle MRR ⇄ ARR. Click a cohort. Do not present Prototype 0 or Visual 1 unless someone asks how the engine was inspected.

---

## 5. Gaps, risks, and overnight-sized next builds

### Risks if this demo is shown as “the company”

1. **It can always buy growth.** `New ARR = S&M ÷ cacPerARR` is linear and unbounded (Finding 10). There is deliberately no “spend more” canonical scenario, but the S&M slider still has no wrong setting. A CFO who treats the demo as a planning model will conclude every growth push pays.
2. **Cash never constrains spend.** The trough on the default run is €6.10m at month 13; nothing throttles S&M. Cash → S&M is drawn as ⊘ on the System map.
3. **FCF = EBITA.** No deferred revenue, billings, or working capital (Finding 15). Real subscription growth is often cash-*generative* at the WC line. Every growth path here looks more cash-expensive than a prepaid SaaS.
4. **Expansion is free and uncapped** (Findings 13–14). Matched-NRR businesses are indistinguishable on ARR, GP, cash.
5. **R&D buys nothing** (Finding 16). The only modelled conclusion about product spend is “spend less.” The UI says so; a hurried demo can still be misread as a verdict on R&D.
6. **One opening vintage by default** (Finding 19). A real €20m book is a mix. The default overstates decay of the existing book (~30% of Year-5 ARR on the baseline).
7. **Scenario 6’s 23.4% SKSG is conditional** on a *non-monotone* tenure profile. Under monotone laws a matched construction was infeasible. The model cannot say which regime a real company is in (`docs/KPI-SUFFICIENCY.md`).
8. **Trust defect class already bitten once.** Interpolated Cash vs snapped-month Cash showed two numbers on one screen; fixed via `selectedMonth()`. Any new surface that prints a month-exact figure must use that accessor.

### Highest-leverage next builds (overnight-sized)

Pick **one** fork. Both are in-scope for a single cloud-agent session. Doing both in one night will dilute the constitution (one mechanism, one check).

#### Fork A — advance the physics (the project’s own next move)

**A1. Acquisition nonlinearity (Finding 10).** Recommended by the Phase 0/1 gate: *proceed to acquisition-nonlinearity design, a bound not a benefit.*

- One saturating form, e.g. `New ARR = A_max × S&M / (S&M + k)`, or `cacPerARR` rising in spend.
- Null / default must reproduce today’s linear generator exactly (admission criterion 4).
- New named integrity check; System map loses the “always buy growth” ⊘ or marks the new bound; no “buy more growth” scenario until the bound exists.
- Do **not** add R&D → retention in the same session (that is a claimed benefit; higher evidence bar).

#### Fork B — make the demo a CFO can set to a shape (no new physics)

The engine already accepts opening state. The demo does not expose it. This is the gap a visiting CFO hits in the first minute: “this is not my book.”

**B1. Opening-state controls on the v1 rail (Finding 19).** Sliders or fields for opening ARR, opening cash, and a small vintage mix (`[{arr, age}, …]`). Default remains one age-0 €20m / €10m cash cohort so every existing check and scenario stays comparable. Scenario 6 keeps its own construction. No adapter, no file upload, no company names.

**B2. Inverse-calibration box (already written).** Surface `K.calibrate(targetGRR, targetExpansion)` so a CFO can type reported R12M GRR and expansion and *see* the coefficients the engine would need. Label them as coefficients, not as “your GRR.” Flat-law only; refuse or disclose when bands are not flat (check 34 already encodes this).

**B3. Shareable experiment URL.** Serialise assumptions + opening state + active scenario + basis into the query string. Makes the demo sendable without accounts. Overnight if B1 exists; otherwise it only shares the current sliders.

#### Do not do overnight (wrong size, or forbidden by the constitution)

| Ask | Why not tonight |
|---|---|
| Opening-state adapter / Stripe / billing CSV | Documented out of v1. Contaminates the portable engine if rushed. |
| Customer count + logo vs contraction (Finding 18) | Real physics, but larger than one mechanism and unlocks ARPA later — not a night. |
| Deferred revenue / true FCF (Finding 15) | Changes every cash number; needs its own iteration. |
| Price (Finding 21) | Highest-leverage *real* CFO control; not specified, do not invent a form. |
| R&D intervention with lag (Finding 16) | Benefit, not bound. User-owned hypothesis, not a SaaS law. |
| Auth, tenancy, pricing page, telemetry product | Invents a commercial product the standing rule deferred. |
| Valuation / multiples | Explicitly out until several physics items land. |
| “Fix” FINDINGS by patching equations | Against the constitution. |

#### Hygiene that fits in the same night as Fork B (not instead of A1)

- Point Playwright accept tests at `path.join(__dirname, 'saas-physics-v1.html')`; add `playwright` as a devDependency or drop the files from the README’s “run it” list.
- One GitHub Action: `node checks.js && node research-checks.js && node basis-checks.js && node clarity-checks.js && node mrr-native-checks.js && node attribution-checks.js`.
- Strike the observability item from `docs/FINDINGS.md` “Suggested order”; point at the constitution’s gate result.
- Remove or wire `PRESETS`.

### Recommended overnight pick

| If the next meeting is… | Pick |
|---|---|
| Advisory / “is the sequencing right?” (`docs/BRIEF.md` Q1–Q5) | **A1** — acquisition nonlinearity. That is the written next physics. |
| Showing the demo to a CFO who will ask “can I put *my* opening book in?” | **B1 + B2**. Highest demo leverage, zero new physics, engine already supports it. |
| Unsure | **B1 + B2.** A1 is the more important scientific step; B1/B2 are what make the first demo usable. Do not start a commercial surface. |

---

## 6. What a SaaS CFO needs later for unit economics, pricing, and ICP

Nothing in this repo is a commercial product. There are no users, prices, conversion rates, or cost-to-serve figures for SaaS Physics itself. The notes below are *what the current work already implies*, and *what would have to be true later* to talk about pricing and ICP without inventing them.

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

| # | Question | Why it is blocked |
|---|---|---|
| 10 | When should we stop increasing S&M? | Acquisition is linear and unbounded. |
| 14 | What does expansion cost? | No CSM / implementation cost on expansion ARR. |
| 15 | How does billing timing change cash vs EBITA? | FCF = EBITA. |
| 16 | What is the return on product investment? | R&D reaches no valve. |
| 18 | How much of leakage is logo vs contraction? | No customers. |
| 21 | How much of a revenue change came from price? | No price. |

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
| Calibration to real books | Inverse calibration + vintage mix (B1/B2). Then, later, an adapter that emits `{openingARR, openingCash, openingCohorts[]}` and **never** writes into `engine.js`. | Bending the engine around a billing system (`docs/ARCHITECTURE.md`). |
| “Is this my shape?” | A one-screen card of the illustrative defaults vs the visitor’s typed opening state (opex ratio, payback, NRR, cash trough). | Rule-of-40 scores, quality scores, or any invented index. The constitution forbids that language. |

**ICP hypothesis, grounded only in what was built:** the person who gets value today is a SaaS CFO (or PE/operator) who already thinks in cohorts, is willing to treat GRR/NRR as measurements, and has a question the six scenarios can land — especially *same ARR / different capital* and *same KPIs / different history*. The person who will bounce is anyone who wants a forecast, a valuation, or a connected source system. That split is already written down; it does not need a new story.

---

## Sources

- Product intent: `README.md`, `docs/BRIEF.md`, Method overlay in `v1.template.html`
- Equations and constitution: `docs/ARCHITECTURE.md`, `docs/MEASUREMENT.md`
- Results and baseline numbers: `docs/RESULTS.md` (regenerate with `npm run report`)
- Open breaks and blocked questions: `docs/FINDINGS.md`
- Flagship experiments: `docs/STATE-SUFFICIENCY.md`, `docs/KPI-SUFFICIENCY.md`, `docs/MATCHED-NRR.md`, `docs/CAPITAL-LOOP.md`
- Engine / UI: `engine.js`, `kpi.js`, `integrity.js`, `v1.template.html`, `build.js`

*SaaS Physics v0.3 engine · v1 demo surface · illustrative assumptions · no real company data · no valuation.*
