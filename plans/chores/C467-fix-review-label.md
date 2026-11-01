# Plan: C467: Fix the review's findings when the fix-review label is added to a PR

- **Spec:** #467
- **Status:** approved

## Approach

`claude-fix-review.yml` calls `claude-run.yml` unchanged: head branch, `plan: false`, Sonnet, `rules.md fix-review.md`. The prompt names the PR number. A job `unlabel` (`needs: fix`, `if: always() && needs.fix.result != 'skipped'`) removes the label and allows a 404.

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

## Files that change

| File                                         | New / changed | What                                                       |
| -------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `.github/workflows/claude-fix-review.yml`    | New           | As the Chore says                                          |
| `.github/agent/fix-review.md`                | New           | Find unresolved `claude[bot]` threads and the gaps comment |
| `scripts/setup-github.sh`                    | Changed       | The label                                                  |
| `docs/repo-settings.md`, `docs/building.md`  | Changed       | Label row; step 4                                          |
| `scripts/denial-audit.mts` and its test      | Changed       | `WORKFLOWS`                                                |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | New workflow checks                                        |
| `.github/workflows/README.md`                | Changed       | Regenerated                                                |

## Order of work

1. Write the tests and see them fail, then change the files above.
2. After merge, the tech lead runs `./scripts/setup-github.sh`.

## Risks

- Any label on any PR records a skipped run: noise only.
- A later queued run on the thread replaces a queued fix; `unlabel` still runs.

## Proof

| Acceptance check                          | Proven by                               |
| ----------------------------------------- | --------------------------------------- |
| Run, push, comment, unlabel; a new review | After merge, on a test PR with findings |
| Skipped on a draft or fork                | A draft test PR; fork: the `if:`        |
| A second run                              | Relabelling                             |
| The checks                                | Running them                            |

## Deviations

- The prompt holds the PR number, not `$THREAD`: the agent can't `echo` it.
