# Plan: C757: Speed up the CI e2e job

- **Spec:** #757
- **Status:** approved

## Approach

Copy the `e2e` job as `design`, which runs `npm run design:check`. Move the snapshot check and the design-check upload to it. It only restores the Next.js cache (`actions/cache/restore`), so two jobs do not save one key. Set `workers` to the `nproc` result.

## Decisions

**D1 · How `perf` stops waiting for `design` in CI** · Decides: Tech lead

- **A.** The `e2e` step sets `KINSCAPE_E2E_SPLIT: '1'`, and the config then drops the `design` project.
- **B.** The config drops `design` when `GITHUB_JOB` is `e2e`. A job rename silently brings `design` back.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Job names** · Decides: Tech lead

- **A.** Keep `e2e` and add `design`.
- **B.** Use `e2e-app` and `e2e-design`. Then a comment in `next-build-cache.test.ts` names a missing job, but the Chore forbids unit test changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                               | New / changed | What                               |
| ---------------------------------- | ------------- | ---------------------------------- |
| `.github/workflows/ci.yml`         | changed       | The `design` job; D1               |
| `playwright.config.ts`             | changed       | `workers`; D1                      |
| `scripts/github/ruleset-main.json` | changed       | The `design` check                 |
| `.github/workflows/README.md`      | changed       | `npm run workflows:diagram` output |
| `docs/infrastructure.md`           | changed       | A row for `KINSCAPE_E2E_SPLIT`     |
| `design/CANVAS.md`                 | changed       | The `design` job exports again     |

## Order of work

1. Push a temporary `nproc` step. Record the result in the PR. Remove the step.
2. Make the changes.
3. After merge, the tech lead runs `scripts/setup-github.sh`, then `scripts/check-github.sh`.

## Risks

- If the ruleset changes before `ci.yml` merges, each PR waits on a check that never reports. Step 3 prevents this.

## Proof

| Acceptance check              | Proven by                              |
| ----------------------------- | -------------------------------------- |
| `workers` matches `nproc`     | The PR's `nproc` log                   |
| Two e2e jobs pass in parallel | The PR's CI run                        |
| Wall time before and after    | The PR body                            |
| Same design-check results     | The `design` job summary and `main`'s  |
| `design` is a required check  | `scripts/check-github.sh` after step 3 |

## Deviations

- Review found two more files to change: `docs/infrastructure.md` gets a row for `KINSCAPE_E2E_SPLIT`, and `design/CANVAS.md` names the `design` job, not `e2e`, as the job that exports again.
- The `design` job restores the Next.js cache with the `e2e` job's restore-keys prefix as its key, as `setup-workspace` does, so the `hashFiles` list exists once.
