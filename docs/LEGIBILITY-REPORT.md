# SaaS Physics — Economic Legibility Programme · final report

Branch `v2-economic-legibility`, seven commits above the v2 Economic System baseline
(`v2-economic-system` @ `da4b1c7`, itself above the frozen `v1.3-arr-physics` @ `44f7652`). Nothing
pushed. Sections follow the programme brief. Screenshots referenced are in `docs/screens/`.

## 1. Visual thesis

The engine already contained the economics; the product showed them as a KPI table with a diagram
bolted on. The thesis of this pass: **every kind of economic object gets one mark, and every surface
is organised around the causal structure a CFO already carries in their head** — stocks are
containers, flows are deltas from a running balance, laws are set (`⋈`), constraints bound (`⌈⌉`),
measurements are read (`→`), hypotheses enter from outside (`↯`), and what is off is drawn dotted
rather than omitted. Time basis is written on every figure. Colour has one meaning per token. The
same grammar reads on Observe, Compare, System, Inspect and Change, so a reader who has learned a
mark once can read the rest. Nothing about the economics was changed to make this easier: the
engine and the four layer modules are byte-identical to `docs/BASELINE-v2.md`.

## 2. The five-lens architecture

Observe is five lenses in causal order, each a question, a hero or a figure, descriptors, readouts,
and a boundary line when a layer is off:

| # | Lens | Question | Leads with |
|---|---|---|---|
| 1 | Company | What kind of company is this? | hero ARR/MRR, growth y/y, Δ vs Base; customers · ARPA · gross margin (`⋈`) · EBITA margin (`→`) · cash · cash trough |
| 2 | Customers | What installed base produces the revenue? | the logo ladder and the ARR ladder as twins (stock · flows · stock); logo vs gross vs net dollar retention |
| 3 | Growth engine | What actually creates growth? | the acquisition chain S&M → CAC coefficient → capacity → committed → lag → cohort; the three CACs as three objects; growth by source; the response curve with the current position |
| 4 | Monetization | What is revenue made of, and why did it change? | the composition bar (platform · usage) above the movement ladder (new · churn · contraction · price · usage · adoption) — never the same mark |
| 5 | Economics & cash | What did this system earn, and what cash did it need? | the P&L ladder, then the cash ladder from EBITA through deferred and receivables to cash FCF; cash, deferred, receivables, conversion, trough, capital drawn |

A lens navigation at the top of the panel jumps to any lens; the hero number is the only large
figure in each lens (`docs/VISUAL-GRAMMAR.md` §5, §7).

## 3. Visual grammar

`docs/VISUAL-GRAMMAR.md` is the contract: the object kinds and their marks (§1), the ladder form
(§2), composition vs movement (§3), the time-basis tags `M36` · `M36 · month` · `R12M` ·
`CUM · M1–Mn` · `M60` · `age n` (§4), the typography levels (§5), the colour table with one meaning
per token (§6), the lens skeleton (§7), the Compare spine (§8), the System ontology (§9), the
provenance chain (§9a), Change as model construction (§9b), time (§9c), breakpoints (§9d), the
acceptance worlds (§9e), and the never-do list (§10). `docs/VISUAL-AUDIT.md` records the fourteen
defects the pass started from and their status.

## 4. Observe — before / after

Before (`docs/VISUAL-AUDIT.md` §1–7): a wall of equal-weight cards, the same quantity in several
places under different names, composition and movement conflated, laws and measurements alike,
implicit time basis, stocks drawn as flows, no growth-engine representation.

After: five lenses (commit `1c2c317`). Each quantity lives in one lens. Ladders separate stock from
flow (a stock is a wide container bar, a flow a delta from the running balance with a hairline at its
edge; a ladder whose balance goes negative scales over its whole range with a zero line). Laws carry
`⋈`, measurements `→`, hypotheses `↯` — in the text, so they survive copy and screen readers. Every
figure names its basis. The growth engine is a chain plus three CAC tiles (coefficient · law,
average · at this spend, marginal · next euro) plus the response curve. The Customers lens is the
logo/ARR twin. Labels follow the MRR/ARR basis switch (`+ new MRR`, `− churned MRR`).

## 5. Compare

Before: a list of deltas. After (commits `2b427cf`, `4dfdec8`): a causal spine with three levels —
**WHAT YOU CHANGED** (assumptions grouped by the causal layer they enter at: acquisition, installed
base, customers, monetization, economics, cash, intervention; laws as `⋈`, hypotheses as
`↯ name · target × value · M6 +3 lag · 24 mo · €200k + €50k/mo`; component objects state each field
that moved) → **WHAT THE SYSTEM DID** (the mechanism rows the touched layers imply: new ARR per
month · law, coefficient / average / marginal payback, realised new ARR, first cohort and pending
under lag, customers and retention, churned ARR vs contraction, price / usage / adoption effects,
billings, deferred, receivables, cash FCF − EBITA, hypothesis window and cost) → **WHAT COMPANY
EMERGED** (ARR M60, growth y/y, NRR, customers, EBITA CUM, cash trough with its month, ending cash,
the month cash overtakes Base). One-sided layers print `—` and `new` / `off`. When M60 ARR agrees
within 0.5% and the mechanisms do not, a **Same ARR, different system** block says which quantity
separates them (Scenarios 7, 10, 13).

## 6. System

Before: a stock-and-flow schematic with layers bolted on as sub-views. After (commit `01d9d74`):
System opens on the **economic ontology** — CAPITAL · SPEND → ACQUISITION → CUSTOMERS →
MONETIZATION → ARR · REVENUE → P&L → BILLING · COLLECTION → CASH — stocks as orange-bordered
containers, mechanisms slate, switched-off layers dotted with the word *off*, laws and constraints
above the mechanism they govern, measurements beneath the object they observe, the leakage /
expansion / new loop under ARR, and MANAGEMENT HYPOTHESES in a violet box outside the system with an
arrow to the node they move (dashed when not in force). Clicking a node opens that layer's view;
every layer view, the Flows view included, carries a `‹ Ontology` breadcrumb. Node text shrinks to
fit its container. (`world-A-system.png`, `world-B-system.png`, `world-C-system.png`.)

## 7. Inspect

Before: a dossier of fields in engine order. After (commit `ab49733`): a **provenance chain** — one
euro of company ARR traced down the ontology: Company ARR (this cohort's share) → Cohort (vintage;
original → now with cumulative expansion and leakage; *bought under*: spend month, lag, acquisition
cost, realised CAC vs the coefficient, hypotheses at spend, customers stamped at spend) → Customer
economics → Monetization components → Contract · billing → Cash (capital recovery, payback). Each
step is a dot on a vertical rule with its own basis tag; a step whose layer is off is hollow and says
what the cohort is instead. The method note is disclosed behind a summary.

## 8. Change

Before: a settings panel. After (commit `ab49733`): **model construction** — every control is one
kind of object, marked before its name (`▭` input, `⋈` law, `⌈⌉` constraint, `⏻` switch, `↯`
hypothesis), with its unit and, where unambiguous, its direction (`↑ less leakage`). Measurements
read beneath the law they observe (`→ measured GRR · R12M`) and are never controls. A switched-off
control shows its switch once; a permanent programme says *permanent*. The experiment summary is
*what you changed*, grouped by causal layer in the words Compare uses. Layer tags speak the
ontology (*beneath ARR*, *beneath customers*, *beneath P&L*, *from outside*).

## 9. Acceptance worlds

Three packs of the existing laws — illustrative, never benchmarks; each pack note says so
(commit `9330ceb`):

| World | Shape | Opening book | What it exercises |
|---|---|---|---|
| A · Enterprise SaaS | 120 customers at ~€132k; €90k platform fee + metered usage; annual billing in advance, collected +2 months; 4-month sales lag; capacity €1.5m/mo; 95% logo retention, 3% contraction; 78% GM | €15.8m | lag and pending stock, capacity, deferred revenue and receivables, a platform-led mix, a shallow cash trough |
| B · Usage / AI | 2,500 customers at ~€7.8k; small platform fee, ~70% metered usage; usage +45%/yr to a cap, unit price −5%/yr, adoption 30%; monthly in arrears, +1 month; 60% GM; 85% retention, 10% contraction | €19.5m | a variable-led mix, usage-driven expansion against a cap, falling price, contraction reaching usage, a thin margin |
| C · SMB | 8,000 customers at ~€2.1k; €1,800 plan + light add-on usage; monthly in advance, on invoice; cheap capacity-bound acquisition; 78% retention, 4% contraction | €16.8m | many small logos, high churn as a treadmill, monthly billing with almost no financing effect |

Screenshots: `world-{A,B,C}-observe.png` (the page), `world-{A,B,C}-observe-growth.png` and
`-cash.png` (lenses 3–5), `world-{A,B,C}-compare.png` (one change to S&M), `world-{A,B,C}-system.png`
(the ontology). Spend in each world was calibrated so the cash trajectory is a plausible story rather
than an insolvency; nothing else was tuned, and no new mechanism was added.

## 10. Responsive behaviour

Reflow, never shrink. Above 1180px: three columns (Change rail · figure · lenses). At ≤ 1180px the
rail is a drawer (a *Change* toggle in the header, a close button, tapping the figure closes it) and
figure and lenses sit side by side. At ≤ 760px the page is one column and scrolls: header, the figure
with its waterfall, the five lenses stacked, the transport pinned; the System ontology keeps its
drawn size inside a horizontally scrolling frame. `responsive-tablet-768.png`,
`responsive-phone-390.png`, `responsive-phone-390-lenses.png`.

## 11. Visual QA

Captured and read at 1440, 1180, 1024, 768 and 390 for the ARR world, the full world and the three
acceptance worlds; System ontology, each layer view and the breadcrumb; Compare for Scenarios 10, 12,
13, 14 and one S&M change per world; Inspect with a pinned cohort in the full and ARR-only worlds; the
rail in every pack. Defects found and fixed during QA: ontology node text overflowing its container;
no breadcrumb on the Flows view; the Compare "same system" box style leaking a border onto rail
values; "off" printed twice beside a switch; a ladder with a negative opening balance throwing its
bars off the track; the response curve four pixels wider than its panel; relative customer and ARPA
changes printed in points; Compare and ladder labels saying ARR while the basis was MRR; a component
change labelled by its engine key. The skeptical-CFO read of the acceptance worlds is in §15.

## 12. Physics integrity

No engine or module change. Checksums at this commit equal `docs/BASELINE-v2.md`:

| File | sha256 |
|---|---|
| `engine.js` | `56463b6bae8bad1ce9a259f503748146e148337433dc4a16a6ee897a4899f50e` |
| `kpi.js` | `b48a4a7ec36e15f7f128f4202d727842f88d17f0645480bccb71518f8545f359` |
| `customers.js` | `6cb63cb755738e758972f3e5b502c93f0b85b9dc082f0113db9e1977c074ebdc` |
| `monetization.js` | `a2a3dbaef27561f7de336f833a556acd06aee3db91bc8921a82c7c8dbbd9ca87` |
| `cash.js` | `2e3ac7a8c497a819064b85a63dc7c9e84ef251ae917023daa3c0421df1279f03` |
| `interventions.js` | `095331919a07023346e7883779907e98df03e33f8d23b75de86d01f5b069821b` |
| `integrity.js` | `bae107a51a0d7ead6fd16254529c59a5884ba940561a8bfdcf50a667437632d5` |
| `build.js` | `7926d13f33daa6743f56a6ebcfb0b80a75af103b63a6dfe759d352e12af88fd1` |

Only `v1.template.html` (and the built `saas-physics-v1.html`) changed among product files.
`v2-checks.js` ALL-NULL-V13 still replays the complete v1.3 state to €0.00e+0 and every Node suite
passes unchanged. Two display-layer helpers were changed on the way and are recorded rather than
hidden: the attribution block is now valid whenever both sides share one opening state (a pack's
included, not only the canonical one) — the reduced form it relies on does not depend on which
shared state the sides start from; and the ladder helper scales over negative ranges. No
representation defect required a new mechanism.

## 13. Tests

| Suite | Result |
|---|---|
| `node v2-checks.js` | 104 / 104 |
| `node checks.js` | 53 / 53 |
| `node physics-checks.js` | 69 / 69 |
| `node mrr-native-checks.js` | 20 / 20 |
| `node basis-checks.js` | 12 / 12 (exempt site moved to the capital-recovery step) |
| `node clarity-checks.js` | 46 / 46 |
| `node attribution-checks.js` | 22 / 22 |
| `node research-checks.js` | 21 / 21 |
| `node v2-accept.js` (Playwright) | 46 / 46 (assertions follow the new surfaces) |
| `node physics-accept.js` (Playwright) | 24 / 24 |
| `node clarity-accept.js` (Playwright) | 15 / 15 |
| `node attribution-accept.js` (Playwright) | 14 / 14 |
| `node v2-legibility-accept.js` (Playwright, new) | 38 / 38 — lens labels and questions; basis grammar; values tied to an independent run; time context; the Compare causal hierarchy; System drill-down and breadcrumb (and an off node opening nothing); the provenance chain in the full and ARR-only worlds; the three worlds end to end; container / overlap / horizontal-scroll integrity at five widths; drawer and stacking; no page or console errors |
| `node v2-walkthrough.js` (Playwright) | 11 questions, no page errors → `docs/WALKTHROUGH-V2.md` regenerated against the lenses |

Total: 484 checks (446 at the v2 baseline + 38). `npm run all` runs the Node suites, `npm run accept`
the five Playwright suites.

## 14. Repository state

Branch `v2-economic-legibility` from `v2-economic-system` @ `da4b1c7`. Commits, in order:

| Commit | Content |
|---|---|
| `474acfc` | 1 — visual audit and visual grammar |
| `1c2c317` (+ `67201fa` tests) | 2 — Observe rebuilt around the five lenses |
| `2b427cf` (+ `4dfdec8`) | 3 — Compare as a causal comparison |
| `01d9d74` | 4 — System as economic ontology |
| `ab49733` | 5 — Inspect as a provenance chain; Change as model construction |
| `9330ceb` | 6 — acceptance worlds, responsive reflow, legibility acceptance suite |
| this commit | 7 — final visual QA, basis-aware labels, component change labels, walkthrough, docs, this report |

**Nothing has been pushed.** `origin/main` (v0.4), `v1.3-arr-physics` and `v2-economic-system` are
untouched.

## 15. The five strongest remaining weaknesses

1. **The System side panel still speaks the Flows view's language.** While the ontology is on
   screen, the side text describes bowtie valves and pipes that belong to the layer views. It is
   correct, but it is the previous surface's prose; the ontology deserves its own side text (what each
   node is, which laws attach, what is off and why).
2. **Compare is still one long spine.** For a change that touches several layers (World A with a
   capacity and a lag, or Scenario 14) the *what the system did* level runs to twenty rows. The
   hierarchy is right; the density is not yet. A collapsed-by-default row set per layer, with the
   two or three rows that moved most left open, is the next step.
3. **The acceptance worlds are plausible, not calibrated.** Their laws were chosen to exercise the
   representation and their spend was tuned only so cash tells a story. A CFO from any of the three
   segments will recognise the shape and dispute the numbers; that is the intended use, but the
   packs should not be mistaken for reference economics.
4. **Phone width is usable, not designed.** Stacking is honest and nothing overlaps, but the figure
   at 300px tall and the waterfall beneath it are a desktop composition squeezed; a phone-first
   Observe would lead with the Company lens and put the figure behind a tap.
5. **The Inspect chain has no Base counterpart.** A pinned cohort reads its provenance in the
   Experiment world only. The same chain side by side with the Base cohort of the same vintage
   (what it was bought under there, what it recovered) would make Inspect a comparison surface too.
