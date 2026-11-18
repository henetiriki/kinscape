# Plan: DL.20: /design-kit/map-style goes

- **Spec:** #961
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** draft

## Approach

The build deletes the board and its tests by the retirement steps of DL.11 (#912). It deletes `app/design-kit/map-style/` and the two screen entries, and adds the two image names to `NO_ENTRY`. In `e2e/design-kit.spec.ts`, the link "Map style" in `BOARD_LINKS` gets `gone: true`. The test "a board that is gone gives a 404" then covers the route, and the nav tests stop at the board. No file outside the folder imports from it. No canvas, `design/source/`, JPG or `design/DESIGN.md` file changes, so the design system steps do not apply.

When `map-style` leaves the list of "the other boards on a phone", the list is empty. Its two loops then make no test. So the build deletes the list and its loops. The one test that is left, "type is one column" at 800 by 900, moves with its `describe` into "the boards on a phone".

## Decisions

**D1 · The map style page moves nowhere** · Decides: Tech lead

The Spec deletes the page and makes no `/screens` page. Two related issues give a different value:

- #893 (Intent), _Open questions_: "The map style page moves to /screens."
- #929 (DL.21), Flagged concerns: "DL.20 (the map style page moves to `/screens`) is not filed."

Where does the page go?

- **A.** Nowhere, as the Spec says. The canvas board "Map style" stays as the reference. No issue changes. The `/refine spec 893` session that drafts #929 replaces its concern.
- **B.** The folder moves to `app/screens/map-style/`, with a `SCREEN_ONLY` row. The two screen entries take the new route, and the e2e tests follow it. The build rewords Summary, Behaviour 1 to 3 and checks 1, 2 and 5 of #961. The estimate grows by about 40 lines.
- **Other:** your own.

Recommended: A, because the sheet is no state of an app screen, and the Intent wants `/screens` to hold only those states.

## Files that change

| File                                                  | New / changed | What                                                                             |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `app/design-kit/map-style/page.tsx`, `.module.css`    | deleted       | The board (Behaviour 1).                                                         |
| `app/design-kit/map-style/Preview.tsx`, `.module.css` | deleted       | The layer previews (Behaviour 1).                                                |
| `app/design-kit/map-style/layers.ts`, `types.ts`      | deleted       | The layer list and its types (Behaviour 1).                                      |
| `app/design-kit/map-style/__tests__/page.test.tsx`    | deleted       | Four unit tests of the board (Behaviour 1).                                      |
| `app/design-kit/map-style/__tests__/layers.test.ts`   | deleted       | Three unit tests of the layer list (Behaviour 1).                                |
| `design/screens.json`                                 | changed       | The entries `map-style` and `map-style-phone` go (Behaviour 2).                  |
| `lib/design/__tests__/screens.test.ts`                | changed       | `NO_ENTRY` gains `map-style` and `map-style-phone`, in sort order (Behaviour 2). |
| `e2e/design-kit.spec.ts`                              | changed       | Behaviour 3. See Order of work.                                                  |

## Order of work

1. Run `git rm -r app/design-kit/map-style`.
2. Delete the two entries from `design/screens.json`.
3. Add the two names to `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`.
4. Make these changes in `e2e/design-kit.spec.ts`:
   1. Give the link "Map style" of `BOARD_LINKS` the field `gone: true`.
   2. Delete the group "the map style board", with its two tests.
   3. Delete the tests "map style shows 20 cards with their labels and a scrolling code sample" and "map style takes the phone layout".
   4. Delete the list `boards` of "the other boards on a phone", and the two loops over it.
   5. Move the `describe` "at 800 wide and 900 tall", with "type is one column", into "the boards on a phone". Delete the empty group "the other boards on a phone" and its comment.
   6. Change the comment of "the boards on a phone" to name portrait, landscape and 800 by 900.
5. Run the search of check 1: `git grep -n "design-kit/map-style" -- app e2e lib design/screens.json`. Paste the output in the PR.
6. Run `git diff main --stat -- design/canvas design/source 'design/*.jpg' design/DESIGN.md`. Paste the empty output in the PR.
7. In the PR body, list each test that goes, with the reason "it tests the board alone" (Behaviour 7).
8. Run each check in `AGENTS.md` › Commands, and `npm run design:check`.

## Risks

- **Coverage.** No kept file imports from the folder. `EVENT_PATHS`, `boardTitle` and the `kit` classes keep other users. So no kept file loses a branch.
- **A missed test.** On `main`, only `e2e/design-kit.spec.ts` names the route in `e2e/`. `e2e/widths.spec.ts` and the design check read the route from `design/screens.json`, so step 2 removes it there.
- **Merge conflicts.** #922 (DL.19) and #964 (DL.26) also edit `design/screens.json` and `NO_ENTRY`. #922 also edits `BOARD_LINKS`. The PR that merges second resolves the conflict.

## Proof

| Acceptance check                                                                         | Proven by                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1. Only `boards.ts`, the kit bar and kit menu unit tests and the e2e link hold the route | The `git grep` output of step 5 in the PR                      |
| 2. `/design-kit/map-style` gives a 404                                                   | The test "a board that is gone gives a 404"                    |
| 3. `/design-kit` and each board left match their snapshots                               | `npm run design:check`                                         |
| 4. No canvas, source, JPG or `DESIGN.md` change                                          | The `git diff --stat` output of step 6 in the PR               |
| 5. `NO_ENTRY` holds the two names, and its test passes                                   | `lib/design/__tests__/screens.test.ts` in `npm test`           |
| 6. Unit tests, types, lint and e2e pass                                                  | `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e` |

## Out of scope

As the Spec says:

- The sentence of `design/DESIGN.md` › "Map style" that names the route, and the link in `BOARDS`: DL.21 (#929).
- `map-style` in `lib/design/shots.mts`: the board still renders.
- A `/screens` page, a README table and a check of the app's map layers.

## Deviations
