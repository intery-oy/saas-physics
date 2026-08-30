# Reconciliation, integrity and scenario results

Generated output from `node checks.js` and `node scenarios.js` (model v0.2). Regenerate with `npm run report`.

## Integrity checks

```

SaaS Physics — Prototype 0 integrity checks
================================================================================
  PASS  1. ARR bridge reconciles every month (Opening + New + Expansion − Leakage = Closing)
        max residual €2.235e-8 at M23
  PASS  2. Company ARR = sum of cohort ARR (aggregates are never computed separately)
        max divergence €2.235e-8
  PASS  3. Company revenue = sum of cohort revenue
        max divergence €1.863e-9
  PASS  4. Retention never grows the base pre-expansion (retained ≤ opening, leakage ≥ 0)
        0 retention violations, 0 negative-leakage rows
  PASS  5. New ARR is excluded from NRR (10× S&M leaves NRR bit-identical)
        NRR delta 3.442e-15 while New ARR scaled 10.0000×
  PASS  6. NRR emerges from GRR × (1 + expansion) — never an input
        simulated 99.0000% vs implied 99.0000%
  PASS  7. Cash rolls forward (opening + FCF = closing; ending = opening + Σ FCF)
        max step residual €0.000e+0, ending residual €1.490e-8
  PASS  8. Base and Experiment run through one engine entry point and one output schema
        E.run is the single entry point; identical output schema: true
  PASS  9. Raising GRR alone creates no New ARR (it only reduces leakage)
        New ARR delta €0.000e+0; M60 ARR 62.93m → 77.87m
  PASS  10. +50% S&M raises month-1 spend immediately and New ARR by the stated formula
        M1 S&M €1.350m → New ARR €1.1250m (formula match: true)
  PASS  11. +€0.25m/mo R&D cuts EBITA and FCF one-for-one, with zero ARR benefit (none is modelled)
        EBITA delta exact to €0.000e+0; ARR unchanged to €0.000e+0
  PASS  12. Identical assumptions produce byte-identical trajectories (fully deterministic)
        deep equality over 60 months and 61 cohorts
  PASS  13. ACQ · New ARR generator reads only S&M and cacPerARR — CAC payback and GM appear nowhere in it
        newARRPerMonth() source references cacPerARR: true, cacPayback: false, grossMargin: false
  PASS  14. ACQ · Changing gross margin alone leaves New ARR unchanged (GM swept 40%→92%, and month by month)
        max New ARR spread across the GM sweep €0.000e+0; max monthly delta at GM 64% €0.000e+0
  PASS  15. ACQ · New ARR = monthly S&M ÷ cacPerARR exactly (annualised: S&M × 12 ÷ cacPerARR)
        max deviation over 4 probes €0.000e+0; e.g. €500k/mo at 1.5× → €4.00m of New ARR per year of spend
  PASS  16. ACQ · Changing gross margin alone deteriorates CAC payback (the intended causal direction)
        GM 80% → 64% moves payback 18.00 → 22.50 months
  PASS  17. ACQ · CAC payback = cacPerARR × 12 ÷ GM, and is only ever an output
        max deviation over 5 probes 0.000e+0 months; e.g. 1.00× at GM 80% → 15.0 months
  PASS  18. ACQ · Matched-NRR scenarios R (96%×110%) and X (90%×117.33%) both reproduce NRR 105.6%
        R 105.6000000000%, X 105.6000000000%, max deviation 5.55e-15
================================================================================
18 / 18 checks passed

```

## Rate conversion, Scenarios A–E, matched-NRR and efficiency-vs-spend

```

SaaS Physics — Prototype 0.2   (model v0.2)
────────────────────────────────────────────────────────────────────────────────
BASE  S&M €0.90m/mo · CAC/New ARR 1.20× · GRR 90.0% · expansion 10.0% · GM 80.0% · R&D €0.70m/mo · G&A €0.35m/mo
      Opening ARR €20.00m, opening cash €10.00m
DERIVED  New ARR €0.75m/mo (€9.00m per year of spend) · CAC payback 18.00 mo (EMERGENT)
OUTCOME  M60 ARR €62.93m · NRR 99.0% · Y5 FCF €23.58m · ending cash €59.57m · trough €6.10m (M13)

────────────────────────────────────────────────────────────────────────────────
RATE CONVERSION — how annual GRR and expansion become monthly rates
────────────────────────────────────────────────────────────────────────────────
  monthly GRR                       99.125839%   = GRR^(1/12)
  monthly expansion                 0.797414%   = (1+expansion)^(1/12) − 1
  monthly NRR                       99.916282%   = mGRR × (1 + mExpansion)
  12-month compounded GRR           90.000000%   (input 90.0000%)
  12-month compounded expansion     10.000000%   (input 10.0000%)
  12-month compounded NRR           99.000000%   = GRR × (1 + expansion). EXACT.

  Measured from the opening cohort's first 12 months of actual flows:
  realised gross retention          89.5582%   (1 − Σleakage/opening ARR)
  realised expansion                9.4418%   (Σexpansion/opening ARR)
  realised NRR                      99.000000%   closing/opening. EXACT.

  ⚠ SUBTLETY. Annual NRR is reproduced exactly, but the DECOMPOSITION is not:
    gross retention reads −0.4pp vs input, expansion −0.6pp vs input.
    Both flows accrue on a base that moves during the year, and expansion accrues on
    the POST-churn base. The two errors offset exactly, so NRR is right and the two
    components a finance team would report are each slightly understated.

────────────────────────────────────────────────────────────────────────────────
SCENARIO A — Retention:  Annual GRR 90% → 96%
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €0.75m   (+€0.00m)
  CAC payback (EMERGENT) 18.00 mo → 18.00 mo
  NRR (EMERGENT)         99.0% → 105.6%   (+6.6pp)
  Y5 closing ARR         €62.93m → €77.87m   (+€14.95m, +23.8%)
  Cumulative leakage     €21.65m → €9.61m   (−€12.05m)
  Cumulative expansion   €19.58m → €22.48m   (+€2.90m)
  Cumulative gross profit €166.57m → €190.50m   (+€23.93m)
  Cumulative S&M         €54.00m → €54.00m   (+€0.00m)
  Y5 FCF                 €23.58m → €33.70m   (+€10.12m)
  Ending cash (M60)      €59.57m → €83.50m   (+€23.93m)
  Cash trough            €6.10m (M13) → €6.66m (M11)
  M60 ARR mix            opening base 30.2% → 33.7%

────────────────────────────────────────────────────────────────────────────────
SCENARIO B — Expansion:  Annual expansion 10% → 20%
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €0.75m   (+€0.00m)
  CAC payback (EMERGENT) 18.00 mo → 18.00 mo
  NRR (EMERGENT)         99.0% → 108.0%   (+9.0pp)
  Y5 closing ARR         €62.93m → €84.10m   (+€21.17m, +33.6%)
  Cumulative leakage     €21.65m → €25.94m   (+€4.29m)
  Cumulative expansion   €19.58m → €45.04m   (+€25.46m)
  Cumulative gross profit €166.57m → €199.99m   (+€33.42m)
  Cumulative S&M         €54.00m → €54.00m   (+€0.00m)
  Y5 FCF                 €23.58m → €37.85m   (+€14.27m)
  Ending cash (M60)      €59.57m → €92.99m   (+€33.42m)
  Cash trough            €6.10m (M13) → €6.82m (M10)
  M60 ARR mix            opening base 30.2% → 34.9%

────────────────────────────────────────────────────────────────────────────────
SCENARIO C — Acquisition efficiency:  CAC/New ARR 1.20× → 0.80×, S&M unchanged  (replaces v0.1 "payback 18→12")
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €1.13m   (+€0.38m)
  CAC payback (EMERGENT) 18.00 mo → 12.00 mo
  NRR (EMERGENT)         99.0% → 99.0%   (+0.0pp)
  Y5 closing ARR         €62.93m → €84.88m   (+€21.95m, +34.9%)
  Cumulative leakage     €21.65m → €27.36m   (+€5.71m)
  Cumulative expansion   €19.58m → €24.74m   (+€5.16m)
  Cumulative gross profit €166.57m → €210.85m   (+€44.27m)
  Cumulative S&M         €54.00m → €54.00m   (+€0.00m)
  Y5 FCF                 €23.58m → €39.43m   (+€15.84m)
  Ending cash (M60)      €59.57m → €103.85m   (+€44.27m)
  Cash trough            €6.10m (M13) → €7.43m (M8)
  M60 ARR mix            opening base 30.2% → 22.4%

────────────────────────────────────────────────────────────────────────────────
SCENARIO D — Growth investment:  S&M +50% (€0.90m → €1.35m/mo), CAC/New ARR unchanged
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €1.13m   (+€0.38m)
  CAC payback (EMERGENT) 18.00 mo → 18.00 mo
  NRR (EMERGENT)         99.0% → 99.0%   (+0.0pp)
  Y5 closing ARR         €62.93m → €84.88m   (+€21.95m, +34.9%)
  Cumulative leakage     €21.65m → €27.36m   (+€5.71m)
  Cumulative expansion   €19.58m → €24.74m   (+€5.16m)
  Cumulative gross profit €166.57m → €210.85m   (+€44.27m)
  Cumulative S&M         €54.00m → €81.00m   (+€27.00m)
  Y5 FCF                 €23.58m → €34.03m   (+€10.44m)
  Ending cash (M60)      €59.57m → €76.85m   (+€17.27m)
  Cash trough            €6.10m (M13) → €2.28m (M15)
  M60 ARR mix            opening base 30.2% → 22.4%

────────────────────────────────────────────────────────────────────────────────
SCENARIO E — Margin deterioration:  Gross margin 80% → 65%
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €0.75m   (+€0.00m)
  CAC payback (EMERGENT) 18.00 mo → 22.15 mo
  NRR (EMERGENT)         99.0% → 99.0%   (+0.0pp)
  Y5 closing ARR         €62.93m → €62.93m   (+€0.00m, +0.0%)
  Cumulative leakage     €21.65m → €21.65m   (+€0.00m)
  Cumulative expansion   €19.58m → €19.58m   (+€0.00m)
  Cumulative gross profit €166.57m → €135.34m   (−€31.23m)
  Cumulative S&M         €54.00m → €54.00m   (+€0.00m)
  Y5 FCF                 €23.58m → €14.77m   (−€8.81m)
  Ending cash (M60)      €59.57m → €28.34m   (−€31.23m)
  Cash trough            €6.10m (M13) → €0.49m (M22)
  M60 ARR mix            opening base 30.2% → 30.2%
  ── REQUIRED BEHAVIOUR TEST (brief §5) ──
     New ARR unchanged .......... PASS
     CAC payback deteriorates ... PASS   18.00 mo → 22.15 mo
     Gross profit falls ......... PASS
     EBITA / FCF falls .......... PASS
     Ending cash falls .......... PASS

────────────────────────────────────────────────────────────────────────────────
MATCHED-NRR EXPERIMENT — retention-heavy (R) vs expansion-heavy (X)
────────────────────────────────────────────────────────────────────────────────
  R  GRR 96.000000%  ×  expansion 110.000000%   → NRR 105.600000%
  X  GRR 90.000000%  ×  expansion 117.333333%   → NRR 105.600000%
  X expansion solved as 0.173333333333333 (full double precision, not rounded)
  Everything else identical: opening ARR, cash, S&M, CAC/New ARR, GM, R&D, G&A, horizon.

                                   R · retention-heavy   X · expansion-heavy      difference
  ────────────────────────────────────────────────────────────────────────────────────────
  Year 1 ARR                                   €30.35m               €30.35m               —
  Year 3 ARR                                   €52.82m               €52.82m               —
  Year 5 ARR                                   €77.87m               €77.87m               —
  Cumulative expansion                         €22.48m               €37.60m         differs
  Cumulative leakage                            €9.61m               €24.73m         differs
  Cumulative gross profit                     €190.50m              €190.50m               —
  Year 5 EBITA / FCF                           €33.70m               €33.70m               —
  Ending cash (M60)                            €83.50m               €83.50m               —
  M60 ARR from opening cohort                  €26.26m               €26.26m               —
  M60 ARR from acquired cohorts                €51.61m               €51.61m               —
  NRR (calculated)                           105.6000%             105.6000%               —

  Month-by-month divergence over all 60 months:
    closing ARR   max |R − X| = €8.941e-8
    gross profit  max |R − X| = €5.588e-9
    cash          max |R − X| = €8.941e-8
    cumulative leakage differs by +€15.12m, cumulative expansion by +€15.12m

  → Every aggregate the engine computes is identical to floating-point noise.
    The ONLY difference is the gross decomposition of the flows: X churns
    €15.12m more and expands €15.12m more, netting to zero.

────────────────────────────────────────────────────────────────────────────────
EFFICIENCY vs SPEND — calibrated to identical New ARR
────────────────────────────────────────────────────────────────────────────────
  EFFICIENCY  CAC/New ARR 1.20× → 0.80×, S&M held at €0.90m/mo
  SPEND       S&M €0.90m → €1.35m/mo, CAC/New ARR held at 1.20×
  Both produce New ARR €1.13m/mo (€1.13m/mo)

                                      EFFICIENCY               SPEND
  ──────────────────────────────────────────────────────────────────
  Y5 ARR                                 €84.88m             €84.88m
  CAC payback (emergent)                12.00 mo            18.00 mo
  Cumulative S&M                         €54.00m             €81.00m
  Cumulative gross profit               €210.85m            €210.85m
  Y5 EBITA / FCF                         €39.43m             €34.03m
  Cash trough                        €7.43m (M8)        €2.28m (M15)
  Ending cash (M60)                     €103.85m             €76.85m
  First profitable month                      M9                 M16

  ARR paths agree to €0.000e+0 across all 60 months.
  Same ARR state, +€27.00m of extra capital consumed, −€27.00m of ending cash.

```
