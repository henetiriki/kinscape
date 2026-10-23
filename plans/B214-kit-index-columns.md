# Plan: B214: Desktop Boards screen design mismatch

- **Spec:** #214
- **Requirement IDs:** NFR-05
- **Status:** draft

## Approach

The `/design-kit` list becomes the grid in `design/source/design-kit.html`: two equal columns (`minmax(0, 1fr)`), filled top to bottom (`grid-auto-flow: column`), gap `--space-24` `--space-48`, `max-width: 1040px`. So 01–05 sit on the left and 06–08 and Map style on the right, with rows lined up across the columns. The design hard-codes five rows; `page.tsx` instead sets `--rows` to `Math.ceil(BOARDS.length / 2)` on the list, as `inputs/Board.tsx` sets `--columns`, so a tenth or eleventh board can't spill into a third column. The kit's phone query, `(max-width: 639.98px), (max-height: 499.98px)`, keeps today's single flex column, which `design-kit-phone` shows.

## Decisions

**D1 · The rest of the mockup's differences** · Decides: PO

The mockup also differs in text: the nav says "Inputs", not "Inputs and actions", and the lines for 06, 07 and 08 are worded differently.

- **A.** Fix only the columns, as reported. The text stays, since each line was written to match what its board now holds.
- **B.** Also copy the mockup's label and three lines into `boards.ts`.
- **Other:** your own.

Recommended: A, because the report names only the columns, and the current lines describe the built boards.

## Alternatives considered

- `columns: 2` (multi-column): rows wouldn't line up across columns as they do in the mockup.
- Hard-coding `repeat(5, auto)`: an eleventh board would open a third column.

## Files that change

| File                                     | New / changed | What                                          |
| ---------------------------------------- | ------------- | --------------------------------------------- |
| `app/design-kit/page.module.css`         | Changed       | Two-column grid; phone query keeps one column |
| `app/design-kit/page.tsx`                | Changed       | `--rows` on the list                          |
| `app/design-kit/__tests__/page.test.tsx` | Changed       | `--rows` is 5 for nine boards                 |
| `e2e/design-kit.spec.ts`                 | Changed       | Column test at 1440 × 900 and 390 × 941       |

## Order of work

1. CSS and `--rows`; unit test.
2. e2e test.
3. Lint, format, words, tests, validator, e2e, design check for `design-kit` and `design-kit-phone`.

## Risks

- From 640px to about 1170px the columns narrow and lines wrap more; that width is undesigned (#104 D1).

## Proof

| Acceptance check                                      | Proven by                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Desktop shows two columns, 01–05 left, the rest right | e2e at 1440 × 900: 06's top equals 01's, its left is greater; Map style shares 06's left; 05 is below 04 on the left |
| Phone stays one column                                | e2e at 390 × 941: every board shares one left edge                                                                   |
| Matches the mockup                                    | Design check report for `design-kit` and `design-kit-phone` in the PR                                                |
| Tests, e2e pass, 100% coverage                        | Their output in the PR                                                                                               |

## Out of scope

- The text differences in D1, unless the PO answers B.
