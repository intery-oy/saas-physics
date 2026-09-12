# Spec — Notebook table (lab notebook)

Status: approved 12 Sep 2026 by Harri after CoS + SaaS CFO sync.

## 1. Intent

Add a Notebook surface: coherently grouped month × KPI data table for the current run. Lab notebook — inspectable, Base|Experiment-honest, substrate for charts later. Plain instrument output for the current run. Out of scope: charts, rail IA, new physics, auth, deploy, valuation. No watermark theater.

## 2. Placement

New view/tab **Appendix** (landed as Notebook; nav/label renamed 12 Sep 2026). Companion — does not replace Method/System/Scenarios 5&6. Same run as Base/Experiment. Same table surface.

## 3. Layout

Thin header: scenario name + Base|Exp toggle. Rows 0–60 sticky month. Collapsible sections; default open Revenue/Retention/Capital; default collapsed Unit economics/Logos. Money cells display as **€000** (engine euros ÷ 1000). Rates, payback months and logo counts are unscaled.

## 4. Base | Experiment

Whole-table toggle (v1). Default Experiment if any bound/force differs from Base, else Base. Never unlabeled merge.

## 5. Horizon and missing values

Full months 0–60 (match engine). Sticky month column. Missing or undefined values render as `—`, never a fake `0.00`. Single source of truth = the same series System already uses. No parallel math.

## 6. Columns

Use existing engine/KPI outputs only — do not invent.

**G1 Revenue:** ARR, MRR (native or ARR/12 labeled derived), New ARR, Expansion ARR, contraction/leakage (match engine terms), Net new ARR.

**G2 Retention:** GRR + NRR always as a pair.

**G3 Unit economics:** S&M (eff vs intended only if engine already distinguishes), CAC, CAC payback months, LTV:CAC only if already honest else omit.

**G4 Capital:** Cash, Burn (match engine definition), FCF, EBITA when useful.

**G5 Logos:** always present, default collapsed; logo count, logo retention. Show `—` when the logo bound is off.

## 7. CSV

Export visible columns if cheap. Plain filename is OK.

## 8. Header

Thin header only: scenario name + Base|Exp toggle (orientation, not compliance).

## 9. Acceptance

1. Notebook reachable from main demo HTML after `node build.js`.
2. Default world bounds-off: month-60 ARR = €62,926,223.19.
3. GRR and NRR always paired.
4. Base|Exp toggle works.
5. Logos section always present, default collapsed.
6. All existing Node suites still green.
7. Short doc note (PRODUCT_ASSESSMENT or README): Notebook = table substrate; charts later.
8. This spec committed as `docs/NOTEBOOK_TABLE_SPEC.md`.
9. PR with screenshots: default world, Scenario 5, one overnight bound on.
10. If a requested KPI is not in the engine, omit it and list the gap in the PR — do not invent.

## 10. Non-goals

Charts/sparklines, full right-rail IA, editable cells, CRM import, new coefficients, watermark banners.
