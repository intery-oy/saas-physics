# Where the physics break

Conceptual weaknesses exposed by running Prototype 0. Per instruction 19, the stated v0.1
model was implemented faithfully and none of these were silently "improved" — they are
recorded here with the numbers that reveal them and a recommended v0.2 change.

Ordered by how badly each one distorts a CFO's intuition, not by how hard it is to fix.

---

## 1. Acquisition is linear and unbounded in S&M — the model can always buy growth

`New ARR = S&M × 12 ÷ (payback × GM)` has no saturation term. Doubling S&M doubles New ARR,
at month 1 and at month 60, forever. There is no level of spend at which the next euro buys
less than the last.

**What it teaches, wrongly:** every growth-investment experiment eventually pays off; the only
cost of spending more is timing. A user will conclude that the S&M slider has no wrong setting.

**Recommended v0.2:** a saturating acquisition response — either `New ARR = A_max × S&M/(S&M+k)`,
or a marginal-CAC curve where CAC payback rises with spend. This is the single change that
gives the model the ability to say *stop*.

---

## 2. Gross margin sits in the denominator of the acquisition formula (Scenario E)

Cutting GM 80% → 65% at constant CAC payback:

| | Base | GM 65% |
|---|---|---|
| New ARR / month | €0.75m | **€0.92m** |
| Year-5 ARR | €62.93m | **€73.06m** |
| Cumulative gross profit | €166.57m | **€151.94m** |
| Implied CAC per €1 of new ARR | €1.20 | **€0.98** |

The model reports a **bigger, poorer company**, and the ARR chart moves in the wrong direction
for a margin deterioration.

It is internally consistent — CAC payback is *defined* on gross profit, so holding payback fixed
while cutting GM implicitly asserts that CAC per euro of new ARR fell 18.7%. But nobody assumed
that, and no CFO moving a margin slider intends it. Holding CAC per € of new ARR constant instead
(payback 22.2 months) gives New ARR €0.75m/mo and Year-5 ARR €62.93m — margin change, no ARR
change, which is the intended behaviour.

**Verdict: the coupling behaves as specified but not as intended.** The causal direction is
inverted.

**Recommended v0.2:** make **CAC per € of new ARR** (or an S&M-efficiency coefficient) the
primitive control, and derive CAC payback as an *output*: `payback = CAC ÷ ((New ARR/12) × GM)`.
Then gross margin correctly affects payback and cash, and leaves acquisition volume alone.
The interface already flags this coupling live whenever the GM control is moved.

---

## 3. Scenarios C and D are indistinguishable in ARR

Improving CAC payback 18 → 12 months and raising S&M by 50% both scale New ARR by exactly 1.5×.
The two ARR paths agree to €3.0 × 10⁻⁸ across all 60 months — the same company, twice.

| | C (payback 12) | D (+50% S&M) |
|---|---|---|
| Year-5 ARR | €84.88m | €84.88m |
| Cumulative S&M | €54.00m | **€81.00m** |
| Ending cash | €103.85m | **€76.85m** |
| Cash trough | €7.43m (M8) | **€2.28m (M15)** |

€27m of cash separates two identical ARR curves. The engine is right; the *display* is what
misleads, because ARR is the headline and efficiency is nowhere on screen.

**Recommended v0.2:** promote burn multiple (net burn ÷ net new ARR) and S&M as a percentage of
net new ARR to first-class emergent metrics with their own chart. This is the cheapest single
improvement to the product's teaching value.

---

## 4. Retention has no age structure

A constant monthly GRR gives every cohort the same hazard rate forever: a one-month-old cohort
and a five-year-old cohort decay identically, and every cohort decays exponentially to zero.
Real SaaS survival curves have steeply *decreasing* hazard — heavy early churn that flattens as
the surviving base becomes structurally embedded.

**Consequence:** the model overstates the fragility of the mature installed base and understates
the long-run value of a cohort that survives its first two years. At the defaults the opening
base is still €19.02m of €62.93m (30.2%) at month 60; under a realistic flattening hazard it
would be materially higher, and the whole case for retention investment would look stronger
than Scenario A already makes it look.

**Recommended v0.2:** age-dependent GRR — a survival curve, or at minimum a two-parameter
early-life / mature-life split.

---

## 5. Expansion is unbounded and age-blind

Cohorts expand at a constant rate indefinitely, with no seat ceiling, penetration curve or
product limit. Nothing in the model can ever exhaust an account. In Scenario B (expansion
10% → 20%) cumulative expansion rises €19.58m → €45.04m with no mechanism that could saturate.
Combined with §4 the cohort model is entirely scale-free.

**Recommended v0.2:** an expansion ceiling per cohort (a maximum multiple of initial ARR), or an
expansion rate that decays with account penetration.

---

## 6. `FCF = EBITA` inverts the cash reality of subscription businesses

No deferred revenue, no billings, no working capital, no tax, no capex, no interest on the cash
balance. Real SaaS collects ahead of recognition, so growth is *cash-generative* at the
working-capital line — the opposite sign to what this model shows.

**Consequence:** every growth scenario looks more cash-expensive than it is. Scenario D's trough
of €2.28m at M15 is a pessimistic artefact of a missing balance sheet, not a finding.

**Recommended v0.2:** a billing-frequency assumption (monthly / quarterly / annual upfront) and a
deferred-revenue balance. That alone flips the near-term cash sign of a growth push, and it is
the single most CFO-relevant thing missing from the model.

---

## 7. R&D is a pure cost with no modelled benefit

Faithfully implemented per spec, and actively misleading. Integrity check 11 confirms that
+€0.25m/month of R&D reduces EBITA and FCF one-for-one — €15.0m of cash over 60 months — and
changes nothing else at all. The only conclusion this model can reach about R&D is *spend less*.

**Recommended v0.2:** this should be the first thing added. R&D → GRR and/or expansion with a
lag of several quarters. Until then, the R&D control teaches a false lesson every time anyone
touches it, and the interface says so on screen.

---

## 8. No acquisition lag

S&M spent in month *t* produces ARR in month *t*. Real sales cycles run 3–9 months, and that lag
is exactly where the cash pain of a growth push lives. Scenario D understates the near-term
damage of the decision it is meant to illustrate.

---

## 9. Leakage is a single number

Churn and contraction are combined, so the model cannot distinguish a company losing customers
from one whose customers are shrinking. These are economically different situations with
different interventions. Reactivation is fixed at zero.

---

## 10. The opening base is one cohort running new-cohort physics

A real €20m installed base is a mixture of vintages, most of them well past their early-churn
period and retaining far better than a cohort acquired last month. Representing it as a single
cohort at the blended rate systematically overstates decay of the existing book — and the
existing book is 30% of Year-5 ARR, so this is not a rounding error.

**Recommended v0.2:** seed the opening ARR as several synthetic vintages with an assumed age
distribution.

---

## 11. Midpoint revenue is an approximation

`revenue = ((opening + closing) / 2) / 12` is a trapezoid rule applied to a stock that actually
moves geometrically. At 44% annual growth the error is small but real, and it means revenue is
not exactly the integral of ARR. Kept because it is legible, and legibility is the point of
Prototype 0.

---

## 12. There is no price

Expansion and leakage are pure quantity effects. Pricing is the highest-leverage control a CFO
actually holds and it does not exist in v0.1 — which means the model cannot represent the most
common real intervention on any of these lines.

---

## What held up

- **The cohort spine.** Company ARR and revenue are only ever sums of cohorts, reconciling to
  ~10⁻⁸ euros on €63m over all 60 months. Nothing needed to be faked at the aggregate level.
- **Emergence.** NRR is never an input and lands exactly on `GRR × (1 + expansion)`; the 10× S&M
  probe leaves the NRR series bit-identical, so New ARR is provably excluded.
- **Lever separation.** Retention changes leakage and nothing else; S&M changes acquisition and
  nothing else. Scenario A adds €14.95m of Year-5 ARR with zero change to New ARR — the model
  genuinely distinguishes *keeping* from *buying*, which is the distinction the whole product
  exists to teach.
- **Scenario isolation.** Base is frozen and the Experiment is copied, never mutated; identical
  assumptions produce byte-identical trajectories across 60 months and 61 cohorts.

## Suggested v0.2 order

1. R&D → retention / expansion with a lag (removes the one actively false lesson)
2. Invert the acquisition primitive — CAC per € of new ARR in, payback out (fixes §2)
3. Diminishing returns on S&M (gives the model the ability to say *stop*)
4. Age-dependent retention curve, and seed the opening base as vintages
5. Deferred revenue and billings → a real FCF line
6. Split leakage into churn and contraction; add reactivation
7. Acquisition lag
8. Efficiency metrics on screen (burn multiple, S&M % of net new ARR)

Valuation, enterprise value and any 3D or final product design stay out until at least items
1–5 are done — otherwise the multiple would be applied to a trajectory that is wrong for
reasons the model cannot see.
