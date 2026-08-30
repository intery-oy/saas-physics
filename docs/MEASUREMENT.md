# Reality and measurement — Prototype 0.2.1

> **Governing principle.** The business exists first. KPIs are measurements taken from it.
> A KPI definition must never silently become an economic law.

---

## A. Architecture

```
┌─ LAYER A · ECONOMIC / STATE-TRANSITION ENGINE ────────────── engine.js ──┐
│                                                                          │
│  STATE            cohort ARR balances · cash                             │
│                        │                                                 │
│  TRANSITION       persistence coefficient P   → g = P^(1/12)             │
│  COEFFICIENTS     expansion coefficient  X    → e = (1+X)^(1/12) − 1     │
│                   cacPerARR · gross margin                               │
│                        │                                                 │
│                        ▼   per cohort, per month                         │
│  TRANSITION       retained  = opening × g                                │
│                   leakage   = opening − retained                         │
│                   expansion = retained × e                               │
│                   closing   = retained + expansion                       │
│                   new cohort = S&M ÷ cacPerARR                           │
│                        │                                                 │
│                        ▼                                                 │
│  ECONOMIC         per-cohort monthly rows: opening, retained, leakage,   │
│  EVENTS           expansion, closing, revenue, gross profit              │
│                   company: revenue → GP → EBITA → FCF → cash             │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │  (events only — no parameters cross)
┌──────────────────────────────▼──────────────────────── kpi.js ───────────┐
│  LAYER B · KPI MEASUREMENT ENGINE                                        │
│                                                                          │
│  1. freeze the cohort that existed 12 months ago                         │
│  2. follow only that cohort; exclude all New ARR created since           │
│  3. accumulate its leakage and its expansion                             │
│                        │                                                 │
│                        ▼                                                 │
│  REPORTED         R12M GRR · R12M expansion · R12M NRR                   │
│  METRICS          ARR growth · CAC/New ARR · CAC payback · GM            │
│                   EBITA · FCF · cash                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

The arrow runs one way. Layer B reads Layer A's events; nothing in Layer B feeds back into
Layer A. That is what makes the two objects genuinely distinct rather than differently-named
versions of the same number.

---

## B. Why the 90% persistence coefficient measures as 89.56% GRR

### The setup

With monthly persistence `g` and monthly expansion `e`, a cohort's balance follows
`A_t = A₀ · mᵗ` where `m = g(1+e)`. Over a 12-month window, with `S(x) = Σ_{t=0..11} xᵗ`:

```
Σ leakage   = A₀ · (1−g) · S(m)          Σ expansion = A₀ · g·e · S(m)
```

so

```
measured GRR       = 1 − (1−g)·S(m)
measured expansion = g·e·S(m)
measured NRR       = m¹² = P(1+X)          ← exact
```

### The €100 worked example — P = 90%, X = 10%

`g = 0.991258389`, `e = 0.007974140`, `m = 0.999162823`

| Month | Opening | − Leakage | + Expansion | Closing |
|---|---|---|---|---|
| M1 | 100.0000 | 0.8742 | 0.7904 | 99.9163 |
| M2 | 99.9163 | 0.8734 | 0.7898 | 99.8326 |
| M3 | 99.8326 | 0.8727 | 0.7891 | 99.7491 |
| … | | | | |
| M11 | 99.1660 | 0.8669 | 0.7839 | 99.0830 |
| M12 | 99.0830 | 0.8661 | 0.7832 | **99.0000** |
| **Total** | **100.0000** | **10.4418** | **9.4418** | **99.0000** |

```
R12M GRR       = (100 − 10.4418) / 100 = 89.5582%    not 90.00%
R12M expansion =            9.4418 / 100 =  9.4418%    not 10.00%
R12M NRR       =           99.0000 / 100 = 99.0000%    exactly P(1+X)
```

### The cause — one effect, not several

It is tempting to attribute the gap to a compounding convention (the sum of a monthly hazard
is not the compounded annual total) plus a moving-base effect. Both terms are real. **They
cancel exactly**, which is provable by switching each process off:

| | Result |
|---|---|
| Expansion coefficient = 0 | `(1−g)·S(g) = 1 − g¹² = 1 − P` → **measured GRR = P exactly** |
| Persistence = 100% | `e·S(1+e) = (1+e)¹² − 1 = X` → **measured expansion = X exactly** |

Verified in simulation: at X = 0 measured GRR reads 90.000000%; at P = 100% measured expansion
reads 10.000000%.

So the entire residual is the **within-period interaction of the two processes**:

```
churn:      1 − P = 0.100000   + expansion exposure  +0.004418  =  measured 0.104418
expansion:  X     = 0.100000   + retention exposure  −0.005582  =  measured 0.094418
```

- **Expansion enlarges the balance that is subsequently exposed to decay**, so more euros leak
  → measured GRR **below** P.
- **Decay shrinks the balance that expansion subsequently accrues on**, so fewer euros expand
  → measured expansion **below** X.

Magnitudes scale with the size of the other process:

| Expansion coefficient (P = 90%) | 0% | 5% | 10% | 20% | 35% |
|---|---|---|---|---|---|
| Measured GRR | 90.0000% | 89.7772% | 89.5582% | 89.1308% | 88.5127% |
| Gap | 0.0000pp | −0.2228pp | −0.4418pp | −0.8692pp | −1.4873pp |

### Why NRR escapes

**NRR is a ratio of two stocks; GRR and expansion are ratios of flows to a stock.** The endpoint
`A₁₂/A₀ = m¹²` does not care how the path was attributed between leakage and expansion. Flow
ratios do. That is the whole asymmetry.

### Verdict against the candidate causes

| Candidate | Verdict |
|---|---|
| Definition | No — the KPI definitions are standard and correct |
| Timing | Partly — but only as a component that cancels |
| Compounding convention | Real, but exactly offset by the moving base |
| Expansion becoming exposed to retention | **Yes — this and its mirror are the entire effect** |
| Flow attribution | **Yes — flow ratios are not properties of one coefficient alone** |

**It is not an error, and it is not renamed away.** It is the signature of measuring a
two-process system with one-process ratios.

---

## C. Canonical measurement definitions

For a measurement date `T`, the R12M window is months `T−11 … T`.

**Cohort integrity.** Freeze the ARR that existed exactly 12 months earlier: all cohorts with
`acquisitionMonth ≤ T−12`. Follow only that population. Every euro of New ARR created after the
opening date is excluded from the numerator and the denominator alike; it is reported separately
as `newARRExcluded`.

```
Opening ARR   = Σ eligible cohorts' opening ARR in month T−11
Leakage       = Σ eligible cohorts' leakage over months T−11 … T     (churn + contraction)
Expansion     = Σ eligible cohorts' expansion over the same months
Closing ARR   = Σ eligible cohorts' closing ARR in month T

R12M GRR       = (Opening ARR − Churn − Contraction) / Opening ARR
               = (Opening ARR − Leakage) / Opening ARR
R12M Expansion =  Expansion / Opening ARR
R12M NRR       = (Opening ARR + Expansion − Leakage) / Opening ARR
               =  Closing ARR of the eligible cohort / Opening ARR
```

**Denominator convention.** All three use the *frozen opening ARR*, never a moving or average
base. Intra-period expansion enters the numerator of expansion and NRR only; it is never added
to any denominator, and it never appears in the GRR numerator — so expansion cannot improve GRR.

**Churn vs contraction.** v0.2.1 combines them in `leakage`, because the economic engine models
no customer count and therefore cannot distinguish a lost logo from a shrunken one. GRR is
correct either way (both are subtracted); the split is simply unavailable, and is recorded as a
known gap rather than guessed at.

**Reconciliation, asserted every month from T=12 to T=60:**

```
Opening + Expansion − Leakage = Closing eligible ARR      max residual €1.5×10⁻⁸
GRR + Expansion rate = NRR                                max residual 3.3×10⁻¹⁶
```

**A coincidence worth naming.** In this model the chained monthly NRR and the frozen-cohort R12M
NRR agree exactly, and R12M GRR reads the same at T=12, T=24 and T=60. That is a property of
*age-invariant rates*, not of SaaS. Introduce any age dependence and the two measures separate —
which is precisely when a measurement layer starts earning its keep.

---

## D. Inverse calibration — targeting the measured KPIs

**Target A: measured R12M GRR = 90.0%, measured R12M expansion = 10.0%.**

Closed form, no numerical search:

```
NRR* = GRR* + Expansion*            = 100.0000%
m    = NRR*^(1/12)                  = 1.000000000
S    = Σ mᵗ, t = 0..11              = 12.000000
g    = 1 − (1 − GRR*) / S           = 0.991666667
e    = m/g − 1                      = 0.008403361
P    = g¹²                          = 90.445837%
X    = (1+e)¹² − 1                  = 10.563408%
```

**The world must persist better and expand harder than the KPIs report.** To read 90% GRR the
underlying persistence coefficient must be **90.445837%**; to read 10% expansion the underlying
expansion coefficient must be **10.563408%**.

Simulated verification through the measurement engine at T=12:

| | Target | Measured | |
|---|---|---|---|
| R12M GRR | 90.000000% | 90.000000% | PASS |
| R12M expansion | 10.000000% | 10.000000% | PASS |
| R12M NRR | — | **100.000000%** | resulting, not an input |

Acquisition is untouched: New ARR stays €0.750m/month and CAC payback 18.00 months.

---

## E. Matched measured-NRR — retention-heavy vs expansion-heavy

Now defined by **KPI targets**, then calibrated back to transition coefficients.

| | R · retention-heavy | X · expansion-heavy |
|---|---|---|
| **Target** measured R12M GRR | 96.0000% | 90.0000% |
| **Target** measured R12M expansion | 9.6000% | 15.6000% |
| **Target** measured R12M NRR | 105.6000% | 105.6000% |
| → persistence coefficient | 96.168130% | 90.672144% |
| → expansion coefficient | 9.807687% | 16.463553% |
| → monthly multiplier m | **1.004551007** | **1.004551007** |
| **Actual** measured GRR / expansion / NRR | 96.00% / 9.60% / 105.60% | 90.00% / 15.60% / 105.60% |

Economic outcomes:

| | R | X | |
|---|---|---|---|
| Year 1 / 3 / 5 ARR | €30.35m / €52.82m / €77.87m | identical | identical |
| Cumulative gross profit | €190.50m | €190.50m | identical |
| Year 5 EBITA / FCF | €33.70m | €33.70m | identical |
| Ending cash (M60) | €83.50m | €83.50m | identical |
| M60 opening-cohort survival | €26.26m | €26.26m | identical |
| Cumulative expansion | €22.07m | **€35.86m** | differs |
| Cumulative leakage | €9.19m | **€22.99m** | differs |

Max |R − X| over 60 months: closing ARR €4.8×10⁻⁷, cash €6.1×10⁻⁷.

**They remain economically identical under the existing physics — and the measurement layer
sharpens why.** Measured R12M NRR is a stock ratio, so *pinning it pins the monthly multiplier
uniquely*: `m = NRR^(1/12)`, identical in both scenarios to nine decimals. The ARR recursion
consumes nothing but `m`. Equal measured NRR therefore forces equal everything downstream, no
matter how GRR and expansion divide it. The only trace is gross flow: X leaks €13.79m more and
expands €13.79m more, netting to zero.

This is a stronger statement than v0.2's. It was previously "the two coefficient sets happen to
have the same product". It is now: **any two systems reporting the same R12M NRR are identical in
this model, by construction.**

---

## F. What GRR and NRR cannot tell you

GRR and NRR are two scalars summarising a joint distribution over customers × time × price ×
cost. Everything not carried by those two moments is unrecoverable.

### A concrete pair

Arithmetic illustration, **not** simulator output — the model has no customers. Both systems open
with €20.0m across 100 customers at €200k, lose €2.0m, and gain €2.0m of expansion.

| | System A — logo churn | System B — contraction |
|---|---|---|
| How the €2.0m is lost | 10 customers churn entirely | all 100 shrink 10% |
| Closing customers | **90** | **100** |
| Logo retention | **90%** | **100%** |
| Expansion from | 5 survivors, +€400k each | all 100, +€20k each |
| Top-5 share of expansion | **100%** | **5%** |
| Reported R12M GRR | 90.0% | 90.0% |
| Reported R12M NRR | 100.0% | 100.0% |

Same two numbers. One business has lost a tenth of its customers and depends on five accounts for
all its growth; the other has lost none and grows broadly. Their forward economics are not close.

### A second pair — timing

Two systems both losing €2.0m over the year: one in month 1, one in month 12. Identical reported
GRR and NRR. But recognised revenue differs by roughly `€2.0m × 11/12 / 12 ≈ €153k` of monthly
revenue for eleven months, and the cash arrives on completely different dates. R12M GRR and NRR
are blind to when anything happened inside the window.

### Full inventory

| Property | Recoverable from GRR + NRR? | Why |
|---|---|---|
| Number of customers | **No** | Not represented; any ARR can be any number of accounts |
| Logo retention | **No** | Revenue retention and logo retention are independent |
| Distribution of expansion | **No** | €10m from 3 accounts reads the same as from 500 |
| Distribution of churn | **No** | Broad shrinkage reads the same as concentrated loss |
| Concentration | **No** | Requires a within-cohort distribution |
| Customer age / vintage mix | **No** | A 5-year-old base and a 6-month-old base can report identically |
| Timing of churn in the period | **No** | Only the total enters the ratio |
| Timing of expansion | **No** | Same |
| Expansion saturation | **No** | Headroom is invisible to a realised rate |
| Cost of retaining customers | **No** | GRR is a revenue ratio; no cost enters it |
| Cost of generating expansion | **No** | Same — and this is the cheapest gap to close |
| Gross margin by customer | **No** | Only a blended margin exists |
| Contractual duration | **No** | 3 months to renewal reads like 30 months |

The pattern: **GRR and NRR describe what a revenue base did last year; they carry almost nothing
about what it is.** Two scalars cannot encode a distribution, and forward economic value depends
on the distribution.

---

## G. ARR economic-value readiness — the provenance audit

The long-term hypothesis to preserve, stated as an architectural requirement and **not**
implemented:

> Two identical amounts of ARR can contain materially different economic value.
> `Economic value of ARR = PV(expected future economic contribution of the current ARR state)`

No quality score, no risk coefficient, no valuation multiple. The only question for 0.2.1 is:
**does the current architecture preserve enough provenance to compute that later?**

### Preserved today, per cohort, per month

`acquisitionMonth` · `age` · `initialARR` · `openingARR` · `retainedARR` · `leakage` ·
`expansion` · `closingARR` · `revenue` · `grossProfit`, plus running `cumLeakage`,
`cumExpansion`, `cumRevenue`, `cumGrossProfit`, and the full retention history as an unaggregated
monthly series.

Against the brief's list: acquisition cohort ✓ · age ✓ · original ARR ✓ · cumulative expansion ✓ ·
cumulative contraction/leakage ✓ · cumulative gross profit ✓ · retention history ✓.

### Derivable on demand, not stored

Cohort acquisition cost, cohort-level GRR/NRR history, survival ratio, ARR mix by vintage. All
reconstructible from what is stored.

### **At risk — the one real finding**

**Cumulative acquisition cost is not attributed to the cohort it created.** S&M is a company-level
monthly flow. Today it is reconstructible exactly, because `cacPerARR` is a scalar constant and
the cohort born in month *t* cost precisely `initialARR × cacPerARR`. That reconstruction breaks
the moment any of the following happens:

- `cacPerARR` becomes time-varying (a learning curve, or diminishing returns on S&M);
- S&M is split between an acquisition motion and an expansion motion (the recommended next
  experiment does exactly this);
- an acquisition lag is introduced, so month *t*'s spend creates month *t+k*'s cohort.

**Any one of those makes historical acquisition cost per cohort permanently unrecoverable.**
Per the brief the data model has not been expanded — but this is the single field to add before
any of those three changes lands, and it is one line: stamp `acquisitionCost` on the cohort at
creation.

### Not represented at all — physics gaps, not storage gaps

Customer count, logo retention, within-cohort distribution, concentration, churn vs contraction
split, per-cohort gross margin or cost-to-serve, contract duration and renewal dates, expansion
headroom. These cannot be preserved because they are not modelled. Preserving them requires new
physics, not a bigger record — and the matched-NRR result is what tells us which of them to build
first.

### Verdict

**Yes, for everything the model currently represents** — the cohort spine is the right shape, and
nothing computable today is being thrown away. **No, for the things it does not represent**, and
that gap is a modelling decision rather than an accident of storage. One field (`acquisitionCost`)
is on the edge of becoming irrecoverable and should be added before the next physics change, not
after.
