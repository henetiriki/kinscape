# Plan: B1046: The PersonRow, PickerRow and RelationshipRow cards overlap their text in a narrow design system pane

- **Spec:** #1046 (Bug)
- **Requirement IDs:** None. This Bug changes the design system cards and no screen.
- **Status:** approved

## Approach

On `main`, line 1 of the three `preview.html` files states no `width`, so the design system draws each card at the width of its pane. Each row has a grid of `minmax(0, 1fr)`, then fixed columns of 200px or 240px, then 72px for PersonRow and RelationshipRow. In a pane of about 335px, the fixed columns take the width and the name column shrinks to one word. The rows are correct at the width of their page, so the fix is in the cards, not in the rows.

`lib/design/states.mts` gives each of the three cards a `width` (D1). It also sets each `height` to the content height at that width, as the next multiple of 20px above it. The build measures that height in the new gallery test. The rows, their CSS, `previewHtml` and the gallery files do not change.

The Bug reproduces: the three card comments in `design/canvas/project/ds/kinscape/components/` state no `width`. The build pastes the failing line of the new gallery test at 335px in the Evidence.

## Decisions

**D1 · The width of each row card** · Decides: Tech lead

#450 (DS.7) allows a `width` from 320 to 1920. Only `ColumnLayout` states one, 1440. Each width adds 32px for the 16px body padding of the preview.

- **A.** The width of the column that holds the row. PersonRow and RelationshipRow: 992 (`layout.list-width` 960). PickerRow: 792 (`layout.dialog-width` 760, the Dialog of `RelationshipPicker`). Each state is on its own line, so PersonRow grows to about 620px tall.
- **B.** 1440 for all three, as `ColumnLayout`. Two states fit on most lines, so the cards are shorter. A narrow pane scales the card down more, so the text is smaller.
- **Other:** your own.

**Answer: Other:** . PersonRow and RelationshipRow: 992 (option A). PickerRow: 736. The Dialog panel is 760px with 28px side padding (Dialog.module.css), so the row is 704px wide, plus 32px preview padding. (@henetiriki)

## Alternatives considered

- **A narrower fixed column in each row.** The tech lead ruled that the rows do not change.
- **Each `.ks-case` at 100% width in `STYLE`.** That changes all 52 previews, and a narrow pane still shrinks the name column.

## Files that change

| File                                                  | New / changed | What                                                                                                           |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `lib/design/states.mts`                               | changed       | The `PersonRow`, `RelationshipRow` and `PickerRow` cards get a `width` (D1) and the measured `height`          |
| `lib/design/__tests__/cards.test.ts`                  | changed       | Line 1 of each of the three previews states a `width`                                                          |
| `e2e/gallery-looks.spec.ts`                           | changed       | New describe "the row cards at their width": the name check, the overlap check and the frame check (see Proof) |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Design system steps 4 and 5                                                                                    |

## Order of work

1. Add the unit test. See it fail: line 1 of the PersonRow preview states no `width`.
2. Add the gallery tests. Run them at 335px to see the name wrap, then at the card width.
3. Set the three widths. Run `npm run design:gallery`. Read each content height. Set each `height`.
4. Run the checks in `AGENTS.md` › Commands.
5. Design system steps 2 to 6. The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 6. The session needs a signed-in account. No board shows the change, so step 7 does not apply. The PR stays a draft until then.

## Risks

- **Card images.** `design-gallery.spec.ts` opens each file at 1440px and 390px and ignores line 1, so no card image changes. If one changes, the build stops for the tech lead.
- **Fonts.** The pane can draw text wider than the test browser. The build writes the free width beside the widest state in the Evidence. If it is under 40px, the build stops for the tech lead.

## Proof

| Acceptance check or Must not break                          | Proven by                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Line 1 of each of the three previews states a `width`       | `cards.test.ts`, new test                                                                                               |
| No name wraps to a second line                              | `gallery-looks.spec.ts`: in each state, the name box is less than two of its line heights tall                          |
| No name, note, dates or Edit label overlaps another         | `gallery-looks.spec.ts`: the boxes of the visible text parts of each state do not intersect. PickerRow has no Edit      |
| Each state and its ring is inside the frame and the height  | `gallery-looks.spec.ts`: each row box, 4px larger for the ring, is inside the card `width` and `height`, with no scroll |
| Each card at 1440px and 390px reports no error              | `e2e/design-gallery.spec.ts`, unchanged                                                                                 |
| #450: the card rules and a `width` from 320 to 1920         | `cards.test.ts`: `checkPreview` passes for each card                                                                    |
| #536 and #798: the Person row and its Dates column          | `PersonRow.test.tsx` and `RelationshipRow.test.tsx`, unchanged. No row CSS changes                                      |
| #801: the People list                                       | `e2e/people.spec.ts`, unchanged                                                                                         |
| `e2e/design-gallery.spec.ts`: each card opens with no error | `e2e/design-gallery.spec.ts`, unchanged                                                                                 |

## Deviations

- The heights are 340 (PersonRow), 220 (RelationshipRow) and 440 (PickerRow). The test measures them from the end of the last state, because the page is as tall as the viewport.
- The gallery test opened each card 32px wider than its `width`. The review found it. The test now opens each card at its `width`. The sandbox cannot start Chromium, so the heights are not measured again. The CI e2e job checks them.
- The build did not run the gallery test at 335px to see the name wrap. The sandbox cannot start Chromium.
- The build did not write the free width of each card in the Evidence. The sandbox cannot start Chromium. The 40px check of Risks is open.
- `lib/design/cards.mts` exports `PREVIEW_PAD`, which `STYLE` and the gallery test use. The code rules define a constant once. The `previewHtml` output does not change.

## Out of scope

- A narrow form of the rows. The phone form of PersonRow stays as it is.
- A `width` for other cards.
