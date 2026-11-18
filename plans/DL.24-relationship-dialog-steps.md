# Plan: DL.24: The Relationship dialog checks reach their state by steps

- **Spec:** #962
- **Requirement IDs:** [PPL-02](../docs/requirements.md#ppl-02)
- **Status:** draft

## Approach

Seven entries of `design/screens.json` open `/people/{MARIA.id}/relationships` and name an `account`. `relationship-edit-spouse` adds `?edit=` with `relationshipId(21)` of `server/auth/fixtures.mts`, the van Wyk marriage.

Six new states in `e2e/design-states.ts` carry the names of their entries. A shared helper chooses "Add" in a group region, as `e2e/relationships.spec.ts` does. The states fill a field and pick a row by its button name.

`main` answers the two "Not verified" concerns of the Spec:

- `readRelationships` in `app/people/[id]/relationships/page.tsx` gives the picker every Person except Maria.
- `create` in `server/trees/repository.mts` runs `checkRelationship` before the store. Maria has one biological parent, so the first refusal is `cycle`.

Playwright hides the caret by default (`caret: 'hide'`). If a board shows no focus ring, its state calls `blur()`, as `sign-in-filled` does.

After the seven folders go, only `relationship-save-failed` and `person-relationships-load-failed` use `RelationshipsScreen`, so `edit`, `empty` and `NO_RELATIONSHIPS` go.

## Decisions

**D1 · A sideways check of the Relationship dialogs** · Decides: Tech lead

`e2e/widths.spec.ts` checks each route of `design/screens.json` at seven sizes, as the default Account. On `main` it opens the seven `/screens` pages, so it checks each dialog at the four sizes that are not a phone. After this Spec, the seven routes show the not-found page to that Account. #959 plan D1 added a fixture test of the page, and said that it does not cover the dialogs. Does a fixture test keep the check of the dialogs?

- **A.** Split `wideAt` in `e2e/sideways.ts`: a new export measures the open page, and `wideAt` calls it. Add one test to the family Tree block of `e2e/fixture-people.spec.ts`. For the six family states and the four desktop sizes, it opens the route, runs the state and measures. `relationship-pick-empty` uses another Account, so it is not in the test. About 40 lines and 24 page loads.
- **B.** Add nothing. The dialogs lose the sideways check. No lines.
- **Other:** your own.

Recommended: A, because NFR-05 covers each screen, and the dialogs are the widest part of the page. B loses the check of seven states at four sizes.

## Files that change

| File                                                                                                        | New / changed | What                                                   |
| ----------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------ |
| `design/screens.json`                                                                                       | changed       | Seven entries open the app route and name an `account` |
| `e2e/design-states.ts`                                                                                      | changed       | Six states and the helper that opens the picker        |
| `e2e/fixture-people.spec.ts`                                                                                | changed       | The cycle test of check 3; D1 A adds the sideways test |
| `e2e/sideways.ts`                                                                                           | changed       | D1 A only: the measuring part becomes an export        |
| `app/screens/relationship-{pick,pick-no-match,pick-empty,details-parent,details-spouse,edit-spouse,cycle}/` | deleted       | The seven pages                                        |
| `app/screens/relationships.tsx`                                                                             | changed       | `edit`, `empty` and `NO_RELATIONSHIPS` go              |
| `app/screens/__tests__/relationships.test.tsx`                                                              | changed       | The seven avatar rows and the seven page tests go      |
| `features/people/components/PersonRelationships.tsx`                                                        | changed       | `query` and `marriage` go from `picking`               |
| `features/people/components/RelationshipPicker.tsx`                                                         | changed       | `initialQuery` goes                                    |
| `features/people/components/RelationshipDetails.tsx`                                                        | changed       | `startMarriage` goes                                   |
| `features/people/components/__tests__/PersonRelationships.test.tsx`                                         | changed       | Two tests type the filter and the marriage             |
| `features/people/components/__tests__/RelationshipPicker.test.tsx`                                          | changed       | The no-match test types "Pretorius"                    |
| `features/people/components/__tests__/RelationshipDetails.test.tsx`                                         | changed       | The marriage test types "ABT 1875"                     |
| `lib/design/__tests__/screens.test.ts`                                                                      | changed       | Seven `SCREEN_ONLY` rows go                            |

## Order of work

1. Change the four Vitest tests to type the text. Run them on the unchanged components, and see them pass.
2. Remove the props and the two fields. Run `npm run typecheck`.
3. Add the six states, and edit the seven entries.
4. Run `npm run design:check`. Read each `built.png` beside its `design.png` for a focus ring, and add `blur()` where the board has none. If an entry still fails, follow the first Flagged concern of the Spec.
5. Delete the seven folders. Run `npm test`, and see the `SCREEN_ONLY` test fail on seven rows. Remove the rows.
6. Edit `relationships.tsx` and its test. Run `npm test` for 100% coverage.
7. Add the cycle test. If D1 is A, add the sideways test. Run `npx playwright test --list --project=fixture`, and check that it lists each new test.
8. Run the search of check 4 and each check in `AGENTS.md` › Commands.

## Risks

- **An entry differs from its board.** Its page, its row and its prop stay, and checks 4 to 6 then fail for that prop. The PR names the entry, and the build files a Bug.
- **The Marriage field of `relationship-edit-spouse`.** The board holds "1875", and the Family Tree holds March 1875. The `/screens` page on `main` holds the same date, so the count of differing pixels does not grow.
- **The route with `?edit=` joins `e2e/widths.spec.ts`.** The default Account sees the not-found page, which passes.
- **DL.23 (#960) edits `relationships.tsx`, `screens.json` and `screens.test.ts`.** The two Specs set no value twice. The second to merge rebases.

## Proof

| Acceptance check                                                     | Proven by                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1. The seven entries pass on the app route                           | `npm run design:check` output, with the pixels, in the PR                                     |
| 2. No entry opens the seven routes, and each names its Account       | The diff of `design/screens.json`                                                             |
| 3. The cycle alert shows, and the Tree holds 8 Relationships         | New `fixture` test: it runs the state, waits for the alert, reloads and counts 8 "Edit" links |
| 4. No `initialQuery` or `startMarriage`                              | `git grep -n -E "initialQuery\|startMarriage" -- app features` output in the PR               |
| 5. `picking` has `group`, `picked` and `shown` only                  | The diff of `PersonRelationships.tsx`; `npm run typecheck`                                    |
| 6. No `SCREEN_ONLY` row for the seven folders                        | `lib/design/__tests__/screens.test.ts`                                                        |
| 7. No file under `design/canvas/`, `design/source/` or a JPG changes | `git diff origin/main --stat` in the PR                                                       |
| 8. The checks pass                                                   | `npm test`, `typecheck`, `lint` and `e2e` output in the PR                                    |

## Out of scope

- `relationship-save-failed`, `picking` and `shown`: DL.25 (#963).
- The `failed` branch of `RelationshipsScreen`: DL.23 (#960).
