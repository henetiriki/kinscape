# Plan: C502: Skip the build run for a hand-back plan PR and say why

- **Spec:** #502
- **Status:** draft

## Approach

`scripts/agent-approve.mts` decides `go` for `claude-build.yml`'s `build` job. Its first `pr view` also reads `labels`. Once the approval is recorded (or already was), a `hand-back` PR gets a comment that the tech lead builds it (rule 13) and `go=false`, so all of `build` is skipped. `finish` already leaves a `hand-back` PR's issue labels alone. An open decision stops first, as now.

## Decisions

**D1 · Where the check lives** · Decides: Tech lead

- **A.** In `agent-approve.mts`, after the approval.
- **B.** An `if:` on `build` reading the event's labels, plus a script step for the comment.
- **Other:** your own.

Recommended: A, because the script already reads the PR and owns `go`.

**D2 · Rule 13's "At build, for either, leave the PR open."** · Decides: Tech lead

- **A.** Remove it.
- **B.** Reword: "At build, a `hand-back` PR gets a comment and no build run."
- **Other:** your own.

Recommended: A, because the comment says it and rule 4 says who builds.

## Files that change

| File                                      | New / changed | What                                     |
| ----------------------------------------- | ------------- | ---------------------------------------- |
| `scripts/agent-approve.mts`               | Changed       | `hand-back`: comment, `go=false`         |
| `scripts/__tests__/agent-approve.test.ts` | Changed       | The Spec's four cases                    |
| `.github/workflows/claude-build.yml`      | Changed       | Comments (lines 4, 40-47)                |
| `.github/agent/build.md`                  | Changed       | Line 9 drops "the PR has `hand-back` or" |
| `plans/README.md`                         | Changed       | Rule 13 as D2                            |

## Order of work

1. Tests; see them fail.
2. Script.
3. Workflow comments, docs; `npm run words`.

## Risks

- The run is still titled "Build: <title>"; `run-name` only repeats the checked plan-PR condition.
- A failed comment is caught: `go=false`, exit 1, never a build.

## Proof

| Acceptance check                       | Proven by                         |
| -------------------------------------- | --------------------------------- |
| Hand-back, no label, draft, `gh` fails | `agent-approve.test.ts`           |
| Next hand-back approval skips the run  | Run linked in the PR, after merge |
| 100% coverage, `words` passes          | Pasted output                     |
