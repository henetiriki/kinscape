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

`/design-kit` pages have a 61px banner; boards have none.

- **A.** `/screens/add-pin`: dev-only, 404 in production like the kit, no banner.
- **B.** `/design-kit/add-pin`, with the kit's pages moved into a banner route group.
- **C.** `/design-kit/add-pin`, drawn over the banner.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the test board is exported** · Decides: Tech lead

jsdom resolves no `var()`; the `test` job has no browser.

- **A.** `e2e/design-export.spec.mts` exports it in Chromium; jsdom unit tests cover the branches.
- **B.** Vitest launches Chromium (a code-owner workflow change).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Who builds the page** · Decides: Tech lead

The Actions agent can't read the canvas.

- **A.** The tech lead's signed-in session builds it from the handoff, on this branch; failing that, from `design/source/add-pin*.html`. The PR records which.
- **B.** The agent builds from the snapshots.
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
| `lib/design/__tests__/design.test.ts`                          | changed       | 50 → 52 snapshots                                                  |
| `scripts/layers.mts` and its test                              | changed       | `app/screens/` dev-only                                            |
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
2. **Red first:** `design:export` fails on the new entries; the failure goes in Evidence.
3. **Agent:** exporter tests, then code; run the shots workflow.
4. **Page** (D3), `screens.json`, doc rows; `/match-design`.

## Proof

| Acceptance check                      | Proven by                                           |
| ------------------------------------- | --------------------------------------------------- |
| Save pin shows as `KinScape.Button`   | Tech lead's screenshot                              |
| Snapshots clean; others unchanged     | `design:export`; "matches committed snapshots" test |
| Test board exports as rendered HTML   | `e2e/design-export.spec.mts`                        |
| `/screens/add-pin` passes, both sizes | `npm run design:check -- -g "design: add-pin"`      |
| Lint, `format:check`, `words`, tests  | Output pasted in the PR                             |

## Out of scope

The kit nav; other `/screens` panels.

## Deviations

- Two CSS modules; `tsconfig.json` includes `.mts`.
- `app/screens/` is dev-only like `app/design-kit/` in `architecture.md`, `DESIGN.md` and `layers.mts`.
- A styled `<x-import>` stays a `<div>`; `inlineStyles` adds `tokens.css` classes, skips `animation*`, `transition*`; `fillTemplate`, `designSystem`, `exportSnapshots`, `main` change.
- The export throws on an empty `var()` or on `<x-import>` without the bundle.
- The shots workflow re-encoded `map-districts.jpg` and `map-sources.jpg`; content unchanged.
- The e2e spec is `.mts`: Playwright loads `.ts` as CommonJS, which can't import `design-export.mts`.
