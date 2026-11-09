# Plan: C657: Run review and respond through the shared workflow

- **Spec:** #657
- **Status:** draft

## Approach

Respond's job `respond` (`Respond`) keeps its `run-name`, `if:` and permissions, and calls `claude-run.yml` with `kind: respond` and an empty `prompt` (tag mode). On `respond`, the runner skips the gate (D1), persists the App token (D2) and adds `actions: read`. It skips the start comment and the browser install: tag mode posts its own comment and :eyes:, as on `main`.

## Stays in the caller

- **Respond:** the `if:` and model choice: they read the event.
- **Review, all steps:** the workflow token, `review-settings.json`, the plugin and the main-copy check.
- **Refresh, all steps:** the workflow token, `contents: read` and `refresh-settings.json`. The runner needs the App key and `settings.json`.

## Decisions

**D1 · The gate on a Respond run** · Decides: Tech lead

`agent-gate.mts` has nothing to check for a reply.

- **A.** Skip `gate`; `run` and `summary` also accept `respond`.
- **B.** A `respond` gate kind that always says go: one more job per reply.
- **Other:** your own.

Recommended: A: an empty check delays each reply.

**D2 · When the runner mints the App token** · Decides: Tech lead

Tag mode fetches the PR branch before it sets git auth. The runner mints after checkout.

- **A.** Mint first; checkout persists it on `respond` only.
- **B.** Respond persists nothing, so that fetch has no credentials.
- **Other:** your own.

Recommended: A, because the 45-minute job stays inside the token's hour.

## Files that change

| File                                                                                                                   | What                |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `.github/workflows/claude-respond.yml`, `claude-run.yml`                                                               | The call; `respond` |
| `.github/workflows/claude-code-review.yml`, `claude-fix-review.yml`, `claude-resolve-conflict.yml`                     | Job names           |
| `scripts/__tests__/load-agent-files.test.ts`, `app-token.test.ts`, `setup-workspace.test.ts`, `working-signal.test.ts` | Both                |
| `.github/actions/run-claude/action.yml`, `scripts/run-summary.mts`, `.github/workflows/README.md`                      | Comments; diagram   |

## Risks

- The caller pins a branch commit; `actions-pin-update.yml` moves it after merge.
- The caller sets no `concurrency`: the runner's `thread-<n>` would wait on it.

## Proof

| Acceptance check        | Proven by                                    |
| ----------------------- | -------------------------------------------- |
| Check names, none twice | `load-agent-files.test.ts`; a PR after merge |
| Tests and `npm` checks  | CI                                           |
