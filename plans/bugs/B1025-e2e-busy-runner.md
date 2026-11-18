# Plan: B1025: The e2e tests fail at random when the CI runner is busy

- **Bug:** #1025
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03), [PPL-01](../../docs/requirements.md#ppl-01), [MAP-03](../../docs/requirements.md#map-03), [NFR-01](../../docs/requirements.md#nfr-01)
- **Status:** approved

## Approach

The server answers in 10 to 190 ms, but the browser has too little CPU on the 4-core runner. So the plan changes the test settings and one test, not the app.

1. A new function `ciLimits(env)` in `scripts/playwright-failures.mts` returns `{ expect: { timeout: 10_000 }, workers: 3 }` if `CI` is set, and `{}` if not. Both configs spread it, so the two values have one home.
2. `e2e/fixture-people.spec.ts:51` becomes `await expect(rows).toHaveCount(13)`, which waits for the list.
3. The five `test.slow()` lines go. Five CI runs then give the time of each of those tests. A line returns only if its test takes more than 20 s in one run.

The Bug reproduces on `origin/main` (d45d712f): the count line is at `fixture-people.spec.ts:51`, and run 44334105496 failed on `sign-in.spec.ts:27`.

## Decisions

**D1 · The number of CI workers** · Decides: Tech lead

[B.981 D1](B981-sign-out-e2e-race.md#decisions) (#981) kept 4 workers and chose `test.slow()`, because 2 workers doubled the job time. #1025 sets 3. The B.981 plan measured `navigation.spec.ts:279`: 21 to 36 s with 4 workers, 16 to 27 s with 3, 12 to 17 s with 2.

- **A.** 3 workers, as #1025 says. The 5 runs give the job time. With 16 to 27 s, the `test.slow()` of `navigation.spec.ts:279` probably stays (acceptance check 6).
- ~~**B.** Keep 4 workers. Only the 10 s limit and the count fix change, and each `test.slow()` stays. This changes acceptance checks 2 and 5 of #1025.~~
- **Other:** your own.

Recommended: A, because it removes contention from each map test, and the 20 s rule keeps a `test.slow()` only where the times need it.

**Answer: A** (@henetiriki)

## Alternatives considered

- Canned responses with `page.route`: the server is not the slow part.
- `retries: 1` in CI: it hides a random failure.
- A project that runs the map tests alone: B.981 D1 C rejected it.
- The two values inline in each config: two homes for one value.

## Files that change

| File                                                                                                                              | New / changed | What                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/playwright-failures.mts`                                                                                                 | Changed       | Add `ciLimits(env)`.                                                                                                                               |
| `scripts/__tests__/playwright-failures.test.ts`                                                                                   | Changed       | Tests of `ciLimits`. The loader returns the whole config, and new tests read `workers` and `expect.timeout` of both configs with and without `CI`. |
| `playwright.config.ts`                                                                                                            | Changed       | Spread `ciLimits(process.env)` in place of the `workers` line. The comment gives the reason for 3.                                                 |
| `e2e/gallery.config.ts`                                                                                                           | Changed       | The same.                                                                                                                                          |
| `e2e/fixture-people.spec.ts`                                                                                                      | Changed       | Line 51 uses `toHaveCount(13)`.                                                                                                                    |
| `e2e/sign-in.spec.ts`, `e2e/date-dock.spec.ts`, `e2e/navigation.spec.ts`, `e2e/account-menu.spec.ts`, `e2e/gallery-looks.spec.ts` | Changed       | Remove `test.slow()` and its comment. A line that returns gets a comment with the cause.                                                           |
| `plans/bugs/B1025-e2e-busy-runner.md`                                                                                             | New           | This plan.                                                                                                                                         |

## Order of work

1. Run `git fetch origin main`. Add the worktree `.claude/worktrees/B1025` on the branch `bug/B1025-e2e-busy-runner` from `origin/main`. Commit this plan as `plan(B1025): approved by @<tech lead>`.
2. Write the `ciLimits` tests and the config tests. See them fail on the behaviour.
3. Add `ciLimits`, and spread it in both configs.
4. Change `fixture-people.spec.ts:51`.
5. Remove the five `test.slow()` lines.
6. Run the checks in `AGENTS.md` › Commands.
7. Push, and open a PR that is not a draft, so that each CI job runs.
8. After the run ends, run `gh run rerun <run id>` four times, one after the other. Read the time of each of the affected tests from the `list` lines of each attempt.
9. If a test took more than 20 s, put its `test.slow()` back with a comment that gives the cause. Then repeat steps 6 to 8 on the new head.
10. Write the 5 links, the times and the job time against `main` in the PR body.

## Risks

- **Job time.** Three workers can make the `e2e` job slower than its 4 minutes. Step 10 reports the time. If the job takes more than 6 minutes, stop for the tech lead.
- **A real slow response.** With a 10 s limit in CI, a UI that answers in 5 to 10 s passes. The limit stays 5 s outside CI.
- **Two rounds.** Step 9 can cost 5 more runs of about 5 minutes each.
- **A random failure in step 8 from another cause.** Do not rerun past it. Report the test and its trace in the PR, and stop for the tech lead.

## Proof

| Acceptance check                                          | Proven by                                                                                                   |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1. The hidden-words test waits for 13 rows                | `e2e/fixture-people.spec.ts:51`; the 5 runs                                                                 |
| 2. In CI, 3 workers and a 10 000 ms limit in both configs | `playwright-failures.test.ts`: `ciLimits` and both configs with `CI`                                        |
| 3. Outside CI, the Playwright defaults                    | The same tests without `CI`                                                                                 |
| 4. The three jobs pass 5 times in a row                   | The 5 run links in the PR body                                                                              |
| 5. No `test.slow()` where each time is 20 s or less       | `git grep 'test.slow' e2e`; the times in the PR body                                                        |
| 6. A test over 20 s keeps `test.slow()` with its cause    | The same                                                                                                    |
| NFR-03                                                    | `sign-in.spec.ts`, `sign-out.spec.ts`, `account-menu.spec.ts`, `navigation.spec.ts`                         |
| PPL-01                                                    | `fixture-people.spec.ts`, `people.spec.ts`                                                                  |
| MAP-03                                                    | `date-dock.spec.ts`                                                                                         |
| NFR-01                                                    | `playwright-failures.test.ts` "records nothing in the perf project in CI"; the `perf` project in the 5 runs |
| B.970                                                     | `playwright-failures.test.ts` "runs the %s sign-ins in sequence"                                            |
| C.965                                                     | The `gallery` job in the 5 runs                                                                             |

## Out of scope

- The cause of the slow map start in software WebGL.
- Fewer end-to-end tests that start the map.
- A guard that blocks requests to other hosts: the traces show none.

## Deviations

- Step 8: the tech lead starts each re-run. The token of the local session has read access to Actions only.
- Step 9: `test.slow()` returns to `navigation.spec.ts` (25.1 s in one run) and `gallery-looks.spec.ts` (20.9, 26.2 and 27.1 s). The other three lines stay removed: each time was 18.8 s or less.
