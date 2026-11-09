# Plan: C652: Move the canvas procedures out of DESIGN.md

- **Spec:** #652
- **Status:** draft

## Approach

Do the Chore's edits. In `design/CANVAS.md`, write `AGENTS.md` as plain text. In Components, write `architecture.md` as plain text: `plainLinks` already gives that text, so the design system README does not change. Put the `CANVAS.md` line in place of the moved paragraph. The `docs/README.md` topic is "Canvas and snapshots".

## Files that change

| File                                                     | New / changed | What                                        |
| -------------------------------------------------------- | ------------- | ------------------------------------------- |
| `design/CANVAS.md`                                       | New           | The four moved parts                        |
| `design/DESIGN.md`                                       | Changed       | The Chore's edits                           |
| `AGENTS.md`, `docs/how-we-work.md`, `docs/README.md`     | Changed       | Links and the row for `design/CANVAS.md`    |
| `scripts/vercel-ignore.mts`, its test                    | Changed       | `design/CANVAS.md` is invisible             |
| `scripts/word-count.mts`, `__tests__/word-count.test.ts` | Changed       | Two budgets; `DESIGN.md` leaves "no budget" |
| `scripts/doc-links.mts`                                  | Changed       | Delete the `DESIGN.md` entry                |

## Order of work

1. Change the two tests, and see them fail.
2. Change the scripts, then the docs.

## Risks

- `design/DESIGN.md` will have about 2,900 words, near its budget. If it goes over, stop and ask the tech lead.
- `AGENTS.md` is a hand-back path, so a person builds this Chore.

## Proof

| Acceptance check                                           | Proven by                                        |
| ---------------------------------------------------------- | ------------------------------------------------ |
| Lint, `format:check`, `words`, tests, `design:check`       | Output in the PR                                 |
| Same design system `README.md`                             | `git diff --no-index` of runs on main and branch |
| Budgets of 3,000 and 550                                   | `npm run words`                                  |
| `DESIGN.md` links; no allowlist entry; old anchors resolve | `doc-links.test.ts`; `git grep` in the PR        |
| `design/CANVAS.md` is invisible                            | `vercel-ignore.test.ts`                          |
| `docs/README.md` row                                       | `git diff`                                       |
