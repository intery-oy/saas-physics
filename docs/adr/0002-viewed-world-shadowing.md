# 2. The viewed-world shadowing stays, held by a check

Date: 2026-09-26
Status: accepted

## Context

Twenty functions in `v1.template.html` open with the same 250-character line:

```js
var V_ = VW(), expRes = V_.res, expS = V_.S, expA = V_.A, expStart = V_.start,
    baseRes = V_.oRes, baseS = V_.oS, baseA = V_.oA, baseStart = V_.oStart;
```

It rebinds `expRes` / `expA` / `baseRes` / `baseA` to the **viewed** world — Base
or Experiment, whichever the reader chose. Everywhere else in the file those same
names mean the **Experiment**. Nothing at a call site distinguishes them, and
`syncForces` had bound the same four names to a **third** thing: the control
target's world.

An architecture review proposed removing the shadowing: return the viewed world
as a value from one accessor and have callers read `w.res`.

## Decision

Fix the third meaning. Keep the shadowing. Hold it with checks.

## Consequences

Removing the shadowing means rewriting the bodies of twenty functions, one of
which (`drawSystem`) is over a thousand lines, touching several hundred bare
references to four names. There is no safe mechanical form of that edit: a
blanket rename cannot distinguish the local from the global, because they are
the same token, and the alternative — renaming the globals instead — requires
knowing which references fall inside the twenty and which do not, which needs a
parser, not a regex.

What makes that unattractive is not the size. It is that the regression such an
edit would cause is a *rendering* difference, and the assertions that catch
rendering differences are `viewing-accept`'s INVARIANT and `company-accept`'s
VALUES — the two pixel-comparison checks with a measured, pre-existing ~25%
failure rate. Refactoring the surface those checks guard, while those checks
cannot be trusted to a single run, means doing the one edit whose safety net has
a hole in it. The pixel flake should be root-caused first.

Done instead, and it removes the real trap:

- `syncForces` binds `tgtA` / `tgtRes` / `refA` / `refRes`. The third meaning is
  gone, and the comment says what those are.
- Two checks in `clarity-checks.js`, each made to fail first:
  - **VIEWED-WORLD** — all twenty preambles are byte-identical. Twenty copies
    are only safe while they agree; the check reports the line numbers of any
    that do not.
  - **VIEWED-WORLD** — nothing rebinds those four names except the preamble, so
    a fourth meaning cannot be introduced silently the way the third was.

The duplication remains and is now visible and held. When the pixel checks are
trustworthy, the interface change in the review is the right next step.
