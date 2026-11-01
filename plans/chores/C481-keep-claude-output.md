# Plan: C481: Share the summarise, secret-scan and upload steps between the review and run-claude

- **Spec:** #481
- **Status:** draft

## Approach

A new composite action, `.github/actions/keep-claude-output/`, holds the review's six steps as they are: clear the folder, check out `scripts` and `.nvmrc` from `main`, set up Node, summarise, scan, upload. Inputs: `artifact_name` (default `claude-execution-output`) and `thread` (required, the scan's `THREAD`). Each caller replaces its steps with one `if: always()` step, no `continue-on-error` (a failed upload still fails the job), passing `thread: ${{ github.event.issue.number || github.event.pull_request.number }}`.

## Decisions

**D1 · How the first PR pins the action** · Decides: Tech lead

No `main` commit has the action until this PR merges, and merges are squashed.

- **A.** One PR: commit 1 adds the action; commit 2 pins callers to commit 1, which stays reachable through `refs/pull/<n>/head`. On merge, `actions-pin-update.yml` moves the pin to the squash commit.
- **B.** Two PRs: this one adds the action with no callers; a second, after merge, pins it from `main`.
- **Other:** your own.

Recommended: A, because it keeps one PR and the pin is moved on merge.

## Files that change

| File                                            | What                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/actions/keep-claude-output/action.yml` | New                                                                                                                                       |
| `.github/actions/run-claude/action.yml`         | Calls it                                                                                                                                  |
| `.github/workflows/claude-code-review.yml`      | Calls it                                                                                                                                  |
| `scripts/scan-summary.sh`                       | Header names the action                                                                                                                   |
| `scripts/__tests__/load-agent-files.test.ts`    | Upload and scan tests read the action once; each caller calls it once, pinned, with no copy; the `upload-artifact` pin-equality case goes |

## Order of work

1. Change the tests; see them fail.
2. Commit the action; then the callers, pinned per D1.

## Risks

- D1 A: a SHA reachable only from a PR ref might not resolve after merge; the pin PR fixes it.
- This PR's review won't start (it changes `claude-code-review.yml`).

## Proof

| Acceptance check               | Proven by                                  |
| ------------------------------ | ------------------------------------------ |
| Callers carry no copy          | `load-agent-files.test.ts`                 |
| Upload after clean scan; hit   | Action tests; the scan stub tests          |
| Live                           | First review and plan run after the pin PR |
| Checks pass, diagram unchanged | Pasted output                              |
