# Plan: DM.10: Icons

- **Spec:** #148 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

`Icon` gains twelve entries in `PATHS`, copied from the Icons section of `design/source/style-3-foundations.html`, and a `size` prop (`16 | 18 | 20 | 24`, default 18; D1) that sets `width` and `height`. The shared `strokeWidth` drops from 2.2 to 2 (Spec D1). Keys follow the existing camelCase (`cloudOff`), so `zoom-in` is `zoomIn`. `alert` and `done` copy the board's paths, which match `error` and `success` today, as separate entries so either can change alone (Spec D2). `values.ts` gains `ICONS`, the twelve names and board labels ("zoom in") in board order. The page fills the Icons section with the h2, the board's line of copy and a six-column grid of tiles in `--surface-2` with `--radius-control`, each an `Icon` over a caption.

## Decisions

**D1 · Tile icon size** · Decides: Tech lead
**Answer: C** (Tech lead)
The board draws tile icons at 24px; the Spec allows 16, 18 or 20.

- **A.** Tile CSS draws the svg at 24px; `Icon` keeps 16, 18 and 20.
- **B.** Tiles use size 20; the PR lists the 4px gap as a difference.
- **C.** Add 24 to `size`; I reword the Spec's size line and check.
- **Other:** your own.

Recommended: A, because it matches the snapshot without widening the API that screens use.

**D2 · Play is filled** · Decides: Tech lead
**Answer: A** (Tech lead)
The board's `play` is a filled triangle with no stroke; the Spec says every icon draws at stroke 2.

- **A.** `play` fills in `currentColor` with no stroke; I reword the Spec's line to "every outline icon".
- **B.** `play` is an outline triangle at stroke 2; the PR lists the difference.
- **Other:** your own.

Recommended: A, because it matches the board, and a filled triangle reads as Play at 16px.

## Files that change

| File                                                     | New / changed | What                                              |
| -------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `app/components/Icon.tsx`                                | Changed       | Twelve paths, `size`, stroke 2                    |
| `app/components/__tests__/Icon.test.tsx`                 | New           | Size, `aria-hidden`, `currentColor`, stroke 2     |
| `app/design-kit/foundations/values.ts`                   | Changed       | `ICONS`                                           |
| `app/design-kit/foundations/page.tsx`, `page.module.css` | Changed       | Icons section and tiles; drop the empty-area rule |
| `app/design-kit/foundations/__tests__/page.test.tsx`     | Changed       | Five headings; twelve tiles and names in order    |
| `app/design-kit/foundations/__tests__/values.test.ts`    | Changed       | Each `ICONS` name is an `IconName`                |
| `design/screens.json`                                    | Changed       | Drop the `style-3-foundations` ignore region      |

## Order of work

1. `Icon`: `size`, stroke 2, the twelve paths; `Icon.test.tsx`.
2. `ICONS` and the Icons section; update the page tests.
3. Drop the ignore region; run `npm run design:check` on both boards and list the differences in the PR.
4. Lint, format, `npm test`, `npm run e2e`, `npm run build`, `npm run validate:boundaries`.

## Risks

- Stroke 2 thins every existing `Icon` in Alert, Banner, Toast and TextField; the feedback board draws them at 2.2, so its design check drifts slightly. I list it in the PR.
- The board mixes strokes (fit, layers, export 1.8; back 2.2) and omits round caps or joins on a few icons. Drawing all at 2 with round both shows as small pixel differences, listed in the PR.
- The tile caption is 12.5px (`caption`); the board's is 12px. Listed in the PR.

## Proof

| Acceptance check                                      | Proven by                                            |
| ----------------------------------------------------- | ---------------------------------------------------- |
| Twelve tiles with icons and names in board order      | `page.test.tsx`                                      |
| Size 16, 18, 20 or 24 sets the svg's width and height | `Icon.test.tsx`, each size and the default           |
| Each icon is `aria-hidden` and draws in currentColor  | `Icon.test.tsx`, looping over all names              |
| Error and warning draw at stroke 2                    | `Icon.test.tsx`                                      |
| No ignore region; differences listed                  | `screens.json` diff; `design:check` report in the PR |
| Test, e2e and build pass at 100% coverage             | Pasted output in the PR                              |

## Out of scope

- Moving `DateDock` and `IconButton` glyphs onto `Icon` (screen Specs).
