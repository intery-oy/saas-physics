# Research Note — Warm Start (v1.4)

Asserted by `node physics-checks.js` (WARM-START, checks 70–79), `node v2-checks.js`
(ALL-NULL-V13) and `node physics-accept.js` (WARM START, on screen).

## Question

*A lagged world spends S&M for months before anything books. Is that economics, or an artefact?*

It is an artefact, and it came from an initial condition rather than a law. With
`acquisitionLagMonths = L`, spend in month `t` creates its cohort in month `t + L`. The engine
built its pending ledger only from spend inside the window, so at month 0 the pipeline held
nothing. A company with an installed base of €15.8m and a four-month sales cycle was therefore
modelled as having sold nothing for four months before the window opened, which contradicts the
premise of the opening base it was handed.

The distortion was not only visual:

| World A, identical €42m of S&M | Empty pipeline | Full pipeline |
|---|---|---|
| Cohorts created | 57 | 61 |
| Cumulative New ARR | €18.97m | €20.32m |
| ARR at M60 | €42.32m | €44.08m |
| Cash at M60 | €17.44m | €23.40m |

It also manufactured a growth hump. Year-on-year growth must decay as the base compounds, and it
does when the pipeline is warm. With a cold start it climbs first, and the number of rising months
equals the lag exactly:

| Lag | YoY at M12 | Peak | Rising months |
|---|---|---|---|
| 0 | 31.0% | 31.0% at M12 | 0 |
| 4 | 22.1% | 30.8% at M16 | 4 |
| 6 | 17.7% | 30.6% at M18 | 6 |

The peak is the same ~31% in every case: the growth the company would have shown all along.

## The inconsistency this resolves

The cash layer already refused to zero a going concern's accumulated state. It gives the opening
base a book of contracts with staggered renewal dates and the deferred balance such a book
carries, `MRR × (T − 1) / 2`, and calls it derived state, reported, never an input. The
acquisition layer asked no such question. One accumulated stock was warmed and the other was not.

## New object

One initial condition, `openingPipelineMonths`: how many months of prior spend are in flight at
month 0. It is not a law. It changes no productivity per euro, no timing rule and no response
curve. It states only that the company was already selling before month 1.

```
n = null | 0        the pipeline opens empty                      (the v1.3 world)
n = 1 … L           the last n months of prior spend are in flight
n = L               the steady state a going concern carries
```

Each seeded entry is an ordinary pending entry, built by the same constructor and stamped with
the laws as declared, maturing in months `L − n + 1 … L`. The boundary rejects a negative,
fractional, NaN, non-numeric or infinite value, a pipeline older than the lag, and any pipeline
at all without a lag. It never clamps.

## What stays outside the window

The euros are pre-window, so they stay pre-window. Each seeded entry carries `sm = 0` and keeps
its real amount as `priorSM`, reported and summed into nothing. Therefore:

- cumulative S&M, R&D and G&A are identical to the cold run, to the last euro;
- deployed capital still equals the cumulative S&M the window can see, at every month;
- the cohorts these entries create carry `acquisitionCost: null` and no realised CAC, the same
  disclosed state the opening base has always had, and are marked `preWindow` so the product can
  say why rather than calling them an opening base.

EBITA is *not* identical, and must not be: the same spend now carries more ARR, so it earns more
gross profit. That is the correction, not a leak.

## Symmetry, and what remains unmatched

A window with a warm pipeline is matched at its start: the cohorts that arrive in months 1…L were
paid for before it opened. It stays unmatched at its end, where the last L months of S&M buy
cohorts that land after the horizon. That asymmetry is the horizon, not the physics, and the
product discloses it in the acquisition boundary note.

## Effect on measurement

Trailing-twelve measured CAC needs twelve months in which spend and arrivals line up. The product
suppressed it for `12 + lag` months because of the cold start; with a warm pipeline the wait is
`12 + (lag − pipeline)`, which is twelve months when the pipeline is full. Measured CAC in the
first year is genuinely flattered by a warm start and was genuinely penalised by a cold one. Both
are what the accounts say; they converge in steady state.

## World A

The Enterprise world declares `acquisitionLagMonths: 4` and now also
`openingPipelineMonths: 4`. It opens with €1.35m of New ARR in flight, books from month 1, and its
growth rate decays from the first month it can be measured.
