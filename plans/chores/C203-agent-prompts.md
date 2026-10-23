# Plan: C203: Tighten the plan and build prompts, keep run output, format on edit

- **Spec:** #203
- **Status:** approved

## Approach

The rules both prompts share move to one workflow-level `RULES` env var; the shared `Run Claude Code` step passes `${{ env.PROMPT }}` then `${{ env.RULES }}`. `RULES` holds the `--body-file` rule (replacing inline `--body`), the four new rules, and the foreground and denied-command lines both prompts now repeat. Each job's `PROMPT` keeps only its own lines, with the build's first command naming the PR number. A new `if: always()` step after `Run Claude Code` uploads the execution output with the SHA-pinned `upload-artifact` that `ci.yml` uses, 14-day retention. The hook reads `tool_input.file_path` with `jq` and skips paths outside `$CLAUDE_PROJECT_DIR`. It runs `prettier --write --ignore-unknown` and, for lint-staged's extensions, `eslint --fix --no-warn-ignored`, from `node_modules/.bin`.

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

## Order of work

1. Branch `chore/C203-agent-prompts` from `origin/main`; commit this plan: `plan(C203): approved by @henetiriki`.
2. Workflow, then settings.
3. Run the checks under _Proof_; open the PR.

## Proof

| Acceptance check                            | Proven by                                   |
| ------------------------------------------- | ------------------------------------------- |
| Unformatted `.md`, mis-ordered `.tsx` fixed | Write each in a session; hook JSON piped in |
| Path outside the repo skipped               | Hook JSON with a `/tmp` path                |
| Workflow valid                              | `actionlint`, if installed; the PR's checks |
| No denials, artifact listed, `##` kept      | The next plan and build runs after merge    |
| Lint, format, words                         | Their output                                |
