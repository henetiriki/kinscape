# Plan: DL.23: A fixture Tree that fails to load

- **Spec:** #960
- **Requirement IDs:** [PPL-01](../docs/requirements.md#ppl-01), [PPL-02](../docs/requirements.md#ppl-02)
- **Status:** draft

## Approach

`memoryStore` takes a third argument, `failing: TreeId[] = []`. For a Tree on that list, `listPersons` and `listRelationships` throw `new Error('The fixture Tree failed to load.')`. The throw comes after the access check, so an Account that may not access the Tree still gets an empty list, as the `TreeStore` contract says. The message is fixed and names no Person. The other reads and the read-only refusals do not change.

`FIXTURES` gains a fourth entry, last, so that the reads by position in `e2e/` stay true. The entry has these values:

- the email `r.failing@example.com`, the password `failing-password` and the subject `r.failing`;
- the Tree "Failing Tree", with `persons: [MARIA]` and no Relationship;
- `failing: true`, which no other entry has.

`appAdapters` passes the Tree id of each entry with `failing: true` as the third argument. The Tree is read-only, as each fixture Tree is. `auth.setup.ts` signs in each Account that an entry names, and `fixture.setup.ts` signs in each fixture Account, so no setup changes.

The two app pages do not change. Each catches the throw, logs `error.name` and shows its load-failed state. On the Relationships page, `findPerson` works, so the notice shows Maria's name. `design/source/person-relationships-load-failed.html` has the same heading as `person-relationships.html`, which passes with `MARIA` on `main`.

Behaviour 7 deletes `app/screens/people.tsx` and its test. `app/screens/__tests__/people.test.tsx` also tests `people-loading`, which stays (Spec, Out of scope). So the plan deletes only the two tests of the load-failed page, and the file keeps the test of the loading page.

## Files that change

| File                                                                   | New / changed | What                                                                                                          |
| ---------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| `server/trees/memory-store.mts`                                        | changed       | The `failing` argument; the two list reads throw                                                              |
| `server/trees/__tests__/memory-store.test.ts`                          | changed       | A failing Tree throws on both lists with the fixed message; its other reads and another Tree answer as before |
| `server/auth/fixtures.mts`                                             | changed       | The fourth Account                                                                                            |
| `server/auth/__tests__/fixtures.test.ts`                               | changed       | The list of emails and Trees gains the row; the Failing Tree holds Maria alone                                |
| `server/adapters.mts`                                                  | changed       | Passes the failing list                                                                                       |
| `server/__tests__/adapters.test.ts`                                    | changed       | Under the memory adapters, the Account signs in, `findPerson` finds Maria and both lists throw                |
| `design/screens.json`                                                  | changed       | The two entries open the app routes with `account`                                                            |
| `app/screens/people-load-failed/`, `person-relationships-load-failed/` | deleted       | The two pages                                                                                                 |
| `app/screens/people.tsx`                                               | deleted       | No page uses it                                                                                               |
| `app/screens/__tests__/people.test.tsx`                                | changed       | The two load-failed tests go                                                                                  |
| `app/screens/relationships.tsx`                                        | changed       | The `failed` prop, its branch and the comments that name it go                                                |
| `app/screens/__tests__/relationships.test.tsx`                         | changed       | The load-failed row of `it.each` and its test go                                                              |
| `lib/design/__tests__/screens.test.ts`                                 | changed       | Two `SCREEN_ONLY` rows go                                                                                     |

The deleted unit tests check the pages, not a behaviour. `app/people/(list)/__tests__/page.test.tsx` and `app/people/__tests__/relationships-page.test.tsx` test the load-failed state of the real pages.

## Order of work

1. Write the test of a failing Tree in `memory-store.test.ts`. See it fail because the list resolves. Add the argument.
2. Add the fixture Account and its tests. Wire `appAdapters`, and add its test.
3. Delete the two folders. Run `npm test`, and see the `SCREEN_ONLY` test fail on the two rows. Remove the rows.
4. Delete `people.tsx`, and edit the two screen tests and `relationships.tsx`. Run `npm test` for 100% coverage.
5. Edit the two entries of `design/screens.json`.
6. Run `npm run design:check`. Paste the differing pixels of each entry and the two `failed:` lines of the server log. If Chromium cannot start in the sandbox, link the CI `design` job.
7. Run each check in `AGENTS.md` › Commands.

## Risks

- **A route differs from its board.** The entry and its page stay as on `main`. The PR names the difference, and the build files a Bug. It edits no board and hides no difference in code.
- **The server log does not show in the output.** Playwright prints the stderr of each web server. If the CI log lacks the two lines, the PR cites the page tests that assert the log line, and says so.

## Proof

| Acceptance check                                         | Proven by                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1. `/people` shows the load-failed board                 | `design:check` on `people-load-failed`: it asserts the status 200 and the pixels                      |
| 2. The Relationships page shows the notice with her name | `design:check` on `person-relationships-load-failed`; `adapters.test.ts`: `findPerson` finds Maria    |
| 3. Both entries pass on app routes                       | `npm run design:check` output, with the pixels, in the PR                                             |
| 4. Another Tree answers as on `main`                     | `memory-store.test.ts`; the store contract tests, which pass no list                                  |
| 5. The log holds the name and no Person data             | The server log lines in the PR; `memory-store.test.ts` asserts the fixed message                      |
| 6. No sign-in without the memory adapters                | `adapters.test.ts`: the two tests that loop over `FIXTURES` with the memory sign-in and with Supabase |
| 7. No `SCREEN_ONLY` row for the two folders              | `lib/design/__tests__/screens.test.ts`                                                                |
| 8. The checks pass                                       | `npm test`, `typecheck`, `lint` and `e2e` output in the PR                                            |

## Out of scope

- A change to the two app pages, to `databaseStore` or to the `TreeStore` type.
- The Spec's list: a save that fails (DL.25), `people-loading`, and a failed read of the session.
