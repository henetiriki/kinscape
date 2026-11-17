# Plan: B980: The plan gate skips a labeled Spec, Bug or Chore after the Type change

- **Spec:** #980 (Bug)
- **Status:** approved

The tech lead builds this plan in a local session. Each file that changes is a [hand-back](../README.md#hand-back) path.

## Approach

The `if:` of the plan job and the `run-name` in `claude-plan.yml` stop testing `github.event.issue.type.name`. The gate `scripts/agent-gate.mts` reads the Type through the API: `gh issue view --json state,labels,issueType`. If the issue is not a Spec, Bug or Chore, the gate stops the plan run quietly, with no comment. The gate reads the issue as it is now, so the fix works whether or not the `labeled` payload holds `issue.type`.

The cause is not verified. #921 and #980 met every other condition of the `if:`, and Chore runs with the same author and actor passed before #978 (C.976). `issue.type.name` is set on an `opened` payload. The GitHub docs do not say that a `labeled` payload holds `issue.type`.

`claude-run.yml` does not change. Its gate step fetches the script from `main`.

## Files that change

| File                                   | New / changed | What                                                                                                                                                          |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans/bugs/B980-plan-gate-type.md`    | New           | This plan                                                                                                                                                     |
| `scripts/__tests__/agent-gate.test.ts` | Changed       | `fakeGh` returns `issueType` (default `Spec`). New tests: a plan for an `Intent` or an untyped issue stops quietly. A plan for a `Bug` and a `Chore` goes     |
| `scripts/agent-gate.mts`               | Changed       | The `plan` case of `staleReason` reads `issueType`. It returns "the issue is not a Spec, Bug or Chore" for any other Type. The header comment names the check |
| `.github/workflows/claude-plan.yml`    | Changed       | Remove the Type line from the `run-name` and from the plan job `if:`. A comment says that the gate checks the Type                                            |

## Order of work

1. Check that the Bug still reproduces: run 44121869683 and later runs are skipped.
2. Commit the plan.
3. Write the gate tests. See them fail on the behaviour.
4. Change `agent-gate.mts`. Commit it with the tests.
5. Change `claude-plan.yml`. Commit.
6. Run the checks in `AGENTS.md`.
7. Push. Open the PR with `Closes #980`.

## Risks

- A label on an issue of the wrong Type now starts a short runner job. The `run-name` says "Plan: …". The gate stops quietly in about 30 seconds, with no model run.
- Workflows on `issues` events run from `main`. The fix shows only after the merge. The tech lead then labels #921 again to prove it.

## Proof

| Acceptance check                                                          | Proven by                                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A `ready-for-agent` label on an open Spec, Bug or Chore starts a plan run | `agent-gate.test.ts`: go for `Spec`, `Bug`, `Chore`. After the merge: "Plan: …" run for #921 |
| An issue of another Type gets no plan                                     | `agent-gate.test.ts`: quiet stop for `Intent` and for no Type                                |
| The `run-name` and the job `if:` stay in step                             | `plan-pr-condition.test.ts`, `issue-author-gates.test.ts`                                    |

## Out of scope

`backlog-milestone.yml` reads `github.event.issue.type.name` on `opened` and `edited`. The `opened` payload holds the Type. The `edited` payload is not checked. The tech lead decides whether to file it.
