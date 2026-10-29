# Plan: C370: Stop duplicated workflow logic drifting, and enforce who sets ready-for-agent

- **Spec:** #370
- **Status:** approved

## Approach

PR 1 (`Part of #370`) adds the action and does items 1, 3, 4 and 5; PR 2 (`Closes #370`) switches to the action.

Item 5: `id-token: write` stays. The review passes no `github_token`, so the action gets its token by OIDC; drafts aren't reviewed, so no test PR. A comment says why.

## Files that change

| File                                          | PR   | What                                                                  |
| --------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `.github/workflows/claude-plan.yml`           | 1    | Add `github.actor == github.repository_owner` to `run-name` and `if:` |
| `.github/actions/load-agent-files/action.yml` | 1    | Composite: the unchanged script, inputs through `env:`                |
| `.github/CODEOWNERS`                          | 1    | Add `.github/actions/**`                                              |
| `scripts/__tests__/plan-pr-condition.test.ts` | 1    | The four copies, and `claude.yml`'s whole condition, stay equal       |
| `.github/workflows/ci.yml`                    | 1    | `'design/tokens.*'` in the Next.js cache key                          |
| `.github/workflows/claude-code-review.yml`    | 1    | The `id-token` comment                                                |
| `.github/workflows/claude.yml`                | 1, 2 | "CI agent"; then the load step calls the action                       |
| `.github/workflows/claude-run.yml`            | 2    | The load step calls the action                                        |
| `scripts/__tests__/load-agent-files.test.ts`  | 2    | Both callers use `…/load-agent-files@main`                            |

## Order of work

1. Write the test; break one copy and see it fail; revert.
2. PR 1 and the AGENTS.md checks. PR 2 follows its merge.

## Risks

- `@main`, not a SHA pin, as `claude-run.yml@main`.
- PR 2: a typo in the action breaks every Claude run. Run the script with a stub `gh` first; revert PR 2 if the first run fails.

## Proof

| Acceptance check                  | Proven by                              |
| --------------------------------- | -------------------------------------- |
| PO's label starts no run          | The PO's next label shows "Skipped"    |
| Tech lead's label starts a plan   | The next ready-for-agent run is "Plan" |
| Same "System prompt" group        | A plan and a comment run, after PR 2   |
| Editing one copy fails `npm test` | Step 1's failing line                  |

## Out of scope

Checking `claude-plan.yml`'s `run-name` against its `if:`.

## Deviations

- `claude-code-review.yml`: the "No Claude review" comment starts with two `:heavy_exclamation_mark:` (tech lead's request).
- `ci.yml` hashes `design/tokens.*`, not `design/**`: the rest is snapshots the app never imports.
