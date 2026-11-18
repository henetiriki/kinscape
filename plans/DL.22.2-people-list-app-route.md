# Plan: DL.22.2: The People list checks open /people

- **Spec:** #958
- **Requirement IDs:** [PPL-01](../docs/requirements.md#ppl-01), [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

A local session redraws the data of two board files to the 13 People of the Family Tree, as `/people` shows them for `r.family@example.com`. `People-list-no-match.dc.html` is a wrapper board, and its snapshot is the variant `no-match` of `People-list.dc.html`. So its file does not change, and its snapshot shows "0 of 13 people match" after the redraw.

Four entries of `design/screens.json` open `/people` with an `account`. `auth.setup.ts` signs in each Account that an entry names, on port 3000. The state `people-no-match` types "Pretorius", which no name of the Family Tree holds.

Three tests move to `e2e/fixture-people.spec.ts`. Each `describe` loads its session with `test.use({ storageState: fixtureStateFor(email) })`. The three `/screens` folders and their `SCREEN_ONLY` rows go. `SAMPLE_PEOPLE` goes, and `PeopleScreen` takes `people` with no default.

## Decisions

**D1 · A sideways check of a full People list** · Decides: Tech lead

`e2e/widths.spec.ts` checks each route of `design/screens.json` at seven sizes. On `main`, it opens `/screens/people-list`, which has 12 rows. After this Spec, it opens `/people` as the synthetic Account, whose rows depend on other tests. #959 moves the person routes too. Does a fixed list keep a sideways check?

- **A.** Move `SIZES`, `overflow`, `insideScrollers` and `reaching` to a new `e2e/sideways.ts`. Add a test to `e2e/fixture-people.spec.ts` that checks `/people` as `r.family@example.com` at each size. About 40 lines.
- **B.** Add nothing. The loop checks `/people` with the rows that it finds. No lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Who builds** · Decides: Tech lead

The Spec says a local session builds it, because only a local session edits `design/canvas/`. The CI build agent starts on the approving review unless the PR has the label `hand-back`. Who builds?

- **A.** The tech lead adds `hand-back` to this PR before the approving review. Then the tech lead runs `/build-local` in a local session, which does each step of Order of work.
- **B.** The CI agent does steps 4 to 9 and keeps the PR a draft. It asks in the PR for steps 1 to 3. After the snapshots land, a `@claude` comment makes it run step 10.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                             | New / changed | What                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------ |
| `design/canvas/project/People-list.dc.html`, `People-list-phone.dc.html`                         | changed       | `PEOPLE`: the 13 People of the Family Tree. The phone height changes only if the redraw grows it |
| `design/canvas/VERSION`                                                                          | changed       | The canvas version (step 5.3)                                                                    |
| `design/source/people-list{,-phone,-no-match}.html`, `design/people-list{,-phone,-no-match}.jpg` | changed       | The workflow renders them                                                                        |
| `design/screens.json`                                                                            | changed       | Four entries open `/people` and name an `account`                                                |
| `e2e/fixture-people.spec.ts`                                                                     | new           | The three tests, with 13 rows and 13 texts; D1 A adds the sideways test                          |
| `e2e/people.spec.ts`                                                                             | changed       | Two tests go                                                                                     |
| `e2e/widths.spec.ts`                                                                             | changed       | The gutter test goes; D1 A imports the helpers                                                   |
| `e2e/sideways.ts`                                                                                | new (D1 A)    | `SIZES` and the three helpers                                                                    |
| `app/screens/people-list/`, `people-list-no-match/`, `people-empty/`                             | deleted       | The three pages                                                                                  |
| `app/screens/people.tsx`                                                                         | changed       | `SAMPLE_PEOPLE` goes; `people` has no default                                                    |
| `app/screens/__tests__/people.test.tsx`                                                          | changed       | The tests of the three pages go; the loading and load-failed tests stay                          |
| `lib/design/__tests__/screens.test.ts`                                                           | changed       | Three `SCREEN_ONLY` rows go                                                                      |

## Order of work

1. A local session redraws `PEOPLE` in the two board files on the canvas. It changes no header, filter, row layout or spacing.
2. The session runs "Refreshing the canvas copy" (5.1 to 5.5) and pushes.
3. The tech lead runs Design: Render snapshots on the branch.
4. Delete the three folders. Run `npm test` and see the `SCREEN_ONLY` test fail on the three rows. Remove the rows.
5. Edit `app/screens/people.tsx` and its test.
6. Edit the four entries of `design/screens.json`. Set a new phone height only if the snapshot has one.
7. Move the three tests to `e2e/fixture-people.spec.ts`. Run `npx playwright test --list`, and check that `fixture` lists them.
8. If D1 is A, move the helpers and add the sideways test.
9. Search `e2e/` and `app/` for the three routes.
10. Run `npm run design:check` and `npm run design:export`. Paste the differing pixels of each entry. Run each check in `AGENTS.md` › Commands.

## Risks

- **A route differs from its board.** The entry and its page stay as on `main`. The PR names the difference, and the session files a Bug.
- **Thirteen rows pass the board height.** Each board and the app page cut the list at the bottom edge. The redraw keeps 844 px on the phone if the cut matches. The PR says which.

## Proof

| Acceptance check                        | Proven by                                                  |
| --------------------------------------- | ---------------------------------------------------------- |
| 1. The four entries pass on `/people`   | `npm run design:check` output, with the pixels, in the PR  |
| 2. No entry opens the three routes      | The diff of `design/screens.json`                          |
| 3. Only the rows and the count differ   | The diff of the two board files                            |
| 4. `fixture` runs the three tests       | The log of the CI `e2e` job, linked in the PR              |
| 5. No file holds the three routes       | `git grep` output in the PR                                |
| 6. No `SCREEN_ONLY` row for the folders | `lib/design/__tests__/screens.test.ts`                     |
| 7. Each snapshot matches its board      | `npm run design:export` prints "No snapshot changed"       |
| 8. The checks pass                      | `npm test`, `typecheck`, `lint` and `e2e` output in the PR |

## Out of scope

- `people-load-failed` (DL.23) and `people-loading`.
- The person and Relationships entries (DL.22.3).
