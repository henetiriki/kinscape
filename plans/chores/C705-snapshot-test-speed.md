# Plan: C705: Speed up the design-export snapshot test

- **Spec:** #705
- **Status:** approved

## Approach

On `main`, the test reads 3.4 MB and takes 3,990 ms alone, without coverage. Under 1 MB/s means that a step of `snapshotProblems` does more than linear work. Time each step on the real snapshots in a temporary test. The likely step is `/url\(#|([a-z-][\w-]*)\(/gi`, which starts again at each letter of a word, so a 13 KB base64 `src` in 31 snapshots costs the square of each run. Make the slow step read each character a fixed number of times, with the same output. The target is 1 s alone, a five-times margin.

## Decisions

**D1 · Fix not enough** · Decides: Tech lead

If the fixed test still takes more than 1 s alone, what then?

- **A.** Stop. Report each step's time. Wait.
- **B.** Also split the test into one `it` for each snapshot, with the same assertion.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                    |
| ----------------------------------------- | ------------- | --------------------------------------- |
| `scripts/design-export.mts`               | changed       | The slow step reads in linear time      |
| `scripts/__tests__/design-export.test.ts` | changed       | Remove the 30 s timeout and its comment |

## Order of work

1. Time each step. Remove the temporary test.
2. Fix the slow step. Keep each `snapshotProblems` test unchanged.
3. Remove the timeout.

## Deviations

- Added one unit test: a function name after leading digits, and a `(` with no name.

## Risks

- A regex change can change the problems that it names. The `snapshotProblems` unit tests and the 59 real snapshots catch this.
- Coverage makes CI slower. The margin covers it.

## Proof

| Acceptance check           | Proven by                        |
| -------------------------- | -------------------------------- |
| No per-test timeout        | The test file diff               |
| `npm test` passes with 5 s | The CI `npm test` job            |
| The test is faster         | Before and after times in the PR |
