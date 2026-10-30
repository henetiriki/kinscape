# Plan: C371: Close the CODEOWNERS gap and state each rule once

- **Spec:** #371
- **Status:** approved

## Approach

Widen CODEOWNERS so a PO-only approval can't change workflows, skills or agent scripts. Make the three `AGENTS.md` edits below. The workflow rules stay in `review.md` (D1).

## Decisions

**D1 · Where the workflow security rules live** · Decides: Tech lead

C382 (#383) made `review.md` their one home, loaded from `main` so a PR can't weaken them. The issue moved them to `docs/security.md`.

- **A.** Keep them in `review.md`; leave `security.md` and `review.md` alone.
- ~~**B.** Move them to `security.md`, reversing C382.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                    | New / changed | What                                                                                                                                      |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/CODEOWNERS`                    | Changed       | `.github/workflows/**` replaces `claude*.yml`; add the five paths the chore lists                                                         |
| `AGENTS.md`                             | Changed       | Line 47 allows "None" in a required form box; line 50 points the PR-body budget to its template; line 58 lists `format:check` and `words` |
| `plans/chores/C371-codeowners-rules.md` | New           | This plan                                                                                                                                 |

## Order of work

1. Commit this plan: `plan(C371): approved by @<tech-lead>`.
2. Edit the two files; run the checks in `AGENTS.md`.

## Risks

- CODEOWNERS is read from the base branch, so this PR's own reviewers don't change.

## Deviations

- Tech lead authorised building ([rule 13](../README.md)).
- CODEOWNERS adds nine paths, not five: the issue's six, plus `scripts/scan-summary.sh`, `scripts/claude-plugin-pin-check.mts` and `scripts/design-shots-ci.mts` (workflows run them).
- D1 drops the issue's `security.md` and `review.md` bullets; its `git grep` check now names `review.md`.
- The tech lead pastes the `check-github.sh` output.

## Proof

| Acceptance check                                                 | Proven by                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Draft PR touching `.claude/skills/x` requests owner              | After merge, a throwaway draft PR's `reviewRequests`; `codeowners/errors` empty |
| `./scripts/check-github.sh` passes                               | Its output in the PR                                                            |
| `git grep "full commit SHA" -- ':!plans'` finds only `review.md` | Its output in the PR                                                            |
| `AGENTS.md` ≤ 700 words                                          | `npm run words`                                                                 |
