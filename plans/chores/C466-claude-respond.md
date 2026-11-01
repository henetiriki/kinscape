# Plan: C466: Rename the Claude: Code workflow to Claude: Respond (claude-respond.yml)

- **Spec:** #466
- **Status:** approved

## Approach

`git mv` the workflow to `claude-respond.yml` and set `name: 'Claude: Respond'`. Every other edit swaps `claude.yml` for `claude-respond.yml` word for word; nothing else in any workflow changes. Our action pins stay: only comments change in the actions. `npm run workflows:diagram` rewrites the README.

## Files that change

| File                                                                                                 | What                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `.github/workflows/claude.yml` → `claude-respond.yml`                                                | Renamed; `name:`                           |
| `.github/actions/run-claude/action.yml`, `run-summary/action.yml`                                    | Description                                |
| `claude-build.yml`, `claude-plan.yml`, `claude-run.yml`, `claude-unblock.yml`                        | Comments                                   |
| `docs/repo-settings.md`, `scripts/run-summary.mts`                                                   | One mention each                           |
| `scripts/denial-audit.mts`                                                                           | `WORKFLOWS` entry                          |
| `scripts/__tests__/denial-audit.test.ts`                                                             | File names; `runs` keys re-sorted (ESLint) |
| `scripts/__tests__/load-agent-files.test.ts`, `plan-pr-condition.test.ts`, `setup-workspace.test.ts` | File names in paths, comments and titles   |
| `.github/workflows/README.md`                                                                        | Regenerated                                |

## Order of work

1. Rename and set `name:`.
2. Replace the file name in the files above.
3. `npm run workflows:diagram`.
4. `git grep -nF 'claude.yml' -- ':!plans'` and `git grep -nP 'Claude: Code(?! Review)' -- ':!plans'` print nothing.
5. Lint, `format:check`, `words`, tests, `validate:boundaries`, `e2e`.

## Risks

- Handed back (rule 13): the tech lead builds it.
- GitHub files runs by workflow path, so the audit loses old runs: the tech lead runs it before merge.
- A missed path breaks a test that reads it; step 4 catches it.

## Proof

| Acceptance check                                           | Proven by                                         |
| ---------------------------------------------------------- | ------------------------------------------------- |
| No `claude.yml` or `Claude: Code` outside `plans/`         | Step 4 output in Evidence                         |
| `workflows:diagram` leaves no diff                         | Rerun it; `git status` clean                      |
| Lint, `format:check`, `words`, `npm test`                  | CI                                                |
| `Respond: <title>` under `Claude: Respond`, Claude answers | `@claude` on a test issue after merge (tech lead) |

## Out of scope

Job ids and names, triggers, `if:`, `concurrency`, permissions, `plans/`.
