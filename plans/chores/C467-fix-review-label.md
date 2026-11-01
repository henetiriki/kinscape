# Plan: C467: Fix the review's findings when the fix-review label is added to a PR

- **Spec:** #467
- **Status:** approved

## Approach

`claude-fix-review.yml` calls `claude-run.yml` with a new input `kind: fix` (Sonnet, the PR number in the prompt). `agent-gate.mts` gets a `fix` case that passes an open, non-draft PR with the label. A job `unlabel` (`needs: fix`, `if: always() && needs.fix.result != 'skipped'`) removes the label and allows a 404.

## Decisions

**D1 · Runner** · Decides: Tech lead

- **A.** Call `claude-run.yml`.
- **B.** Copy `claude-respond.yml`'s job, then add the comment and label steps.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Playwright** · Decides: Tech lead

- **A.** Off: CI runs e2e after the push.
- **B.** On, as builds have it.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Label on a skipped (draft, fork) PR** · Decides: Tech lead

- **A.** It stays ("does nothing").
- **B.** It's removed.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Gate for a ready PR** · Decides: Tech lead

- **A.** Loosen the build gate.
- **B.** A `kind` input in `claude-run.yml` and a `fix` gate case.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                                               | New / changed | What                     |
| ------------------------------------------------------------------ | ------------- | ------------------------ |
| `.github/workflows/claude-fix-review.yml`                          | New           | As the Chore says        |
| `.github/agent/fix-review.md`                                      | New           | Reviewer's findings      |
| `.github/workflows/claude-run.yml`, `scripts/agent-gate.mts`, test | Changed       | `kind` input; `fix` case |
| `scripts/setup-github.sh`, `scripts/denial-audit.mts`, its test    | Changed       | Label; `WORKFLOWS`       |
| `docs/repo-settings.md`, `docs/building.md`                        | Changed       | Label row; step 4        |
| `scripts/__tests__/load-agent-files.test.ts`                       | Changed       | Checks                   |
| `.github/workflows/README.md`                                      | Changed       | Regenerated              |

## Order of work

Tests first, then the files above. After merge, run `./scripts/setup-github.sh`.

## Risks

- Any label on any PR records a skipped run: noise only.
- A later queued run on the thread replaces a queued fix; `unlabel` still runs.
- The caller pins a branch commit of `claude-run.yml`; `actions-pin-update.yml` moves it after merge.

## Proof

| Acceptance check                               | Proven by                 |
| ---------------------------------------------- | ------------------------- |
| Run, push, comment, unlabel, new review; again | After merge, on a test PR |
| Skipped on a draft or fork                     | Draft test PR; the `if:`  |
