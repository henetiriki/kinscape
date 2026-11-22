# Plan: C1157: Move the look checks of the shared components from Vitest to the gallery

- **Spec:** #1157
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06), [MAP-05](../docs/requirements.md#map-05)
- **Status:** approved

## Approach

Each of the 16 checks gets a test in `e2e/gallery-looks.spec.ts`. The test opens the card, finds its state by `state(page, label)` and reads the drawn box or the computed style. A token value comes from a probe element, as `floatingShadow` does, so the test compares px and `rgb()` that the browser computes. A line of a moved test that reads no DOM, such as a token or a stylesheet check, stays in Vitest with no render. After the move, each Vitest test with no check left goes (issue step 6), unless `npm test` coverage drops below 100%.

| Vitest line              | Card · state (new states in bold)                                         | Gallery check                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` 51              | `Button · size xs`                                                        | The icon box is 14px wide.                                                                                                                                                                                  |
| `Button` 54              | **`Button · round`**, a primary `play` button                             | The icon box is 20px wide.                                                                                                                                                                                  |
| `CheckboxField` 46       | **`CheckboxField · size m`**                                              | The row box is 44px tall.                                                                                                                                                                                   |
| `TextField` 153          | **`TextField · size l`**                                                  | The box is `--size-field-l` tall.                                                                                                                                                                           |
| `SignInLayout` 42        | `SignInLayout · hero and form`, at 390px                                  | The hero wordmark is 36px tall.                                                                                                                                                                             |
| `SignInLayout` 55        | `SignInLayout · hero and form`                                            | The sea background is `map.sea`.                                                                                                                                                                            |
| `SignInLayout` 26        | `SignInLayout · hero and form`                                            | Slot order (D1); the form slot holds the card text and a 44px wordmark.                                                                                                                                     |
| `PinPopup` 230           | **`PlacedPinPopup · placed`**                                             | Issue step 5, with `pin-popup-gap`.                                                                                                                                                                         |
| `Popup` 214              | **`PlacedPopup · placed`**                                                | Issue step 5, with `popup-gap`.                                                                                                                                                                             |
| `Legend` 64              | `Legend · default`                                                        | Each swatch's computed `stroke`, `stroke-width`, `stroke-dasharray`, `fill`, `fill-opacity`, `opacity` and hatch `background-image` equal the map tokens that lines 68 to 85 name. Line 75 stays in Vitest. |
| `PinFan` 87              | `PinFan · twelve Pins`                                                    | The fan box is 252px wide and tall, twice the 126px reach.                                                                                                                                                  |
| `LayerGroup` 43          | `Panel · Layers tab`, whose Basemap group has `size: 'm'` rows            | The "Place names" row box is 44px tall. The rest of the test stays.                                                                                                                                         |
| `ColumnLayout` 82 and 85 | `ColumnLayout · form with an action bar`                                  | Slot order `DIV`, `MAIN`, `DIV` (D1); the first slot holds the header.                                                                                                                                      |
| `MapLayout` 35           | `MapLayout · text in each slot`                                           | Slot order of the nine slots (D1). The canvas check on line 32 stays.                                                                                                                                       |
| `MapLayout` 55           | **`MapLayout · overlay at the top`**, and `MapLayout · text in each slot` | The overlay text's top is the slot's top only in the new state. The stylesheet check on line 63 stays.                                                                                                      |

Two kept disables lose the line that they read:

- `Popup.test.tsx` 223 reaches the root from `screen.getByRole('dialog')` on its own disable line.
- `ColumnLayout.test.tsx` 96 reaches the last slot from `screen.getByRole('main')` on its own disable line.

## Decisions

**D1 · How the gallery checks slot order** · Decides: Tech lead

`ColumnLayout` 82 and 85, `MapLayout` 35 and `SignInLayout` 26 check the DOM order of the slots. That order sets the reading and tab order, and a drawn box does not show it. Constraint 1 keeps the asserted value. Step 2 asks for a drawn box in place of an attribute. #1158 holds no value for this.

- **A.** The gallery reads the same list from the drawn card: `data-slot` names, or child tags, in DOM order. Each test asserts the same list as now. About 30 lines.
- **B.** The gallery checks the drawn position of each slot, such as the hero left of the form. This changes the asserted values (Constraint 1), and it does not prove the reading order. About 60 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                   | New / changed | What                                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------- |
| `e2e/gallery-looks.spec.ts`                                                                            | changed       | A test for each row of the table                                          |
| `app/components/actions/__tests__/Button.test.tsx`                                                     | changed       | Remove lines 51, 52, 54 and 55                                            |
| `app/components/forms/__tests__/CheckboxField.test.tsx`, `TextField.test.tsx`                          | changed       | Delete the "44 row" test; remove the size check                           |
| `app/components/layout/__tests__/SignInLayout.test.tsx`, `ColumnLayout.test.tsx`, `MapLayout.test.tsx` | changed       | Move or delete the checks of the table                                    |
| `app/components/overlays/__tests__/Popup.test.tsx`, `PinPopup.test.tsx`                                | changed       | Remove the style checks; find the root for line 223                       |
| `features/map/components/__tests__/Legend.test.tsx`, `PinFan.test.tsx`, `LayerGroup.test.tsx`          | changed       | Remove the style and size checks                                          |
| `lib/design/bundle.mts`                                                                                | changed       | `PlacedPopup` and `PlacedPinPopup` in `CONTROLS`, after `PinPopup`        |
| `lib/design/states.mts`                                                                                | changed       | The six new states and the two cards; card heights from the render        |
| `lib/design/cards.mts`                                                                                 | changed       | `PlacedPinPopup` in `PHONE_CARDS`: `PinPopup.module.css` has a width rule |
| `lib/design/__tests__/react-18-cases.tsx`                                                              | changed       | A case for each new card and state                                        |
| `lib/design/__tests__/bundle.test.ts`, `cards.test.ts`                                                 | changed       | The two names; 12 Overlays                                                |
| `scripts/__tests__/design-system.test.ts`                                                              | changed       | 69 controls                                                               |
| `design/cards/`                                                                                        | new, changed  | The workflow renders the new and changed card images                      |
| `design/canvas/project/ds/kinscape/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`     | changed       | Steps 4 and 5 of Changing the design system                               |

## Order of work

1. Add the two controls, the cards and the six states. Run `npm run design-system` (step 2) and `npm run design:gallery`. Set each card height from the render. Commit.
2. Add the gallery tests of the table. Run `npm run design:gallery`. Then change one moved value in each new test, see it fail, and restore it. Paste each failing line in the Evidence.
3. Remove the Vitest checks and their disables. Run `npm test`. If coverage drops below 100%, put that check and its disable back, and list it in the PR. Commit.
4. Run the checks in `AGENTS.md` › Commands. Push.
5. The tech lead, or a local Claude Code session that the tech lead starts with a signed-in account, runs steps 3 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). No board shows the change, so step 7 does not run.
6. Step 6: if the `design` or `gallery` job fails on a card image, run Design: Render snapshots on the branch.
7. File one follow-up issue. It lists each board that hand-draws a placed popup or Pin popup, with the reason.

## Risks

- The new placed cards hold an absolute box. If the card frame is not its containing block, the popup leaves the card. The build sets `x` and `y` from the render, so the whole popup is on the card and its top is below `furniture-top`.
- The new states make the `Button`, `CheckboxField`, `TextField` and `MapLayout` cards taller. Step 6 renders their images again.
- The removed lines move the line numbers that #1158 names in five test files. The refresh of #1158 updates them.

## Proof

| Acceptance check                                                     | Proven by                                                       |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| The PR lists the 16 disables, each gone or kept under the Constraint | The PR body table, and `git grep "eslint-disable"` on the files |
| Each moved check has a gallery test with the same value              | `e2e/gallery-looks.spec.ts`; the failing lines of step 2        |
| `npm run lint`, `npm test` and `npm run design:gallery` pass         | The pasted output; the PR lists each deleted Vitest test        |
| Steps 2 to 6 of Changing the design system are done                  | The step 4.6 and 5.5 reports in the PR                          |
| Each `ds/kinscape/` file has the sha256 of `.design-system/project/` | The step 4.6 report                                             |
| A follow-up issue lists each hand-drawn part                         | The issue link in the PR                                        |

## Out of scope

- The other disables: #1158 and Slices C and D change them.
- A board edit. The follow-up issue holds the board swaps.

## Deviations

- The `ColumnLayout` gallery test asserts `HEADER`, `MAIN`, `DIV`. The card header is a `PageHeader`, which draws a `header` element. The Vitest test passed a `div`.
- The sea check reads the background of the hero slot. `--auth-sea` colours that slot, not the layout root.
- `TextField · size l` sets no `type`. The Tab test reads a field that is not a text input as a ring, so `email` stays in Vitest.
- `PlacedPopup` and `PlacedPinPopup` place the point at x 380, y 240. At x 400 the Close hit area leaves the 390px viewport.
- The gallery map slots hold their own names as text, so the order test asserts `search:search`, not `search:s`.
- Vitest keeps `HATCH_LINE` as `rgba(139, 74, 28, 0.34)` next to line 75, with no render.
- Steps 3 to 5 of Changing the design system need claude.ai. The CI agent did not run them. The PR stays a draft.
