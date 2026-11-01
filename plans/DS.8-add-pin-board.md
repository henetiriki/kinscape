# Plan: DS.8: An Add a pin board with real controls, through to a built page

- **Spec:** #451
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

For a board with `<x-import>`, `prepare()` points its React 18, `tokens.css`, `bundle.css` and `bundle.js` references at `node_modules/react{,-dom}-18/umd/` and `design/canvas/project/ds/kinscape/`. After `fillTemplate`, in-page `mountImports` renders each `<x-import>` from `window.KinScape`. `inlineStyles` then writes into each rendered element's `style` the computed values of the longhands its `bundle.css` rules declare (no custom properties or pseudo-elements; `rgba(0, 0, 0, 0)` as `transparent`), and writes out every `var()` in `style` attributes, as `calc()` is today. `pageHtml` unwraps `<x-import>`; `FORBIDDEN` gains `x-import`. Other boards skip both steps.

The page is `Stage` with only `panel` filled and no map; both boards place the panel there.

## Components

| Part                         | Component                                                          |
| ---------------------------- | ------------------------------------------------------------------ |
| Frame                        | `Stage` panel slot (`features/map`)                                |
| Panel                        | `Surface` raised, `sheet` on a phone via `usePhone` (`foundation`) |
| Person, Place, Address       | `TextField` (`forms`)                                              |
| Event type                   | `ChipGroup` (`actions`), `EVENT_ORDER` (`lib/ui`)                  |
| "From"                       | `Text` `label` (`foundation`)                                      |
| Date `1901-02-30`            | `DateField`, `fill` on a phone (`features/map/components`)         |
| "Overlaps another residence" | `Alert` warning (`feedback`)                                       |
| Save pin, Cancel             | `Button` primary, secondary; `full` on a phone (`actions`)         |

## Decisions

**D1 · Where the page lives** · Decides: Tech lead

Every `/design-kit` page gets a 61px banner; the boards have none.

- **A.** `/screens/add-pin`: dev-only, 404 in production like the kit, no banner.
- **B.** `/design-kit/add-pin`, with the kit's pages moved into a banner route group.
- **C.** `/design-kit/add-pin`, drawn over the banner.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the test board is exported** · Decides: Tech lead

jsdom resolves no `var()` and computes no cascade; the `test` job has no browser.

- **A.** `e2e/design-export.spec.mts` exports the test board in Chromium with the real bundle; jsdom unit tests cover the new functions' branches.
- **B.** Vitest launches Chromium; the `test` job must install it (a code-owner workflow change).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Who builds the page** · Decides: Tech lead

The agent in Actions can't read the canvas.

- **A.** The tech lead's signed-in session builds it from the handoff, on this branch; failing that, from `design/source/add-pin*.html` (#447 D2 A). The PR records which.
- **B.** The agent builds from the snapshots; the handoff is only tried.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The phone board** · Decides: Tech lead

- **A.** In scope: `add-pin-phone`, 390 × 844.
- **B.** Desktop only.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                           | New / changed | What                                                               |
| -------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `scripts/design-export.mts`                                    | changed       | `prepare`, `mountImports`, `inlineStyles`, `pageHtml`, `FORBIDDEN` |
| `scripts/__tests__/design-export.test.ts`                      | changed       | New functions; 50 → 52 snapshots                                   |
| `e2e/design-export.spec.mts`                                   | new           | The test board (D2)                                                |
| `app/screens/layout.tsx`                                       | new           | 404 in production                                                  |
| `app/screens/add-pin/page.tsx`, `AddPinPanel.tsx`, `__tests__` | new           | The page                                                           |
| `features/map/index.ts`                                        | changed       | Export `Stage`, `DateField`                                        |
| `design/screens.json`                                          | changed       | `add-pin`, `add-pin-phone`                                         |
| `design/DESIGN.md`, `docs/architecture.md`                     | changed       | Two Screens rows; `/screens`                                       |
| `design/canvas/**`                                             | changed       | Copy; two `export.json` entries                                    |
| `design/source/add-pin*.html`, `design/add-pin*.jpg`           | new           | Shots workflow                                                     |

## Order of work

1. **Tech lead:** boards, screenshot, copy refresh. Done.
2. **Red first:** add both `export.json` entries, unpushed. The tech lead runs `npm run design:export`; the failure goes in the PR's Evidence.
3. **Agent:** exporter tests first, then code; `design:export` prints only `Rewrote: add-pin, add-pin-phone`. Push; run the shots workflow.
4. **Page** (D3), `screens.json`, doc rows; `/match-design` for both.
5. `AGENTS.md` checks.

## Proof

| Acceptance check                      | Proven by                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Save pin shows as `KinScape.Button`   | Tech lead's screenshot                                                      |
| Snapshots clean; others unchanged     | `design:export` output; "matches committed snapshots" test; `e2e` re-export |
| Test board exports as rendered HTML   | `e2e/design-export.spec.mts`                                                |
| `/screens/add-pin` passes, both sizes | `npm run design:check -- -g "design: add-pin"`                              |
| Lint, `format:check`, `words`, tests  | Output pasted in the PR                                                     |

## Out of scope

The kit nav; Layers and Filters panels on `/screens`.

## Deviations

- Two CSS modules: `AddPinPanel.module.css`, `layout.module.css`.
- `tsconfig.json` now includes `.mts`.
- `lib/design/__tests__/design.test.ts` counts 52 snapshots.
- The e2e spec is `.mts`: Playwright loads `.ts` specs as CommonJS, which can't import `design-export.mts`.
