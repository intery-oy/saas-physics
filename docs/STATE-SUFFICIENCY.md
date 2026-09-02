# The State Sufficiency Experiment — Prototype 0.3

> **The question.** If two companies show me the same ARR and the same conventional retention
> KPIs today, can their existing ARR nevertheless contain different amounts of future economic
> value?
>
> **The answer.** Yes — and below is the computation, not the label.

---

## A. State architecture — what new information exists

One new state dimension: **cohort maturity**. Transition coefficients may vary by the age band a
cohort occupies at the start of each month.

| Band | Ages (months) | Own persistence | Own expansion |
|---|---|---|---|
| Early | 0–11 | ✓ | ✓ |
| Developing | 12–23 | ✓ | ✓ |
| Mature | 24+ | ✓ | ✓ |

Six transition parameters. **No other new behavioural coefficient.** The shipped default is
**flat** — every band inherits the scalar coefficients — so the default world is exactly v0.2.1
and cohort age carries no economic meaning until a user gives it some. The simulator takes no
position on whether older cohorts are better, worse or the same; §E proves the ranking flips when
the assumption flips.

Also added, as **provenance rather than physics** (§2 of the brief): every acquisition cohort is
stamped at creation with `acquisitionCost` and `cacPerARRAtCreation`. Opening vintages carry
`null`, because the cost of creating them genuinely happened before the simulation — never zero,
which would be a false statement.

---

## B. The matched construction, and why the first one failed

### The failed attempt, recorded rather than hidden

The first construction used a **monotone** band profile (Early risky → Developing ramping →
Mature stable) and solved for two age mixes hitting the same (GRR, expansion). It was
**infeasible**. With monotone bands the per-age (GRR, expansion) signature is very nearly
one-dimensional:

| Initial age | 12-month GRR | 12-month expansion |
|---|---|---|
| 0 | 79.5641% | 4.4359% |
| 12 | 86.9614% | 18.6386% |
| 18 | 91.4597% | 13.1759% |
| 30 | 95.8564% | 7.8236% |

The last three are nearly collinear, so matching two KPIs pins the age distribution and no
non-negative second solution exists. Worse, those three ages are also **forward-identical** (all
Mature at T0), so even the residual freedom could not produce divergence.

Per the brief, the construction was changed rather than the reported metrics fudged.

### The construction that works

Give **bands 1 and 3 identical coefficients** and make band 2 the odd one out — read as a mid-life
renewal / re-contracting window. Then a cohort that spent the measurement window in band 1 and one
that spent it in band 3 report **identical KPIs exactly**, while facing completely different
futures. No solver, no residual, no approximation.

| Band | Ages | Persistence | Expansion | Annual multiplier |
|---|---|---|---|---|
| Early | 0–11 | 94.00% | 14.00% | 1.0716 |
| **Developing** | **12–23** | **78.00%** | **6.00%** | **0.8268** |
| Mature | 24+ | 94.00% | 14.00% | 1.0716 |

The simulation runs 12 months of history (so a genuine R12M measurement exists), T0 is month 12,
and the forward window is months 13–72. Acquisition is off throughout.

### Time-0 state — matched

| | Y · young base | M · mature base | Difference |
|---|---|---|---|
| Age at T0 | 12 months | 36 months | differs |
| Band during the measurement window | Early (0–11) | Mature (24–35) | differs |
| **ARR at T0** | **€21.4320m** | **€21.4320m** | **€0.0** |
| **R12M GRR** | **93.628381%** | **93.628381%** | **0.0** |
| **R12M expansion** | **13.531619%** | **13.531619%** | **0.0** |
| **R12M NRR** | **107.160000%** | **107.160000%** | **0.0** |
| Gross margin | 80% | 80% | 0 |
| R&D + G&A per month | €1.05m | €1.05m | 0 |
| S&M, New ARR, CAC/New ARR | €0, €0, 1.20× | €0, €0, 1.20× | 0 |

**To any conventional KPI dashboard these are the same company.** The match is exact, not
calibrated to a tolerance.

---

## C. Forward 60 months

| | Y · young | M · mature | M − Y |
|---|---|---|---|
| ARR at M72 | €23.37m | €30.28m | +€6.92m |
| Remaining revenue | €101.17m | €128.02m | +€26.85m |
| **Remaining gross profit** | **€80.94m** | **€102.42m** | **+€21.48m** |
| Remaining EBITA / FCF | €17.94m | €39.42m | +€21.48m |
| Cash at M72 | €31.90m | €53.38m | +€21.48m |
| Expansion from the T0 base | €11.80m | €16.73m | +€4.93m |
| Leakage from the T0 base | €9.86m | €7.88m | −€1.98m |

ARR of the Time-0 base, by year:

| | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|
| Y · young | €17.72m | €18.99m | €20.35m | €21.81m | €23.37m |
| M · mature | €22.97m | €24.61m | €26.37m | €28.26m | €30.28m |

---

## D. The mechanism — stated as economics, not as quality

**Y has not yet passed through the Developing band. M passed through it a year before T0.**

For months 13–24 Y runs at an annual multiplier of **0.8268** while M runs at **1.0716**. After
month 24 both run at 1.0716 — identical. So:

- ARR ratio at M24, the end of Y's risk window: **1.2961**
- ARR ratio at M72, four years later: **1.2961**

**The gap is a level difference created in one year and then carried forever by an identical
growth rate.** Nothing about M is "better quality". M has simply already paid a cost that Y still
owes, and the KPI snapshot at T0 cannot tell you which side of that payment either company is on.

This is exactly one of the mechanisms the brief anticipated: *one portfolio has already passed
through its highest-risk period.*

---

## E. Flat-law counterfactual — maturity itself creates nothing

Same two portfolios, same age composition, only the age-dependence removed:

| | Y | M | Difference |
|---|---|---|---|
| ARR at T0 | €21.4320m | €21.4320m | €0.0 |
| R12M NRR | 107.160000% | 107.160000% | 0.0 |
| Remaining GP60 | €102.4158m | €102.4158m | €0.0 |
| Forward GP density | 4.778639× | 4.778639× | 0.0 |
| max abs difference in ARR over 72 months | **€0.000** | | |
| max abs difference in gross profit | **€0.000** | | |

The two monthly series are **byte-identical**. Age composition alone creates nothing. Only
economically different future transition behaviour associated with maturity does.

### Direction agnosticism

Invert the profile (bands 1 and 3 risky, band 2 stable) and the ranking flips:

| | Y · young | M · mature |
|---|---|---|
| Forward GP density, renewal-risk profile | 3.7764× | **4.7786×** |
| Forward GP density, inverted profile | **3.2294×** | 2.5811× |

The ranking is a property of the assumed transition laws, never of age itself. A 2×2 factorial
integrity check enforces this: divergence requires **both** a different cohort state **and**
age-dependent laws; either alone produces exactly zero.

---

## F. Forward economic content

Not valuation. No discounting, no multiple, no score.

```
Remaining GP60      = Σ gross profit over months T0+1 … T0+60
Forward GP density  = Remaining GP60 / ARR at T0
```

| | Y · young | M · mature |
|---|---|---|
| ARR at T0 | €21.43m | €21.43m |
| Remaining GP60 | €80.94m | €102.42m |
| **Forward GP density** | **3.7764×** | **4.7786×** |

**€1 of Y's ARR carries €3.78 of forward gross profit; €1 of M's carries €4.78 — 26.5% more
economic content from the same euro of identically-reported ARR.**

Density is linear in composition, so it behaves as a portfolio measure should:

| Young share of ARR at T0 | 0% | 25% | 50% | 75% | 100% |
|---|---|---|---|---|---|
| ARR at T0 | €21.43m | €21.43m | €21.43m | €21.43m | €21.43m |
| Remaining GP60 | €102.42m | €97.05m | €91.68m | €86.31m | €80.94m |
| Forward GP density | 4.7786× | 4.5281× | 4.2775× | 4.0270× | 3.7764× |

**This is an experimental 60-month forward economic measure. It is not a canonical SaaS KPI, not
an ARR quality score, and not enterprise value.** It is undiscounted, horizon-truncated, and it
inherits every limitation in §H.

---

## Observability — when does the KPI layer ever see it?

| Measurement date | Y reports R12M NRR | M reports | Distinguishable? |
|---|---|---|---|
| M12 (T0) | 107.16% | 107.16% | **No — identical** |
| M15 | 100.43% | 107.16% | yes, 6.73pp |
| M18 | 94.13% | 107.16% | yes, 13.03pp |
| M24 | 82.68% | 107.16% | yes, 24.48pp |
| M30 | 94.13% | 107.16% | yes, 13.03pp |
| M36 | 107.16% | 107.16% | **No — identical** |
| M72 | 107.16% | 107.16% | **No — identical** |

The trailing KPI series is **blind before the event, sees it for exactly 24 months as the risk
window passes through the measurement window, and is blind again afterwards.** A CFO deciding at
T0 gets the blind reading; by the time the KPIs show the difference the economics have already
happened; and by M36 the report looks pristine again.

**The information is not unknowable — it is simply not in GRR and NRR.** Cohort vintage disclosure
identifies it instantly, and every company already has that data.

---

## Secondary run — identical acquisition re-enabled

| | Y | M | M − Y |
|---|---|---|---|
| ARR at M72 | €78.15m | €85.07m | +€6.92m |
| Remaining GP60 | €206.01m | €227.49m | +€21.48m |
| Cash at M72 | €95.85m | €117.33m | +€21.48m |
| Forward GP density | 6.7052× | 7.4043× | |

The absolute gap is **unchanged** — new cohorts are identical in both companies and arrive at the
same rate, so they add the same economics to each. Acquisition does not remove the difference in
the installed base; it dilutes the ratio and hides it.

---

## G. Value versus historical efficiency — two different questions

**Forward embedded economics.** What future economic contribution will today's ARR produce? This
depends on the current state and the transition laws. **Historical CAC is sunk and does not
reduce it.** A euro of ARR that cost €5 to acquire and a euro that cost €0.50 have exactly the
same future, all else equal. Integrity check 32 enforces this: doubling the acquisition cost per
cohort while holding New ARR constant leaves ARR, gross profit and leakage unchanged to €0.0 —
only the current-period S&M expense moves, which is a period cost, not a forward penalty.

**Historical value creation and reproduction economics.** What capital was required to create
today's ARR, and what would it cost to reproduce that growth? Here historical CAC is the whole
question: cohort ROIC, capital efficiency over time, whether acquisition is getting better or
worse.

These are different questions with different inputs, and the simulator now preserves both without
mixing them. `acquisitionCost` is stamped, immutable, and read by nothing in the transition path.

---

## Assessment of the hypothesis

> `Future = f(Current State, Transition Laws)`, and ARR, GRR, NRR are **compressed observations of
> the state rather than a sufficient description of it.**

**Prototype 0.3 supports this.** Two portfolios agreeing exactly on ARR, R12M GRR, R12M expansion,
R12M NRR, gross margin, cost structure and acquisition assumptions produced forward gross profit
differing by €21.48m — 26.5% — with the divergence attributable to a single named state variable
and provably vanishing when that variable is stripped of economic meaning.

The v0.2.1 boundary is now correctly located: it was never a statement about SaaS, it was a
statement about **the compression of the state representation**. Add one state dimension that the
transition laws actually read, and the equivalence breaks immediately.

---

## H. Information preservation

**Retained per cohort:** acquisition month · initial age · age · original ARR · current ARR ·
per-month opening / retained / leakage / expansion / closing · band occupied · cumulative
expansion · cumulative leakage · cumulative revenue · cumulative gross profit · **acquisition
cost** and CAC/New ARR at creation.

**Still cannot be represented** (physics gaps, not storage gaps): customers and logos ·
concentration · customer-specific margin · contracts and renewal dates · expansion saturation ·
customer-level probability distributions · cost to serve · intervention cost · churn versus
contraction · price.

---

## I. Recommended next experiment — recommend only, do not build

**The observability experiment: what is the minimum disclosure that identifies the state?**

Prototype 0.3 showed the state is invisible to a point-in-time KPI reading, visible for a 24-month
window, then invisible again. The decision-relevant question follows directly:

> Given only what a CFO can actually observe about a target — a KPI *history*, not a cohort table —
> can the Time-0 state be identified? And if not, what is the smallest additional disclosure that
> makes it identifiable?

Concretely: construct several portfolios with identical Time-0 ARR and identical **24-month or
36-month histories** of reported GRR / expansion / NRR, and test whether their forward GP density
still diverges. If it does, KPI history is insufficient in principle and cohort vintage disclosure
is *necessary*, not merely convenient — a strong, defensible conclusion about SaaS reporting
practice. If it does not, the state is recoverable from a long enough series, and the problem is a
reporting convention rather than an information one.

It needs **no new physics** — it reuses exactly what 0.3 built — and it answers whether "ARR
economic content" is knowable from the outside at all. That determines whether the eventual value
calculation can ever be applied to anything but your own company.

Do not build it yet.
