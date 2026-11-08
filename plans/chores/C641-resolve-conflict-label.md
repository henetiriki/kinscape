# Plan: C641: Add a `resolve-conflict` label that merges main into a PR

- **Spec:** #641
- **Status:** approved

## Approach

`claude-resolve-conflict.yml` copies `claude-fix-review.yml` without `!draft`, and calls `claude-run.yml` with `kind: resolve`. `agent-gate.mts` gets a `resolve` case: an open PR with the label. The `return` job skips each `kind`. `resolve-conflict.md` gives the merge, abort and check rules.

## Decisions

**D1 · Full history** · Decides: Tech lead

The checkout has depth 1, so `git merge` finds no merge base.

- **A.** The prompt runs `git fetch --unshallow origin main` first.
- **B.** A `fetch-depth` input in `setup-workspace` and `claude-run.yml`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Workflow files** · Decides: Tech lead

The run's token has no `workflows` permission. GitHub refuses a push that brings in a `.github/workflows/` change from `main`.

- **A.** Mint `permission-workflows: write` on a `resolve` run only.
- **B.** No change: that push fails, and Claude comments.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Label colour** · Decides: Tech lead

- **A.** `FBCA04`, as `fix-review`.
- **B.** `0E8A16`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                                                                                 | New / changed | What                      |
| ---------------------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| `.github/workflows/claude-resolve-conflict.yml`, `.github/agent/resolve-conflict.md`                 | New           | As the Chore says         |
| `.github/workflows/claude-run.yml`, `scripts/agent-gate.mts`, `scripts/__tests__/agent-gate.test.ts` | Changed       | `resolve` kind            |
| `scripts/__tests__/load-agent-files.test.ts`                                                         | Changed       | New checks; new `KIND`    |
| `scripts/github/labels.sh`, `scripts/denial-audit.mts`, `scripts/__tests__/denial-audit.test.ts`     | Changed       | Label; `WORKFLOWS`        |
| `docs/building.md`, `docs/repo-settings.md`, `.github/workflows/README.md`                           | Changed       | Label; regenerated README |

## Order of work

1. Gate tests fail, then the `resolve` case.
2. Runner, workflow, prompt and their tests.
3. Label, docs, `npm run workflows:diagram`.
4. After merge: `./scripts/setup-github.sh`.

## Risks

- The caller pins a branch commit; `actions-pin-update.yml` moves it after merge.
- The push starts a new review on a ready PR.

## Proof

| Acceptance check                      | Proven by                          |
| ------------------------------------- | ---------------------------------- |
| `run-name`, `if:`, unlabel, prompt    | `load-agent-files.test.ts`         |
| Conflict, draft and skipped runs      | After merge, on test PRs           |
| `check-github.sh` shows no difference | Running it after `setup-github.sh` |

## Deviations

- `scripts/__tests__/app-token.test.ts` also changes: it allowed `permission-workflows` only in `actions-pin-update.yml`, and D2 adds it to the runner (1d10a2c).
