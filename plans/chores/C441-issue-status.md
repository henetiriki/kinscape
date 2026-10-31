# Plan: C441: Keep an issue's status label in step with its PR

- **Spec:** #441
- **Status:** approved

## Approach

The workflow checks out the base SHA and runs the script, which picks the row from the event (D1); a fork or no row stops it. `gh` lists the closing issues and changed files. Each `type: spec|bug|chore` issue not `blocked` or on target gets one `gh issue edit` swapping its `status: *` labels; a failure is logged, the rest go on, and it exits 1. A per-PR `concurrency` group keeps events in order.

## Decisions

**D1 · Where the PR's state comes from** · Decides: Tech lead

- **A.** The event payload (`$GITHUB_EVENT_PATH`), as it was when it fired.
- **B.** The PR number through `env:`, read live: an approval read after the build marks the PR ready takes row 5, not 2.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Whose approval moves a ready PR (row 5)** · Decides: Tech lead

- **A.** An owner's, member's or collaborator's.
- **B.** Anyone's: the repo is public, so a stranger can approve.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | What                                 |
| -------------------------------------------- | ------------------------------------ |
| `scripts/issue-status.mts`                   | New; imports `invisible`             |
| `scripts/__tests__/issue-status.test.ts`     | New                                  |
| `.github/workflows/backlog-issue-status.yml` | New                                  |
| `.github/workflows/README.md`                | `npm run workflows:diagram`          |
| `.github/CODEOWNERS`                         | Adds the script                      |
| `AGENTS.md`                                  | Line 23 ends at "the workflow says." |
| `docs/building.md`                           | Line 26 links the workflow           |
| `plans/README.md`                            | Rule 13's last sentence deleted      |

## Risks

- `claude-plan.yml` also needs the owner as actor, so a `GITHUB_TOKEN` label can't start a plan.
- This PR's base lacks the script, so its own runs fail.

## Proof

| Acceptance check                                      | Proven by                       |
| ----------------------------------------------------- | ------------------------------- |
| Every row; the hand-back, skip, review, failure cases | `issue-status.test.ts`          |
| Coverage, words, lint, format, diagram                | `npm test`, `npm run words`, CI |
| The next Spec PR follows the table                    | Its runs, linked in its PR body |
