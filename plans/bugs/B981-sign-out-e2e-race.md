# Plan: B981: The own-session sign-out tests fail at random in the e2e job

- **Bug:** #981
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03)
- **Status:** approved

## Approach

The fault is in the waits of the two tests, not in the app. The plan changes test code and loosens no assertion.

1. A new helper `signOut(page)` in `e2e/session.ts` starts `page.waitForEvent('load')` with a `/sign-in` filter, then clicks the Avatar and Sign out, then waits for that event. The `load` event fires only for a new document, not for the client navigation. Thus no `page.goto` can start before the `/sign-in` document loads.
2. `e2e/account-menu.spec.ts:82` and `e2e/navigation.spec.ts:279` call `signOut` in place of their own clicks and `waitForURL`.
3. The answer to D1 removes the 30 s timeout.

Both faults reproduce on `main` with this runner's 4 cores. The command is `npm run e2e -- account-menu.spec.ts:82 navigation.spec.ts:279 --project=chromium --repeat-each=6`:

- With `--workers=4`, `navigation.spec.ts:279` hit the 30 s timeout in 2 runs of 6.
- With `--workers=3` and with `--workers=2`, `account-menu.spec.ts:82` failed at line 94 with `page.goto: net::ERR_ABORTED` in 1 run of 6.

## Decisions

**D1 · How the two tests pass on a slow runner** · Decides: Tech lead

These are the times of `navigation.spec.ts:279` in the 6 runs above:

| Workers | Time       | Timeouts |
| ------- | ---------- | -------- |
| 4       | 21 to 36 s | 2        |
| 3       | 16 to 27 s | 0        |
| 2       | 12 to 17 s | 0        |

Which change removes the timeout?

- **A.** Mark the two tests `test.slow()`, so each gets 90 s. Two lines. The map start stays slow. `sign-in.spec.ts` and `date-dock.spec.ts` keep the same risk.
- **B.** Set the CI `workers` to 2 in `playwright.config.ts`. One line. Each map test gets less contention. The `e2e` job can take longer. The build measures the job time in two CI runs and compares it with `main` in the PR.
- **C.** Move the two tests to a new project that runs them alone after `chromium`, and make `perf` wait for that project. A new project and a tag. If a `chromium` test fails, Playwright skips the two tests.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- `waitForURL(…, { waitUntil: 'load' })`: the URL already matches after the client navigation, and the old document has loaded. Thus the wait returns at once.
- `waitForResponse` on the `/sign-in` document: the response comes before the new document commits, so a `goto` can still abort it.
- A retry of `page.goto` after `ERR_ABORTED`: it hides the race.
- Removal of the document load from the app: no trace shows its source. The NFR-03 comment at `e2e/navigation.spec.ts:277` relies on that load.

## Files that change

| File                                   | New / changed | What                                                                                        |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `e2e/session.ts`                       | New           | `signOut(page)`: clicks Sign out and waits for the `load` event of the `/sign-in` document. |
| `e2e/account-menu.spec.ts`             | Changed       | The own-session test calls `signOut`.                                                       |
| `e2e/navigation.spec.ts`               | Changed       | The own-session test calls `signOut`.                                                       |
| `playwright.config.ts`                 | Changed       | D1 B: `workers: process.env.CI ? 2 : undefined`, and its comment.                           |
| `plans/bugs/B981-sign-out-e2e-race.md` | New           | This plan.                                                                                  |

## Order of work

1. Add `e2e/session.ts` with `signOut`.
2. Use `signOut` in the two own-session tests.
3. Make the change that D1 chooses.
4. Run the command of the Approach with `--repeat-each=20` and the worker count of D1: 4 under A or C, 2 under B. Paste the result in the PR.
5. Run the checks in `AGENTS.md` › Commands.
6. D1 B only: put the `e2e` job time of two CI runs and of two recent `main` runs in the PR.

## Risks

- **No document load after a sign-out.** If a later Next.js version ends the document load, `signOut` times out at its wait. The error then names the step, so the race cannot come back without a signal.
- **D1 B job time.** Two workers can make the `e2e` job longer. Step 6 measures it before the PR leaves the draft state.

## Proof

| What did you expect?                                                                | Proven by                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| After Sign out, each test waits for the new `/sign-in` document before `page.goto`. | `signOut` in `e2e/session.ts`; step 4 shows no `ERR_ABORTED` in 20 runs of each test. |
| The two tests pass on a slow runner.                                                | Step 4 on this 4-core runner; the CI `e2e` job passes in two runs.                    |

## Out of scope

- The code that starts the document load after the client navigation.
- Under D1 A or C: the slow waits in `sign-in.spec.ts` and `date-dock.spec.ts`.
- The copies of the synthetic Account in four e2e files.
