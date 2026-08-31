# SaaS Physics — Builder's Brief

*Prepared for advisory review. Model v0.3 · 13 commits · ~2.4k lines of source JS ·
2,779 lines of documentation · 35/35 integrity checks passing · no dependencies.*

A deterministic 60-month cohort engine for a SaaS business, built to answer one question:
**what kind of company does a given set of operating assumptions create?** Everything a CFO
would normally type in — NRR, growth, CAC payback, burn — is an output here, never an input.

---

## 1. Intent and standing rules

The builder is a SaaS CFO. The goal is not a reporting tool — it is to understand SaaS
economics well enough to reason about them from the mechanism up, and to have a sparring
instrument that argues back.

The project treats a SaaS company as a physical system: a stock of recurring revenue held by
a portfolio of cohorts, filled and drained by flows, governed by transition coefficients.
Company ARR is only ever the sum of its cohorts. Aggregates are never asserted; they are summed.

**The standing rule: prove the physics before building the product.** Weaknesses get surfaced
and documented, never quietly patched. No valuation, no multiples, no quality scores, no
probabilistic simulation, no real company data — until the mechanism is sound.

That rule has teeth. Each iteration brief has explicitly forbidden improvement-by-stealth:
*"do not silently improve the economic model"*, *"do not simply rename the discrepancy away"*,
*"do not invent a quality score"*, *"do not use vague language such as 'higher quality'"*. When
a specified model turned out to be weak, it was implemented faithfully and the weakness
written down.

**Deliberately absent:** enterprise value, multiples, 3D, real data, customer-level modelling,
churn/contraction split, pricing, usage, working capital, debt, tax, capex, pipeline,
headcount, probabilistic simulation, AI commentary. Each is a decision, not an oversight.

## 2. Architecture — two layers, kept apart

The central architectural claim: **the business exists first; KPIs are measurements taken from
it. A KPI definition must never become an economic law.**

- **Layer A (`engine.js`, 601 lines)** is the world. Its parameters are *transition
  coefficients* governing how cohort ARR evolves month to month.
- **Layer B (`kpi.js`, 316 lines)** observes that world and reports CFO-facing metrics over a
  frozen twelve-month cohort.

They are not the same objects even where they share a name. The sharpest demonstration: a
**90% persistence coefficient measures as 89.56% R12M GRR**. That gap is not an error and not
rounding — it is the within-period interaction of decay and expansion, derived in closed form.

`engine.js`, `kpi.js` and `integrity.js` (413 lines, 35 checks) are **frozen** — byte-identical
across recent work, verified on every build. Derived modules (`capital.js`, `pulse.js`) add
**no physics**; every quantity is read out of values the frozen engine already stores. Where
the engine does not calculate something, nothing is faked visually — the limitation is
documented instead.

## 3. The engine

Monthly, cohort by cohort, in a fixed and declared order: existing cohorts age and leak, the
survivors expand, then a new cohort is created from the month's acquisition spend. Rates
convert geometrically, so twelve compounded monthly steps reproduce the stated annual figure
exactly. Expansion applies to *retained* ARR, not opening. Revenue comes from the midpoint of
opening and closing, not from closing alone.

| Class | Assumption | Default |
|---|---|---|
| CONTROL | Monthly S&M investment | €900k |
| CONTROL | Monthly R&D investment | €700k |
| CONTROL | Monthly G&A investment | €350k |
| TRANSITION | CAC per €1 of New ARR | 1.20× |
| TRANSITION | Annual persistence coefficient | 90% |
| TRANSITION | Annual expansion coefficient | 10% |
| TRANSITION | Gross margin | 80% |
| STATE | Opening ARR / cash | €20.0m / €10.0m |

Illustrative defaults. No real company data is connected.

**What comes out, unentered** (baseline run, 60 months, 61 cohorts):

| Emergent measure | Value | Why it is not an input |
|---|---|---|
| Year-5 ARR | €62.93m | Sum of 61 cohort balances |
| R12M NRR | 99.00% | Lands exactly on `P × (1 + X)` |
| R12M GRR | 89.56% | Measured, not the 90% coefficient |
| CAC payback | 18.0 months | Output of `CAC/ARR × 12 ÷ GM` |
| Ending cash / trough | €59.57m / €6.10m | Accumulated FCF |

Inverting the acquisition primitive so payback became an output rather than an input was the
single most important correction in the project's history. In v0.1, gross margin generated ARR
— conceptually wrong. Now acquisition productivity decides how much ARR the spend creates, and
gross margin decides how fast that investment is recovered.

## 4. Version lineage — each version reproduces the last exactly

| Version | Change | Note |
|---|---|---|
| v0.1 | Deterministic cohort engine and inspection interface | ARR bridge as an identity, cohort spine, Scenarios A–E |
| v0.2 | Acquisition primitive inverted | CAC payback becomes an output; reproduces v0.1 baseline exactly at `cacPerARR = 1.20` |
| v0.2.1 | Economic engine separated from KPI measurement | Layer A/B split, canonical R12M definitions, closed-form inverse calibration; behaviour unchanged |
| v0.3 | One new state dimension: cohort maturity | Three age bands, flat by default — the default world is exactly v0.2.1, so the model privileges no direction. Acquisition-cost provenance stamped at creation, never read forward |

This exact-reproduction property is deliberate and verified by check, so results stay
comparable across the whole history.

## 5. What has actually held up

35 checks pass on every build. The results worth attention are the ones that could have failed:

- **The cohort spine reconciles** to ~10⁻⁸ euros on €63m across all 60 months. Nothing is faked
  at the aggregate level.
- **Emergence is real.** A 10× S&M probe leaves every R12M retention measure bit-identical at
  every measurement date — acquisition genuinely cannot contaminate retention.
- **Layer separation holds.** The identity `GRR + expansion = NRR` reconciles to 3.3×10⁻¹⁶ at
  all 49 measurement dates. Expansion is provably unable to improve GRR — it monotonically
  worsens it, which turns the interaction effect into a testable prediction rather than an
  assertion.
- **Invertibility.** Target measured KPIs can be reproduced by calibrated coefficients in
  closed form, to nine decimals, without touching acquisition physics.
- **Sunk cost stays sunk.** Doubling historical acquisition cost per cohort at identical New
  ARR leaves forward ARR, gross profit and retention unchanged to €0.0.
- **Lever separation is complete.** Retention changes leakage and nothing else; S&M and
  acquisition productivity change acquisition and nothing else; gross margin changes economics
  and nothing else.

**The most valuable single result — the state sufficiency experiment:** two portfolios with
identical ARR *and* identical trailing KPIs whose existing ARR carries **26.5% different
forward economic content**, purely from age composition. A flat-law control proves maturity
itself creates nothing — the difference only exists when the laws actually vary by age. This is
the project's strongest argument that reported KPIs are an incomplete description of a SaaS
company's state.

## 6. Where the physics break

21 numbered findings are maintained in the repository, 12 still open. Documented deliberately
rather than fixed opportunistically. The most consequential:

| # | Finding | Status |
|---|---|---|
| 10 | **Acquisition is linear and unbounded in S&M.** The model can always buy growth. No capacity, ramp, pipeline, conversion or diminishing returns. It cannot say *stop*. | open |
| 11 | **Efficiency and spend are indistinguishable in ARR.** Two very different businesses produce the same ARR path; only the capital consumed differs. | open |
| 14 | **Expansion is free.** No modelled cost attaches to expansion ARR — structurally asymmetric with acquisition. | open |
| 15 | **FCF = EBITA.** No working capital, deferred revenue, tax or capex. Inverts the cash reality of subscription businesses; pessimistic for a fast grower. | open |
| 16 | **R&D is a cost with no modelled benefit.** Product investment cannot buy retention, so every NRR conclusion is about a company that does not build anything. | open |
| 18 | **Leakage is one number, and there are no customers.** Churn and contraction combined; no logos, no ARPA, no concentration. | open |
| 21 | **There is no price.** Nothing in the model represents what is charged. | open |
| — | Gross margin no longer generates ARR — the one conceptually wrong v0.1 equation | fixed v0.2 |
| 7 | Cohort acquisition cost stamped at creation and never read by a forward transition | fixed v0.3 |

**Two absences the visual work exposed.** Drawing the system in stock-and-flow notation forced
two links to be drawn as *absent*: **cash never constrains S&M** (no financing constraint —
cash can fall to €6.10m and nothing throttles spend), and **R&D reaches neither retention nor
expansion**. Both are honest limitations of the frozen engine, and both are candidate physics.

## 7. The visual track

A parallel track builds on the frozen engine and adds no economics. One shipped interface and
three studies, one of which failed and was kept as a record rather than deleted:

- **Visual Prototype 1 — the living system.** A SaaS company as a mass of cohort strata
  evolving over 60 months, with the Experiment pulling away from a frozen Base ghost when a
  force moves.
- **The capital loop.** Turns CAC payback from a ratio into a measured horizontal distance:
  capital leaves at acquisition, returns gradually as cohort gross profit, and the crossing
  point *is* the payback.
- **Flow / Pulse — rejected.** An intra-month bridge animation that dissolved cohorts into an
  accounting identity and redrew something the numbers already stated. Judged a failed
  prototype and documented as such.
- **Flow as stock and flow — the replacement.** ARR and Cash as stocks, the cohort strata *as*
  the ARR stock, assumptions as valves that are themselves the controls, clouds for the model
  boundary, and the two missing feedbacks drawn with a ⊘.

The rejected study is reachable in the interface, labelled a failed prototype. Negative results
are part of the record.

## 8. How the project is run

- **Freeze then build.** Once a layer is proven it becomes byte-immutable; every build verifies
  zero diff lines against it.
- **Faithful implementation over silent improvement.** A specified model gets built as
  specified; disagreements are recorded in `FINDINGS.md`, not resolved unilaterally in code.
- **Self-correction is on the record.** One documented case: an early three-effect explanation
  of the GRR gap was wrong. An integrity check caught it, the decomposition was rewritten, and
  the error is retained in the findings rather than erased.
- **Infeasibility is a result.** When the first matched-portfolio construction proved
  impossible, the construction changed and the impossibility was written up as a finding.
- **Everything runs offline.** No dependencies; the browser surfaces inline the same modules
  the CLI tests use, so there is exactly one source of truth.

## 9. Where advice would change what happens next

The builder's own ranked next step is an **observability experiment**: can a 24- or 36-month
KPI *history* identify a company's Time-0 state, or is cohort vintage disclosure strictly
necessary? It needs no new physics.

**Q1 — Is the sequencing right?** Current order: observability → expansion cost → customer
count and logo retention → diminishing returns on S&M → expansion saturation → deferred
revenue. Valuation and product design stay out until most of that is done. Is that the right
order for building durable intuition, or is it deferring the thing that would teach the most?

**Q2 — Which absent feedback should close first?** Cash → S&M would give the model a financing
constraint and the ability to say *stop*. R&D → retention would let product investment buy
something. Each is one coefficient. Each also risks turning a clean measurement instrument
into an opinion about SaaS.

**Q3 — When does fidelity stop paying?** The engine is deliberately austere: no customers, no
price, no working capital. At what point does adding realism stop sharpening intuition and
start producing an unfalsifiable model that merely feels right?

**Q4 — Is the state-sufficiency result being pushed hard enough?** Two portfolios, identical
ARR and identical trailing KPIs, 26.5% different forward economic content. If that generalises,
it is a substantive claim about SaaS diligence and reporting. Is it worth developing into a
standalone argument rather than remaining one experiment inside a simulator?

**Q5 — Does the visual track earn its cost?** Roughly a third of the effort has gone into
making the engine visible, including one study that failed outright. Is spatial representation
genuinely producing understanding the numbers do not, or is it absorbing effort that belongs
in the physics?

## 10. Repository

Node, no dependencies. Every study is a runnable script that prints its own reconciliation.

| Command | What it produces |
|---|---|
| `node checks.js` | 35 economic, measurement and state integrity checks |
| `node scenarios.js` | Scenarios A–E and the v0.2 / v0.2.1 experiments |
| `node state-sufficiency.js` | The state sufficiency experiment and its flat-law control |
| `node capital-study.js` | Payback calibration and capital-loop experiments |
| `node pulse-study.js` | Intra-month law and reconciliation |
| `node build.js` | Both single-file browser surfaces |

Nine documents totalling 2,779 lines carry the reasoning. `ARCHITECTURE.md` holds every
equation; `MEASUREMENT.md` covers reality-versus-measurement and the two-layer split;
`STATE-SUFFICIENCY.md` and `MATCHED-NRR.md` hold the two experiments that most constrain what
the model can and cannot distinguish; `FINDINGS.md` is the register of what is broken and what
held.

---

*SaaS Physics v0.3 · deterministic 60-month cohort simulation · 35/35 integrity checks passing.
Illustrative assumptions throughout. No real company data is connected, and no valuation is
computed.*
