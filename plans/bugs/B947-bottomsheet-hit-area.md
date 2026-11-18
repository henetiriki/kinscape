# Plan: B947: The BottomSheet handle is 20px tall with no 44px hit area on a phone

- **Spec:** #947 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** draft

## Approach

The grabber of `BottomSheet` gets the hit area of `TextLink` (#943) and `ArrowLink` (#944). `.grabber` becomes `position: relative`, with a centred `::before`, `var(--size-touch)` tall and `max(100%, var(--size-touch))` wide. The grabber keeps its 64 × 20px box and its `-4px` bottom margin, so the sheet does not move. The two `#947` rows leave `UNDER_44` in `e2e/gallery-looks.spec.ts`, because that test fails while a fixed control stays in the list.

`BottomSheet` is in `CONTROLS`, so the change is a [design system input](../../design/CANVAS.md#changing-the-design-system). No board shows the invisible hit area.

On `main`, `npm run design:gallery -- -g "each control under 44px"` passes, so each `UNDER_44` row still fails: the Bug reproduces.

## Decisions

**D1 · Where the hit area goes past the sheet** · Decides: Tech lead

The grabber is 8px below the top of the sheet. The first row of the sheet starts 36px below that top, so the space for the grabber is 36px. A 44px area must cover 8px more: the map above the sheet or the top of the first row. On the "Phone date sheet" board, the middle 64px of that row is the date field. No page shows `BottomSheet` yet.

- **A.** A centred `::before`, as `TextLink` and `ArrowLink` have. It covers 4px of the map and the top 4px of the row. A row item with `position` comes later in the page, so it stays on top and keeps its taps. `DateField.module.css` sets no `position`, so the date field loses a 64 × 4px strip. Cost: about 10 lines.
- **B.** Make the grabber box 44px tall, from 8px above the sheet to the first row. Negative margins keep the layout, and top padding keeps the handle in place. It covers 8px of the map and none of the row. The gallery test then checks no point, because the box is 44px. The browser focus outline grows to 64 × 44px. Cost: about 6 lines.
- **Other:** your own.

Recommended: A, because each control then keeps one hit-area pattern, and the Bug expects the point 21px above and below the 20px button to hit it.

## Alternatives considered

- **A shared hit-area class.** The #944 answer to D2 was to copy the rule into each module. This plan copies it too.

## Files that change

| File                                                     | New / changed | What                                                     |
| -------------------------------------------------------- | ------------- | -------------------------------------------------------- |
| `app/components/overlays/BottomSheet.module.css`         | changed       | The hit area on `.grabber` (D1)                          |
| `app/components/overlays/__tests__/BottomSheet.test.tsx` | changed       | The grabber has the hit area and keeps its 64 × 20px box |
| `e2e/gallery-looks.spec.ts`                              | changed       | Remove the `#947` rows from `UNDER_44`                   |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`    | changed       | Design system steps 4 and 5                              |

## Order of work

1. Write the unit test. See it fail on the missing hit area of `.grabber`.
2. Remove the `#947` rows from `UNDER_44`. Run `npm run design:gallery -- -g "each control under 44px"`. See it fail with the two BottomSheet rows.
3. Change `BottomSheet.module.css` as D1 says. Run the unit tests and the gallery test again.
4. Run the checks in `AGENTS.md` › Commands, `npm run design:gallery` and `npm run design:check`.
5. Design system steps 2 to 6. The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 and step 6. The session needs a signed-in account. Step 7 does not apply. The PR stays a draft until then.

## Risks

- **Snapshots.** `position: relative` can change the stacking order in the sheet. `npm run design:check` shows any change. If a blocking snapshot changes, the build stops for the tech lead.
- **Lost taps.** If D1 is A, a tap on the top 4px of the date field toggles the sheet. The Spec that puts the sheet on a page can give the field `position: relative`.

## Proof

| Acceptance check                                                        | Proven by                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A point 21px above and below the centre of the grabber is on the button | `e2e/gallery-looks.spec.ts` "keeps a 44px hit area", with the `#947` rows gone |
| The grabber has a 44px hit area and keeps its 64 × 20px box             | `BottomSheet.test.tsx`                                                         |
| The grabber still expands and collapses the sheet                       | `BottomSheet.test.tsx`                                                         |
| The look of each BottomSheet state does not change                      | `npm run design:check`; the BottomSheet card images in the gallery job         |

## Out of scope

- The other `UNDER_44` Bugs (#948 to #951, #988).
