> Palette and lens marks were revised in the economic-lens pass: see `docs/LENS-VISUAL-GRAMMAR.md` (dark + indigo; Experiment indigo, Base muted indigo, amber only for laws and constraints). The structural rules below still hold.

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

## 9g. System · Customers — the mechanism, annotated

**The Model Ledger is the record. System is the mechanism, annotated with one month's canonical
quantities.** That division decides everything on this page: it does not try to be a table, and
the table does not try to be a diagram.

Customers is built as **two registers on one set of columns**. A column is an **event** —
`OPENING · + NEW LOGOS · − LOST LOGOS · − CONTRACTION · + EXPANSION · CLOSING` — and it is read
downward: what the event did to **logos** above, what it did to **money** below, joined by the
coupling that converts one into the other (`× ARPA`, `× ARR per new logo`, `× the ARPA they
carried`). The logo mark and the money mark share the column's axis to within a pixel, so the eye
can go straight from a count to the euros it carried.

**Two columns carry no logo mark at all, and the empty cell is drawn.** Contraction and expansion
move money without moving a logo: the same customers, paying differently. The absence *is* the
economics, so it is stated — a dotted placeholder reading *no logo moves* — rather than left as a
gap. Their coupling to the money register is drawn **gold**, the law colour: these laws reach the
euros directly, without passing through a customer.

**Scale — two scales, declared.** A stock and a flow here differ by a factor of forty. One linear
scale makes every flow invisible; a hidden second scale is a lie. So stocks share one run-wide
linear scale, flows share another, **the magnification between them is printed beside each
register** (`▮ flows magnified ×42`), every bar carries its own figure, and no non-zero flow is
drawn smaller than three pixels. Relative magnitude is exact *within* a register and *across
months* — which is the comparison that means something. The closing stock carries a dotted rule
at the **opening level**, so the month's net change is also legible at the stock's own true scale.
Both scales are computed once per recompute, never per month, so scrubbing the clock shows the
company growing instead of the axis rescaling under it.

**The four object kinds are distinguishable by mark alone.** Stocks are bordered containers. Flows
are solid bars, signed by colour and by a printed `+`/`−`. Laws are `⋈` valves **above the flow
they govern**, with a short stem down to it, and they are the controls. Measurements are `→` lines
**beneath** the columns they observe. A law a hypothesis has moved says so in the ontology's own
mark (`↯ ret · base 92.0%`) — a valve shows the law *in force*, never the law you set.

**A law this world does not use is not drawn.** Under Monetization the generic expansion
coefficient is bypassed, so no valve claims it: the expansion column becomes the way *into* the
Monetization layer instead, and contraction says it reaches usage revenue only. Under age-banded
laws no single expansion rate is in force, so none is shown as a scalar — the bands are printed.

Each register closes its own bridge in print, with the residual: `opening + new − lost = closing`
for logos, `opening + new + expansion − churn − contraction = closing` for money.

## 9a. Inspect — the provenance chain

A pinned cohort is one euro of company ARR traced down the ontology: **Company ARR** (this
cohort's share) → **Cohort** (vintage, original → now with cumulative expansion and leakage, and what
it was *bought under*: spend month, lag, acquisition cost, realised CAC, hypotheses at spend) →
**Customer economics** → **Monetization** → **Contract · billing** → **Cash** (capital
recovery). The figure beneath changes with the question: the company formation is replaced by this
cohort alone — its recurring-revenue life and the recovery of the capital that bought it — until
&lsaquo; Company returns. Each step is one dot on a vertical rule with its own basis tag (`M20`, `age 11`,
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

### The clock may not rebuild the surface under an open press

Time running rebuilds the stage's markup about eleven times a second. A press is not
instantaneous — a finger or a cursor rests on a control for something like a tenth of a second —
and a rebuild inside that window destroys the node being pressed, after which the browser
dispatches no click at all. The instrument then looks alive and answers nothing.

Three rules follow, held by `live-accept.js`:

1. **A press suspends the rebuild, not time.** While a pointer is down on the stage the clock
   keeps advancing and the figure keeps drawing; only the markup waits. The hold is released one
   task after the pointer, because the click is dispatched after the release — lifting it any
   sooner reopens the same gap. A lever drag is the deliberate exception: there the consequence
   is meant to move under the finger, so that path keeps its own live in-place swap.
2. **A disclosure is the reader's state, not the clock's.** A section opened under a running
   clock stays open as the months pass. Open state is carried across a rebuild by the section's
   id, or by its summary wording with the month number generalised.
3. **Stopping the clock stops the transport.** Anything that stops time — a chart clicked to a
   month, the scrubber dragged — puts the play control back to a play glyph. A pause glyph over
   a stopped clock is a lie the next press pays for.

## 9d. Breakpoints — reflow, never shrink

| Width | Layout |
|---|---|
| > 1180 | three columns: Change rail · figure · lenses |
| ≤ 1180 | the rail is a drawer (a *Change* toggle in the header; close button; tap the figure to close); figure and lenses side by side |
| ≤ 760 | one column, the page scrolls: header · figure with waterfall · the five lenses stacked · transport pinned; the System ontology keeps its drawn size inside a horizontally scrolling frame |

The page declares `width=device-width` — without it a phone lays the portal out at a 980px
fallback and scales it down, so none of the breakpoints above ever run on a phone. Heights come
from **the viewport actually on screen** (`100dvh`, with `100vh` behind it as the fallback): iOS
reports `100vh` as the height *without* its browser toolbars, and a layout pinned to that hangs
its last row — the time transport — below the fold. On a coarse pointer every target is enlarged
to something a finger can hit, guarded by `(pointer:coarse)` so the desktop instrument is
untouched. Held by `mobile-accept.js`.

## 9e. Acceptance worlds

Three packs of the existing laws, illustrative and never benchmarks, so the representation can
be read against economies a CFO recognises: **A · Enterprise** (few large customers, platform fee
plus metered usage, annual billing in advance, sales lag, capacity), **B · Usage / AI** (material
metered usage with falling unit price, monthly in arrears, 60% gross margin, contraction),
**C · SMB** (many small customers, monthly in advance, cheap capacity-bound acquisition, high
churn). Each pack's note says so on the rail.

## 9f. The Model Ledger — the auditor's table

A seventh System view, and the only surface in the product that is not a drawing. One row per
model month; ten column groups in causal order — time and the laws in force, acquisition,
customers, recurring revenue, retention, monetization, revenue and P&L, cash, derived measures,
integrity. Inside every economic block the columns run in the same order: **opening stock →
flows during the month → ending stock → derived ratios**, closed by a check.

It is deliberately not a dashboard. No colour coding of magnitude, no sparklines, no rounding to
millions: full euros with thousand separators, because an auditor adds the column up. Core shows
the economically important columns, Full everything the engine publishes for that month. The
month column and both header rows are sticky, so a column read a thousand pixels to the right
still has a name and a month.

**It is a projection, never a second model.** Every cell is a field the engine published —
`months[t]`, `derived`, `cohorts`, `acquisitionLedger` — or a measurement from `kpi.js`. The only
arithmetic the ledger performs is the bridge residuals, and that is the whole point: a residual
computed from the engine's own published figures tests the engine. A ledger that recomputed what
it reconciles would be circular and would prove nothing. Where a layer is off the engine publishes
nothing, so that block is absent rather than a column of dashes.

A check prints the residual of an identity, so **0** means it closes. The named identities:

| Block | Identity |
|---|---|
| Recurring revenue | opening + new + expansion − contraction − churn − closing = 0 |
| Customers | opening + new logos − logo churn − closing = 0 |
| Acquisition pipeline | pipeline opening + produced − landed − pipeline closing = 0 |
| Acquisition spend | pipeline spend opening + S&M − spend realised − pipeline spend closing = 0 |
| P&L | revenue − COGS − S&M − R&D − G&A − expansion cost − hypothesis cost − EBITA = 0 |
| Cash | opening + FCF − closing = 0 |
| Cash (Cash Physics on) | collections − cash costs − FCF = 0; deferred and receivables roll forward |

**A class name is part of the global namespace.** The ledger shipped twice completely unreadable
because its column-header row was called `ch`, which is the SVG chart class — `.ch{display:block}`
— and that took the header row out of the table's row model: the header laid itself out
independently, the body rows defined the real columns, and the month column swallowed four
thousand pixels of slack, pushing every number off screen. Surfaces added to this single file
prefix their class names (`ldg-`), and a table asserts that its header and body share one column
structure.

**Checking the DOM is not checking the rendering.** Sixteen checks compared every cell against
canonical engine state, verified every identity and proved the identities could fail — against a
table no browser could display. A check named VISIBLE passed because it measured the width of the
one cell that was four thousand pixels wide. Geometry is the thing to assert: where the browser
put the marks, not what the markup says.

Tolerance is relative to the magnitudes reconciled — a residual of a few cents against a hundred
million euros is double-precision noise, not a broken model. `ledger-accept.js` proves the checks
can fail: it corrupts one published figure in the page's own run and requires the identities that
read it to break and the row to be flagged.

**A multidimensional law is never collapsed into a scalar.** Where persistence and expansion are
set per cohort age band, the ledger prints one column per band per law — it does not print the
flat base assumption, which in an age-banded world is a rate in force nowhere.

**Conventions the reader cannot infer are stated on the surface.** Revenue is the midpoint of the
month — the average of the opening and closing recurring-revenue balances — so a cohort born this
month earns half a month; the identity is named in the check column and in the bar, in whichever
basis is displayed. And where the acquisition pipeline opens warm, the euros that bought it were
spent before month 1: the ledger carries that figure, because it is what explains cohort
acquisition cost falling short of the S&M expensed inside the window.

**A column name is the concept it carries.** `cohortCount` is cohorts created to date, not
cohorts still carrying revenue, and the column says so.

**Timing is explicit**, which is what the ledger is for: acquisition separates *produced* (what
this month's spend bought) from *landed* (what arrived in the stock this month), with the pending
pipeline between them and the spend month each landing came from. Under a lag those are different
months' euros. A cold pipeline reads off the table directly — the first L months produce and land
nothing while the pipeline fills; a warm start shows its landings stamped with spend months at or
before zero.

### A second scale is honest only when it is printed

Encoding stocks and flows on one linear axis is not the honest choice when they differ by orders
of magnitude — it is the choice that hides the flows. Two scales are honest when the page *says*
there are two and *says what the exchange rate is*, every bar carries its figure, and relative
magnitude stays exact inside each scale. What is never acceptable is a silent second scale, a
non-zero flow drawn as nothing, or a scale recomputed per month so that growth looks like
stillness.

### An absence is a claim, so draw it

Where the model says a thing does not happen — contraction moves no logo — the page draws the
empty cell rather than omitting it. An omission reads as an oversight; a drawn absence reads as a
finding. The same rule already governed the ontology's missing feedback links.

## 10. What is never done

No dual axes. No colour as the only encoding. No number on every point. No decorative gradient
or icon. No traffic-light scoring. No measured KPI on a slider. No law drawn as a readout. No
stock drawn as a delta.
