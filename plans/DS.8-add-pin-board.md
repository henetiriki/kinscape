# Plan: DS.8: An Add a pin board with real controls, through to a built page

- **Spec:** #451
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

For a board with `<x-import>`, `prepare()` points its React 18, `tokens.css`, `bundle.css` and `bundle.js` references at `node_modules/react{,-dom}-18/umd/` and `design/canvas/project/ds/kinscape/`. After `fillTemplate`, a new in-page `mountImports` renders each `<x-import>` from `window.KinScape` and flushes. A new `inlineStyles` then writes into each rendered element's `style` the computed values of the longhands that its matching `bundle.css` rules declare (D3 on #451): no custom properties, no pseudo-elements, `rgba(0, 0, 0, 0)` written as `transparent`. It also writes out every `var()` in `style` attributes, as `calc()` is today. `pageHtml` unwraps `<x-import>`; `FORBIDDEN` gains `x-import`. Other boards skip both steps.

## Components

| Part                         | Component                                         |
| ---------------------------- | ------------------------------------------------- |
| Kit banner                   | `KitNav`, `KitTitle` (layout)                     |
| Panel                        | `Surface` raised (`foundation`)                   |
| Person, Place, Address       | `TextField` (`forms`)                             |
| Event type                   | `ChipGroup` (`actions`), `EVENT_ORDER` (`lib/ui`) |
| "From"                       | `Text` `label` (`foundation`)                     |
| Date `1901-02-30`            | `DateField` (`features/map/components`)           |
| "Overlaps another residence" | `Alert` warning (`feedback`)                      |
| Save pin, Cancel             | `Button` primary, secondary (`actions`)           |

## Decisions

**D1 · The kit banner** · Decides: Tech lead

Every `/design-kit` page gets the kit banner from `layout.tsx`; the SG boards draw it by hand.

- **A.** The board draws the banner as SG-Feedback does, with token variables, and places the panel below it.
- **B.** The board leaves the banner's band empty; `screens.json` ignores it.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the test board is exported** · Decides: Tech lead

jsdom resolves no `var()` and computes no cascade; the `test` job has no browser.

- **A.** `e2e/design-export.spec.ts` exports the test board in Chromium with the real bundle; jsdom unit tests cover the new functions' branches.
- **B.** Vitest launches Chromium; the `test` job must install it (a code-owner workflow change).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Who builds the page** · Decides: Tech lead

The agent in Actions can't read the canvas.

- **A.** The tech lead's signed-in Claude Code session builds it from the handoff prompt, on this branch; failing that, the agent builds from `design/source/add-pin.html` (#447 D2 A). The PR records which.
- **B.** The agent builds from the snapshot; the handoff is only tried.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                            | New / changed | What                                                               |
| ------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `scripts/design-export.mts`                                                     | changed       | `prepare`, `mountImports`, `inlineStyles`, `pageHtml`, `FORBIDDEN` |
| `scripts/__tests__/design-export.test.ts`                                       | changed       | New functions; 50 → 51 snapshots                                   |
| `e2e/design-export.spec.ts`                                                     | new           | The test board (D2)                                                |
| `app/design-kit/add-pin/page.tsx`, `page.module.css`, `__tests__/page.test.tsx` | new           | The page                                                           |
| `design/screens.json`                                                           | changed       | `add-pin`, 1440 × 900                                              |
| `design/DESIGN.md`                                                              | changed       | Screens row "Add a pin (provisional)"                              |
| `design/canvas/**`                                                              | changed       | The tech lead's copy and `export.json` entry                       |
| `design/source/add-pin.html`, `design/add-pin.jpg`                              | new           | Design agent shots workflow                                        |

## Order of work

1. **Tech lead, signed in:** draw the board (D1), screenshot Save pin selected, refresh the copy, add the `add-pin` entry to `export.json` (`design/canvas/` is theirs), commit and push.
2. **Agent:** exporter tests first, then code; `design:export` must print only `Rewrote: add-pin`. Run the Design agent shots workflow.
3. **Page** (D3), `screens.json`, the `DESIGN.md` row; `/match-design add-pin`.
4. The checks in `AGENTS.md`.

## Risks

- How `<x-import>` takes props is unknown until step 1. If the board sets them from its script in a way the exporter can't replay, stop (rule 6).
- Only declared longhands are written, so browser defaults stay out; any value outside `tokens.json` fails the export by name.

## Proof

| Acceptance check                                        | Proven by                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| Save pin shows as `KinScape.Button`                     | Tech lead's screenshot                                                      |
| Snapshot clean; others unchanged                        | `design:export` output; "matches committed snapshots" test; `e2e` re-export |
| Test board exports as rendered HTML with written values | `e2e/design-export.spec.ts`                                                 |
| `/design-kit/add-pin` passes the design check           | `npm run design:check -- -g "design: add-pin"`                              |
| Lint, `format:check`, `words`, tests, e2e               | Output pasted in the PR                                                     |
