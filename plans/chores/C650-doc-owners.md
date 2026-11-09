# Plan: C650: Name one owner for each doc fact and check doc links

- **Spec:** #650
- **Status:** approved

## Approach

`scripts/doc-links.mts` reads the links and anchors, and lists each simple cycle; a self-link is no edge. A cycle passes if it holds every file of one allowlist entry. The `word-count.mts` tests `git init` their fixture. Delete item 6 of `architecture-target.md`, because the contract suite has it.

## Decisions

**D1 · How `docs/README.md` names owners** · Decides: Tech lead

A link to `how-we-work.md` or `security.md` makes a cycle with `docs/README.md` that no allowlist entry holds.

- **A.** Name each owner file as a code span. The test checks that each named file exists.
- **B.** Link each owner file, and add `how-we-work.md` with `docs/README.md` to the allowlist.
- **Other:** your own.

**Answer: Other:** docs/README.md links every owner file. Only README.md and the review prompt link to it. how-we-work.md drops its "More detail" list and adds no link. No owner file links docs/README.md. Drop "each file exists" from the done-checks: the link test covers it. (@henetiriki)

**D2 · When an allowlist entry matches a cycle** · Decides: Tech lead

- **A.** The entry holds each file on the cycle. The `DESIGN.md` entry lists the six files on its cycles.
- **B.** The cycle holds each file in the entry. The `DESIGN.md` entry lists one file.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | New / changed | What                                                         |
| ---------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `docs/README.md`                                                 | New           | The owner table                                              |
| `README.md` and six files in `docs/`                             | Changed       | The edits that the Chore lists                               |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | Changed       | Two budgets; default run from `git ls-files`; its test cases |
| `scripts/doc-links.mts`, `scripts/__tests__/doc-links.test.ts`   | New           | The link test, its fixtures and the repo run                 |

## Order of work

1. Write the link fixtures, see them fail, then write `doc-links.mts`.
2. Change the default-run tests, see them fail, then change `word-count.mts`.
3. Make the doc edits until the repo run passes.

## Risks

- A slug can differ from GitHub's. Fixtures cover punctuation such as `What's set and why`.

## Proof

| Acceptance check                                  | Proven by                                      |
| ------------------------------------------------- | ---------------------------------------------- |
| Lint, `format:check`, `words` and tests pass      | Output in the PR                               |
| The default `words` run covers each budgeted file | `word-count.test.ts`                           |
| Ten owner files exist                             | `doc-links.test.ts`                            |
| The link test passes; four fixtures fail          | `doc-links.test.ts`                            |
| `requirements.md`, `building.md`, Live row        | `git diff` in the PR                           |
| `architecture-target.md` names nothing built      | Review against `server/env.mts`, `contract.ts` |
