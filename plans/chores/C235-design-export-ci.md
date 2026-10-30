# Plan: C235: Export design snapshots in CI, and fail on hand-edited snapshots

- **Spec:** #235
- **Status:** approved

## Approach

The workflow runs `design:export` before `design:shots` and carries both file types. `design-shots-ci.mts` splits the status into HTML snapshots, JPGs and everything else. The `e2e` job exports and fails on any change under `design/source`.

## Decisions

**D1 · Where the CI step's check lives** · Decides: Tech lead

- **A.** A `source` command in `design-shots-ci.mts`: reuses `parseStatus`, unit-tested, prints one `::error file=` line per file.
- **B.** Inline shell in `ci.yml`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | What                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `scripts/design-shots-ci.mts`, its test    | `html` list, `check` allows it, summary lists both                |
| `.github/workflows/design-agent-shots.yml` | Export step, both globs in upload and `git add`, message, comment |
| `.github/workflows/ci.yml`                 | Export-and-compare step after `npm ci` in `e2e`                   |
| `design/DESIGN.md`                         | Replace the paragraph after the Screens table                     |

## Order of work

1. Failing tests (rule 12), then the script.
2. Workflow, CI step, `DESIGN.md`.

## Risks

- Upload keeps `design/` as the root only while a JPG matches; one always does.
- Export adds about a minute to `e2e`.
- Drafts skip `e2e`, so the step only runs on ready PRs and `main`.

## Proof

| Acceptance check                             | Proven by                                                    |
| -------------------------------------------- | ------------------------------------------------------------ |
| Canvas label change: one commit, both listed | Workflow run on a throwaway branch; link and summary in PR   |
| Hand-edited snapshot fails CI, naming it     | Temporary commit on this ready PR, then reverted; run linked |
| `main` passes; workflow reports no changes   | CI run on this PR; workflow run on the branch                |
| `test`, `lint`, `format:check`, `words`      | Output in the PR                                             |
