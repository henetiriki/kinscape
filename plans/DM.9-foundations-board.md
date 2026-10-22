# Plan: DM.9: Foundations board

- **Spec:** #147 (Intent #111)
- **Requirement IDs:** NFR-06, NFR-01
- **Status:** draft

## Approach

`app/design-kit/foundations/values.ts` lists the rows in board order, each keyed by its token: ten `space` steps, five radii (`small`, `control`, `panel`, `sheet`, `full`), three shadows, four `motion` rows, then Map date change. Use lines are page copy (Spec D1 A: they render the same pixels either way). The page reads values with `resolveTokens(rawTokens)`, like the colour board; bars (`calc(var(--space-N) * 4)`), radii and shadows draw from the CSS variables. `full` is labelled by name, as on the board. The Elevation backdrop takes `map.sea` inline, as the feedback board does. Icons is an empty `<section aria-label='Icons'>` the board's size. Text uses `<Text>`; layout sits in `page.module.css`.

## Decisions

**D1 · Snapshot height** · Decides: Tech lead
The Spec says 1180; `style-3-foundations.jpg` is 1241, as the other boards' heights include the nav.

- **A.** 1241 in `screens.json`; I reword the Spec's line.
- **B.** 1180, cropping the snapshot.
- **Other:** your own.

Recommended: A, because the check compares against the whole image.

**D2 · Shadow text** · Decides: Tech lead
The token is `0 1px 2px rgb(24 33 27 / 0.08), …`; the board shows `rgb(24 33 27/.08)`.

- **A.** A formatter turns ` / 0.` into `/.` on the token text.
- **B.** The token text verbatim; the design agent updates the board.
- **Other:** your own.

Recommended: A, because the longer text wraps onto more lines and costs pixels.

**D3 · Changed border easing** · Decides: Tech lead
The Spec and board say "600ms fade"; the token is `600ms ease-out`.

- **A.** Every row shows its token value, except Changed border: the token's duration, then "fade" as copy.
- **B.** "600ms ease-out" from the token; the design agent updates the board.
- **Other:** your own.

Recommended: A, because the map fades it with a MapLibre transition, not a CSS easing.

**D4 · Nav name** · Decides: PO
Nav and index show each row's `title`, the board's heading ("Typography and hierarchy"). The Spec asks for both "Spacing, shape, depth, icons, motion" and "Foundations".

- **A.** Title "Spacing, shape, depth, icons, motion", as the other rows; I reword the acceptance check.
- **B.** Title "Foundations"; the page heading stays the board's.
- **Other:** your own.

Recommended: A, because every row's title is its board's heading.

## Files that change

| File                                                     | New / changed | What                                                   |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------ |
| `app/design-kit/foundations/values.ts`                   | New           | Rows, labels, use lines; shadow formatter (D2)         |
| `app/design-kit/foundations/page.tsx`, `page.module.css` | New           | The board                                              |
| `app/design-kit/foundations/__tests__/page.test.tsx`     | New           | Sections, counts, order; mocked tokens change the text |
| `app/design-kit/foundations/__tests__/values.test.ts`    | New           | Formatter; each row's token exists                     |
| `app/design-kit/boards.ts`                               | Changed       | Row 03 (D4), line "The small set of values every…"     |
| `design/screens.json`                                    | Changed       | `style-3-foundations`, 1440 × 1241 (D1), ignore Icons  |
| `e2e/design-kit.spec.ts`                                 | Changed       | Row in `BOARD_LINKS`; bar widths, radii, shadows match |
| `design/DESIGN.md`                                       | Changed       | Shape and depth links `/design-kit/foundations`        |

## Order of work

1. `values.ts` and its tests.
2. Page, CSS, page test.
3. `boards.ts`, `screens.json`, e2e, `DESIGN.md`.
4. Lint, format, words, tests, validator, e2e, build, design check.

## Risks

- The ignore region is measured from the snapshot source (about 72, 748, 624 × 250); it must cover Icons only, not Motion beside it.
- Over 0.5%, I report the score and diff in the PR.

## Proof

| Acceptance check                      | Proven by                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Four sections in layout; empty Icons  | `page.test.tsx`; design check output in the PR                                              |
| A changed token changes the board     | `page.test.tsx` mocks `tokens.json` with other `space`, `radius`, `shadow`, `motion` values |
| Drawn from tokens                     | e2e: bar width 4 × step, `border-radius`, `box-shadow` computed from tokens                 |
| `report` mode, ignore over Icons only | `screens.json` diff; design check output                                                    |
| Nav and index list the board          | `boards.test.ts`; e2e over `BOARD_LINKS`                                                    |
| Tests, e2e, build pass, 100% coverage | Their output in the PR                                                                      |

## Out of scope

- The Icons section and icon set (DM.10).
- Tokens the board leaves off, and changing any value.
