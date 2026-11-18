# Plan: C1028: Let the agent run checks on the bot's own PR

- **Spec:** #1028
- **Status:** approved

## Approach

1. `scripts/agent-own-pr.mts` exports `run(args, env, gh, out)`. It reads `gh api repos/$GH_REPO/pulls/<n>` with a `--jq` filter for `.user.login` and `.head.repo.full_name`. The REST login keeps the `[bot]` suffix that `$BOT_LOGIN` has.
2. `run` writes `own=true` only for that login and a head repo equal to `$GH_REPO`. Each other case writes `own=false` and exits 0. A failed read logs the exit status, not the error text.
3. A new job `own` (name "Own PR") in `claude-run.yml` copies the shape of `return`. A plan run skips it. The job has these steps:
   - A sparse checkout of `main`.
   - Node.
   - An App token with only `permission-pull-requests: read`.
4. `run` needs `[gate, own]`. It passes `restrict_untrusted_prs: ${{ needs.own.outputs.own == 'true' && 'false' || 'true' }}`. A skipped or failed `own` keeps `'true'`.

This chore is a hand-back. The tech lead builds it.

## Files that change

| File                                         | New / changed | What                                      |
| -------------------------------------------- | ------------- | ----------------------------------------- |
| `scripts/agent-own-pr.mts`                   | New           | Approach steps 1 and 2                    |
| `scripts/__tests__/agent-own-pr.test.ts`     | New           | Proof rows 1 to 3                         |
| `.github/workflows/claude-run.yml`           | Changed       | Approach steps 3 and 4; the rule comment  |
| `.github/actions/run-claude/action.yml`      | Changed       | The input, default `'true'`, passed on    |
| `docs/security.md`                           | Changed       | The rule under Workflows                  |
| `scripts/__tests__/app-token.test.ts`        | Changed       | Adds `claude-run.yml:own` to the job list |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | Tests for the `own` job and the input     |
| `.github/workflows/README.md`                | Changed       | `npm run workflows:diagram` adds `own`    |

## Order of work

1. Write the script tests. See each fail.
2. Write the script, the workflow tests, the job and the input.
3. After the merge, merge both pin PRs.
4. Run the checks in Proof rows 4 to 6.
5. Link the runs.

## Risks

- After the first pin PR, callers pass the input to the old `run-claude`. GitHub warns "Unexpected input", and the restriction stays.
- Untrusted text can steer the agent to write code and run it. This risk was there before v1.0.276, and the Chore accepts it.

## Proof

| Acceptance check                           | Proven by                          |
| ------------------------------------------ | ---------------------------------- |
| 1. Bot PR from this repo: `own=true`       | New unit test                      |
| 2. Dependabot, fork, deleted head: false   | New unit tests                     |
| 3. Failed read, not a PR: false, no token  | New unit tests; the token in error |
| 4. Build: `own=true`, `npm test` runs      | Linked build run                   |
| 5. Fix, resolve or respond: `own=true`     | Linked run                         |
| 6. Dependabot respond: `own=false`, denial | Linked respond run                 |
| 7. Rule in `docs/security.md`              | `npm run words`                    |

## Out of scope

- `claude-code-review.yml` and `claude-unblock.yml`.

## Deviations

- A bad thread number, a bad `GH_REPO` or an empty `BOT_LOGIN` exits 1 and writes no output, like `agent-gate.mts`. `own` fails, and `run` keeps the restriction.
