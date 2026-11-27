# Plan: SC.11: Design: boards compare spacing ratios, and show control sizes, rounding and borders

- **Spec:** #1204
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

A local Claude Code session that the tech lead starts draws `Spacing-and-controls.dc.html` and `Shapes.dc.html` in `design/canvas/project/`, and adds their records. The CI build agent writes no file: the records fail the tests until the boards and their snapshots exist. Each board follows `Type-scale.dc.html`: a `Surface` frame, a `Text` title and note, then CSS grid cells of `<div>`. The `DESIGN.md` rows are a design system input, so steps 2 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system) run on the branch.

The board frame, the gaps and the colours use tokens. Spacing uses the purpose names (`--space-inset-*`, `--space-gap-*`), not the deprecated `--space-N`, so SC.11.1 (#1205) has less to change. Each proposed value is a literal. A text sample takes the `tokens.css` class of its role (`.button-s`, `.control`) with a literal `font-size` and `line-height`, as SC.10 does: the exporter drops the bundle CSS, so `var(--type-*)` fails.

**`Spacing-and-controls.dc.html`** (Drafts, x 1520, y 0, 1440 wide) has three 440px columns: √2, 1.5 and 1.333. Each column has three parts:

1. **Steps.** One row for each step: a bar of the step's width and a `.mono` label.
2. **Names.** A `Surface` panel lists each `inset`, `gap` and `stack` name. Each row shows the name, its column step, its value on `main` and a bar of the step's width.
3. **Controls.** The small, medium and large control of the Spec's table, with a `.mono` meta line (step, size / line height, inset, height). Each control has a `border.hairline` border in `--line-strong`, `--radius-control` and 16px side padding. Its label is "Save". The small and medium controls sit in a dashed `border.hairline` box 44px high, which marks the hit area. The large control (50px) needs no box.

These are the steps of each name (D6 of the Spec):

| Name                                | `main` | √2  | 1.5 | 1.333 |
| ----------------------------------- | ------ | --- | --- | ----- |
| `inset-2xs`, `gap-2xs`, `stack-2xs` | 4      | 4   | 4   | 4     |
| `inset-xs`, `gap-xs`, `stack-xs`    | 8      | 8   | 8   | 8     |
| `inset-s`, `gap-s`                  | 12     | 12  | 12  | 12    |
| `inset-m`, `gap-m`                  | 16     | 16  | 16  | 16    |
| `inset-l`, `gap-l`                  | 20     | 24  | 24  | 20    |
| `inset-xl`, `gap-xl`                | 24     | 24  | 24  | 28    |
| `inset-2xl`                         | 32     | 32  | 36  | 36    |
| `inset-3xl`, `gap-3xl`              | 40     | 44  | 36  | 36    |
| `inset-4xl`                         | 48     | 44  | 56  | 52    |
| `inset-5xl`                         | 64     | 64  | 56  | 68    |

The ties are 20 (√2 and 1.5: 16 or 24), 24 (1.333: 20 or 28) and 32 (1.333: 28 or 36). Each takes the larger step.

**`Shapes.dc.html`** (Drafts, x 3040, y 0, 1440 × 900) has three rows:

1. **Rounding.** Five 96px squares with a `border.hairline` border: 4, 8, 12, 16 and full (999px).
2. **Nesting.** The three examples of the Spec's table. Each label reads "outer 12 − gap 4 = inner 8". The segmented control has three segments, and the selected one is filled. The chip panel holds two chips. The popup has three menu rows, and one row is highlighted.
3. **Borders.** Three boxes: `var(--border-hairline) solid var(--line-strong)`, `var(--border-emphasis) solid var(--ink)`, and an outline of `var(--focus-width) solid var(--focus-ring)` with `var(--focus-offset)`.

## Components

| Part                                | Component                             |
| ----------------------------------- | ------------------------------------- |
| Board frames, the names panel       | `Surface`                             |
| Titles, notes and column headings   | `Text`                                |
| Step bars, name rows and meta lines | hand-drawn: `.mono` and tokens        |
| Small, medium and large controls    | hand-drawn: role class, literal sizes |
| Hit-area box                        | hand-drawn: dashed `border.hairline`  |
| Rounding squares, nested examples   | hand-drawn: literal radii             |
| Border samples                      | hand-drawn: border and focus tokens   |

`Button`, `Segmented` and `Chip` take their sizes and radii from tokens on `main`, so the board draws each part by hand. The boards are on Drafts, which allows this. The PR lists each hand-drawn part with its one state.

## Decisions

**D1 · The JPG of `Spacing-and-controls`** · Decides: Tech lead

`shotFor` in `lib/design/shots.mts` cuts a JPG at 1440 × 900 unless its name is on the full-page list. The board is about 1300px high, so a cut JPG stops in the names panel. SC.13 (#1207) › Behaviour says "`Spacing-and-controls.dc.html`, its snapshot and its records go". The records of [the deletion rule](../design/CANVAS.md#who-deletes-a-generated-file) do not include `shots.mts`.

- **A.** Add `spacing-and-controls` to the full-page list, with a row in `lib/design/__tests__/shots.test.ts`. Cost: two lines. The build rewords the #1207 bullet to add "and its name in `lib/design/shots.mts`".
- **B.** Keep the cut JPG. The reader opens the canvas for the controls. No other issue changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **One board for all three scales.** The Spec names two boards, and SC.13 and SC.14 each delete one.
- **Controls from `Button`.** `Button` sets its height from `size.control*` on `main`, so it cannot show a proposed height.

## Files that change

| File                                                                   | New / changed | What                                         |
| ---------------------------------------------------------------------- | ------------- | -------------------------------------------- |
| `plans/SC.11-spacing-shapes-boards.md`                                 | New           | This plan                                    |
| `design/canvas/project/Spacing-and-controls.dc.html`                   | New           | The spacing and controls board               |
| `design/canvas/project/Shapes.dc.html`                                 | New           | The shapes board                             |
| `design/canvas/project/canvas.json`                                    | Changed       | The two entries on the Drafts page           |
| `design/canvas/project/ds/`, `VERSION`                                 | Changed       | Steps 4, 5 and 7.4                           |
| `design/canvas/export.json`                                            | Changed       | The two snapshots                            |
| `design/DESIGN.md`                                                     | Changed       | Two Screens rows, after the Type scale row   |
| `lib/design/__tests__/screens.test.ts`                                 | Changed       | Both names in `NO_ENTRY`                     |
| `lib/design/__tests__/design.test.ts`                                  | Changed       | Snapshot count 85 to 87                      |
| `scripts/__tests__/design-export.test.ts`                              | Changed       | Snapshot count and test title 85 to 87       |
| `lib/design/shots.mts`                                                 | Changed       | If D1 is A: `spacing-and-controls` full page |
| `lib/design/__tests__/shots.test.ts`                                   | Changed       | If D1 is A: a `spacing-and-controls` row     |
| `design/source/spacing-and-controls.html`, `design/source/shapes.html` | New           | The workflow Design: Render snapshots        |
| `design/spacing-and-controls.jpg`, `design/shapes.jpg`                 | New           | The workflow Design: Render snapshots        |

## Order of work

A local Claude Code session that the tech lead starts runs every step. It needs a signed-in account.

1. Record the D1 answer. Commit the approval. If D1 is A, reword #1207 ([reword step](../.github/agent/build.md#reword)).
2. Add the two `DESIGN.md` rows, `NO_ENTRY`, the two counts, the `export.json` entries and, if D1 is A, the `shots.mts` change and its test row (step 1 of Changing the design system).
3. Run `npm run design-system` (step 2).
4. Run `/publish-design-system` (step 3).
5. Run "Updating the install", 4.1 to 4.6 (step 4).
6. Run "Refreshing the canvas copy", 5.1 to 5.5 (step 5).
7. Draw both boards and their `canvas.json` entries in the repo copy ([Drawing a board](../design/CANVAS.md#drawing-a-board)). Check each value against the Spec's tables and the name table in Approach (step 7.1).
8. Run `npm run design:export`. If it fails, stop (step 7.2).
9. Publish both boards, then `canvas.json` last. Compare each sha256. Set line 2 of `canvas/VERSION` (steps 7.3 and 7.4).
10. Discard the `source/` changes. Commit `design/canvas/` alone. Push (step 7.5).
11. Run `gh workflow run design-agent-shots.yml --ref spec/SC.11-spacing-shapes-boards`. Pull its commit.
12. Compare the sha256 of each file under `canvas/project/ds/kinscape/` with `.design-system/project/`.
13. Run all checks. Paste the output.
14. In the PR body, list the boards, their layout, the hand-drawn parts and each value with no token: the steps, the name table, the control sizes and heights, the 16px side padding, the radii and the nested values.

## Risks

- **A wrong value.** About 120 hand-typed numbers can hold a typo. Step 7 checks each value against the tables, and the PR lists each value.
- **The export drops a class.** If a role class or a dashed border does not reach the snapshot, step 8 fails before the publish.
- **The board height.** If `Spacing-and-controls` is taller or shorter than 1300px, set its `canvas.json` `h` and `export.json` viewport to the real height. Write one line under Deviations.
- **Built snapshots.** If the shots commit changes a built snapshot, stop and ask the tech lead.
- **Word budget.** If the rows pass the `DESIGN.md` budget, stop and ask the tech lead.

## Proof

| Acceptance check                                       | Proven by                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Drafts holds both boards                               | The `canvas.json` entries with `"page": "drafts"`; the two JPGs                             |
| Each column's steps equal the Spec's list              | `design/source/spacing-and-controls.html`; step 7 check                                     |
| Each name shows its nearest step, ties take the larger | The name table in Approach; step 7 check                                                    |
| Each control: size, line height, inset, height, 44px   | The snapshot, read against the Spec's table; the hit-area box in the JPG                    |
| Each control: 16px sides, font, weight and tracking    | The role class and `padding` in the snapshot                                                |
| Each nested example equals the Spec's table            | `design/source/shapes.html`; step 7 check                                                   |
| Border widths use the three tokens                     | `git grep` of `--border-hairline`, `--border-emphasis`, `--focus-width` on `Shapes.dc.html` |
| The PR body lists boards, layout and values            | The PR body                                                                                 |
| The records of a new board are done for both           | `npm test` (`NO_ENTRY`, the two counts); the `DESIGN.md` diff; step 12                      |
| Steps 2 to 7 done; the workflow rendered               | The branch commits; the workflow run                                                        |
| The canvas copy matches `.design-system/project/`      | Step 12 sha256 comparison                                                                   |

## Out of scope

Spacing and control sizes in code: SC.13 (#1207). Rounding and border widths in code: SC.14 (#1208). Board sizes as tokens: SC.11.1 (#1205).

## Deviations

- `Spacing-and-controls` is 1401 px high, not 1300 px. Its `canvas.json` `h`, its `export.json` viewport and its `$preview` height are 1401 (9b04ede8).
