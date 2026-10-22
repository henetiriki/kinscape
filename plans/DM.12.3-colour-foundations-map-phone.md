# Plan: DM.12.3: Colour, Foundations and Map style boards on a phone

- **Spec:** #154 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

Like DM.12.2: CSS only, plus one label span per Map style field. Each board's module gets one block under `(max-width: 639.98px), (max-height: 499.98px)` (#104 D1): padding `var(--space-32) var(--size-gutter-phone) var(--space-48)` as in the snapshots, no `min-height`. The 28px title and one-column notes already come from `kit.module.css` (DM.12.2 D2 A). Desktop rules are untouched.

- **Colour:** heading and note stack; swatches in two columns; system colours one column.
- **Foundations:** columns stack; spacing rows `48px 1fr`, the use under the bar; radii in three columns; elevation cards one column; icons in four; motion rows put title and value on one line, the use below.
- **Map style:** intro and legend stack; the heading row hides; each row becomes a card (grid areas): number, preview, then id over type; Source / filter, Key properties and Covers below as `104px 1fr` rows, each with its label, shown only on a phone. The code sample keeps `overflow-x: auto`.

## Decisions

**D1 · The Map style card's first line** · Decides: PO
The Spec says "the preview at left (104px), then the number". The snapshot puts the number first, then an 80px preview, then id over type; 104px is the width of the field labels.

- **A.** Follow the snapshot; the Spec's line becomes "the number, the preview, then id over type; the other fields below with 104px labels".
- **B.** Follow the Spec; the design check lists the difference.
- **Other:** your own.

**Answer: A** (@henetiriki).

**D2 · The Colour phone entry's height** · Decides: Tech lead
The Spec gives `style-2-colour-phone` 390 × 3613; `style-2-colour-phone.jpg` is 390 × 4552. The other two match their mockups.

- **A.** 390 × 4552, and the Spec's line says so.
- **B.** 390 × 3613; the check compares the top 79% of the board.
- **Other:** your own.

**Answer: A** (@henetiriki).

## Files that change

| File                                                   | New / changed | What                               |
| ------------------------------------------------------ | ------------- | ---------------------------------- |
| `app/design-kit/colour/page.module.css`                | Changed       | Phone block                        |
| `app/design-kit/foundations/page.module.css`           | Changed       | Phone block                        |
| `app/design-kit/map-style/page.tsx`, `page.module.css` | Changed       | Field labels; phone block (D1)     |
| `app/design-kit/map-style/__tests__/page.test.tsx`     | Changed       | Each row has the three labels      |
| `e2e/design-kit.spec.ts`                               | Changed       | Phone and 800 × 900 tests          |
| `design/screens.json`                                  | Changed       | Three phone entries, `report` (D2) |

## Order of work

1. Colour, Foundations, Map style and its test.
2. e2e and `screens.json`.
3. Lint, format, words, tests, validator, e2e, design check, build.

## Risks

- The labels add text to each cell's accessible name; they are `display: none` on desktop, as on States.
- If the code sample grew its grid cell, the page would scroll; the notes use `minmax(0, 1fr)`.

## Proof

| Acceptance check                        | Proven by                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| No sideways scroll at 390; code scrolls | e2e per board: `scrollWidth` equals `clientWidth`; every box in `main` lies in 16–374; the code's `scrollWidth` exceeds its `clientWidth` |
| 20 cards with the desktop fields        | e2e at 390: heading row hidden; 20 rows, each showing its three labels; `page.test.tsx`                                                   |
| 1440 unchanged                          | Design check scores for the three desktop entries match `main`; desktop e2e pass                                                          |
| Phone entries in `report`               | `screens.json` diff; design check output and differences in the PR                                                                        |
| Tests, e2e, build, 100% coverage        | Their output in the PR                                                                                                                    |
| 844 × 390 is the phone layout           | The scroll and card e2e repeated at 844 × 390                                                                                             |
| 800 × 900 is the desktop layout         | e2e: Map style's column headers show; Colour's first five swatches share a top; Spacing and Corner radius share a top                     |

## Flagged concerns

- The snapshots' copy differs in places (Map style eyebrow "Map style"; the Icons note's "1.8–2px stroke … 16, 18 or 20px"). The Spec keeps the desktop copy, so these are listed as differences.
- 640–1279px wide keeps the desktop layout (#104 D1).
