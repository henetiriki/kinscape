# Plan: DL.28.1: The other Map boards mount MapLayout

- **Spec:** #925
- **Status:** approved

## Approach

Each of the four files follows `Map-phone.dc.html`. The board root holds one `<x-import>` of `KinScape.MapLayout`. `renderVals()` builds each slot, after its `React` check, and takes `const { drawn, mount } = window.KinScapeBoard`. A drawn `<svg>` goes through `drawn`. Drawn markup that holds a component goes through `mount`. A component that takes an array, a number or a function is an `h` call, because `mount` passes each attribute as text. A part that no slot can place stays beside the frame, as on `Map` (DL.28 Deviations), with `z-index: 20` where it must paint above a slot. Each of the 14 heads loads `./board-helpers.js` after the bundle script (#925 D2).

The slots of each file:

| File                 | Slots                                                                                                                                                                                                                                                                                                                    | Beside the frame                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Map-phone-states`   | `children`: the map, `drawn`, with the `d` values in the string. `search`: `SearchBar` pill with `Avatar` (`expanded` on `account`). `layers`: `LayersButton`. `dock`: `DateDock` with `sheet`, as on `map-phone-collapsed`. `overlay`: the `empty-date` card (`overlayAt: 'top'`), the `empty-tree` and `loading` cards | The offline banner and its Layers button (top 156 px); the date error; the scrim; the drawn Layers sheet (#925 D4); the sources dialog; both account menus |
| `Add-pin`            | `panel`: the Add a pin panel, built with `h`                                                                                                                                                                                                                                                                             | None                                                                                                                                                       |
| `Add-pin-phone`      | `panel`: the Add a pin sheet, built with `h`                                                                                                                                                                                                                                                                             | None                                                                                                                                                       |
| `Map-credits-narrow` | D6                                                                                                                                                                                                                                                                                                                       | D6                                                                                                                                                         |

## Decisions

**D5 · The order of the board edit** · Decides: Tech lead

Behaviour item 7 names the [board swap prompt](../design/COMPONENTS.md#board-swap-prompt), which edits the canvas first. A local session cannot start Chromium, so only the workflow Design: Render snapshots proves check 1. DL.28 D2 and C1056 D5 answered "repo copy first" for `Map` and `Map-phone`.

- **A.** Edit the 14 files in the repo copy first. The workflow renders the 15 snapshots. Publish the 14 files to the canvas when each passes checks 1 to 3, then run 5.1 to 5.5. Cost: one publish step by hand; the build rewords item 7.
- **B.** Edit the 14 files on the canvas first, as item 7 says. Then run 5.1 to 5.5 and the workflow. Cost: a board that fails check 1 is on the canvas until a revert.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D6 · `Map-credits-narrow` at 800 × 120** · Decides: Tech lead

`export.json` renders both snapshots in an 800 × 120 viewport. `MapLayout.module.css` takes its phone form below a height of 500 px. In that form, `credits` is hidden, `panel` spans the width from 76 px, and `dock` spans the width at the bottom. The board draws a desktop panel box, a dock box, the scale bar and the credits. No slot can place them. DL.28 kept the credits of `Map` beside the frame (plan DL.28, Deviations).

- **A.** Mount `MapLayout` with no slot. The two boxes, the scale bar and the credits stay beside the frame. Cost: the frame places nothing, and the board keeps its drawn desktop edges.
- **B.** Keep the file as it is, and file a Bug (check 3). Its wrapper still loads the helpers (item 2). Cost: two rows of the PR table say "not swapped".
- **Other:** your own.

**Answer: Other:** B, and `Map-credits-narrow` and `Map-credits-narrow-open` do not load `./board-helpers.js`. The test does not list them. (@henetiriki)

## Alternatives considered

- One regex per wrapper in the test. One list of the six files that load the helpers gives both the boards and the import regex.

## Files that change

| File                                                                                                                                                                                                | New / changed | What                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `design/canvas/project/{Map-phone-states,Add-pin,Add-pin-phone,Map-credits-narrow}.dc.html`                                                                                                         | Changed       | Load the helpers; mount `MapLayout` as the Approach table says (D6 for `Map-credits-narrow`)            |
| `Map-phone-filters`, `-loading`, `-empty-tree`, `-empty-date`, `-districts`, `-offline`, `-account`, `-sources`, `-date-invalid`, `Map-credits-narrow-open` (all `design/canvas/project/*.dc.html`) | Changed       | One `<script src="./board-helpers.js"></script>` line after the bundle script                           |
| `design/__tests__/board-helpers.test.ts`                                                                                                                                                            | Changed       | `FRAMES` lists `Map`, `Map-phone` and the four files; `IMPORTS` matches a `dc-import` of any of the six |
| `design/canvas/VERSION`                                                                                                                                                                             | Changed       | Step 5.3                                                                                                |
| The 15 snapshots in `design/source/` and their JPGs                                                                                                                                                 | Changed       | The workflow Design: Render snapshots                                                                   |

## Order of work

A local Claude Code session that the tech lead starts does steps 1 to 5. The CI agent cannot edit `design/canvas/`. The session can stop after one file and push.

1. Add the four files to the test. See it fail on the 14 heads. Paste a failing line in the PR.
2. Edit the 10 heads and the four files in the repo copy (D5 A). Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check`. If Chromium starts, run `npm run design:export`. Push. Keep the PR a draft.
3. The tech lead runs Design: Render snapshots. Compare each committed JPG with `main`. Accept a shadow difference (#925 D3). If a slot changes more, put its drawn content back, and run the workflow again (check 2). If a file fails the export or its frame changes more, restore the file and file a Bug (check 3).
4. Publish the 14 files to the canvas. Run "Refreshing the canvas copy" (5.1 to 5.5). Paste the sha256 pair of each file in the PR.
5. Write the PR table: one row for each of the 15 snapshots (check 4).
6. The build rewords the line of #1051 that names #925 for the phone Layers sheet: no Spec swaps the sheet yet (#925 D4).

With D5 B, step 2 edits the canvas and runs 5.1 to 5.5, and step 4 drops.

## Risks

- `Map-phone-states` draws its scrim over the search bar, the Layers button and the dock. The slots have `z-index` 1 and 10, so the scrim and what sits on it need `z-index: 20`. Without it, the slots paint above the scrim in `map-phone-layers`, `map-phone-filters` and `map-sources-phone`.
- `offline` puts the Layers button at 156 px, below the banner. The `layers` slot is at 80 px, so the button stays beside the frame. The PR names the slot (check 2).
- `DateDock` may not show the invalid date of `date-invalid`. That dock then stays drawn, and the PR names it (check 2).
- `.panel` is a flex column. The Add a pin panel takes `flex: 1`, or it does not reach the bottom edge.
- If a wrapper does not load the helpers, its import throws on `window.KinScapeBoard`. Check 7 catches it.
- Estimate: about 10 changed lines of test code. The board files, the snapshots and the JPGs are not in the count.

## Proof

| Acceptance check                     | Proven by                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| 1. The four files mount `MapLayout`  | `git grep KinScape.MapLayout` on the four files; the JPG list in the PR (#925 D3) |
| 2. A kept slot is named              | The PR table and Deviations                                                       |
| 3. A failed file stays, with a Bug   | The PR table links the Bug                                                        |
| 4. The PR table has 15 rows          | The PR body                                                                       |
| 5. The design check passes           | `npm run design:check`; `git diff main -- design/screens.json` is empty           |
| 6. Only allowed paths change         | `git diff --name-only main`                                                       |
| 7. The 14 heads pass the helper test | `design/__tests__/board-helpers.test.ts`                                          |

## Out of scope

As the Spec says.

## Deviations

- D6: `Map-credits-narrow` and `Map-credits-narrow-open` get no edit, so 12 heads load the helpers, not 14. `FRAMES` in the test lists five files, not six.
- The `dock` slot of `Map-phone-states` keeps its drawn sheet in each variant (check 2). The real `DateDock` draws a wider field with a darker border, and it cannot show `1901-02-30`.
- The `overlay` slot keeps the drawn "No pins in 1901" card (check 2). The real `NoticeCard` draws its two buttons wider.
- `Add-pin` and `Add-pin-phone` call `mount` and not `drawn`: they draw no `<svg>`. Their panels mix `mount` and `h`.
- Step 6 did not run. #1051 is closed, and the build skips a closed issue.
- Chromium starts in the local session. A local export and a screenshot of each old and new snapshot show only shadow differences on 13 snapshots. The workflow is still the proof.
