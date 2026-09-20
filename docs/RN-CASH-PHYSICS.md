# Research Note — Cash Physics (v2 Gate C)

Every figure below is printed by `node v2-study.js` §C and asserted by `node v2-checks.js`
(C-RECONCILE, C-UNTOUCHED, C-OPENING-BOOK, C-ANCHORED, C-STEADY, C-FCF-NE-EBITA, C-MEASURE,
C-VALIDATION, C-DETERMINISM, C-MODULE) and on screen by `node v2-accept.js`
(C · CONTROLS / OBSERVE / WATERFALL / SYSTEM / SCENARIO 13 / NULL).

## Question

*When does the cash arrive — and how far can the cash path depart from the P&L for the same
company?*

Through Gate B, `FCF = EBITA` (FINDINGS #15). A subscription business bills ahead of or behind
the revenue it recognises and collects after it bills; the cash trough of a growth push, and
whether the push funds itself, live in that gap. The engine had no billings, no deferred
revenue and no receivables, so the question could not be posed.

## New economic object

Three policy inputs and two balances:

| Input | Meaning | Null |
|---|---|---|
| `billingTermMonths` (T) | months invoiced per contract period | `null` = layer off, FCF = EBITA |
| `billingTiming` | `advance` (deferred revenue) or `arrears` (contract asset) | `advance` |
| `collectionDelayMonths` (d) | months from invoice to cash; receivables in between | 0 |

```
revenue      recognised exactly as before (midpoint MRR)               — unchanged
billings     = revenue + Δ deferred revenue                             — by construction
collections  = billings shifted by d;  Δ receivables = billings − collections
cash FCF     = collections − cash costs (COGS, S&M, R&D, G&A, expansion cost, when incurred)
             = EBITA + Δ deferred − Δ receivables
```

EBITA, revenue, gross profit and every ARR quantity are untouched (C-UNTOUCHED, worst |Δ|
€0.00e+0 in six worlds including all layers, lag, capacity and cost). `months[].fcf` becomes
cash FCF when the layer is on; `months[].ebita` never changes meaning.

**Billing units** (`cash.js`). A cohort is invoiced through units `{ share, phase, deferred }`.
Under **advance** billing, at the start of each T-month period a unit is invoiced
`T × run-rate`, **trued up** for whatever the previous period left in deferred; between invoices
deferred falls by the revenue recognised. Under **arrears**, revenue accrues as a contract asset
(negative deferred) and is invoiced at each period end. An **acquisition cohort** has one unit
anchored at its birth: under annual advance billing the M7 cohort is invoiced €750,000 in M7,
€0 for eleven months, and at renewal `12 × current MRR − what the first invoice left in deferred`
(C-ANCHORED). The **opening base** is a staggered book — T units whose renewal dates are spread
evenly — and starts with the balance such a book carries, `MRR × (T − 1) / 2`: €9.17m of
deferred revenue under annual advance billing, the same as a contract asset under arrears, €0
under monthly billing. That opening balance is **derived state**, reported in
`derived.cash.openingDeferredRevenue`, never an input (C-OPENING-BOOK).

**Receivables** are a company FIFO of billings awaiting collection; a 2-month delay lowers
ending cash by exactly the receivables outstanding at M60 — cash is deferred, never lost
(C-FCF-NE-EBITA).

**Boundary at the engine.** Term ≤ 0, fractional or non-numeric; an unknown timing; a negative
or fractional delay; and a delay without a term (`billingTermMonths: 1` bills monthly) throw
`RangeError` (C-VALIDATION).

## Null world

`billingTermMonths: null` (the default): `fcf = ebita` on the v1.3 line. ALL-NULL-V13 still
replays the complete v1.3 state exactly (737,109 fields) and every v2 field is null.

## Invariants

- every month, every world: billings = revenue + Δdeferred; FCF = collections − cash costs =
  EBITA + Δdeferred − Δreceivables; Δreceivables = billings − collections; balances chain;
  cash = opening + Σ FCF; company billings and deferred = Σ cohort rows (C-RECONCILE, worst
  residual €9.3e-9);
- the P&L and the recurring state are identical with the layer off (C-UNTOUCHED);
- a flat book (no churn, expansion or acquisition) billed annually in advance invoices exactly
  its revenue over any twelve months and keeps deferred constant — **the timing layer creates
  no money** (C-STEADY);
- `K.cashMeasures`: (FCF − EBITA) over the window = Δdeferred − Δreceivables (C-MEASURE);
- determinism; `bill()` and `collect()` are pure (C-DETERMINISM, C-MODULE).

## Falsification experiment

Run the Base P&L under seven cash physics. The layer is wrong if cumulative EBITA moves at all;
it is empty if cash does not.

## Result

| world | cum EBITA | cum FCF | FCF − EBITA | trough | at | M60 cash | deferred M60 | receivables M60 |
|---|---|---|---|---|---|---|---|---|
| FCF = EBITA (off) | €49.57m | €49.57m | +€0.00m | €6.10m | M13 | €59.57m | — | — |
| monthly in advance | €49.57m | €49.60m | +€0.03m | €6.13m | M13 | €59.60m | €0.03m | €0 |
| quarterly in advance | €49.57m | €53.26m | +€3.69m | €6.94m | M12 | €63.26m | €5.36m | €0 |
| annual in advance | €49.57m | €69.87m | +€20.30m | €10.13m | M1 | €79.87m | €29.47m | €0 |
| annual in advance, collected 2 mo later | €49.57m | €59.45m | +€9.88m | €5.41m | M2 | €69.45m | €29.47m | €10.42m |
| annual in arrears | €49.57m | €30.17m | −€19.40m | €0.97m | M23 | €40.17m | −€28.57m | €0 |
| annual in arrears, collected 2 mo later | €49.57m | €20.44m | −€29.13m | −€4.18m | M25 | €30.44m | −€28.57m | €9.73m |

Same P&L in every row. Ending cash spans €30.44m to €79.87m; the trough moves from M13 to M1
or M25 and from +€6.10m to −€4.18m — under annual advance billing the company never dips
below its opening cash at all. The FCF − EBITA gap at M60 is the change in deferred
revenue minus the change in receivables since M0 — an identity, every month.

**Month by month, annual in advance:** billings run ahead of revenue while the book grows
(M1: revenue €1.70m, billings €2.42m, Δdeferred +€0.72m, EBITA −€0.59m, cash FCF +€0.13m; the
staggered opening book invoices ~1/12 of itself a month while each new cohort pays a year up
front) and converge to it when growth is steady (M60: both €5.21m). Trailing-12 at M36: billings 1.095×
revenue, cash conversion 1.40× EBITA, deferred 5.7 months of revenue.

**The same growth push (S&M €900k → €1.8m) under three cash physics** — what the P&L cannot
see:

| cash physics | trough Base → push | Δ trough | M60 cash Base → push | Δ M60 |
|---|---|---|---|---|
| FCF = EBITA (off) | €6.10m → −€1.67m | −€7.77m | €59.57m → €94.12m | +€34.55m |
| annual in advance | €10.13m → €7.90m | −€2.22m | €79.87m → €135.11m | +€55.23m |
| annual in arrears, +2 mo | −€4.18m → −€21.97m | −€17.79m | €30.44m → €38.62m | +€8.18m |

Under annual advance billing the push largely funds itself — each new cohort pays a year up
front — and the trough barely moves; under arrears with a delay it deepens the trough by more
than twice what EBITA says. **This is the result the ARR/P&L world cannot produce:** it has one
cash path per P&L (Scenario 13 in the product).

## Boundary

- **Costs are cash when incurred.** No payables, no prepaid, no payroll timing: the working
  capital of costs is zero. The layer models the timing of *revenue* cash only.
- **No tax, capex, debt, interest or financing;** FCF is still pre-tax operating cash.
- **No bad debt, refunds or breakage;** every invoice is collected exactly d months later.
- **Deterministic invoicing.** Every customer in a cohort is billed on the same cycle; the
  opening book's stagger is uniform by construction. No mid-period upgrades billed pro rata —
  expansion is trued up at the next renewal, which is a stated convention, not a claim about
  contracts.
- **One timing for the whole company;** term and timing are policy inputs, not per-cohort
  contracts. Per-cohort or per-component billing terms would be their own mechanism.
