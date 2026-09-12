# Trust spine — v1 chrome and voice

Status: landed on the Trust-spine PR. No new coefficients. Engine decides; UI narrates.

## Vocabulary

| Word | Means |
|---|---|
| **Default** | Immutable reference world (`DEFAULT_ASSUMPTIONS`). Never a local scenario base. |
| **A / B** | Scenario-constructed pair (Scenario 5 efficiency vs spend; Scenario 6 two states). |
| **Base / Exp** | Reading of the current run, not a world rename. |
| Vintage reading / Carry·leak / unmodeled link / conceal variation | Preferred. Never “honesty” / “lying”. |

Money display stays **€000** on Appendix / Cohorts. Bridges foot at displayed €k and print a residual if rounding does not.

## What the chips are

Every view: `Default` or `A|B` · `M##` · scenario name · `Base|Exp`, plus a reserve chip (`no operating constraint binding` when the cash-reserve valve is off).

Not a PE disclaimer paragraph. Not a CHANGE card.

## Surfaces

- **Company** — state at selected month; stock-flow identity + composition + derived measures. Closing ARR/MRR stock ≠ annualized midpoint revenue. **GP by origin** (`capital.js` `gpByVintage`: opening base / earlier acquisitions / this month) and **capital recovery** (`portfolioCapital`: deployed → recovered → outstanding) sit on the side as stock-flow, not a KPI tile wall. Canvas payback track still expands for Scenario 5 and a pinned cohort.
- **System** — valves show annual input → monthly applied → measured. Unmodeled links named as such. Saturation contrast uses `derived.newARRLinear` when k is on. Compact GP-by-origin / capital-outstanding reading on the side (same `capital.js` objects as Company).
- **Scenario 5** — A/B input ledger + one consequence (ending Model cash) + pinned existing bounds (linear acquisition; cash does not constrain spend). Guided Sc5 and the Scenarios stage pin that proof on the glass so it cannot be a side-panel footnote.
- **Cohorts** — Lands on age. Default/flat is a null-check. Age-mechanism / flagship reading when tenure is live (Scenario 6 at M12). Seeded opening ≠ comparable births. Logo vs contraction when the logo bound is on. Composition remains a provenance toggle, not the hero.
- **Appendix** — selected month auto-scrolls; compact `M(t−1) → flows → M(t)` audit. Empty Logos group hidden while the logo bound is off.
- **Close** — Sensitivity cockpit: 2–3 sliders on binding drivers only (S&M, persistence, plus expansion or the active System constraint). Bind chip and Company / System views update live. Non-binders are not offered. If the session is still on Scenario 6’s band laws, Close restores Default so scalar binders actually bind. Compact GP-by-origin / capital-outstanding strip on the Close bar; live chips include capital still out and installed-base GP share.

Optional bounds stay on the rail behind **Optional bounds · off at Default**.

## Ordered chips

Thin step chips under the header — not a second mode, not Partner/Lab branding:

`Frame → Sc5 (Capital≠ARR) → Company → Sc6 / Cohorts → System → Appendix → Close`

Deep-links: `#guide/sc5`, `#guide/sc6`, `#guide/appendix`. Close is a binding-driver cockpit plus GP/capital stock-flow and data-room asks, not a disclaimer banner. Identity chips stay the world / month / scenario / reading. Reserve chip and System Cash→S&M callout share one `reserveState()`.
