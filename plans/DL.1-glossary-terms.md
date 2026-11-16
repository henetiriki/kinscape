# Plan: DL.1: Glossary terms for the design loop

- **Spec:** #894
- **Requirement IDs:** None. The Spec changes docs only.
- **Status:** approved

## Approach

Edit `docs/glossary.md` › "Glossary terms" in one commit. Add the twelve rows of the Spec table, each in its A to Z place. Rename the "Page" row to "Canvas page", set its Avoid cell to "tab, page" and move it to its A to Z place. Change "a page" to "a canvas page" in the "Board" row, and "pages" to "canvas pages" in the "Canvas" row. Put the line about the **Planned (#n)** mark above the table, under "No other file defines these terms." Then run `npm run format`, which aligns the table.

The order of the rows after the edit is:

1. Board, Bundle, Canvas, Canvas copy, Canvas page, Card JPG, Card state, CI agent, Component card.
2. Design kit, Design system, Design system files, Draft page, Exporter, Fixture Account, Gallery, Hand-drawn.
3. Install, Local session, Mounted, Plan PR, Plan run, Reference screen, Screen, Snapshot, Swap, Wrapper board.

The order ignores case, as the table does now ("Canvas copy" before "CI agent").

## Files that change

| File                           | New / changed | What                                                         |
| ------------------------------ | ------------- | ------------------------------------------------------------ |
| `docs/glossary.md`             | Changed       | Twelve new rows, the "Canvas page" row, "Board" and "Canvas" |
| `plans/DL.1-glossary-terms.md` | New           | This plan                                                    |

## Order of work

1. Edit `docs/glossary.md` as the Approach says. Copy each Meaning and Avoid cell from the Spec word for word.
2. Run `npm run format`.
3. Run the checks in `AGENTS.md` › Commands. Paste the output in Evidence.
4. Run `git diff --stat origin/main`. Paste the output in Evidence.

## Risks

- **The table fills its word budget.** The budget of `docs/glossary.md` is 1200 words. The new rows and the line add about 220 words to a file of about 620. `npm run words` shows it.
- **DL.3 (#896) renames "Card JPG".** DL.3 makes the row "Card image", a PNG in `design/cards/`. This plan adds "Card JPG" as the Spec says. The Spec's Flagged concerns give that change to DL.3.

## Proof

| Acceptance check                                          | Proven by                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1. Twelve new rows and "Canvas page", in A to Z order     | The diff; the row list in the Approach                                      |
| 2. No "Page" row; "Board" and "Canvas" say "canvas page"  | The diff: the "Page" row is now the "Canvas page" row                       |
| 3. `npm run words` passes                                 | Output in Evidence                                                          |
| 4. Only `docs/glossary.md` and the plan change            | `git diff --stat origin/main` in Evidence                                   |
| 5. "Planned (#893)" in four rows, one line gives the mark | `git grep -n "Planned (#893)" docs/glossary.md` in Evidence: four rows only |

## Out of scope

Each item of the Spec's "Out of scope / carried forward". No other file changes its words to the new terms.
