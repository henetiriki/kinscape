# Plan: DM.12.8: Sources dialog redone (board 07)

- **Spec:** #210 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06, NFR-08
- **Status:** approved

## Approach

The Dialog component needs small fixes; most of the work is in the kit, where each board now draws one Dialog sample. Sources and links are unchanged.

## Differences found

`npm run design:check -- -g style-7-components-surfaces`, against the previous and the new snapshots:

| Screen         | Previous |    New |
| -------------- | -------: | -----: |
| desktop (1440) |   12.01% | 11.86% |
| phone (390)    |   20.83% | 20.12% |
| part 2 (390)   |   16.03% | 16.04% |

The Dialog section's differences, board against build:

1. **Desktop board:** centred sample only; Accessibility beside it (gap 40), Measurements full width below (columns 150 / rest / 480). The build adds the sheet and uses the two-column Facts.
2. **Phone board:** sheet sample only, scrim 48 above it (build: 20). The build adds the desktop sample.
3. **Desktop sample:** capped at 820 (900 less 80), so its body scrolls; the build draws it whole. Caption: "Desktop · 1440 × 900 screen; the body scrolls under the head."
4. **Licence link:** a bare `<a>` (browser blue); the board has board 04's Link.
5. **Colours:** header row and Checked date are ink-3 (build: ink-2 and ink).
6. **Body:** `scrollbar-width: thin`.
7. **Measurements:** ten rows; Body, Text and Licence are new, four reworded.
8. **Heights:** 7887 (was 7892) and 7332 (was 7380).

The rest of the Spec's Behaviour already matches.

## Decisions

**D1 · Which component draws the licence link** · Decides: Tech lead

Spec D2 builds a `Link` because none existed, but `app/components/TextLink.tsx` already is board 04's Link, at 15 / 22 only.

- **A.** Add `size='small'` (13 / 20, `type.small`) to `TextLink`, with tests. Board 07's Dialog is its kit sample, because board 04 draws no small Link.
- **B.** Build a separate `Link`, as Spec D2 reads, and add a sample on board 04 that the design doesn't draw.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                        | New / changed | What                                                         |
| ----------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `app/components/TextLink.tsx`, `.module.css`                | Changed       | `size` (D1)                                                  |
| `app/components/SourcesDialog.tsx`, `.module.css`           | Changed       | Licence link; ink-3 header and date                          |
| `app/components/Dialog.module.css`                          | Changed       | Thin scrollbar                                               |
| `app/design-kit/inputs/Board.tsx`, `page.module.css`        | Changed       | `Variant` gets a `phone` flag; `Facts` exports its two parts |
| `app/design-kit/surfaces/sections.tsx`, `page.module.css`   | Changed       | Differences 1–3 and 7                                        |
| `app/components/__tests__/`, `app/design-kit/**/__tests__/` | Changed       | Tests for the above                                          |
| `e2e/dialog.spec.ts`                                        | Changed       | Link, scrolling head, sheet line order                       |
| `design/screens.json`                                       | Changed       | Heights 7887 and 7332                                        |
| `design/DESIGN.md`                                          | Changed       | The dialog shows each source's detail                        |

## Order of work

1. `TextLink` size (D1), with tests.
2. `SourcesDialog` and `Dialog` CSS (differences 4–6).
3. `Board.tsx` helpers, then the `Dialogs` section (differences 1–3 and 7).
4. `screens.json`, `DESIGN.md`.
5. Design check, lint, typecheck, tests, e2e, boundary validator, build.

## Risks

- `Board.tsx` serves every board: defaults stay, and boards 04–08 are re-checked.
- Most of each page's score is board-wide layout (e.g. phone Facts), out of scope, so scores drop little; the Dialog section's side-by-side is the proof.

## Proof

| Acceptance check                                      | Proven by                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| 1280: centred, modal, one row per source, focus Close | `dialog.spec.ts`; `SourcesDialog.test.tsx` row count                        |
| Head stays, body scrolls                              | `dialog.spec.ts` at 1280 × 600                                              |
| 390: sheet, handle, line order                        | `dialog.spec.ts`                                                            |
| Link look, new tab, `rel`                             | `TextLink.test.tsx`; `SourcesDialog.test.tsx`                               |
| Same sources and links                                | `SourcesDialog.test.tsx`: each title and `href` against `data/sources.json` |
| Kit matches at 1440 and 390                           | Dialog section of each `side-by-side.png`, in the PR                        |
| Scores no worse                                       | Table above against the final run (≤ 12.01%, ≤ 20.83%)                      |
| Tests, e2e, build, 100%                               | Their output in the PR                                                      |

## Out of scope

- Board-wide kit layouts outside the Dialog section.
- Dragging the handle to close (#104).
- Map furniture (DM.12.7).
