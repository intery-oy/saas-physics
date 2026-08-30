# Where the physics break

Conceptual weaknesses exposed by running the prototype. Nothing here was silently "improved":
where an equation looked weak it was implemented as specified, and it stays that way until an
iteration is explicitly chartered to change it.

Updated for **model v0.3**. Ordered by how badly each distorts a CFO's intuition, not by how hard
it is to fix.

---

## Fixed in v0.2

### ✅ Gross margin no longer generates ARR

**The v0.1 defect.** `New ARR = S&M × 12 ÷ (payback × GM)` put gross margin in the *denominator*,
because CAC payback is defined on gross profit. Cutting GM 80% → 65% at constant payback therefore
*raised* New ARR from €0.75m to €0.92m/month and Year-5 ARR from €62.93m to €73.06m, while
cumulative gross profit fell. The model reported a bigger, poorer company, and the ARR chart moved
the wrong way for a margin deterioration. It was internally consistent — holding payback fixed
while cutting GM asserts that CAC per euro of new ARR fell 18.7% — but nobody assumed that, and the
causal direction was inverted.

**The v0.2 fix.** Acquisition productivity `cacPerARR` is now the primitive and CAC payback is an
output:

```
New ARR    = S&M ÷ cacPerARR                 (GM absent)
CAC payback = cacPerARR × 12 ÷ GM            (output)
```

Same scenario under v0.2 — GM 80% → 65%, everything else held:

| | v0.1 | v0.2 |
|---|---|---|
| New ARR / month | €0.75m → **€0.92m** ✗ | €0.75m → **€0.75m** ✓ |
| Year-5 ARR | €62.93m → **€73.06m** ✗ | €62.93m → **€62.93m** ✓ |
| CAC payback | 18.0 (input, fixed) ✗ | 18.0 → **22.15 months** ✓ |
| Cumulative gross profit | −€14.63m | **−€31.23m** |
| Ending cash | €44.94m | **€28.34m** |

Margin deterioration now creates a poorer company without magically improving acquisition
productivity. `cacPerARR = 1.20` at GM 80% reproduces the v0.1 baseline exactly, so no other
Prototype 0 result moved. Six integrity checks lock the new causality in place, including a
structural one asserting that neither `cacPayback` nor `grossMargin` appears anywhere in the New
ARR generator's source.

---

## New in v0.3

### 1. The v0.2.1 boundary was a statement about state compression, not about SaaS

Two portfolios matching exactly on ARR, R12M GRR, R12M expansion, R12M NRR, gross margin, cost
structure and acquisition assumptions produced **€21.48m** more forward gross profit for one than
the other over 60 months — 26.5% more economic content per euro of identically-reported ARR. Add
**one** state dimension the transition laws actually read (cohort maturity), and the v0.2.1
equivalence breaks immediately. The 2×2 factorial check confirms the cause is not maturity but the
interaction: different state with flat laws, and identical state with age-dependent laws, both give
exactly zero divergence. See [`STATE-SUFFICIENCY.md`](STATE-SUFFICIENCY.md).

### 2. The KPI layer is blind, then briefly sighted, then blind again

The hidden state is invisible to the trailing measure at T0, visible for exactly 24 months as the
risk window passes through the measurement window, and invisible again from M36. A CFO deciding at
T0 gets the blind reading; by the time the KPIs move the economics have already happened; and a
year after that the report looks pristine. **The information is not unknowable — it is simply not
in GRR and NRR.** Cohort vintage disclosure identifies it instantly, and every company already has
that data.

### 3. The first matched construction was infeasible, and that itself is a finding

Monotone age bands make the per-age (GRR, expansion) signature nearly one-dimensional, so matching
two KPIs pins the age distribution and no second non-negative solution exists. The construction was
changed rather than the reported metrics fudged. The corollary is useful: **under monotone
lifecycle laws, matched trailing KPIs come close to implying a matched age mix.** It takes a
non-monotone law — such as a mid-life renewal risk window — to hide state behind matched KPIs.

### 4. The flat-law closed forms are band-conditional

`NRR = P × (1 + X)` and the closed-form calibration inverse are properties of the homogeneous
model. Under age-dependent bands there is no single (P, X) and they correctly stop holding. Now
asserted as a check rather than discovered as a failure.

---

## From v0.2.1

### 5. The parameters were never the KPIs — and my first explanation of the gap was wrong

Prototype 0.2 reported a 90% persistence input measuring as 89.56% GRR. The first decomposition
attributed this to three effects — compounding convention, moving base, and expansion charged on
retained ARR. **Two of those cancel exactly.** Setting the expansion coefficient to zero makes
measured GRR equal the persistence coefficient to 16 decimal places; setting persistence to 100%
makes measured expansion equal its coefficient exactly. The entire residual is the within-period
*interaction* of the two processes, and nothing else. Corrected in `kpi.js` and
[`MEASUREMENT.md`](MEASUREMENT.md).

The structural consequence is larger than the arithmetic: **a transition coefficient and a KPI of
the same name are different objects**, and the model now says so in code — the economic engine
(`engine.js`) holds coefficients, the measurement engine (`kpi.js`) holds definitions, and events
flow one way between them.

### 6. Under FLAT laws, any two systems reporting the same R12M NRR are identical — by construction

v0.2 found that a retention-heavy and an expansion-heavy business at matched NRR were
indistinguishable, and attributed it to the two coefficient sets happening to share a product.
Re-running the experiment through the measurement layer gives a stronger statement: measured R12M
NRR is a ratio of two *stocks*, so pinning it pins the monthly multiplier `m = NRR^(1/12)`
uniquely — 1.004551007 in both scenarios, to nine decimals. The ARR recursion consumes nothing
but `m`. So this is not a coincidence about two parameter choices; it is a theorem about the
*homogeneous* model — and v0.3 shows it is exactly that homogeneity, not anything about SaaS, that
made it true.

### 7. ✅ Cohort acquisition cost — fixed in v0.3

Flagged in v0.2.1 as one change away from being permanently unrecoverable. Now stamped at cohort
creation (`acquisitionCost`, `cacPerARRAtCreation`), immutable, and read by nothing in the
transition path. Checks 31 and 32 enforce both halves: it reconciles to `initialARR × cacPerARR`,
and doubling it at identical New ARR leaves forward ARR, gross profit and retention unchanged to
€0.0. Sunk cost stays sunk; historical capital efficiency stays computable.

---

## From v0.2

### 8. Matched NRR hides two different businesses — and the reason is precise

Retention-heavy (GRR 96% × expansion 110%) and expansion-heavy (GRR 90% × expansion 117.33%) both
give NRR 105.6%. The engine produces **identical** Year-1, Year-3 and Year-5 ARR, gross profit,
EBITA, FCF, cash and cohort composition — agreeing to €8.9 × 10⁻⁸ across 60 months. The only
difference is gross flow: the expansion-heavy business churns €15.12m more and expands €15.12m
more, netting to zero.

The reason is structural, not a matter of missing detail. A cohort's month is
`closing = opening × mGRR × (1 + mExpansion)`, so **only the product reaches the ARR stock**, and
nothing downstream consumes leakage or expansion separately. This yields a sharp condition:

> Two installed-base systems are indistinguishable in this model **iff their monthly NRR *path*
> agrees**, not merely its annual product.

That condition governs what could ever fix it: physics that merely rescales retention and expansion
together will not separate them. Only physics that changes the *timing* (age dependence with
differing profiles, expansion saturation) or attaches something *outside the ARR recursion*
(expansion cost, customer count) can. Full analysis, including the ranked candidate list and the
lifecycle assessment, is in [`MATCHED-NRR.md`](MATCHED-NRR.md).

This is a boundary of the model, not a bug. No quality score, risk coefficient or weighting factor
has been added to conceal it.

### 9. Reported KPIs and transition coefficients differ measurably

Twelve compounded monthly steps reproduce the intended annual NRR exactly. The decomposition does
not. At the defaults, measured from the opening cohort's first twelve months of flows:

| | Coefficient | Measured KPI | Gap |
|---|---|---|---|
| Persistence / GRR | 90.00% | 89.56% | −0.44pp |
| Expansion | 10.00% | 9.44% | −0.56pp |
| NRR | 99.00% | 99.00% | exact |

The gap widens with the size of the other process — at a 35% expansion coefficient, measured GRR
falls to 88.51%. It matters the moment anyone compares a modelled figure against a reported one,
or calibrates a model to a board pack. Surfaced in the interface rather than assumed away, and
invertible in closed form (see §D of `MEASUREMENT.md`).

---

## Still broken

### 10. Acquisition is linear and unbounded in S&M — the model can always buy growth

`New ARR = S&M ÷ cacPerARR` has no saturation term at any spend level. v0.2 fixed *which* variables
drive acquisition; it did not touch the *shape*. Doubling S&M still doubles New ARR, at month 1 and
at month 60, forever.

**What it teaches, wrongly:** every growth-investment experiment eventually pays off, and the S&M
slider has no wrong setting.

**Recommended:** a saturating response — `New ARR = A_max × S&M/(S&M+k)`, or a `cacPerARR` that
rises with spend (marginal worse than average). The single change that would give the model the
ability to say *stop*.

### 11. Efficiency and spend are indistinguishable in ARR

Improving `cacPerARR` 1.20× → 0.80× and raising S&M 50% both produce New ARR of €1.125m/month, and
their ARR paths agree to **€0.00** across 60 months.

| | Efficiency | Spend |
|---|---|---|
| Year-5 ARR | €84.88m | €84.88m |
| CAC payback (emergent) | 12.00 mo | 18.00 mo |
| Cumulative S&M | €54.00m | **€81.00m** |
| Cash trough | €7.43m (M8) | **€2.28m (M15)** |
| Ending cash | €103.85m | **€76.85m** |
| First profitable month | M9 | M16 |

€27m of capital separates two identical ARR curves. The engine is right; the *headline* misleads,
because ARR is prominent and efficiency is not. v0.2 improves this — CAC payback now moves in the
efficiency case and stays put in the spend case, which is a visible tell — but burn multiple and
S&M as a share of net new ARR still are not on screen.

### 12. Retention age structure exists now, but is coarse

v0.3 added three age bands — the minimum structure capable of expressing an age effect — and the
shipped default stays flat, so nothing is asserted about SaaS. What is still missing is resolution:
three step functions cannot represent a smooth survival curve, and the band edges (12 and 24
months) are themselves assumptions. A fidelity limit rather than a structural gap now, and it
should not be refined until there is evidence about the shape.

### 13. Expansion is unbounded

Expansion may now vary by age band, but nothing caps a cohort at any multiple of its initial ARR —
no seat ceiling, no penetration curve, no product limit. Nothing can ever exhaust an account, so
expansion headroom stays invisible.

### 14. Expansion is free

There is no cost attached to generating expansion ARR — no CSM capacity, account management,
implementation or upsell effort. This is now the most consequential single omission, because it is
the cheapest defensible way to break the matched-NRR tie: one coefficient, no ARR effect, and the
separation is exactly linear in it (`Δending cash = c × €15.12m`).

### 15. `FCF = EBITA` inverts the cash reality of subscription businesses

No deferred revenue, billings, working capital, tax, capex or interest. Real SaaS collects ahead of
recognition, so growth is *cash-generative* at the working-capital line — the opposite sign to what
this model shows. Every growth scenario looks more cash-expensive than it is.

### 16. R&D is a cost with no modelled benefit — deliberately

The future economic benefit of R&D is **outside the current simulation boundary**. v0.2 continues to
encode no `R&D → GRR` or `R&D → expansion` law, because there is no defensible universal
coefficient. The consequence is that the only conclusion the model can reach about R&D is *spend
less*, and the interface says so on screen.

The eventual fix is not a law but an **intervention**: let the user state a hypothesis — "€2m of
additional R&D over 12 months → expansion +3pp after a 9-month delay" — and simulate that. A
management thesis, explicitly owned by the user, not a property of SaaS. Not implemented.

### 17. No acquisition lag

S&M spent in month *t* produces ARR in month *t*. Real sales cycles run 3–9 months, and that lag is
exactly where the cash pain of a growth push lives.

### 18. Leakage is a single number, and there are no customers

Churn and contraction are combined, so the model cannot distinguish losing customers from customers
shrinking — which is why the measurement layer cannot report them separately either, however
correct its definitions are. Reactivation is zero. There is no customer count at all, so identical
ARR paths and identical reported KPIs can conceal completely different logo survival and expansion
concentration — see §F of `MEASUREMENT.md` for a worked pair.

### 19. The opening base is one cohort by default

A real €20m installed base is a mixture of vintages retaining far better than a cohort acquired last
month. One blended cohort systematically overstates decay of the existing book — which is 30% of
Year-5 ARR.

### 20. Midpoint revenue is an approximation

`((opening + closing) / 2) / 12` is a trapezoid rule on a geometrically moving stock. Small, and kept
because it is legible.

### 21. There is no price

Expansion and leakage are pure quantity effects. Pricing is the highest-leverage control a CFO
actually holds and it does not exist.

---

## What held up

- **The cohort spine.** Company ARR and revenue are only ever sums of cohorts, reconciling to ~10⁻⁸
  euros on €63m over all 60 months. Nothing is faked at the aggregate level.
- **Emergence.** Measured R12M NRR lands exactly on `P × (1 + X)`; the 10× S&M probe leaves every
  R12M measure bit-identical at every measurement date. CAC payback reconciles exactly to
  `cacPerARR × 12 ÷ GM` across a five-point probe.
- **Layer separation.** The KPI bridge reconciles to €1.5×10⁻⁸ and the identity
  `GRR + expansion = NRR` to 3.3×10⁻¹⁶ at all 49 measurement dates. Expansion is provably unable
  to improve GRR — it monotonically worsens it, which is the interaction effect showing up as a
  testable prediction rather than an assertion.
- **Invertibility.** Target measured KPIs can be reproduced by calibrated coefficients in closed
  form, to nine decimals, without touching acquisition physics.
- **Backward compatibility across four model versions.** v0.3's flat default reproduces v0.2.1
  exactly; v0.2.1's rename reproduced v0.2 exactly; v0.2's inverted primitive reproduced v0.1's
  baseline exactly. Every earlier result remains comparable.
- **Sunk cost stays sunk.** Doubling historical acquisition cost per cohort at identical New ARR
  leaves forward ARR, gross profit and retention unchanged to €0.0.
- **Lever separation, now complete.** Retention changes leakage and nothing else. S&M and
  acquisition productivity change acquisition and nothing else. Gross margin changes economics and
  nothing else — the last cross-contamination is gone.
- **Baseline continuity.** Inverting the primitive reproduced every Prototype 0 number exactly, so
  v0.1 and v0.2 results remain comparable.
- **Scenario isolation.** Base is frozen and the Experiment copied, never mutated; identical
  assumptions give byte-identical trajectories across 60 months and 61 cohorts.

## Suggested order from here

1. **The observability experiment** — can a 24- or 36-month KPI *history* identify the Time-0
   state, or is cohort vintage disclosure strictly necessary? No new physics; reuses everything
   v0.3 built; determines whether forward economic content is knowable from outside a company.
   **Recommended next.**
2. **Expansion cost** (`expansionCacPerARR`) — one coefficient, breaks the v0.2 matched-NRR tie
   without touching ARR, structurally symmetric with `cacPerARR`.
3. **Customer count and logo retention** — makes matched portfolios observably different with no
   judgment coefficient, and unlocks ARPA and concentration later.
3. **Diminishing returns on S&M** — gives the model the ability to say *stop*.
4. **Expansion saturation** — one parameter, and the first thing that changes the ARR *path*.
5. **Deferred revenue and billings** → a real FCF line.
6. Age-dependent retention (with the normalisation constraint in `MATCHED-NRR.md`), split leakage,
   acquisition lag, efficiency metrics on screen.
7. R&D as a user-stated intervention with an explicit lag — never as a universal coefficient.

Valuation, enterprise value and any 3D or final product design stay out until at least items 1–5
are done.
