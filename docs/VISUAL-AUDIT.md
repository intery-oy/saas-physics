# Visual audit — the v2 product as it stood at `da4b1c7`

Captured with Playwright at 1440×900, 1024×768 and 420×860 with the "+ Hypothesis" pack (every
layer on), month 36 / month 20. Surfaces audited: Company (rail · stage · side), Scenarios
(Compare), System (company map and the four sub-views), Inspect (the pinned-cohort dossier).
Each finding names the defect and the design consequence the Legibility programme takes.

## 1. The side panel is a wall of equal-weight cards

Eleven `sgrp` blocks of the same size, same eyebrow, same row style, in the order the gates
were built: *Where the company is · How it is moving · Installed-base net · What it is made of
· Customers beneath · Where the MRR comes from · Cash beneath EBITA · Hypotheses · Emergent
KPIs · Installed-base evolution R12M · causal slot · dossier*. The only hierarchy is one large
ARR number. A reader cannot tell which block answers "what company is this" and which is a
diagnostic. **Consequence:** rebuild as five lenses with a real hierarchy — one hero, one
sentence-worth of descriptors, then the lenses in causal order, each with one figure.

## 2. The same quantity appears in several places with different names

- EBITA: "EBITA · this month" (Company block), "= EBITA" (waterfall), "EBITA → cash FCF"
  (cash block), "EBITA · unchanged" (cash sub-view).
- Leakage: "− Leakage" (bridge), "Leakage from lost logos / contraction" (customers), "− Lost
  logos / − Contraction" (R12M), "leakage from lost logos" (customers sub-view).
- ARPA: "ARPA (MRR per customer)" with `€2k` (the coarse formatter hides the value); "per
  customer €22k/yr" elsewhere. **Consequence:** one name per quantity, one place per lens; ARPA
  shown to the euro on an annual basis.

## 3. Composition and movement are conflated

"Where the MRR comes from" lists fixed and variable ARR (composition) next to price / usage /
adoption / contraction this month (movement) in one list. The R12M block mixes a decomposition
of NRR with the leakage split. **Consequence:** two separate figures — a composition bar and a
movement ladder — never one list.

## 4. Laws and measurements are visually alike

In the rail, "Persistence coefficient 90.0%" (a law) and "→ measured GRR (R12M): 91.6%" (an
observation) differ only by a dashed rule and a blue number. In the side panel, "Persistence
in force" (law) sits between "Customers lost" (flow) and "R12M logo retention" (measurement)
with the same row style. The derived/emergent persistence is a text substitution, not a
different kind of object. **Consequence:** the grammar gives laws, measurements and derived
quantities distinct marks (see VISUAL-GRAMMAR).

## 5. Time basis is implicit

Rows mix point-in-time ("this month"), trailing twelve ("R12M"), cumulative ("Cumulative …")
and horizon ("at M60") with the basis in the label text or absent ("Cash", "Customers").
**Consequence:** every lens carries a basis tag; every figure names its basis once, not per row.

## 6. Stocks and flows share one visual form

The ARR bridge draws opening, flows and closing as the same 7px bars; the waterfall draws the
running balance and the deductions the same way; the customers block has no figure at all.
**Consequence:** stocks are containers, flows are deltas between them, on every surface.

## 7. The growth engine has no representation

CAC coefficient, average CAC and marginal CAC exist only as rows under "Emergent KPIs" and
only when capacity is on; the acquisition lag is a row; new-vs-expansion growth is not shown
anywhere as a split. **Consequence:** a Growth Engine lens with the chain S&M → coefficient →
capacity → committed → lag → cohort, the three CACs as three objects, and growth split by
source.

## 8. Compare is a list of deltas

The Consequence block prints "M60 MRR +€281k, Cumulative gross profit +€8.88m, …" without
saying what mechanism moved. The changed assumption is named in the rail, not in the panel;
the match blocks (Scenarios 6, 7, 10, 12, 13) are good but each is bespoke. **Consequence:** a
three-layer causal panel — changed → mechanisms → company — with the assumption grouped by
layer and the mechanism rows chosen by the layers touched.

## 9. The System map is a stock-and-flow drawing with layers bolted on

The company view is the v1 stock/flow diagram; the customer valves, monetization box, cash
boxes and hypothesis ring were added where space allowed. It reads as an engineering
schematic: pipes, bowties, dashed information links, ⊘ marks. The layer sub-views are
disconnected canvases with no path back except the button row. **Consequence:** an ontology
map as the top view (capital → acquisition → customers → monetization → ARR → P&L → billing →
cash) with laws attached, measurements downstream and interventions outside; the layer views
become drill-downs with a breadcrumb.

## 10. Inspect exposes internals in dossier order

The pinned cohort lists age, original ARR, cumulative expansion / leakage / GP, expansion cost,
customers, ARPA, leakage split, per customer, expansion split, headroom, invoiced, deferred,
spend month, cohort CAC, customers acquired, hypotheses at spend, then the capital track — a
flat list of every field the gates added. **Consequence:** a provenance chain (company ARR →
this cohort → its customers → their components → its billing → its cash) with one line each
and disclosure below.

## 11. Change is a settings panel

Fifty-odd controls in nine groups; every control is a slider with a value; nullable toggles,
cycle buttons and disabled rows look alike; units live in the sub-text. The layer headers help
orientation but the rail is 6,000px tall with every layer on. **Consequence:** each control
states kind (law / policy / switch), unit and direction; measured KPIs move out of the rail
into the lenses; off layers collapse to their switch.

## 12. Nothing reflows below ~1200px

The grid is fixed at 262px · 1fr · 320px; at 1024px the rail and side squeeze the stage to
~430px and the header wraps; at 420px the three columns overlap (side over stage over rail),
the waterfall text is drawn on top of the side panel, and the transport bar overflows.
**Consequence:** three breakpoints — laptop (three columns), tablet (rail as a drawer, side
below the stage), narrow (single column with lens navigation) — with the canvas surfaces
given a horizontal-scroll frame rather than shrunk.

## 13. Colour carries too many jobs

Orange is the Experiment, the ARR mass, the value of every slider, the active button, the
eyebrow of every group and the "good" cash bar; blue is Base, the information link, the
measured KPI and the hypothesis ring; slate is "structural" and rose is churn. No colour is
reserved for the customer, monetization, cash or intervention objects. **Consequence:** a
semantic system with orange kept for the Experiment and interaction only (see VISUAL-GRAMMAR
§7).

## 14. Small decorative and legacy elements

"Leakage shadow" toggle, the "Anatomy" hint, the "Method" overlay's v1 text, "base vs
experiment" chip, the pulse-law sentence, the SCALES caption in 9px mono. Each is either
stale or answers none of the four questions. **Consequence:** removed or folded into the
Method overlay.

## What is kept

The two-plane stage (ARR mass over cash), the P&L waterfall's bar grammar, the scenario cards,
the bowtie valve as the mark for a law, the `.recon` two-column proof blocks, the typography
(Archivo / JetBrains Mono / Spectral), the dark indigo surface and the orange/blue pair for
Experiment/Base.

## Status after the Legibility pass

| # | Finding | Status | Where |
|---|---|---|---|
| 1 | equal-weight cards | resolved — five lenses, one hero each, descriptors, readouts | Observe (commit 2) |
| 2 | duplicated quantities | resolved — each quantity lives in one lens; Compare states it once per level | Observe, Compare |
| 3 | composition vs movement conflated | resolved — composition bar above a movement ladder, never the same mark | Monetization lens |
| 4 | laws vs measurements alike | resolved — `⋈` / `→` / `⌈⌉` / `↯` on every surface, colour reserved | all |
| 5 | implicit time basis | resolved — basis tag on every lens, figure and provenance step; tested | all (`v2-legibility-accept` TIME, GRAMMAR) |
| 6 | stocks drawn as flows | resolved — the ladder form: stock = container bar, flow = delta with hairline; negative ranges scale with a zero line | Customers, Monetization, Economics & cash |
| 7 | no growth-engine representation | resolved — acquisition chain, three CACs as three objects, growth by source, response curve | Growth engine lens |
| 8 | Compare as a delta list | resolved — causal spine, three levels, grouped by layer; "same output, different system" | Compare (commit 3) |
| 9 | System as a schematic | resolved — economic ontology first, layers by drill-down, breadcrumb back | System (commit 4) |
| 10 | Inspect as a field dump | resolved — provenance chain from company ARR to cash, off-layer steps stated | Inspect (commit 5) |
| 11 | Change as a settings panel | resolved — kinds, units, direction; measurements beneath laws; grouped summary | Change (commit 5) |
| 12 | nothing reflows below ~1200px | resolved — drawer ≤ 1180, one column ≤ 760, ontology in a scroll frame; tested at five widths | shell (commit 6) |
| 13 | colour overloaded | resolved — one meaning per token (`docs/VISUAL-GRAMMAR.md` §6) | all |
| 14 | legacy chrome | largely resolved — the leakage-shadow toggle and Method key remain in the header (kept on purpose: both are product functions) | header |
