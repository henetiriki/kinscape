# Plan: C391: Switch both workflows to run-claude

- **Spec:** #391
- **Status:** draft

## Approach

In `claude.yml` and `claude-run.yml`, one `run-claude@main` step with `id: claude` replaces **Load agent files**, **Run Claude Code** and **Upload Claude's output**. `claude.yml` passes `files`, `model_args` (the "(plan)" expression) and `additional_permissions: 'actions: read'`; `claude-run.yml` passes `files`, `prompt` and `model_args`, and its **Show that the run started** moves before the action. Concurrency, safety net and summaries stay.

## Decisions

**D1 · What the pins test compares against** · Decides: Tech lead

After the switch, neither workflow pins `claude-code-action` or `upload-artifact`, so the C390 pins test fails.

- **A.** The action's pins equal `claude-code-review.yml`'s; a Dependabot bump there fails the test until the action follows.
- **B.** Drop the test and add `/.github/actions/*` to Dependabot's `directories`.
- **Other:** your own.

Recommended: A: it keeps the guard, in scope.

## Files that change

| File                                         | What                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/claude.yml`               | Three steps → `run-claude`                                                                                                                                                        |
| `.github/workflows/claude-run.yml`           | Same; step order                                                                                                                                                                  |
| `.github/actions/run-claude/action.yml`      | Description no longer says nothing calls it                                                                                                                                       |
| `scripts/__tests__/load-agent-files.test.ts` | Settings-file and "used from main" checks: the action file for the two workflows, the review unchanged; both workflows use `run-claude@main` once and pin neither action; D1 pins |

## Order of work

1. Change the tests; see them fail.
2. Switch the workflows.
3. Name `review-settings.json` in the action, see the test fail, revert.
4. Run the checks in AGENTS.md.

## Risks

- `issue_comment` runs use `main`'s `claude.yml`, so the switch shows only after merge. The tech lead checks an `@claude` reply, a plan and a build after merge, and reverts if one differs.

## Proof

| Acceptance check                             | Proven by                                  |
| -------------------------------------------- | ------------------------------------------ |
| `@claude` reply, model as before             | Live run after merge: `--model` in the log |
| Plan and build start and comment             | Live runs after merge                      |
| "System prompt" group and artifact unchanged | Same runs, next to a run before merge      |
| Tests moved; wrong settings file fails       | `npm test` output; step 3's failing line   |
