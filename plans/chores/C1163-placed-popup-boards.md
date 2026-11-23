# Plan: C1163: Swap two hand-drawn placed popups on boards for PlacedPopup and PlacedPinPopup

- **Spec:** #1163
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02)
- **Status:** approved

## Approach

`Map-pin-count` gets `KinScape.PlacedPinPopup` in place of its `popup()` function. One function draws the variants `popup`, `loading` and `failed`, so the swap changes all three. The app already draws these screens with `PlacedPinPopup` (`app/screens/map-pin-popup/MapPinPopupScreen.tsx`), so the board then matches the app.

`Map-add-pin` needs no swap. #1187 swapped `KinScape.ClickPopup` into its variant `click-popup`, so the board draws no popup by hand. D1 asks how #1163 records this.

No code and no design system input changes. Steps 2 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) find nothing to send. Step 7 swaps the board.

## Decisions

**D1 · The `Map-add-pin` row of #1163** · Decides: Tech lead

#1163 says that `Map-add-pin` draws the click popup by hand. On `main`, the board mounts `KinScape.ClickPopup` (#1187). The acceptance check "Each board in the table uses the control, or the issue says why it keeps its drawing" then needs an issue line.

- **A.** The build rewords the row of #1163: `ClickPopup` (#1187) replaced the hand-drawn part, so the board needs no swap. Cost: one line in the issue.
- **B.** The tech lead deletes the `Map-add-pin` row from #1163 before approval. Cost: the issue no longer records why the board needs no swap.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                           | New / changed | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/canvas/project/Map-pin-count.dc.html`                                                  | changed       | Delete `popup()`, `bar()` and the comment on the 30px gap. For `popup`, `loading` and `failed`, mount `h(K.PlacedPinPopup, …)` in the overlay `div`, beside the fan, at `x: P.x`, `y: P.y`. Props: `event: 'residence'`, `reading: 'From 1890 to 1905'`, `recorded: 'FROM 1890 TO 1905'`, `name: 'Example Person'`, `address: 'Farm Example, district Example'`, `state` (`loaded`, `loading` or `failed`), `onClose` and `onRetry` as `noop`. Keep the Pin and its ring. |
| `design/canvas/VERSION`                                                                        | changed       | Line 2, set by step 7.4.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `design/source/{map-pin-popup,map-pin-popup-loading,map-pin-popup-failed}.html` and their JPGs | changed       | The workflow "Design: Render snapshots" writes them. Edit none by hand.                                                                                                                                                                                                                                                                                                                                                                                                   |

## Order of work

The design system rule of [`plans/README.md`](../README.md#design-system) applies. The CI build agent has no row to build. It asks in the PR for the steps below, and keeps the PR a draft.

1. A local Claude Code session that the tech lead starts merges `origin/main` into the branch. Then it runs step 2: `npm run design-system`. It expects no change.
2. The same session runs steps 3 to 5. It needs a signed-in account. Each step reports "nothing differs".
3. The same session runs step 7 with the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt), for the boards in Files that change.
4. The session runs the workflow Design: Render snapshots once.
5. The session runs `npm run design:check` for `map-pin-popup`, `map-pin-popup-loading` and `map-pin-popup-failed`.

## Risks

- `PlacedAt` stops the popup top at `furniture-top` (88px). The Pin is at y 400, so the top is 286px, as the board has now. The pointer stays at 114px.
- A difference between `PinPopup` and the board can show in a snapshot. If the tech lead finds one in the JPGs, the session raises a Bug and keeps the old drawing ([board swap prompt](../../design/COMPONENTS.md#board-swap-prompt)).
- The variants `count` and `fan` use the same board. Their snapshots must not change. Step 7.2 lists each snapshot that changes.
- The branch is older than #1187. Without the merge, steps 3 to 5 find `ClickPopup` missing. The export also fails on a board that mounts `PlacedAt`: #1187 fixed that.

## Proof

| Acceptance check                                                                     | Proven by                                                                                     |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Each board in the table uses the control, or the issue says why it keeps its drawing | `Map-pin-count.dc.html` mounts `KinScape.PlacedPinPopup`; the `Map-add-pin` row of #1163 (D1) |
| `npm run design:check` passes for each screen that the boards feed                   | The `design` job, for the three `map-pin-popup` screens and `pin-click-popup`                 |
| Steps 2 to 7 are done on the branch                                                  | The step 7 commit of `design/canvas/`, line 2 of `canvas/VERSION` and the workflow commit     |

## Out of scope

- `Map-add-pin.dc.html`: #1187 swapped in `ClickPopup`.
- Each board that this table does not list.

## Deviations

- The build also deleted the `BUTTON` helper of `Map-pin-count.dc.html`. Only `popup()` used it.
- The JPGs of the three snapshots did not change: the render matched them byte for byte.
