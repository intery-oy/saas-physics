# Where the physics break

Conceptual weaknesses exposed by running the prototype. Nothing here was silently "improved":
where an equation looked weak it was implemented as specified, and it stays that way until an
iteration is explicitly chartered to change it.

Updated for **model v0.2**. Ordered by how badly each distorts a CFO's intuition, not by how hard
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

## New in v0.2

### 1. Matched NRR hides two different businesses — and the reason is precise

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

### 2. The rate decomposition does not survive monthly conversion

Twelve compounded monthly steps reproduce the intended annual NRR exactly. The decomposition does
not. At the defaults, measured from the opening cohort's first twelve months of flows:

| | Input | Realised | Gap |
|---|---|---|---|
| Gross retention | 90.00% | 89.56% | −0.44pp |
| Expansion | 10.00% | 9.44% | −0.56pp |
| NRR | 99.00% | 99.00% | exact |

Both flows accrue on a base that moves during the year, and expansion accrues on the post-churn
base; the two errors offset exactly. So the aggregate is right while each component a finance team
would report back is slightly understated. Small, but it matters the moment anyone compares a
modelled GRR against a reported GRR. Surfaced in the interface rather than assumed away.

---

## Still broken

### 3. Acquisition is linear and unbounded in S&M — the model can always buy growth

`New ARR = S&M ÷ cacPerARR` has no saturation term at any spend level. v0.2 fixed *which* variables
drive acquisition; it did not touch the *shape*. Doubling S&M still doubles New ARR, at month 1 and
at month 60, forever.

**What it teaches, wrongly:** every growth-investment experiment eventually pays off, and the S&M
slider has no wrong setting.

**Recommended:** a saturating response — `New ARR = A_max × S&M/(S&M+k)`, or a `cacPerARR` that
rises with spend (marginal worse than average). The single change that would give the model the
ability to say *stop*.

### 4. Efficiency and spend are indistinguishable in ARR

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

### 5. Retention has no age structure

Constant monthly GRR gives every cohort the same hazard forever: a one-month-old and a five-year-old
cohort decay identically. Real survival curves have steeply *decreasing* hazard. The model therefore
overstates the fragility of the mature base and understates the value of a cohort that survives its
first two years. At the defaults the opening base is still €19.02m of €62.93m (30.2%) at month 60;
under a flattening hazard it would be materially higher. See `MATCHED-NRR.md` for why fixing this
is both the most powerful and the most assumption-laden option.

### 6. Expansion is unbounded and age-blind

Cohorts expand at a constant rate indefinitely — no seat ceiling, no penetration curve, no product
limit. Nothing can exhaust an account. Combined with §5 the cohort model is entirely scale-free.

### 7. Expansion is free

There is no cost attached to generating expansion ARR — no CSM capacity, account management,
implementation or upsell effort. This is now the most consequential single omission, because it is
the cheapest defensible way to break the matched-NRR tie: one coefficient, no ARR effect, and the
separation is exactly linear in it (`Δending cash = c × €15.12m`).

### 8. `FCF = EBITA` inverts the cash reality of subscription businesses

No deferred revenue, billings, working capital, tax, capex or interest. Real SaaS collects ahead of
recognition, so growth is *cash-generative* at the working-capital line — the opposite sign to what
this model shows. Every growth scenario looks more cash-expensive than it is.

### 9. R&D is a cost with no modelled benefit — deliberately

The future economic benefit of R&D is **outside the current simulation boundary**. v0.2 continues to
encode no `R&D → GRR` or `R&D → expansion` law, because there is no defensible universal
coefficient. The consequence is that the only conclusion the model can reach about R&D is *spend
less*, and the interface says so on screen.

The eventual fix is not a law but an **intervention**: let the user state a hypothesis — "€2m of
additional R&D over 12 months → expansion +3pp after a 9-month delay" — and simulate that. A
management thesis, explicitly owned by the user, not a property of SaaS. Not implemented.

### 10. No acquisition lag

S&M spent in month *t* produces ARR in month *t*. Real sales cycles run 3–9 months, and that lag is
exactly where the cash pain of a growth push lives.

### 11. Leakage is a single number

Churn and contraction are combined, so the model cannot distinguish losing customers from customers
shrinking. Reactivation is zero. There is also no customer count, so identical ARR paths can conceal
very different logo survival — see `MATCHED-NRR.md`.

### 12. The opening base is one cohort running new-cohort physics

A real €20m installed base is a mixture of vintages retaining far better than a cohort acquired last
month. One blended cohort systematically overstates decay of the existing book — which is 30% of
Year-5 ARR.

### 13. Midpoint revenue is an approximation

`((opening + closing) / 2) / 12` is a trapezoid rule on a geometrically moving stock. Small, and kept
because it is legible.

### 14. There is no price

Expansion and leakage are pure quantity effects. Pricing is the highest-leverage control a CFO
actually holds and it does not exist.

---

## What held up

- **The cohort spine.** Company ARR and revenue are only ever sums of cohorts, reconciling to ~10⁻⁸
  euros on €63m over all 60 months. Nothing is faked at the aggregate level.
- **Emergence.** NRR lands exactly on `GRR × (1 + expansion)`; the 10× S&M probe leaves the NRR
  series bit-identical. CAC payback now reconciles exactly to `cacPerARR × 12 ÷ GM` across a
  five-point probe.
- **Lever separation, now complete.** Retention changes leakage and nothing else. S&M and
  acquisition productivity change acquisition and nothing else. Gross margin changes economics and
  nothing else — the last cross-contamination is gone.
- **Baseline continuity.** Inverting the primitive reproduced every Prototype 0 number exactly, so
  v0.1 and v0.2 results remain comparable.
- **Scenario isolation.** Base is frozen and the Experiment copied, never mutated; identical
  assumptions give byte-identical trajectories across 60 months and 61 cohorts.

## Suggested order from here

1. **Expansion cost** (`expansionCacPerARR`) — one coefficient, breaks the matched-NRR tie without
   touching ARR, structurally symmetric with `cacPerARR`. Recommended next.
2. **Customer count and logo retention** — makes R and X observably different with no judgment
   coefficient, and unlocks ARPA and concentration later.
3. **Diminishing returns on S&M** — gives the model the ability to say *stop*.
4. **Expansion saturation** — one parameter, and the first thing that changes the ARR *path*.
5. **Deferred revenue and billings** → a real FCF line.
6. Age-dependent retention (with the normalisation constraint in `MATCHED-NRR.md`), split leakage,
   acquisition lag, efficiency metrics on screen.
7. R&D as a user-stated intervention with an explicit lag — never as a universal coefficient.

Valuation, enterprise value and any 3D or final product design stay out until at least items 1–5
are done.
