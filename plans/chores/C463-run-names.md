# Plan: C463: Name every issue/PR-triggered workflow run consistently

- **Spec:** #463
- **Status:** approved

## Approach

Each new `run-name` sits after the header comment, as in `backlog-spec-link.yml`: a comment naming the titles, then `format('<Verb>: {0}', <title>)`. Where the job has an `if:`, the run-name copies it, ends `|| format('Skipped <Verb>: {0}', <title>)` and keeps the "change them together" line. The five existing run-names and their comments swap `Skipped:` for `Skipped <Verb>:`. No `if:` changes.

## Files that change

| File                                         | What                                                    |
| -------------------------------------------- | ------------------------------------------------------- |
| `.github/workflows/backlog-issue-status.yml` | `Status:`                                               |
| `.github/workflows/backlog-milestone.yml`    | `Milestone:`, `Milestone: backfill`; skipped form       |
| `.github/workflows/claude-hand-back.yml`     | `Hand back:`                                            |
| `.github/workflows/claude-unblock.yml`       | `Unblock:` from the `unblock` job's `if:`; skipped form |
| `.github/workflows/claude-code-review.yml`   | `Review:`; skipped form                                 |
| `.github/workflows/ci-cache-cleanup.yml`     | `Clean caches:`; skipped form                           |
| `.github/workflows/claude.yml`               | `Skipped Respond:`                                      |
| `.github/workflows/claude-build.yml`         | `Skipped Build:`                                        |
| `.github/workflows/claude-plan.yml`          | `Skipped Plan:`                                         |
| `.github/workflows/backlog-spec-link.yml`    | `Skipped Link:`                                         |
| `.github/workflows/backlog-intent-ready.yml` | `Skipped Check Intent:`                                 |

`plan-pr-condition.test.ts` stays: its patterns end before the `format(` calls.

## Risks

- A copied `if:` that drifts names runs wrongly; it can't change what runs.
- This PR changes `claude-code-review.yml`, so it gets no Claude review (that workflow says why).

## Proof

| Acceptance check                            | Proven by                                                    |
| ------------------------------------------- | ------------------------------------------------------------ |
| Each workflow's `<Verb>:` and skipped title | Actions tab, after merge, on a test issue and PR (tech lead) |
| No bare `Skipped: ` left                    | `git grep "Skipped: " -- .github/workflows` finds nothing    |
| Lint, format, words, tests                  | CI                                                           |

## Out of scope

`ci.yml`, `claude-run.yml`, push, schedule and `workflow_dispatch` workflows.
