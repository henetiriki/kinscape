# Plan: C390: Add a run-claude action

- **Spec:** #390
- **Status:** approved

## Approach

A composite action holds three steps as `claude-run.yml` has them: **Load agent files** (`load-agent-files@main`, `settings: settings.json`), **Run Claude Code** (same SHA, `bot_name`, `bot_id`, `show_full_output: false`, settings and system prompt from `${{ runner.temp }}/agent/`), and **Upload Claude's output** (`if: always()`). Inputs: `files`, `model_args`, `prompt` and `additional_permissions` (both `default: ''`, as #389 found), `claude_code_oauth_token`, `github_token`. No step echoes inputs.

## Decisions

**D1 · How "SHA pins match" is proven** · Decides: Tech lead

- **A.** A test: the action's two pins equal `claude.yml`'s and `claude-run.yml`'s.
- ~~**B.** A test: each action has one SHA across `.github/`.~~
- ~~**C.** The Evidence table only, as C387 did.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead). Dependabot doesn't scan `.github/actions/`, so each bump fails the test until `dependabot.yml` changes (out of scope).

## Files that change

| File                                         | What                                                                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/actions/run-claude/action.yml`      | New                                                                                                                                                      |
| `scripts/__tests__/load-agent-files.test.ts` | The action calls `load-agent-files@main` with `settings: settings.json`; Claude reads `settings.json` and `system.md`; its two pins equal the workflows' |

## Order of work

1. Add the test and the action.
2. Pass `settings: review-settings.json`, see the test fail, then revert.
3. Run lint, tests, format:check and words.

## Risks

- Nothing calls the action yet, so a mistake shows only when the workflows switch. Step 2 and the Evidence table lower this.
- `additional_permissions: ''` is assumed to equal omitting it, as `prompt` does; checked against the pinned `action.yml` at build.

## Proof

| Acceptance check                       | Proven by                                       |
| -------------------------------------- | ----------------------------------------------- |
| Steps match both workflows             | Evidence table: each step next to each workflow |
| SHA pins match                         | The pins test (D1)                              |
| Test checks settings and system prompt | Step 2's failing line                           |
| Lint, tests, format:check, words pass  | Step 3 output, CI                               |
| No workflow file changed               | `git diff --stat origin/main`                   |

## Out of scope

Switching the workflows, including moving `claude-run.yml`'s **Show that the run started** before the action and giving its caller step `id: claude`.
