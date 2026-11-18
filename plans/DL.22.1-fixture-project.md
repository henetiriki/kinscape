# Plan: DL.22.1: A fixture project runs the tests that need a fixture Account

- **Spec:** #957
- **Requirement IDs:** None. This Spec changes test tooling only.
- **Status:** approved

## Approach

`playwright.config.ts` gets a third `webServer` entry: `npm run start -- -p 3002`, from the build of the server on port 3000. Its environment is `KINSCAPE_MEMORY_ADAPTERS: '1'`, `KINSCAPE_MEMORY_SIGN_IN: ''`, `KINSCAPE_DEV_PAGES: ''` and `NEXT_PUBLIC_E2E: '1'`. Two new projects use `http://localhost:3002` as their base URL:

- `fixture-setup` runs the new `e2e/fixture.setup.ts`. It signs in each Account of `FIXTURES` through the form, in sequence, and saves each session at `fixtureStateFor(email)`.
- `fixture` depends on `fixture-setup` and matches `fixture-*.spec.ts`.

`fixtureStateFor` sits beside `authStateFor` in `lib/design/check.mts` and gives `test-results/.auth/fixture/<email>.json`. The path stays under `test-results/.auth/`, so the CI artifacts exclude the new sessions with no change. The `setup` project and its `@fixture` tests stay as they are, for the `design` project on port 3000.

`signIn` moves from `e2e/auth.setup.ts` to `e2e/session.ts`, for both setup files. The `chromium` project ignores `fixture-*.spec.ts` in every run, and the `memorySignIn` condition goes. The `perf` project also waits for `fixture`, so that the timing tests still run alone. No filter drops `fixture` in a mode, so `npm run e2e` runs it with `E2E_SPLIT=1` and `KINSCAPE_MEMORY_SIGN_IN=1` too. `npm run design:check` passes `--project=design`, so it does not run `fixture`.

`.github/workflows/ci.yml` does not change. The `e2e` job sets `KINSCAPE_MEMORY_SIGN_IN=1` on its step, and the empty value on port 3002 overrides it. `parseEnv` ignores the database variables under the memory adapters.

## Decisions

**D1 · Where the 404 test goes** · Decides: Tech lead

Behaviour item 7 says that `fixture-accounts.spec.ts` runs "with no change to what it tests". Check 3 says that the same file holds a new test: `/screens/add-pin` gives 404 on port 3002. Where does that test go?

- **A.** Add the test to `e2e/fixture-accounts.spec.ts`. Its three tests stay as on `main`, and check 3 passes as written. About 10 lines.
- **B.** Put the test in a new file `e2e/fixture-dev-pages.spec.ts`. `fixture-accounts.spec.ts` does not change, and check 3 changes its file name. About 15 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The test of the project list** · Decides: Tech lead

`scripts/__tests__/playwright-failures.test.ts` expects exactly four projects. How does it get `fixture-setup` and `fixture`?

- **A.** Add them to the list. Also check their CI trace and screenshot, and that `fixture-setup` runs in sequence. About 10 lines.
- **B.** Add them to the list only. About 5 lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **Run `auth.setup.ts` a second time in the new setup project.** The file would need the project name to pick its port and paths, and it signs in only the Accounts that `design/screens.json` names. Behaviour item 4 asks for each Account of `FIXTURES`.
- **A CI job of its own with the memory adapters.** It adds a required check. The Spec keeps it as the fallback (Flagged concerns).

## Files that change

| File                                            | New / changed | What                                                                                                 |
| ----------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `lib/design/check.mts`                          | changed       | `fixtureStateFor(email)`                                                                             |
| `lib/design/__tests__/check.test.ts`            | changed       | The path that `fixtureStateFor` gives                                                                |
| `e2e/session.ts`                                | changed       | `signIn`, moved from `auth.setup.ts`                                                                 |
| `e2e/auth.setup.ts`                             | changed       | Imports `signIn`                                                                                     |
| `e2e/fixture.setup.ts`                          | new           | Signs in each Account of `FIXTURES` on port 3002                                                     |
| `e2e/fixture-accounts.spec.ts`                  | changed       | The 404 test of check 3 (D1: A)                                                                      |
| `playwright.config.ts`                          | changed       | The server on port 3002; the projects `fixture-setup` and `fixture`; the `chromium` and `perf` edits |
| `docs/infrastructure.md`                        | changed       | The row of `KINSCAPE_MEMORY_ADAPTERS` names the server on port 3002 of the CI `e2e` job              |
| `scripts/__tests__/playwright-failures.test.ts` | changed       | The two new projects (D2: A)                                                                         |

## Order of work

1. Write the test of `fixtureStateFor` and see it fail on the missing export. Then add the helper.
2. Move `signIn` to `e2e/session.ts`, and add `e2e/fixture.setup.ts`.
3. Edit `playwright.config.ts`. Run `npx playwright test --list`, and compare the files of `fixture` and `chromium`.
4. Add the 404 test to `e2e/fixture-accounts.spec.ts`.
5. Run `npm run e2e` locally in the default mode. Then run it with `E2E_SPLIT=1`.
6. Run `npm run design:check`.
7. Edit `docs/infrastructure.md`.
8. Run each check in `AGENTS.md` › Commands. Push, and read the log of the CI `e2e` job for the project `fixture`.

## Risks

- **One build serves the memory adapters.** Only check 1 proves it. If the server on port 3002 fails in the CI `e2e` job, stop and comment on #893, as the Spec says.
- **A local run with a server on port 3000.** Playwright then skips the build. The config comment says to run `npm run build` first, as for port 3001.
- **Sign-ins in parallel.** Two sign-ins at the same time exceed the canvas wait on a CI runner. `fixture-setup` sets `fullyParallel: false`. It can run beside `setup`, so the CI run shows whether two setup projects side by side are too slow.

## Proof

| Acceptance check                                   | Proven by                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| 1. `fixture` runs `fixture-accounts.spec.ts` in CI | The log of the CI `e2e` job, linked in the PR                |
| 2. `--list` splits the files                       | `npx playwright test --list` output in the PR                |
| 3. `/screens/add-pin` gives 404 on port 3002       | The new test in `e2e/fixture-accounts.spec.ts`               |
| 4. `design:check` passes on port 3000              | `npm run design:check` output, and the CI `design` job       |
| 5. The row of `KINSCAPE_MEMORY_ADAPTERS`           | The diff of `docs/infrastructure.md`                         |
| 6. Same required checks                            | No change to `.github/workflows/` or `docs/repo-settings.md` |
| 7. The checks pass                                 | `npm test`, `typecheck`, `lint` and `e2e` output in the PR   |

## Out of scope

- The tests of DL.22.2 and DL.22.3, which use the saved sessions of `fixture-setup`.
- A change to `.github/workflows/ci.yml`. If the CI `e2e` job needs one, the PR is a hand-back.

## Deviations

- `lib/design/check.mts` and its test change, as Behaviour item 4 asks. The first line of Behaviour says that no file under `lib/` changes.
