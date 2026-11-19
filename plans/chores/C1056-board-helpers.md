# Plan: C1056: One shared helper script for the canvas boards

- **Spec:** #1056
- **Status:** approved

## Approach

`design/canvas/project/board-helpers.js` is a classic script in one block. It holds `camel`, `css`, `BOOLEAN`, `RENAME`, `mount` and `drawn`, and it sets `window.KinScapeBoard = { drawn, mount }`. `mount` is the copy in `Map.dc.html`, but an `<x-import>` whose name does not resolve on `window` throws `No component <name>`. The helpers read `window.React` when a board calls them. Each board takes `const { drawn, mount } = window.KinScapeBoard` after its `React` check. `prepare` replaces the script line with the file URL of the repo copy, as it does for `bundle.js`.

On `Map-phone`, the look-up sheet and its date row become one markup string for `mount`. `K.Icon` and `K.Text` become `<x-import>` elements. The Marriage glyph `<svg>` goes into the markup, so its `dangerouslySetInnerHTML` span goes. The markup has no whitespace between tags, because the `el` tree had no text nodes there.

The test runs the script in a JSDOM page with the React 18 UMD build. Each `mount` case compares the result with the tree that the old copy gave, built with `createElement`.

## Decisions

**D5 · The order of the board edit** · Decides: Tech lead

The Constraints name the board swap steps. The [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt) edits the canvas first. DL.28 D2 answered "repo copy first" for the same two boards. A local session cannot start Chromium, so only the workflow Design: Render snapshots proves check 5. #925 item 3 uses the board swap prompt for its 14 boards. No option changes #925.

- **A.** Edit the 12 files in the repo copy first. The workflow renders the 13 snapshots. If no JPG changes, publish the 12 files to the canvas, then run 5.1 to 5.5. Cost: one publish step by hand.
- **B.** Edit the 12 files on the canvas first. Then run 5.1 to 5.5 and the workflow. Cost: if a JPG changes, the canvas holds the failed boards until a revert.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Put the helpers in `bundle.js`. The bundle holds only the controls, and its tests pin the list.
- Load the script in the test with `import`. The tsconfig has `allowJs: false`, and the script runs on `window` as a classic script. `react-18.test.tsx` evaluates `bundle.js` in a JSDOM page in the same way.

## Files that change

| File                                                                                                                                                       | New / changed | What                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `design/canvas/project/board-helpers.js`                                                                                                                   | New           | The six helpers and `window.KinScapeBoard`                                                            |
| `design/canvas/project/Map.dc.html`                                                                                                                        | Changed       | Loads the script; no `camel`, `BOOLEAN`, `RENAME`, `css` or `mount`; `map` calls `drawn` (#1056 D1)   |
| `design/canvas/project/Map-phone.dc.html`                                                                                                                  | Changed       | Loads the script; no `css`, `el` or `drawn` copy; the look-up sheet is markup for `mount` (#1056 D4)  |
| `Map-account`, `Map-date-invalid`, `Map-districts`, `Map-empty-date`, `Map-empty-tree`, `Map-loading`, `Map-offline`, `Map-sources`, `Map-phone-collapsed` | Changed       | One `<script src="./board-helpers.js"></script>` line after the bundle script                         |
| `scripts/design-export.mts`                                                                                                                                | Changed       | `prepare` takes `urls.helpers`; `exportSnapshots` passes the file URL of `BOARD_DIR/board-helpers.js` |
| `scripts/__tests__/design-export.test.ts`                                                                                                                  | Changed       | `prepare` replaces the script line with the URL                                                       |
| `design/__tests__/board-helpers.test.ts`                                                                                                                   | New           | Checks 1 to 3                                                                                         |
| `design/canvas/VERSION`                                                                                                                                    | Changed       | Step 5.3                                                                                              |

## Order of work

A local Claude Code session that the tech lead starts does steps 1 to 5. The CI agent cannot edit `design/canvas/`.

1. Copy `camel`, `css`, `BOOLEAN`, `RENAME` and `mount` from `Map.dc.html`, and `drawn` from `Map-phone.dc.html`, into `board-helpers.js`. Write `board-helpers.test.ts`. See the unknown-component case fail on the missing throw. Paste the failing line in the PR. Add the throw.
2. Add the `prepare` case to `design-export.test.ts`. See it fail. Change `prepare` and `exportSnapshots`.
3. Edit `Map.dc.html`, `Map-phone.dc.html` and the nine heads. Run `npm test`, `npm run typecheck` and `npm run lint`. If Chromium starts, run `npm run design:export`. Push. Keep the PR a draft.
4. The tech lead runs Design: Render snapshots. If the workflow commits a JPG, stop and ask the tech lead (check 5).
5. Publish the 12 files to the canvas (D5 A). Run "Refreshing the canvas copy" (5.1 to 5.5). Paste the sha256 pair of each of the 12 files in the PR.
6. The tech lead opens `Map-loading` and `Map-phone-collapsed` on the canvas.

With D5 B, step 3 edits the canvas and runs 5.1 to 5.5, and step 5 drops.

## Risks

- `mount` gives the phone date input `defaultValue`, but `el` gave `value` with `readOnly`. React writes the `value` attribute for both. Check 5 shows any difference.
- `<x-import>` passes `size="16"` as text. `Icon` puts `size` in `width` and `height`, so the SVG does not change.
- If `board-helpers.js` does not load, a board throws on `window.KinScapeBoard`. Only a canvas without the file reaches this case, and step 5 publishes the file with the boards. A guard costs one condition in each of 2 boards. The plan adds no guard.
- Coverage excludes `design/canvas/**`, so the 100% rule does not measure `board-helpers.js`. The test cases cover each branch of `mount`.
- Estimate: about 250 changed lines, without the plan.

## Proof

| Acceptance check                       | Proven by                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1. No helper copy in the 11 boards     | `board-helpers.test.ts`: no board declares a helper or holds `dangerouslySetInnerHTML`                                             |
| 2. `mount` returns the old elements    | `board-helpers.test.ts`: HTML, SVG, `class` and `for`, boolean attributes, style text, a nested `<x-import>`, an unknown component |
| 3. Each head loads the script          | `board-helpers.test.ts`                                                                                                            |
| 4. The export passes on 13 snapshots   | The log of Design: Render snapshots, linked in the PR                                                                              |
| 5. The 13 JPGs are byte-identical      | The workflow commits no JPG                                                                                                        |
| 6. The canvas and repo files match     | The sha256 pairs of step 5                                                                                                         |
| 7. The two boards look as before       | The tech lead's note in the PR                                                                                                     |
| 8. The checks pass, with 100% coverage | The output of each command, pasted in the PR                                                                                       |

## Out of scope

- The five Sign-in boards keep their copy (#1056 D3).
- The 14 boards of #925.
- A design system input.

## Deviations

- `e2e/design-export.spec.mts` passes `helpers` to `prepare`. The plan did not list the file. `urls.helpers` has no default, so each caller of `prepare` gives it.
- Chromium starts in the local session, so step 3 ran `npm run design:export`. It passed on the 13 snapshots. The source of `map-phone` differs by one `;` in the style of the Marriage glyph.
