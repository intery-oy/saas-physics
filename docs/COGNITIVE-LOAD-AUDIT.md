# Cognitive-load audit — the live Economic Legibility build at `4b00969`

Captured with Playwright at 1440×900 (and 1024 / 768 / 390) on the illustrative Enterprise
world at month 36: `docs/screens/cognitive-load/before/`. The visual grammar is not in question
here; what is in question is how many good things compete for attention on each screen.

Governing principle for the pass: **one primary cognitive task per screen.** Everything that does
not serve that task, right now, moves behind an interaction, to another surface, or out.

## Per screen

### Company — *what company did these assumptions create?*

| | |
|---|---|
| Primary task | read the company: size, growth, shape of its economics, then one lens at a time |
| Competing tasks on screen now | model construction (the 262px rail with packs, layer heads, every control and its definition); the 60-month figure taking ~55% of the area; the monthly P&L waterfall beneath it; five lenses stacked in a 320px column; the Compare spine appended to the same column; header mode switches |
| Count of simultaneous focal regions | six (rail · figure · waterfall · lens column · header controls · transport) |
| Keep visible | the company hero (recurring revenue, growth, Δ vs Base) with a short orienting descriptor row; the lens navigation; the **one** active lens at reading width; the transport |
| Behind disclosure | the 60-month figure (open on Company and Customers, collapsed as a strip on the other lenses); the P&L waterfall (inside Economics & cash); the Compare spine (its own surface, one strip on Company saying it exists) |
| To another surface | the Change rail → a drawer opened from the header; Inspect → its own surface when a cohort is pinned |

### Change — *build or modify the economic world*

| | |
|---|---|
| Primary task | set laws, constraints, inputs, a hypothesis; pick a world |
| Competing now | it is permanent furniture beside Company; every control shows category, glyph, name, value, unit, definition, direction, Base value, measurement and mechanism prose at once; every layer head repeats its methodology |
| Keep visible (compact default) | glyph · name · value (Base value only when it differs) · slider; the measured line beneath a law; layer name and on/off; the world buttons |
| Behind disclosure | definitions, units, direction, group notes, layer methodology, the legend (a Details toggle; a hover title on each control) |
| To another surface | none — but the rail becomes a mode: a wide drawer over Company with a close, not a column |

### Compare — *understand causality between two worlds*

| | |
|---|---|
| Primary task | what you changed → what the system did → what company emerged |
| Competing now | it renders at the bottom of the lens column, after five lenses, at 320px; multi-layer changes give ~20 equal-weight rows; the Δ column overruns the panel |
| Keep visible | the three levels; under *what the system did*, the rows that belong to the layers the change entered at and moved |
| Behind disclosure | rows in untouched layers and rows that did not move ("secondary effects · n more"); boundaries; attribution |
| To another surface | Compare becomes its own surface (header nav), at reading width; Company keeps one strip: *Experiment differs from Base · n assumptions · MRR M60 +€281k → Compare* |

### System — *understand the economic machine*

| | |
|---|---|
| Primary task | see the machine; then read its laws; then inspect a mechanism |
| Competing now | a 320px prose panel (stocks, flows, rates, mechanisms, missing links, why this surface exists) beside the ontology; the ontology is drawn at ~78% of the width it could have |
| Keep visible | the ontology at full width; the view list and the breadcrumb; the one-line reading of the map beneath it |
| Behind disclosure | the side prose, opened by a *Notes* toggle |
| To another surface | none |

### Scenarios — *conduct a canonical experiment*

| | |
|---|---|
| Primary task | what does this experiment teach me? |
| Competing now | the Change rail, the figure, the 14-button selector, the P&L waterfall, the consequence panel and its spine, all at once |
| Keep visible | the experiment: title question · what changed · what stayed the same · what emerged · why it matters; a compact selector as navigation; the figure beneath as context |
| Behind disclosure | the full mechanism spine (*what the system did*), boundaries, attribution, the calibration tables |
| To another surface | the rail (drawer), the waterfall (Economics & cash) |

### Inspect — *where did this number come from?*

| | |
|---|---|
| Primary task | follow one chain from company ARR to cash |
| Competing now | it lands at the bottom of the lens column after all five lenses; each step lists every row it has |
| Keep visible | the six steps, each with its hero line and its two or three defining rows |
| Behind disclosure | the remaining rows of a step and the method note |
| To another surface | Inspect becomes the surface when a cohort is pinned; *‹ Company* returns |

### Method / Guide

Method still speaks in release archaeology ("v1 assumes", "frozen v1.3 world", "#18 there are
no customers", "#21 there is no price", "#15 FCF = EBITA", "v2 Gate A") while the product has
nullable layers that resolve those boundaries when on. Boundaries must be written conditionally
and history moved to a *History* section. The browser title still says "SaaS Physics v1". Guide
should shrink once the interface carries its own hierarchy.

## Target hierarchy

```
HEADER   Company · Compare · System · Scenarios        [Change ▸ Experiment · n]   Basis   Method · Guide

COMPANY  ┌ hero: €2.50m MRR · +22.5% y/y · +€80k vs Base          M36
         │ customers · ARPA · NRR · gross margin · EBITA margin · cash · trough   (absent layers named once, not dashed)
         ├ COMPANY | CUSTOMERS | GROWTH ENGINE | MONETIZATION | ECONOMICS & CASH
         ├ the active lens, at reading width (≈ 860px)
         ├ ▾ Formation · 60 months   (the figure; open on Company/Customers, a strip elsewhere)
         └ Experiment differs from Base · n assumptions · … → Compare   (one line, only when true)

CHANGE   a drawer over Company: World · compact controls by layer · Details toggle · Reset · close

COMPARE  what you changed → what the system did (primary rows; secondary collapsed) → what company emerged

SYSTEM   the ontology at full width · view list · breadcrumb · [Notes ▸]

SCENARIOS  selector as navigation · the experiment: changed · same · emerged · why · [full spine ▸] · figure beneath

INSPECT  ‹ Company · the chain, six steps, hero + defining rows · [more ▸]

TRANSPORT  always: month · scrubber · speed
```

What the pass does not do: shrink type, add columns, nest scrolling, add icons, add a KPI grid,
or change a single economic quantity.
