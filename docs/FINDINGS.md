# Where the physics break

Conceptual weaknesses exposed by running the prototype. Nothing here was silently "improved":
where an equation looked weak it was implemented as specified, and it stays that way until an
iteration is explicitly chartered to change it.

Updated for **model v1.3** (v0.3 cohort physics + expansion economics, bounded acquisition,
acquisition timing). Ordered by how badly each distorts a CFO's intuition, not by how hard it is
to fix.

---

## Fixed in v0.2

### ✅ Gross margin no longer generates ARR

**The v0.1 defect.** `New ARR = S&M × 12 ÷ (payback × GM)` put gross margin in the *denominator*,
because CAC payback is defined on gross profit. Cutting GM 80% → 65% at constant payback therefore
*raised* New ARR from €0.75m to €0.92m/month and Year-5 ARR from €62.93m to €73.06m, while
cumulative gross profit fell. The model reported a bigger, poorer company, and the ARR chart moved
the wrong way for a margin deterioration. It was internally consistent — holding payback fixed
while cutting GM asserts that CAC per euro of new ARR fell 18.7% — but nobody assumed that, and the
causal direction was inverted.

**The v0.2 fix.** Acquisition productivity `cacPerARR` is now the primitive and CAC payback is an
output:

```
New ARR    = S&M ÷ cacPerARR                 (GM absent)
CAC payback = cacPerARR × 12 ÷ GM            (output)
```

Same scenario under v0.2 — GM 80% → 65%, everything else held:

| | v0.1 | v0.2 |
|---|---|---|
| New ARR / month | €0.75m → **€0.92m** ✗ | €0.75m → **€0.75m** ✓ |
| Year-5 ARR | €62.93m → **€73.06m** ✗ | €62.93m → **€62.93m** ✓ |
| CAC payback | 18.0 (input, fixed) ✗ | 18.0 → **22.15 months** ✓ |
| Cumulative gross profit | −€14.63m | **−€31.23m** |
| Ending cash | €44.94m | **€28.34m** |

Margin deterioration now creates a poorer company without magically improving acquisition
productivity. `cacPerARR = 1.20` at GM 80% reproduces the v0.1 baseline exactly, so no other
Prototype 0 result moved. Six integrity checks lock the new causality in place, including a
structural one asserting that neither `cacPayback` nor `grossMargin` appears anywhere in the New
ARR generator's source.

---

## New in v0.3

### 1. The v0.2.1 boundary was a statement about state compression, not about SaaS

Two portfolios matching exactly on ARR, R12M GRR, R12M expansion, R12M NRR, gross margin, cost
structure and acquisition assumptions produced **€21.48m** more forward gross profit for one than
the other over 60 months — 26.5% more economic content per euro of identically-reported ARR. Add
**one** state dimension the transition laws actually read (cohort maturity), and the v0.2.1
equivalence breaks immediately. The 2×2 factorial check confirms the cause is not maturity but the
interaction: different state with flat laws, and identical state with age-dependent laws, both give
exactly zero divergence. See [`STATE-SUFFICIENCY.md`](STATE-SUFFICIENCY.md).

### 2. The KPI layer is blind, then briefly sighted, then blind again

The hidden state is invisible to the trailing measure at T0, visible for exactly 24 months as the
risk window passes through the measurement window, and invisible again from M36. A CFO deciding at
T0 gets the blind reading; by the time the KPIs move the economics have already happened; and a
year after that the report looks pristine. **The information is not unknowable — it is simply not
in GRR and NRR.** Cohort vintage disclosure identifies it instantly, and every company already has
that data.

### 3. The first matched construction was infeasible, and that itself is a finding

Monotone age bands make the per-age (GRR, expansion) signature nearly one-dimensional, so matching
two KPIs pins the age distribution and no second non-negative solution exists. The construction was
changed rather than the reported metrics fudged. The corollary is useful: **under monotone
lifecycle laws, matched trailing KPIs come close to implying a matched age mix.** It takes a
non-monotone law — such as a mid-life renewal risk window — to hide state behind matched KPIs.

### 4. The flat-law closed forms are band-conditional

`NRR = P × (1 + X)` and the closed-form calibration inverse are properties of the homogeneous
model. Under age-dependent bands there is no single (P, X) and they correctly stop holding. Now
asserted as a check rather than discovered as a failure.

---

## From v0.2.1

### 5. The parameters were never the KPIs — and my first explanation of the gap was wrong

Prototype 0.2 reported a 90% persistence input measuring as 89.56% GRR. The first decomposition
attributed this to three effects — compounding convention, moving base, and expansion charged on
retained ARR. **Two of those cancel exactly.** Setting the expansion coefficient to zero makes
measured GRR equal the persistence coefficient to 16 decimal places; setting persistence to 100%
makes measured expansion equal its coefficient exactly. The entire residual is the within-period
*interaction* of the two processes, and nothing else. Corrected in `kpi.js` and
[`MEASUREMENT.md`](MEASUREMENT.md).

The structural consequence is larger than the arithmetic: **a transition coefficient and a KPI of
the same name are different objects**, and the model now says so in code — the economic engine
(`engine.js`) holds coefficients, the measurement engine (`kpi.js`) holds definitions, and events
flow one way between them.

### 6. Under FLAT laws, any two systems reporting the same R12M NRR are identical — by construction

v0.2 found that a retention-heavy and an expansion-heavy business at matched NRR were
indistinguishable, and attributed it to the two coefficient sets happening to share a product.
Re-running the experiment through the measurement layer gives a stronger statement: measured R12M
NRR is a ratio of two *stocks*, so pinning it pins the monthly multiplier `m = NRR^(1/12)`
uniquely — 1.004551007 in both scenarios, to nine decimals. The ARR recursion consumes nothing
but `m`. So this is not a coincidence about two parameter choices; it is a theorem about the
*homogeneous* model — and v0.3 shows it is exactly that homogeneity, not anything about SaaS, that
made it true.

### 7. ✅ Cohort acquisition cost — fixed in v0.3

Flagged in v0.2.1 as one change away from being permanently unrecoverable. Now stamped at cohort
creation (`acquisitionCost`, `cacPerARRAtCreation`), immutable, and read by nothing in the
transition path. Checks 31 and 32 enforce both halves: it reconciles to `initialARR × cacPerARR`,
and doubling it at identical New ARR leaves forward ARR, gross profit and retention unchanged to
€0.0. Sunk cost stays sunk; historical capital efficiency stays computable.

---

## From v0.2

### 8. Matched NRR hides two different businesses — and the reason is precise

Retention-heavy (GRR 96% × expansion 110%) and expansion-heavy (GRR 90% × expansion 117.33%) both
give NRR 105.6%. The engine produces **identical** Year-1, Year-3 and Year-5 ARR, gross profit,
EBITA, FCF, cash and cohort composition — agreeing to €8.9 × 10⁻⁸ across 60 months. The only
difference is gross flow: the expansion-heavy business churns €15.12m more and expands €15.12m
more, netting to zero.

The reason is structural, not a matter of missing detail. A cohort's month is
`closing = opening × mGRR × (1 + mExpansion)`, so **only the product reaches the ARR stock**, and
nothing downstream consumes leakage or expansion separately. This yields a sharp condition:

> Two installed-base systems are indistinguishable in this model **iff their monthly NRR *path*
> agrees**, not merely its annual product.

That condition governs what could ever fix it: physics that merely rescales retention and expansion
together will not separate them. Only physics that changes the *timing* (age dependence with
differing profiles, expansion saturation) or attaches something *outside the ARR recursion*
(expansion cost, customer count) can. Full analysis, including the ranked candidate list and the
lifecycle assessment, is in [`MATCHED-NRR.md`](MATCHED-NRR.md).

This is a boundary of the model, not a bug. No quality score, risk coefficient or weighting factor
has been added to conceal it.

### 9. Reported KPIs and transition coefficients differ measurably

Twelve compounded monthly steps reproduce the intended annual NRR exactly. The decomposition does
not. At the defaults, measured from the opening cohort's first twelve months of flows:

| | Coefficient | Measured KPI | Gap |
|---|---|---|---|
| Persistence / GRR | 90.00% | 89.56% | −0.44pp |
| Expansion | 10.00% | 9.44% | −0.56pp |
| NRR | 99.00% | 99.00% | exact |

The gap widens with the size of the other process — at a 35% expansion coefficient, measured GRR
falls to 88.51%. It matters the moment anyone compares a modelled figure against a reported one,
or calibrates a model to a board pack. Surfaced in the interface rather than assumed away, and
invertible in closed form (see §D of `MEASUREMENT.md`).

---

## Resolved or reclassified in v1.1–v1.3

Three findings below were open limitations of the v1.0 physics. Each is now bounded by ONE
nullable mechanism; none is deleted, because each leaves a residual the mechanism does not
address. The full record of what was measured is in `RN-EXPANSION-ECONOMICS.md`,
`RN-ACQUISITION-SATURATION.md` and `RN-ACQUISITION-TIMING.md`.

### 10. ✅ BOUNDED in v1.2 — acquisition was linear and unbounded in S&M

> **Was blocked:** *when should we stop increasing S&M because marginal acquisition productivity
> deteriorates?*

**What changed.** `maxMonthlyNewARR` gives the response a capacity:
`N = S&M ÷ (cacPerARR + S&M ÷ capacity)`, with `cacPerARR` kept as the low-spend primitive.
Average CAC (`S&M ÷ N`) and marginal CAC (`1 ÷ dN/dS&M`, closed form) are derived from the same
law. A bound, admitted under "bounds before benefits"; null (off) reproduces the linear law
byte-for-byte.

**What it now teaches.** At Base spend under a €2.0m/month capacity, average CAC is 1.65× and
marginal 2.27×; at €3.6m/month, 3.00× against 7.50×. The S&M sweep is monotone, concave and
bounded (checks 42–44, SWEEP 39–41).

**What remains open.** The model can now show *diminishing*; it still cannot say *stop* — it
has no objective function, and declares none. One hyperbolic shape stands in for market size,
sales capacity and rep ramp; capacity is static; and cash still never constrains S&M (the capital
loop is still drawn open). The S&M slider still has no wrong setting in the null world, and the
product still carries no "spend more" scenario for that reason.

### 11. ✅ RECLASSIFIED — ARR trajectory alone does not reveal the capital required to produce it

**This is not a model break. It is a validated result, and it was mis-filed.**

Two businesses that reach the same ARR by different routes — one efficient, one
outspending — produce the same ARR path. The engine reproduces this exactly, and
that is correct behaviour, not a defect: ARR is a stock of recurring revenue, and
a stock does not record what was paid to build it. The capital difference is
real, visible, and lives where it belongs — in cash, cumulative S&M and CAC
payback.

Stated properly:

> **ARR trajectory alone does not reveal the capital required to produce it.**

Filed under "still broken" it read as a deficiency. It is the opposite: it is the
engine correctly refusing to leak cost information into a revenue stock. The
Phase 0/1 research sharpened it further — see finding 22.

Original ID and history preserved.

### 14. ✅ PRICED in v1.1 — expansion was free

> **Was blocked:** *what incremental economic resources are required to generate Expansion?*

**What changed.** `expansionCostPerARR` prices each euro of expansion ARR the transition already
produced: `expansionCost = expansion ARR × c`, a named P&L line between gross profit and EBITA,
read by nothing in the ARR recursion. Null (0) reproduces v1.0 exactly.

**What it now teaches.** The matched measured-NRR pair (GRR 96%/exp 9.6% vs GRR 90%/exp 15.6%,
both NRR 105.6%) keeps identical ARR (max Δ €4.5e-7) and identical NRR (2.4e-15) at every cost,
and diverges in cash by exactly `c × €13.79m` — the difference in cumulative expansion — with no
threshold (checks 39–40). The prediction recorded here in v0.2 (`Δending cash = c × Δexpansion`)
held.

**What remains open.** The cost is a price, not a mechanism: nothing says what it buys or
whether spending it could raise expansion (that would be a benefit, and #16's objection still
stands). It is linear in expansion ARR. And because it never touches ARR, the pair is still
observationally one company to a reader of ARR, GRR and NRR — only the cash line differs.

### 17. ✅ TIMED in v1.3 — there was no acquisition lag

> **Was blocked:** *how does time-to-revenue alter the capital required to create the same
> eventual economics?*

**What changed.** `acquisitionLagMonths` routes each month's spend through an explicit pending
stock (a ledger the engine carries and returns) and creates the cohort L months later. S&M is
expensed on spend; the cohort stamps its spend month, lag and realised cost. Spend maturing
beyond M60 stays pending and is reported, never pulled forward. Null (0) is byte-identical to
v1.0.

**What it now teaches.** At Base, a 6-month lag leaves New ARR per month of spend at €0.750m
and R12M NRR at 99.0000%, shifts the realised series by exactly six months, and moves the cash
trough from €6.10m (M13) to €2.29m (M19); at 12 months the trough is €−1.55m (M25). Measured
CAC (spend ÷ realised ARR) reads 3.60× at T = 9 and 1.44× cumulative at T = 36 while the law
says 1.20× — the timing shows up in the measurement, as it should (checks 47–51).

**What remains open.** One fixed delay stands in for a distribution of cycle lengths; pending
spend carries no risk of not converting and earns nothing while it waits; and with no deferred
revenue (#15) the lag can only make cash worse — the up-front-billing offset a real company
would see cannot appear here.

---

## Still broken

### 12. Retention age structure exists now, but is coarse

v0.3 added three age bands — the minimum structure capable of expressing an age effect — and the
shipped default stays flat, so nothing is asserted about SaaS. What is still missing is resolution:
three step functions cannot represent a smooth survival curve, and the band edges (12 and 24
months) are themselves assumptions. A fidelity limit rather than a structural gap now, and it
should not be refined until there is evidence about the shape.

### 13. Expansion is unbounded

> **Bounded under v2 Gate B.** With Monetization on, expansion is price + usage + adoption
> and usage and adoption grow toward explicit caps: a closed cohort converges to
> `fixed + penCap × unitsCap × price` (B-SATURATION). The generic coefficient, when the layer
> is off, is still unbounded.

Expansion may now vary by age band, but nothing caps a cohort at any multiple of its initial ARR —
no seat ceiling, no penetration curve, no product limit. Nothing can ever exhaust an account, so
expansion headroom stays invisible.

### 15. `FCF = EBITA` inverts the cash reality of subscription businesses

> **Resolved in v2 Gate C (Cash Physics).** With `billingTermMonths` set, billings = revenue +
> Δdeferred by construction, collections = billings shifted by the collection delay, and cash
> FCF = collections − cash costs = EBITA + Δdeferred − Δreceivables. EBITA is untouched. The
> same Base P&L ends between €30m and €80m of cash depending on billing and collection alone.
> See #37–#39 and `docs/RN-CASH-PHYSICS.md`.

> **Blocked CFO question:** *how do billing timing and working-capital mechanics
> alter liquidity relative to EBITA?*


No deferred revenue, billings, working capital, tax, capex or interest. Real SaaS collects ahead of
recognition, so growth is *cash-generative* at the working-capital line — the opposite sign to what
this model shows. Every growth scenario looks more cash-expensive than it is.

### 16. R&D is a cost with no modelled benefit — deliberately

> **Blocked CFO question:** *what is the causal return on product investment?*


The future economic benefit of R&D is **outside the current simulation boundary**. v0.2 continues to
encode no `R&D → GRR` or `R&D → expansion` law, because there is no defensible universal
coefficient. The consequence is that the only conclusion the model can reach about R&D is *spend
less*, and the interface says so on screen.

The eventual fix is not a law but an **intervention**: let the user state a hypothesis — "€2m of
additional R&D over 12 months → expansion +3pp after a 9-month delay" — and simulate that. A
management thesis, explicitly owned by the user, not a property of SaaS. Not implemented.


### 18. Leakage is a single number, and there are no customers

> **Blocked CFO question:** *how much of the loss is logo churn and how much is
> contraction within retained customers?*

> **Resolved in v2 Gate A (Customer Physics).** With `logoRetentionAnnual` set, a cohort carries
> a customer count, leakage separates into lost-logo ARR and contraction ARR, dollar persistence
> is derived as L(1 − C), and R12M logo retention and the GRR decomposition are measured. Null
> reproduces v1.3 exactly (ALL-NULL-V13, 737,109 fields). See #31–#33 and
> `docs/RN-CUSTOMER-PHYSICS.md`.


Churn and contraction are combined, so the model cannot distinguish losing customers from customers
shrinking — which is why the measurement layer cannot report them separately either, however
correct its definitions are. Reactivation is zero. There is no customer count at all, so identical
ARR paths and identical reported KPIs can conceal completely different logo survival and expansion
concentration — see §F of `MEASUREMENT.md` for a worked pair.

### 19. The opening base is one cohort by default

A real €20m installed base is a mixture of vintages retaining far better than a cohort acquired last
month. One blended cohort systematically overstates decay of the existing book — which is 30% of
Year-5 ARR.

### 20. Midpoint revenue is an approximation

`((opening + closing) / 2) / 12` is a trapezoid rule on a geometrically moving stock. Small, and kept
because it is legible.

### 21. There is no price

> **Blocked CFO question:** *how much of a revenue change came from price versus
> other drivers?*

> **Resolved in v2 Gate B (Monetization Physics).** With `monetization` set, revenue is
> derived from per-customer components and survivor revenue change is measured as price,
> usage and adoption effects on the frozen R12M cohort (`K.monetizationMeasures`). Two
> worlds matched on NRR at T = 12 — price-only vs usage-only — are told apart by the
> decomposition and diverge later because usage hits its cap. See #34–#36 and
> `docs/RN-MONETIZATION-PHYSICS.md`.


Expansion and leakage are pure quantity effects. Pricing is the highest-leverage control a CFO
actually holds and it does not exist.

---

## New in Phase 0/1 research

### 22. The insufficiency is localised in the retention ratios, not spread across the KPI set

The observability experiment attributed the identifying power observable by
observable. Given only R12M GRR and expansion, **thirty-six months of history
leaves exactly the same ambiguity as one snapshot** — SKSG 4.51% at every window
tested. The ARR path alone collapses it to 0.00% in twelve months.

So "KPIs are insufficient" was too coarse. On this domain the retention metrics
are not merely incomplete about the hidden state — they are *uninformative* about
it, at any window length, because two bands sharing coefficients make their
cohorts observationally identical by construction. Finding 11's proper statement
has a partner here: ARR does not reveal the capital that produced it, but the ARR
*path* does reveal the composition that retention ratios cannot.

### 23. Hidden state in v0.3 has a finite lifetime

Because band 3 is unbounded and terminal, once every euro reaches it composition
is inert: seeded ages 50, 80 and 120 give FIBC-60 per euro identical to nine
decimals (4.778638602). Combined with the fact that a cohort seeded at month 0
has age `a + T0` at T0, this means a directly-seeded base cannot hold a band-1
cohort for any T0 ≥ 12. **The only economically distinguishing hidden state is
recent acquisition.** This is a property of the three-band structure and would
change under finer or age-continuous laws.

### 24. The 26.5% headline was an artefact of an asymmetric denominator

The same two flagship states give 26.54%, 23.43% or 20.97% depending on which
state is the denominator. The old headline picked the largest. SKSG now uses the
order-invariant midpoint form (23.43%); the historical figure is preserved for
traceability but is no longer quoted as the result.

### 25. Observational ambiguity and economic ambiguity are different quantities

At 24 and 36 months the state is still **not identifiable** — 78 and 80 ambiguous
classes remain — and yet SKSG is 0.00%. Under homogeneous laws the snapshot lens
collapses all 256 states into a single class with SKSG 0.00%. Had the experiment
reported identifiability alone, it would have concluded that KPI history fails at
every window. The economically relevant question is the second one.

### 26. ✅ The same-world gate passed, exactly

The flagship portfolios receive the *same band array object*, so per-portfolio
calibration is structurally impossible, and their observations agree to
`0.00e+0` rather than to a tolerance. The result stands — but it is conditional
on a **non-monotone** retention profile, and the earlier finding that a monotone
construction is infeasible is the other half of that statement: under monotone
tenure laws the KPI set may be very nearly sufficient.

See [`KPI-SUFFICIENCY.md`](KPI-SUFFICIENCY.md).

---

## New in v1.1–v1.3

### 27. Several CACs and paybacks now legitimately exist — the vocabulary is fixed

| Canonical name | Definition | Source |
|---|---|---|
| **CAC floor** | `cacPerARR`, the low-spend limit of average CAC — the cheapest acquisition the law allows | assumption |
| **Opening pipeline** | `openingPipelineMonths`, the months of spend in flight at month 0 — an initial condition, never a law. null/0 = an empty pipeline | assumption |
| **Average CAC** | S&M ÷ New ARR at the current spend (= coefficient + S&M ÷ capacity) | `derived.acquisition` |
| **Marginal CAC** | 1 ÷ dN/dS&M, closed form | `derived.acquisition` |
| **Cohort CAC (realised)** | a cohort's acquisition cost ÷ its initial ARR, stamped from its pending entry | `cohort.cacPerARRAtCreation` |
| **Measured CAC · trailing 12** | Σ S&M ÷ Σ realised New ARR over the window — carries the lag | `K.acquisitionMeasures` |
| **Floor payback** | CAC floor × 12 ÷ GM — the v1.0 `cacPaybackMonths`, 18.0 months at Base, unchanged | `derived` |
| **Average payback** / **Marginal payback** | the same construction on average / marginal CAC | `derived.acquisition` |
| **Cohort payback** | the month a cohort's cumulative gross profit first covers its cost | `capital.cohortCapital` |

Every CAC is € of S&M per €1 of **ARR** and never passes through the MRR/ARR display basis. A
bare "CAC payback" no longer appears in the product; a reader comparing 18.0 (coefficient),
24.7 (average, Base under €2.0m/month), 34.0 (marginal) and 25 (a Base cohort's realised
crossing) is comparing four named quantities. There is no "measured payback".

### 28. Pending acquisition is a stock with provenance and no economics of its own

The lag introduces a state — spend that has left cash but not yet created ARR — held as a
ledger of entries. Each entry fixes, at spend, the law that produced it (`cacPerARRAtSpend`,
`maxMonthlyNewARRAtSpend`) and the amount; the cohort it matures into is stamped from the entry
and from nothing else, so committed spend cannot be re-priced by later assumptions. No cohort
exists before maturity — the first L months of a lagged world have no acquisition cohorts, not
empty ones — and acquisition capital is deployed when spent (realised-cohort capital + pending
capital = Σ S&M, every month). The engine gives the pending stock no cost of carry, no
conversion risk, no partial revenue and no interaction with the bound. That is the minimum
mechanism the brief asked for, stated as a boundary: a delay line with provenance, not a
pipeline model. Any future pipeline physics (conversion, ramp, decay of stale pipeline) would
replace this object, not extend it.

### 29. The three mechanisms are separable, and that separability is itself a modelling choice

Cross-mechanism checks show the expansion cost never moves the acquisition response, the bound
never moves an existing cohort's expansion, and the lag never moves the response function
(physics-checks SAT+LAG, COST+SAT). Real companies are not built that way — the CSM capacity
that realises expansion is often the sales capacity that saturates acquisition, and a long
sales cycle usually comes with a different CAC. The model keeps the three orthogonal so each can
be falsified alone. Interactions, if wanted, must be added as their own named mechanism.

### 30. Expansion saturation is still absent, and the expansion cost makes its absence louder

Expansion ARR is still unbounded (#13). With a realisation cost priced per euro, a cohort can
now be made to *pay* indefinitely for expansion it can never exhaust. Nothing caps a cohort at
any multiple of its initial ARR, so the cost line grows with expansion forever. Explicitly out of
scope for this release; recorded here because the new mechanism exposes it.

## New in v2 Gate A — Customer Physics

### 31. Dollar persistence is now a derived quantity, and the product had to say so

With the customer layer on, `persistenceAnnual` is not read: P = L(1 − C) is generated by logo
survival and contraction. A slider that is silently ignored is a lie, so the Change surface
disables it and prints the derived value and its formula; the System map's persistence valve
loses its key and gains two valves beneath it. The lesson is general for v2: every time a layer
takes ownership of a quantity the layer below asserted, the product must show the hand-over,
not just the engine.

### 32. ARR, GRR and NRR carry no information about logo retention — proven, not argued

Worlds B (L 87.4%, C 0), X (L 92%, C 5%) and Y (L 98%, C 10.8%) share P = 87.4% and are
identical in ARR, revenue, cash, GRR and NRR at every month (max |ΔARR| €1.4e-7) while ending
with 2,157 / 2,505 / 3,046 customers at ARPA €26,590 / €22,888 / €18,826. This is the customer
analogue of the KPI-sufficiency result (#22–#26): the retention ratios are not sufficient
statistics for the customer state either. Cumulative leakage is the same €26.10m in B and Y
and composed oppositely (€26.10m + €0 vs €3.93m + €22.16m). A CFO reading GRR alone cannot
tell a logo problem from a pricing problem — which is the blocked question #18 asked.

### 33. Departing customers take the average — the layer's central simplification

Logo churn removes `openingMRR × (1 − l)`: one ARPA per cohort, no size heterogeneity, no
concentration, no "the largest accounts leave first". Under that assumption logo churn and
contraction are only distinguishable by their customer-count footprint, which is exactly what
the layer adds. Any heterogeneity mechanism (a distribution of account sizes, size-dependent
survival) would be its own named object with its own null; it is the first candidate for a
Gate A follow-up and is deliberately not built here.

## New in v2 Gate B — Monetization Physics

### 34. Dollar persistence became emergent, and the product had to change what it says a second time

Under Gate A persistence was derived (L(1 − C)); under Gate B it is not even a constant:
contraction reaches variable revenue only, so a cohort's dollar retention depends on its
fixed/variable mix. Same customers, same L and C, three mixes: GRR 92.00% / 90.21% / 87.40%
(B.2). The engine reports `persistenceSource: 'emergent…'` and `persistenceAnnualEffective:
null`; the slider reads "emergent — set by the revenue mix"; the System map's persistence
valve reads "emergent". The Gate A lesson (#31) repeated one layer down: every hand-over of
ownership must be visible on every surface, or the surface lies.

### 35. Attribution of expansion to price / usage / adoption is order-dependent; the identity is not

The four effects are applied in a fixed order (contraction → price → usage → adoption) and
each is measured as the revenue difference its step produced. `Σ effects = closing − opening`
holds for any order to €1e-6; the split between price and usage does not — a price step taken
after a usage step attributes more to price. The order is a stated convention, not a fact
about the world, and the research note says so. A Shapley-style symmetric split was considered
and rejected: it would present a modelling choice as neutrality.

### 36. "Requires the layer below" is a boundary the product has to absorb

Monetization needs customers (revenue per customer is meaningless without a count). The engine
rejects the combination at its boundary; the product cannot, because a user who switches
Monetization on has not asked to be thrown at. The toggle therefore switches the customer
layer on with it, the Experiment summary shows both changes, and the attribution treats a
lone monetization change on a Base without customers as a bundle. Every later layer that
depends on a lower one (Cash on nothing; Interventions on whichever law they target) has to
decide the same thing explicitly.

## New in v2 Gate C — Cash Physics

### 37. The opening book's deferred balance is state the model had never carried

A company that bills annually in advance holds, on day one, roughly half a year of revenue as
deferred revenue. The engine started every run with cash and ARR and nothing between them.
Gate C derives that balance from a stated assumption — the opening book is a staggered set of
contracts whose renewal dates are spread evenly, so it carries `MRR × (T − 1) / 2` — and
reports it, rather than asking for it or pretending it is zero. It is the first opening state
in the model that is derived from a convention instead of set, and the convention is named on
every surface. A real company's opening deferred balance is a fact, not a convention; an
opening-state adapter (ARCHITECTURE "not implemented") would replace the derivation.

### 38. Timing creates no money — and the checks had to prove it before the experiments could mean anything

A flat book billed annually in advance invoices exactly its revenue over any twelve months and
keeps deferred constant (C-STEADY); a collection delay lowers ending cash by exactly the
receivables outstanding (C-FCF-NE-EBITA). Both are identities, and both failed on the first
implementation: the staggered units' opening balances were assigned to the wrong phases, so the
book's total was right and its monthly billing was wrong. The totals-only check would have
passed. The lesson for Gate D: a timing mechanism needs a steady-state identity checked month
by month, not a cumulative one.

### 39. FCF ≠ EBITA in both directions, and the sign is a policy, not a property of SaaS

Annual advance billing makes a growth push largely self-funding (the trough barely moves);
arrears billing with a collection delay makes the same push deepen the trough by more than
twice what EBITA says. Neither is "the" SaaS cash reality: billing term, timing and collection
are policies the company chooses and negotiates. The model takes no position; it lets the user
set the policy and see the path. What it does not model — payables, prepaid costs, payroll
timing, tax, capex, bad debt, refunds, financing — is listed in the research note's boundary
and is the honest answer to "why is my cash still different".

## New in v2 Gate D — Interventions

### 40. A hypothesis had to be a different kind of object from a law, and the engine had to enforce the difference

Every earlier release added a coefficient. A "retention programme" could have been modelled as
"set persistence to 0.945" — and would then have been a law: permanent, free, in force from
M1, indistinguishable from the world simply being better. Gate D makes an intervention an
explicit object with a decision month, a lag, a duration and a cost, resolved into the law in
force by `lawAt(t)`, and records on every month what was in force and what it changed. The
structural guarantee is that outside its window every cohort runs on the base law; the
product guarantee is that the Change surface shows a hypothesis in a group of its own, the
Consequence panel books its cost against its effect, and the System map rings the valve it is
moving. Two implementation facts follow: the monthly loop now reads every law from the
resolved object of that month (bit-identical to the once-computed value when nothing is
active — the null gate proves it), and committed spend is stamped with the hypotheses in force
at spend, so a later hypothesis never re-prices it.

### 41. What a hypothesis may not do is as important as what it may

It may not switch a layer on or off (a null target is rejected; the layers' switches are
rejected), because a world that gains customers in month 12 has no customer state before it.
It may not change the billing policy, because billing units are anchored to a term. It may not
push any law outside its domain in any month — the resolved law of every month is run through
the engine's own boundary validation before the run starts, and the v1 laws the engine never
bounded (persistence, gross margin, S&M…) gained explicit domains for this purpose. "Bounds
before benefits" applied to hypotheses means: the engine will not run a hypothesis it would
refuse as an assumption.

### 42. The effect of a hypothesis is not a measurement

`K.interventionMeasures` reports status, months in force and cost to date. It deliberately
does not report an "effect": the effect is a counterfactual — the same company without the
hypothesis — which is a comparison of two runs (Base vs Experiment), not a property of one.
Presenting a within-run number as the programme's effect would have been the KPI-as-law error
of `docs/MEASUREMENT.md` in a new coat. What the product does instead: Base is the company
without the programme, the Consequence panel shows the effect net of cost, and the month cash
overtakes Base is reported as a fact of the comparison.

### 43. A kind is a property of the spec, and a state copy must not be asked to carry it

The engine keeps a cohort's per-customer component state as `(penetration, units, price)` — and
`MO.copyState()` says so in one line. Whether a component is *fixed* or *variable* is not state
at all: it is a property of the spec, resolved once into the rates array and read from there by
`MO.revenue()` and `MO.transition()`. The module is consistent about this.

`engine.js` then added a convenience the module never promised: `stampKinds()` wrote `fixed`,
`unitsCap` and `penetrationCap` *onto* the state objects, and `moRatesFor()` read them back. One
call site depended on it — the birth row of a newly realised cohort — and that cohort's state had
reached it through two `copyState()` calls, which by contract had dropped the stamps. `!!undefined`
is `false`, so every component of every cohort was classified **variable on the month it was
born**, and the company record, which faithfully sums the cohort rows, inherited it. Fixed was
understated by 0.34%–2.17% of closing ARR, in every world, in every month, always in the same
direction.

Nothing economic moved, and that is the instructive part. `MO.revenue()` returns
`total = fixed + variable` whatever the classification, and a newborn's ARR comes from the
acquisition ledger, not from this row. So the partition identity `fixed + variable = closing ARR`
held perfectly throughout — and **every existing test checked the sum**: the cohort→company
aggregation, the ledger's own composition check, and a v2 check that inspects a birth row
specifically and asserts only its total. A test suite can be thorough about an identity and blind
to the attribution inside it.

Worse, the clean-room monetization audit written to be independent of the implementation was
structurally unable to see it: it runs at `sm: 0`, so the only cohort is the opening base — which
is created before the loop and is the one cohort that never passes through `realiseCohort()`. An
independent derivation still has to exercise the path.

The fix passes the authoritative rates array into `realiseCohort()` rather than widening what a
state copy carries. Widening `copyState()` was tested and produced bit-identical numbers, but it
changed the published shape of `state` from three keys to six, duplicating caps that already live
in `derived.monetization.spec`. The narrower change is the one that keeps the module's contract
true. Held by `monetization-split-checks.js`, which reconstructs the split from the spec's own
kinds for every cohort row in every world that actually acquires.

## What held up

- **The cohort spine.** Company ARR and revenue are only ever sums of cohorts, reconciling to ~10⁻⁸
  euros on €63m over all 60 months. Nothing is faked at the aggregate level.
- **Emergence.** Measured R12M NRR lands exactly on `P × (1 + X)`; the 10× S&M probe leaves every
  R12M measure bit-identical at every measurement date. CAC payback reconciles exactly to
  `cacPerARR × 12 ÷ GM` across a five-point probe.
- **Layer separation.** The KPI bridge reconciles to €1.5×10⁻⁸ and the identity
  `GRR + expansion = NRR` to 3.3×10⁻¹⁶ at all 49 measurement dates. Expansion is provably unable
  to improve GRR — it monotonically worsens it, which is the interaction effect showing up as a
  testable prediction rather than an assertion.
- **Invertibility.** Target measured KPIs can be reproduced by calibrated coefficients in closed
  form, to nine decimals, without touching acquisition physics.
- **Backward compatibility across four model versions.** v0.3's flat default reproduces v0.2.1
  exactly; v0.2.1's rename reproduced v0.2 exactly; v0.2's inverted primitive reproduced v0.1's
  baseline exactly. Every earlier result remains comparable.
- **Sunk cost stays sunk.** Doubling historical acquisition cost per cohort at identical New ARR
  leaves forward ARR, gross profit and retention unchanged to €0.0.
- **Lever separation, now complete.** Retention changes leakage and nothing else. S&M and
  acquisition productivity change acquisition and nothing else. Gross margin changes economics and
  nothing else — the last cross-contamination is gone.
- **Baseline continuity.** Inverting the primitive reproduced every Prototype 0 number exactly, so
  v0.1 and v0.2 results remain comparable.
- **Scenario isolation.** Base is frozen and the Experiment copied, never mutated; identical
  assumptions give byte-identical trajectories across 60 months and 61 cohorts.

## Suggested order from here

Done: the observability experiment (Phase 0/1), expansion cost (v1.1), diminishing returns on
S&M (v1.2), acquisition lag (v1.3).

1. **Customer count and logo retention** — the next ontology change. What the v1.1 experiment
   showed is the case for it: the matched pair is now economically different and still
   *observationally* identical, because nothing outside cash has changed. Only an object that
   makes the two installed bases look different — a customer count, a logo survival rate — can
   close that gap without a judgment coefficient. It also unlocks ARPA and concentration later,
   and it is the reason #18 stays open. Reserved for v2; must not be smuggled in piecemeal.
2. **Expansion saturation** — one parameter, the first thing that changes the ARR *path*, and
   now doubly motivated (#30).
3. **Deferred revenue and billings** → a real FCF line, which is also what would let the lag
   (#17) show the offset a real billing cycle provides.
4. Age-dependent retention (with the normalisation constraint in `MATCHED-NRR.md`), split
   leakage, efficiency metrics on screen.
5. R&D as a user-stated intervention with an explicit lag — never as a universal coefficient.

Valuation, enterprise value and any 3D or final product design stay out until at least items 1–3
are done.
