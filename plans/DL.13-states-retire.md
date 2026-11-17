# Plan: DL.13: /design-kit/states goes

- **Spec:** #914
- **Requirement IDs:** none. The Spec deletes a hidden dev page.
- **Status:** approved

## Approach

The build deletes the board and its last tests, by the retirement steps of DL.11 (#912). It deletes `app/design-kit/states/` and the two screen entries, and adds the two image names to `NO_ENTRY`. In `e2e/design-kit.spec.ts`, the entry "Component states" in `BOARD_LINKS` gets `gone: true`. #942 (DL.11) added the field, the gone-board branch of the index test and the nav filter to `main`. The test "a board that is gone gives a 404" loops over each board with `gone`, so it covers `/design-kit/states`. No canvas, `design/source/` or JPG file changes, so the design system steps do not apply.

## Decisions

**D1 · The DL.11 PR is not merged** · Decides: Tech lead

#942 (DL.11) was open. It added `gone` to `BOARD_LINKS`, the gone-board branch of the index test and the nav filter, the 404 test "a board that is gone gives a 404", and seven names to `NO_ENTRY`. This Spec needs the same field and filter, and edits the same lines.

- **A.** The build does not wait. If #942 is on `main` when the build starts, the build uses its `gone` field and filter. If not, the build adds them as #942 does. The PR that merges second resolves the conflict.
- **B.** The build waits for #942. The build runs `gh issue edit 914 --add-blocked-by 912`, then uses the field and filter of #942.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | New / changed | What                                                                                  |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `app/design-kit/states/page.tsx`                | deleted       | The board (step 1).                                                                   |
| `app/design-kit/states/page.module.css`         | deleted       | The board's styles (step 1).                                                          |
| `app/design-kit/states/__tests__/page.test.tsx` | deleted       | The board's unit test (step 1).                                                       |
| `design/screens.json`                           | changed       | The entries `style-4-states` and `style-4-states-phone` go (step 2).                  |
| `lib/design/__tests__/screens.test.ts`          | changed       | `NO_ENTRY` gains `style-4-states` and `style-4-states-phone`, in sort order (step 3). |
| `e2e/design-kit.spec.ts`                        | changed       | Step 4. See Order of work.                                                            |

## Order of work

1. Run `git rm -r app/design-kit/states`.
2. Delete the two entries from `design/screens.json`.
3. Add the two names to `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`.
4. Make these changes in `e2e/design-kit.spec.ts`:
   1. Delete the tests "states labels each cell and keeps 44px hit areas" and "states is one column and no two cells overlap".
   2. Delete the helper `matrix`, because no test uses it after step 4.1.
   3. Remove `'states'` from the two phone loops. Change their comment to name only the boards that the loops open.
   4. Give the entry "Component states" of `BOARD_LINKS` the field `gone: true`, as D1 says.
   5. Make the test "a board that is gone gives a 404" loop over each board of `BOARD_LINKS` with `gone`. It expects status 404 for each.
5. Run the search of check 1: `git grep -n "design-kit/states" -- app e2e lib design/screens.json`. Paste the output in the PR.
6. Run `git diff main --stat -- design/canvas design/source 'design/*.jpg'`. Paste the empty output in the PR.
7. Run each check in `AGENTS.md` › Commands, and `npm run design:check`.

## Risks

- **Coverage.** The unit tests without `app/design-kit/states/` gave 100% on `main` (6057 statements, 3492 branches). No kept file loses a branch.
- **A missed test.** On `main`, only `e2e/design-kit.spec.ts` names the route. `e2e/widths.spec.ts` and the design check read the route from `design/screens.json`, so step 2 removes it there. If the build finds another test that opens the board, follow the first concern of the Spec.

## Proof

| Acceptance check                                                                                  | Proven by                                                      |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1. Only the kit bar and kit menu unit tests and `e2e/design-kit.spec.ts` hold `design-kit/states` | The `git grep` output of step 5 in the PR                      |
| 2. `/design-kit/states` gives a 404                                                               | The test "a board that is gone gives a 404"                    |
| 3. `/design-kit` and each board left match their snapshots                                        | `npm run design:check`                                         |
| 4. No canvas, source or JPG change                                                                | The `git diff --stat` output of step 6 in the PR               |
| 5. Unit tests, types, lint and e2e pass                                                           | `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e` |

## Out of scope

As the Spec says: the `SG-Controls` boards, their files, their `DESIGN.md` rows and sentence, and the two `NO_ENTRY` names go in DL.21 (#929).

## Deviations

- Spec item 6 says one new 404 test. The build extends the test "a board that is gone gives a 404" of #942 instead. The route stays as plain text in `BOARD_LINKS`, and no check changes (commit `1fc234e`).
