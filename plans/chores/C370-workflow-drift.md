# Plan: C370: Stop duplicated workflow logic drifting, and enforce who sets ready-for-agent

- **Spec:** #370
- **Status:** approved

## Approach

PR 1 (`Part of #370`) adds the action and does items 1, 3, 4 and 5; PR 2 (`Closes #370`) switches to the action.

Item 5: `id-token: write` stays (the review's token comes by OIDC); a comment says why.

## Files that change

| File                                          | PR   | What                                                                  |
| --------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `.github/workflows/claude-plan.yml`           | 1    | `github.actor == github.repository_owner` in `run-name` and `if:`     |
| `.github/actions/load-agent-files/action.yml` | 1    | Composite: the unchanged script                                       |
| `.github/CODEOWNERS`                          | 1    | Add `.github/actions/**`                                              |
| `scripts/__tests__/plan-pr-condition.test.ts` | 1, 2 | The plan-PR, `claude.yml` and `claude-plan.yml` conditions stay equal |
| `.github/workflows/ci.yml`                    | 1    | `'design/tokens.*'` in the Next.js cache key                          |
| `.github/workflows/claude-code-review.yml`    | 1    | The `id-token` comment                                                |
| `.github/workflows/claude.yml`                | 1, 2 | "CI agent"; then the load step calls the action                       |
| `.github/workflows/claude-run.yml`            | 2    | The load step calls the action                                        |
| `scripts/__tests__/load-agent-files.test.ts`  | 2    | `uses:` at `@main`; listed files exist; stub-`gh` run                 |
| `.github/agent/rules.md`                      | 2    | Line 1 names the `files:` lists, not `AGENT_FILES`                    |
| `docs/security.md`                            | 2    | SHA-pin exception for this repo's `@main` actions                     |

## Order of work

Each test first: break what it guards, see it fail, revert. PR 1, then PR 2.

## Risks

- PR 2: a fault in the action fails every Claude run. A stub-`gh` test runs its script; revert PR 2 if the first live run fails.

## Proof

| Acceptance check                  | Proven by                              |
| --------------------------------- | -------------------------------------- |
| PO's label starts no run          | The PO's next label shows "Skipped"    |
| Tech lead's label starts a plan   | The next ready-for-agent run is "Plan" |
| Same "System prompt" group        | A plan and a comment run, after PR 2   |
| Editing one copy fails `npm test` | The failing line in the PR             |

## Deviations

- The "No Claude review" comment is a `:rotating_light:` heading (tech lead's request).
- `ci.yml` hashes `design/tokens.*`, not `design/**`: the rest is snapshots.
- `@main`, not a SHA pin: the issue prescribes it. `docs/security.md` now says so.
- `rules.md` line 1 changes the prompt on that line only.
