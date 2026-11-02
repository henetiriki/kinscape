# Plan: C489: Overwrite the Claude output artifact on a re-run

- **Spec:** #489
- **Status:** draft

## Approach

`keep-claude-output`'s upload gets `overwrite: true` (`upload-artifact` v4.2 and later), keeping the name and 7-day retention. Its three callers pin the branch commit that changes it, as C482 did; `actions-pin-update.yml` moves them, then `run-claude`'s callers, after merge. It edits `.github/`, so the tech lead builds it (rule 13).

## Decisions

**D1 · The refresh job's run-attempt suffix** · Decides: Tech lead

`claude-unblock.yml` names each refresh upload `-<spec>-<attempt>`; the denial audit reads a Spec's latest attempt. `overwrite` makes the attempt part unneeded.

- **A.** Keep it; the audit is unchanged.
- **B.** Drop it, with the audit's attempt handling in `denial-audit.mts` and its tests.
- **Other:** your own.

Recommended: A, because the Chore keeps the names, and B changes the audit.

## Files that change

| File                                                                    | What                                      |
| ----------------------------------------------------------------------- | ----------------------------------------- |
| `.github/actions/keep-claude-output/action.yml`                         | `overwrite: true`, with a line on why     |
| `run-claude/action.yml`, `claude-code-review.yml`, `claude-unblock.yml` | Pin                                       |
| `scripts/__tests__/load-agent-files.test.ts`                            | The upload's `with` has `overwrite: true` |

## Order of work

1. Add `overwrite: true` to the test's expected `with`; see it fail.
2. Change the action, commit, pin the callers to that commit.
3. Run the checks.

## Risks

- The audit reads only a review's or run's last attempt, as it already does for a refresh.
- Unproven on a real re-run: confirm on the first failed job re-run after the pin PR merges.

## Proof

| Acceptance check        | Proven by                                           |
| ----------------------- | --------------------------------------------------- |
| Upload sets it; a test  | `load-agent-files.test.ts`                          |
| A re-run uploads        | The tech lead re-runs a failed job after the pin PR |
| Checks; no diagram diff | Pasted output                                       |
