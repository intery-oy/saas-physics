# The matched-NRR experiment

**Question.** Two installed bases with identical NRR and different underlying mechanics — does
this simulation consider them economically identical?

**Answer.** Yes, completely. And the reason is sharper than "the model is too simple".

## Construction

| | Annual GRR | Annual expansion | NRR |
|---|---|---|---|
| **R — retention-heavy** | 96.000000% | 10.000000% | 105.600000% |
| **X — expansion-heavy** | 90.000000% | 17.333333…% | 105.600000% |

X's expansion is solved as `1.056 / 0.90 − 1 = 0.173333333333333` at full double precision, not
rounded. Everything else is held identical: opening ARR, opening cash, S&M, CAC/New ARR, gross
margin, R&D, G&A, horizon, cohort creation, and all other mechanics.

## Results

| Metric | R · retention-heavy | X · expansion-heavy | |
|---|---|---|---|
| Year 1 ARR | €30.35m | €30.35m | identical |
| Year 3 ARR | €52.82m | €52.82m | identical |
| Year 5 ARR | €77.87m | €77.87m | identical |
| Cumulative expansion | €22.48m | **€37.60m** | differs |
| Cumulative leakage | €9.61m | **€24.73m** | differs |
| Cumulative gross profit | €190.50m | €190.50m | identical |
| Year 5 EBITA / FCF | €33.70m | €33.70m | identical |
| Ending cash (M60) | €83.50m | €83.50m | identical |
| M60 ARR from opening cohort | €26.26m | €26.26m | identical |
| M60 ARR from acquired cohorts | €51.61m | €51.61m | identical |
| NRR (calculated) | 105.6000% | 105.6000% | identical |

Month-by-month over all 60 months: closing ARR differs by at most **€8.9 × 10⁻⁸**, gross profit
by €5.6 × 10⁻⁹, cash by €8.9 × 10⁻⁸. Floating-point noise on a €78m company.

The only trace of the difference is gross flow: **X churns €15.12m more and expands €15.12m
more, netting exactly to zero.**

## Why — the structural reason

A cohort's month is:

```
closing = opening × mGRR × (1 + mExpansion)
```

Only the **product** `mGRR × (1 + mExpansion)` ever reaches the ARR stock. Leakage and expansion
are computed and reported, but nothing downstream consumes them separately: revenue is a function
of ARR, gross profit of revenue, EBITA of gross profit, cash of EBITA. There is no path by which
the decomposition can influence any other quantity.

R and X are constructed to have the same product. They are therefore the same number written two
ways, and the engine — correctly, given its own laws — reports one company.

This generalises to a precise condition:

> **Two installed-base systems are indistinguishable in this model if and only if their monthly
> NRR *path* agrees, not merely its annual product.**

That matters for what comes next. Any proposed new physics that merely rescales retention and
expansion together will not separate R from X. Only physics that makes retention and expansion
differ **in timing** (changing the path) or that attaches something **outside the ARR recursion**
(a cost, a customer count) can break the tie.

**This is a boundary of the model, not a bug.** No ARR-quality score, retention-quality score,
risk coefficient, valuation adjustment or weighting factor has been added to paper over it. The
point of the experiment was to locate the boundary, and it is located.

---

## What physics would have to exist for these businesses to diverge

The candidates split cleanly into two classes, and the split is the useful part.

### Class A — physics that changes the ARR path itself

These break the tie by making the monthly NRR path differ even when the annual product matches.

**Cohort age dependence.** *Necessary condition, and it is stricter than it looks.* Making rates
depend on cohort age is **not sufficient** on its own: if retention and expansion share the same
age profile, only their product still matters and R and X stay identical. The tie breaks only if
**churn and expansion have *different* time profiles** — for example churn front-loaded into the
first year while expansion builds with maturity. Then X, which loses more of each cohort early,
applies its larger expansion rate to a base that has already eroded, and the two paths separate.
Anyone proposing lifecycle mechanics should be asked for evidence of *differing* profiles, not
just of age dependence.

**Expansion saturation.** A cohort cannot expand forever. Today it can: nothing caps a cohort at
any multiple of its initial ARR. A ceiling breaks the tie asymmetrically, because it constrains
expansion but not churn — X, leaning harder on expansion, hits the ceiling sooner. One parameter
(maximum multiple of initial ARR, or an expansion rate that decays with penetration).

**Product / usage adoption limits.** The same mechanism as saturation, expressed causally rather
than as a cap: expansion slows as adoption matures. Economically the more honest framing;
mechanically it collapses into saturation for modelling purposes.

### Class B — physics that leaves the ARR path identical but separates the economics

These break the tie *without touching ARR at all*, which makes them cleaner experiments.

**Expansion cost.** Expansion is not free — it consumes CSM time, account-management capacity,
implementation and sometimes sales effort. Today it costs zero. X generates €37.60m of expansion
against R's €22.48m; if expansion carries any cost per euro generated, X is strictly poorer, and
by an amount that is **exactly linear in that cost**: `Δending cash = c × €15.12m`. At 10c per €
of expansion ARR, X ends €1.51m behind; at 50c, €7.56m behind. This is the smallest defensible
break of the tie, and it needs one coefficient.

**Customer count and logo retention.** Identical ARR evolution can coexist with radically
different customer survival. At equal ARPA, X loses far more logos and concentrates its expansion
into fewer survivors. Tracking a customer count and a logo-retention rate per cohort would make
the two businesses *observably* different — different customer counts, different ARPA
trajectories — with no judgment coefficient at all. It also unlocks concentration and net-vs-gross
logo metrics later.

**Concentration.** Expansion driven by a handful of accounts while churn is broad is a genuinely
different business. But representing it requires a within-cohort distribution, which is
customer-level modelling — explicitly out of scope, and a large step.

**Retention risk.** In reality, a base held together by expansion on a leakier foundation is more
fragile: expansion is more elective, more procyclical and more concentrated than churn avoidance
is. This is a claim about **variance**, and the model is deterministic — it has no variance to
differ in. Recording it here rather than encoding it: adding a risk coefficient would be exactly
the arbitrary weighting the brief rules out.

### Summary

| Candidate | Breaks the tie? | Touches ARR path | Parameters | Judgment required |
|---|---|---|---|---|
| Expansion cost | Yes | No | 1 | Very low |
| Customer count / logo retention | Yes (observably) | No | 1 | None |
| Expansion saturation | Yes | Yes | 1 | Moderate |
| Age-dependent rates | Only if profiles differ | Yes | 4–6 | **High** |
| Concentration | Yes | No | many | High (out of scope) |
| Retention risk | Not in a deterministic model | No | — | High |

---

## Lifecycle hypothesis — LAND → RAMP → RETAIN

**Assessment: do not implement in 0.2, and do not implement it next.**

Three reasons.

1. **It is the only candidate that requires assuming shapes.** How much churn is front-loaded,
   when expansion peaks, and how long each phase lasts vary enormously between PLG and enterprise,
   seat-based and usage-based, SMB and mid-market. Any default would be a universal SaaS law
   asserted without evidence — precisely what this project is trying to avoid.
2. **It is the most powerful and therefore the most dangerous.** It changes the ARR path, so a
   wrong profile does not merely mislabel the economics, it produces the wrong company.
3. **Its power over the matched-NRR question is conditional.** Per the condition above, lifecycle
   mechanics separate R from X only if churn and expansion have *different* age profiles. That
   conditional claim should be tested against data before being built in.

Cheaper physics (expansion cost, customer count) breaks the tie with far less assumed structure.
Do that first, understand it, and come back to lifecycle when there is a reason to believe a
specific shape.

### If it is built anyway — the smallest possible v0.3 design

- **Three phases by cohort age**, with user-settable boundaries: LAND (months 1–t₁), RAMP (t₁–t₂),
  RETAIN (t₂+). Defaults t₁ = 6, t₂ = 24, exposed as controls, never hard-coded.
- **Two multipliers per phase** applied to the monthly rates: `churnMultiplier[phase]` and
  `expansionMultiplier[phase]`. Six numbers in total.
- **A normalisation constraint, which is the part that makes it honest.** Scale the multipliers so
  that the blended 60-month outcome at the default profile reproduces the flat-rate model exactly.
  Lifecycle then changes only the **shape** of the decay, never its **level** — so it cannot
  silently make every company better or worse, and any divergence between R and X is attributable
  purely to shape. Without this constraint the layer is untestable.
- **Off by default**, behind an explicit toggle, with the multipliers labelled in the interface as
  a user hypothesis rather than a property of SaaS.
- **One integrity check:** with the normalisation on and all multipliers at 1.0, every trajectory
  must be byte-identical to the flat-rate engine.

---

## Recommended next experiment

**Add `EXPANSION_CAC_PER_ARR` — the cost of a euro of expansion ARR — and solve for the
indifference point.**

It is deliberately the smallest possible step, and it is structurally symmetric with the v0.2
acquisition primitive we just built: `cacPerARR` prices new ARR, `expansionCacPerARR` prices
expansion ARR. One coefficient, economically uncontroversial (expansion is not free), and it is a
*cost*, so it cannot flatter the model.

The experiment is not "add a cost". It is:

> **At what cost per euro of expansion ARR does the expansion-heavy business become materially
> worse than the retention-heavy one?**

Under the mechanic above the answer is analytically linear — `Δending cash = c × €15.12m`, so any
c > 0 separates them and there is no threshold. That prediction is itself the finding worth
testing, because if the real world has a threshold, the missing physics is saturation, not cost.
Which tells us what to build after that.

Do not build this yet. It is a recommendation.
