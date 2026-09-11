# Product assessment — after A1 + overnight sequence

Dated 11 September 2026. Owner: Harri. This is an instrument review, not a launch plan.

The constitution still holds: one mechanism at a time; null/default reproduces the prior world; bounds before benefits; no auth, valuation, adapter, AI commentary, R&D lag, or deploy-as-product.

---

## 1. What this is now

SaaS Physics is a **single-page educational sparring instrument**. A founder or operator can change one coefficient, watch cash / ARR / FCF / N-group / g-attribution move, and argue about the mechanism — not about a dashboard.

After this build the **default world is unchanged**: one age-0 vintage, €20m ARR, €10m cash, linear S&M, unconstrained spend, FCF = EBITA, free expansion, no customer stock. Year-5 ARR is still **€62,926,223.19**. Engine `modelVersion` is still `'0.4'`. Every overnight coefficient is **opt-in**. If you never touch the new sliders, you are still in the v0.3 / v0.4 default world.

What *is* new is the **optional envelope**:

| Mechanism | Coefficient | Off (null) | On |
|---|---|---|---|
| Acquisition saturation | `acqSaturationSpend` | linear `New ARR = S&M ÷ CAC` | diminishing returns, `k` = half-saturation |
| Opening state | `openingARR` / cash / mix | one €20m / €10m vintage | start from a real-ish book |
| Inverse calibration | `K.calibrate()` | unused | fill opening from Year-5 target + NRR/GRR |
| Cash constrains S&M | `smCashReserve` | spend even if cash is negative | `smEff = min(intended, cash − reserve)` |
| Prepaid billings | `billingAdvanceMonths` | FCF = EBITA | `FCF = EBITA + N×ΔMRR` (smooth, not invoices) |
| Expansion cost | `expansionCacPerARR` | expansion is free | extra expansion costs cash |
| Logo vs contraction | `logoRetentionAnnual` | no customers | customer stock; ARR path **unchanged** |
| Tenure / vintage editor | `expA.bands` | flat 90 / 115 | six sliders; Scenario 6 still owns the historical mix |

The rail is now **crowded**. The physics is still one layer at a time. The UI is not.

**What this is not:** a company operating system, a valuation tool, a CRM adapter, a billing product, or software you can sell tomorrow. There is no auth, no persistence, no deploy URL, no CI. The HTML is a file you open.

---

## 2. First principles — what this is for

Read in this order: `README.md` (constitution), `docs/BRIEF.md` (original ask), `docs/FINDINGS.md` (what the numbers taught), this file (where we are).

### The job

Harri's brief was not "build a SaaS model." It was: **make the hidden physics of a SaaS company inspectable**, so a serious person can spar with it. The instrument should be:

1. **Falsifiable.** A coefficient has a null that reproduces the previous world. A check suite fails if the default drifts.
2. **One mechanism at a time.** You can attribute a cash or ARR move to a named law. If two things move at once, you cannot learn.
3. **Honest about what it cannot say.** Persistence is not logo retention. Billings are not invoices. Saturation is not a TAM. Calibration is not a forecast.
4. **Educational first, respected software later.** The credible path to "respected" is *more true mechanisms, tighter language, fewer overclaims* — not a login screen.

### What the philosophy forbids (still)

- Auth, billing-as-product, pricing pages, deploy-as-SaaS.
- Valuation, DCF, "what is this company worth."
- Adapter / CRM / ERP import as a product surface.
- AI commentary that explains the chart.
- R&D lag, or any coefficient that pretends the engine knows a delay it does not compute.

Those are not "later on this branch." They are a different project. Shipping them now would make the demo look like a product and the physics look like a feature list.

### What the overnight sequence was for

The v0.3 world was internally consistent and **structurally deaf** to several things a CFO would ask first: "what if we already have a book?", "why can we spend S&M we do not have?", "why is FCF identical to EBITA?", "why is expansion free?", "how many customers is this?", "can I see the vintage mix?"

Each of those is a **bound or a split**, not a benefit. The sequence (A1, then opening, then cash, then billings, then expansion cost, then logos, then the age editor) is the constitution applied to the blocked-CFO list. Nothing in that list required commercialization.

---

## 3. Assessment — instrument quality after this build

### What got better

- **The default world is still a scientific instrument.** 66/66 integrity. Opening / cash / billings / expansion / logo / age suites all green. Playwright smoke of the six new surfaces: 11/11.
- **A serious person can now turn on one bound and see it.** Cash can stop S&M. Expansion can cost money. Logos can exist without rewriting ARR. Opening can be a real book. Tenure can be edited without opening Scenario 6.
- **The language on screen is mostly still honest.** Waterfall now always has EBITA / Δ deferred / Expansion cost / FCF, so Base and Experiment have the same step count. Logo vs contraction is labeled as a split of persistence leakage, not a second churn engine.

### What got worse, or is now the binding constraint

- **The right rail is a pile.** Opening state, inverse calibration, saturation, cash reserve, billing advance, expansion CAC, logo retention + ARPA, tenure editor (six sliders). A new user cannot tell which sliders are "the company" and which are "a bound you probably want off." This is the highest-leverage product defect in the demo. It is not a missing coefficient.
- **Several demos overclaim if you read the label and not the footnote.** Listed in §4. The engine is careful. The UI is one sentence away from lying.
- **Attribution still only holds on the default opening + flat bands.** The N-group grew (`acqSaturationSpend`, `smCashReserve`) but billing and expansion CAC are cash-only and correctly excluded. The moment you load a vintage mix or edit tenure, N and g are not the story. The UI does not shout this loudly enough.
- **`systemstate.js` / `pulse.js` still assume FCF ≈ EBITA.** They are consistent with each other and with the *default* world. They are not consistent with a turned-on billing or expansion-CAC lever. Do not "fix" one without the other.
- **No portable Playwright in-repo.** Clarity/attribution accept tests are still machine-local. The overnight smoke lives at `/tmp/verify-overnight.js` and is not a product artifact.
- **PRESETS is still dead code.** `visual.template.html` is still a graveyard. Neither is the instrument.

### Verdict

The **engine** is in the best shape it has been: default locked, optional bounds real, checks named after the mechanism they protect.

The **product** (the thing a human opens) is a **working lab bench with too many knobs on one panel**. That is the correct state after a physics sprint. It is the wrong state to keep if the next goal is "someone who is not Harri can use this for an hour and not get the wrong idea."

It is **not** ready to be respected commercial software. It is **ready** to be a sharper educational instrument, if the next work is craft and language rather than more coefficients or a shopfront.

---

## 4. Overclaims and demo risks (read before showing anyone)

These are not bugs in the default world. They are ways the *optional* surfaces lie if you talk faster than the model.

1. **Prepaid billings are not invoices.** `FCF = EBITA + N×ΔMRR` is a smooth working-capital approximation. There is no invoice calendar, no annual-contract lump, no collections lag, no refund. Do not demo this as "we now model deferred revenue the way the auditor does." Finding #18.

2. **Logo retention does not change ARR.** Persistence still drives leakage. The split is *disclosure*: lost-logo ARR (at opening ARPA) vs contraction (the residual). A book with 98% logo retention and 90% persistence will still leak 10% of ARR, labeled mostly as contraction. Easy to present as "our logos are fine." Finding #19.

3. **Vintage mix under flat laws does nothing.** Age weights only matter when tenure is non-flat (or Scenario 6). Editing the mix with the default 90/115 bands is a no-op on ARR and cash. Do not demo the pie as "see, older customers are more valuable" unless the bands say so.

4. **Calibration is not a forecast.** `K.calibrate()` solves a 60-month inverse from a Year-5 target under *flat* laws and the current N/g levers. It will refuse (or should be treated as meaningless) the moment bands are non-flat. It does not know your actual history.

5. **Saturation is not a market.** `k` is a half-saturation spend. It does not care about TAM, competitors, or brand. Gross margin is still absent from the generator. Payback is still a *derived* month-count, not an input.

6. **Cash reserve = 0 in the engine is "constrain at €0."** The UI slider at 0 writes `null` (unconstrained). You cannot set "spend only the cash you have, no reserve" from the slider. That is a UI hole, not a physics hole.

7. **Opening deferred is `openingMRR × N/2`.** A made-up mid-point, not a trial balance. Say so if anyone asks "where did opening deferred come from?"

8. **Matched-NRR / extra-expansion still assumes expansion is free unless `expansionCacPerARR` is on.** The Scenario 5 "free lunch" is now optional to tax. The default of that scenario is still the free lunch.

9. **After Scenario 6, moving a force may leave `SCEN6_BANDS` on the experiment.** Pre-existing. The tenure editor copies; it does not own Scenario 6's lock. Clear the scenario before treating the sliders as a clean experiment.

10. **Year-5 ARR €62.9m is a locked default, not a company.** Do not quote it as a result about SaaS. It is the checksum that the default world did not drift.

---

## 5. Forward roadmap — sequenced, not a dump

Two tracks. Do not interleave them in the same sitting if you can help it. Do not start a third track (commercialization).

### (a) Instrument / product craft

**Next, in this order:**

1. **Language and grouping on the existing rail.** Separate "the company" (opening, tenure, mix) from "bounds that are off by default" (saturation, cash reserve, billing, expansion CAC, logos). One sentence per bound stating the null. This is craft, not a new coefficient. Highest leverage for not overclaiming.

2. **Attribution honesty.** When `expStart` is set or bands are non-flat, disable or clearly mark N / g / waterfall-as-attribution. The numbers are still computed; they are no longer *the* story.

3. **`systemstate.js` / `pulse.js` contract.** Either keep them default-only and say so on the pulse strip, or extend both together so FCF ≠ EBITA when billing / expansion CAC is on. Do not patch one file.

4. **Portable accept tests in-repo.** The overnight smoke belongs next to `clarity-accept.js`, with Chromium resolvable on a clean machine. Until then, "the UI works" is a laptop fact.

5. **Then, and only then, the next physics — one at a time, null-default:**
   - Expansion saturation (same diminishing-returns shape as A1, own `k`).
   - Acquisition lag (hire → capacity, not spend → ARR in the same month).
   - Price as a first-class lever (ARPA is currently a logo *unit*, not a price law).
   - R&D as an intervention with a stated delay — **not** until the instrument can show a delay without lying.

   Do **not** do: valuation, adapter, AI commentary, auth.

**Stop conditions for (a):** if a new coefficient cannot name its null, or cannot be turned off without changing Year-5 ARR, it does not ship.

### (b) Visual look / UX of the demo

The demo should look like a **lab instrument**, not a SaaS marketing site and not a Bloomberg terminal. Current look is "dense dark dashboard." That is fine for Harri. It is hostile for a guest.

**Next, in this order:**

1. **Information architecture, not paint.** Group the rail (see a.1). Collapse "bounds" behind a single "optional laws" disclosure, default closed. Keep forces (S&M, persistence, NRR, …) visible. A guest should see six things, not twenty.

2. **One claim per chart, restated.** Above the ARR chart: what is moving and what is held. Above the waterfall: "cash walk, not valuation." Above logos: "split of persistence leakage; ARR unchanged." The findings already have the sentences; they are not on the glass.

3. **Then typography and space.** The design system already has Geist, the green/red force language, and a dark field. Use more whitespace and fewer simultaneous series before changing the palette. Do not add a new accent color to signal "product."

4. **Empty / off states.** When a bound is null, the extra waterfall rows can stay (alignment) but the KPI chips for logos / deferred / expansion cost should read "off" rather than "0.00," so zero is not confused with "we measured nothing."

5. **Last: a guest path.** A 60-second scripted tour that turns on *one* bound, shows the check-sum (default ARR unchanged), then the bound. Not a marketing funnel. Not a signup.

**Do not do in (b):** a landing page, a pricing table, a "get started" auth wall, a deploy-as-product, a mobile app. Those are commercialization.

---

## 6. What I would tell you at 8am

The overnight did the job it was given. The default world did not drift. Each bound is optional and checked. The constitution was not traded for a feature list.

The instrument is now **easy to misuse in a meeting** because the new knobs look like a product and some of their labels are one noun away from a lie (billings, logos, calibration, mix). The next honest work is **grouping, language, and not adding another coefficient until a guest can use the ones we have without being misled.**

Leave commercialization closed.
