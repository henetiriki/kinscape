# Plan: C388: Switch both workflows to setup-workspace

- **Spec:** #388
- **Status:** draft

## Approach

In `claude.yml`'s `claude` job and `claude-run.yml`'s `run` job, one `henetiriki/kinscape/.github/actions/setup-workspace@main` step replaces checkout through **Restore Next.js build cache**. `claude.yml` passes `token: ${{ secrets.KINSCAPE_BOT_PAT }}`, `persist-credentials: 'true'` (the action defaults to `'false'`) and `playwright: 'true'`. `claude-run.yml` passes `ref: ${{ inputs.ref }}`, `persist-credentials: 'false'` and `playwright: ${{ inputs.playwright }}`. Its **Install Playwright** step and the gate's sparse checkout stay.

## Decisions

**D1 · How tests cover the callers** · Decides: Tech lead

The cache tests read the steps this removes. What replaces them?

- **A.** New `setup-workspace.test.ts`: each job calls the action once from `@main` with the inputs above, and neither file has `npm ci`, `ms-playwright` or `.next/cache`. The cache tests check the action alone.
- **B.** Only drop the workflow cases from the cache tests.
- **Other:** your own.

Recommended: A, because nothing else catches a lost `persist-credentials: 'true'` before merge.

## Files that change

| File                                         | What                                                      |
| -------------------------------------------- | --------------------------------------------------------- |
| `.github/workflows/claude.yml`               | The action replaces six steps                             |
| `.github/workflows/claude-run.yml`           | The action replaces six steps                             |
| `scripts/__tests__/next-build-cache.test.ts` | Drop the workflow cases                                   |
| `scripts/__tests__/playwright-image.test.ts` | Drop the workflow cases; the action becomes the reference |
| `scripts/__tests__/setup-workspace.test.ts`  | New, if D1 is A                                           |

## Order of work

1. Change the tests; see the new test fail on today's workflows.
2. Switch both jobs.
3. Run lint, tests, format:check, words and e2e.

## Risks

`issue_comment` and plan or build runs use `main`'s workflows, so the checks run only after merge. If CI waits for approval on a bot push, revert.

## Proof

| Acceptance check                           | Proven by                                        |
| ------------------------------------------ | ------------------------------------------------ |
| `@claude` trivial commit starts CI unaided | After merge: one run on an open PR               |
| Plan and build runs check out the same ref | After merge: each run's checkout log             |
| Playwright and Next.js caches restore      | After merge: `Cache restored` lines in both logs |
| The jobs hold no copy of the steps         | Step 1's test                                    |
