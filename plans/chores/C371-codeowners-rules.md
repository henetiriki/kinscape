# Plan: C371: Close the CODEOWNERS gap and state each rule once

- **Spec:** #371
- **Status:** approved

## Approach

Widen CODEOWNERS so a PO-only approval can't change workflows, skills or agent scripts. Move the three workflow rules from `review.md` into `security.md`, replacing its link to `review.md#the-rules`. Make the three `AGENTS.md` edits in the wording below, which nets about +6 words on today's 690.

## Files that change

| File                                    | New / changed | What                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/CODEOWNERS`                    | Changed       | `.github/workflows/**` replaces `claude*.yml`; add the five paths the chore lists                                                                                                                                                                     |
| `docs/security.md`                      | Changed       | Line 10 becomes: "In workflows: pin each action and reusable workflow to a full commit SHA, this repo's own included (`actions-pin-update.yml` moves those pins); grant the fewest `permissions:`; pass `${{ github.event.* }}` text through `env:`." |
| `.github/agent/review.md`               | Changed       | Lines 19–23 become "Check workflows against `docs/security.md`"; the API-failure bullet stays                                                                                                                                                         |
| `AGENTS.md`                             | Changed       | Line 47 adds "A required form box may say "None"."; line 50 "PR body 250 words" → "PR body per its template"; line 58 "Run lint, `format:check`, `words`, tests, `validate:boundaries` and `e2e` …"                                                   |
| `plans/chores/C371-codeowners-rules.md` | New           | This plan                                                                                                                                                                                                                                             |

## Order of work

1. Commit this plan: `plan(C371): approved by @<tech-lead>`.
2. Edit the four files; run the checks in `AGENTS.md`.

## Risks

- `review.md` loads from `main`; `security.md` is read from the PR branch, so a PR could weaken the workflow rules and be reviewed against its own copy. CODEOWNERS on `security.md` still requires the tech lead's review.
- CODEOWNERS is read from the base branch, so this PR's own reviewers don't change.

## Deviations

- Tech lead authorised building ([rule 13](../README.md)); CODEOWNERS adds six paths, not five (the issue lists `scripts/denial-audit.mts` too).

## Proof

| Acceptance check                                      | Proven by                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Draft PR touching `.claude/skills/x` requests owner   | After merge, a throwaway draft PR's `reviewRequests`; `codeowners/errors` empty |
| `./scripts/check-github.sh` passes                    | Its output in the PR                                                            |
| `git grep "full commit SHA"` finds only `security.md` | Its output in the PR                                                            |
| `AGENTS.md` ≤ 700 words                               | `npm run words`                                                                 |
