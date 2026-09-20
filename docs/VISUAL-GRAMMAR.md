# Visual grammar — how each kind of economic object looks, everywhere

One grammar for Observe, Change, Compare, Inspect and System. The same kind of object looks
the same on every surface, so a reader who has learned a mark once can read the rest.

## 1. Object kinds and their marks

| Kind | What it is | Mark | Where the number sits |
|---|---|---|---|
| **Stock** | accumulated state at a point in time: ARR, customers, cash, pending acquisition, deferred revenue, receivables | a **container**: bordered box, filled level, weight; on ladders the wide full-height bar; on the map the tall rectangle | inside the container, large mono |
| **Flow** | movement over a period: new ARR, new logos, churn, contraction, expansion (and its price / usage / adoption parts), billings, collections, costs | a **delta**: a thin bar that starts where the previous balance ended, an arrow between containers, a signed figure with `+` / `−` | beside the delta, signed |
| **Law** | an assumption the world obeys: persistence, logo retention, CAC coefficient, price growth, gross margin | a **bowtie valve** on the map; in text a **law chip** `⋈ 90.0%`; in the rail a slider whose value is orange only when it differs from Base | on the valve / chip |
| **Derived law** | a law the layer below generates and the user cannot set: persistence under Customers, expansion under Monetization | the same valve/chip **hollow**, labelled *derived* / *emergent*; the slider disabled | on the chip, muted |
| **Constraint** | a bound on a mechanism: acquisition capacity, usage cap, penetration cap | a **cap mark**: a bracket `⌈ ⌉` over the flow, a ceiling line on a figure, the word *cap*; never a positive colour | as *x of cap* |
| **Measurement** | an observation of the world: R12M GRR / NRR / logo retention, average and marginal CAC, payback, cash conversion | a **readout**: plain mono figure preceded by `→`, never on a slider, never inside a container | with its basis tag |
| **Intervention** | a management hypothesis: costed, lagged, temporary | an **external arrow** entering from outside the system, dashed for the lag, solid while in force, with a decision dot; the affected valve ringed; in text the prefix *hypothesis* | on the arrow: `× 1.05 · M9–M32 · €1.55m` |
| **Absent / null** | a mechanism that is off | its mark drawn **dotted and unlabelled** with the word *off*; never omitted where the reader would otherwise assume it is on (capacity, cash physics, customer layer) | *off* |

## 2. Stocks and flows, the ladder form

Every bridge is drawn as a **ladder**: opening stock (wide bar from the axis), each flow as a
delta bar starting at the running balance, closing stock (wide bar). Inflows extend right,
outflows extend left; the running-balance rule is drawn as a hairline. The ladder is used for
customers (logos), ARR, the P&L (revenue → gross profit → EBITA) and cash (EBITA → Δdeferred →
Δreceivables → cash FCF). A stock is never drawn as a delta; a flow is never drawn as a
container.

## 3. Composition versus movement

**Composition** (what a stock is made of) is a **stacked bar** of the stock at a point in time:
fixed | variable revenue; opening base | later cohorts; platform | usage. **Movement** (why the
stock changed) is a **ladder** of flows over a period. The two are always separate figures with
separate basis tags; a stacked bar never carries a delta and a ladder never carries a share.

## 4. Time basis

Every figure and every lens carries exactly one basis tag, top-right, in mono small caps:

| Tag | Meaning |
|---|---|
| `M36` | point in time: the selected month's closing state |
| `M36 · month` | the selected month's flows |
| `R12M` | trailing twelve months to the selected month, measured on the frozen cohort where the KPI defines it |
| `CUM` | cumulative from M1 to the selected month |
| `M60` | the horizon endpoint (Compare only) |
| `age 14` | cohort age (Inspect only) |

The transport bar states the selected month once; no row repeats "this month".

## 5. Typography hierarchy

| Level | Use | Style |
|---|---|---|
| Hero | the one number a lens leads with (ARR, customers) | JetBrains Mono 30–34px, `--ink` |
| Descriptor | the sentence-worth of figures beneath a hero | mono 13px value · Archivo 10.5px label |
| Figure label | stock / flow names on ladders | Archivo 11px `--ink-2` |
| Readout | measurements | mono 11.5px `--ink`, `→` prefix in `--ink-3` |
| Basis tag | time basis | mono 9px, letter-spaced, `--ink-3` |
| Lens title | the lens question | Spectral italic 12.5px `--ink-2` |
| Eyebrow | section names | Archivo 9.5px caps `--ink-3` |

## 6. Colour

Indigo surfaces stay. Colour is semantic and sparse; it is never the only encoding.

| Token | Colour | Meaning (only) |
|---|---|---|
| `--exp` | orange `#c9722f` | the Experiment world, and interaction (active control, changed value) |
| `--base` | blue `#5a8fd6` | the Base world, and Base markers on Experiment figures |
| `--in` | teal `#4f9e77` | inflow to a stock (new, expansion, collections, positive Δ) |
| `--out` | rose `#b25a5e` | outflow from a stock (churn, contraction, costs, negative Δ) |
| `--stock` | slate `#8fa0aa` on `--raised` | a stock at rest; neutral |
| `--law` | amber `#c9973f` | a law's valve or chip, and a constraint's cap |
| `--hyp` | violet `#8b7fd4` | an intervention: arrow, ring, chip |
| `--ink-4` | dim slate | absent / null / off |

Layers do not get colours; their objects do. Positive and negative are inflow/outflow, not
good/bad: churn is rose because it leaves the stock, not because it is a warning.

## 7. The five lenses

Every lens has the same skeleton: a **question** (Spectral italic), a **hero or a figure**, a row of
**descriptors**, then **readouts**, then a **boundary line** when a layer is off. In order:

1. **Company** — what kind of company exists: hero ARR + growth; customers · ARPA · gross
   margin · EBITA margin · cash · cash trough.
2. **Customers** — what installed base produces the revenue: the logo ladder and the ARR ladder
   side by side; logo retention vs GRR vs NRR readouts.
3. **Growth engine** — what creates growth: the acquisition chain (S&M → coefficient → capacity
   → committed → lag → cohort), the three CACs as three objects, growth split by source (new ·
   expansion; customers · ARPA), the response position.
4. **Monetization** — what revenue is made of (composition bar) and why it changed (movement
   ladder: new · churn · contraction · price · usage · adoption).
5. **Economics & cash** — the P&L ladder and the cash ladder; trough and capital requirement.

## 8. Compare

Three stacked layers joined by a **causal spine** (a vertical rule with arrowheads):
*what you changed* (assumptions grouped by layer, from → to, laws as chips) → *what the system
did* (mechanism flows and readouts that moved, chosen by the layers touched) → *what company
emerged* (the Company lens figures, Base → Experiment). A "same output, different system" block
sits above the spine when the headline agrees and the mechanisms do not.

## 9. System

The top view is the **ontology**: capital → acquisition → customers → monetization → ARR /
revenue → P&L → billing / collection → cash, left to right, stocks as containers, flows as
arrows, laws as valves attached to the flow they govern, measurements as readouts beneath the
object they observe, interventions as arrows from outside. Each node opens its layer view; a
breadcrumb keeps orientation.

## 9a. Inspect — the provenance chain

A pinned cohort is one euro of company ARR traced down the ontology: **Company ARR** (this
cohort's share) → **Cohort** (vintage, original → now with cumulative expansion and leakage, and what
it was *bought under*: spend month, lag, acquisition cost, realised CAC, hypotheses at spend) →
**Customer economics** → **Monetization components** → **Contract · billing** → **Cash** (capital
recovery). Each step is one dot on a vertical rule with its own basis tag (`M20`, `age 11`,
`M20 · month`, `CUM · M1–M20`). A step whose layer is off is drawn hollow and says what the cohort
is instead ("no customer layer · the cohort is one balance") — never omitted. Method notes are
disclosed behind a `▸` summary.

## 9b. Change — model construction

Every control is one **kind** of object, marked before its name: `▭` input (set externally),
`⋈` law, `⌈⌉` constraint, `⏻` switch (a layer on or off), `↯` hypothesis. Each carries its
**unit** (`€ / mo`, `% / yr`, `€ per € ARR`, `months`) and, where it is unambiguous, the
**direction** a reader can state without running the model (`↑ less leakage`). A measurement
(`→ measured GRR · R12M`) reads beneath the law it observes and is never a control. A switched-off
control shows its switch once, not "off" twice; a permanent programme says *permanent*. The
experiment summary is *what you changed*, grouped by the causal layer the change enters at, in the
same words Compare uses. Layer tags speak the ontology (*beneath ARR*, *beneath P&L*, *from
outside*), not development gates.

## 9c. Time

Every figure names its basis (§4). Lenses 1–4 are at the selected month; lens 5 is on the trailing
window (`R12M`, or `CUM · M1–Mn` before month 12). Moving the playhead moves every tag together.
The transport label is the only clock.

## 9d. Breakpoints — reflow, never shrink

| Width | Layout |
|---|---|
| > 1180 | three columns: Change rail · figure · lenses |
| ≤ 1180 | the rail is a drawer (a *Change* toggle in the header; close button; tap the figure to close); figure and lenses side by side |
| ≤ 760 | one column, the page scrolls: header · figure with waterfall · the five lenses stacked · transport pinned; the System ontology keeps its drawn size inside a horizontally scrolling frame |

## 9e. Acceptance worlds

Three packs of the existing laws, illustrative and never benchmarks, so the representation can
be read against economies a CFO recognises: **A · Enterprise** (few large customers, platform fee
plus metered usage, annual billing in advance, sales lag, capacity), **B · Usage / AI** (material
metered usage with falling unit price, monthly in arrears, 60% gross margin, contraction),
**C · SMB** (many small customers, monthly in advance, cheap capacity-bound acquisition, high
churn). Each pack's note says so on the rail.

## 10. What is never done

No dual axes. No colour as the only encoding. No number on every point. No decorative gradient
or icon. No traffic-light scoring. No measured KPI on a slider. No law drawn as a readout. No
stock drawn as a delta.
