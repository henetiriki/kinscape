# Plan: C500: Record a plan's approval in a script before the build agent starts

- **Spec:** #500
- **Status:** approved

## Approach

A new `approve` job in `claude-build.yml` takes the build's `if:` and runs `scripts/agent-approve.mts` from `main`. The script reads the PR's one plan file, then the answers in owner-written reviews and comments (`authorAssociation == OWNER`; later wins). It records them with `approve-plan.mts`'s logic, exported as a pure function, and commits `plan(<id>): approved by @<owner>` with the bot PAT. `build` then needs `go=true`.

## Decisions

**D1 · How the approval commit is made** · Decides: Tech lead

- **A.** The Contents API (`PUT`, blob `sha` as a race guard): the PR head is never checked out.
- **B.** Check out the head, `git commit`, `git push`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                   |
| ----------------------------------------- | ------------- | ------------------------------------------------------ |
| `scripts/agent-approve.mts`               | New           | Parse, record, commit; open decision: comment, stop    |
| `scripts/__tests__/agent-approve.test.ts` | New           | The seven cases, injected `gh`                         |
| `scripts/approve-plan.mts`                | Changed       | Export `approve(text, login, answers)`; `run` wraps it |
| `.github/workflows/claude-build.yml`      | Changed       | `approve` job (`contents: read`)                       |
| `.github/workflows/README.md`             | Changed       | `npm run workflows:diagram`                            |
| `.github/agent/build.md`                  | Changed       | Lines 7-8 become one line                              |
| `plans/README.md`                         | Changed       | Rules 2 and 3 as #500                                  |

## Order of work

1. Write the test; see it fail.
2. Export `approve`; write the script.
3. Workflow, diagram, docs; `npm run words`.

## Risks

- The approval push dismisses the review, as today's does.

## Proof

| Acceptance check              | Proven by                         |
| ----------------------------- | --------------------------------- |
| Seven test cases              | `agent-approve.test.ts`           |
| Next approval's commit text   | Run linked in the PR, after merge |
| 100% coverage, `words` passes | Pasted output                     |

## Deviations

- `approve` also takes the plan's file name.
- `build` keeps no `if:` of its own, only `needs: approve`: `plan-pr-condition.test.ts` allows two copies of the condition.
- `Approval` lives in `scripts/types.ts` (lint).
- Answers to a decision the plan lacks are skipped; a failed `gh` call comments; `approve` joins the `thread-<n>` group.
- `plans/README.md` rule 13 drops "record approval,".
