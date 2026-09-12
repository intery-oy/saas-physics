# Assumption pack + leave-behind (craft C1 / C2)

*12 September 2026. Schema note and acceptance checklist. No new coefficients.*

This is **client residue after diligence**, not Horizon C physics (price / R&D — those stay in [`ROADMAP-HORIZONS.md`](ROADMAP-HORIZONS.md) §4). C3 (a multi-pack shelf) is deferred. The pack never writes `engine.js`.

Identity chips stay `Default|A|B` · `M##` · scenario · `Base|Exp`. No Partner-mode. No real-book QoE claim.

---

## Schema v1

`schema`: `saas-physics.assumption-pack`  
`schemaVersion`: `1`  
`modelVersion`: `0.4`  
`kind`: `assumption-pack`

| Block | Maps to | Drivers |
|---|---|---|
| `assumptions` | `DEFAULT_ASSUMPTIONS` + optional `bands` | `sm`, `cacPerARR`, `acqSaturationSpend`, `smCashReserve`, `billingAdvanceMonths`, `expansionCacPerARR`, `logoRetentionAnnual`, `persistenceAnnual`, `expansionCoefficientAnnual`, `grossMargin`, `rd`, `ga`, `bands` |
| `start` | `DEFAULT_START` | `openingARR`, `openingCash`, `openingCohorts`, `openingCustomers` |

Null / omitted optional bounds are the engine's existing off-states (linear acquisition, unconstrained S&M, FCF=EBITA, free expansion, no logos, flat tenure). Flat bands serialize as `bands: null`. Unknown keys are refused.

JSON is canonical. YAML is a restricted sibling of the same object (`pack.js` `stringifyYAML` / `parseYAML`).

Diff lists **changed drivers only**. It is not a second GRR / FIBC / analytics pass.

### Driver values

`normalize()` type- and range-checks every driver the pack actually states, and throws `AssumptionPackError` naming the driver and the bound it broke. An **omitted** driver takes the engine default and is not checked; an **explicitly stated** one is.

| Driver | Domain |
|---|---|
| `sm`, `rd`, `ga` | finite, `>= 0` |
| `cacPerARR` | finite, `> 0` |
| `persistenceAnnual`, `grossMargin` | finite, `0 … 1` |
| `expansionCoefficientAnnual` | finite, `>= 0` |
| `acqSaturationSpend`, `smCashReserve`, `billingAdvanceMonths`, `expansionCacPerARR` | `null` (off) or finite `>= 0` |
| `logoRetentionAnnual` | `null` (off) or finite `0 … 1` |
| `bands[i]` | `persistenceAnnual` / `expansionCoefficientAnnual` as above; `maxAgeExclusive` `> 0` or `null` for the standard edge |
| `start.openingARR` | finite, `>= 0` |
| `start.openingCash` | finite (may be negative — that is a world, not an error) |
| `start.openingCustomers` | `null` (derive from ARPA) or finite `> 0` |
| `start.openingCohorts[i]` | `arr` and `age` finite, `>= 0` |

These are the **model** domain, not the UI slider range: a pack may carry a world the sliders cannot reach, but not one the equations cannot evaluate. Two silent failures this closes — `E.run` merges with `Object.assign`, so an explicit `"sm": null` reaches the arithmetic and turns the whole 60-month world into `NaN`; and the engine's optional-coefficient readers coerce out-of-domain values to *off*, so a typo would have read as a deliberate choice. Regression: `PACK-VALUES` in `pack-checks.js`.

---

## Leave-behind kit

Export of the current world stamp:

| File | What |
|---|---|
| `pack.json` / `pack.yaml` | Assumption pack of this run |
| `appendix.csv` | Month × KPI (same `notebook.js` table) |
| `audit.txt` | Selected-month `M(t−1) → flows → M(t)` |
| `bind.json` | Reserve / saturation / linear as currently shown |
| `INDEX.md` | World chips + bind + Year-5 ARR; Sc5 ledger when the current world is the pair |

Folder or store-only zip. Offline. Not a commercial pack.

---

## CLI

```bash
node pack-cli.js save [file]     # Default pack (json + yaml)
node pack-cli.js load <file>     # Year-5 ARR; Default checksum
node pack-cli.js diff <a> <b>    # driver-level
node pack-cli.js export [dir]    # leave-behind folder + zip
```

---

## Acceptance

1. Save pack from UI or CLI; reload restores assumptions.
2. Diff two packs is driver-level and accurate.
3. Leave-behind export includes pack + audit/CSV + bind snapshot; numbers match the on-screen world stamp.
4. `node build.js` + load Default pack → Year-5 ARR €62,926,223.19.
5. Exported zip / folder opens.

Lean check: `node pack-checks.js`. Not a full suite.

**Out.** Multi-tenant auth, billing, valuation modules, C3 multi-pack shelf.
