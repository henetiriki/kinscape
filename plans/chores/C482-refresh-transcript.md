# Plan: C482: Upload the refresh agent's transcript and include it in the denial audit

- **Spec:** #482
- **Status:** approved

## Approach

`keep-claude-output` gets a `name_suffix` input (D1). The refresh job calls it with `if: always()`, `thread`, `name_suffix: -<spec number>-<run attempt>`. All three callers pin the commit adding the input. The audit downloads with `-p claude-execution-output -p 'claude-execution-output-*'`, reads every file under the folder, and judges `claude-unblock.yml` by `refresh-settings.json`.

## Decisions

**D1 · How the refresh job names each upload** · Decides: Tech lead

- **A.** An `artifact_name` input.
- **B.** A `name_suffix` input, empty by default.
- **Other:** your own.

Recommended: B: no caller can break the audit's prefix match or the review's lookup.

**Answer: B** (@henetiriki, on #482).

**D2 · How a run with several artifacts counts** · Decides: Tech lead

- **A.** Each artifact is one run read; the Runs column links a run once.
- **B.** Each workflow run counts once.
- **Other:** your own.

Recommended: A: each artifact is one Claude session.

**Answer: A**, as recommended (unanswered).

**D3 · The Workflow column's name for it** · Decides: Tech lead

- **A.** `refresh`.
- **B.** `unblock`, the file name.
- **Other:** your own.

Recommended: A: the unblock job runs no Claude.

**Answer: A.**

## Files that change

| File                                              | What                            |
| ------------------------------------------------- | ------------------------------- |
| `.github/actions/keep-claude-output/action.yml`   | `name_suffix`                   |
| `run-claude/action.yml`, `claude-code-review.yml` | Pin                             |
| `.github/workflows/claude-unblock.yml`            | Calls the action                |
| `scripts/denial-audit.mts`                        | Every artifact; refresh row; D2 |
| `scripts/__tests__/denial-audit.test.ts`          | Several artifacts; refresh row  |
| `scripts/__tests__/load-agent-files.test.ts`      | New input; third caller         |

## Order of work

1. Tests first, then the action, the callers pinned to it, the audit.

## Risks

- `gh` download layout: check on a real run.

## Proof

| Acceptance check               | Proven by                                 |
| ------------------------------ | ----------------------------------------- |
| Uploads; leak on Spec          | `load-agent-files.test.ts`; first refresh |
| Artifacts counted; refresh row | `denial-audit.test.ts`                    |
| Weekly audit; checks           | Next weekly run; pasted output            |

## Deviations

- The audit lists artifacts first and downloads only those runs; a failed listing downloads all.
- The suffix ends with the run attempt; the audit reads a Spec's latest.
