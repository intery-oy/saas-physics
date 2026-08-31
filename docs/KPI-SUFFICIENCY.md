# When are SaaS KPIs sufficient statistics?

## State, transition history, and hidden economic information in SaaS Physics v0.3

*A research memo on the frozen v0.3 engine. No new economic physics was added.
`engine.js`, `kpi.js` and `integrity.js` are byte-identical to the previous
release and their 35 integrity checks still pass; 17 further named checks cover
the work below. Every number here is reproducible with `node research-study.js`
and `node research-checks.js`.*

---

## 1. Executive finding

**Headline SaaS KPIs need not be sufficient statistics for future
installed-base economics when transition laws depend on hidden cohort state.**

In a world where retention varies with cohort tenure, two portfolios can report
identical ARR, identical R12M GRR, identical R12M expansion and identical R12M
NRR — to `0.00e+0`, exactly, not to a tolerance — while the forward gross profit
of their existing ARR differs by **23.4%**. Both portfolios are governed by the
same law set: they receive the *same band array object*, so per-portfolio
calibration is not merely absent but structurally impossible.

Three findings sharpen this considerably, and two of them cut against the
project's own prior framing.

**The retention metrics do none of the identifying work.** Given only R12M GRR
and expansion, thirty-six months of history leaves exactly the same ambiguity as
a single snapshot: 4.51%, unchanged at every window tested. The entire collapse
to zero is achieved by the **ARR path**, which does it alone. The trailing
retention metrics are not merely incomplete about the hidden state — on this
domain they are *uninformative* about it.

**The ambiguity closes fast.** On the declared domain, one snapshot leaves 4.51%
of forward installed-base gross profit unresolved; twelve months of ARR history
closes it to 0.00%, and it stays closed under measurement error at twenty-four
months and beyond.

**Where composition does not drive the laws, compression is provably safe.** In
the Homogeneous Control World the snapshot lens cannot separate *any* of 256
enumerated states — one single observational class — and yet the sufficiency gap
is 0.00% at every window. Maximum observational ambiguity, zero economic
consequence.

The governing question was:

> When does KPI compression preserve enough information to reason about future
> SaaS economics, and when does it not?

The answer this model supports: **compression is safe exactly when transition
laws do not depend on the hidden state; when they do, the retention ratios are
the wrong place to look, and the ARR trajectory is where the information is.**

---

## 2. The Homogeneous Control World

The flat-law default is no longer described as "neutral". It is a control case,
and it has a name.

> **In the Homogeneous Control World, the cohort strata carry provenance but not
> differential forward ARR dynamics.**

Persistence and expansion do not vary with cohort age; every euro of installed
ARR is acted on by the same transition. Cohort vintage remains economically
meaningful for *provenance* — which spend created which euro, and whether that
spend has been recovered — and it remains the basis of the capital-recovery
work. It is simply **dynamically redundant** for forward ARR evolution.

No invented "typical" tenure curve has replaced it. The purpose of a control is
to be a control.

### The master reduction

Under homogeneity the whole cohort machinery reduces to one line:

```
ARR(t+1) = g · ARR(t) + N

  gm = P^(1/12)                monthly persistence
  l  = 1 − gm                  monthly leakage fraction
  em = (1+X)^(1/12) − 1        monthly expansion, applied to RETAINED ARR
  g  = gm · (1 + em) = (1 − l)(1 + em)
  N  = S&M ÷ CACperARR
```

The order is read off the engine, not assumed: existing cohorts leak, the
survivors expand, and only then is the new cohort created — which is why
expansion multiplies the *retained* balance and why `N` is a pure addend rather
than being scaled by `g`.

At the shipped defaults `g = 0.999162823` and `N = €0.75m/month`. Both the
iterated recursion and the closed form

```
ARR(t) = g^t · ARR(0) + N · (g^t − 1) / (g − 1)
```

reproduce the engine's aggregate ARR path to a worst relative error of
**4.1 × 10⁻¹⁵** across four parameterisations including the `g = 1` edge case.
This is a *verified analytical reduction of the existing engine*, not a
replacement for it.

### `g` is not NRR, even where the numbers agree

At the defaults, `g¹² = 0.990000000` and reported R12M NRR = `0.990000000`,
agreeing to 6.7 × 10⁻¹⁶. That is an exact identity rather than a coincidence:
NRR is a ratio of two *stocks*, so it recovers the compounded multiplier
precisely, while GRR is a ratio of a *flow* to a stock and equals no power of
`g` at all (0.895582330 against a persistence coefficient of 0.90).

The identity holds **only under homogeneity**. In a banded world there is no
single `g`, and treating the reported NRR as one is wrong by **8.16
percentage points** (`g¹² = 0.990000` against a measured NRR of `1.071600`).
The layers stay separate: `g` is a Layer-A transition coefficient, NRR is a
Layer-B measurement.

The reduction is likewise band-conditional. Applied to the state-dependent
profile it is wrong by **6.40%** — the closed form is a property of homogeneity,
not of the engine.

---

## 3. Why compression can be safe there

If the forward transition applied to a euro of ARR does not depend on which
cohort that euro sits in, then the age composition of the base cannot affect
forward economics, and an observer who cannot see composition has lost nothing
of forward-economic relevance.

This is verifiable rather than merely arguable. Across all **256** enumerated
states in the declared domain, under flat laws, FIBC-60 per euro of ARR is
identical to a worst relative difference of **9.3 × 10⁻¹⁶** — floating-point
noise. The check `HOMOGENEOUS-CONTROL · no composition effect` enforces it.

The control also produces the memo's cleanest illustration of the distinction
between *observational* and *economic* ambiguity. Under the snapshot lens the
homogeneous world collapses all 256 states into **one** equivalence class: the
observer cannot tell any two of them apart. And the sufficiency gap is
**0.00%**. Total observational ambiguity; no economic consequence whatsoever.

---

## 4. State-dependent transition laws

The state-dependent world assigns different coefficients to three age bands:

| Band | Ages | Persistence | Expansion |
|---|---|---|---|
| Early | 0–11 | 94% | 14% |
| Developing | 12–23 | 78% | 6% |
| Mature | 24+ | 94% | 14% |

This is a **user assumption about a world**, never a claimed law of SaaS. Band 2
is read as a mid-life renewal or re-contracting window.

It is deliberately **non-monotone**: bands 1 and 3 share coefficients. That
choice is load-bearing and is a scope condition on everything that follows — see
§13.

---

## 5. The same-world counterexample

The prerequisite test, and the gate this whole iteration was built around.

**Required:** `LawSet_A = LawSet_B` while `State_A ≠ State_B`, with
`Observed_A = Observed_B` yet `Forward_A ≠ Forward_B`.

Two portfolios at T0 = month 12, acquisition off in both:

- **Y (young)** — every euro is age 12 at T0. It has *not yet* crossed band 2.
- **M (mature)** — every euro is age 36 at T0. It crossed band 2 long ago.

| | Y · young | M · mature | \|Δ\| |
|---|---|---|---|
| Law signature | identical | identical | 0 |
| Band array | *same object* | *same object* | — |
| Age at T0 | 12 months | 36 months | differs |
| ARR at T0 | €21.43m | €21.43m | `0.00e+0` |
| R12M GRR | 93.628381% | 93.628381% | `0.00e+0` |
| R12M expansion | 13.531619% | 13.531619% | `0.00e+0` |
| R12M NRR | 107.160000% | 107.160000% | `0.00e+0` |
| **FIBC-60 per € of ARR** | **3.776441** | **4.778639** | **23.43%** |

**Verdict: the flagship result survives the same-world test.** The observations
agree exactly, not within a tolerance. Both portfolios reference the same band
array object in memory, so no per-portfolio calibration could have occurred.

### The mechanism

Y still has to pass through the Developing band; M passed through it twelve
months before T0. During months 13–24 Y runs at an annual multiplier of 0.8268
while M runs at 1.0716. After month 24 both grow at the same rate — so the gap
never closes. It is a *level* difference created in one year and then compounded
by an identical rate.

The reason the KPI layer cannot see this is exact and worth stating carefully:
during the measurement window, Y's cohort sat in band 1 and M's sat in band 3,
and those two bands have *identical coefficients*. The trailing metrics
therefore report the same numbers because the two cohorts genuinely transitioned
the same way over the observed period. The difference is entirely in what
happens *next*, and a trailing metric has no access to that.

This is §9's candidate mechanism, and it is confirmed: **trailing retention
describes transitions over a historical window; forward economics depend on the
current position of the base within the band structure; ageing puts a lag
between the two.**

---

## 6. FIBC-60

The vague language — "economic content", "ARR quality", "forward value" — is
retired. One non-valuation outcome measure replaces it:

> **Forward Installed-Base Contribution, 60 months (FIBC-60)**
>
> `FIBC60(s) = Σ (t=1..60) GrossProfit_t of the Time-0 installed base`

Only cohorts existing at T0 are counted; cohorts acquired after T0 are excluded,
so the measure is a property of the state and not of future acquisition policy.
Existing transition laws operate; gross margin follows the engine. Computed by
direct cohort-level summation from the engine's own rows.

**No discounting. No terminal value. No multiple. No future acquisition. It is
not called "value".** A future installed-base-value measure may become a
discounted governed transformation of the same cohort economics; that is out of
scope here.

Verified by two checks: cohort summation equals company gross profit to
`0.00e+0` on €80.94m when acquisition is off, and with acquisition on it
correctly excludes post-T0 cohorts (€116.99m of a total €206.01m).

### Restating the historical figure

The previously reported **26.5%** was an asymmetric ratio with the young
portfolio as the denominator. The same two states yield three different
percentages:

| Normalisation | Value |
|---|---|
| `mature/young − 1` | **26.54%** ← the historical headline |
| `\|Δ\| ÷ midpoint` | **23.43%** ← SKSG, order-invariant |
| `1 − young/mature` | **20.97%** |

The old figure is preserved for traceability. Everything below uses the
symmetric form, because it cannot be inflated by choosing which state to call
the baseline.

---

## 7. SKSG — the SaaS KPI Sufficiency Gap

> Among economic states that look identical through a chosen reporting lens, how
> different can their future installed-base economics still be?

For a KPI set `K`, observation window `W`, forward horizon `H = 60M` and a fixed
law set `L`, the admissible set is `I(K,W,L) = { s : Observations_W(s) = K }`,
and

```
SKSG = max |FIBC60(si) − FIBC60(sj)| ÷ ( (FIBC60(si) + FIBC60(sj)) / 2 )
       over si, sj in I
```

**Why the symmetric midpoint denominator.** It is order-invariant: swapping the
two states cannot change the number, so the metric cannot be inflated by
choosing a baseline — as §6 shows, that choice was worth 5.6 percentage points
on the flagship pair alone. It is bounded above by 2, and the denominator cannot
approach zero while the numerator stays finite, because FIBC-60 is strictly
positive whenever the base has positive ARR and positive gross margin.

**This is a searched maximum, not a theorem.** The maximisation runs over the
finite declared domain below. It is a *lower bound* on ambiguity over any larger
state space and is reported as such. Every result discloses: KPI set, history
window, law set, state domain searched, forward horizon, normalisation.

### The observation lens

Exactly what `kpi.js` already defines; no cleaner observables were invented. At
each measurement date the observer reads the normalised ARR level, R12M GRR and
R12M expansion.

R12M NRR is reported but is **not an independent coordinate**: the KPI layer
satisfies `NRR = GRR + expansion` identically (verified to 3.3 × 10⁻¹⁶ by the
existing checks), so including it would double-count one constraint.

**Scale.** The engine is exactly linear in scale, so absolute ARR is always
matchable by choosing a multiplier and carries no information about composition.
Normalising the ARR path by ARR at T0 removes exactly that degree of freedom and
keeps the path *shape*, which is informative.

### The state domain

A state must be reachable by the frozen engine. Two structural facts forced the
domain's shape, and both are results in their own right.

**Fact 1 — the observation window ages the base.** A cohort seeded at month 0
with age `a` has age `a + T0` at T0. With T0 = 47 every directly-seeded euro is
at least 47 months old and sits in the terminal band. Since band 3 is unbounded,
those cohorts have identical forward behaviour: seeded ages 50, 80 and 120 all
give FIBC-60 per euro of **4.778638602**, identical to nine decimals. **Once the
whole base is in the terminal band, composition carries no forward difference
at all.**

**Fact 2 — therefore the hidden state is recent acquisition.** The only Time-0
state that can differ economically is ARR young enough to still face the
discriminating band, and with T0 ≥ 12 that ARR cannot have been seeded — it must
have been *acquired*. Under a constant acquisition rate that mass is pinned by
the rate itself, so the domain must contain acquisition paths that are **not
constant**.

The domain is therefore: an opening base over seed ages {0, 12, 24, 36} with
two-point mixes, and a **two-phase acquisition path** (an early phase and the
last twelve months) over {0, 0.6%, 1.4%, 2.5%} of opening ARR per month in each
phase — **256 states, exhaustively enumerated**. Each phase is an ordinary
frozen-engine run; the second is seeded with the exact cohort state the first
ended on. That join is lossless: `max |ΔARR| = 0.00e+0` and `max |ΔKPI| =
0.00e+0` across all 36 measurement dates against a single continuous run.

This is a declared search domain. **It is not a claim about the space of real
SaaS companies.**

### Why T0 is held fixed

A W-month history of R12M measures requires `T0 ≥ W + 11`. Letting T0 move with
W would confound *more observation* with *more ageing* — two different effects
that both reduce ambiguity. T0 is therefore fixed at 47 for every window, so
that changing W changes only how much history is disclosed.

---

## 8. Snapshot result

Under the snapshot lens (a single R12M measurement at T0) in the
state-dependent world:

| | Value |
|---|---|
| States searched | 256 |
| Observational classes | 13 |
| Ambiguous classes | 13 |
| Largest class | 64 states |
| State identifiable | **no** |
| **SKSG** | **4.51%** |

Independently, re-running the snapshot lens at T0 = 12 over a separate
576-state domain returns **SKSG = 23.43%**, and the witness pair found by
exhaustive search is exactly the hand-built flagship pair. The 26.5% anecdote is
now one point on a curve, recovered by search rather than asserted.

The two snapshot numbers differ because the domains differ: at T0 = 47 the
opening base is ≥47 months old and only recent acquisition supplies young ARR,
diluted by the rest of the base; at T0 = 12 a pure young base is reachable. That
is exactly what "SKSG must disclose its state domain" means in practice.

---

## 9. Observability: 12 / 24 / 36-month results

**State-dependent world**

| Observation lens | Classes | Ambiguous | Largest | Identifiable? | SKSG |
|---|---:|---:|---:|---|---:|
| Snapshot (one R12M at T0) | 13 | 13 | 64 | no | **4.51%** |
| 12-month KPI history | 61 | 61 | 16 | no | **0.00%** |
| 24-month KPI history | 141 | 78 | 9 | no | **0.00%** |
| 36-month KPI history | 144 | 80 | 4 | no | **0.00%** |

**Homogeneous Control World**

| Observation lens | Classes | Ambiguous | Largest | SKSG |
|---|---:|---:|---:|---:|
| Snapshot | 1 | 1 | 256 | **0.00%** |
| 12-month | 13 | 13 | 64 | **0.00%** |
| 24-month | 16 | 16 | 16 | **0.00%** |
| 36-month | 16 | 16 | 16 | **0.00%** |

Two things deserve emphasis.

**The collapse is not gradual.** It happens entirely between the snapshot and
twelve months. Monotonicity was not forced, and the result did not need forcing.

**Observational ambiguity never reaches zero, and that does not matter.** Even at
36 months the states are not uniquely identified — 80 ambiguous classes remain.
But the surviving ambiguity has **zero forward-economic consequence**. This is
the distinction the whole metric exists to draw: states can be indistinguishable
without that indistinguishability mattering. Reporting "state identifiable: no"
alongside "SKSG 0.00%" is the honest presentation, and it is why identifiability
alone would have been the wrong question.

### Which observable does the work

| Lens | Snapshot | W=12 | W=24 | W=36 |
|---|---:|---:|---:|---:|
| ARR path + R12M GRR + expansion | 4.51% | 0.00% | 0.00% | 0.00% |
| **R12M GRR + expansion only** | **4.51%** | **4.51%** | **4.51%** | **4.51%** |
| ARR path only | 4.51% | 0.00% | 0.00% | 0.00% |

**The retention metrics carry no identifying power at all.** With GRR and
expansion alone, thirty-six months of history leaves the ambiguity exactly where
one snapshot left it. The ARR path achieves the entire collapse by itself.

The reason follows directly from §5's mechanism: under a non-monotone profile, a
young cohort and a mature cohort transition *identically*, so no retention ratio
can separate them — by construction, at any window length. What separates them
is the *shape* of the ARR trajectory, because a base being replenished by recent
acquisition traces a different path than one that is not, and it is that path
which reveals how much ARR still faces the risk window.

---

## 10. Conditioning

Identifiability is not enough: a state can be uniquely determined in exact
arithmetic and still be useless if a rounding-sized error admits wildly
different economics. Each scenario perturbs **exactly one** observable.

| Lens | Exact | Rates ±0.1pp | ARR ±0.1% | Both |
|---|---:|---:|---:|---:|
| Snapshot | 4.51% | 4.51% | 4.51% | 4.51% |
| 12-month history | 0.00% | 0.00% | 0.00% | **0.04%** |
| 24-month history | 0.00% | 0.00% | 0.00% | 0.00% |
| 36-month history | 0.00% | 0.00% | 0.00% | 0.00% |

**In CFO terms.** With one R12M observation, 4.51% of forward installed-base
gross profit is unresolved, and *no amount of measurement precision helps* — the
ambiguity is structural, not noise. With twelve months of history it is gone in
exact arithmetic, and a simultaneous ±0.1pp and ±0.1% error reopens only 0.04%.
At twenty-four months and beyond it stays closed under every perturbation
tested. **Longer history does not merely identify the state; it identifies it
robustly.**

No Jacobian, rank or condition number is reported. Those objects require a
differentiable inversion of a continuous state vector; the state domain here is
a declared finite grid and the observation map is evaluated on it exhaustively.
Computing a condition number would have been decoration, and the brief asked for
none.

Note what carries the robustness: the identifying observable is the ARR path,
which is a *balance* and is reported precisely. The noisy observables — the
retention rates — were never doing the work, so their error does not propagate.

---

## 11. Mechanism of information loss

Stated as a chain, each link verified against the engine rather than asserted:

1. Trailing retention metrics describe transitions over a *historical* cohort
   window.
2. Forward economics depend on the **current** position of the base within the
   band structure.
3. Ageing puts a lag between the two: what the metric measured is not the state
   that now exists.
4. Where two bands share coefficients, cohorts in them are **observationally
   identical by construction** — no retention ratio can ever separate them.
5. Therefore multiple current states map to the same trailing observations, and
   they can face different futures.

The candidate mechanism in the brief is confirmed, with one addition it did not
anticipate: the loss is not spread across the KPI set. It is **entirely
localised in the retention ratios**. The ARR path is not subject to the same
lag, because a level responds to acquisition immediately while a trailing ratio
does not.

The contrast that makes the point:

- **Homogeneous Control World** — age composition does not alter forward ARR
  laws, so cohort age state can be compressed safely for forward ARR dynamics.
  256 states, one observational class, SKSG 0.00%.
- **State-Dependent World** — transition laws vary with hidden cohort state, so
  observational compression can lose economically relevant information. SKSG
  4.51% at the snapshot, and permanently 4.51% if only retention ratios are
  disclosed.

---

## 12. What the model proves

- Headline SaaS KPIs **need not** be sufficient statistics for future
  installed-base economics when transition laws depend on hidden cohort state.
  Demonstrated by an exact same-world counterexample, not an approximation.
- Where they are insufficient, the insufficiency is carried **entirely by the
  retention ratios**. Disclosing GRR and NRR history for three years adds
  nothing; disclosing the ARR path resolves it in one year.
- Under homogeneous laws, compression is **safe** — provably, across the whole
  enumerated domain.
- Observational ambiguity and economic ambiguity are **different quantities**,
  and conflating them would have produced the wrong conclusion at 24 and 36
  months, where the state is still not identifiable but nothing economically
  relevant remains hidden.
- Hidden state in this engine has a **finite lifetime**. Once every euro reaches
  the terminal band, composition is inert. The only economically distinguishing
  hidden state is recent acquisition.

## 13. What the model does NOT prove

This is a **model result**, not an **empirical claim**. It does not establish:

- that every SaaS base has material tenure dependence — the entire result is
  conditional on a **non-monotone** profile, and under a monotone tenure curve
  the (GRR, expansion) signature is nearly one-dimensional in age, so an exact
  matched construction does not exist at all;
- that real diligence processes are systematically wrong;
- that cohort disclosure is always necessary — on this domain, twelve months of
  ARR history was sufficient;
- that the 26.5% (properly, 23.43%) synthetic gap is empirically typical;
- that the searched maximum is the true maximum — the domain is finite and
  declared, and a richer state space could only raise SKSG, never lower it.

The scope condition in the first bullet deserves particular weight, because it
is the assumption the whole result rests on and the model cannot supply it. The
non-monotone profile was not chosen to be realistic; it was chosen because the
first, monotone construction was **infeasible**, and that infeasibility is
itself the finding: under monotone tenure laws the KPI set may be very nearly
sufficient.

---

## 14. Implications for SaaS reporting and diligence

Stated as conditionals, because that is what the evidence supports.

**If** a base has tenure-dependent retention with a non-monotone profile,
**then** a snapshot of ARR, GRR, expansion and NRR is not sufficient to bound
forward installed-base gross profit, and requesting three years of retention
metrics does not help.

**The cheap fix is not cohort disclosure.** It is the **ARR path**. On this
domain, twelve months of ARR history resolved what thirty-six months of
retention metrics could not. That is a materially smaller ask than full cohort
vintage disclosure, and every company already reports it.

**A single-period retention snapshot is the weakest common lens.** Its ambiguity
is structural — better measurement precision does not reduce it.

**Where retention is genuinely tenure-flat, none of this applies** and the
standard KPI set is sufficient for forward ARR dynamics. Establishing which
regime a company is in is therefore the prior question, and it is empirical.

---

## 15. Empirical questions required next

The model has taken this as far as a synthetic model can. What would move it:

1. **Do real SaaS bases show non-monotone retention by tenure?** Specifically, a
   mid-life renewal trough followed by recovery. This is the load-bearing
   assumption and it is directly measurable from any company's own cohort data.
2. **How large is the tenure dispersion in practice?** SKSG scales with the gap
   between band coefficients; a 94/78 spread is an assumption, not a measurement.
3. **What is the actual reporting precision of GRR and NRR?** The ±0.1pp figure
   is a stipulation. If real reported rates are noisier, conditioning worsens —
   though the ARR path, which does the work, is a balance and is reported
   precisely.
4. **Is the ARR-path result robust to real acquisition seasonality?** The domain
   used a two-phase path; real paths are richer and might be less identifying.
5. **Does the finite lifetime of hidden state survive a finer band structure?**
   Three bands with an unbounded terminal band is what makes composition go
   inert. More bands, or age-continuous laws, would change that.

---

## Reproducing

```bash
node research-study.js     # the full result set and the decision gate
node research-checks.js    # 17 named research checks
node checks.js             # the 35 frozen integrity checks, unchanged
```

Named checks covering this memo: `SAME-WORLD` (4), `HOMOGENEOUS-REDUCTION`,
`REDUCTION-IS-BAND-CONDITIONAL`, `FIBC` (2), `SEGMENTATION`, `KPI-EQUALITY`,
`SUFFICIENCY-METRIC` (2), `HISTORY` (2), `CONDITIONING` (2),
`HOMOGENEOUS-CONTROL`.

*Illustrative assumptions throughout. No real company data is connected, and no
valuation is computed.*
