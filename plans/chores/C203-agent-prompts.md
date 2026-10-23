# Plan: C203: Tighten the plan and build prompts, keep run output, format on edit

- **Spec:** #203
- **Status:** approved

## Approach

The rules both prompts share move to one workflow-level `RULES` env var, which `Run Claude Code` appends to each job's `PROMPT`. `RULES` holds the `--body-file` rule, the four new rules, and the foreground and denied-command lines both prompts repeat. A new `if: always()` step uploads the execution output (pinned `upload-artifact` as in `ci.yml`, 14 days). The hook reads `tool_input.file_path` with `jq` and skips paths outside `$CLAUDE_PROJECT_DIR`. It runs `eslint --fix --no-warn-ignored` for lint-staged's extensions, then `prettier --write --ignore-unknown`.

## Decisions

**D1 · Errors `eslint --fix` can't fix** · Decides: Tech lead

- **A.** Stay quiet: the hook always exits 0.
- **B.** Exit 2 with the errors, so Claude sees them.

**Answer: A** (@henetiriki)

**D2 · Files the hook lints** · Decides: Tech lead

- **A.** Lint-staged's list: js, jsx, mjs, mts, cjs, ts, tsx, json.
- **B.** `.ts` and `.tsx` only.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                               |
| ----------------------------------------- | ------------- | ---------------------------------- |
| `.github/workflows/claude-spec-agent.yml` | Changed       | `RULES`, prompt lines, upload step |
| `.claude/settings.json`                   | Changed       | Format hook replaces lint-staged   |
| `.lintstagedrc.json`                      | Changed       | `eslint` before `prettier`         |

## Order of work

1. Commit this plan: `plan(C203): approved by @henetiriki`.
2. Workflow, then settings.
3. Run the checks under _Proof_; open the PR.

## Proof

| Acceptance check                            | Proven by                                     |
| ------------------------------------------- | --------------------------------------------- |
| Unformatted `.md`, mis-ordered `.tsx` fixed | Write each in a session; hook JSON piped in   |
| Path outside the repo skipped               | Hook JSON with a `/tmp` path                  |
| Workflow valid, prompts read correctly      | The parsed workflow YAML; the PR's checks     |
| Targeted test run passes                    | `npm test -- --coverage.enabled=false <file>` |
| No denials, artifact listed, `##` kept      | The next plan and build runs after merge      |
| Lint, format, words                         | Their output                                  |

## Deviations

- The hook and `.lintstagedrc.json` run `eslint --fix` before `prettier`; the other order left `.tsx` files failing `format:check`.
- Targeted tests need `--coverage.enabled=false`; `RULES` bans writes outside the repo.
