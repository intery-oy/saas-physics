# Lens redesign audit — the five lenses after the cognitive-load pass (`326baba`)

Read on the Enterprise SaaS acceptance world (Customer, Monetization and Cash physics on) at
month 36, then with one retention law moved. The question for every lens is the same: does it
show its economic object's STATE, the MECHANISM that moves it, and the DELTA the active
experiment caused — and can a reader watch one disturbance travel through it?

## 1 · Company — *what company did these assumptions create?*

| | |
|---|---|
| Intended question | how big, how fast, how profitable, how much cash |
| Communicates now | the hero (MRR, growth, Δ vs Base), six descriptors, the 60-month formation with the Base dashed and ΔCash shaded |
| Missing | *where* the experiment entered the model and *when* its effect began; the accumulated gap at the selected month is only in the hero, not on the figure |
| Duplicated | nothing material |
| Text that should be visual | the "vs Base" number is text only; the figure draws the divergence but never names it |
| Experiment information that disappears | the changed assumption itself: the hero says "+€80k vs Base", nothing says "retention 90% → 96%" |
| Dominant visual object | the formation trajectory: Experiment mass, Base dashed, one change marker at the month the effect begins, one bracket at the selected month |

## 2 · Customers — *what is happening to the installed base and to economics per customer?*

| | |
|---|---|
| Intended question | how many customers, how much each is worth, are they leaving or shrinking |
| Communicates now | a logo ladder and an ARR ladder for one month, four readouts, an installed-base-net sentence; with the layer off, an ARR ladder under the heading "Customers" |
| Missing | the multiplication CUSTOMERS × ECONOMICS PER CUSTOMER = ARR as an object; the growth decomposition customers × ARPA; any Base comparison; a clear name for the off state |
| Duplicated | the ARR ladder repeats Monetization's movement; the net sentence repeats the ladder |
| Text that should be visual | "customers stay more than dollars do: … contraction inside surviving accounts" — that is a bridge, not a sentence |
| Experiment information that disappears | all of it: a retention change shows nothing here except a different number |
| Dominant visual object | the identity `customers × ARPA = ARR`, two bridges side by side (who left · who stayed but shrank · who expanded), the decomposition `customers +x% × ARPA +y% = ARR +z%`; when the layer is off, a visibly reduced INSTALLED BASE object |

## 3 · Growth engine — *how is capital becoming new recurring revenue?*

| | |
|---|---|
| Intended question | how much goes in, how much comes out, is the marginal euro doing less |
| Communicates now | a six-cell chain, three equal tiles (CAC coefficient, average CAC, marginal CAC), a where-growth-came-from bar, the response curve |
| Missing | the machine as a machine (capital → law → constraint → committed → lag → arrives); the law visibly distinct from the two measurements; the Base point on the response curve |
| Duplicated | CAC coefficient appears in the chain and in a tile |
| Text that should be visual | "committed" vs "arrives" is two cells; it should be one vertical flow with the valve and the delay in it |
| Experiment information that disappears | a capacity or S&M change shows new numbers but not "the constraint tightened, the marginal euro fell"; a retention change gives no sign that acquisition is unchanged |
| Dominant visual object | a vertical flow with valves; measurements beneath in a different register; where growth came from as one composition; "ACQUISITION · unchanged vs Base" when that is the finding |

## 4 · Monetization — *what is revenue made of, and why is it changing?*

| | |
|---|---|
| Intended question | composition, then cause of movement |
| Communicates now | a two-segment composition bar, a nine-row movement ladder, one readout |
| Missing | the components by name and per customer; the share of installed-base growth by cause (price · usage · adoption) as one object; any Base comparison; a distinct off state |
| Duplicated | movement rows repeat Customers' ARR ladder |
| Text that should be visual | "of NRR, price · usage · adoption" as text |
| Experiment information that disappears | a usage-growth change looks like a slightly different ladder |
| Dominant visual object | COMPOSITION (a bar with the modelled components, per customer beneath) separated by a rule from MOVEMENT (a bridge whose causes are the engine's own), then a cause-share bar for installed-base growth |

## 5 · Economics & cash — *how does the operating system translate into profit and cash?*

| | |
|---|---|
| Intended question | what it earns, what capital the system consumes, why identical P&Ls need different capital |
| Communicates now | a P&L ladder, a cash ladder, six descriptors, the monthly waterfall in full |
| Missing | the two paths as two paths; the collapse when Cash physics is off as a visible event; capital required as a primary readout |
| Duplicated | the waterfall repeats the P&L ladder month by month |
| Text that should be visual | "cash FCF ÷ EBITA" — the two paths should *look* apart or together |
| Experiment information that disappears | EBITA and cash deltas |
| Dominant visual object | two vertical paths side by side — ECONOMICS (revenue → gross profit → EBITA) and CASH (billings → deferred → collections → receivables → cash FCF → cash) — that physically merge into one when Cash physics is off; the waterfall as secondary inspection |

## Propagation — what the reader cannot do today

Move one retention law and walk Company → Customers → Growth engine → Monetization →
Economics & cash. Company shows the divergence. The other four show *different numbers* with
no sign of what changed, what did not, or what followed. The lenses behave as five reports on
one run, not as five views of one disturbance.

## What this pass does not do

No new physics, no new metrics the engine cannot support, no equation changed for the sake of
the picture. Every decomposition shown is exact in the model: `ARR = customers × ARPA`, so
`(1+g_ARR) = (1+g_customers)(1+g_ARPA)`; installed-base growth under Monetization is the sum of
the engine's price, usage and adoption effects; cash FCF = EBITA + Δdeferred − Δreceivables.
