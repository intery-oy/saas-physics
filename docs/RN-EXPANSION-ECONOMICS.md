# Research Note — Expansion Economics (v1.1)

Every figure below is printed by `node physics-study.js` §1 and asserted by `node checks.js`
(EXP-COST, checks 36–40) and `node physics-checks.js` (COST+SAT, ALL-NULL).

## Question

*If generating expansion ARR itself consumes economic resources, does NRR composition begin to
matter economically even when ARR paths remain identical?*

Before this mechanism the engine could not ask it. The matched-NRR experiment
(`docs/MATCHED-NRR.md`) proved that a retention-heavy and an expansion-heavy installed base with
the same NRR are the same company to every downstream quantity, because only the product
`persistence × (1 + expansion)` reaches the ARR stock and nothing outside the recursion consumes
leakage or expansion separately. The CFO question that blocked — *what incremental economic
resources are required to generate expansion?* — had no object to attach to.

## New economic object

One transition coefficient, `expansionCostPerARR` (€ of cost per €1 of expansion ARR), and one
flow it creates, `expansionCost`:

```
expansionCost (cohort, month) = expansionARR (cohort, month) × expansionCostPerARR
expansionCost (company)       = Σ cohorts                       (by construction)
EBITA                         = GP − S&M − R&D − G&A − expansionCost
```

It is a **cost of realising expansion that the existing recurrence already produced**. The
engine computes it after a cohort's closing balance is fixed and never reads it back, so
retained, expansion, closing, GRR and NRR cannot depend on it. It is carried as its own named
P&L line and deliberately not classified as COGS, S&M or CSM: the model prices the cost, it does
not model what the cost buys.

## Null world

`expansionCostPerARR = 0` (the default). The line is €0 in every month, the P&L identity holds
with the line in it, and the whole v1.0 trajectory is reproduced exactly (ALL-NULL: worst |Δ| =
€0.00e+0 against `baseline-v1.0.json`).

## Invariants

If the mechanism is correctly isolated, a positive cost must leave unchanged:

- closing ARR, New ARR, expansion ARR, leakage — every month, every cohort;
- R12M GRR, expansion and NRR at every measurement date;
- the acquisition response (New ARR, average and marginal CAC, utilisation).

And it must move cash by exactly the cumulative line.

Measured (check 37, 38, 12): max ARR-state delta €0.0e+0; max KPI delta 0.0e+0; max
|line − expansion × c| €2.9e-11; max cash residual €9.8e-9; acquisition response identical with
and without the cost.

## Falsification experiment

Take the matched *measured*-NRR pair from `scenarios.js` — R calibrated to report GRR 96.0% /
expansion 9.6%, X to report GRR 90.0% / expansion 15.6%, both NRR 105.6% (`K.calibrate`) — and
sweep the cost. The implementation is wrong if any of the following happens: the ARR paths
separate; the NRR paths separate; the cash gap is not linear in the cost; or the retention-heavy
world pays more.

## Result

| cost / €1 expansion ARR | max ΔARR (60m) | max ΔNRR | realisation cost R | realisation cost X | cash R (M60) | cash X (M60) | X − R | c × Δexpansion |
|---|---|---|---|---|---|---|---|---|
| 0.00× | €4.5e-7 | 2.4e-15 | €0.00m | €0.00m | €83.50m | €83.50m | +€0.00m | +€0.00m |
| 0.10× | €4.5e-7 | 2.4e-15 | €2.21m | €3.59m | €81.29m | €79.91m | −€1.38m | −€1.38m |
| 0.25× | €4.5e-7 | 2.4e-15 | €5.52m | €8.96m | €77.98m | €74.53m | −€3.45m | −€3.45m |
| 0.50× | €4.5e-7 | 2.4e-15 | €11.03m | €17.93m | €72.46m | €65.57m | −€6.90m | −€6.90m |
| 1.00× | €4.5e-7 | 2.4e-15 | €22.07m | €35.86m | €61.43m | €47.64m | −€13.79m | −€13.79m |

Cumulative expansion ARR over 60 months: R €22.07m, X €35.86m, difference €13.79m. The ending
cash gap is `c × €13.79m` to within €6.7e-7 at every c tested (check 40). Measured back from
flows at T = 36, Σcost ÷ Σexpansion reads 0.250000× and the line is 2.90% of R12M gross profit.

**Within this model: NRR composition is irrelevant to ARR dynamics under the existing recurrence,
and ceases to be economically equivalent once expansion carries a realisation cost.** The
separation is linear in the cost and has no threshold — any c > 0 separates the pair. That is a
property of the mechanism as introduced, not a claim about SaaS companies.

(`docs/MATCHED-NRR.md` quoted a €15.12m difference for the *coefficient*-defined pair 96% × 110%
vs 90% × 117.33%; the figure here is for the *measured*-KPI-defined pair, which reaches the same
NRR with different coefficients. Both constructions behave identically under the mechanism.)

## Boundary

- The cost is a price, not a mechanism: nothing in the engine says what the €0.25 buys, whether
  it scales with headcount, or whether it could be spent to *raise* expansion. R&D and any
  cost → expansion law remain absent (FINDINGS #16).
- The cost is linear in expansion ARR. Real realisation costs may be lumpy (implementation),
  fixed (a CSM team), or falling with scale; none of that is modelled.
- The capital-recovery track still measures cohort gross profit against acquisition cost only;
  it discloses that the realisation cost is excluded rather than netting it.
- Because the mechanism never touches ARR, it cannot separate the pair *observably* — a reader
  of ARR, GRR and NRR still sees one company. Only the cash line differs. Observability of the
  hidden composition is unchanged (FINDINGS #22).
