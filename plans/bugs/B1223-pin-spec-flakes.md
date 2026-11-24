# Plan: B.1223: Pin e2e tests and one unit test fail at random in CI

- **Spec:** #1223
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02), [PIN-03](../../docs/requirements.md#pin-03), [MAP-02](../../docs/requirements.md#map-02), [NFR-01](../../docs/requirements.md#nfr-01)
- **Status:** approved

## Approach

The logs and the code show four causes. The fix changes tests, the seed and one scan. It changes no app code.

1. **Time.** In the passing `main` run 45364602790, `pin-edit.spec.ts:94` took 29.5 s of its 30 s limit, and `pin-form.spec.ts:57` took 20.7 s. In run 45319688738 the poll at line 155 stopped at the test limit (D4).
2. **The first draw.** A passing `pins.spec.ts` test takes 8 to 12 s. Most of that time is the first draw of about 10,000 Pins, and `pickPin` gives it the 10 s `expect` limit (D5).
3. **Shared Pins and points.** `pickPin` and `emptyPoint` are deterministic, so all tests pick the same first Pin. The "Add a pin here" test adds a Pin at that Place, which turns it into a count marker. A parallel click on that Pin then hits the marker. Copies of one test (`--repeat-each`) also save at the same point and count each other's Pins (D6).
4. **The scan.** `noStoreBreaks` in `scripts/safety.mts` parses a file again for each page that imports it. The repo test takes 915 ms alone and goes past 5 s on a busy runner. The build parses each file once in each call. The 5 s limit stays.

The seed gets room for the Pins of 10 repeats (D1).

## Decisions

**D3 · How the build runs acceptance check 1** · Decides: Tech lead

Acceptance check 1 needs the seeded Postgres of the CI `e2e` job. `npm run e2e` in the build session uses the memory adapters, so `playwright.config.ts` leaves `pins.spec.ts` out there.

- **A.** A temporary commit adds a `pins-repeat` project to `playwright.config.ts`. It runs the three Pin specs with `repeatEach: 10`, and `chromium` leaves them out. The build pushes it once before the fix and once after. Then it reverts the commit before the PR leaves draft. Cost: two e2e jobs of about 20 minutes each. The workflow does not change.
- **B.** The tech lead adds a temporary step to the `e2e` job in `ci.yml`, a hand-back path. Cost: two hand-back commits.
- **C.** The tech lead runs the specs on a laptop with `scripts/ci-postgres.sh`. Cost: a manual run on a computer that is not the CI runner.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The time limit of the two long save tests** · Decides: Tech lead

#1025 expects that no test needs `test.slow()`. Its acceptance check 6 keeps a `test.slow()` line for a test that takes more than 20 s, with the cause in a comment. `pin-edit.spec.ts:94` takes 29.5 s and `pin-form.spec.ts:57` takes 20.7 s in a passing run.

- **A.** Add `test.slow()` to these two tests. The comment names the cause: two Person saves, a Pin save and a reload, with 10,000 Pins in software WebGL. Cost: two lines. Each assertion stays.
- **B.** Split `pin-edit.spec.ts:94` into three tests, one each for the date, the Person and the point. Each saves its own Pin. Cost: a run of acceptance check 1 saves about 60 Pins, so D1 of #1223 changes to 9,900 seeded Pins.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · The wait for the first draw of about 10,000 Pins** · Decides: Tech lead

#1025 sets a 10 s `expect` limit in `ciLimits`. Must not break 1 keeps it. The phone tap test failed twice on `main` because the first draw took more than 10 s.

- **A.** One constant `FIRST_DRAW = 20_000` in `e2e/map-points.ts`. Only the waits for the first draw after a page load use it: `pickPin`, `pickMarker` and the first `shownTypes` poll of a test. Cost: one constant and about six call sites. `ciLimits` does not change.
- **B.** Run `pins.spec.ts` in serial mode, so fewer browsers draw at once. Cost: about 3 minutes more on each `e2e` job, and acceptance check 1 loses the load of 3 workers.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D6 · How copies of a save test stay apart** · Decides: Tech lead

Must not break 2 keeps each assertion. With `--repeat-each=10`, three copies of a save test run side by side on one Tree.

- **A.** Each save test takes a slot, `test.info().parallelIndex` (0 to 2). The slot gives `pin-edit.spec.ts` its own start for `emptyPoint`, 60 px apart. It gives the "Add a pin here" test the slot-th free Pin from the end of the list, so other tests keep the first Pin. It gives `pin-form.spec.ts` its own date window, 30 years earlier for each slot. Cost: a slot helper and about 20 changed lines. The assertions stay as they are.
- **B.** Each check counts only the Pin that its own test saved, by id. Cost: about 30 lines. "No Pin at the old point" becomes "not this Pin at the old point", which loosens a check.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                | New / changed          | What                                                                                                                      |
| ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scripts/safety.mts`                | changed                | `noStoreBreaks` parses each file once in each call                                                                        |
| `scripts/seed-ci.mts`               | changed                | `SEED.pins` is 9,950; the comment gives room for 50 Pins (D1)                                                             |
| `scripts/__tests__/seed-ci.test.ts` | changed                | Expects 9,950 Pins and `MAX_PINS - SEED.pins` of 50 (D1)                                                                  |
| `e2e/map-points.ts`                 | changed                | `FIRST_DRAW` (D5); a slot helper; `pickPin` takes a slot from the end (D6)                                                |
| `e2e/pins.spec.ts`                  | changed                | `SEEDED` is 9,950 and `ALL` takes `SEEDED` to `SEEDED + 49` (D1); first-draw waits (D5); the save test uses its slot (D6) |
| `e2e/pin-edit.spec.ts`              | changed                | The start of `emptyPoint` per slot, and the dates per repeat, in both tests (D6); `test.slow()` on line 94 (D4)           |
| `e2e/pin-form.spec.ts`              | changed                | The date window per slot (D6); `test.slow()` (D4); the comment on the room for Pins (D1)                                  |
| `playwright.config.ts`              | changed, then reverted | The temporary `pins-repeat` project (D3)                                                                                  |

## Order of work

1. Push the `pins-repeat` project (D3). Link the failed run in the PR as evidence.
2. Change `scripts/safety.mts`. Run `npm test`.
3. Change the seed and the counts (D1).
4. Add the slots (D6), the first-draw wait (D5) and `test.slow()` (D4).
5. Push. The `pins-repeat` run must pass. Link it.
6. Revert the `pins-repeat` commit. Run the checks in `AGENTS.md` › Commands.

## Risks

- **A cause this plan does not name.** The fan test (`pins.spec.ts:385`) kept 2 fan Pins after the pointer left. The code shows no cause. If the run of step 5 fails in a test, the build comments the log lines on the PR and keeps it a draft.
- **Acceptance check 3** needs 20 `main` runs after the merge. The build cannot prove it. The tech lead reads `gh run list --workflow ci.yml --branch main` after 20 runs, and reopens #1223 on a Pin or `no-store.test.ts` failure.
- **Two slots on one point.** `emptyPoint` skips a point that has a Pin, so two starts 60 px apart can end on one point. Likelihood: low, because a Pin must block each grid point between the two starts. Cost of a fix: a check of the distance between slots, about 5 lines.

The `pins-repeat` run 45430643922 (attempt 2) had three more failures. The `e2e-failures` artifact was not read, so no cause is confirmed.

- **No free Pin after 10 copies.** `pins.spec.ts:345`, repeat 9: "No Pin is in the free area". A probable cause: each copy of "Add a pin here" turns one free Pin into a count marker, and `pickPin` also skips each Pin within 24 px of a marker. The log does not prove this cause. The build fixes it (see Deviations). The `pins-repeat` run 45456883366 passed.
- **Dates may not be enough.** If a later run fails, a Pin of another spec is at the same point and date. A fix needs a change to `emptyPoint`.
- **No count marker after 20 s.** `pins.spec.ts:460` (phone), repeat 5: no `.maplibregl-marker` after `FIRST_DRAW`. The log shows no server error and no cause. Likelihood: low, 1 of 20 copies. Cost of a fix: unknown until the screenshot shows if the map drew Pins.

## Proof

| Acceptance check                                 | Proven by                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| 1. 10 repeats with 3 workers pass                | The `pins-repeat` run 45456883366 (all 418 tests passed), linked in the PR        |
| 2. `no-store.test.ts` under 2.5 s                | The file time in the `test` job log of the PR                                     |
| 3. 20 `main` runs pass                           | The tech lead's check after the merge (Risks)                                     |
| Must not break 1: #1025 limits                   | `scripts/__tests__/playwright-failures.test.ts`, unchanged                        |
| Must not break 2: PIN-01, PIN-02, PIN-03, MAP-02 | The three Pin specs, with each assertion kept; the diff shows no removed `expect` |
| Must not break 3: NFR-01                         | The `@perf` test at `pins.spec.ts:497`, under 2500 ms with 9,950 seeded Pins      |

## Out of scope

- `map-click.spec.ts`, which saves one Pin and did not fail.
- The branch failures that the issue does not count, and the strict-mode `Edit` failure of `spec/M2.15.2`. On `main`, the locator is inside the popup.

## Deviations

- Step 1 did not occur: the build pushed the `pins-repeat` project and the fix together, so no failed run before the fix is linked.
- The second test of `pin-edit.spec.ts` also starts `emptyPoint` per slot (`500 - 60 * slot()`). In run 45430643922 its copies saved on one Place. The tech lead approved this change.
- The "Add a pin here" test takes its year from `repeatEachIndex` (1950 to 1959), for the Map date and the Pin date. A Pin that one repeat saves then does not show in the next repeat, so the free list does not run out. The tech lead asked for this fix in the PR comment.
- Both tests of `pin-edit.spec.ts` take their dates from `repeatEachIndex`. In run 45445888818 a start per slot did not stop the stacking: `emptyPoint` can run before the map draws the Pins of earlier copies. The first test uses five years for each repeat (1960 to 2009), the second one year (1920 to 1929). The Boundary data starts in 1910, so no "No borders are mapped" card shows. `pins.spec.ts` uses 1950 to 1959 and `pin-form.spec.ts` 1780 to 1855. The tech lead approved this change. `emptyPoint` does not change.
- `savedPins` in `pin-form.spec.ts` calls `page.request.get('/data/pins', { maxRetries: 3 })`. In run 45452061207 two copies of the test failed with `ECONNRESET` on the last call, which comes after a reload. Playwright retries only a reset connection with this option. The tech lead approved this change.
