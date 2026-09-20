# Lens visual grammar — dark, indigo, analytical

One grammar for the five lenses, the formation figure, Compare and the System map. Every
mark answers one of three questions: what exists (STATE), what moves it (MECHANISM), what the
experiment caused (DELTA). Colour is never the only encoding; shape, weight and position carry
the same meaning.

## Typography hierarchy

| Register | Face | Size | Use |
|---|---|---|---|
| Question | Spectral italic | 12.5px | the lens question, the one line beneath a hero |
| Hero value | JetBrains Mono 500 | 32px | the lens's primary state, one per lens |
| Identity / flow value | JetBrains Mono 500 | 15–18px | the terms of an identity (`2,505 × €1.6k = €4.0m`), the values on a flow |
| Datum | JetBrains Mono | 11–12px | bridge rows, readouts, deltas |
| Label | Archivo | 10–11px, `--ink-2/-3` | what a datum is |
| Eyebrow | Archivo 600, tracked, uppercase | 9.5px | section names: STATE, CUSTOMER BASE, PATH 1 · ECONOMICS |
| Basis tag | JetBrains Mono, tracked, uppercase | 9px | M36 · R12M · CUM · M60 — on every figure, never omitted |

Nothing shrinks below 9px. Labels never wrap inside a value.

## Palette semantics

The canvas is a cool near-black. Indigo is the system's structural family: everything that
belongs to *the run* (Experiment) is indigo, everything that belongs to *the reference*
(Base) is a quieter indigo. Amber marks what the reader set. Green and rose mark economic
direction only. Nothing else is coloured.

| Token | Value | Means |
|---|---|---|
| `--ground / --scene / --panel / --raised / --sunk` | `#07090f · #0a0d15 · #0e1219 · #141925 · #06080d` | surfaces, cool neutral |
| `--line / --line-soft` | `#1b2233 · #131a27` | thin rules, never boxes for their own sake |
| `--ink / -2 / -3 / -4` | `#e6e9f2 · #98a2b8 · #66708a · #414a60` | values · labels · quiet labels · rules and off states |
| `--exp` EXPERIMENT | `#8b8df0` | the run you steer: solid, bright, 2px, filled mass |
| `--base` BASE | `#4d5aa8` | the frozen reference: dashed, 1.6px, muted, never filled |
| `--law` LAW · CONSTRAINT | `#d2a45c` | a law the world obeys (⋈), a constraint on a mechanism (⌈⌉): set by the reader, amber |
| `--hyp` INTERVENTION | `#c885d8` | a hypothesis (↯): costed, lagged, temporary; enters from outside |
| `--in` POSITIVE FLOW | `#4fa37d` | an inflow to a stock (+ new, + expansion, + Δdeferred) |
| `--out` NEGATIVE FLOW | `#c2606a` | an outflow (− churn, − contraction, − COGS) |
| `--stock` STOCK | `#a3acc2` | an accumulated state at rest (opening, closing, cash) |
| `--good / --warn` | `#4fa37d · #d2a45c` | only for an economically meaningful direction of a delta |

Orange has no role. Amber is reserved for laws and constraints, so it cannot dominate.

## Marks

| Object | Mark |
|---|---|
| STOCK | a container: filled `--stock` bar in a bridge, a bordered node in a flow, the cohort mass on the figure |
| FLOW | a delta from the running balance: `--in` / `--out` bar with its edge tick; on a flow diagram an arrow between nodes |
| LAW | `⋈ value` in amber, attached to the mechanism it governs; on a control it is the only thing that carries amber |
| CONSTRAINT | `⌈⌉ value` in amber with a dotted cap; the response curve shows the bound as a dashed amber line |
| MEASUREMENT | `→ value` in ink; reads beneath the object it observes; never set |
| INTERVENTION | `↯` in orchid; a window `M9–M32`; enters from outside the machine |
| INACTIVE / NULL MECHANISM | dotted border, `--ink-4` text, the word *off*: an absent mechanism is drawn, never hidden |
| SELECTED MONTH | a playhead line and dot in `--exp`; every basis tag follows it |
| R12M | tag `R12M`; before month 12, `CUM · M1–Mn` — the figure says which |
| CUMULATIVE | tag `CUM`; sums since M1 |
| BASE vs EXPERIMENT through time | Experiment: solid indigo mass with the projected future as an outline; Base: dashed muted indigo line; the gap is shaded only where it is the object (ΔCash) |
| CHANGE MARKER | at the mechanism where the change entered: `Label · from → to` with the arrow in `--exp`; on the figure, one vertical tick at the month the effect begins |
| DELTA | `+€5.5m vs Base` beneath a primary state, `--good/--warn` by economic direction; only on the hero of each lens and the mechanism that changed; never beside every number |
| UNCHANGED, WHEN THAT IS THE FINDING | `ACQUISITION · unchanged vs Base` in `--ink-3`, one line, only when the experiment differs elsewhere |
| SCENARIO DELTA | the same delta mark, read against the scenario's Base |

## Composition rules

- One primary object per lens, at reading width (≈ 640–860px). Cards are for key readouts only.
- Prefer FLOW (A → B → C), BRIDGE (opening → movements → closing), COMPOSITION (a whole split), IDENTITY (a × b = c), TRAJECTORY, CONSTRAINT, DIVERGENCE, PROVENANCE over grids of numbers.
- A law and a measurement never sit as equal tiles: the law is amber and above the mechanism, the measurement is ink and beneath it.
- Base is quieter than Experiment everywhere: dashed, thinner, muted; Experiment is solid and brighter.
- Deltas are sparse: hero + changed mechanism + the consequence a lens exists to show.
- When a layer is off, the lens changes shape, not just its text: fewer rows, a dotted object, a reduced heading (INSTALLED BASE, MONETIZATION OFF, FCF = EBITA).
