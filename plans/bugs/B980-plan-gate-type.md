# Plan: B980: The plan gate skips a labeled Spec, Bug or Chore after the Type change

- **Spec:** #980 (Bug)
- **Status:** approved

The tech lead builds this plan in a local session. Each file that changes is a [hand-back](../README.md#hand-back) path.

## Approach

Four workflows test `github.event.issue.type.name` in a `run-name` and in a job `if:`. #978 (C.976) added each test. The event payload may not carry `issue.type`. The bot also sets a Type after it creates an issue. No run since #978 shows the field in a payload. A test of an absent field is false, and the job skips. Elimination points to this cause of #980. Nobody has verified it.

Each workflow gets two changes:

- The `run-name` and the job `if:` test `(!github.event.issue.type || <Type test>)`. The filter works as before for an event with a Type. An event with no Type reaches the job.
- The job reads the Type through the API and stops if it is wrong. `claude-plan.yml` does this in the gate `scripts/agent-gate.mts` (`gh issue view --json state,labels,issueType`). The three `github-script` workflows read `issues.get`.

Reads of a REST object (`issues.get`, `/parent`, `/dependencies/*`) carry `type` and stay as they are. A new test fails if a workflow tests `issue.type.name` with no guard.

`claude-run.yml` does not change. Its gate step fetches the script from `main`.

## Decisions

**D1 · Keep a filter in the `if:` when the payload has a Type** · Decides: Tech lead

- **A.** Gate only. Remove the Type test from each `if:` and `run-name`. Cost: any issue starts a short runner job, and its run title says "Link: …" for a Bug.
- **B.** Guarded filter, as above. Cost: one more clause in each of eight places, and one guard test.
- **Other:** your own.

Recommended: B. The build uses B until the tech lead answers.

## Files that change

| File                                         | New / changed | What                                                                                                                                |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `plans/bugs/B980-plan-gate-type.md`          | New           | This plan                                                                                                                           |
| `scripts/__tests__/agent-gate.test.ts`       | Changed       | `fakeGh` returns `issueType`. A plan for an `Intent` or an untyped issue stops quietly. A plan for a `Spec`, `Bug` and `Chore` goes |
| `scripts/agent-gate.mts`                     | Changed       | The `plan` case of `staleReason` reads `issueType` and stops for a Type that is not a Spec, Bug or Chore                            |
| `scripts/__tests__/issue-type-gates.test.ts` | New           | Each `issue.type.name` test in a workflow has the guard. The three `github-script` workflows read the Type through the API          |
| `.github/workflows/claude-plan.yml`          | Changed       | The Type test in the `run-name` and the job `if:` gets the guard                                                                    |
| `.github/workflows/backlog-spec-link.yml`    | Changed       | The guard in the `run-name` and the `if:`. The script stops unless `issues.get` says Spec                                           |
| `.github/workflows/backlog-milestone.yml`    | Changed       | The same, for the `issues` events                                                                                                   |
| `.github/workflows/backlog-intent-ready.yml` | Changed       | The same                                                                                                                            |

## Order of work

1. Check that the Bug still reproduces. Run 44121869683 and the runs after it skipped the plan job.
2. Commit the plan.
3. Write the gate tests and the guard test. See them fail on the behaviour.
4. Change `agent-gate.mts`. Commit it with its tests.
5. Change the four workflows. Commit them with the guard test.
6. Run the checks in `AGENTS.md`.
7. Push. Update the PR body.

## Risks

- A label or an event on an issue of the wrong Type, with no Type in the payload, starts a short runner job that stops with no model run.
- Workflows on `issues` events run from `main`. The fix shows only after the merge. The tech lead then labels #921 again to prove it.
- **Unlikely, not built:** the bot sets the Type about one second after it creates an issue. If the Link or Milestone job reads the issue in that gap, it sees no Type and stops. A job takes several seconds to start, so no shown run reaches the gap. A fix adds `typed` to the `on: issues` types of both workflows. Each job is safe to run twice. The tech lead decides whether to build it.
- The `log-type` job starts on each `ready-for-agent` label event until the tech lead removes it. It has no permissions and runs for under a minute.
- #979 has no Type. `agent-unblock.mts` and the new reads treat it as no Spec. This is data, not code. The tech lead sets the Type.

## Proof

| Acceptance check                                                          | Proven by                                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A `ready-for-agent` label on an open Spec, Bug or Chore starts a plan run | `agent-gate.test.ts`: go for `Spec`, `Bug`, `Chore`. After the merge: "Plan: …" run for #921 |
| An issue of another Type gets no plan                                     | `agent-gate.test.ts`: quiet stop for `Intent` and for no Type                                |
| No workflow tests `issue.type.name` with no guard                         | `issue-type-gates.test.ts`                                                                   |
| The `run-name` and the job `if:` stay in step                             | `plan-pr-condition.test.ts`, `issue-author-gates.test.ts`                                    |
| A new Spec still gets its Intent link and milestone                       | After the merge: the next Spec the bot files shows a "Link: …" run and a milestone           |

## Deviations

- `scripts/issue-status.mts` exports `TYPES`, and `agent-gate.mts` imports it. One list then holds the issue Types, as the code-rules say. A review finding asked for it. Commit 3c84639.
- `claude-plan.yml` gets a `log-type` job that logs `github.event.issue.type`. The tech lead chose it after a review finding. The log shows whether the `labeled` event carries the field. The tech lead removes the job after the log answers. `.github/workflows/README.md` lists the job.
