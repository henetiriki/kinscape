# Plan: C976: Read issue Types in place of the type labels, and retire the labels

- **Spec:** #976
- **Status:** approved

## Approach

Each reader compares the Type name (`Spec`) where it now compares a label (`type: spec`). A workflow reads `github.event.issue.type.name`, or `type?.name` from the REST issue. `issue-status.mts` reads `gh issue view --json issueType`. `agent-unblock.mts` reads `type.name` from the dependencies API.

The two issue-creating workflows mint the App token as `actions-pin-update.yml` does. `backlog-interaction-limit.yml` lists and creates in one step, so that step uses the App token, and the workflow `permissions:` becomes `{}` ([security rules](../../docs/security.md#workflows)). These are hand-back paths, so the tech lead builds this Chore.

## Files that change

| File                                                                                                                    | New / changed | What                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------- |
| `backlog-intent-ready.yml`, `backlog-spec-link.yml`, `backlog-milestone.yml`, `claude-plan.yml` in `.github/workflows/` | changed       | Read the Type in `if:`, `run-name` and the scripts |
| `backlog-interaction-limit.yml`, `claude-denial-audit.yml`                                                              | changed       | App token, `--type Chore`, smaller `permissions:`  |
| `scripts/issue-status.mts`, `agent-unblock.mts`, `denial-audit.mts`                                                     | changed       | Read or set the Type                               |
| Their tests in `scripts/__tests__/`                                                                                     | changed       | The fakes return a Type                            |
| `agent-approve`, `agent-gate`, `agent-return`, `hand-back` tests                                                        | changed       | Remove the label from fixtures                     |
| `scripts/__tests__/app-token.test.ts`                                                                                   | changed       | Lists the two new bot jobs                         |
| `.github/ISSUE_TEMPLATE/*.yml`                                                                                          | changed       | Remove the `type:` label                           |
| `scripts/github/labels.sh`                                                                                              | changed       | Move four labels to `RETIRED_LABELS`               |
| `scripts/github/backfill-issue-types.sh`                                                                                | deleted       |                                                    |
| `scripts/github/issue-types.sh`                                                                                         | changed       | Line 1 stops naming the backfill script            |
| `.claude/skills/refine/spec.md`, `filing.md`                                                                            | changed       | `--type`                                           |
| `docs/how-we-work.md`, `AGENTS.md`                                                                                      | changed       | Line 90; line 12                                   |

## Order of work

1. Change the test fixtures. See the three script tests fail on the behaviour.
2. Change the scripts until `npm test` passes.
3. Change the workflows, forms, `labels.sh`, skill and docs. Delete the backfill script.
4. Run the `grep` and the checks in `AGENTS.md`.
5. After merge, the tech lead runs `setup-github.sh` before `check-github.sh`, then the manual checks.

## Risks

- If `issues: opened` arrives before the form sets the Type, a new Spec gets no link and no milestone. The test Spec shows it. A fix needs the `typed` trigger, which the Chore forbids.
- `.claude/audit/` is not on `main`, so its exclusion has no effect.

## Proof

| Acceptance check                 | Proven by                          |
| -------------------------------- | ---------------------------------- |
| The `grep` finds no label        | Its output in Evidence             |
| `npm test`, 100% coverage        | Its output in Evidence             |
| Labels gone; check passes        | Tech lead, after `setup-github.sh` |
| Spec link, milestone, plan start | Tech lead, test Spec and Chore     |
| Both bot Chores show the Type    | Tech lead, manual runs             |

## Deviations

- In the `agent-approve` and `agent-return` fixtures, `hand-back` replaces a `type:` label where a test needs a label that is not a status label.
