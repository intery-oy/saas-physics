# Flow — stock and flow

> **Flow creates stock. Stock determines future flow.**

**Status.** The Pulse (monthly bridge choreography) is a **failed prototype**, kept in the product
under *Flow → Bridge* and unchanged. Flow's primary view is now a **stock-and-flow diagram**. This
document records both: the redesign first, then the original study and why it failed.

---

## The visibility bug, fixed first

The Flow stage was drawn at hard-coded pixel offsets needing **1202px** of width. Measured:

| Viewport | Canvas | Result |
|---|---|---|
| 1280 × 800 | 960 × 618 | **clipped by 242px** |
| 1440 × 900 | 1120 × 750 | **clipped by 82px** |
| 1600 × 960 | 1280 × 810 | fits |

Everything now draws into a fixed design space scaled uniformly into whatever canvas exists, so the
whole diagram is visible at every viewport. Verified at 1280, 1440 and 1600 with all controls
on-canvas.

---

## Second defect: the transport did not drive the system view

Reported after the redesign shipped: *"when i press play nothing happens."*

Correct, and it was a leftover of the failed prototype. Two lines froze time
whenever the Flow layer was open:

```js
if(l==='flow'){ playing=false; ... }              // setLayer
if(playing && layer==='stock'){ tau += ... }      // frame loop
```

Both were right for the Pulse, which does not live on the 60-month timeline at
all -- it steps through the nine intra-month operations of a single month with
its own stepper. They are wrong for the system view, which is a function of
month: the ARR tank fills, strata accumulate, every pipe width and every
readout is `expRes.months[m-1]`. Freezing tau threw all of that away and left a
still diagram with a dead play button.

Fixed by scoping the freeze to the sub-mode that needs it:

- entering Flow keeps the transport running; only the **bridge** sub-mode pauses it
- the frame loop advances `tau` on `layer==='stock' || (layer==='flow' && flowMode==='system')`
- switching to **bridge** hands time back to the pulse stepper and pauses the transport

Verified at 1440x900: paused -> month and pixels both still; playing -> month 00
-> 06 -> 11 with the canvas changing; bridge -> transport auto-pauses and time
frozen; back to system -> resumes. No page errors.

What running the clock shows, month 1 -> 60 at the default assumptions:

| | month 1 | month 60 |
|---|---|---|
| ARR stock | EUR 20.73m | EUR 62.93m |
| cohort vintages in the tank | 2 | 61 |
| Expansion flow | EUR 158k | EUR 492k |
| Leakage flow | EUR 175k | EUR 544k |
| Cash stock | EUR 9.41m | EUR 59.57m |
| FCF pipe | EUR 592k | EUR 2.22m, and green |

The expansion and leakage pipes widen without either valve being touched. That
is the point of the information links: the stock is setting the rate of its own
future flows, and it is only legible when the clock runs.

## Third defect: Flow DELTA was static, and sometimes lying

Reported: *"Flow delta is still static."* The transport was advancing -- the month
counter and the side panel both moved -- but the drawing barely did, and in one
case did not move at all for the whole 60 months. Five separate faults, all in
the delta branch of `drawSystem()`:

| # | Fault | Effect |
|---|---|---|
| 1 | ARR tank clamped to `max(0, delta/arrMax)` | a NEGATIVE delta drew an empty tank -- a worse experiment was indistinguishable from no change |
| 2 | `if(!isD)` drew the cohort strata | delta lost the strata entirely and became one flat block: the most alive element, switched off in the mode being complained about |
| 3 | cash scaled by `arrMax`, then halved, over a zero line taken from the ABSOLUTE cash range | a EUR 22m cash difference rendered as a sliver |
| 4 | `pipeW` floored at 3px | a delta of exactly zero looked identical to a small flow |
| 5 | no sign encoding on flows | LESS leakage than Base (good) drew the same as MORE leakage (bad) |

Fixed at each source. Delta is a signed world, so every scale is now symmetric
about zero: the ARR and cash tanks each carry a `Base = 0` line, fill upward for
positive and downward for negative, and cash has its own range because cash is
not measured in ARR. The strata stay in delta, where each stratum is that
vintage's own contribution to the difference -- so you see WHICH cohorts the
change acts on. A flow whose delta is zero draws as a dotted "no change vs Base"
trace, never as a thin pipe. Sign shows as tone plus a caption; the arrow never
reverses, because less leakage is still ARR leaving, and reversing it would
assert a flow the engine does not have.

Valves now name what actually moved: the one you changed shows `base 80.0%` in
the Base colour, every other valve is dimmed `unchanged`.

And when every ARR flow is identical to Base at every month, the view says so
instead of showing an empty diagram:

> Every ARR flow is identical to Base at every month -- this change does not
> touch ARR physics. The whole effect is downstream, in cash.

That is the margin-deterioration case, and it is a real reading of the frozen
engine: gross margin touches no ARR transition, so the ARR side is genuinely
unchanged and the entire consequence is the cash tank draining EUR 22.42m below
the Base line. The old rendering showed the same thing as a blank diagram and
said nothing.

## Fourth defect: delta with no experiment set had no empty state

Reported with a screenshot: Delta open, every reading `+EUR 0`, diagram blank.
The mode chip read `base vs experiment` and every valve read `unchanged` --
so no force had been moved and Experiment *was* Base. Every delta was correctly
zero. Three things were wrong with how that was presented:

1. **The banner misdiagnosed it.** The flat-flow message added in the previous
   fix ("this change does not touch ARR physics") fired even when there was no
   change at all, blaming the wrong thing.
2. **No empty state.** An all-zero diagram is indistinguishable from a broken
   one. Nothing said which of the two it was.
3. **No way out was visible.** `.app.flow .rail` hides the Forces rail on the
   Flow layer, so a user who reaches Delta from Flow has no visible control to
   create a difference with. The valves are the controls, but nothing said so.

Now, when Experiment equals Base, the diagram dims, all five valves are ringed,
and a callout states the arithmetic plainly -- "Delta is empty because no
experiment is set" -- with the side panel giving three concrete routes out
(move a valve, pick a preset on Stock, or switch to Absolute) and a note that a
zero delta everywhere is the correct answer for a deterministic engine, and in
fact the strongest evidence both scenarios run the same one.

The callout sits at design y 396-532, the one horizontal band clear of all five
valves (y 127-173, 195-241, 337-383, 557-603) -- a callout that covers a control
it tells you to click is not a fix.

The Experiment-equals-Base test is a direct comparison of the assumption objects
rather than `E.compare()`, which re-summarises 60 months; it runs every frame,
and the view holds 61 fps.

## The redesign — systems notation, and why it earns its place

| Element | Notation | Bound to |
|---|---|---|
| **ARR** | stock — a rectangle that accumulates, filled with the **cohort strata**, which *are* the stock | closing ARR at month *t*, level against its own 60-month range |
| **Cash** | stock | closing cash, with a zero line it can fall below |
| **New ARR · Expansion · Leakage · FCF** | flows — pipes with width ∝ € per month | engine month record |
| **S&M · CAC/New ARR · expansion · persistence · gross margin** | **valves** — the bowtie astride the pipe, which is also the control | the assumptions, set where they act |
| **Clouds** | the model boundary — where flows come from and go to | — |
| **Dashed blue arrows** | **information links: stock → valve** | the feedback |

The information links are the whole reason for the notation, and the thing the bridge could not
show. Three of the four flows are functions of the stock they act on:

```
leakage    = ARR × (1 − g)              ← the stock sets this rate
expansion  = retained ARR × e           ← the stock sets this rate
revenue    = midpoint(ARR) ÷ 12         ← the stock sets this rate
new ARR    = S&M ÷ cacPerARR            ← the only rate set from outside
```

That is `flow creates stock, stock determines future flow` as a **structure** rather than an
arithmetic claim.

### The two absences — the finding

Drawing the system honestly makes the model's boundary visible as a *shape*. Two links a real
business has, and this engine does not:

- **⊘ Cash → S&M.** S&M is exogenous. Cash can fall to €6.10m and nothing throttles spend. **The
  capital loop is drawn open because it *is* open.**
- **⊘ R&D → retention or expansion.** R&D is a pure cost that reaches no valve.

Both are marked with ⊘ on the canvas. An absent feedback is a finding, not an omission in the
drawing — and no chart or bridge can express an absence, because a chart only plots what exists.

### Scale honesty, restated

Net change in the ARR stock at month 30 is **€716k against €41.73m — 1.7%**. That ratio is why one
month of flow could never be drawn at the stock's own scale, and it is the same fact that killed the
bridge view. In this notation it stops being a problem: pipes and stocks are different *kinds* of
object, so they are allowed different scales, both declared on the canvas.

---

The engine is frozen: `engine.js`, `kpi.js` and `integrity.js` are byte-identical to v0.3 and
`node checks.js` returns 35 / 35. Every value the Pulse draws is read out of the engine's own month
record and cohort rows.

---

## B. The intra-month law — read off `engine.js`, not invented

| # | Step | Formula | Convention that matters |
|---|---|---|---|
| 1 | Opening cohort state | `openingARR = Σ cohort.live` | Every cohort alive at the start of the month |
| 2 | Retention, then leakage | `retained = opening × g` · `leakage = opening − retained` | Per cohort, on that cohort's **opening** balance, using the age band it occupies at the **start** of the month |
| 3 | Expansion | `expansion = retained × e` | **Applied to RETAINED ARR** — the post-leakage balance — not to opening. A real convention, not rounding |
| 4 | New cohort creation | `newARR = S&M ÷ cacPerARR` | Created **after** every existing cohort has aged. It neither leaks nor expands in its birth month |
| 5 | Closing ARR | `closing = Σ retained + Σ expansion + newARR` | Identical to `opening + new + expansion − leakage`. The bridge is an identity, not a check |
| 6 | Revenue | `revenue = ((openingARR + closingARR) ÷ 2) ÷ 12` | A **midpoint** convention. Revenue does not come from closing ARR alone. The new cohort contributes `(0 + newARR)/2` — half a month — in its birth month |
| 7 | Gross-margin split | `COGS = revenue × (1 − GM)` · `GP = revenue × GM` | One uniform margin across every cohort |
| 8 | Operating absorption | `EBITA = GP − S&M − R&D − G&A` | S&M is a current-period expense **and** the thing that created this month's cohort |
| 9 | FCF and cash | `FCF = EBITA` · `closing cash = opening cash + FCF` | Frozen simplification: no working capital, deferred revenue, tax or capex |

The Pulse walks these nine steps in this order, with the formula and the caveat on the transport
bar at every step. §3 said the pulse turns implementation conventions into visible accounting
claims — steps 3 and 6 are exactly that, and both are stated on the canvas itself.

---

## C. Absolute Pulse — month 24

```
opening €36.71m  + new €750k  + expansion €290k  − leakage €321k  = closing €37.43m
                                                         bridge residual −7.5 × 10⁻⁹

revenue    midpoint ARR €37.07m ÷ 12 = €3.09m          (NOT from closing ARR)
margin     €3.09m − COGS €618k = GP €2.47m             residual 0.00
operating  GP − S&M €900k − other €1.05m = FCF €521k   residual 0.00
cash       €8.67m + €521k = €9.19m                     residual 0.00
```

---

## F. Capital-loop integration — the honest same-period number

§6 asked for S&M to bend toward the deposition head rather than vanish as an expense, and to avoid
implying instantaneous recycling. Building it surfaced a claim the engine actually makes:

> S&M of **€900k** created a cohort of **€750k** of ARR. That cohort produced **€25k** of gross
> profit **in the same month** — **2.8%** of the spend — because the engine gives a birth-month
> cohort half a month of revenue. The rest arrives over the following 18 months.

So "current-period S&M does not generate same-period GP" is *nearly* true but not exactly, and the
study states the exact figure rather than rounding it to zero. The dashed S&M curve bends back to
the new cohort; the panel carries the number.

---

## D / E. Delta Pulse and the retention experiment

Persistence 90% → 96%, month 24, Base rendered as zero:

```
Δ opening +€3.63m   Δ new +€0   Δ expansion +€30k   Δ leakage −€184k   → Δ closing +€3.85m
Δ revenue +€312k    Δ GP +€249k   Δ FCF +€249k   Δ cash +€2.72m        residual 1.4 × 10⁻⁸
```

**Δ new is exactly zero** — retention touches no acquisition. The entire chain starts with €184k of
leakage that did not happen.

### §11 — Δ ARR today *is* the running sum of every monthly Δflow

Because `Δopening(t) = Δclosing(t−1)` and `Δclosing(0) = 0`:

| Month | Δ leakage avoided | Δ expansion | Monthly Δflow | Σ Δflows | Δ closing ARR | Δ GP |
|---|---|---|---|---|---|---|
| M1 | €107k | €1k | €108k | €108k | **€108k** | €4k |
| M6 | €124k | €6k | €130k | €714k | **€714k** | €43k |
| M12 | €145k | €13k | €158k | €1.59m | **€1.59m** | €101k |
| M24 | €184k | €30k | €214k | €3.85m | **€3.85m** | €249k |
| M60 | €283k | €118k | €401k | €14.95m | **€14.95m** | €983k |

Max identity residual over 60 months: **€4.3 × 10⁻⁸**.

That column pair is the governing sentence made arithmetic. A €108k first month becomes €14.95m of
stock and €983k a month of gross profit, with no change to acquisition at all — and the monthly
Δflow itself grows from €108k to €401k, because the extra stock generates its own extra flows.

### §12 — illustrative exponent calibration

`0.98⁶⁰ = 29.8%` versus `0.99⁶⁰ = 54.7%` — a **1.84×** gap from one point of monthly survival.
Labelled illustrative on screen and kept separate from the engine scenario.

---

## G. Reconciliation evidence — all 60 months, both lenses

| Bridge | Max residual |
|---|---|
| ARR bridge, absolute | €2.24 × 10⁻⁸ |
| GP → FCF | €0.00 |
| Cash roll-forward | €0.00 |
| ARR bridge, delta | €5.59 × 10⁻⁸ |
| Δ-stock accumulator identity | €4.28 × 10⁻⁸ |

Also asserted per month: the sum of per-cohort openings, closings, leakage and expansion equals the
aggregate, so the bands really are the sums of the cohort movements above them.

---

## §13 Flow width law — three declared scales

Thickness carries quantity; motion only shows order. Magnitude is never encoded in speed, particle
density, brightness or animation frequency.

Stock (€ of ARR), ARR movement (€ of monthly ARR change) and P&L (€ per month) are three different
units and get three scales, each **printed on the canvas in px per €m**. They cannot honestly share
one: at month 24 the month's largest ARR movement is €750k against a €36.7m stock — **2%**.

---

## H. Comprehension assessment (§19), pre-registered before polish

| Test | Verdict |
|---|---|
| **A. Reconstruct closing ARR and state the order** | **Strong.** The order *is* the interaction — you step through it, and each step names its own formula. The bridge and its residual are on screen at step E |
| **B. What base does expansion apply to?** | **Strong.** The most likely thing to get wrong, and the study says it twice: the band note reads "on RETAINED, not opening", and the step formula reads `expansion = retained × e` |
| **C. Predict the ordinal size of leakage, expansion, new ARR** | **Strong.** All three bands share one declared ARR-movement scale, so ordinality is directly readable (€321k / €290k / €750k at month 24) |
| **D. Why does €1 less leakage affect more than this month?** | **Strong — the best result here.** Delta Pulse plus the accumulator make it arithmetic: this month's Δflow, Σ Δflows to date, and Δ closing ARR are the same number, with the residual shown |
| **E. Anticipate the retention exponent** | **Adequate.** The illustrative panel plus the €108k → €14.95m accumulator support it, but it is told rather than discovered |

---

## §20 Failure criteria — checked

| Criterion | Status |
|---|---|
| Treated as a cutscene and skipped | **Mitigated.** Step-driven by default with ◀ ▶; auto-play is opt-in; every state is static. Not testable without users |
| Monthly order unclear | **Passed.** The order is the interaction |
| Users infer same-period S&M → GP | **Actively counteracted.** The exact same-period figure (2.8%) is stated rather than claimed to be zero |
| Aggregate bands disconnect from cohort transformations | **Partially failed — the weakest link.** See below |
| Animation makes reconciliation harder | **Passed.** Residuals are displayed at every step |
| Delta Pulse needs dishonest scaling | **Passed.** Three scales, all printed numerically |
| Choreography dominates the work | **Passed.** Nine static states, no easing work |

---

## I. Visual limitations — documented, not fixed

1. **Cohort anchoring is weak in Absolute Pulse, and it is structural.** Each cohort's leakage and
   expansion are marked in place inside the opening column, at the true stock scale — which makes
   them roughly **0.9% of a stratum**, effectively hairlines. The aggregate bands are honest sums,
   but the eye cannot follow a euro from a stratum into a band. Fixing it would need either a
   magnified per-cohort strip or dishonest scaling. **This is the finding: in absolute terms, one
   month of flow is about 1–2% of the stock, so no honest scale can show both at once. Delta Pulse
   escapes it because the delta *is* the flow.**
2. **No ribbons from strata to bands.** With 25–61 cohorts, individual connectors would be noise.
3. **Step A shows the opening column without motion**, so "flow arriving" is inferred from the band
   appearing, not seen entering. Deliberate, per the choreography budget.
4. **Delta Pulse cannot show per-cohort deltas legibly** for the same reason as §1.
5. **The Stock layer has no Delta comparator** — Delta is Flow-only. The Stock wedge remains
   numeric in the causal panel.
6. **`FCF = EBITA`**, one uniform gross margin, no expansion CAC, no tenure-dependent retention.
   All frozen; all disclosed on the canvas.

---

## J. Recommendation — revised

# REJECT PULSE · KEEP FLOW

The Pulse is a **failed prototype**, kept for reference and labelled as such in the product.

**Why it failed.** §4 required leakage to appear first as thinning in the cohorts that lost it, and
only then collect into aggregate bands. At an honest scale those per-cohort movements are ~0.9% of
a stratum — hairlines. What shipped was the generic box-and-band diagram §4 forbade. Underneath
that: it **redrew an accounting identity**, and a bridge is already the optimal expression of a
bridge. The step counter added nothing the numbers did not carry.

**What survived, and where it went.** The intra-month law (expansion on *retained*, revenue at the
*midpoint*, half-month birth cohort, 2.8% same-period return on S&M) and the Δ-accumulator identity
were the study's real output. Both are text, both still verified by `pulse-study.js`, and both
remain in the product's panels.

**What replaced it.** The stock-and-flow view, which shows the one thing the numbers cannot: which
rates are functions of which stocks, and which links do not exist.

### The generalisable rule

Across this whole project, visualisation earned its place exactly three times — the **cohort
strata** (composition and provenance over time), the **capital recovery track** (a ratio turned into
a perceptible distance), and now the **stock-and-flow structure** (feedback topology, including its
absences). Each converts a quantity into a percept the number does not carry. The Pulse did not: it
re-drew arithmetic that was already readable.

---

## Original study — the failed prototype

Everything below documents the Pulse as built. It is retained because the intra-month law and the
reconciliation evidence remain correct and useful.

## Superseded recommendation

# KEEP PULSE

Specifically: **keep Delta Pulse as the primary lens and Absolute Pulse as the orientation lens.**

Delta Pulse is the stronger of the two and answers the governing question directly. The
Δ-stock accumulator — this month's Δflow, Σ Δflows to date, Δ closing ARR, and a residual proving
they are the same number — is the single most valuable element built in this study, because it
makes `flow → stock → future flow` an identity rather than an assertion.

Absolute Pulse earns its place for one specific job: **declaring the intra-month law.** Expansion on
retained ARR, revenue from the midpoint, the new cohort created last and receiving half a month —
three conventions that are invisible in any results view and that materially change what the numbers
mean. It should be treated as the thing a user runs once to learn the engine, not the thing they
return to.

The honest caveat is §I1: absolute cohort anchoring cannot work at an honest scale, and no amount of
design effort will change that. Do not spend more choreography budget trying.
