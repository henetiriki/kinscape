# Plan: C763: Rename the workflow "Claude: Review code" to "Claude: Code review"

- **Spec:** #763
- **Status:** approved

## Approach

Change the workflow `name:` in `claude-code-review.yml` and its two mentions in the workflows README. Both files are hand-back paths (rule 13), so the tech lead builds this Chore. No test changes: `repo-names` and `workflows-diagram` pass with the new name.

## Files that change

| File                                       | New / changed | What                            |
| ------------------------------------------ | ------------- | ------------------------------- |
| `.github/workflows/claude-code-review.yml` | Changed       | `name: 'Claude: Code review'`   |
| `.github/workflows/README.md`              | Changed       | The table row; the diagram node |
| `plans/chores/C763-code-review-name.md`    | New           | This plan                       |

## Order of work

1. Commit this plan as `plan(C763): approved by @henetiriki`.
2. Commit the two workflow files.
3. Run the checks in `AGENTS.md`.

## Risks

- A required check named after the workflow would break. `scripts/github/ruleset-main.json` lists job names only (`lint`, `test`, `e2e` …), and none of them is the review.
- This PR changes `claude-code-review.yml`, so it gets no Claude review (the workflow says why).

## Proof

| Acceptance check                            | Proven by                                        |
| ------------------------------------------- | ------------------------------------------------ |
| No `Claude: Review code` in the repo        | `git grep -n "Claude: Review code"` has no match |
| `name:`, table row and diagram node all new | `git diff origin/main`; `workflows-diagram` test |
| Job, `run-name`, triggers, permissions kept | `git diff origin/main` shows only the `name:`    |

## Out of scope

- A merge deploys nothing: `scripts/vercel-ignore.mts` lists `.github/` and `plans/` as invisible.
