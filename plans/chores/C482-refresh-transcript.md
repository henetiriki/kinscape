# Plan: C482: Upload the refresh agent's transcript and include it in the denial audit

- **Spec:** #482
- **Status:** approved

## Approach

`keep-claude-output` gets a `name_suffix` input (D1: B), added to the upload name. The refresh job calls it with `if: always()`, `thread`, `name_suffix: -<spec number>-<run attempt>`. All three callers pin the commit adding the input; `actions-pin-update.yml` moves them after merge. The audit downloads with `-p claude-execution-output -p 'claude-execution-output-*'`, reads every `claude-execution-output.json` under the folder, and judges `claude-unblock.yml` by `refresh-settings.json`.

## Decisions

**D2 · How a run with several artifacts counts** · Decides: Tech lead

- **A.** Each artifact is one run read: total, average, repeat rule; the Runs column links a run once.
- **B.** Each workflow run counts once.
- **Other:** your own.

Recommended: A: each artifact is one Claude session, like a plan run.

**Answer: A**, as recommended (built unanswered).

**D3 · The Workflow column's name for it** · Decides: Tech lead

- **A.** `refresh`, the agent.
- **B.** `unblock`, from the file name like every other row.
- **Other:** your own.

Recommended: A: the unblock job runs no Claude.

**Answer: A.**

## Files that change

| File                                            | What                            |
| ----------------------------------------------- | ------------------------------- |
| `.github/actions/keep-claude-output/action.yml` | `name_suffix`                   |
| `.github/actions/run-claude/action.yml`         | Pin                             |
| `.github/workflows/claude-code-review.yml`      | Pin                             |
| `.github/workflows/claude-unblock.yml`          | Calls the action                |
| `scripts/denial-audit.mts`                      | Every artifact; refresh row; D2 |
| `scripts/__tests__/denial-audit.test.ts`        | Several artifacts; refresh row  |
| `scripts/__tests__/load-agent-files.test.ts`    | New input; third caller         |

## Order of work

1. Change the tests; see them fail.
2. Commit the action, then the callers pinned to it, then the audit.

## Risks

- `gh run download -p` layout: checked on a real run.
- Editing `claude-code-review.yml` skips this PR's review: run `/code-review`.

## Proof

| Acceptance check               | Proven by                                 |
| ------------------------------ | ----------------------------------------- |
| Named uploads; leak on Spec    | `load-agent-files.test.ts`; first refresh |
| Artifacts counted; refresh row | `denial-audit.test.ts`                    |
| Weekly audit                   | Next weekly run                           |
| Checks, diagram                | Pasted output                             |

## Deviations

- The audit lists artifacts once and downloads only those runs (most unblock runs have none). The suffix ends with the run attempt (a re-run can't reuse a name).
