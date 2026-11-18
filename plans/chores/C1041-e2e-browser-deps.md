# Plan: C1041: The e2e job installs the browser without the system packages

- **Spec:** #1041
- **Status:** draft

## Approach

In the `e2e` job of `.github/workflows/ci.yml`, the step "Install the browser" runs `npm run e2e:install`. The comment above it says that the runner has Chromium's system packages, as in `claude-run.yml`. The job compares no pixels, so it needs no font package.

If Chromium does not start, the step installs only the libraries that the error names, with `sudo apt-get install --no-install-recommends`. It installs no font package.

This chore is a hand-back (`.github/workflows/**`). The tech lead builds it.

## Decisions

**D1 · How the PR makes the 3 runs** · Decides: Tech lead

The Chore asks for 3 passed runs of the `e2e` job in a row. Its "Why" counts 2 attempts of one run as 2 runs.

- **A.** Re-run the `e2e` job 2 times on the CI run of the build commit. Link each attempt. Cost: 2 re-runs, no commits.
- **B.** Push 2 empty commits after the build commit. Link the CI run of each commit. Cost: 2 extra commits.
- **Other:** your own.

Recommended: A, because each attempt tests the same commit and the same cache entry.

## Files that change

| File                       | New / changed | What                                                          |
| -------------------------- | ------------- | ------------------------------------------------------------- |
| `.github/workflows/ci.yml` | Changed       | The `e2e` step "Install the browser" and the comment above it |

## Order of work

1. Change the step and the comment.
2. Mark the PR ready. The `e2e` job skips a draft PR.
3. If Chromium does not start, read the missing libraries from the log. Add the `apt-get` line with only those libraries.
4. Make the 3 runs as D1 says.
5. Read the step time and the step log of each run.
6. Put the 3 links and the 3 times in the PR body.

## Risks

- If step 3 of Order of work is necessary, `apt-get install` can need `apt-get update` first. The update reads the Ubuntu mirror too, but it fetches no font package.
- A new runner image can drop a library that Chromium needs. Chromium then does not start, and the job fails.
- Without the CJK and emoji font packages, a glyph outside the web fonts can render at a different width. No project in the `e2e` job compares pixels.

## Proof

| Acceptance check                          | Proven by                           |
| ----------------------------------------- | ----------------------------------- |
| The `e2e` job passes in 3 runs in a row   | The 3 runs of Order of work step 4  |
| "Install the browser" under 30 s, 3 times | The step time in each of the 3 runs |
| No line of a font package in the step log | The step log of each of the 3 runs  |
| The PR body links the 3 runs and times    | The PR body                         |
