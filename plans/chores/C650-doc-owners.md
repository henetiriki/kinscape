# Plan: C650: Name one owner for each doc fact and check doc links

- **Spec:** #650
- **Status:** approved

## Approach

`scripts/doc-links.mts` reads the links and anchors, and lists each simple cycle; a self-link is no edge. A cycle passes if one allowlist entry holds every file on it. Trim items 5 and 7 of `architecture-target.md`; keep item 6.

## Decisions

**D1 · How `docs/README.md` names owners** · Decides: Tech lead

- **A.** Name each owner file as a code span.
- **B.** Link each owner file, and allow a `how-we-work.md` cycle.
- **Other:** your own.

**Answer: Other:** `docs/README.md` links every owner file. Only `README.md` and the review prompt link to it. `how-we-work.md` drops its "More detail" list. (@henetiriki)

**D2 · When an allowlist entry matches a cycle** · Decides: Tech lead

- **A.** The entry holds each file on the cycle.
- **B.** The cycle holds each file in the entry.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | New / changed | What                                                |
| ---------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `docs/README.md`                                                 | New           | The owner table                                     |
| `README.md` and six files in `docs/`                             | Changed       | The edits that the Chore lists                      |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | Changed       | Two budgets; default run from `git ls-files`; tests |
| `scripts/doc-links.mts`, `scripts/__tests__/doc-links.test.ts`   | New           | The link test, its fixtures and the repo run        |

## Order of work

1. Fixtures, then `doc-links.mts`.
2. Default-run tests, then `word-count.mts`.
3. Docs.

## Deviations

- Rule: keep each `<a id>` anchor.
- Item 7 keeps the `server/env.mts` part.
- The requirements row splits: Intent, Chore.
- The Live row is reworded.
- The review prompt has no link to `docs/README.md`; a person adds it (`.github/**`).
- The default `words` run adds untracked files.

## Proof

| Acceptance check                                  | Proven by               |
| ------------------------------------------------- | ----------------------- |
| Lint, `format:check`, `words` and tests pass      | Output in the PR        |
| The default `words` run covers each budgeted file | `word-count.test.ts`    |
| The link test passes; four fixtures fail          | `doc-links.test.ts`     |
| `requirements.md`, `building.md`, Live row        | `git diff` in the PR    |
| `architecture-target.md` names nothing built      | Review against the code |
