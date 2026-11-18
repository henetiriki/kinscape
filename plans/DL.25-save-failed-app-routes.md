# Plan: DL.25: The save-failed checks open app routes, and the last screen-only props go

- **Spec:** #963
- **Requirement IDs:** [PPL-01](../docs/requirements.md#ppl-01), [PPL-02](../docs/requirements.md#ppl-02)
- **Status:** approved

## Approach

The two entries of `design/screens.json` open app routes as `r.family@example.com`. The Family Tree is read-only, so its store refuses the Person save with `not-found`, and `PersonForm` shows the toast "Couldn't save. Your changes are still here.", which is the text of the board. The new state `relationship-save-failed` adds Anna Catharina le Roux as a child of Maria. It aborts each request that has a `next-action` header, so the action promise rejects, and `RelationshipDetails` shows the error toast. After the toast shows, the state removes its route. Then the two `/screens` pages, their stand-ins and the props `picking` and `shown` have no user, and they go.

## Decisions

**D2 · The Vitest tests of `picking` and `shown`** · Decides: Tech lead

Five tests use the props: two in `PersonRelationships.test.tsx` and three in `RelationshipDetails.test.tsx`. Tests on `main` already reach each state through the dialog and a mock action: the `pick()` steps (step 2), `it.each(alertCodes)` (the alerts) and "shows the error toast when the action throws". The test "opens at the picker when the picked Person is not in the Tree" covers a branch that goes.

- **A.** Delete the five tests. The tests named above keep each state covered.
- **B.** Rewrite each test with steps and a mock. Each then repeats a test on `main`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                | New / changed | What                                                                                                                                                                                                         |
| ------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/screens.json`                                               | changed       | `person-save-failed` and `relationship-save-failed`: `account` `r.family@example.com`, the app routes of Behaviour 1 and 2, and the new state for `relationship-save-failed`. Size, mode and threshold stay. |
| `e2e/design-states.ts`                                              | changed       | The new state `relationship-save-failed` (Behaviour 2). The comment of `person-saved-nothing` names the read-only Tree.                                                                                      |
| `e2e/fixture-people.spec.ts`                                        | changed       | The dialog width test expects 7 entries, not 6. A new test proves checks 2 and 3.                                                                                                                            |
| `app/screens/person-save-failed/page.tsx`                           | deleted       |                                                                                                                                                                                                              |
| `app/screens/relationship-save-failed/page.tsx`                     | deleted       |                                                                                                                                                                                                              |
| `app/screens/relationships.tsx`                                     | deleted       |                                                                                                                                                                                                              |
| `app/screens/relationship-actions.ts`                               | deleted       |                                                                                                                                                                                                              |
| `app/screens/__tests__/relationships.test.tsx`                      | deleted       | It tests only the deleted files.                                                                                                                                                                             |
| `app/screens/person.tsx`                                            | changed       | `PersonScreen` loses `save`. Both actions are `saveConflict`.                                                                                                                                                |
| `app/screens/person-actions.ts`                                     | changed       | `saveFailed` goes.                                                                                                                                                                                           |
| `app/screens/person-conflict/page.tsx`                              | changed       | It passes no `save`.                                                                                                                                                                                         |
| `app/screens/__tests__/person.test.tsx`                             | changed       | The `person-save-failed` cases and the `saveFailed` assertion go.                                                                                                                                            |
| `lib/design/__tests__/screens.test.ts`                              | changed       | Two rows of `SCREEN_ONLY` go. The rows of `person-conflict` and `people-loading` get the blockers of Behaviour 7.                                                                                            |
| `features/people/components/PersonRelationships.tsx`                | changed       | `picking` goes. `adding`, `open` and `picked` start empty.                                                                                                                                                   |
| `features/people/components/RelationshipDetails.tsx`                | changed       | `shown` goes. `code` and `failed` start empty.                                                                                                                                                               |
| `features/people/components/types.ts`                               | changed       | `DetailsShown` goes.                                                                                                                                                                                         |
| `features/people/components/__tests__/PersonRelationships.test.tsx` | changed       | D2: two tests go.                                                                                                                                                                                            |
| `features/people/components/__tests__/RelationshipDetails.test.tsx` | changed       | D2: the `describe` "the screen boards" goes.                                                                                                                                                                 |

## Order of work

1. Add the state, change the two entries and change `e2e/fixture-people.spec.ts`.
2. Run the `fixture` project and `DESIGN_SCREENS=person-save-failed,relationship-save-failed npm run design:check`. If an entry does not match its board, follow the first Flagged concern of #963 and stop the removal of that entry.
3. Delete the two folders, the stand-ins and their test. Trim `person.tsx`, `person-actions.ts` and `person.test.tsx`. Change `SCREEN_ONLY`.
4. Remove `picking`, `shown` and `DetailsShown`, with the tests of D2.
5. Run the checks of Commands, and `git grep -n -E "picking|DetailsShown|shown=" -- app features`.

## Risks

- **Next may treat an aborted action as a navigation error.** Then the page shows the error screen of Next, not the toast. Step 2 shows this before any deletion. If it fails, the entry stays as on `main` (Flagged concern 1), and a Bug names it.
- **The route also aborts a request that is not a save.** On the Relationships page, only the dialog calls an action, so the header names only the save.
- **#964 edits the same files.** It removes the `fuzzy-date-readings` row of `SCREEN_ONLY` and its test in `person.test.tsx`. The second PR to merge resolves a text conflict. The values do not differ.

## Proof

| Acceptance check                                             | Proven by                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1. Both entries pass on app routes                           | `npm run design:check`; the PR lists the differing pixels of each                                                                   |
| 2. No save reaches the server; the dialog and toast show     | New test in `e2e/fixture-people.spec.ts`: no request with `next-action` finishes, one fails, the dialog is open and the toast shows |
| 3. Maria's fields and 8 Relationships                        | The same test runs `person-saved-nothing` too, then reloads: the form holds Maria's fields, and the page has 8 "Edit" links         |
| 4. No `picking`, `DetailsShown` or `shown=`                  | The `git grep` of step 5, pasted in the PR                                                                                          |
| 5. The page folders of `app/screens/`                        | `lib/design/__tests__/screens.test.ts` (one row for each folder); `git ls-files app/screens` in the PR                              |
| 6. The two blockers                                          | `SCREEN_ONLY` in `lib/design/__tests__/screens.test.ts`                                                                             |
| 7. No file under `design/canvas/`, `design/source/` or a JPG | `git diff origin/main --stat`, pasted in the PR                                                                                     |
| 8. The checks pass                                           | `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e` output                                                               |

## Out of scope

- The pages `add-pin`, `map-account-menu`, `person-conflict`, `people-loading` and `fuzzy-date-readings`.
- A change to the toast, the alert, the dialog or the store.

## Deviations

- `e2e/fixture-people.spec.ts`: the dialog width test sets a 90s timeout. Seven dialogs at each size pass 30s on a busy runner.
