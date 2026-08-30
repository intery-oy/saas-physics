# Reconciliation, integrity and scenario results

Generated output from `node checks.js` and `node scenarios.js`. Regenerate with `npm run report`.

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
================================================================================
12 / 12 checks passed

```

## Scenarios A–E

```

SaaS Physics — Prototype 0
------------------------------------------------------------------------------
BASE assumptions: S&M €0.90m/mo | CAC payback 18mo | GRR 90.0% | expansion 10.0% | GM 80.0% | R&D €0.70m/mo | G&A €0.35m/mo
Start state: ARR €20.00m, cash €10.00m
BASE outcome: M60 ARR €62.93m | NRR 99.0% | Y5 FCF €23.58m | ending cash €59.57m | cash trough €6.10m (M13) | first profitable month M14
New ARR/mo €0.75m | implied CAC per €1 of new ARR: €1.20

------------------------------------------------------------------------------
SCENARIO A — Retention:  Annual GRR 90% -> 96%
------------------------------------------------------------------------------
  New ARR / month      €0.75m  ->  €0.75m   (+0.00m)
  NRR (annualised)     99.0%  ->  105.6%   (+6.6pp)
  Y5 closing ARR       €62.93m  ->  €77.87m   (+14.95m, +23.8pp)
  Cumulative leakage   €21.65m  ->  €9.61m   (-12.05m)
  Cumulative expansion €19.58m  ->  €22.48m   (+2.90m)
  Cumulative new ARR   €45.00m  ->  €45.00m   (+0.00m)
  Cumulative gross profit €166.57m  ->  €190.50m   (+23.93m)
  Y5 FCF               €23.58m  ->  €33.70m   (+10.12m)
  Ending cash (M60)    €59.57m  ->  €83.50m   (+23.93m)
  Cash trough          €6.10m (M13)  ->  €6.66m (M11)
  First profitable mo  M14  ->  M12
  M60 ARR mix — opening base 30.2% -> 33.7% | cohorts acquired Y1-Y2 27.5% -> 28.7% | Y4-Y5 28.3% -> 24.4%

------------------------------------------------------------------------------
SCENARIO B — Expansion:  Annual expansion 10% -> 20%
------------------------------------------------------------------------------
  New ARR / month      €0.75m  ->  €0.75m   (+0.00m)
  NRR (annualised)     99.0%  ->  108.0%   (+9.0pp)
  Y5 closing ARR       €62.93m  ->  €84.10m   (+21.17m, +33.6pp)
  Cumulative leakage   €21.65m  ->  €25.94m   (+4.29m)
  Cumulative expansion €19.58m  ->  €45.04m   (+25.46m)
  Cumulative new ARR   €45.00m  ->  €45.00m   (+0.00m)
  Cumulative gross profit €166.57m  ->  €199.99m   (+33.42m)
  Y5 FCF               €23.58m  ->  €37.85m   (+14.27m)
  Ending cash (M60)    €59.57m  ->  €92.99m   (+33.42m)
  Cash trough          €6.10m (M13)  ->  €6.82m (M10)
  First profitable mo  M14  ->  M11
  M60 ARR mix — opening base 30.2% -> 34.9% | cohorts acquired Y1-Y2 27.5% -> 29.1% | Y4-Y5 28.3% -> 23.1%

------------------------------------------------------------------------------
SCENARIO C — Acquisition efficiency:  CAC payback 18 -> 12 months, S&M unchanged
------------------------------------------------------------------------------
  New ARR / month      €0.75m  ->  €1.12m   (+0.37m)
  NRR (annualised)     99.0%  ->  99.0%   (-0.0pp)
  Y5 closing ARR       €62.93m  ->  €84.88m   (+21.95m, +34.9pp)
  Cumulative leakage   €21.65m  ->  €27.36m   (+5.71m)
  Cumulative expansion €19.58m  ->  €24.74m   (+5.16m)
  Cumulative new ARR   €45.00m  ->  €67.50m   (+22.50m)
  Cumulative gross profit €166.57m  ->  €210.85m   (+44.27m)
  Y5 FCF               €23.58m  ->  €39.43m   (+15.84m)
  Ending cash (M60)    €59.57m  ->  €103.85m   (+44.27m)
  Cash trough          €6.10m (M13)  ->  €7.43m (M8)
  First profitable mo  M14  ->  M9
  M60 ARR mix — opening base 30.2% -> 22.4% | cohorts acquired Y1-Y2 27.5% -> 30.6% | Y4-Y5 28.3% -> 31.5%

------------------------------------------------------------------------------
SCENARIO D — Growth investment:  S&M +50% (€0.90m -> €1.35m/mo), CAC payback unchanged
------------------------------------------------------------------------------
  New ARR / month      €0.75m  ->  €1.13m   (+0.38m)
  NRR (annualised)     99.0%  ->  99.0%   (+0.0pp)
  Y5 closing ARR       €62.93m  ->  €84.88m   (+21.95m, +34.9pp)
  Cumulative leakage   €21.65m  ->  €27.36m   (+5.71m)
  Cumulative expansion €19.58m  ->  €24.74m   (+5.16m)
  Cumulative new ARR   €45.00m  ->  €67.50m   (+22.50m)
  Cumulative gross profit €166.57m  ->  €210.85m   (+44.27m)
  Y5 FCF               €23.58m  ->  €34.03m   (+10.44m)
  Ending cash (M60)    €59.57m  ->  €76.85m   (+17.27m)
  Cash trough          €6.10m (M13)  ->  €2.28m (M15)
  First profitable mo  M14  ->  M16
  M60 ARR mix — opening base 30.2% -> 22.4% | cohorts acquired Y1-Y2 27.5% -> 30.6% | Y4-Y5 28.3% -> 31.5%

------------------------------------------------------------------------------
SCENARIO E — Margin deterioration:  Gross margin 80% -> 65%
------------------------------------------------------------------------------
  New ARR / month      €0.75m  ->  €0.92m   (+0.17m)
  NRR (annualised)     99.0%  ->  99.0%   (+0.0pp)
  Y5 closing ARR       €62.93m  ->  €73.06m   (+10.13m, +16.1pp)
  Cumulative leakage   €21.65m  ->  €24.29m   (+2.64m)
  Cumulative expansion €19.58m  ->  €21.96m   (+2.38m)
  Cumulative new ARR   €45.00m  ->  €55.38m   (+10.38m)
  Cumulative gross profit €166.57m  ->  €151.94m   (-14.63m)
  Y5 FCF               €23.58m  ->  €20.71m   (-2.87m)
  Ending cash (M60)    €59.57m  ->  €44.94m   (-14.63m)
  Cash trough          €6.10m (M13)  ->  €2.32m (M18)
  First profitable mo  M14  ->  M19
  M60 ARR mix — opening base 30.2% -> 26.0% | cohorts acquired Y1-Y2 27.5% -> 29.1% | Y4-Y5 28.3% -> 30.0%

------------------------------------------------------------------------------
SCENARIO E — acquisition coupling probe
------------------------------------------------------------------------------
  New ARR = S&M x 12 / (payback x GM). GM is in the DENOMINATOR, so cutting GM at
  constant CAC payback RAISES modelled New ARR:
    GM 80%: New ARR €0.75m/mo, CAC per €1 new ARR €1.20
    GM 65%: New ARR €0.92m/mo, CAC per €1 new ARR €0.98
  i.e. holding payback fixed while cutting GM silently assumes the company got 18.7% CHEAPER at acquiring ARR.
  ARR rises while gross profit falls — the model reports a bigger, poorer company.
  Control: holding CAC per € of new ARR constant instead (payback 22.2mo) gives New ARR €0.75m/mo and M60 ARR €62.93m vs €73.06m under the stated v0.1 formula.

```
