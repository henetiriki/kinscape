# Plan: C371: Close the CODEOWNERS gap and state each rule once

- **Spec:** #371
- **Status:** approved

## Approach

Widen CODEOWNERS so a PO-only approval can't change workflows, skills or agent scripts. Move the three workflow rules from `review.md` into `security.md`, replacing its link to `review.md#the-rules`. Make the three `AGENTS.md` edits below.

## Files that change

| File                                    | New / changed | What                                                                                                                                      |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/CODEOWNERS`                    | Changed       | `.github/workflows/**` replaces `claude*.yml`; add the five paths the chore lists                                                         |
| `docs/security.md`                      | Changed       | Line 10 states the three workflow rules (SHA pins, fewest `permissions:`, `env:`), replacing the `review.md` link                         |
| `.github/agent/review.md`               | Changed       | Lines 19–23 become "Check workflows against `docs/security.md`"; the API-failure bullet stays                                             |
| `AGENTS.md`                             | Changed       | Line 47 allows "None" in a required form box; line 50 points the PR-body budget to its template; line 58 lists `format:check` and `words` |
| `plans/chores/C371-codeowners-rules.md` | New           | This plan                                                                                                                                 |

## Order of work

1. Commit this plan: `plan(C371): approved by @<tech-lead>`.
2. Edit the four files; run the checks in `AGENTS.md`.

## Risks

- `security.md` is read from the PR branch, so a PR could weaken the workflow rules it is reviewed against (see Deviations); CODEOWNERS still requires the tech lead's review.
- CODEOWNERS is read from the base branch, so this PR's own reviewers don't change.

## Deviations

- Tech lead authorised building ([rule 13](../README.md)).
- CODEOWNERS adds eight paths, not five: the issue's six, plus `scripts/scan-summary.sh` and `scripts/claude-plugin-pin-check.mts` (workflows run both).
- `review.md` reads `security.md` as `main` has it via the diff's removed lines (review finding); loading it from `main` needs its own chore.
- Proof: the grep excludes this plan (`-- ':!plans'`); the tech lead pastes the `check-github.sh` output.

## Proof

| Acceptance check                                      | Proven by                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Draft PR touching `.claude/skills/x` requests owner   | After merge, a throwaway draft PR's `reviewRequests`; `codeowners/errors` empty |
| `./scripts/check-github.sh` passes                    | Its output in the PR                                                            |
| `git grep "full commit SHA"` finds only `security.md` | Its output in the PR                                                            |
| `AGENTS.md` ≤ 700 words                               | `npm run words`                                                                 |
