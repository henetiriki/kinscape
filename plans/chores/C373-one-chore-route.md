# Plan: C373: One chore route: an issue and a plan file

- **Spec:** #373
- **Status:** approved

## Approach

Delete the no-issue `chore:` route wherever described; exempt only Dependabot's and `actions-pin-update.yml`'s PRs. No workflow logic changes.

## Decisions

**D1 · How `review.md` recognises the pin PR** · Decides: Tech lead

- **A.** Its head branch, `bot/update-action-pins`.
- ~~**B.** Its title, `chore: update repo action pins`.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

Recommended: A, because the workflow sets the branch, and a title is easier to copy by mistake.

## Files that change

| File                                   | New / changed | What                                                                     |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `plans/README.md`                      | Changed       | Rule 4: one route, tech lead builds a hand-back, two exempt PRs; rule 10 |
| `AGENTS.md`                            | Changed       | Spec, Bug or Chore only; one plan each; drop "chore plan 300"            |
| `.github/agent/review.md`              | Changed       | Flag a missing plan file, except the pin PR and reverts                  |
| `docs/building.md`                     | Changed       | _Chores_: one route                                                      |
| `docs/how-we-work.md`                  | Changed       | _Which issue do I need?_: drop the `chore:` PR                           |
| `docs/repo-settings.md`                | Changed       | Bypass: "their own PRs"                                                  |
| `.github/workflows/claude-build.yml`   | Changed       | Comment: the bot's other PRs                                             |
| `plans/chores/C373-one-chore-route.md` | New           | This plan                                                                |

## Order of work

1. Commit this plan: `plan(C373): approved by @<tech-lead>`.
2. Edit the files; run `AGENTS.md`'s checks.

## Risks

- `review.md` loads from `main`, so this PR's own review still uses the old text.

## Proof

| Acceptance check                                              | Proven by                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| No chore-route "quick" or PR-body plan rule                   | `git grep -niE "quick"` and `git grep "PR body"`, in the PR        |
| Non-exempt PR with no plan draws a finding                    | After merge, a throwaway PR's review                               |
| Pin PR draws no missing-plan finding; Dependabot's unreviewed | The next pin PR's review; `claude-code-review.yml` `if:` unchanged |
| `words`, lint, `format:check`; `AGENTS.md` ≤ 700              | Their output in the PR                                             |

## Deviations

- Folded `building.md`'s _Chores_ into _Specs, Bugs and Chores_; dropped `review.md`'s plan fallback; named Bug and Chore in `how-we-work.md`; exempted `revert-*` PRs; dropped the `chore.md` edit; `AGENTS.md` links plan paths.

## Out of scope

- Merged `chore:` PRs and old plans.
