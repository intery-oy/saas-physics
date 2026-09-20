# Research Note — Monetization Physics (v2 Gate B)

Every figure below is printed by `node v2-study.js` §B and asserted by `node v2-checks.js`
(B-ON, B-REQUIRES-A, B-ONE-SOURCE, B-BRIDGE, B-BYPASS, B-SATURATION, B-PRICE, B-MIX-MATCHED,
B-DECOMPOSITION, B-PROVENANCE, B-COMPOSE, B-VALIDATION, B-DETERMINISM, B-MODULE) and on
screen by `node v2-accept.js` (B · CONTROLS / OBSERVE / SYSTEM / SCENARIOS 11–12 / NULL).

## Question

*How much of a revenue change came from price versus other drivers — and where does expansion
stop?*

Through Gate A, survivor revenue grew by one coefficient. It could not say whether growth was
price, more usage or more adoption (FINDINGS #21), and it never stopped (FINDINGS #13, #30).
The customer layer separated who leaves from who shrinks; it could not say *what* they buy.

## New economic object

A cohort's per-customer revenue is a set of **components**, each `(penetration, units,
price)`, and the cohort's ARR is **derived** from them every month:

```
revenue per customer (annual) = Σ_k penetration_k × units_k × price_k
cohort ARR                    = customers × revenue per customer
```

| Input (`monetization.components[k]`) | Meaning |
|---|---|
| `kind` | `fixed` (platform fee, contracted seats: penetration 1, no headroom) or `variable` (usage, an add-on) |
| `penetration`, `units`, `priceAnnual` | the opening per-customer state |
| `priceGrowthAnnual` | list-price change, any component (**price effect**) |
| `usageGrowthAnnual`, `unitsCap` | units per adopting customer grow until the cap (**usage effect**) |
| `adoptionAnnual`, `penetrationCap` | share of the remaining non-adopters who adopt per year, to the cap (**adoption effect**) |

Null: `monetization: null` (the default) — the Gate A world. Requires Customer Physics
(rejected otherwise, never silently run on a carried balance).

Each month, per cohort, after logo churn (customers.js, departing customers take the cohort's
average revenue), the surviving customers' state moves in a fixed order:

```
1. contraction   variable units × (1 − cM)                customers who stay and use less
2. price         price_k × (1 + pM_k)                      every component
3. usage         units_k → min(cap_k, units_k (1 + uM_k))  variable only
4. adoption      pen_k → pen_k + (penCap_k − pen_k) aM_k   variable only
closing = opening − logo churn − contraction + price + usage + adoption
```

so the v1.3 fields are *readouts* of named effects: `expansion` **is** price + usage +
adoption, `leakage` **is** logo churn + contraction (B-BRIDGE, residual €0.00e+0). Three
v1.3/Gate A inputs are **not read** while the layer is on — `expansionCoefficientAnnual`
(bypassed; `mechanisms.genericExpansionBypassed = true`), `newLogoARPA` (new logos start at
the components' opening state) and `start.openingARR` (derived: customers × per-customer
revenue) — and the run reports the ignored values (B-BYPASS: 0.10 → 0.40, €5,000, €5m change
no month field).

**One source of truth.** Every row: customers × per-customer revenue ÷ 12 = closing MRR;
fixed ARR + variable ARR = closing ARR; the stored state re-prices to the recorded revenue
(B-ONE-SOURCE, 1,890 rows, worst |Δ| €7.0e-10). Company records are Σ cohort sub-records.

**Provenance.** The pending entry stamps `perCustomerAtSpend`; a cohort is born from it
(`realiseCohort` still takes no assumption object; a synthetic entry yields the cohort).
Entries with different per-customer states maturing in one month are rejected: a cohort has
one ARPA (B-PROVENANCE).

**Where persistence went.** Contraction reaches variable revenue only, so a cohort's dollar
persistence is **emergent** — it depends on its fixed/variable mix — not the Gate A constant
L(1 − C). The run reports `persistenceSource: 'emergent…'`, `persistenceAnnualEffective: null`,
and `derived.monetization.customerLawPersistence` (what L(1 − C) *would* give if every euro were
variable). The product's persistence slider reads "emergent — set by the revenue mix".

## Null world

`monetization: null`. The engine takes the Gate A branch; ALL-NULL-V13 still replays the
complete v1.3 state exactly (737,109 fields, worst |Δ| €0.00e+0) and every v2 field is null.

## Invariants

- one source of truth (above); the v1.3 company bridge closes every month (B-BRIDGE);
- the generic coefficient, ARR per new logo and opening ARR are not read (B-BYPASS);
- price growth alone compounds exactly: €20,000 × 1.05^(t/12), R12M NRR 105.0000% all price
  (B-PRICE);
- a closed cohort with caps converges monotonically to the ceiling
  `fixed + penCap × unitsCap × price` and expansion declines to < 5% of its M1 value once the
  cap binds (B-SATURATION);
- `K.monetizationMeasures`: 1 − logo churn − contraction + price + usage + adoption = NRR,
  residual < €1e-6, GRR and expansion equal to `measureR12M` (B-DECOMPOSITION);
- expansion cost prices price + usage + adoption; capital reconciles under lag and capacity
  (B-COMPOSE); determinism; the module is stateless (B-DETERMINISM, B-MODULE).

## Falsification experiment

Three probes. (B.2) Same opening ARR, customers, ARPA, L and C; only the fixed/variable mix
differs; no growth drivers. The layer is empty if GRR does not move with the mix. (B.3) A closed
cohort with usage and adoption caps: wrong if per-customer revenue exceeds or fails to approach
the ceiling. (B.4) Two worlds matched on R12M NRR at T = 12 — price-only vs usage-only — the
question of #21: wrong if the decomposition cannot tell them apart.

## Result

**B.1 The default world** (L 92%, C 5%; platform €12,000 +3%/yr; usage 80% × 100 units × €100,
price +2%, usage +15%/yr to 300, adoption 10%/yr to 95%). R12M on the frozen eligible cohort:

| T | opening ARR | − logos | − contraction | + price | + usage | + adoption | = NRR | GRR | variable share |
|---|---|---|---|---|---|---|---|---|---|
| 12 | €20.00m | 8.26% | 2.07% | 2.52% | 5.68% | 0.76% | 98.63% | 89.67% | 43.5% |
| 36 | €37.25m | 8.26% | 2.25% | 2.49% | 6.18% | 0.69% | 98.83% | 89.48% | 45.9% |
| 60 | €54.20m | 8.27% | 2.39% | 2.46% | 6.55% | 0.64% | 98.99% | 89.34% | 48.2% |

M60 ARR €62.60m = fixed €32.44m + variable €30.16m; cumulative expansion €19.33m = price
€5.14m + usage €12.77m + adoption €1.42m. The opening base's per-customer revenue has grown
from €20,000 to €28,713 with 51.9% of its usage cap and 90.7% of its penetration cap used.

**B.2 Mix alone moves dollar retention** (same €20m, 1,000 customers, ARPA €20,000, L 92%,
C 5%, no growth drivers):

| mix | M1 logo churn | M1 contraction | GRR R12M @24 | M60 ARR | M60 cash |
|---|---|---|---|---|---|
| all fixed (platform €20,000) | €0.14m | €0.00m | 92.00% | €50.11m | €37.39m |
| 60/40 (€12,000 + 80% × 100 × €100) | €0.14m | €0.03m | 90.21% | €47.32m | €32.20m |
| all variable (100% × 200 × €100) | €0.14m | €0.08m | 87.40% | €43.13m | €24.41m |

Identical customers and customer laws; the same 5% contraction law costs the all-fixed world
nothing and the all-variable world 5% a year. **Neither the ARR-only nor the customer world has
an object that differs between these rows** (Scenario 12 in the product).

**B.3 Expansion saturates.** A closed cohort (no acquisition, churn or contraction; usage
+30%/yr to 300, adoption 25%/yr to 95%, no price growth): per-customer revenue €20,213 (M1) →
€22,888 (M12) → €31,481 (M36) → €39,432 (M60, cap reached) → €40,247 (M120) against the ceiling
€40,500; monthly expansion €213k → €590k (M48) → €26k (M60) → €6k (M120). FINDINGS #13/#30 are
bounded under this layer — by the caps, not by a coefficient.

**B.4 Price or usage?** P (price +6%/yr on every component) and U (usage +15.5%/yr to 250,
no price growth) are matched on R12M NRR at T = 12 (95.57% both, ARR €27.93m both). By T = 60:
NRR 95.72% vs 96.10%, ARR €56.45m vs €56.85m, with P's expansion 5.68% all price and U's 6.60%
all usage, U at 63.5% of its cap. The ARR-only world reports one expansion number for both;
the decomposition answers #21 directly.

## Boundary

- **One per-customer state per cohort.** Components are homogeneous within a cohort: no
  distribution of usage across customers, no heavy users, no concentration.
- **No price elasticity.** Price growth loses no customers and no usage; L and C are
  independent of price. A demand response would be its own mechanism with its own null.
- **Contraction reaches variable usage only** — a statement about *what a customer can give
  up under contract*, not a claim that fixed fees are never renegotiated. Set contraction 0 to
  say nothing contracts; the all-fixed mix says the fee cannot.
- **Caps are the only bounds on expansion**; adoption and usage grow deterministically toward
  them. No discounts, ramps, minimum commitments, overage tiers or bundles: a general pricing
  taxonomy is deliberately not built (ARCHITECTURE-V2 §6).
- **Order of effects is fixed** (contraction → price → usage → adoption). Attribution of a
  month's change to the four effects depends on that order; the identity holds for any order,
  the split does not.
