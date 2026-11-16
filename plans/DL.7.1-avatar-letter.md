# Plan: DL.7.1: The avatar of the signed-in Account shows R on each board

- **Spec:** #901
- **Requirement IDs:** None. The Spec changes the canvas, sample data and dev pages only.
- **Status:** approved

## Approach

The CI build changes the code first. A new constant `SAMPLE_ACCOUNT` in `app/screens/account.ts` holds the sample email `researcher@example.com` and `accountInitial` of it. The four `/screens` files that show an avatar read it, so they set no letter by hand (Behaviour 2). `lib/design/states.mts`, the `app/design-kit/` files and the tests that hold "L" use `'R'` (Behaviour 3, check 1). Then the build pushes, keeps the PR a draft and asks the tech lead to run the design system steps and edit the boards ([design-system rule](README.md#design-system)).

## Alternatives considered

- Call `accountInitial('researcher@example.com')` in each of the four files. This repeats the email four times, and the code rules ask for one constant.
- Read the email from the fixture Account list of DL.7 (#900). DL.7 is not merged, and this Spec does not wait for it.
- Compute the letter in `states.mts`. Behaviour 3 asks for the value "R", and the card states hold fixed props.

## Files that change

| File                                                                                                                                                         | New / changed           | What                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `app/screens/account.ts`                                                                                                                                     | New                     | `SAMPLE_ACCOUNT`: the sample email and its `accountInitial`                                           |
| `app/screens/people.tsx`, `person.tsx`, `relationships.tsx`, `map-account-menu/AccountMenuScreen.tsx`                                                        | Changed                 | Read `SAMPLE_ACCOUNT`; no letter by hand                                                              |
| `app/screens/__tests__/people.test.tsx`, `person.test.tsx`, `relationships.test.tsx`, `app/screens/map-account-menu/__tests__/page.test.tsx`                 | Changed                 | Assert that the avatar letter equals `accountInitial` of the sample email on each page with an avatar |
| `lib/design/states.mts`                                                                                                                                      | Changed                 | `'L'` → `'R'` in `AVATAR`, the Avatar states and `Menu · closed`                                      |
| `lib/design/__tests__/react-18.test.tsx`                                                                                                                     | Changed                 | `'L'` → `'R'`, to match the states                                                                    |
| `app/design-kit/inputs/pageParts.tsx`, `map-furniture/sections.tsx`, `surfaces/data.ts`                                                                      | Changed                 | `'L'` → `'R'`                                                                                         |
| `app/components/foundation/__tests__/Avatar.test.tsx`, `PageHeader.test.tsx`, `app/components/overlays/__tests__/Menu.test.tsx`                              | Changed                 | `'L'` → `'R'`, so that check 1 finds no "L" in `app/`. The tests check the same behaviour.            |
| The 11 boards of Behaviour 1, and `SG-Furniture`, `SG-Furniture-phone`, `SG-Surfaces-2`, `SG-Surfaces-phone-2` (letter by hand), in `design/canvas/project/` | Changed (local session) | The avatar letter "L" → "R"; nothing else                                                             |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                                                                    | Changed (local session) | Design system steps 3 to 5                                                                            |
| `design/source/*.html`, `design/*.jpg`                                                                                                                       | Changed (workflow)      | 54 snapshots and their 54 JPGs                                                                        |

## Order of work

1. Add the letter assertions to the four screen tests. See each fail on "L" against "R" ([test-first rule](README.md#test-first)).
2. Add `SAMPLE_ACCOUNT` and change the four screen files.
3. Change `states.mts`, the design-kit files and the other tests that hold "L".
4. Run `npm run design-system` (step 2) and the checks in `AGENTS.md` › Commands. Push. Keep the PR a draft. Ask the tech lead in the PR for steps 2 to 7.
5. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). The session needs a signed-in account.
6. Step 6: push the branch.
7. Step 7: the same person or session changes the letter on the 15 boards above. It runs 5.1 to 5.5 and pushes. The tech lead then runs "Design: Render snapshots".
8. Run `npm run design:check`. Compare the sha256 of each file under `design/canvas/project/ds/kinscape/` with `.design-system/project/` (check 5).

## Risks

- Check 1 does not find a letter that a board draws by hand. To reduce this, the plan lists the 4 hand-drawn boards, and the session searches each board for `>L<` before it pushes.
- `design:check` can pass with "L" on a board ([Flagged concerns of #901](https://github.com/henetiriki/kinscape/issues/901)). Check 6 is the guard.
- The `design` job fails after step 4 until the render workflow commits the snapshots. The PR stays a draft until then.
- If DL.3 (#896) merges first, the card images of Avatar, Menu and PageHeader change too. The build then updates them in this PR.

## Proof

| Acceptance check | Proven by                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1                | `git grep` for an `initial` with "L" in `design/canvas/project/*.dc.html`, `app/` and `lib/design/` prints nothing; output in the PR |
| 2                | The four screen tests; `add-pin` and `fuzzy-date-readings` show no avatar                                                            |
| 3                | `npm run design:check` output; `git diff origin/main -- design/screens.json` is empty                                                |
| 4                | A PR comment that lists each step, who ran it and its commit                                                                         |
| 5                | The sha256 report of step 4.6 in the PR                                                                                              |
| 6                | The tech lead's review of the changed JPGs                                                                                           |
| 7                | `npm test` (100% coverage) and `npm run typecheck` output                                                                            |

## Out of scope

- The fixture Account `researcher@example.com`: DL.7 (#900).
- The `account` field of `design/screens.json` and the move of entries to app routes: DL.8 (#902).
- The sample emails on the Sign-in boards.
