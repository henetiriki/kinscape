# Plan: C387: Add a setup-workspace action

- **Spec:** #387
- **Status:** approved

## Approach

A composite action holds the steps from `claude-run.yml`'s `run` job, from **Check out code** through **Restore Next.js build cache**, with the same SHA pins and `fetch-depth: 1`. Checkout takes `ref`, `token` and `persist-credentials` from inputs. The three Playwright steps run under `if: inputs.playwright == 'true'`, because composite inputs are strings and a bare `inputs.playwright` is always true. No workflow calls it yet.

## Decisions

**D1 · Default for the `token` input** · Decides: Tech lead

What does a caller that passes no token get?

- **A.** `${{ github.token }}`, as `claude-run.yml`'s checkout has now. `claude.yml` passes the PAT.
- **B.** Nothing: `token` is required, and every caller must pass one.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | What                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `.github/actions/setup-workspace/action.yml` | New: inputs `ref`, `token`, `persist-credentials`, `playwright`, and the steps above |
| `scripts/__tests__/next-build-cache.test.ts` | `read` takes a path from the repo root, and the action joins the restore cases       |

## Order of work

1. Add the test case and the action.
2. Remove the key's trailing `-` and see the test fail, then put it back.
3. Run lint, tests, format:check and words.

## Risks

Nothing calls the action until a later chore switches the workflows to it, so a mistake shows up only then. Step 2 and the step-by-step comparison in Evidence lower that risk.

## Proof

| Acceptance check                      | Proven by                                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| Steps match both workflows; SHA pins  | Evidence table: each action step next to each workflow's step |
| Test checks the action's cache key    | Step 2's failing line                                         |
| Lint, tests, format:check, words pass | Step 3 output, CI                                             |
| No workflow file changed              | `git diff --stat origin/main`                                 |

## Out of scope

Switching `claude.yml` and `claude-run.yml` to call the action.
