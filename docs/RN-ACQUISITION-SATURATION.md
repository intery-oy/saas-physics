# Research Note — Acquisition Saturation (v1.2)

Every figure below is printed by `node physics-study.js` §2 and asserted by `node checks.js`
(ACQ-BOUND, checks 41–46) and `node physics-checks.js` (SWEEP, SAT+LAG, COST+SAT, EXTREMES).

## Question

*When should a company stop increasing S&M because marginal acquisition productivity
deteriorates?*

Under the v1.0 law `New ARR = S&M ÷ cacPerARR` the question has no answer: doubling S&M doubles
New ARR at month 1 and at month 60, forever. The model could always buy growth (FINDINGS #10),
which is why the product carried no "spend more" scenario — it would have taught a limitation as
a law.

## New economic object

One constraint, `maxMonthlyNewARR` (€ of New ARR per month), and a saturating response:

```
N(S&M) = S&M ÷ (cacPerARR + S&M ÷ maxMonthlyNewARR)

S&M → 0   N ≈ S&M ÷ cacPerARR          the v1.0 law, exactly in the limit
S&M → ∞   N → maxMonthlyNewARR         acquisition capacity
```

`cacPerARR` keeps its meaning as the low-spend acquisition-efficiency primitive. Derived
analytically from the same law — no finite differences anywhere in the product:

```
average CAC  = S&M ÷ N               = cacPerARR + S&M ÷ capacity
dN/dS&M      = cacPerARR ÷ (cacPerARR + S&M ÷ capacity)²
marginal CAC = 1 ÷ (dN/dS&M)         = (cacPerARR + S&M ÷ capacity)² ÷ cacPerARR
utilisation  = N ÷ capacity
payback      = CAC × 12 ÷ GM          for average and for marginal CAC alike
```

A cohort now stamps the **realised** cost per €1 of ARR (`acquisitionCost ÷ initialARR` = average
CAC) and the coefficient separately. This is a **bound on an optimistic mechanism**, admitted
under the constitution's "bounds before benefits" rule. It exposes the curve; it declares no
optimum, because the model has no objective function.

## Null world

`maxMonthlyNewARR = null` (the default). Disabled means the response is `S&M ÷ cacPerARR` with no
Infinity arithmetic; the run is byte-identical to v1.0 (check 41) and ALL-NULL is exact. A finite
capacity of 0 is *not* treated as "off": it means no acquisition capacity and yields N = 0 while
S&M is still spent (EXTREMES 38).

## Invariants

If the bound is correctly isolated:

- the opening cohort's rows are byte-identical with the bound on and off (it changes new-cohort
  creation only) — check 45;
- 10× S&M under the bound leaves R12M GRR / expansion / NRR unchanged at every T — max delta
  7.8e-16;
- N is monotone in S&M and never exceeds capacity; at S&M = €1e12 it reaches 99.9998% of it —
  check 42;
- second differences of N(S&M) are ≤ 0 on a €0–10m sweep and a forward-difference marginal
  CAC exceeds S&M ÷ N at every S&M > 0 — check 43 (evaluates the law only, never the
  derivative formula);
- the closed-form derivative agrees with a central difference to 7.3e-10 relative — check 44;
  on a €50k grid to €8m the law is strictly increasing with every second difference negative,
  and the numerical marginal CAC matches the analytical one to < 1e-6 relative at every point
  (`physics-checks.js` SATURATION-INDEPENDENT);
- the response object is identical with or without a lag or an expansion cost (SAT+LAG 8,
  COST+SAT 12).

## Falsification experiment

Sweep S&M from €0 to €7.2m/month at Base with capacity €2.0m/month, and print the linear and
bounded responses side by side. The implementation is wrong if N ever falls with spend, ever
exceeds the capacity, if marginal CAC ever sits below average CAC, or if the low-spend limit is
not the linear law.

## Result

| S&M / mo | N linear | N bounded | util | avg CAC | marg CAC | avg payback | marg payback | M60 ARR linear | M60 ARR bounded | trough (bounded) | end cash (bounded) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| €0.000m | €0.000m | €0.000m | 0% | 1.20× | 1.20× | 18.0 mo | 18.0 mo | €19.02m | €19.02m | €10.28m | €25.02m |
| €0.300m | €0.250m | €0.222m | 11% | 1.35× | 1.52× | 20.2 mo | 22.8 mo | €33.66m | €32.03m | €9.99m | €33.26m |
| €0.600m | €0.500m | €0.400m | 20% | 1.50× | 1.88× | 22.5 mo | 28.1 mo | €48.29m | €42.44m | €8.03m | €36.25m |
| €0.900m | €0.750m | €0.545m | 27% | 1.65× | 2.27× | 24.7 mo | 34.0 mo | €62.93m | €50.95m | €4.58m | €35.42m |
| €1.200m | €1.000m | €0.667m | 33% | 1.80× | 2.70× | 27.0 mo | 40.5 mo | €77.56m | €58.05m | €0.25m | €31.73m |
| €1.800m | €1.500m | €0.857m | 43% | 2.10× | 3.68× | 31.5 mo | 55.1 mo | €106.83m | €69.20m | €−10.67m | €18.22m |
| €2.400m | €2.000m | €1.000m | 50% | 2.40× | 4.80× | 36.0 mo | 72.0 mo | €136.10m | €77.56m | €−24.47m | €−0.91m |
| €3.600m | €3.000m | €1.200m | 60% | 3.00× | 7.50× | 45.0 mo | 112.5 mo | €194.65m | €89.27m | €−60.53m | €−49.30m |
| €4.800m | €4.000m | €1.333m | 67% | 3.60× | 10.80× | 54.0 mo | 162.0 mo | €253.19m | €97.08m | €−107.86m | €−105.56m |
| €7.200m | €6.000m | €1.500m | 75% | 4.80× | 19.20× | 72.0 mo | 288.0 mo | €370.27m | €106.83m | €−229.88m | €−229.88m |

Three things the sweep exposes, and one it does not:

1. **Curvature.** Doubling spend from €0.9m to €1.8m raises bounded New ARR by 57%, not 100%;
   from €1.8m to €3.6m by 40%.
2. **Marginal deteriorates faster than average.** At €0.9m the average CAC is 1.65× and the
   marginal 2.27×; at €3.6m, 3.00× against 7.50×. The marginal CAC rises as the square of the
   average-CAC denominator (SWEEP 40 asserts the ordering at every step).
3. **Capital consequence — an observation of this sweep, not a threshold of the law.** In this
   experiment, with capacity €2.0m/month, the Base cost structure and the fixed 60-month window,
   the ending-cash column is highest at the €0.6m/month row and the trough column first turns
   negative at the €1.8m/month row. Both rows move with the capacity, the gross margin, the fixed
   costs and the horizon; the law itself has no such points — it is smooth and concave
   everywhere. The same €1.8m/month row under the linear law shows €106.8m of M60 ARR; under
   the bound, €69.2m and an €18.2m ending cash position.
4. **No optimum.** Which of these rows is "right" depends on what the company is trying to
   maximise and over what horizon. The model has none of that and says so on screen.

A reference point outside the sweep: at Base spend (€0.9m/month) the bound reduces New ARR from
€0.750m to €0.545m per month, M60 ARR from €62.93m to €50.95m, and moves the cash trough from
€6.10m (M13) to €4.58m (M18).

## Boundary

- One parameter cannot represent *why* acquisition saturates — market size, sales capacity,
  rep ramp, channel mix — only *that* it does, with one shape (hyperbolic). A market that
  saturates in cumulative terms (a finite TAM being consumed) is a different mechanism and is
  not built.
- The bound is static: capacity does not grow with spend, time, or headcount.
- Cash still never constrains S&M. The bound limits what spend creates, not whether it can be
  spent; the capital loop on the System map is still drawn open.
- Average CAC under the bound is a property of the *whole* month's spend; the model has no
  channels, so it cannot say which euro was the marginal one.
- Vocabulary, fixed in the product and these notes: **CAC coefficient** (`cacPerARR`, the
  low-spend law coefficient), **Average CAC** (S&M ÷ New ARR at the current spend), **Marginal
  CAC** (1 ÷ dN/dS&M); **Coefficient payback** (18.0 months at Base — the v1.0
  `cacPaybackMonths`, unchanged), **Average payback** (24.7 months at Base under a €2.0m
  capacity) and **Marginal payback** (34.0 months). The capital track's crossing is a
  **Cohort payback** (25 months for a Base cohort under the same capacity: it is measured on
  the cohort's realised cost against its gross profit, month by month). Every CAC is € of S&M
  per €1 of ARR, in either display basis. The build report that accompanied v1.1–v1.3 listed a
  "measured payback"; no such quantity exists in the model and none was added.
