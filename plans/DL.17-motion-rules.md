# Plan: DL.17: Motion rules in DESIGN.md and the design system; /design-kit/foundations goes

- **Spec:** #918
- **Requirement IDs:** [NFR-01](../docs/requirements.md#nfr-01), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

`design/DESIGN.md` gains `## Motion` after "Shape and depth". A `Token | Use` table has one row for each `motion` token. Each Use cell is the `title` and the `use` of its `MOTION` row, for example "Hover, press: colour and border only". Two sentences follow: the map date change rule with NFR-01, and the `prefers-reduced-motion` rule from the board. `README_SECTIONS` gains "Motion" after "Shape and depth". The sentence that names `/design-kit/foundations` goes.

A new test in `system.test.ts` reads the Motion section. `expect(missing).toEqual([])` names each `motion` key that does not occur once as code. The section must hold "NFR-01" and "prefers-reduced-motion", and no `ms` value.

`Icon.test.tsx` loops over the 26 names of `Object.keys(PATHS)`.

The board retires by the steps of DL.11, as `plans/DL.14-feedback-retire.md` did. The "Foundations" entry of `BOARD_LINKS` gets `gone: true`. So the test "a board that is gone gives a 404" opens `/design-kit/foundations` (see Deviations).

## Decisions

**D1 · The icon rules on the board** · Decides: Tech lead

The board's Icons section holds rules that no doc holds: a 24px grid, a 2px stroke, round caps and joins, `currentColor`, 16, 18 or 20px (24 on the phone layers button), `aria-hidden`, and an icon-only button that carries the name. After this Spec, only the canvas boards `SG-Foundations` and `SG-Foundations-phone` hold them. DL.21 (#929) deletes those boards, and it holds no value for these rules. `Icon.test.tsx` proves the stroke, `currentColor` and `aria-hidden`, but not the sizes or the name rule.

- **A.** "Shape and depth" in `design/DESIGN.md` gains an "Icons" row with the board text. The README gets it through the design system steps that the Spec runs. Cost: one table row, about 45 words. The Spec's Behaviour gains an item.
- **B.** The rules go with the board. The build adds a Flagged concern to #929: move the rules before the SG boards go. Cost: no change here; #929 grows by one row.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                  | New / changed | What                                                                               |
| ----------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `design/DESIGN.md`                                    | changed       | `## Motion` (items 1 and 2); the sentence of item 4 goes; D1 A adds a row          |
| `lib/design/system.mts`                               | changed       | `README_SECTIONS` gains "Motion" (item 3)                                          |
| `lib/design/__tests__/system.test.ts`                 | changed       | The Motion test; "Motion" once in the README (checks 1 to 3)                       |
| `app/components/foundation/__tests__/Icon.test.tsx`   | changed       | Names from `PATHS` (item 5)                                                        |
| `app/design-kit/foundations/`                         | deleted       | `page.tsx`, `page.module.css`, `values.ts` and two tests (item 7.1)                |
| `design/screens.json`                                 | changed       | Delete `style-3-foundations` and `style-3-foundations-phone` (item 7.2)            |
| `lib/design/__tests__/screens.test.ts`                | changed       | `NO_ENTRY` gains the two names, in sort order (item 7.4)                           |
| `e2e/design-kit.spec.ts`                              | changed       | `gone: true`; two tests go; the phone loop loses `foundations` (items 7.5 and 7.6) |
| `scripts/word-count.mts`                              | changed       | Only if `design/DESIGN.md` passes 4000 words                                       |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | The design system steps                                                            |
| `plans/DL.17-motion-rules.md`                         | new           | This plan                                                                          |

## Order of work

1. Write the Motion test and the README heading check. See them fail on the five missing tokens ([test-first rule](README.md#test-first)).
2. Write `## Motion`. Add "Motion" to `README_SECTIONS`. Delete the sentence of item 4. Apply D1.
3. Change `Icon.test.tsx`.
4. Fill the table of item 6: each of the 23 tokens of `SPACE`, `RADII` and `SHADOWS`, its board text, its note in `design/tokens.json`, and "same use" or the use that the note lacks. Change no note.
5. Run `git rm -r app/design-kit/foundations`. Delete the two screen entries. Add the two names to `NO_ENTRY`. Change `e2e/design-kit.spec.ts`.
6. Run `git grep -n design-kit/foundations -- app e2e lib design/screens.json design/DESIGN.md`. Expect only `KitNav.test.tsx`, `KitMenu.test.tsx` and `e2e/design-kit.spec.ts`.
7. Run `npm run words`. If `design/DESIGN.md` passes its budget, raise it in `scripts/word-count.mts` and say so in the PR.
8. Run `npm run design:check` and the checks in `AGENTS.md` › Commands. Push.
9. Run the steps of [Changing the design system](../design/CANVAS.md#changing-the-design-system):
   1. Run `npm run design-system`.
   2. Run `/publish-design-system` (steps 3.1 to 3.11).
   3. Run "Updating the install" (4.1 to 4.7).
   4. Run "Refreshing the canvas copy" (5.1 to 5.5).

   No board changes, so steps 6 and 7 do not apply. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 9.2 to 9.4. The session needs a signed-in account. The CI build agent asks for them in the PR and keeps the PR as a draft ([design-system rule](README.md#design-system)).

## Risks

- #917 (DL.16) and #961 (DL.20) also change `BOARD_LINKS` and the phone loop `['colour', 'foundations', 'map-style']`. The PR that merges second resolves the conflict.
- The Motion test counts each token name as code. So the two rules name no token.

## Proof

| Acceptance check | Proven by                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| 1, 2             | The Motion test in `system.test.ts`                                                                             |
| 3                | `system.test.ts` › `readme`: the order of `README_SECTIONS`, and "Motion" once                                  |
| 4                | `Icon.test.tsx` imports; 26 test rows for each loop                                                             |
| 5                | The `git grep` of step 6, pasted in the PR                                                                      |
| 6                | The test "a board that is gone gives a 404"                                                                     |
| 7                | `npm run design:check`                                                                                          |
| 8, 9             | Step 9; the PR pastes the sha256 report of steps 4.6 and 5.2                                                    |
| 10               | `git diff main --stat -- design/source 'design/*.jpg'` and the boards under `design/canvas/project/`, in the PR |
| 11               | The table of step 4 in the PR body                                                                              |
| 12               | The check output in the PR                                                                                      |

## Out of scope

- The `SG-Foundations` boards, their snapshots, JPGs and `design/DESIGN.md` rows, and the two `NO_ENTRY` names: DL.21 (#929).
- A `motion` family in the design system.

## Deviations

- Spec item 7.6 says one new 404 test. The test "a board that is gone gives a 404" of DL.11 covers each `gone` board, so the build adds no test. The route stays as plain text in `BOARD_LINKS`.
- `design/DESIGN.md` passed 4000 words, so the build raised its budget to 4150 in `scripts/word-count.mts` and in `scripts/__tests__/word-count.test.ts`.
- **D2** (tech lead, @henetiriki): eight notes in `design/tokens.json` lack a use that the board states. A: add all eight. B: add only `radius panel` (desktop dialogs) and `shadow raised` (cards). C: add none. **Answer: A.** The build edits `design/tokens.json` and runs the design system steps again.
