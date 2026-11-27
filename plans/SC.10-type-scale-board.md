# Plan: SC.10: Design: a Type scale board compares three ratios

- **Spec:** #1203
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

A local Claude Code session that the tech lead starts draws `Type-scale.dc.html` in `design/canvas/project/` and adds its records. The CI build agent writes no file: the records fail the tests until the board and its snapshot exist. The board is one CSS grid of `<div>` cells: a heading row, then 24 rows by 3 columns (1.125, 1.2, 1.25), so a role lines up across the columns. The rows go in step order, 900 to 200, then in the order of the Spec's step table inside a step. The `DESIGN.md` row is a design system input, so steps 2 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system) run on the branch.

Each cell has two parts:

- A meta line in `var(--type-mono-*)`: `role → proposed name`, the step, the proposed size and line height, and the size and line height on `main` in px (for example `12.5 / 18`).
- The sample: the role's `$description`, with `var(--type-<role>-font)`, `-weight` and `-tracking`, and a literal `font-size` and `line-height` in px. `overline` and `overline-tight` get `text-transform: uppercase`.

A line height comes from the proposed (rounded) size, as Behaviour says. These are the values that the board shows:

| Step | Roles              | 1.125 size / line | 1.2 size / line | 1.25 size / line |
| ---- | ------------------ | ----------------- | --------------- | ---------------- |
| 900  | `display`          | 29 / 36           | 40 / 52         | 49 / 60          |
| 800  | `h1`               | 26 / 32           | 33 / 40         | 39 / 48          |
| 700  | `h1-phone`         | 23 / 28           | 28 / 36         | 31 / 40          |
| 600  | `h2`               | 20 / 24           | 23 / 28         | 25 / 32          |
| 500  | `h3`               | 18 / 24           | 19 / 24         | 20 / 24          |
| 500  | `mono-l`           | 18 / 28           | 19 / 28         | 20 / 32          |
| 400  | the 7 roles of 400 | 16 / 24           | 16 / 24         | 16 / 24          |
| 300  | the 6 roles of 300 | 14 / 20           | 13 / 20         | 13 / 20          |
| 200  | the 5 roles of 200 | 13 / 20           | 11 / 16         | 10 / 16          |

Two line heights are halfway values and take the larger multiple: `display` at 1.2 (50 → 52) and `mono-l` at 1.25 (30 → 32).

Colours, spacing and the column headings use tokens and `Text`. The board is about 1440 × 1800 px. Its `canvas.json` entry sits on the Drafts page at x 0, y 0. Its viewport takes the `w` and `h` of that entry.

## Components

| Part                   | Component                             |
| ---------------------- | ------------------------------------- |
| Board frame            | `Surface`                             |
| Column headings        | `Text`                                |
| Meta line of each cell | hand-drawn: mono type tokens          |
| Sample text at a ratio | hand-drawn: literal size, role tokens |

`Text` takes a role, not a literal size, so the samples are hand-drawn. The board is on Drafts, which allows this. The PR lists both hand-drawn parts, with one state each.

## Decisions

**D1 · The JPG of the board** · Decides: Tech lead

`shotFor` in `lib/design/shots.mts` cuts a JPG at 1440 × 900 unless its name is on the full-page list (`map-style`, `fuzzy-date-readings`). The board is about 1800 px high, so a cut JPG stops near step 400. SC.12 (#1206) › Behaviour deletes "`Type-scale.dc.html`, its snapshot and its records".

- **A.** Add `type-scale` to the full-page list, with a row in `lib/design/__tests__/shots.test.ts`. Cost: two lines. The build rewords the #1206 bullet to add "and its name in `lib/design/shots.mts`".
- **B.** Keep the cut JPG. The reader opens the canvas for steps 300 and 200. No other issue changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **One table per ratio, side by side.** Three separate lists let the rows drift apart when a sample wraps. One grid keeps each role on one row.
- **A `<table>`.** The `<sc-for>` rule forbids a loop in a table, and 72 cells by hand are hard to check.

## Files that change

| File                                                     | New / changed | What                                              |
| -------------------------------------------------------- | ------------- | ------------------------------------------------- |
| `plans/SC.10-type-scale-board.md`                        | New           | This plan                                         |
| `design/canvas/project/Type-scale.dc.html`               | New           | The board                                         |
| `design/canvas/project/canvas.json`                      | Changed       | The board's entry on the Drafts page              |
| `design/canvas/project/ds/`, `VERSION`                   | Changed       | Steps 4, 5 and 7.4                                |
| `design/canvas/export.json`                              | Changed       | The `type-scale` snapshot                         |
| `design/DESIGN.md`                                       | Changed       | Screens row "Type scale, three ratios (proposal)" |
| `lib/design/__tests__/screens.test.ts`                   | Changed       | `type-scale` in `NO_ENTRY`                        |
| `lib/design/__tests__/design.test.ts`                    | Changed       | Snapshot count 84 to 85                           |
| `scripts/__tests__/design-export.test.ts`                | Changed       | Snapshot count and test title 84 to 85            |
| `lib/design/shots.mts`                                   | Changed       | If D1 is A: `type-scale` on the full-page list    |
| `lib/design/__tests__/shots.test.ts`                     | Changed       | If D1 is A: a `type-scale` row                    |
| `design/source/type-scale.html`, `design/type-scale.jpg` | New           | The workflow Design: Render snapshots             |

## Order of work

A local Claude Code session that the tech lead starts runs every step. It needs a signed-in account.

1. Record the D1 answer. Commit the approval. Reword #1206 if D1 is A ([reword step](../.github/agent/build.md#reword)).
2. Add the `DESIGN.md` row, `NO_ENTRY`, the two counts, the `export.json` entry and, if D1 is A, the `shots.mts` change and its test row (step 1 of Changing the design system).
3. Run `npm run design-system` (step 2).
4. Run `/publish-design-system` (step 3).
5. Run "Updating the install", 4.1 to 4.6 (step 4).
6. Run "Refreshing the canvas copy", 5.1 to 5.5 (step 5).
7. Draw the board and its `canvas.json` entry in the repo copy ([Drawing a board](../design/CANVAS.md#drawing-a-board)). Check each cell against the table in Approach (step 7.1).
8. Run `npm run design:export`. If it fails, stop (step 7.2).
9. Publish the board, then `canvas.json` last. Compare each sha256. Set line 2 of `canvas/VERSION` (steps 7.3 and 7.4).
10. Discard the `source/` changes. Commit `design/canvas/` alone. Push (step 7.5).
11. Run `gh workflow run design-agent-shots.yml --ref spec/SC.10-type-scale-board`. Pull its commit.
12. Compare the sha256 of each file under `canvas/project/ds/kinscape/` with `.design-system/project/`.
13. Run all checks. Paste the output.
14. In the PR body, list the board, its layout, the hand-drawn parts and each value with no token: each size and line height of the table in Approach.

## Risks

- **SC.11 (#1204) in parallel.** It adds two Drafts boards and raises the same two snapshot counts. The second PR to merge rebases, adds its boards to the count, and runs steps 3 to 5 again ([Where](../design/CANVAS.md#changing-the-design-system)).
- **A wrong value.** 72 hand-typed numbers can hold a typo. Step 7 checks each cell against the table in Approach, and the PR lists each value.
- **Wrapped samples.** A long `$description` at 49 px wraps in a 440 px column. The wrap shows the line height, and the row grows to the tallest cell.
- **Built snapshots.** If the shots commit changes a built snapshot, stop and ask the tech lead.
- **Word budget.** If the row passes the `DESIGN.md` budget, stop and ask the tech lead.

## Proof

| Acceptance check                                    | Proven by                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| Drafts holds the board with three columns           | `canvas.json` entry with `"page": "drafts"`; `type-scale.jpg`               |
| Each column shows the 24 roles and their values     | `git grep -c` of each role name on `design/source/type-scale.html`; the JPG |
| Each sample: `$description`, font, weight, tracking | `design/source/type-scale.html`, read against the tokens file               |
| Step and proposed name match the table              | Step 7 check against the Spec's table                                       |
| Each proposed size is 16 × ratioⁿ, rounded          | The table in Approach; step 7 check                                         |
| Each proposed line height follows the rule          | The table in Approach; step 7 check                                         |
| The PR body lists the board, layout and values      | The PR body                                                                 |
| The records of a new board are done                 | `npm test` (`NO_ENTRY`, the two counts); the `DESIGN.md` diff; step 12      |
| Steps 2 to 7 done; the workflow rendered            | The branch commits; the workflow run                                        |
| The canvas copy matches `.design-system/project/`   | Step 12 sha256 comparison                                                   |

## Out of scope

The chosen ratio as settings, the merges and the renames: SC.12 (#1206). Spacing, controls, rounding and borders: SC.11 (#1204).

## Deviations

- The meta line and each sample take the `tokens.css` text-style class of their role (`.mono`, `.h1`). They use no `var(--type-<role>-*)`. The exporter drops the bundle CSS, so `design:export` failed on those variables.
- The board is 1440 × 2340 px, not 1800. The wrapped samples make the rows taller. The workflow JPG shows the real height.
