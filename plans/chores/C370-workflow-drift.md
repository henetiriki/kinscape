# Plan: C370: Stop duplicated workflow logic drifting, and enforce who sets ready-for-agent

- **Spec:** #370
- **Status:** approved

## Approach

PR 1 (`Part of #370`) adds the action and does items 1, 3, 4 and 5; PR 2 (`Closes #370`) switches to the action. The tech lead builds both (CODEOWNERS).

Item 5: `id-token: write` stays. The review passes no `github_token`, so the action gets its token by OIDC (`src/github/token.ts`); drafts aren't reviewed, so no test PR. A comment says why.

## Files that change

| File                                          | PR   | What                                                                            |
| --------------------------------------------- | ---- | ------------------------------------------------------------------------------- |
| `.github/workflows/claude-plan.yml`           | 1    | Add `github.actor == github.repository_owner` to `run-name` and `if:`           |
| `.github/actions/load-agent-files/action.yml` | 1    | Composite; inputs `files` and `token` reach the unchanged script through `env:` |
| `scripts/__tests__/plan-pr-condition.test.ts` | 1    | Extracts the four copies, collapses whitespace, expects them equal              |
| `.github/workflows/ci.yml`                    | 1    | `'design/**'` in the Next.js cache key                                          |
| `.github/workflows/claude-code-review.yml`    | 1    | The `id-token` comment                                                          |
| `.github/workflows/claude.yml`                | 1, 2 | "CI agent"; then the load step calls the action                                 |
| `.github/workflows/claude-run.yml`            | 2    | The load step calls the action                                                  |

## Order of work

1. Write the test; break one copy and see it fail; revert.
2. PR 1; lint, format, `npm test`, `npm run words`.
3. After it merges, PR 2 from `origin/main`.

## Risks

- `@main`, not a SHA pin: as `claude-run.yml@main`, so a branch can't change the loader.

## Proof

All but the last row are checked after merge: label and comment events run main's workflows.

| Acceptance check                  | Proven by                                       |
| --------------------------------- | ----------------------------------------------- |
| PO's label starts no run          | The PO's next label shows "Skipped"             |
| Tech lead's label starts a plan   | The next ready-for-agent run is "Plan"          |
| Same "System prompt" group        | A plan and a comment run after PR 2, vs. before |
| Editing one copy fails `npm test` | Step 1's failing line                           |

## Out of scope

Checking `claude-plan.yml`'s `run-name` against its `if:`.
