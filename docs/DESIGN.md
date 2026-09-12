# Design tokens — indigo instrument

SaaS Physics v1 is a **management / lab instrument**: one colour, one visual grammar, one question per section. Chrome and charts share the tokens below. Physics is unchanged.

Defined in `v1.template.html` `:root` (CSS) and the matching `THEME` object (canvas). Future views should inherit these rather than invent a second palette.

## Surfaces

| Token | Value | Use |
|---|---|---|
| `--ground` | `#eef1f5` | Page canvas — very light cool grey |
| `--scene` | `#f4f6f9` | Chart / stage ground |
| `--panel` / `--raised` | `#ffffff` | Rails, cards, header, table surface |
| `--sunk` | `#f1f3f7` | Recessed chips, nav track, hover wash |
| `--line` | `#d4dae4` | Thin cool-grey borders |
| `--line-soft` | `#e4e8ef` | Hairline row rules |
| `--radius` | `4px` | Modest; no drop shadows |

## Ink

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1c2430` | Charcoal primary text |
| `--ink-2` | `#3d4756` | Secondary |
| `--ink-3` | `#5c6675` | Labels, eyebrows |
| `--ink-4` | `#8b93a0` | Axes, hints, inactive |

## Indigo (the one colour)

Darker indigo = hierarchy, primary actions, key data, the Experiment series. Muted indigo / slate = Base, context, leakage, deductions.

| Token | Value |
|---|---|
| `--indigo-900` … `--indigo-50` | `#1e2a4a` → `#eef0f7` |
| `--exp` | `--indigo-700` `#31407a` |
| `--base` | `--indigo-300` `#8d9ad0` |
| `--leak` / `--churn` | `--indigo-200` / `--indigo-400` |

Vintage strata use the same indigo ramp, oldest darkest → newest lightest.

## Semantic colour (text deltas only)

| Token | Value | Use |
|---|---|---|
| `--good` | `#1f7a4d` | Favourable **text** delta vs Base |
| `--bad` | `#b42318` | Unfavourable **text** delta vs Base |

Never green/red on chart fills, areas, bars, pipes, or chrome.

## Type

Inter throughout. Hierarchy is scale, weight, and spacing. Financial figures use `font-variant-numeric: tabular-nums` (set on `body`). No second display face.

## What this is not

Not a generic SaaS dashboard, accounting report, or marketing site. Tokens are for this instrument only — they do not import Frends portal IA (LAND/RAMP/RETAIN, dual engines, portal cards, Signals, board-report theses).

## Identity chrome

Nav carries thin chips, not a disclaimer banner: `Default|A|B` · `M##` · scenario · `Base|Exp`. **Default** is the immutable reference world. **A|B** marks a scenario-constructed pair (never rename Default to mean a local scenario base). **Base|Exp** is the reading. View-only controls (Compare, Basis, Leakage shadow) sit in a separate cluster from assumption rails. Ordered chips under the header walk Frame → Sc5 → Company → Sc6 / Cohorts → System → Appendix → Close (`#guide/sc5`, `#guide/sc6`) without adding a second product mode. Sc5 pins the Capital≠ARR ledger on the Scenarios stage; Close is a binding-driver cockpit. Frame and Close add a thin pack strip (load / save / diff / leave-behind) — not a CRM. See `docs/TRUST-SPINE.md` and `docs/PACK.md`.
