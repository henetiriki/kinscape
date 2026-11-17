# Plan: B970: The setup sign-ins run in sequence, and CI keeps failure traces

- **Spec:** #970 (Bug)
- **Requirement IDs:** None. Must not break: [NFR-01](../../docs/requirements.md#nfr-01), [NFR-03](../../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

On `main` (e3e0ed6), the cause in the Bug is still there. The `setup` project has two sign-ins, and the top-level `fullyParallel: true` puts them in two workers. The last failure on `main` is run 44071344267.

1. The `setup` project gets `fullyParallel: false`. Playwright then runs the tests of `auth.setup.ts` in order, in one worker. A failed first sign-in does not skip the second one, as `mode: 'serial'` would.
2. A new helper `failureArtifacts(env)` returns `{ screenshot: 'only-on-failure', trace: 'retain-on-failure' }` if `env.CI` is set, else `{}`. The `setup`, `chromium`, `design` and `gallery` projects spread it into their `use`. The `perf` project does not get it, so its redraw times do not change.
3. In `ci.yml`, the `e2e` and `design` jobs get an upload step, `e2e-failures` and `design-failures`, with `if: ${{ failure() }}` and `retention-days: 7`. The path is `test-results` without `test-results/.auth/`. The `design` job also leaves out `test-results/design`, because `design-check` holds it.
4. The `gallery` artifact keeps its name and condition. It gets `retention-days: 7` and the same `.auth` exclusion.

The plan edits `.github/workflows/ci.yml`, a hand-back path. The tech lead builds it ([hand-back rule](../README.md#hand-back)).

## Alternatives considered

- `test.describe.configure({ mode: 'serial' })` in `auth.setup.ts`. A failed sign-in skips the next one, so a run shows one cause at a time.
- `workers: 1` for the whole run. All projects get slower.
- A longer canvas wait. The trigger stays, and the Bug wants a sequence.
- Two inline copies of the two settings, one in each config. `docs/code-rules.md` asks for one definition.

## Files that change

| File                                            | New / changed | What                                                                           |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `plans/bugs/B970-setup-sign-ins-in-sequence.md` | New           | This plan                                                                      |
| `scripts/playwright-failures.mts`               | New           | `failureArtifacts(env)`                                                        |
| `scripts/__tests__/playwright-failures.test.ts` | New           | The helper; both configs with and without `CI`; the three upload steps         |
| `playwright.config.ts`                          | Changed       | `fullyParallel: false` on `setup`; the helper on `setup`, `chromium`, `design` |
| `e2e/gallery.config.ts`                         | Changed       | The helper on `gallery`                                                        |
| `.github/workflows/ci.yml`                      | Changed       | Two new failure uploads; `retention-days` and the exclusion on `gallery`       |

## Order of work

1. Commit this plan: `plan(B970): approved by @<tech lead>`.
2. Write `playwright-failures.test.ts`. It does these checks:
   - It calls the helper with and without `CI`.
   - It loads each config with `vi.stubEnv('CI', …)` and `vi.resetModules()`, and reads the `use` of each project.
   - It checks that `setup` has `fullyParallel: false`.
   - It parses `ci.yml` with `yaml` and checks the upload step of each job.
3. See the tests fail on the missing settings. Paste one failing line in the PR's Evidence.
4. Add the helper, the two config changes and the `ci.yml` steps.
5. Run the checks in `AGENTS.md` › Commands.
6. In the PR's `design` job, read the two `[setup]` lines. The second line must start after the first ends. Paste them in the Evidence.
7. On the branch, make one e2e test fail for one push. Download the `e2e-failures` artifact and list its files. Revert the push.

## Risks

- **Playwright loads once.** `@playwright/test` throws if a process requires it twice. Vitest keeps a `node_modules` package in Node's cache, so `vi.resetModules()` loads it once. If it throws, mock `@playwright/test` with a `defineConfig` that returns its argument.
- **Slower jobs.** `retain-on-failure` records a trace for each test. The `design` and `e2e` jobs can take longer. Compare the job times of the PR with `main` in the Evidence.
- **Trace content.** A setup trace holds the typed password and the session cookie of a synthetic or fixture Account. Both passwords are in the repo, and each session ends with the job's server or database.
- **Slow sign-in stays.** The sequence removes the trigger, not the delay. The Bug keeps that open for a new Bug.

## Proof

| Acceptance check                                                       | Proven by                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| The second sign-in starts after the first ends                         | `setup` has `fullyParallel: false` (test); step 6 log lines       |
| With `CI`, `setup`, `chromium` and `design` have trace and screenshot  | `playwright-failures.test.ts`                                     |
| With `CI`, `perf` records no trace and no screenshot                   | `playwright-failures.test.ts`                                     |
| With `CI`, `gallery` has the two settings                              | `playwright-failures.test.ts`                                     |
| Without `CI`, no project records a trace or a screenshot               | `playwright-failures.test.ts`                                     |
| A failed test in `e2e`, `design` or `gallery` uploads trace/screenshot | `playwright-failures.test.ts` reads each step; step 7 artifact    |
| Each failure artifact has `retention-days: 7`                          | `playwright-failures.test.ts`                                     |
| No failure artifact holds `test-results/.auth/`                        | `playwright-failures.test.ts`; step 7 file list                   |
| `design` still uploads `test-results/design` as `design-check`         | `playwright-failures.test.ts`; the PR's `design-check` artifact   |
| NFR-03: one form sign-in each; other projects load the session         | `auth.setup.ts` does not change; `npm run e2e`                    |
| NFR-01: `@perf` runs alone, times do not change                        | `perf` keeps its `dependencies`; the `perf` project in `e2e`      |
| #902: the design check opens app routes as a fixture Account           | The PR's `design` job                                             |
| #900: the `e2e` job skips the `@fixture` sign-in                       | `grepInvert` does not change; the PR's `e2e` job                  |
| #965: `gallery` uploads expected, actual and diff images               | The `gallery` path keeps `test-results`; test reads the step      |
| `docs/security.md` Workflows: SHA pins, fewest permissions             | The new steps use the pinned `upload-artifact`; no `permissions:` |

## Out of scope

- The cause of the slow sign-in.
- Videos.

## Deviations

- Steps 6 and 7 ran after the PR was ready, because CI skips the `e2e`, `design` and `gallery` jobs on a draft. Commit a7ad2b4 is the failing test of step 7, and commit 85b8ebc reverts it.
- Approach: the first sentence became two sentences (STE rule 2, a review finding). The same commit changes one comment in `ci.yml` (STE rule 10).
