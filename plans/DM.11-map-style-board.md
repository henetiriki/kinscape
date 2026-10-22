# Plan: DM.11: Map style board

- **Spec:** #151 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

`app/design-kit/map-style/layers.ts` lists the 20 layers in board order. Each row has its id, type, source and filter, key properties, covered requirement IDs and a preview kind. Key properties are template strings over `resolveTokens(rawTokens).map`, with hex shown in capitals as on the board. Values the tokens lack (fill opacity 0.6, illumination 315°, cluster radius 40) are written as text (Spec D1 A: designed ids, not the code's). `Preview.tsx` draws each kind in CSS. A preview's token colours reach its module as inline custom properties (`--fill`, `--line`), because the map tokens have no CSS variables. The type board's `labelStyle` moves to `app/design-kit/mapLabels.ts`, so both boards set label samples the same way. The intro reuses the `kit` eyebrow, title and lede classes; the layout's banner stays the only kit header. The notes and code sample are page copy in `<Text>` and a `<pre>`.

## Decisions

**D1 · River widths** · Decides: Tech lead
The board says `interpolate zoom 4→1, 9→3`; `map.river` and the map say zoom 3→1, 8→3.

- **A.** Read the tokens (3→1, 8→3), as the Spec does for river values; the design agent updates the board.
- **B.** Write the board's 4→1, 9→3 as text, so the board and the map disagree.
- **Other:** your own.

Recommended: A, because the board is meant to show what the tokens hold.

**Answer (@henetiriki): A.**

## Files that change

| File                                                   | New / changed | What                                                                     |
| ------------------------------------------------------ | ------------- | ------------------------------------------------------------------------ |
| `app/design-kit/map-style/layers.ts`                   | New           | 20 rows, legend, notes                                                   |
| `app/design-kit/map-style/Preview.tsx`, `.module.css`  | New           | Fills, hatch, hillshade, lines, labels, dot, halo, glyphs, cluster, ring |
| `app/design-kit/map-style/page.tsx`, `page.module.css` | New           | The board                                                                |
| `app/design-kit/map-style/__tests__/layers.test.ts`    | New           | Order, unique ids, each `covers` ID is in `docs/requirements.md`         |
| `app/design-kit/map-style/__tests__/page.test.tsx`     | New           | 20 rows and columns in order; mocked `map.sea` changes text and legend   |
| `app/design-kit/mapLabels.ts`, `type/page.tsx`         | New, changed  | Shared `labelStyle`                                                      |
| `app/design-kit/boards.ts`                             | Changed       | Row 06: label "Map style", title "MapLibre layer stack"                  |
| `design/screens.json`                                  | Changed       | `map-style`, 1440 × 2067, `report`                                       |
| `e2e/design-kit.spec.ts`                               | Changed       | Row in `BOARD_LINKS`; preview fills and lines match tokens               |
| `design/DESIGN.md`                                     | Changed       | Map style names `/design-kit/map-style`                                  |

## Order of work

1. `mapLabels.ts`; type board onto it.
2. `layers.ts` and its test.
3. `Preview`, page, CSS, page test.
4. `boards.ts`, `screens.json`, e2e, `DESIGN.md`.
5. Lint, format, words, tests, validator, e2e, build, design check.

## Risks

- DM.10 also edits `screens.json`. I rebase on `main` before building and keep its entries.
- The 20 rows must fit 2067px. Over 0.5%, I list the score and differences in the PR.

## Proof

| Acceptance check                       | Proven by                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| 20 layers in order, each column        | `page.test.tsx`; `layers.test.ts`                                             |
| Changed `map` token shows on the board | `page.test.tsx` mocks `tokens.json` with another `map.sea` and `colour.brand` |
| No kit header; `report` at 1440 × 2067 | e2e: one banner; `screens.json` diff; design check output in the PR           |
| Nav and index list Map style           | `boards.test.ts`; e2e over `BOARD_LINKS`                                      |
| 404 in production                      | `layout.test.tsx` (every kit page)                                            |
| Tests, e2e, build pass, 100% coverage  | Their output in the PR                                                        |

## Out of scope

- Drawing a layer on the map or renaming the code's layer ids.
- The phone board (DM.12.3) and the index label change (DM.12.1).
