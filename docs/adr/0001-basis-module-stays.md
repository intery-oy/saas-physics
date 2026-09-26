# 1. basis.js stays

Date: 2026-09-26
Status: accepted

## Context

An architecture review proposed deleting `basis.js` on the deletion test. The
case looked strong: 49 lines, of which 21 are comment and 4 are the UMD shim,
wrapping a single expression —

```js
function toBasis(v, basis) { return basis === 'MRR' ? v / MONTHS_PER_YEAR : v; }
```

— behind which the product has a one-line wrapper of its own, `rc()`. The
module's real content looked like the comment above the function, which lists
what must *not* be passed (a period flow, a stock, a ratio, an acquisition
cost) and cannot be enforced from inside a function that only receives a
number.

## Decision

Keep it.

## Consequences

The deletion test asks whether removing a module makes complexity vanish or
makes it reappear across N callers. Applied properly, it says keep:

`basis.js` has two consumers, not one. The product inlines it (`/*__BASIS__*/`),
and `basis-checks.js` requires it as the **oracle** for the BASIS-12X family —
the checks that assert the product does to a number exactly what the rule says.
Delete the module and the rule has to be written twice: once in the page and
once in the suite that checks the page. That is the duplication this same
review removed for the cohort row accessor (seven copies) and the EBITA/FCF
identity (a copy outside the engine that silently went wrong). Re-creating it
here to save 49 lines would be a trade in the wrong direction.

One declaration with two readers is a real seam, not a hypothetical one.

What the review got right, and what is already handled: the eligibility rule
in the comment is unenforceable *inside* `toBasis`. It is enforced outside it,
by the FINANCIAL-INVARIANCE and SCENARIO-INVARIANCE checks in the same suite,
which scan the product for quantities that are run through the basis switch and
should not be. The claim is checked; it is just not checked where it is written.
