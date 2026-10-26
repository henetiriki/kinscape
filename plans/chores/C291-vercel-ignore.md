# Plan: C291: Skip Vercel deploys for changes no user can see

- **Spec:** #291
- **Status:** approved

## Approach

`vercel.json` runs `node scripts/vercel-ignore.mts`, built-ins only (it runs before `npm ci`). It exports `invisible(path)` and `run(env, get)`: 1 on `po-preview`; else it lists changed files via the GitHub API with `KINSCAPE_GIT_READ_TOKEN`: the commit on `main`, `compare/main...<sha>` elsewhere, renames counting both paths. 0 only for 1–299 files, all invisible; no token or any HTTP error gives 1. The token goes only in the `Authorization` header.

The import test resolves imports in non-test `app/`, `lib/` and `types/` files, failing on any `invisible` path.

## Decisions

**D1 · `lib/design/sweep.mts` imports `scripts/design-shots.mts`** · Decides: Tech lead
The import test would fail on it.

- **A.** Move `shotFor` and `Shot` to `lib/design/shots.mts`.
- **B.** Skip `sweep.mts` in the import test.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How the script reads the diff** · Decides: Tech lead
Vercel's clone has no `origin` and is shallow.

- **A.** GitHub API: GitHub finds the merge base.
- **B.** `git fetch` by URL, then `git diff`; may lack a merge base.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                    | New / changed | What          |
| ------------------------------------------------------- | ------------- | ------------- |
| `vercel.json`, `scripts/vercel-ignore.mts`              | New           | The rule      |
| `scripts/__tests__/vercel-{ignore,imports}.test.ts`     | New           | Both tests    |
| `lib/design/shots.mts`, `sweep.mts`, `design-shots.mts` | New, changed  | D1 A          |
| `docs/repo-settings.md`, `docs/building.md`             | Changed       | Token, _Live_ |

## Order of work

1. Commit this plan; reword #291's _Diff_ and token lines.
2. Tech lead adds the token. Probe prints the compare call's status; delete the branch.
3. Tests, script, D1, docs.
4. Tech lead empties the dashboard's Ignored Build Step.

## Proof

| Acceptance check                     | Proven by                                                 |
| ------------------------------------ | --------------------------------------------------------- |
| Skips and deploys per rule           | Unit tests; Vercel status on a docs-only PR and its merge |
| Build without listed paths identical | `.next` hashes against a full build                       |
| Import test fails                    | A run with a planted import                               |
| Lint, tests, validator, e2e          | Their output                                              |
