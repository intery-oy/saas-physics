# Reconciliation, integrity and experiment results

Generated output (model v0.3). Regenerate with `npm run report`.

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
  PASS  19. KPI · Transition coefficients ≠ reported KPIs, and the gap matches the closed-form decomposition
        persistence 90.00% → measured GRR 89.5582%; expansion coefficient 10.00% → measured expansion 9.4418%; prediction matches simulation: true
  PASS  20. KPI · R12M cohort excludes New ARR (10× S&M leaves GRR, expansion and NRR unchanged at every T)
        max KPI delta 4.441e-16 while New ARR inside the window rose by up to €81.00m
  PASS  21. KPI · Expansion never improves measured GRR (it slightly worsens it: more base survives to leak)
        expansion 0%→35% moves GRR 90.0000% → 88.5127%, monotonically non-increasing
  PASS  22. KPI · Bridge reconciles (Opening + Expansion − Leakage = Closing eligible) and NRR = GRR + Expansion
        max bridge residual €1.490e-8; max GRR+Exp−NRR identity residual 3.331e-16
  PASS  23. KPI · Calibrated transition parameters reproduce target measured GRR 90.0% and expansion 10.0%
        persistence 90.445837% + expansion coefficient 10.563408% → measured GRR 90.000000%, expansion 10.000000%, NRR 100.000000%
  PASS  24. KPI · Matched measured-NRR scenarios truly report GRR 96.0%/90.0% and NRR 105.6%
        R measures GRR 96.0000% / NRR 105.6000%; X measures GRR 90.0000% / NRR 105.6000%
  PASS  25. KPI · Calibrating retention KPIs leaves v0.2 acquisition physics untouched (New ARR and payback unmoved)
        max deviation across all three calibrated runs 0.000e+0; New ARR still €0.750m/mo, payback still 18.00 months
  PASS  26. KPI · Base and Experiment share one economic engine and one measurement engine
        E.run and K.measureR12M are the single entry points; identical assumptions give identical measurements: true
  PASS  27. STATE · At T0 the two portfolios match on ARR, R12M GRR, R12M expansion, R12M NRR and gross margin
        ARR €21.4320m both (Δ €0.0e+0); GRR 93.628381% both; NRR 107.160000% both; GM 80% both
  PASS  28. STATE · Acquisition is zero throughout the core experiment, in both portfolios
        New ARR €0/month and S&M €0/month across all 72 months
  PASS  29. STATE · Divergence requires BOTH a different cohort state AND age-dependent laws (2×2 factorial)
        same state + age-dependent: €0.0e+0 · different state + flat: €0.0e+0 · different state + age-dependent: €6.92m
  PASS  30. STATE · With flat age-independent laws the matched portfolios do not diverge at all
        monthly series byte-identical: true; forward GP density 4.778639× vs 4.778639× — maturity itself creates nothing
  PASS  31. STATE · Acquisition cost is stamped at cohort creation, reconciles to cacPerARR, and is immutable
        60 acquisition cohorts stamped at €0.90m each (= initialARR × 1.2×); opening vintages null (genuinely unknown); unchanged after measurement: true
  PASS  32. STATE · Sunk acquisition cost never reduces forward ARR, gross profit or retention
        doubling cost per cohort (2.00×) at identical New ARR leaves ARR, GP and leakage unchanged to €0.0e+0; only the current-period S&M expense moves
  PASS  33. STATE · KPI bridge and the GRR + expansion = NRR identity still hold under age-dependent laws
        max bridge residual €7.45e-9, max identity residual 4.44e-16 across 61 measurement dates
  PASS  34. STATE · The flat-law closed forms (NRR = P×(1+X), the calibration inverse) hold only under flat bands
        bands are flat: measured NRR 99.000000% = P×(1+X) 99.000000%
  PASS  35. STATE · v0.2 acquisition physics remain intact when acquisition is re-enabled under age bands
        New ARR €0.750m/mo = S&M ÷ cacPerARR; payback 18.00 months = cacPerARR × 12 ÷ GM
================================================================================
35 / 35 checks passed

```

## State Sufficiency Experiment (v0.3)

```

SaaS Physics — Prototype 0.3   State Sufficiency Experiment   (model v0.3)
────────────────────────────────────────────────────────────────────────────────────
A. NEW STATE DIMENSION — cohort maturity
────────────────────────────────────────────────────────────────────────────────────
  Three age bands by cohort age at the START of each month.
  Six transition parameters; no other new behavioural coefficient.

  band          ages           persistence   expansion   annual mult
  ──────────────────────────────────────────────────────────────────
  Early         0–11                94.00%      14.00%        1.0716
  Developing    12–23               78.00%       6.00%        0.8268
  Mature        24–+                94.00%      14.00%        1.0716

  This profile is a USER ASSUMPTION, not a law. Band 2 is read as a mid-life
  renewal / re-contracting window. Bands 1 and 3 are deliberately identical:
  the simulator takes no position on whether older cohorts are better.
  The shipped DEFAULT is flat — age carries no meaning until someone gives it some.

────────────────────────────────────────────────────────────────────────────────────
B. MATCHED CURRENT STATE AT T0 (month 12)
────────────────────────────────────────────────────────────────────────────────────
  CALIBRATION NOTE. A first attempt used a monotone band profile and solved for
  two age mixes hitting the same (GRR, expansion). It was INFEASIBLE: with monotone
  bands the (GRR, expansion) signature is very nearly one-dimensional in age, so
  matching two KPIs pins the age distribution and no non-negative second solution
  exists. Rather than fudge the reported metrics, the construction was changed:
  bands 1 and 3 share coefficients, so a cohort that spent the measurement window
  in band 1 and one that spent it in band 3 report IDENTICAL KPIs exactly, while
  facing completely different futures. No solver, no residual.

                                               Y · young          M · mature    difference
  ────────────────────────────────────────────────────────────────────────────────────────
  Age at T0                                    12 months           36 months       differs
  Band occupied during window               Early (0–11)      Mature (24–35)       differs
  Band occupied AT T0                         Developing              Mature       differs
  ARR at T0                                    €21.4320m           €21.4320m       €0.0e+0
  R12M GRR                                    93.628381%          93.628381%        0.0e+0
  R12M expansion                              13.531619%          13.531619%        0.0e+0
  R12M NRR                                   107.160000%         107.160000%        0.0e+0
  Gross margin                                    80.00%              80.00%             0
  R&D + G&A per month                             €1.05m              €1.05m             0
  S&M per month (acquisition off)                 €0.00m              €0.00m             0
  New ARR per month                               €0.00m              €0.00m             0
  CAC / New ARR                                    1.20×               1.20×             0

  → To any conventional KPI dashboard these are the same company.

────────────────────────────────────────────────────────────────────────────────────
C. FORWARD 60 MONTHS (months 13–72), acquisition off in both
────────────────────────────────────────────────────────────────────────────────────
                                               Y · young          M · mature         M − Y
  ────────────────────────────────────────────────────────────────────────────────────────
  ARR at M72                                     €23.37m             €30.28m       +€6.92m
  Remaining revenue (60m)                       €101.17m            €128.02m      +€26.85m
  Remaining gross profit (60m)                   €80.94m            €102.42m      +€21.48m
  Remaining EBITA (60m)                          €17.94m             €39.42m      +€21.48m
  Remaining FCF (60m)                            €17.94m             €39.42m      +€21.48m
  Cash at M72                                    €31.90m             €53.38m      +€21.48m
  Expansion from T0 base                         €11.80m             €16.73m       +€4.93m
  Leakage from T0 base                            €9.86m              €7.88m       −€1.98m

  ARR trajectory of the T0 base, by year:
                         Y1           Y2           Y3           Y4           Y5
  Y · young         €17.72m      €18.99m      €20.35m      €21.81m      €23.37m
  M · mature        €22.97m      €24.61m      €26.37m      €28.26m      €30.28m
  Y's band       Developing       Mature       Mature       Mature       Mature   (mid-year)

────────────────────────────────────────────────────────────────────────────────────
D. THE MECHANISM, AND F. FORWARD ECONOMIC CONTENT
────────────────────────────────────────────────────────────────────────────────────
  Y still has to pass through the Developing band. M passed through it 12 months
  before T0. In months 13–24 Y runs at an annual multiplier of 0.8268 while M runs at 1.0716.
  After month 24 both grow at the SAME rate — the gap never closes, because it is a
  level difference created in one year and then compounded by an identical rate.

  ARR at M24 (end of Y's risk window):  Y €17.72m   M €22.97m   ratio 1.2961
  ARR at M72:                          Y €23.37m   M €30.28m   ratio 1.2961

  EXPERIMENTAL 60-MONTH FORWARD ECONOMIC MEASURE — not a KPI, not enterprise value
    Remaining GP60             Y €80.94m        M €102.42m
    Current ARR at T0          Y €21.43m         M €21.43m
    Forward GP density (GP60 / current ARR)
                               Y 3.7764×          M 4.7786×
    → €1 of Y's ARR carries 3.78 of forward gross profit;
      €1 of M's ARR carries 4.78. Same euro, 26.54% more economic content.

  Density across the mix (share of ARR that is young at T0):
  young share          ARR at T0          GP60    GP density
  0%                     €21.43m      €102.42m       4.7786×
  25%                    €21.43m       €97.05m       4.5281×
  50%                    €21.43m       €91.68m       4.2775×
  75%                    €21.43m       €86.31m       4.0270×
  100%                   €21.43m       €80.94m       3.7764×

────────────────────────────────────────────────────────────────────────────────────
E. FLAT-LAW COUNTERFACTUAL — identical coefficients in every band
────────────────────────────────────────────────────────────────────────────────────
  Same two portfolios, same age composition, only the age-dependence removed.
                                               Y · young          M · mature    difference
  ────────────────────────────────────────────────────────────────────────────────────────
  ARR at T0                                    €21.4320m           €21.4320m       €0.0e+0
  R12M NRR                                   107.160000%         107.160000%        0.0e+0
  Remaining GP60                              €102.4158m          €102.4158m       €0.0e+0
  Forward GP density                           4.778639×           4.778639×        0.0e+0
  max |Y − M| ARR over 72 months               €0.000e+0
  max |Y − M| gross profit                     €0.000e+0

  → Age composition alone creates NOTHING. With flat laws the two portfolios are
    bit-identical. Maturity has no value; only economically different future
    transition behaviour associated with maturity has value.

  Direction agnosticism. Invert the profile (bands 1 and 3 risky, band 2 stable):
    Forward GP density   Y 3.2294×   M 2.5811×   → YOUNG is now worth more.
    The model privileges no direction. The ranking is a property of the assumed
    transition laws, never of age itself.

────────────────────────────────────────────────────────────────────────────────────
OBSERVABILITY — when does the reported KPI series reveal the difference?
────────────────────────────────────────────────────────────────────────────────────
  measurement date         Y · young    M · mature   distinguishable?
  ────────────────────────────────────────────────────────────────────────────
  M12  (T0)                  107.16%       107.16%   NO — identical
  M15                        100.43%       107.16%   yes, 6.73pp apart
  M18                         94.13%       107.16%   yes, 13.03pp apart
  M21                         88.22%       107.16%   yes, 18.94pp apart
  M24                         82.68%       107.16%   yes, 24.48pp apart
  M30                         94.13%       107.16%   yes, 13.03pp apart
  M36                        107.16%       107.16%   NO — identical
  M48                        107.16%       107.16%   NO — identical
  M72                        107.16%       107.16%   NO — identical

  The trailing KPI series is blind BEFORE the event, sees it for exactly 24 months as
  the risk window passes through the measurement window, and is blind again AFTER.
  A CFO deciding at T0 gets the blind reading. By the time the KPIs show it, the
  economics have already happened — and by M36 the report looks pristine again.

  The information is not unknowable. It is simply not in GRR and NRR: cohort vintage
  disclosure identifies it instantly, and every company already has that data.

────────────────────────────────────────────────────────────────────────────────────
SECONDARY RUN — identical acquisition re-enabled (S&M €0.90m/mo in both)
────────────────────────────────────────────────────────────────────────────────────
                                               Y · young          M · mature         M − Y
  ────────────────────────────────────────────────────────────────────────────────────────
  ARR at M72                                     €78.15m             €85.07m       +€6.92m
  Remaining GP60                                €206.01m            €227.49m      +€21.48m
  Cash at M72                                    €95.85m            €117.33m      +€21.48m
  Forward GP density                             6.7052×             7.4043×

  The gap survives but is diluted: new cohorts are identical in both companies and
  arrive at the same rate, so they add the same economics to each. Acquisition
  does not remove the difference in the installed base — it hides it.

```

## Layers, calibration, scenarios (v0.2 / v0.2.1)

```

SaaS Physics — Prototype 0.2.1   (model v0.3)
────────────────────────────────────────────────────────────────────────────────
BASE  S&M €0.90m/mo · CAC/New ARR 1.20× · persistence 90.0% · expansion coefficient 10.0% · GM 80.0% · R&D €0.70m/mo · G&A €0.35m/mo
      Opening ARR €20.00m, opening cash €10.00m
DERIVED  New ARR €0.75m/mo (€9.00m per year of spend) · CAC payback 18.00 mo (EMERGENT)
OUTCOME  M60 ARR €62.93m · NRR 99.0% · Y5 FCF €23.58m · ending cash €59.57m · trough €6.10m (M13)

────────────────────────────────────────────────────────────────────────────────
TWO LAYERS — the world, and the report on the world
────────────────────────────────────────────────────────────────────────────────
  LAYER A — economic transition coefficients (they govern the world)
    annual persistence coefficient   90.0000%     monthly g = P^(1/12) = 99.125839%
    annual expansion coefficient     10.0000%     monthly e = (1+X)^(1/12)−1 = 0.797414%
    monthly multiplier m = g(1+e)    0.999162823

  LAYER B — measured R12M KPIs (they observe the world), frozen cohort at T=12
    R12M GRR         89.5582%   vs persistence coefficient 90.00%   (−0.4pp)
    R12M expansion   9.4418%   vs expansion coefficient  10.00%   (−0.6pp)
    R12M NRR         99.000000%   = P × (1+X) EXACTLY
    bridge residual  €-3.73e-9   ·  GRR + expansion − NRR = -2.22e-16
    New ARR inside the window, excluded from the cohort: €9.00m

  WHY THE GAP EXISTS — it is one effect, not several
  ────────────────────────────────────────────────────────────────────────────
    Switch either process off and the other measures its coefficient EXACTLY:
      expansion coefficient 0%  ->  measured GRR       90.000000%  (= persistence exactly)
      persistence 100%          ->  measured expansion 10.000000%  (= coefficient exactly)
    The compounding-convention and moving-base terms are real but CANCEL exactly,
    which is what makes those two cases exact. The entire residual is the
    WITHIN-PERIOD INTERACTION of the two processes:
      churn:      1 − P = 0.100000   + expansion exposure +0.004418  =  measured 0.104418
      expansion:  X     = 0.100000   + retention exposure -0.005582  =  measured 0.094418
    Expansion enlarges the balance later exposed to decay, so measured GRR < P.
    Decay shrinks the balance expansion later accrues on, so measured expansion < X.
    NRR is unaffected because it is a ratio of two STOCKS; GRR and expansion are
    ratios of FLOWS to a stock, and only flow ratios pick up the interaction.

  €100 WORKED EXAMPLE — persistence 90%, expansion coefficient 10%
  ────────────────────────────────────────────────────────────────────────────
    month       opening   − leakage  + expansion    closing
    M1         100.0000      0.8742       0.7904    99.9163
    M2          99.9163      0.8734       0.7898    99.8326
    M3          99.8326      0.8727       0.7891    99.7491   ...
    M11         99.1660      0.8669       0.7839    99.0830
    M12         99.0830      0.8661       0.7832    99.0000
    TOTAL      100.0000     10.4418       9.4418    99.0000

    R12M GRR       = (100 − 10.4418) / 100 = 89.5582%   NOT 90.00%
    R12M expansion = 9.4418 / 100          = 9.4418%    NOT 10.00%
    R12M NRR       = 99.0000 / 100          = 99.0000%   exactly P(1+X)

────────────────────────────────────────────────────────────────────────────────
INVERSE CALIBRATION — Target A: measured R12M GRR 90.0%, measured expansion 10.0%
────────────────────────────────────────────────────────────────────────────────
  Closed form:  NRR* = GRR* + Exp* = 100.0000%   →   m = NRR*^(1/12) = 1.000000000
                S = Σ m^t (t=0..11) = 12.000000   →   g = 1 − (1−GRR*)/S = 0.991666667
                e = m/g − 1 = 0.008403361

  REQUIRED TRANSITION COEFFICIENTS
    annual persistence coefficient   90.445837%   (not 90% — the world must persist BETTER than the KPI reads)
    annual expansion coefficient     10.563408%   (not 10% — the world must expand HARDER than the KPI reads)

  SIMULATED VERIFICATION (measurement engine, frozen cohort, T=12)
    R12M GRR        90.000000%   target 90.000000%   PASS
    R12M expansion  10.000000%   target 10.000000%   PASS
    R12M NRR        100.000000%   ← the resulting NRR, not an input
    Acquisition untouched: New ARR €0.75m/mo, payback 18.00 mo

────────────────────────────────────────────────────────────────────────────────
SCENARIO A — Retention:  Persistence coefficient 90% → 96% (a TRANSITION change, not a KPI target)
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €0.75m   (+€0.00m)
  CAC payback (EMERGENT) 18.00 mo → 18.00 mo
  R12M GRR (MEASURED)    89.56% → 95.82%   (+6.3pp)
  R12M expansion (MEAS.) 9.44% → 9.78%   (+0.3pp)
  R12M NRR (MEASURED)    99.00% → 105.60%   (+6.6pp)
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
SCENARIO B — Expansion:  Expansion coefficient 10% → 20% (a TRANSITION change, not a KPI target)
────────────────────────────────────────────────────────────────────────────────
  New ARR / month        €0.75m → €0.75m   (+€0.00m)
  CAC payback (EMERGENT) 18.00 mo → 18.00 mo
  R12M GRR (MEASURED)    89.56% → 89.13%   (−0.4pp)
  R12M expansion (MEAS.) 9.44% → 18.87%   (+9.4pp)
  R12M NRR (MEASURED)    99.00% → 108.00%   (+9.0pp)
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
  R12M GRR (MEASURED)    89.56% → 89.56%   (+0.0pp)
  R12M expansion (MEAS.) 9.44% → 9.44%   (+0.0pp)
  R12M NRR (MEASURED)    99.00% → 99.00%   (+0.0pp)
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
  R12M GRR (MEASURED)    89.56% → 89.56%   (+0.0pp)
  R12M expansion (MEAS.) 9.44% → 9.44%   (+0.0pp)
  R12M NRR (MEASURED)    99.00% → 99.00%   (+0.0pp)
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
  R12M GRR (MEASURED)    89.56% → 89.56%   (+0.0pp)
  R12M expansion (MEAS.) 9.44% → 9.44%   (+0.0pp)
  R12M NRR (MEASURED)    99.00% → 99.00%   (+0.0pp)
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
MATCHED MEASURED-NRR — scenarios defined by reported KPIs, not by coefficients
────────────────────────────────────────────────────────────────────────────────
                                       R · retention-heavy   X · expansion-heavy
  ──────────────────────────────────────────────────────────────────────────────
  TARGET measured R12M GRR                        96.0000%              90.0000%
  TARGET measured R12M expansion                   9.6000%              15.6000%
  TARGET measured R12M NRR                       105.6000%             105.6000%
  ──────────────────────────────────────────────────────────────────────────────
  → persistence coefficient                     96.168130%            90.672144%
  → expansion coefficient                        9.807687%            16.463553%
  → monthly multiplier m                       1.004551007           1.004551007
  ──────────────────────────────────────────────────────────────────────────────
  ACTUAL measured R12M GRR                        96.0000%              90.0000%
  ACTUAL measured R12M expansion                   9.6000%              15.6000%
  ACTUAL measured R12M NRR                       105.6000%             105.6000%

                                       R · retention-heavy   X · expansion-heavy            
  ────────────────────────────────────────────────────────────────────────────────────────
  Year 1 ARR                                       €30.35m               €30.35m   identical
  Year 3 ARR                                       €52.82m               €52.82m   identical
  Year 5 ARR                                       €77.87m               €77.87m   identical
  Cumulative expansion                             €22.07m               €35.86m     differs
  Cumulative leakage                                €9.19m               €22.99m     differs
  Cumulative gross profit                         €190.50m              €190.50m   identical
  Year 5 EBITA / FCF                               €33.70m               €33.70m   identical
  Ending cash (M60)                                €83.50m               €83.50m   identical
  M60 opening-cohort survival                      €26.26m               €26.26m   identical
  M60 ARR from acquired cohorts                    €51.61m               €51.61m   identical

  Max |R − X| over 60 months:  closing ARR €4.768e-7  ·  cash €6.109e-7

  → STILL ECONOMICALLY IDENTICAL, and the measurement layer sharpens the reason.
    Measured R12M NRR is a STOCK RATIO, so pinning it pins m = NRR^(1/12) uniquely:
    both scenarios run at m = 1.004551007. The ARR recursion consumes
    nothing but m, so identical measured NRR forces identical everything downstream —
    regardless of how GRR and expansion split it. The only trace is gross flow:
    X leaks +€13.79m more and expands +€13.79m more, netting to zero.

────────────────────────────────────────────────────────────────────────────────
INFORMATION LOSS — two customer systems, one pair of reported KPIs
────────────────────────────────────────────────────────────────────────────────
  Arithmetic illustration, NOT simulator output (the model has no customers).
  Both systems open with €20.0m of ARR across 100 customers at €200k each,
  and both report R12M GRR 90.0% and R12M NRR 100.0%.

                                     System A — logo churn  System B — contraction
  ────────────────────────────────────────────────────────────────────────────────
  Opening customers                                    100                     100
  Opening ARR                                       €20.0m                  €20.0m
  How the €2.0m is lost            10 logos churn entirely      all 100 shrink 10%
  Closing customers                                     90                     100
  Logo retention                                       90%                    100%
  Expansion €2.0m from            5 survivors (+€400k each)    all 100 (+€20k each)
  Top-5 share of expansion                            100%                      5%
  Reported R12M GRR                                  90.0%                   90.0%
  Reported R12M NRR                                 100.0%                  100.0%

  Same two numbers. 90 customers vs 100. Expansion from 5 accounts vs 100.
  Nothing in GRR or NRR distinguishes them, and their forward economics differ.

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
