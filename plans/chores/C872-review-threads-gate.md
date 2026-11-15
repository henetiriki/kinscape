# Plan: C872: The Review check counts every unresolved finding thread

- **Spec:** #872
- **Status:** approved

## Approach

The tech lead builds this (hand-back rule).

1. The gate step reads `reviewThreads` with `gh api graphql`, one page of 100 in each pass of a loop over `endCursor`. It counts each unresolved thread whose first comment has the author `github-actions` of type `Bot`. It adds `<n>` from the latest `Earlier findings still open: <n>` comment.
2. `review-threads.mts` gets `reply <PR number> <thread id>`. It checks the thread with the `resolve` query, then sends stdin with `addPullRequestReviewThreadReply` as `-f body=`. The `-f` flag reads no `@file`.
3. `review.md`, `fix-review.md` and the local skill change as the issue says. The fixer replies with `npm run review:threads -- reply <n> <thread id> <<'EOF'`.

## Decisions

**D1 · A thread that a person resolves** · Decides: Tech lead

A resolved thread does not start the `Review` job. Which run turns the check green?

- **A.** The person re-runs the job. A re-run reviews the whole PR on Opus.
- **B.** Add a `pull_request_review_thread` trigger. This changes scope, so the Chore needs an edit first.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- `gh api graphql --paginate`: a fake `gh` can not show a second page, so the loop is in bash.
- The gate calls `review-threads.mts`: the job runs no code from the PR branch.

## Files that change

| File                                         | New / changed | What                                                 |
| -------------------------------------------- | ------------- | ---------------------------------------------------- |
| `.github/workflows/claude-code-review.yml`   | Changed       | The gate step and its comment                        |
| `.github/agent/review.md`                    | Changed       | `<n>`, the thread query, inline findings             |
| `.github/agent/fix-review.md`                | Changed       | Resolve before the push, reply after it              |
| `.claude/skills/fix-review-local/SKILL.md`   | Changed       | Resolve a judged-wrong thread                        |
| `scripts/review-threads.mts`                 | Changed       | `reply`                                              |
| `scripts/__tests__/review-gate.test.ts`      | Changed       | GraphQL fixtures and the gate tests                  |
| `scripts/__tests__/review-threads.test.ts`   | Changed       | `reply` tests                                        |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | `fix-review.md` names `reply`                        |
| `scripts/__tests__/agent-settings.test.ts`   | Changed       | `settings.json` does not deny `reply` with a heredoc |

## Risks

- `review.md` and `fix-review.md` are near their word budgets. The build makes other sentences shorter.
- This PR changes `claude-code-review.yml`, so Claude does not review it.
- If the push fails after a resolve, a thread stays resolved with no fix. The reviewer counts it in `<n>` on the next push.

## Proof

| Acceptance check                          | Proven by                                             |
| ----------------------------------------- | ----------------------------------------------------- |
| Gate: earlier commit, outdated, person    | `review-gate.test.ts`                                 |
| Gate: second page, failed call, PR 840    | `review-gate.test.ts`                                 |
| `reply` posts, refuses, exits 1           | `review-threads.test.ts`                              |
| No "Open findings"                        | `git grep "Open findings" -- ":!plans"`               |
| `review.md`, `fix-review.md`, local skill | `load-agent-files.test.ts` and the review of the text |
| `AGENTS.md` › Commands                    | Their output                                          |

## Out of scope

- The local skill's reply line keeps its own mutation.
