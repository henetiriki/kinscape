# Plan: DL.8: The design check opens app routes, and a list justifies each /screens page

- **Spec:** #902
- **Requirement IDs:** None
- **Status:** approved

## Approach

`parseConfig` accepts an optional `account` on an entry. The check accepts it only if the email is in `known.accounts`, which `e2e/design-check.spec.ts` fills from `FIXTURES`. A new `authStateFor(account?)` in `lib/design/check.mts` gives the path of the saved session: `test-results/.auth/state.json` with no account, and `test-results/.auth/<email>.json` for a fixture Account. `playwright.config.ts` and `e2e/auth.setup.ts` use it, so the path has one home.

`e2e/auth.setup.ts` signs in once for each fixture Account that an entry of `design/screens.json` names, and saves the session. Each of these tests has the tag `@fixture`. Under `KINSCAPE_MEMORY_SIGN_IN=1`, `playwright.config.ts` leaves them out of `setup` and drops the `design` project, because that job has no fixture Account. `e2e/design-check.spec.ts` wraps each test in a `test.describe` that uses `authStateFor(screen.account)` as its storage state.

The four entries get `account` and their app routes. `person-not-found` opens `/people/01900000-0000-7000-8000-000000000404`, an id that no Person has. The folders `app/screens/person-new` and `app/screens/person-not-found` go, and `PersonNotFoundScreen` goes with them.

`SCREEN_ONLY` sits beside `NO_ENTRY` in `lib/design/__tests__/screens.test.ts`, as one more list that scopes the design check. A pure `screenOnlyProblems(folders, rows)`, also in that file, returns one message for each folder with no row, each row with no folder and each empty blocker. The test reads the folders of `app/screens/`, except `__tests__`. Each blocker names the data or outcome that no app route can give today: People in the Tree, a load failure, a save failure, a loading state, or a sample layout.

## Decisions

**D1 · Where `screenOnlyProblems` lives** · Decides: Tech lead

Only `screens.test.ts` uses `screenOnlyProblems`. The [code rules](../docs/code-rules.md) say that a test does not wire an export.

- ~~**A.** Keep it in `lib/design/sweep.mts`. Add a line to the wiring rule: a fitness-test helper in `lib/design` needs no wiring.~~
- **B.** Move it into `screens.test.ts` and drop its export. `sweepProblems` and `jpegSize` stay as they are.
- ~~**Other:** your own.~~

Recommended: A, because it matches `sweepProblems` and `jpegSize`.

**Answer: B** (tech lead)

## Alternatives considered

- A separate setup project for the fixture sign-ins. It needs its own filter for the split and the memory sign-in; the existing `setup` project has both.
- A sign-in inside each design test. It signs in once for each test, not once for each Account.
- `SCREEN_ONLY` in a module that the app imports. Only the test reads it, and the [code rules](../docs/code-rules.md) forbid an export that only a test uses.

## Files that change

| File                                                                       | New / changed | What                                                                                                  |
| -------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `lib/design/check.mts`                                                     | Changed       | `account` on `Screen`; `accounts` in `Known`; the unknown-account problem; `authStateFor`             |
| `lib/design/__tests__/check.test.ts`                                       | Changed       | Checks 2 and 3                                                                                        |
| `lib/design/__tests__/screens.test.ts`                                     | Changed       | `SCREEN_ONLY` with 22 rows; `screenOnlyProblems` and its unit tests; the folder test                  |
| `e2e/auth.setup.ts`                                                        | Changed       | One sign-in for each fixture Account that an entry names                                              |
| `e2e/design-check.spec.ts`                                                 | Changed       | Pass `accounts`; the storage state of each entry                                                      |
| `playwright.config.ts`                                                     | Changed       | `signedIn` comes from `authStateFor()`                                                                |
| `design/screens.json`                                                      | Changed       | The four entries: `account` and app route                                                             |
| `app/screens/person-new/page.tsx`, `app/screens/person-not-found/page.tsx` | Deleted       | The app routes show these states                                                                      |
| `app/screens/person.tsx`                                                   | Changed       | `PersonNotFoundScreen` goes                                                                           |
| `app/screens/__tests__/person.test.tsx`                                    | Changed       | The cases of the two deleted pages go; `app/people/__tests__/person-pages.test.tsx` covers the routes |
| `docs/architecture.md`                                                     | Changed       | The "Living style guide" row: the retire rule, `SCREEN_ONLY`, its test                                |
| `plans/DL.8-design-check-app-routes.md`                                    | New           | This plan                                                                                             |

## Order of work

1. Write the `parseConfig` and `authStateFor` tests, and see them fail. Change `check.mts`.
2. Write the `screenOnlyProblems` tests, and see them fail. Add the function to `screens.test.ts`.
3. Change `auth.setup.ts`, `design-check.spec.ts` and `playwright.config.ts`.
4. Change the four entries. Run `npm run design:check` with `DESIGN_SCREENS` set to the four names. If an entry fails, follow the first Flagged concern of the Spec: keep its entry and page, write the difference as its blocker, and file a Bug.
5. Delete the two folders and `PersonNotFoundScreen`. Change `person.test.tsx`.
6. Add `SCREEN_ONLY` and the folder test. Read each page to write its blocker.
7. Edit the architecture row.
8. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.

## Risks

- **An app route that differs from its snapshot.** The `/screens` layout paints `--surface-2` behind the page; the app route does not. Step 4 shows a difference before the deletions.
- **The sign-in throttle.** Five failures in 15 minutes lock an email, and a success does not clear them. `e2e/sign-in.spec.ts` and the state `sign-in-wrong-password` each fail once for `researcher@example.com`. A local server that serves three full runs in 15 minutes locks the fixture, and its sign-in fails in setup. A restart clears the memory throttle. CI starts a new server. A fix costs about 5 lines, but the snapshot `sign-in-phone-error` shows that email. I add none.
- **The word budget of `docs/architecture.md`.** The row grows. If `npm run words` fails, I shorten other words in the row.

## Proof

| Acceptance check                                       | Proven by                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| 1. The four entries pass on their app routes           | `npm run design:check` output in Evidence                  |
| 2. An unknown `account` throws and names the entry     | `check.test.ts`                                            |
| 3. No `account`: the synthetic Account                 | `check.test.ts` (`authStateFor()`); the other entries pass |
| 4. The two folders are gone; no `e2e/` file names them | `git ls-files app/screens`; `git grep` output in Evidence  |
| 5. A folder with no row fails and is named             | `screens.test.ts`                                          |
| 6. A row with no folder or an empty blocker fails      | `screens.test.ts`                                          |
| 7. The architecture row states the rule                | The diff                                                   |
| 8. Tests, types, e2e, 100% coverage                    | Output in Evidence                                         |

## Deviations

- The memory sign-in choice sits in `playwright.config.ts`, not `e2e/auth.setup.ts`: the code rules allow `process.env.KINSCAPE_*` there.
- The "Living style guide" row drops `proxy.ts`, which has no `/screens` rule. The row also uses a slash in "Preview/development" to stay in the word budget.
- Step 4 ran `npm run design:check -- -g "design: (person-new|person-form-phone|person-errors|person-not-found)"`, because the run denies a `DESIGN_SCREENS=` prefix.
- Each design test sits in a `test.describe` named `design: <name>`, and the test is `matches its snapshot`, so `-g "design: <name>"` still selects it.
- `screenOnlyProblems` sits in `screens.test.ts`, not `lib/design/sweep.mts` (D1).

## Out of scope

Each item of the Spec's "Out of scope / carried forward".
