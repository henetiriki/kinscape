# Plan: C560: Repoint the code-review plugin to claude-plugins-official

- **Spec:** #560
- **Status:** approved

## Approach

In `marketplace.json`, the `code-review` entry's `source.url` becomes `https://github.com/anthropics/claude-plugins-official.git` and `source.sha` becomes `9780cf407f5593727b668bae95a0c4ae2e0de1ae` (v1.0.1); `source.path` stays `plugins/code-review`. Its `description` names `anthropics/claude-plugins-official`. Per D1, the one test that reads the real file expects the new repo. `marketplace.json` is a code-owner path, so the PR is labelled `hand-back` and the tech lead builds it (rule 13).

## Decisions

**D1 · The Chore's file list leaves out a test that pins the old repo** · Decides: Tech lead

"Reads the pin from the real marketplace.json" in `scripts/__tests__/claude-plugin-pin-check.test.ts` expects `repo: 'anthropics/claude-code'`, so it fails after the repoint.

- **A.** Change that one assertion to `anthropics/claude-plugins-official` (rule 10). Fixture tests keep `anthropics/claude-code` as sample data.
- ~~**B.** Loosen the assertion to any `owner/repo`.~~
- **Other:** your own.

**Answer: A** (@henetiriki, on #560)

## Files that change

| File                                                     | New / changed | What                                                                  |
| -------------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| `.github/claude-plugins/.claude-plugin/marketplace.json` | changed       | `source.url`, `source.sha`, plugin `description`                      |
| `scripts/__tests__/claude-plugin-pin-check.test.ts`      | changed       | real-file assertion expects `anthropics/claude-plugins-official` (D1) |

## Order of work

1. Change the real-file assertion; see it fail on `repo` (rule 12).
2. Edit `marketplace.json`; the test passes.
3. Run `node scripts/claude-plugin-pin-check.mts`, lint, `format:check`, `words` and tests.

## Risks

- If upstream's sha or path is wrong, the pin check fails with "No commits found" or reports newer commits, and the review can't install the plugin: step 3 shows it before merge.

## Proof

| Acceptance check                                       | Proven by               |
| ------------------------------------------------------ | ----------------------- |
| Pin check prints "Up to date"                          | pasted output of step 3 |
| Next `claude-review` log: plugin installs, review runs | run linked in the PR    |
| Lint, `format:check`, `words`, tests pass              | pasted output           |

## Out of scope

- `claude-code-review.yml`, `scripts/claude-plugin-pin-check.mts` and `review-settings.json`, as the Chore says.
