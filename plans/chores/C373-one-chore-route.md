# Plan: C373: One chore route: an issue and a plan file

- **Spec:** #373
- **Status:** approved

## Approach

Delete the no-issue `chore:` route wherever described; exempt only Dependabot's, `actions-pin-update.yml`'s and revert PRs (D2). No workflow logic changes.

## Decisions

**D1 · How `review.md` recognises the pin PR** · Decides: Tech lead

- **A.** Its head branch, `bot/update-action-pins`.
- ~~**B.** Its title, `chore: update repo action pins`.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)
**D2 · Revert PRs** · Decides: Tech lead

- **A.** Exempt head branch `revert-*`.
- ~~**B.** A Chore issue first.~~

**Answer: A** (Tech lead)
**D3 · `chore.md` hand-back advice** · Decides: Tech lead

- **A.** Leave `chore.md`; rule 4 owns it.
- ~~**B.** Edit it, as #373 says.~~

**Answer: A** (Tech lead)

## Files that change

| File                                   | New / changed | What                                                                       |
| -------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `plans/README.md`                      | Changed       | Rule 4: one route, tech lead builds a hand-back, three exempt PRs; rule 10 |
| `AGENTS.md`                            | Changed       | Spec, Bug or Chore only; one plan each; drop "chore plan 300"              |
| `.github/agent/review.md`              | Changed       | Flag a missing plan file, except the pin PR and reverts                    |
| `docs/building.md`                     | Changed       | _Chores_: one route                                                        |
| `docs/how-we-work.md`                  | Changed       | Drop the `chore:` PR                                                       |
| `docs/repo-settings.md`                | Changed       | Bypass: "their own PRs"                                                    |
| `.github/workflows/claude-build.yml`   | Changed       | Comment: the bot's other PRs                                               |
| `plans/chores/C373-one-chore-route.md` | New           | This plan                                                                  |

## Order of work

Edit; run `AGENTS.md`'s checks.

## Risks

- `review.md` loads from `main`, so this PR's review uses the old text.

## Proof

| Acceptance check                                    | Proven by                                                   |
| --------------------------------------------------- | ----------------------------------------------------------- |
| No chore-route "quick" or PR-body plan rule         | `git grep -niE "quick"` and `git grep "PR body"`, in the PR |
| Non-exempt PR with no plan draws a finding          | After merge, a throwaway PR's review                        |
| Exempt PRs draw no finding; Dependabot's unreviewed | The next pin PR's review; the `if:` is unchanged            |
| `words`, lint, `format:check`; `AGENTS.md` ≤ 700    | Output in the PR                                            |

## Deviations

- Folded `building.md`'s _Chores_ in; dropped `review.md`'s plan fallback; named Bug and Chore in `how-we-work.md`; `AGENTS.md` links plan paths.

## Out of scope

- Merged `chore:` PRs and old plans.
