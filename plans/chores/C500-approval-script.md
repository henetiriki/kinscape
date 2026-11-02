# Plan: C500: Record a plan's approval in a script before the build agent starts

- **Spec:** #500
- **Status:** draft

## Approach

A new `approve` job in `claude-build.yml` takes the build's `if:` unchanged and runs `scripts/agent-approve.mts` from `main`. The script reads the PR's one plan file, then the answers in owner-written reviews and comments (`authorAssociation == OWNER`; later wins). It records them with `approve-plan.mts`'s logic, exported as a pure function, and commits `plan(<id>): approved by @<owner>` with the bot PAT. `build` then needs `go=true`.

## Decisions

**D1 · How the approval commit is made** · Decides: Tech lead

- **A.** The Contents API (`PUT`, blob `sha` as a race guard): the PR head is never checked out.
- **B.** Check out the head, `git commit`, `git push`.
- **Other:** your own.

Recommended: A, because no PR files land on disk.

## Files that change

| File                                      | New / changed | What                                                                           |
| ----------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `scripts/agent-approve.mts`               | New           | Parse, record, commit; open decision: comment, `go=false`; approved: no change |
| `scripts/__tests__/agent-approve.test.ts` | New           | The seven cases, injected `gh`                                                 |
| `scripts/approve-plan.mts`                | Changed       | Export `approve(text, login, answers)`; `run` wraps it                         |
| `.github/workflows/claude-build.yml`      | Changed       | `approve` job (`contents: read`; event text via `env:`)                        |
| `.github/workflows/README.md`             | Changed       | `npm run workflows:diagram`                                                    |
| `.github/agent/build.md`                  | Changed       | Lines 7-8 become one line; line 10 drops "After recording the approval,"       |
| `plans/README.md`                         | Changed       | Rules 2 and 3 as #500; rule 2 keeps the commit text for a hand-committed plan  |

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
