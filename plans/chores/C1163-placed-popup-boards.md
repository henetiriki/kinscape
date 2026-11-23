# Plan: C1163: Swap two hand-drawn placed popups on boards for PlacedPopup and PlacedPinPopup

- **Spec:** #1163
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02)
- **Status:** draft

## Approach

`Map-pin-count` gets `KinScape.PlacedPinPopup` in place of its `popup()` function. One function draws the variants `popup`, `loading` and `failed`, so the swap changes all three. The app already draws these screens with `PlacedPinPopup` (`app/screens/map-pin-popup/MapPinPopupScreen.tsx`), so the board then matches the app.

`Map-add-pin` keeps its click popup if D1 is A. `PlacedPopup` draws the Jurisdiction popup: a chain, a place, the Pins there and "Copy chain". The click popup shows a point, a hint and "Add a pin here". Spec #1187 builds the click popup as its own part and swaps it into `pin-click-popup`.

No code and no design system input changes. Steps 2 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) find nothing to send. Step 7 swaps the board.

## Decisions

**D1 · The click popup of `Map-add-pin`** · Decides: Tech lead

The board `Map-add-pin`, variant `click-popup` (snapshot `pin-click-popup`), draws the click popup by hand. `PlacedPopup` holds a Jurisdiction popup, which has other content. Spec #1187 builds the click popup as a part with its own placing, and its step 7 swaps that part into `pin-click-popup`.

- **A.** Keep the hand-drawn click popup. The build rewords #1163: the board keeps its drawing until #1187 swaps in the click popup. Cost: one line in the issue.
- **B.** Swap `PlacedPopup` into the board, with a sample chain at the point. Cost: `pin-click-popup` shows a Jurisdiction popup that the add-pin path never opens. #1187 then replaces it.
- **C.** Block the row on #1187, and swap the click popup here. Cost: #1187 already does this swap, so this Chore waits for nothing new.
- **Other:** your own.

Recommended: A, because the click popup is a different part, and #1187 owns it.

## Files that change

| File                                                                                                                          | New / changed       | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/canvas/project/Map-pin-count.dc.html`                                                                                 | changed             | Delete `popup()`, `bar()` and the comment on the 30px gap. For `popup`, `loading` and `failed`, mount `h(K.PlacedPinPopup, …)` in the overlay `div`, beside the fan, at `x: P.x`, `y: P.y`. Props: `event: 'residence'`, `reading: 'From 1890 to 1905'`, `recorded: 'FROM 1890 TO 1905'`, `name: 'Example Person'`, `address: 'Farm Example, district Example'`, `state` (`loaded`, `loading` or `failed`), `onClose` and `onRetry` as `noop`. Keep the Pin and its ring. |
| `design/canvas/project/Map-add-pin.dc.html`                                                                                   | changed (D1 B only) | Mount `h(K.PlacedPopup, …)` at `E` in place of `clickPopup`.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `design/canvas/VERSION`                                                                                                       | changed             | Line 2, set by step 7.4.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `design/source/{map-pin-popup,map-pin-popup-loading,map-pin-popup-failed}.html` and their JPGs (D1 B: also `pin-click-popup`) | changed             | The workflow "Design: Render snapshots" writes them. Edit none by hand.                                                                                                                                                                                                                                                                                                                                                                                                   |

## Order of work

The design system rule of [`plans/README.md`](../README.md#design-system) applies. The CI build agent has no row to build. It asks in the PR for the steps below, and keeps the PR a draft.

1. A local Claude Code session that the tech lead starts runs step 2: `npm run design-system`. It expects no change.
2. The same session runs steps 3 to 5. It needs a signed-in account. Each step reports "nothing differs".
3. The same session runs step 7 with the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt), for the boards in Files that change.
4. The session runs the workflow Design: Render snapshots once.
5. The session runs `npm run design:check` for `map-pin-popup`, `map-pin-popup-loading` and `map-pin-popup-failed`.

## Risks

- `PlacedAt` stops the popup top at `furniture-top` (88px). The Pin is at y 400, so the top is 286px, as the board has now. The pointer stays at 114px.
- A difference between `PinPopup` and the board can show in a snapshot. If the tech lead finds one in the JPGs, the session raises a Bug and keeps the old drawing ([board swap prompt](../../design/COMPONENTS.md#board-swap-prompt)).
- The variants `count` and `fan` use the same board. Their snapshots must not change. Step 7.2 lists each snapshot that changes.

## Proof

| Acceptance check                                                                     | Proven by                                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Each board in the table uses the control, or the issue says why it keeps its drawing | `Map-pin-count.dc.html` mounts `KinScape.PlacedPinPopup`; for D1 A, the reworded #1163    |
| `npm run design:check` passes for each screen that the boards feed                   | The `design` job; `pin-click-popup` is in `NO_ENTRY` until #1187                          |
| Steps 2 to 7 are done on the branch                                                  | The step 7 commit of `design/canvas/`, line 2 of `canvas/VERSION` and the workflow commit |

## Out of scope

- The click popup part and its swap into `pin-click-popup` (#1187).
- Each board that this table does not list.

## Deviations
