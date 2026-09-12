# Cohorts v1

Status: locked 12 Sep 2026 by Harri. Composition + vintage reading + age toggle.

**Question.** Which vintage is carrying/leaking the book — and does blended NRR conceal variation?

A companion surface to Company / System. Not a KPI tile wall, not a retention triangle, not a second engine.

## What it is

| Mode | What you see | Source |
|---|---|---|
| **Composition (K2, default)** | Yearly vintage stocks stacked over 60 months. Birth stems = New ARR (one vintage born each month). | `cohort.rows[].closingARR` grouped like `engine.arrMix` (opening + Y1–Y5). Births = `months[].newARR`. |
| **Vintage reading (K1, always on)** | Which of m0 / m12 / m24 / m36 / m48 carries vs leaks. Blended R12M NRR as a **warning**, not a hero. GRR vs expansion vs NRR. Contraction only when logos are on. | Vintage GRR/NRR = that acquisition month's `measureR12M.contributions` at T (current window, so age-dependent laws can disagree). First-year window is the fallback if the vintage is not yet eligible. Carry/leak = `currentARR / initialARR`. Blended = `K.measureR12M(res, T)`. |
| **Age profile (K3)** | Horizon ARR by 12-month age. GRR solid / NRR dashed; the gap is measured expansion (`NRR − GRR`). Affordance to Scenario 6 / Tenure when age is a no-op. | Bars: existing cohort ages at T (display buckets). Engine bands via `K.ageComposition`. Rates: weighted `measureR12M.contributions` by `ageAtOpening`. |

Money is **€000**. Base | Experiment is a whole-page toggle, same rule as Appendix.

## What it is not

- No KPI tile wall.
- No cohort triangle as sole truth.
- No selling one blended retention number as cohort truth.
- No new physics coefficients. If a series is missing, the cell is `—`.

## Vintage-reading rules

- **Flat tenure** (the default): every vintage shares the same rate. Blended NRR *is* the vintage NRR. The stack is provenance, not a retention story. Footnote: *flat-law vintage mix is a no-op*.
- **Non-flat tenure** (Tenure laws or Scenario 6): vintages can disagree. Blended NRR is marked as mixing rates — not the hero number.
- **Logos ≠ ARR.** Logo count is a customer stock. ARR is the recurring-state stock. Contraction is `—` until `logoRetentionAnnual` is on; leakage stays one number.

## Display vs engine bands

The engine still has three transition bands: Early / Developing / Mature (0–11 / 12–23 / 24+). Age-profile bars use 12-month **display** buckets of those same ages so m36 and m48 are visible. That is grouping, not a fourth law. The side panel also prints `K.ageComposition` (the three engine bands).

## Gaps (not invented)

| Ask | What v1 does |
|---|---|
| Per-month vintage (61 layers) | Yearly `arrMix` layers — same grouping Company already uses for mix. Monthly hairlines stay on Company Inspect. |
| Contraction without logos | `—`. The engine cannot split leakage. |
| R12M before month 12 | `—`. |
| A vintage not yet born | Vintage-reading card omitted / `—`. |

## Nav

`Company · System · Scenarios · Cohorts · Appendix`

Appendix is the renamed Notebook table. Same month × KPI substrate; no physics change.
