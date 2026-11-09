# Plan: C650: Name one owner for each doc fact and check doc links

- **Spec:** #650
- **Status:** draft

## Approach

Make the listed doc edits. Add `scripts/doc-links.mts`: it checks link files and anchors, and lists each simple cycle. It does not follow a link into an excluded file.

## Decisions

**D1 · Links in `docs/README.md`** · Decides: Tech lead

`how-we-work.md` will link to `docs/README.md`, so a link back to it, `building.md` or `security.md` makes a new cycle.

- **A.** Name each owner file in a code span, with no link.
- **B.** Link each owner file except those three.
- **Other:** your own.

Recommended: A, because one rule covers all ten rows.

**D2 · When an allowlist entry matches a cycle** · Decides: Tech lead

- **A.** The entry holds each file on the cycle. The `DESIGN.md` entry lists the six files on its cycles.
- **B.** The cycle holds each file in the entry. The `DESIGN.md` entry lists one file.
- **Other:** your own.

Recommended: A, because B passes a new cycle through two allowed files.

## Files that change

| File                                       | What                                             |
| ------------------------------------------ | ------------------------------------------------ |
| `docs/README.md`                           | New: ten topics, each with its owner (D1)        |
| `README.md`, `docs/how-we-work.md`         | One link replaces each index list                |
| `docs/how-we-work.md`, `requirements.md`   | Live row; requirement change rule; Storage link  |
| `docs/building.md`, `architecture.md`      | Move Styles; link the page rule                  |
| `docs/architecture-target.md`              | Keep file adapters, logger, route states; rename |
| `docs/repo-settings.md`                    | Labels and Autolinks rows                        |
| `scripts/word-count.mts` and its test      | Two budgets; add both to the default list        |
| `scripts/doc-links.mts` and its test (new) | Links, anchors, cycles, allowlist (D2); fixtures |

## Proof

| Acceptance check                               | Proven by                          |
| ---------------------------------------------- | ---------------------------------- |
| Lint, `format:check`, `words`, `npm test` pass | CI                                 |
| `docs/README.md` names ten existing owners     | `doc-links.test.ts` reads its rows |
| Link test passes; four fixtures fail           | `doc-links.test.ts`                |
| `requirements.md` diff, Styles, Live row       | `git diff origin/main` in Evidence |
| `architecture-target.md` names no built item   | `git grep` output in Evidence      |
