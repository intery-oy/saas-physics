# Capital Loop — concept study

The engine is frozen. `engine.js`, `kpi.js` and `integrity.js` are byte-identical to the v0.3
commit and `node checks.js` still returns 35 / 35. Every quantity below is **derived** from two
things the engine already stores: `cohort.acquisitionCost`, stamped at creation, and
`cohort.rows[].cumGrossProfit`.

It is an **economic attribution model**. It does not claim gross profit literally flows back to the
euro of S&M that was spent.

---

## B. Visual grammar

| Element | Calculated quantity | Economic meaning | Why the mapping is defensible |
|---|---|---|---|
| **The drop** at a cohort's acquisition month | `acquisitionCost` stamped at creation | Capital leaving, at a specific instant | It happens at one month and nowhere else, so it is a vertical event at that x, not a flow |
| **Below the surface** | `max(acquisitionCost − cumGP(t), 0)` | Capital still out | Depth is the unrecovered amount; it can only shrink as gross profit accumulates |
| **The crossing** | first `t` where `cumGP(t) ≥ acquisitionCost` | Payback | **The horizontal distance from the drop to the crossing is the payback time.** Time is drawn as time |
| **Above the surface** | `cumGP(t) − acquisitionCost` | Gross profit beyond attributed acquisition cost | Deliberately not called profit, value or ROI |
| **The span bracket** | acquisition month → payback month | The payback interval | A measured length, so it cannot be read as a ratio |
| **Dashed cool curve** | the same cohort under Base | The frozen reference | Base is a ghost everywhere else in this grammar; it is one here too |
| **Cohort colour** | acquisition month on the validated vintage ramp | Identity | The trench is drawn in the stratum's own colour, tying the capital story to the ARR story |
| **GP-by-vintage strip** | each cohort's `grossProfit` this month | Which historical cohorts produce today's output | Same ramp as the strata, so the eye connects them |
| **Portfolio track** | Σ outstanding, Σ surplus | Aggregate capital out and returned | Symmetric scale so neither half is squeezed |

Deliberately **not** used: cash as a foundation supporting ARR, electricity, closed water cycles,
gravity, pipes, particles, glow-as-margin, or any literal recycling of individual euros.

---

## §20 Calibration — verified, not asserted

```
Closed form   payback = cacPerARR × 12 ÷ GM = 1.20 × 12 ÷ 0.80 = 18.00 months
Observed      first month where a cohort's cumulative GP ≥ its stamped acquisition cost
```

| Cohort | Cost | Payback month | Age at payback | cumGP @ M60 | Beyond cost |
|---|---|---|---|---|---|
| M1 | €900k | M19 | **18 months** | €2.90m | €2.00m |
| M6 | €900k | M24 | **18 months** | €2.66m | €1.76m |
| M12 | €900k | M30 | **18 months** | €2.38m | €1.48m |
| M24 | €900k | M42 | **18 months** | €1.80m | €0.90m |
| M36 | €900k | M54 | **18 months** | €1.21m | €0.31m |

Read off `cumGrossProfit`, never hard-coded. The half-month of revenue in a cohort's birth month
and its slight net decay very nearly cancel.

---

## C. One cohort, acquisition through payback

Cohort M1 — €900k deployed, €750k of ARR created:

| Age | ARR | GP this month | Cumulative GP | Unrecovered | State |
|---|---|---|---|---|---|
| 0 | €750k | €25k | €25k | €875k | capital still out |
| 6 | €746k | €50k | €324k | €576k | capital still out |
| 12 | €743k | €50k | €622k | €278k | capital still out |
| 17 | €739k | €49k | €869k | €31k | capital still out |
| **18** | €739k | €49k | €918k | **€0** | **PAYBACK** |
| 30 | €731k | €49k | €1.51m | €0 | beyond cost €606k |
| 59 | €714k | €48k | €2.90m | €0 | beyond cost €2.00m |

---

## D. Efficiency vs Spend — same ARR trajectory, different capital journey

Both calibrated to New ARR €1.125m/month. ARR paths agree to **€0.00** across all 60 months.

| | Efficiency | Spend |
|---|---|---|
| Acquisition cost per cohort | €900k | **€1,350k** |
| CAC payback, closed form | 12.0 mo | **18.0 mo** |
| CAC payback, observed age | 12 mo | **18 mo** |
| Capital deployed over 60 months | €54.00m | **€81.00m** |
| Capital recovered by M60 | €48.58m | €68.79m |
| Still outstanding at M60 | €5.42m | **€12.21m** |
| Year-5 ARR | €84.88m | €84.88m |
| Cumulative gross profit | €210.85m | €210.85m |
| First profitable month | M9 | **M16** |
| Cash trough | €7.43m | **€2.28m** |
| Ending cash | €103.85m | **€76.85m** |

Identical mass. Every trench 50% deeper and 6 months wider.

---

## E. Retention — same sunk cost, different output from it

| | Persistence 90% | Persistence 96% |
|---|---|---|
| Acquisition cost, sunk and unchanged | €900k | €900k |
| Payback age | 18 months | 17 months |
| Cohort cumulative GP by M60 | €2.90m | **€3.41m** |
| GP beyond acquisition cost | €2.00m | **€2.51m** |
| Cohort ARR still alive at M60 | €714k | **€980k** |

The drop is the same depth in both — the money was already spent. The recovery curve rises higher
and keeps rising. **€0.50m more gross profit beyond cost, from the same €900k.** No LTV required.

---

## F. Gross margin — same acquisition productivity, slower recovery

| | GM 80% | GM 65% |
|---|---|---|
| New ARR per month | €750k | €750k |
| Acquisition cost per cohort | €900k | €900k |
| CAC payback, closed form | 18.00 mo | **22.15 mo** |
| CAC payback, observed age | 18 months | **22 months** |
| Cohort cumulative GP by M60 | €2.90m | €2.36m |
| Ending cash | €59.57m | **€28.34m** |

The mass is pixel-identical to Base and two crossings sit four months apart on the same track. This
is the study's best single frame.

---

## The temporal truth

Share of **this month's** gross profit, by where the ARR came from:

| Month | GP this month | Opening base | Earlier acquisitions | This month's cohort |
|---|---|---|---|---|
| M6 | €1.60m | 82.9% | 15.6% | 1.6% |
| M12 | €1.89m | 69.8% | 28.9% | 1.3% |
| M24 | €2.47m | 52.9% | 46.1% | 1.0% |
| M36 | €3.04m | 42.5% | 56.7% | 0.8% |
| M60 | €4.17m | 30.4% | 69.0% | **0.6%** |

At M60: €54.00m deployed, €45.86m recovered (84.9%), €8.14m still out across 18 cohorts. **99.4% of
today's gross profit is the delayed return on capital deployed in earlier months.** Nothing in the
picture lets you read `S&M(t) → GP(t)` as a same-period relationship.

---

## G. Comprehension assessment (§19)

| Question | Verdict |
|---|---|
| **A. Why is CAC Payback about time?** | **Strongly helped.** The drop-to-crossing span is the answer, drawn as a length. Once seen, payback is hard to think of as a ratio again |
| **B. Why can identical ARR trajectories consume different capital?** | **Strongly helped.** Paired mode with Capital on: identical mass, every trench 50% deeper and 6 months wider. Acquisition efficiency and additional spend become visibly different objects |
| **C. Why does retention improve the economics of capital already invested?** | **Adequate.** Works once Base is ghosted on the track: same drop depth, higher recovery curve. Weakest of the four, because the story lives in a modest vertical gap far to the right, and payback moves only one month |
| **D. Why does GM affect payback without changing New ARR?** | **Strongly helped.** The mass is unchanged and two crossings sit four months apart. The clearest frame in the study |

Three strong, one adequate.

---

## H. What the visual cannot yet represent

1. **Expansion carries no attributed acquisition cost.** An explicit current physics assumption. A
   cohort that expands appears to return capital for free.
2. **The opening base has no stamped acquisition cost** — it predates the simulation, so 30–42% of
   ARR has no capital story. Shown as "unknown", never as zero, but the portfolio track therefore
   understates capital deployed.
3. **GP-by-vintage carries no information the strata do not already carry.** With one uniform gross
   margin, a cohort's GP is exactly `ARR × GM ÷ 12`, so the attribution strip is the ARR mix scaled
   by a constant. It is honest and it is the weakest element here.
4. **R&D and G&A are period costs, unattributed to cohorts.** The loop covers acquisition capital
   only, not total capital deployed.
5. **`FCF = EBITA`.** No working capital, deferred revenue, tax or capex, so cash timing is
   pessimistic for a fast grower.
6. **Nothing is discounted.** "GP beyond acquisition cost" is not profit, value or ROI.
7. **No two-cohort comparison within one scenario.** You can compare one cohort across scenarios;
   you cannot put two vintages side by side.

Not fixed automatically.

---

## I. Recommendation

# KEEP CAPITAL LOOP

The **cohort recovery track earns its place**: it is spatial rather than chart-like, it shares the
existing time axis and the cohort's own colour, it does not compete with the strata, and it converts
CAC payback from a ratio into a measured distance. Three of the four comprehension questions are
answered by looking rather than reading.

Two elements earn less and should be treated as provisional:

- **The portfolio track** is the closest thing here to an ordinary area chart. Keep it as the
  default state when nothing is selected, but its teaching value is well below the cohort view.
- **The GP-by-vintage strip** is redundant under current physics (§H3). Keep it only as the hook for
  the temporal-truth statistic — "99.4% of today's gross profit comes from earlier capital" — which
  is the sentence that carries the idea, not the bar.

The single change that most improved the study was drawing **Base as a ghost on the capital track**.
It is what makes the retention and margin experiments legible, and it was already the grammar
everywhere else.

Do not proceed further without a decision on §H1 and §H2 — expansion CAC and opening-base
provenance are the two boundaries that most limit what this layer can honestly claim.
