# Plan: DL.16: Colour roles and contrast ratios in the design system

- **Spec:** #917
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

A new list `COLOUR_ROLES` in `lib/design/roles.mts` holds the path, the role and the "on" path of each entry of the colour board. The list has the changes of Spec item 1 (#917 D3, D4). `valueAt` and `ratioOf` move to `lib/design/contrast.mts`, beside `contrastRatio` and `formatRatio`. `roleSentences` in `roles.mts` makes the sentences for one token path. `systemTokens` adds them to the usage text of each `colour` and `map` token. The private `nameOf` of `system.mts` moves to `css.mts` as `systemName`, so that the token list and the sentence make a name in one place. Then the board retires by the DL.11 steps. `formatColour` has no user after the board goes, so it goes with its test.

## Files that change

| File                                                                                               | New / changed | What                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                                                                              | changed       | `Role` (the seven roles of the board) and `ColourRole` (`path`, `role`, `on?`).                                                                                                                                        |
| `lib/design/roles.mts`                                                                             | new           | `COLOUR_ROLES`: 43 entries (30 swatches, 13 system lines). `MINIMUM`: text 4.5, border 3. `roleSentences(tokens, path, roles = COLOUR_ROLES)`: one sentence per entry of `path`, in the format of Spec item 4.         |
| `lib/design/contrast.mts`                                                                          | changed       | Gains `valueAt` and `ratioOf` (`on` is `colour.surface` by default). Loses `formatColour`. The file comment names no board.                                                                                            |
| `lib/design/css.mts`                                                                               | changed       | Gains `systemName(path)`: `cssName` without `--`.                                                                                                                                                                      |
| `lib/design/system.mts`                                                                            | changed       | The usage of each `colour` and `map` token is its note, then its role sentences. Uses `systemName`.                                                                                                                    |
| `lib/design/__tests__/roles.test.ts`                                                               | new           | The two rules of `swatches.test.ts` (NFR-06), on unrounded ratios. The sentence of a text, border and other role, "on error-bg" and "on map-land", and two entries for one path.                                       |
| `lib/design/__tests__/contrast.test.ts`                                                            | changed       | Tests of `valueAt` and `ratioOf`. The `formatColour` test goes.                                                                                                                                                        |
| `lib/design/__tests__/system.test.ts`                                                              | changed       | The expected usage is the note, then the role sentences. A test of `ink-3` (checks 1 and 2).                                                                                                                           |
| `app/design-kit/colour/`                                                                           | deleted       | The board: 7 files, with its tests.                                                                                                                                                                                    |
| `design/screens.json`                                                                              | changed       | Loses `style-2-colour` and `style-2-colour-phone`.                                                                                                                                                                     |
| `lib/design/__tests__/screens.test.ts`                                                             | changed       | `NO_ENTRY` gains the two names.                                                                                                                                                                                        |
| `e2e/design-kit.spec.ts`                                                                           | changed       | Spec items 6.5 to 6.7: two tests go, `colour` leaves the phone loop, the sheet test opens on `/design-kit` and chooses "Typography" (the last board to go, in DL.21), and "Colour" in `BOARD_LINKS` gets `gone: true`. |
| `e2e/dev-pages.spec.mts`                                                                           | changed       | `/design-kit/type` in place of `/design-kit/colour`.                                                                                                                                                                   |
| `design/DESIGN.md`                                                                                 | changed       | The sentence of Spec item 7.                                                                                                                                                                                           |
| `design/canvas/project/ds/kinscape/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | The design system steps 3 to 5 write them.                                                                                                                                                                             |

## Order of work

1. Write `roles.test.ts` and the new `system.test.ts` expectations. See them fail on the missing sentence, not on an import error. Paste the line in the PR Evidence.
2. Add the types, `systemName`, `valueAt`, `ratioOf`, `COLOUR_ROLES` and `roleSentences`. Change `systemTokens`.
3. Retire the board by Spec item 6. Change `design/DESIGN.md` by item 7.
4. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
5. Run `npm run design-system` (step 2 of [Changing the design system](../design/CANVAS.md#changing-the-design-system)).
6. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5. The session needs an account that is signed in to claude.ai. The CI build agent asks for these steps in the PR and keeps the PR as a draft. No board shows the change, so step 7 does not apply.

## Risks

- #918 (DL.17, plan PR #973) changes the same parts of `e2e/design-kit.spec.ts`, `lib/design/system.mts`, `design/DESIGN.md`, `design/screens.json` and `NO_ENTRY`. If it merges first, rebase this branch and run steps 2 to 5 again, so that check 9 holds. The same applies to #918 if this Spec merges first.
- The design system lists a token only if it has a note. Each of the 43 role paths has a note on `main`, `map.hatch.colour` too. The PR body says so (Flagged concerns of #917).
- A longer usage could pass `USAGE_MAX` (1000 characters). The longest note with its sentence is under 200 characters. The test "passes the format rules" proves it.

## Proof

| Acceptance check                                        | Proven by                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1. Each colour token with a role ends with its sentence | `system.test.ts` (the usage test); `npm run design-system` output in Evidence                                                     |
| 2. `ink-3`: "Role: text." and 4.5 or more on `surface`  | `system.test.ts`, the `ink-3` test                                                                                                |
| 3. A text colour under 4.5:1 fails and is named         | `roles.test.ts`, contrast test with the message `<path> as <role>`; the failing line in Evidence                                  |
| 4. A colour token with no role fails and is named       | `roles.test.ts`, the role test lists each missing path                                                                            |
| 5. Only the listed files hold `design-kit/colour`       | `git grep design-kit/colour -- app e2e lib design/screens.json design/DESIGN.md` output in Evidence                               |
| 6. `/design-kit/colour` is a 404                        | `e2e/design-kit.spec.ts` "a board that is gone gives a 404"                                                                       |
| 7. The index and each board left match                  | `npm run design:check`                                                                                                            |
| 8. Design system steps ran                              | PR comment of the tech lead or the local session                                                                                  |
| 9. Canvas copy has the same sha256                      | Step 5.2 of "Refreshing the canvas copy"                                                                                          |
| 10. No board, snapshot or JPG differs                   | `git diff origin/main --stat -- design/canvas design/source 'design/*.jpg'` shows only the three paths of the design system steps |
| 11. Tests, types, lint and e2e pass                     | CI                                                                                                                                |

## Out of scope

- The items under "Out of scope / carried forward" of #917: DL.21 (#929).
- `__tests__/proxy.test.ts` keeps `/design-kit/colour` as a path fixture. It opens no page, and check 5 does not search it.
- `lib/design/__tests__/shots.test.ts` keeps `style-2-colour-phone` as a name for `shotFor`. The JPG stays until DL.21.

## Deviations

- `lib/design/contrast.mts` also exports `DEFAULT_ON`, the default of `ratioOf`. `roles.mts` uses it, so that the sentence and the ratio name one token (review of #974).
