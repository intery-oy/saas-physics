# Visual Prototype 1 — the living system

The economic engine is frozen. `engine.js` and `kpi.js` are inlined **verbatim** into this
prototype and were not touched: `node checks.js` still returns 35 / 35. Everything below is a way
of *looking at* the v0.3 engine, not a change to it.

---

## B. The visual model — what each property means

Every visual property is bound to a number the simulation computes. Nothing moves decoratively.

### The mass — above the line

| Property | Bound to |
|---|---|
| **Height** | ARR at that month |
| **Strata** | Cohorts. The opening base is the bottom layer; each month deposits a new layer on top, so **vertical position is age** |
| **Colour** | Acquisition month, on the validated ordinal ramp: oldest darkest → newest lightest. A vintage stays traceable for its whole life |
| **Brightness** | **Gross margin.** Same mass, dimmer = the same recurring revenue carrying less economic content |
| **Bright top edge on a band** | That cohort is in its first two months — new business entering |
| **Silhouette line** | The realised ARR path |

### Below the line

| Property | Bound to |
|---|---|
| **The shadow** | Cumulative leakage — every euro the installed base has lost and had to replace. It only ever deepens. Calm slate, never red: leakage is physics, not an alarm |
| **The keel** | Cash. Above the seam is cash generated, below it is cash consumed |

### Time and the two futures

| Property | Bound to |
|---|---|
| **Left of the playhead** | Realised: solid, filled, already true |
| **Right of the playhead** | Projected: a gradient body with vintage banding but no fill weight, because it has not happened |
| **Solid warm** | Experiment — the scenario you steer |
| **Dashed cool** | Base — the frozen reference. When assumptions match, the dashed line lies exactly on the mass silhouette |

The one number with no visual channel is deliberate: forward GP density, valuation and anything
resembling ARR quality are absent. This prototype adds no economics.

---

## C. Interaction guide

**Run time.** The simulation autoplays from month 0. ▶/❚❚ plays and pauses, ⏮ returns to month 0,
the scrubber jumps anywhere in the 60 months, and 0.5× / 1× / 2× / 4× set the rate (≈2.2 simulated
months per second at 1×).

**Modify an assumption.** Drag any force in the left rail. The whole future recalculates
immediately and the mass separates from the dashed Base line. Each force shows its Base value
underneath, and its value turns warm when it differs from Base.

**Compare Base and Experiment.** Base is the dashed cool line running the full timeline in all
three registers. It never changes. The right column always reports the Experiment, with the delta
against Base beside the headline ARR and a causal panel listing six downstream consequences
computed from the actual simulation.

**Pause and inspect.** Pause anywhere. The right column then describes that instant: current
state, the ARR movement bridge (opening + new + expansion − leakage = closing), portfolio
composition, and the emergent KPIs — with the reminder that they are measurements of the system,
not inputs to it.

**Inspect a cohort.** Hover the mass anywhere — past or present — to trace a vintage. Click to pin
its dossier: acquisition month, age, original ARR, current ARR and share of original, cumulative
expansion, cumulative leakage, cumulative gross profit, and acquisition cost. Click again to
release. **Anatomy** separates the strata so the layers are unmistakable.

---

## D. The four preset experiments

| Preset | Change | What it teaches |
|---|---|---|
| **Better retention** | Persistence 90% → 96% | Less of the installed base has to be replaced. Y5 ARR €62.93m → €77.87m, cumulative leakage €21.65m → €9.61m, ending cash €59.57m → €83.50m — with **zero** extra S&M |
| **Better acquisition efficiency** | CAC/New ARR 1.20× → 0.80× | The same commercial investment creates more recurring state. Y5 ARR → €84.88m on unchanged spend |
| **Growth through spend** | S&M €900k → €1.35m | A similar ARR trajectory, bought with more capital. Same €84.88m, but cumulative S&M €54m → €81m |
| **Margin deterioration** | GM 80% → 65% | The mass stays exactly the same size and dims. Y5 ARR unchanged at €62.93m, cumulative gross profit €166.57m → €135.34m, Y5 FCF €23.58m → €14.77m |

### The signature comparison — Efficiency vs Spend

A dedicated mode puts the two growth routes against each other: **Base becomes the efficiency
route, Experiment becomes the spend route**, calibrated to identical New ARR of €1.125m/month.
The mass and its dashed ghost lie exactly on top of each other for all 60 months — the commercial
state is the same company. The keel does not: **cumulative S&M €54.00m vs €81.00m, ending cash
€103.85m vs €76.85m.**

One picture, two registers, one lesson: *ARR does not tell you what the growth cost.*

---

## E. Design rationale

**Why strata rather than a blob, a swarm or an orbit.** The brief allowed rings, particles, orbital
shells. Strata won because they carry four meanings at once with no extra apparatus: vertical
position *is* age, thickness *is* that vintage's current ARR, the stack *is* the portfolio, and a
new layer arriving on top *is* new business. Particles would have needed motion that isn't in the
data; rings would have made age circular when it is monotone. Sediment is the honest metaphor for
a business that accretes vintages it can never un-acquire.

**Why one time axis and three registers.** Splitting into separate charts would have made this a
dashboard. Sharing one x-axis, one playhead and one past/future treatment makes the three registers
read as cross-sections of a single object: what you have, what you lost, what you kept.

**Why the future is drawn but not filled.** A projected future rendered with the same weight as
realised history would assert that it has happened. Gradient plus vintage banding gives it enough
presence to be read as a body, while the missing fill says *not yet*.

**Why brightness is gross margin.** §15 asked for a secondary property tied to a real metric, and
warned against calling it quality. Gross margin is the one coefficient that changes the economic
content of a euro of ARR without changing its quantity — so it is exactly the property that should
make the mass dim while staying the same size. It is labelled as gross margin, not as quality.

**Why leakage is slate, not red.** Leakage is not a failure state; it is the permanent condition of
a subscription business. Red would have made the calmest, most inevitable part of the system read
as an alarm. §19 asked for this and it was the right call.

**Typography and palette.** A transitional serif for the wordmark against a technical grotesque and
a monospace for every number — a scientific instrument rather than a BI product. The Base/Experiment
pair and the six-step vintage ramp are the palettes validated in earlier iterations, re-checked
against this darker ground: ΔE 23.0 under protanopia, ordinal monotone with every step clearing
the surface.

---

## F. What became clearer through visualisation

**1. The opening base is far more of the company than the growth story suggests.** At month 42 the
original €20m cohort is still €19.31m of €50.27m — **38% of ARR after three and a half years of
aggressive acquisition.** That number was always in the engine; watching the dark bottom stratum
refuse to shrink makes it impossible to ignore. Most SaaS narratives are about the top few
millimetres of the mass.

**2. Retention improvements are visible as a shallower shadow before they are visible as a taller
mass.** Running the retention preset, the first thing that changes is the leakage register — the
shadow stops deepening at the old rate — and the ARR gap only becomes obvious a year later. Cause
is visible before effect, which is exactly the intuition a CFO needs and exactly what a KPI table
cannot show.

**3. The efficiency-vs-spend result is far more forceful as a picture than as a table.** Two
identical masses with two visibly different keels lands in about one second. The same finding took
a paragraph of numbers in Prototype 0.2.

**4. Margin deterioration genuinely looks like what it is.** The mass dims and does not shrink. It
makes the ARR-quantity-versus-economic-content distinction obvious without inventing a score for
it — which was the point of §15.

**5. Cohort count is itself a shape.** Watching 61 strata accumulate makes the company visibly
*more granular* over time. Early on it is one block plus a few slivers; by year five it is a
laminate. The concentration risk of a young company is legible in the geometry.

---

## G. What remains visually unresolved

**The engine's most interesting v0.3 finding has no picture.** The state sufficiency result —
two portfolios with the same ARR and same KPIs but 26.5% different forward economic content — is
about **cohort age composition**, and the mass currently encodes age as vertical position within
*one* company. There is no visual for comparing two age *distributions*. Fixing this needs a
visual idea, not new economics.

**Expansion and leakage are visible only in aggregate.** Expansion shows as a band thickening and
leakage as the shadow deepening, but you cannot see *which* stratum expanded or leaked without
opening its dossier. The per-cohort flows exist in the engine and have no channel in the picture.

**Forward GP density is computed by `kpi.js` and deliberately not drawn.** It is the natural
candidate for a second visual property of the mass, and drawing it would have meant deciding what
"economic content" looks like before the project has decided what it is.

**The R12M measurement cohort is invisible.** v0.2.1's whole point is that reported KPIs are taken
over a frozen 12-month window that excludes recent ARR. The right column reports GRR and NRR as
numbers, but nothing in the mass shows *which slice of it the KPI is measuring*. A translucent
measurement window sliding along behind the playhead would make the two-layer architecture visible
— probably the single highest-value visual addition left.

**Time is uniform.** Every month gets equal horizontal space, so the compounding that makes late
years economically dominant is flattened. Nothing is wrong; it just does not feel like compounding.

None of these should be solved by adding economics.

---

## Recommended next visual step — recommend only

**Draw the measurement window.** A translucent 12-month band trailing the playhead, dimming the
ARR the R12M KPI cannot see, with the reported GRR / NRR attached to it. It makes the reality /
measurement split — the hardest idea in the project — visible in one gesture, needs no new physics,
and sets up the state-sufficiency comparison that currently has no picture at all.
