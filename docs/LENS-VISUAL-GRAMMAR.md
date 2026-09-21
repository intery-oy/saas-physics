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

## Chart grammar (five-lens design)

Every lens chart is drawn by one function on one frame, so the five pages read as one
instrument:

| Element | Rule |
|---|---|
| Frame | viewBox 640 × 200 (Customers panes 118, Monetization 230); plot margins L 54 · R 78 · T 10 · B 18; width 100% of the column, max 780px, so charts stacked on one page align to the pixel |
| Time axis | Y1–Y5 at months 12 … 60, faint vertical rules; month 0 is the opening |
| Value axis | four ticks on the left in the series' unit (€ basis-aware for recurring, plain € for flows and cash, × for CAC, mo for payback, count for customers); a zero line only when the range crosses zero |
| Experiment | solid, 1.6–1.8px, indigo (or the series' semantic colour); areas at 16–42% opacity |
| Base | the same series dashed `5 4`, muted indigo, drawn first; shown only when it differs from Experiment |
| Selected month | one cursor line at the global month on every chart; right-edge values for each labelled series, pushed apart when they collide; click anywhere on a chart to move the month there. A mark or a gap bracket inside the plot flips side before it would reach the right-edge values, and takes the first free slot above or below rather than printing over another label |
| Legend | swatches in the title row, right-aligned before the basis tag |
| Company formation | the canvas keeps the cohort strata (indigo ramp, opening base at the bottom), the Base dashed, and no cash plane. The YoY growth line is secondary: 1px, 55% ink, read against a hairline % axis on the plot's right edge (captioned YOY %, nice-stepped ticks) so it is never mistaken for the € axis on the left. The selected-month ARR (indigo, dominant) and YoY values sit in the right margin as two-line blocks, stacked apart when they would collide, each tied to its true height by a hairline leader; % ticks yield to them. The playhead bracket flips to the left of the playhead whenever its text would run into the margin |
| Growth decomposition (Customers) | the cumulative economic decomposition of the recurring-revenue movement since M0, on one chart: expansion fills from zero upward, new customers stack on top of it with no gap or overlap, contraction + churn hangs below zero, and a thin ink line is the net that survives. Each band draws the boundary that makes it a stack: the loss its floor, expansion its top (the line new customers stand on), new customers the top of the stack. The zero line is the identity — what is above it minus what is below it is the line. Right-edge values give the net, the new contribution, expansion and contraction + churn at the selected month; a name too long for the margin takes a second line. Contraction and churn are the engine's one combined flow and are never split |
| Cohort life (Inspect) | clicking a stratum changes the question, so the figure changes with it: the formation canvas and its controls step aside and the same frame carries two charts of ONE cohort — its recurring-revenue life as the cumulative layers that produced it — a quiet dashed line at the balance it was acquired with, expansion filling above that line, and the losses hanging under it (contraction against the original and logo churn under it when the customer layer separates them, one combined leakage layer when it does not), with the cohort's own line drawn last and dominant on top. The identity is the geometry: original + expansion − contraction − churn = cohort ARR. The acquisition month is marked and ruled, and the same cumulative movements are printed beneath the chart and named identically in the Inspect chain, and, aligned underneath, cumulative gross profit rising against the dashed acquisition cost with the payback month marked. A bracket at the selected month reads the gap: above/below original, still unrecovered or beyond acquisition cost. Nothing company-level appears — no other strata, no company ARR, no company YoY growth, no Base. The global month still moves, and ‹ Company restores the formation |
| Inspect chain | one context line (Company ARR) then five numbered stages on one rail — 1 Cohort · *acquired* ↓ 2 Customer economics · *retained* ↓ 3 Monetization · *monetized* ↓ 4 Contract · billing · *billed* ↓ 5 Cash · capital recovery · *capital recovered* — stage heads in Archivo 600 tracked uppercase, the stage hero in 13px mono beneath, detail rows and disclosures under it. Customer counts read as Customers / Customer base / ARPA / Logo retention (`2.1 from 2.6 at acquisition · 82.5% retained`), never "customer equivalents"; a Method disclosure states that counts are cohort-level expected values |
| Levers | the rail's own controls mirrored on Growth engine (S&M, CAC floor, capacity) and Monetization (platform fee, usage growth, adoption); a drag never re-renders the bar it is on |
| Acquisition response (Growth engine) | the one chart on the instrument whose x-axis is not time: x is S&M per month, y is New ARR per month, and the curve is the engine's own acquisition function. The capacity ceiling is a dashed amber line the response bends toward and never reaches; the operating point is a filled indigo dot with a drop line to its spend, the Base operating point a dashed ring beside it; the chord from the origin through the point is average CAC and the dotted tangent at the point is marginal CAC, so the gap between the two slopes is the reason they differ. Moving S&M slides the point along the curve; moving the CAC floor or the capacity moves the curve itself, and the Base law is then drawn dashed beneath it. It keeps the instrument's frame and margins but carries no cursor, and clicking it does not move the month |
