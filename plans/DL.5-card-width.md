# Plan: DL.5: A component card can state a width

- **Spec:** #898
- **Requirement IDs:** None. This Spec changes tooling only.
- **Status:** approved

## Approach

Add an optional `width` to the `Card` type. `previewHtml` writes ` width=N` after the height on line 1 only when the card has a `width`. Thus each card in `CARDS` gets the same line 1 as today. `checkPreview` reads an optional `width=` on line 1. It throws for a value that is not a whole number from 320 to 1920. The error message has the same `<name> preview.html` start as the other problems. No card gets a `width`, so `npm run design-system` writes the same files. DL.6 (#899) is the first card that uses it, and that Spec wires the field.

This change edits no [design system input](../design/CANVAS.md#changing-the-design-system). Thus the steps of "Changing the design system" do not apply.

## Files that change

| File                                      | New / changed | What                                                                                                                                                                                     |
| ----------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                     | changed       | `Card` gets `width?: number`, with a doc comment: the px width at which the design system lays the card out.                                                                             |
| `lib/design/cards.mts`                    | changed       | `LINE_ONE` takes an optional ` width=(\S+)`. `previewHtml` writes ` width=N` for a card with a `width`. `checkPreview` throws `has a width that is not a whole number from 320 to 1920`. |
| `lib/design/__tests__/cards.test.ts`      | changed       | Tests for Acceptance checks 1 to 3, and for the limits 320 and 1920.                                                                                                                     |
| `scripts/__tests__/design-system.test.ts` | changed       | The expected line 1 adds ` width=N` when the card has a `width`. Thus DL.6 needs no edit to this test.                                                                                   |

## Order of work

1. Write the tests in `cards.test.ts`. See them fail on the line 1 text and on the missing throw ([test-first rule](README.md#test-first)).
2. Add `width` to `Card`.
3. Change `LINE_ONE`, `previewHtml` and `checkPreview`.
4. Change the expected line 1 in `design-system.test.ts`.
5. Run `npm run design-system`. Compare `.design-system/project/` with `design/canvas/project/ds/kinscape/` by `git diff --no-index --stat`. On `main`, the diff lists only `assets/` (not in the canvas copy), `checksums.json` (only in the canvas copy) and `design-system.json`. The branch must give the same list.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- Step 5 compares the output with the committed canvas copy, not with a second run on `main`, because the CI build writes no scratch files. If a change to the canvas copy merges before the build, the list of step 5 can change. Then the build runs step 5 on `main` again and compares the two lists.
- Nobody saw the artifact lay a card out at a stated width (a flagged concern of the Spec). This Spec gives no card a width, so the artifact does not change. DL.6 is the first test of it.

## Proof

| Acceptance check | Proven by                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1                | `cards.test.ts`: `previewHtml({ ...card, width: 1440 })` line 1 is `<!-- @dsCard group="Feedback" height=140 width=1440 -->`. |
| 2                | `cards.test.ts`: the existing line 1 test of `Toast`, with no `width`.                                                        |
| 3                | `cards.test.ts`: `checkPreview` throws `/^A preview\.html /` for 319, 1921 and 390.5, and accepts 320 and 1920.               |
| 4                | Step 5 of Order of work: the diff lists the same files as on `main`. The PR pastes the output.                                |
| 5                | `npm test` output in the PR, with 100% coverage.                                                                              |

## Out of scope

- A card that uses the width: DL.6, DL.27 and DL.28.
- A `Layout` group in `GROUPS`: DL.6.
- A card height over 4000px.
- The gallery spec of DL.2 (#895). It sets its own widths.

## Deviations
