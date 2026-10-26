# Plan: C291: Skip Vercel deploys for changes no user can see

- **Spec:** #291
- **Status:** approved

## Approach

`vercel.json` sets `ignoreCommand` to `node scripts/vercel-ignore.mts`. It runs before `npm ci`, so it imports only `node:` modules. It exports `invisible(path)` and `run(env, git)`, shaped like `design-shots-ci.mts`: 1 on `po-preview`; otherwise diff `HEAD^ HEAD` on `main`, or `origin/main...HEAD` (fetching `main` if missing); 0 only for a non-empty, all-invisible diff. Any git error gives 1.

The import test resolves relative and `@/` imports in non-test `app/`, `lib/` and `types/` files, failing on any `invisible` path.

## Decisions

**D1 · `lib/design/sweep.mts` imports `scripts/design-shots.mts`** · Decides: Tech lead
The import test would fail on it. Only a test uses `sweep.mts`.

- **A.** Move `shotFor` and `Shot` to `lib/design/shots.mts`; both import from there.
- **B.** The import test skips `sweep.mts`, with the reason.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                    | New / changed | What          |
| ------------------------------------------------------- | ------------- | ------------- |
| `vercel.json`, `scripts/vercel-ignore.mts`              | New           | The rule      |
| `scripts/__tests__/vercel-{ignore,imports}.test.ts`     | New           | Both tests    |
| `lib/design/shots.mts`, `sweep.mts`, `design-shots.mts` | New, changed  | D1 A only     |
| `docs/repo-settings.md`, `docs/building.md`             | Changed       | Table, _Live_ |

## Order of work

1. Commit this plan: `plan(C291): approved by @henetiriki`.
2. Probe: push `chore/C291-probe`, whose `ignoreCommand` exits 0 only if `git fetch origin main` and `git merge-base` succeed; read Vercel's status with `gh api`; delete the branch. Needs a token: hand back.
3. Tests, script, D1, docs.
4. Tech lead empties the dashboard's Ignored Build Step.

## Risks

- `main` unreachable: every branch push deploys, not only the first; docs say so.

## Proof

| Acceptance check                     | Proven by                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| Skips and deploys per rule           | Unit tests; after merge, Vercel status on the next docs-only PR and its merge |
| Build without listed paths identical | `.next` hashes, build ID masked, against a full build                         |
| Import test fails                    | A run with a planted import                                                   |
| Lint, tests, validator, e2e          | Their output                                                                  |
