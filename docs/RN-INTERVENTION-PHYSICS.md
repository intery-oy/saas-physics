# Research Note — Interventions (v2 Gate D)

Every figure below is printed by `node v2-study.js` §D and asserted by `node v2-checks.js`
(D-NULL, D-LAWAT, D-COST, D-PROVENANCE, D-BOUNDS, D-ORDER, D-DURATION, D-LAYERS, D-COMPOSE,
D-MEASURE, D-DETERMINISM, D-MODULE) and on screen by `node v2-accept.js` (D · CONTROLS /
OBSERVE / WATERFALL / INSPECT / SYSTEM / SCENARIO 14 / NULL).

## Question

*What is a management action in this model — and how is it kept from becoming a law?*

Through Gate C every input was a coefficient the world obeys, permanent and free. "We will run
a retention programme" could only be expressed as "persistence is 94.5%", which is a different
claim: it has no start, no delay, no end and no cost, and once made it is indistinguishable from
the world simply being better. The engine had no object for a hypothesis.

## New economic object

An **intervention** is an explicit hypothesis:

```
{ id, name, target, effect: 'multiply' | 'add' | 'set', value,
  startMonth, lagMonths, durationMonths (null = permanent), cost: { oneOff, monthly } }
```

and the engine reads the assumptions in force in month t from

```
lawAt(t) = base laws, with every intervention active in t applied in declaration order
           active ⇔ startMonth + lagMonths ≤ t < startMonth + lagMonths + durationMonths
```

The monthly loop now reads every law — S&M, CAC coefficient, capacity, lag, persistence,
expansion, gross margin, expansion cost, the customer laws, the monetization component rates
and the new-logo pricing — from `lawAt(t)`. With no interventions `lawAt(t)` **is** the base
object, so every per-month quantity is recomputed from the same inputs and is bit-identical to
the once-computed v1.3 value: `interventions: []` reproduces a run without the key field for
field (D-NULL), and ALL-NULL-V13 still replays the complete v1.3 state exactly.

**Cost.** Booked from the decision month, not from the month the effect arrives: `oneOff` in
`startMonth`, `monthly` from `startMonth` through the last active month (the horizon when
permanent). It is a P&L line of its own (`interventionCost`, between expansion cost and EBITA)
and cash when incurred (D-COST, D-COMPOSE).

**Provenance.** Every month records `interventions { active, changes [{ target, from, to }],
cost, cumulativeCost }`; every pending-acquisition entry and every cohort records the
interventions in force at spend. Under a 6-month lag, a CAC hypothesis from M10 reaches entries
spent from M10 and the cohorts they become from M16; cohorts realised M10–M15 keep the 1.20×
they were bought under (D-PROVENANCE) — later assumptions never re-price committed spend.

**Boundary at the engine (bounds before benefits).** A hypothesis may target any numeric
assumption that is on in the base, or a monetization component leaf by path. It is rejected
(`RangeError`) if it targets something that is off (an intervention cannot switch Customer
Physics on), a layer switch, the billing policy, an unknown key; if its effect, value, months
or costs are malformed; if two share an id; and — checked before the run starts — if the
**resolved law of any month** fails the engine's own boundary validation or leaves its domain
(persistence above 1, gross margin above 1, negative S&M, a fractional lag…). The v1 laws the
engine never bounded gained explicit domains for this purpose (D-BOUNDS).

## Null world

`interventions: []` (the default). Every month runs on the base laws; no month carries a
hypothesis record; `interventionCost` is 0 and `ebita` is unchanged.

## Invariants

- before / during / after: months before the effect are bit-identical to Base; every ageing
  row inside the window runs at the resolved law (monthly g = 0.945^(1/12)); after the window
  the law reverts (D-LAWAT);
- the cost line is decision-dated and its own; a hypothesis with no effect (× 1.0) leaves ARR
  bit-identical and lowers EBITA and cash by exactly its cost (D-COST);
- stamped at spend, not at maturity (D-PROVENANCE);
- declaration order is the composition rule for two hypotheses on one law, and it is recorded
  (× 1.1 then + €100k = €1,090,000; + €100k then × 1.1 = €1,100,000) (D-ORDER);
- permanent hypotheses run and cost to the horizon (D-DURATION);
- layer targets by path: usage price growth from M13 moves every cohort's price effect from
  M13; a list-price rise from M25 prices new logos at €23,000 while existing cohorts keep their
  own state — the two kinds of price change are distinct objects (D-LAYERS);
- with Cash Physics on the cost is cash when incurred and the cash identities hold (D-COMPOSE);
- determinism; `resolve` never touches the base object (D-DETERMINISM, D-MODULE).

## Falsification experiment

A retention programme — persistence × 1.05 (0.90 → 0.945), decided in M6, effect from M9 for
24 months, €200k one-off + €50k/month while it runs (€1.55m) — against the same company
without it, and against the same hypothesis with no effect (× 1.0). The implementation is
wrong if months 1–8 differ, if any month outside M9–M32 runs at 0.945, if the cost line differs
from the schedule, or if the no-effect run differs from Base by anything but its cost.

## Result

| month | law in force | cost | ARR Base | ARR hyp. | ΔARR | cash Base | cash hyp. | Δcash | Δcash, cost only |
|---|---|---|---|---|---|---|---|---|---|
| 5 | 90.0% (base) | €0 | €23.66m | €23.66m | +€0.00m | €7.53m | €7.53m | +€0.00m | +€0.00m |
| 6 | 90.0% (base) | €250k | €24.39m | €24.39m | +€0.00m | €7.18m | €6.93m | −€0.25m | −€0.25m |
| 9 | 94.5% | €50k | €26.58m | €26.68m | +€0.11m | €6.43m | €6.03m | −€0.40m | −€0.40m |
| 20 | 94.5% | €50k | €34.55m | €36.03m | +€1.48m | €7.39m | €7.00m | −€0.39m | −€0.95m |
| 32 | 94.5% | €50k | €43.16m | €46.62m | +€3.45m | €15.08m | €16.04m | +€0.95m | −€1.55m |
| 33 | 90.0% (base) | €0 | €43.88m | €47.33m | +€3.45m | €16.03m | €17.22m | +€1.18m | −€1.55m |
| 60 | 90.0% (base) | €0 | €62.93m | €66.30m | +€3.37m | €59.57m | €66.90m | +€7.33m | −€1.55m |

The programme costs cash from M6, starts working in M9 and ends in M32; cash overtakes Base in
M26 and ends +€7.33m ahead on €1.55m of cost. Cumulative leakage €21.65m → €19.35m. After M32
the law reverts and the ARR advantage decays (+€3.45m at M32, +€3.37m at M60) — a programme,
not a coefficient. The "cost only" column is the same hypothesis with × 1.0: ARR bit-identical
to Base, cash lower by exactly the cost; the gap between the two Δcash columns is what the
effect is worth. **The v1.3 world could express none of this** — not the delay, not the end,
not the cost, and not the distinction between the decision and its effect (Scenario 14 in the
product).

**Provenance under a lag (D.2).** With a 6-month acquisition lag and a CAC hypothesis from M10,
cohorts M8–M15 carry 1.20× and no hypothesis; M16 onward carry 0.96× and `cac`, with initial
ARR €0.94m instead of €0.75m.

## Boundary

- **No mechanism for why a law moves, and no uncertainty about whether it will.** A hypothesis
  states its effect; the model does not model the programme's success probability, its
  diminishing returns or its dependence on spend. Those would be their own objects.
- **The effect is a comparison, not a measurement.** `K.interventionMeasures` reports status,
  months in force and cost to date; the effect is Experiment − Base (FINDINGS #42).
- **One order.** Two hypotheses on one law compose in declaration order; the split between
  them is a convention.
- **No layer switches, no billing-policy changes**, and no targets that are off in the base.
- **Cost is a flat line**, not a mechanism: no headcount, no ramp, no cost that scales with
  the effect achieved.
