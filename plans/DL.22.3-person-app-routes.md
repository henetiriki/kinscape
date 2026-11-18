# Plan: DL.22.3: The person and Relationships checks open app routes

- **Spec:** #959
- **Requirement IDs:** [PPL-01](../docs/requirements.md#ppl-01), [PPL-02](../docs/requirements.md#ppl-02), [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** draft

## Approach

Four entries of `design/screens.json` open the app routes of Maria Magdalena du Toit (`MARIA` in `server/auth/fixtures.mts`) with an `account`. `auth.setup.ts` signs in each Account that an entry names, so `r.alone@example.com` needs no new setup. The state `person-leave` works on the app route as it does on `/screens`: it fills Notes, chooses "Relationships" and waits for the dialog.

The board order matches the app order. `groupRelationships` sorts each group by `byName`, and that gives Nel, Rossouw, Visser; Botha, Fourie, van Wyk; and the two du Toit children. `design/source/person-relationships.html` shows the same order.

One test moves to `e2e/fixture-people.spec.ts`, inside the `phone, 390 × 844` block of the family Tree. It opens `/people/${MARIA.id}`. The three folders and their `SCREEN_ONLY` rows go.

After the folders go, each export and prop of `app/screens/person.tsx` and `app/screens/relationships.tsx` still has a page: `relationship-pick-empty` uses `empty`. So only the comments that name a deleted page change.

## Decisions

**D1 · A sideways check of the edit and Relationships pages** · Decides: Tech lead

`e2e/widths.spec.ts` checks each route of `design/screens.json` at seven sizes, as the default Account. On `main` it opens the three `/screens` pages, with Maria and her Relationships. After this Spec, it opens Maria's two app routes, and the default Account's Tree does not hold her. So it checks the not-found page twice and the two filled pages never. DL.22.2 (#958) had the same gap for `/people` and chose a fixture test. #962 and #963 move the dialog entries to the same Relationships route. Does a fixture test keep the sideways check?

- **A.** Add one test to the family Tree block of `e2e/fixture-people.spec.ts`. It calls `wideAt` on `/people/{id}` and `/people/{id}/relationships`. About 10 lines. It covers the page, not the dialogs of #962.
- **B.** Add nothing. The loop checks the not-found page on the two routes. No lines.
- **Other:** your own.

Recommended: A, because the filled form and the three groups are the widest content of these pages.

## Files that change

| File                                                                               | New / changed | What                                                                                 |
| ---------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------ |
| `design/screens.json`                                                              | changed       | Four entries open the app routes and name an `account`                               |
| `e2e/people.spec.ts`                                                               | changed       | The `/people/{id}` test goes                                                         |
| `e2e/fixture-people.spec.ts`                                                       | changed       | The moved test; D1 A adds the sideways test                                          |
| `app/screens/person-edit/`, `person-relationships/`, `person-relationships-empty/` | deleted       | The three pages                                                                      |
| `app/screens/person.tsx`, `relationships.tsx`                                      | changed       | Comments that name a deleted page                                                    |
| `app/screens/__tests__/person.test.tsx`                                            | changed       | `person-edit` leaves the two `it.each` lists                                         |
| `app/screens/__tests__/relationships.test.tsx`                                     | changed       | The tests of the two pages go: the three groups, the empty lines and two avatar rows |
| `lib/design/__tests__/screens.test.ts`                                             | changed       | Three `SCREEN_ONLY` rows go                                                          |

The deleted unit tests check the pages, not a behaviour. `app/people/__tests__/relationships-page.test.tsx` and `PersonRelationships.test.tsx` test the groups and the empty lines on the real page.

## Order of work

1. Delete the three folders. Run `npm test` and see the `SCREEN_ONLY` test fail on the three rows. Remove the rows.
2. Edit the two screen tests and the comments in `person.tsx` and `relationships.tsx`. Run `npm test` for 100% coverage.
3. Edit the four entries of `design/screens.json`.
4. Move the test to `e2e/fixture-people.spec.ts`. Run `npx playwright test --list --project=fixture`, and check that it lists the test.
5. If D1 is A, add the sideways test.
6. Search `e2e/` and `app/` for the three routes (Proof, check 5).
7. Run `npm run design:check`, and paste the differing pixels of each entry. If Chromium cannot start in the sandbox, link the CI `design` job. Run each check in `AGENTS.md` › Commands.

## Risks

- **A route differs from its board.** The entry and its page stay as on `main`. The PR names the difference, and the build files a Bug. It edits no board and hides no difference in code.
- **A search for `/screens/person-relationships` also finds `person-relationships-load-failed`.** That page stays until DL.23. Check 5 searches for a whole route: `git grep -E "/screens/(person-edit|person-relationships|person-relationships-empty)(['\"/]|$)" -- e2e app`.

## Proof

| Acceptance check                                                     | Proven by                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1. The four entries pass on their app routes                         | `npm run design:check` output, with the pixels, in the PR     |
| 2. No entry opens the three routes, and each names its Account       | The diff of `design/screens.json`                             |
| 3. The leave dialog shows                                            | The `person-edit-leave` entry: the state waits for the dialog |
| 4. `fixture` runs the moved test                                     | The log of the CI `e2e` job, linked in the PR                 |
| 5. No file holds the three routes                                    | `git grep` output of Risks in the PR                          |
| 6. No `SCREEN_ONLY` row for the folders                              | `lib/design/__tests__/screens.test.ts`                        |
| 7. No file under `design/canvas/`, `design/source/` or a JPG changes | `git diff origin/main --stat` in the PR                       |
| 8. The checks pass                                                   | `npm test`, `typecheck`, `lint` and `e2e` output in the PR    |

## Out of scope

- The dialog entries and `picking` (DL.24), the save-failed entries (DL.25) and `person-relationships-load-failed` (DL.23).
- A change to `e2e/widths.spec.ts`.
