# Research Note — Acquisition Timing (v1.3)

Every figure below is printed by `node physics-study.js` §3 and asserted by `node checks.js`
(ACQ-LAG, checks 47–51) and `node physics-checks.js` (SAT+LAG, EXTREMES, ALL-NULL).

## Question

*How does time-to-revenue alter the capital required to create the same eventual SaaS
economics?*

In v1.0, S&M spent in month t created ARR in month t. Real sales cycles run for months, and
that interval is where the cash pain of a growth push lives (FINDINGS #17). The engine had no
state in which spent-but-unrealised acquisition could sit, so the question could not be posed.

## New economic object

One timing parameter, `acquisitionLagMonths` (L), and one explicit stock, **pending
acquisition**, carried as a ledger inside the engine:

```
month t:  existing cohorts age (leak, then expand)                 — unchanged
          S&M is spent: entry { spendMonth t, matureMonth t + L, sm, newARR = N(S&M) } → pending
          entries with matureMonth = t leave pending and become cohort M(t)
          closing ARR = retained + expansion + realised New ARR
```

S&M hits EBITA and cash in the spend month. The cohort created at t records `spendMonth`,
`lagMonths`, its acquisition cost (the spend that created it) and the realised cost per €1 of
ARR. The whole ledger is returned (`res.acquisitionLedger`) and each month reports
`pendingNewARR`, `pendingSpend` and `pendingCount`, so the state is inspectable and reconcilable,
never inferred from a shifted chart.

**Horizon boundary, stated.** Spend in the last L months of the window matures beyond M60. It is
expensed inside the window, reported as `pendingAtHorizon`, and never pulled forward into M60.

## Null world

`acquisitionLagMonths = 0` (the default). The entry written in month t matures in month t, which
is exactly the v1.0 same-month world: months and cohorts byte-identical (check 47), ALL-NULL
exact.

## Invariants

If the lag is correctly isolated:

- no New ARR enters the stock before its maturity date, and each cohort's `spendMonth` equals
  `acquisitionMonth − L` — check 48;
- the S&M line is identical every month, and the only P&L difference against the no-lag world is
  the gross profit that has not yet arrived: (ΔEBITA − ΔGP) residual €0.0e+0 — check 49;
- law output = realised + pending at the horizon, for ARR and for spend, and the reported pending
  stock reconciles to the ledger every month — residuals €0.0e+0 — check 50;
- a cohort created after the lag ages exactly as its same-month twin (rows identical at every
  age), and company ARR = Σ cohorts still — check 51;
- the acquisition response (N, average CAC, marginal CAC, dN/dS&M) is identical with and without
  a lag — SAT+LAG 8; under a lag the realised series is the no-lag series shifted by exactly L
  months — SAT+LAG 10.

## Falsification experiment

Run four otherwise-identical worlds at Base with L = 0, 3, 6, 12. The implementation is wrong
if New ARR per month of spend differs between them, if the realised series is not an exact shift,
if any cohort's retention differs from its lag-0 twin, if R12M NRR moves, or if spend and ARR
fail to reconcile through the pending stock.

## Result

| lag | N per month | first cohort | M12 ARR | M36 ARR | M60 ARR | cash trough | trough month | end cash | pending at M60 | unrealised spend | R12M NRR (M36) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 mo | €0.750m | M1 | €28.76m | €46.01m | €62.93m | €6.10m | M13 | €59.57m | €0.00m | €0.00m | 99.0000% |
| 3 mo | €0.750m | M4 | €26.53m | €43.83m | €60.78m | €4.20m | M16 | €51.00m | €2.25m | €2.70m | 99.0000% |
| 6 mo | €0.750m | M7 | €24.29m | €41.63m | €58.63m | €2.29m | M19 | €42.87m | €4.50m | €5.40m | 99.0000% |
| 12 mo | €0.750m | M13 | €19.80m | €37.23m | €54.32m | €−1.55m | M25 | €27.88m | €9.00m | €10.80m | 99.0000% |

- **Same law.** New ARR per month of spend is €0.750m in every row; the acquisition response is
  untouched.
- **Shifted realisation.** At L = 6 the realised New ARR series equals the L = 0 series shifted
  by six months, max |Δ| €0.0e+0; every cohort ages as its twin, max |Δ| €0.0e+0.
- **Different capital path.** The cash trough falls from €6.10m to €2.29m at L = 6 and goes
  negative (€−1.55m, M25) at L = 12. The trough arrives later — M13 → M19 → M25 — because the
  months of spend without matching gross profit stack up before recovery starts. At L = 6 the
  cash gap against the no-lag world widens all the way to €16.70m at M60.
- **Convergence, where the horizon permits it.** After month L every month's realised ARR is the
  same as the no-lag world's; the two ARR paths differ by exactly L cohorts' worth of aging
  ARR, never by productivity. M60 ARR is lower by construction — the last L months of spend are
  still pending — and the model reports that stock (€4.50m of ARR, €5.40m of spend at L = 6)
  rather than forcing terminal equivalence.
- **No retention contamination.** R12M NRR at M36 is 99.0000% in every row.
- **Measured CAC carries the lag.** At L = 6, spend ÷ realised New ARR is 3.600× at T = 9 (only
  three months realised against nine spent), 1.200× trailing-12 at T = 36 (steady state), and
  1.440× cumulative at T = 36 (the pending stock inflates it). Quoting the law's 1.200× hides
  the timing; measuring shows it.

## Boundary

- The lag is a single fixed delay. Real pipelines have a distribution of cycle lengths, ramping
  reps, and conversion that itself depends on effort; a deterministic delay line is the minimum
  mechanism, not a pipeline model.
- Pending acquisition carries no cost of carry, no risk of not converting, and no early
  revenue (no pilots, no deposits). What is spent arrives, exactly L months later.
- Because S&M is expensed on spend and the model has no deferred revenue or working capital
  (FINDINGS #15), the lag can only make the cash path *worse*. In a company that bills annually
  up front the real timing effect is partly offset; the model cannot show that offset.
- The horizon effect is now explicit but not neutral: any comparison of M60 figures between
  worlds with different lags compares different numbers of realised cohorts. The pending stock
  at the horizon is the honest reconciling item; readers should use it.
