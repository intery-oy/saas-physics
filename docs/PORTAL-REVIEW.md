# Portal review — every page, its purpose, its quality, and what the structure should be

A page-by-page review of the shipped product at build `67de06f`, made by rendering every
surface at 1440×900 and reading the images, then verifying each suspected defect against the
source rather than against the impression. Claims below are marked **verified in code** where
the screenshot alone would not be evidence.

---

## 0. What the project is for

SaaS Physics is a **deterministic economic engine with a reading surface attached**. The claim
it makes, on the opening page and in Method, is unusual and worth restating because it is the
only standard the product should be judged against:

> Nothing is entered as an output. Growth, retention ratios, margins and cash are *consequences*
> of the laws you set, and every figure on screen can be traced back to them.

So the product is not a dashboard, a forecast tool, or a spreadsheet replacement. It is an
instrument for a specific intellectual operation: **set a law → watch a company emerge → read
back why**. Three commitments follow, and they are the right ones:

- **The engine is frozen and checksummed** (`docs/BASELINE-v2.md`). The UI is a projection of it.
- **Layers are nullable.** Each of Customer, Monetization, Cash and Hypothesis physics can be
  switched off and reproduces the world beneath it exactly. That is what makes the model
  teachable rather than merely configurable.
- **A KPI is a measurement, never an input.** No slider sets NRR. This is the project's single
  best idea and the whole surface is organised around it.

The product currently has **20 distinct views** across 6 top-level entry points. That number is
the root of most of what follows.

---

## 1. The surfaces, one at a time

### 1.1 Welcome / Guide — the gate

**Purpose.** Establish the frame before any number is seen: what this is, what it is not, how to
read the marks, what the time bases mean, three ways in.

**Content.** Two framing paragraphs, Enter / six-step tour, a six-item portal map, a marks
legend (⋈ law, ⌈⌉ constraint, → measurement, ↯ hypothesis, ┄ off), a time-basis note, a basis
note, and three "ways to start" cards.

**Quality — high.** This is the best-written text in the product. "What it is not" doing real
work in the second paragraph is exactly right, and the marks legend up front is what makes the
rest of the product legible at all. The tone is confident without overclaiming.

**Improvements.**
1. **It is cut off and does not say so.** At 1440×900 the pane is 1139px tall in a 900px box
   (*verified by measurement*): the three "ways to start" cards are sliced mid-sentence. The
   container is `overflow-y:auto` with no scroll affordance, no fade, no chevron. A first-time
   visitor on a laptop sees a truncated card and no signal that there is more.
2. The marks legend is the most valuable block and is in the **right-hand column, below the
   fold's centre of gravity**. It should sit beside the Enter button.
3. Six portal items + five marks + four time bases + three start cards = **18 things to absorb
   before entering**. Cut to: what it is / what it is not / the five marks / Enter.

### 1.2 Company — the hero and five lenses

**Purpose.** "What kind of company did these assumptions create?" — one company at a time, a
hero line, then five lenses onto the same run.

**Content.** Hero (MRR, y/y, NDR, gross margin, EBITA margin, cash) + a layer chip row + five
lens tabs (Company · Customers · Growth engine · Monetization · Economics & cash), each with
its own question, its own KPI row, sometimes inline levers, and one or two 60-month charts.

**Quality — good, with one structural flaw.** The chart grammar is consistent and disciplined:
one time axis, right-edge value labels in non-overlapping blocks, a month cursor, a restrained
palette, no dual axes except where explicitly labelled "right scale". The five questions are
well chosen and genuinely different from each other.

**Improvements.**
1. **The hero repeats in full on all five lenses and is then immediately restated.** On
   Customers the hero says `€2.63m MRR +21.5% y/y`; 150px below, the lens KPI row says
   `€2.63m MRR +21.5% y/y` again. That is ~230px of vertical space — a quarter of the viewport —
   spent on a duplicate before any lens content appears. The hero should collapse to a single
   line on non-Company lenses.
2. **A clipped label.** The Customers chart's right-edge readout renders `MRR / CUSTOME` — the
   label is truncated mid-word by the right margin.
3. **Levers appear on two lenses and not the other three.** Growth engine and Monetization carry
   inline sliders; Customers, Company and Economics & cash do not, with no stated reason.
4. **Every second chart is below the fold** on a 900px viewport, on every lens.
5. `WHERE DID MRR GROWTH COME FROM? · CUMULATIVE SINCE M0` wraps mid-phrase and collides with
   its own legend.
6. The layer chip row `MODEL · ARR · CUSTOMERS · MONETIZATION · CASH` renders all five at
   near-identical weight, so it does not actually communicate which layers are on.

### 1.3 Compare — the causal argument

**Purpose.** "Why does the Experiment differ from Base?"

**Content.** Three ordered blocks — **what you changed → what the system did → what company
emerged** — plus a secondary-effects disclosure, model boundaries, and the two-run chart.

**Quality — the strongest surface in the product.** The three-block causal chain is the single
best design decision here. It refuses the dashboard instinct to show *differences* and instead
shows an *argument*. The `€28k → €55k +€27k` triplet form is excellent. The empty state
("Experiment equals Base… Open Change, move one law") is honest and actionable.

**Improvements.**
1. **A verified rendering defect in the chart.** `MODEL CASH (€M)` is drawn at `cashTop − 8` and
   the `CASH … ΔCash … month 36` readout at `cashTop + 2` — 10px apart in a 9.5px font
   (*verified in code, v1.template.html:2125 and :2176*). They overlap, and the cash plane's
   three y-labels stack inside ~40px. The ARR mass and the cash plane collide at the seam.
2. **The chart is almost entirely below the fold** once an experiment exists; the causal blocks
   alone fill the viewport.
3. **Severity is not encoded.** `Average CAC +0.78×` and `ending cash −€23.83m` are the same
   amber. Bankrupting the company and a mild CAC rise read identically. The project's "no
   traffic lights" rule is right, but *sign* and *materiality* are different things — a result
   that crosses zero deserves a mark that a percentage change does not.
4. The right ~32% of the viewport is empty (see §3).

### 1.4 System — seven sub-views

This is where the product is most uneven. The seven sub-views were built at different times and
have not converged on one grammar.

#### Ontology — **excellent**
The horizontal spine (capital → acquisition → customers → monetization → ARR → P&L → billing →
cash) with ⋈ laws above, ⌈⌉ constraints beside, → measurements beneath and ↯ hypotheses from
outside is the clearest statement of the model anywhere in the product. It is the reference
grammar the rest should obey.
*Defects:* ~40% vertical dead space (a 120px band above the law row, 250px below the
measurements). **`→ ARPA €167,362` ignores the MRR/ARR basis switch** while the node directly
above it reads `€2.63m MRR` — the same quantity in two bases, 12× apart, neither tagged
(*verified in code: `eurF(mm.closingARR/mm.customers.closing)`, v1.template.html:2574*).

#### Flows — **the weakest page in the product**
The classic stock-and-flow diagram, and it is genuinely hard to read. Counted from the render,
**at least eight text/line collisions**: `⊘ cash never constrains S&M`, `the stock sets this
rate`, `⊘ R&D → retention or expansion`, `S&M is also an operating cost…`, `bounded by the usage
cap (1200 units)`, `FLOW · Leakage MRR` over `persistence · emergent (mix)`, `STOCK · CASH`, and
`FLOW · FCF` are each struck through by a dashed information link or overlapped by a box. The
MRR tank is a large mostly-empty rectangle with a thin drain stem that runs through three
labels. The dashed feedback links cross the entire canvas.
This view is trying to be a full system-dynamics diagram on one screen and the screen is not
big enough.

#### Customers — **good (rebuilt at `67de06f`)**
Two registers on one set of columns, drawn absences, declared two-scale magnification, ⋈ laws
above the flow they govern, → measurements beneath. This is the grammar the other layer views
should adopt.

#### Monetization — **needs the same rebuild**
Exactly the faults Customers just shed: a 340×145px box holding `€101k/yr` (value occupies ~8%
of its own container); all boxes the same size regardless of value, so **size encodes nothing**;
the four effect boxes uniform at €7k / €16k / €3k / €3k; laws demoted to grey caption text
(`price growth 4.0%/yr`) instead of ⋈ valves, which also means **they are not clickable
controls here**; no → measurement row; ~180px dead band at the top.

#### Cash — **needs the same rebuild**
Cleaner than Monetization but same faults: identical box sizes for €2.61m, €298k and €14.02m;
the billing policy is prose (`Policy: 12-month term, billed in advance…`) rather than ⋈ valves,
so it cannot be manipulated where it is explained; ~250px of empty canvas above the diagram;
the `EBITA · unchanged` box floats unconnected.

#### Hypotheses — **does not scale down**
With one hypothesis in force the view is **~65% empty** — the layout allocates 110px per
hypothesis and assumes several. The legend says **"Orange dot: the decision"** but the dot is
drawn `#8b8df0`, indigo (*verified in code, v1.template.html:2528 vs :2538*). The status line is
right-aligned 660px from the end of the bar it describes.

#### Model Ledger — **excellent**
60 rows × 51 (Core) or 118 (Full) columns, sticky month column and grouped headers, every cell a
projection of engine state, bridge checks that close, timing made explicit. This is the
product's proof of integrity and it works.
*Defect:* the selected month **is** marked (`tr.on`) but the table **never scrolls it into
view** (*verified: no `scrollIntoView` in `ledgerMark()`*). At month 36 the highlighted row is
below the fold and the ledger appears unlinked from the clock.

### 1.5 Scenarios — fourteen canonical experiments

**Purpose.** "What does one declared change do to the company?"

**Content.** A chip row of 14, then a 14-row table, then a per-scenario detail with **what
changed / what stayed the same / what emerged / why it matters**, two disclosures and the chart.

**Quality — good content, wasteful layout.** The "why it matters" line on each scenario is
genuinely illuminating and the detail view's four-block structure is as strong as Compare's.

**Improvements.**
1. **The chip row duplicates the table beneath it exactly** — 14 chips, then 14 rows with the
   same names, consuming the first ~200px on every visit *and on every scenario detail page*.
2. The list is pure text: no indication of each experiment's magnitude or direction. A single
   Δ-column or sparkline would make 14 scenarios scannable rather than readable.
3. On the detail view, the chart is entirely below the fold.

### 1.6 Change — the model-building drawer

**Purpose.** Pick a world, then set laws, constraints, inputs and one hypothesis.

**Quality — conceptually excellent.** Grouping by object kind (input / law / constraint /
hypothesis / measured), showing the measured KPI beneath the law that produces it
(`→ measured GRR R12M 93.5%`), and the layer-by-layer ordering are all correct and rare.

**Improvements.**
1. **Two rows are clipped at the left edge.** `LAYER · ARR PHYSICS · ALWAYS ON` renders as
   `AYER · …` and the marks legend sits flush at x=0. A missing left padding on those rows.
2. A disabled law (persistence under Monetization, expansion under Monetization) is dimmed to
   0.35 opacity but **still renders a slider with a thumb at a meaningless position**
   (*verified: `el.disabled = monOn; el.style.opacity = 0.35`*). It is correct behaviour poorly
   signalled — a law that is emergent should not show a track at all.
3. Eight world buttons in two rows (5 packs + 3 worlds) with no visual distinction between the
   two families.

### 1.7 Inspect — the provenance chain

**Purpose.** "Where did this number come from?" — trace one euro of ARR down to the cash it
recovered.

**Quality — very strong.** Numbered steps, per-step basis tags, a disclosure per step, and the
`102.9 from 120.0 at acquisition · 85.7% retained` form is exactly the right level of detail.

**Improvements.**
1. **The same basis inconsistency as Ontology, and here it is worse.** Step 2 reads
   `ARPA €15k`; step 3 reads `€180k per customer / yr`. Same customer, same month, 12× apart,
   one tagged `/yr` and one untagged, ~180px apart on screen.
2. The Company hero remains above the chain, duplicating.
3. The cohort-life figure is pushed below the fold.

### 1.8 Method

**Purpose.** What the model is, what it takes in, what it gives back, and what it does not
contain.

**Quality — the content is rigorous and honest.** "Boundaries of the current model" and
"Reality vs measurement" are the kind of thing most products omit.

**Improvements.**
1. **The overlay is translucent and the page behind bleeds through.** The Scenarios rows are
   legible *underneath* the Method text. This is the most damaging single legibility defect in
   the product.
2. **The columns are ragged.** Column 1 ends at y≈450, column 2 runs to y≈1080.
3. **It scrolls with no affordance**, like the welcome pane.
4. It is a wall of prose with no in-page navigation for what is clearly a reference document.

---

## 2. Cross-cutting defects

| # | Defect | Evidence | Severity |
|---|---|---|---|
| 1 | Per-customer money shown in ARR while the page is in MRR, untagged | Ontology `→ ARPA €167,362`; Inspect `€15k` vs `€180k/yr` | **High — it reads as a wrong number** |
| 2 | Method overlay is translucent; page behind is legible through it | render | **High** |
| 3 | Compare canvas: cash label and cash readout overlap at the plane seam | code 2125/2176 | **High** |
| 4 | Flows view: ≥8 label/line collisions | render | **High** |
| 5 | Welcome and Method scroll with no affordance; content cut mid-sentence | 1139px in 900px | Medium |
| 6 | Hero duplicated on all five lenses | render | Medium |
| 7 | Scenario chip row duplicates the scenario table | render | Medium |
| 8 | Monetization / Cash / Hypotheses System views predate the current grammar | render | Medium |
| 9 | Ledger marks the selected month but never scrolls to it | code | Medium |
| 10 | Hypotheses legend says "Orange dot"; dot is indigo | code 2528 vs 2538 | Low |
| 11 | Customers chart right-edge label clipped (`CUSTOME`) | render | Low |
| 12 | Change drawer: two rows clipped at the left edge | render | Low |
| 13 | Compare: sign and materiality share one colour | render | Design question |

---

## 3. Structural critique

### 3.1 Two incompatible layout regimes

`.stagecol{max-width:980px}` caps Company, Compare, Scenarios and Inspect. System is
full-bleed (`.app.flow .stagecol{display:contents}`) and draws into a 1260-unit canvas
(*both verified in code*). The consequence: on a 1440px viewport the text surfaces waste ~32% of
the width and the diagram surfaces use 100%. On a 1920px monitor the text surfaces waste ~49%.
Moving between Compare and System is a jarring change of page width, and neither regime is
right for the other's content.

### 3.2 The vertical budget is spent before the content

Every text surface spends its first screen on navigation and restatement: header (60px) + hero
(210px) + layer chips (30px) + lens tabs (50px) + section head (40px) ≈ **390px of a 900px
viewport, 43%, before the first lens datum**. On Scenarios it is the chip row; on Compare it is
the causal blocks. The result is that **on every single surface in the product, the chart is
below the fold.** For a product whose thesis is "watch a company form over sixty months", the
60-month figure is never the thing you see first.

### 3.3 Seven System sub-views is at least two too many

Ontology, Flows, Customers, Monetization, Cash, Hypotheses, Model Ledger. Of these:
- **Ontology and Flows are the same content twice** — one as a clean spine, one as a
  system-dynamics diagram. Flows adds feedback links and the tank metaphor; it costs eight
  collisions and a much harder read. Ontology wins on every axis.
- **Model Ledger is not a diagram at all.** It is a table living inside a tab group whose other
  six members are canvas drawings, and it needs its own CSS escape hatch (`.ledger{position:absolute;inset:0;z-index:2}`) to exist there.
- **Hypotheses is a Gantt chart of at most a few rows** and is 65% empty.

### 3.4 Three surfaces answer the same question

- **Compare**: what you changed → what the system did → what company emerged.
- **Scenario detail**: what changed → what stayed the same → what emerged → why it matters.
- **Company in Delta mode**: the experiment against the Base as a dashed overlay, plus a
  one-line summary bar.

These are three different renderings of *one* comparison. A scenario is just a pre-loaded
experiment; Delta is just Compare drawn on the chart. The user has to learn three surfaces to
perform one operation.

### 3.5 The basis switch is not honoured everywhere

MRR/ARR is a global header toggle, and most of the product honours it through `rc()`/`reur()`.
Two surfaces do not (Ontology's ARPA, Inspect's per-customer revenue). A global switch that
silently fails on two surfaces is worse than no switch, because the reader has no way to know
which figures obeyed it.

### 3.6 What is genuinely good, and should not be touched

- The engine/UI separation and the frozen checksums.
- The mark grammar (⋈ ⌈⌉ → ↯ ┄) — it is learnable in ten seconds and used consistently.
- Compare's three-block causal argument.
- The Model Ledger as an audit surface, and the fact that it is a projection with printed
  residuals.
- Inspect's provenance chain.
- The refusal to let a KPI be an input.

---

## 4. Proposed optimal structure

The reorganisation below **removes four views and merges three**, and is motivated entirely by
what the product is for: set a law → watch a company emerge → read back why.

### 4.1 Four surfaces, not six

```
  BUILD            READ                    COMPARE              AUDIT
  (the drawer)     (the company)           (one change)         (the record)
  ─────────        ─────────────           ─────────────        ──────────
  world            hero + 5 lenses         what you changed     Model Ledger
  laws             ↳ Mechanism (per lens)  what the system did  Inspect
  constraints         = today's System     what company emerged  (one cohort)
  inputs              sub-views            ↳ from Change,
  hypothesis       ↳ Inspect (a cohort)      a scenario, or
                                             a lever
```

**The single most valuable change: fold the System layer views into the lenses they belong to.**

Today a user reading the Customers lens (chart, KPIs, growth split) must leave for
System → Customers to see the mechanism (registers, laws, bridges). These are the same subject
at two altitudes, and the split is the reason System needs seven tabs. Instead:

> Each lens gets a **Reading / Mechanism** toggle. *Reading* is today's lens — 60 months, KPIs,
> charts. *Mechanism* is today's System sub-view — one month, stocks, flows, laws, measurements.
> Same question, two altitudes, one place.

That mapping is already one-to-one and exact:

| Lens | Reading (today) | Mechanism (today) |
|---|---|---|
| Company | formation chart + YoY | System → Ontology |
| Customers | base development + growth split | System → Customers ✔ already rebuilt |
| Growth engine | response curve + payback | *(new — the acquisition half of Flows)* |
| Monetization | composition over time | System → Monetization |
| Economics & cash | economics + cash | System → Cash |

**System as a top-level tab then disappears**, and with it the seven-tab group. What is left of
it:

- **Ontology** becomes the Company lens's Mechanism view — the one whole-machine picture,
  reached by the one lens that is about the whole machine.
- **Flows is retired.** Its unique content is (a) the acquisition pipeline, which belongs in
  Growth engine's Mechanism, and (b) the ⊘ absent-feedback marks, which are a *finding about the
  model* and belong in Method beside "Boundaries of the current model". Nothing else in it is
  not better said by Ontology.
- **Hypotheses** is not a view. One hypothesis is one costed, lagged, temporary object — it
  should be a **band on the time transport** (decision dot, dashed lag, solid window), visible on
  every surface, where it is actually relevant. That also fixes the 65%-empty page by deleting
  the page.
- **Model Ledger** is promoted to a peer of Inspect under **Audit**. It is a table, it is the
  integrity proof, and it should stop pretending to be a diagram tab.

### 4.2 Merge the three comparison surfaces into one

**Compare becomes the only place a comparison is read**, and it accepts an experiment from three
sources:

1. a lever you moved in Change,
2. one of the 14 canonical scenarios, selected from a picker **inside** Compare,
3. the current Delta overlay toggle on the chart.

**Scenarios stops being a top-level tab** and becomes the experiment picker within Compare —
which removes the duplicated chip row *and* the duplicated table in one move, and removes the
third rendering of the same argument. Scenario prose ("why it matters") survives as a block in
the Compare chain, where it is more useful than on a page of its own.

### 4.3 Fix the vertical budget

- **Collapse the hero to one line on every lens except Company.** Recovers ~180px.
- **Put the figure first on Company.** The product's thesis is a company forming over sixty
  months; that should be the first thing in the viewport, with the hero as its caption, not its
  preamble.
- **Make the Mechanism toggle replace the chart in place**, not stack below it.

Together these put a chart in the first screen of every surface, which is currently true of none.

### 4.4 One layout regime

Adopt a single content width — a 1260px max, matching the System canvas's own coordinate space —
for every surface. Text blocks stay in a readable measure inside it (≈70ch) but charts, tables
and diagrams get the full width. This removes the page-width jump between Compare and System and
recovers roughly a third of the horizontal space on every text surface.

### 4.5 Resulting structure

```
Header:  [ Read  |  Compare  |  Audit ]     Change ▸   Basis MRR/ARR   Method   Guide
Transport: ◀ ▶  Month 36 · year 3  ━━━━━━●━━━━━━  ↯ hypothesis band   Speed
```

- **Read** — hero, five lenses, each with Reading / Mechanism.
- **Compare** — the causal chain; experiment from a lever, a scenario, or Delta.
- **Audit** — Model Ledger and Inspect.
- **Change** — the drawer, unchanged in concept.
- **Method / Guide** — unchanged in content; fixed overlay opacity and given a contents rail.

**Net: 6 top-level entries → 3, and 20 views → 14**, with no content removed except the Flows
diagram, whose two unique claims are relocated rather than lost.

---

## 5. Recommended order of work

**Tier 1 — correctness and legibility (small, contained, no restructuring)**
1. Basis: route Ontology's ARPA and Inspect's per-customer revenue through `rc()`, and tag both.
2. Method overlay: make the backdrop opaque.
3. Compare canvas: separate the cash plane's title and readout; give the seam real clearance.
4. Ledger: `scrollIntoView({block:'nearest'})` on the marked row.
5. Clipped text: the `CUSTOME` right-edge label; the Change drawer's two left-clipped rows.
6. Hypotheses legend: say indigo, or draw it orange.
7. Scroll affordance on the welcome and Method panes.

**Tier 2 — apply the Customers grammar to the remaining layer views**
8. Monetization Mechanism, then Cash Mechanism: value-scaled marks, ⋈ valves as the controls,
   → measurements beneath, declared scaling, no oversized empty boxes.

**Tier 3 — the structural change**
9. Reading / Mechanism toggle per lens; retire System as a tab; move Ontology under Company.
10. Fold Scenarios into Compare as the experiment picker.
11. Hypotheses as a transport band.
12. One layout regime at 1260px; figure-first on Company; one-line hero on the other lenses.

Tier 1 is a day and fixes everything a reader would call a bug. Tier 3 is the one that makes the
product match its own thesis.
