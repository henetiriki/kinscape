# Plan: SC.12: Text follows the chosen type scale

- **Spec:** #1206
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The CI build changes the code. `scale.text` takes the ratio mode. A new `derived` mode writes two line groups from the text steps (D15). The `type` group and every reader take the 20 names. `npm run tokens` writes the `h1` phone step as an `@media` block (D14). A local session then runs steps 3 to 5 and 7. It deletes the Type scale board and renames the roles on the boards.

### The names

| Old (kebab · camel)                              | New (kebab · camel)              | Step | Size / line |
| ------------------------------------------------ | -------------------------------- | ---- | ----------- |
| `display`                                        | same                             | 900  | 49 / 60     |
| `h1`; `h1-phone` · `h1Phone`                     | `h1`                             | 800  | 39 / 48     |
| (`h1` on a phone)                                | `h1`                             | 700  | 31 / 40     |
| `h2`                                             | same                             | 600  | 25 / 32     |
| `h3`                                             | same                             | 500  | 20 / 24     |
| `mono-l` · `monoL`                               | `mono-title` · `monoTitle`       | 500  | 20 / 32     |
| `body`; `body-l` · `bodyL`                       | `body`                           | 400  | 16 / 24     |
| `title`, `link`                                  | same                             | 400  | 16 / 24     |
| `control`; `button`                              | `control`                        | 400  | 16 / 24     |
| `mono-m`                                         | `mono`                           | 400  | 16 / 24     |
| `small`, `label`, `chip`, `chip-off` · `chipOff` | same                             | 300  | 13 / 20     |
| `button-s` · `buttonS`                           | `control-small` · `controlSmall` | 300  | 13 / 20     |
| `link-s` · `linkS`                               | `link-small` · `linkSmall`       | 300  | 13 / 20     |
| `caption`, `credits`                             | same                             | 200  | 10 / 16     |
| `overline`; `overline-tight` · `overlineTight`   | `overline`                       | 200  | 10 / 16     |
| `mono`                                           | `mono-caption` · `monoCaption`   | 200  | 10 / 16     |

The `$description` and "Used for" text of a kept role (Spec D10):

- `h1`: "Page title, on a desktop and on a phone."
- `body`: "Panels, popups, sign-in and fields."
- `control`: "Large buttons on sign-in, medium buttons and controls."
- `overline`: "Section headings, and layer group headings in the map panel."

### The board prompt

```text
Follow design/CANVAS.md › Changing the design system, step 7, for each board in design/canvas/project/.
Use plans/SC.12-type-scale-ratio.md › The names.
First change the old mono role: class="mono", variant="mono" and var(--type-mono-font), -size, -line, -weight and -tracking become mono-caption.
Then change each other old name to its new name, in classes, Text variants and var(--type-*) names.
Make the four D13 changes of #1206. Change the three "small · button-s (proposed control-small)" labels to "small · control-small".
Change no size, layout, word or part.
```

## Decisions

**D14 · Where the `h1` phone step lives** · Decides: Tech lead

- **A.** `type.h1.$extensions.kinscape.breakpoints.phone` holds `size` and `line` references. `npm run tokens` writes `@media <phone query> /* breakpoint: phone */ { :root { --type-h1-size; --type-h1-line } }` after `:root` in `app/tokens.css`. The bundle copies that file, so boards get it too. Cost: about 40 lines in `style-dictionary.mts` and its test. The design system's `.h1` class shows step 800 only.
- **B.** `type.h1` gets `size-phone` and `line-phone` leaves. `Text.module.css` swaps them in a marked `@media`. Cost: two new `--type-h1-*` names for the role-set test to allow. Each other reader of `--type-h1-size` needs its own rule.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D15 · The shape of the derived mode** · Decides: Tech lead

- **A.** Two step groups, `scale.line` (ratio 1.5) and `scale.line-heading` (ratio 1.25). Each has `mode: derived`, `from: text`, `ratio`, `round: 4` and `unit: rem`. Step n is text step n × ratio, rounded as `roundTo` does. A role's `line` refers to the step of its size in the group of its font. Cost: a second line group, and a test that fails a role whose `line` step or group is wrong.
- **B.** The `type` group holds the settings, and `npm run tokens` writes each role's `line` value. `scale.line` goes. Cost: generated values outside `scale`, so `scaleProblems` must also read `type`. A role's line refers to no step.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D16 · The phone rules that switch to an equal style** · Decides: Tech lead

On a phone, `TextField`, `TextAreaField` and `FuzzyDateField` switch to `body-l` size so the browser does not zoom in. After the merge, both sides are 16 / 24.

- **A.** Remove the three phone rules and their test lines. `components.md` drops "(`type.body-l` on phones)" and "(`type.body-l` size on phones)". Cost: if a later base drops `body` below 16px, phones zoom in again.
- **B.** Keep each rule, renamed to `--type-body-*` on both sides. Cost: three rules that change nothing.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                                                                                                                                                                             | New / changed     | What                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/design/scales.mts`, `lib/design/types.ts`                                                                                                                                                                                                                                   | changed           | The `derived` mode reads the steps of its `from` group (D15).                                                                                          |
| `lib/design/__tests__/scales.test.ts`                                                                                                                                                                                                                                            | changed           | Derived steps, the halfway rule, and an unknown `from` group.                                                                                          |
| `lib/design/style-dictionary.mts`, `lib/design/__tests__/style-dictionary.test.ts`                                                                                                                                                                                               | changed           | The breakpoint block of D14.                                                                                                                           |
| `design/kinscape.tokens.json`                                                                                                                                                                                                                                                    | changed           | Ratio `scale.text` (base 16, ratio 1.25, below 2, above 5, round 1). The derived line groups. The 20 roles of [The names](#the-names) with their text. |
| `app/tokens.css`, `design/tokens.generated.ts`                                                                                                                                                                                                                                   | changed           | `npm run tokens` writes them.                                                                                                                          |
| `app/components/foundation/Text.tsx`, `types.ts`, `Text.module.css`                                                                                                                                                                                                              | changed           | The 20 variants. `h1Phone` goes.                                                                                                                       |
| `app/components/actions/Button.module.css`, `TextLink.module.css`, `feedback/Toast.module.css`, `forms/TextField.module.css`, `forms/TextAreaField.module.css`, `features/map/components/SearchBar.module.css`, `features/people/components/FuzzyDateField.module.css`           | changed           | New `--type-*` names. The phone rules go (D16). Each `--type-mono-*` becomes `--type-mono-caption-*` first.                                            |
| `app/components/auth/SignInForm.tsx`, `SignInHero.tsx`, `features/people/components/PeopleList.tsx`, `PeopleLoading.tsx`, `features/map/components/LayerGroup.tsx`                                                                                                               | changed           | New variants. Each `h1` / `h1Phone` choice goes. Each `variant='mono'` becomes `monoCaption`.                                                          |
| `lib/design/states.mts`                                                                                                                                                                                                                                                          | changed           | `OTHERS` holds the new variants.                                                                                                                       |
| `app/components/foundation/__tests__/Text.test.tsx`, `forms/__tests__/TextAreaField.test.tsx`, `features/people/components/__tests__/FuzzyDateField.test.tsx`, `PeopleList.test.tsx`, `PeopleLoading.test.tsx`                                                                   | changed           | New names. The phone rule lines go (D16).                                                                                                              |
| `lib/design/__tests__/type-roles.test.ts`                                                                                                                                                                                                                                        | new               | The role-set test of checks 2 and 4, with each board `class` and `variant`.                                                                            |
| `lib/design/__tests__/design.test.ts`                                                                                                                                                                                                                                            | changed           | Size and line tests for checks 1 and 6. The `line` step test of D15. `SMALL_TYPE` holds the four 10px roles. The snapshot count is 86.                 |
| `e2e/type-scale.spec.ts`                                                                                                                                                                                                                                                         | new               | `/sign-in` at 390px and 1440px: the page title is 31px and 39px (check 5).                                                                             |
| `lib/design/large-text.json`                                                                                                                                                                                                                                                     | changed           | Each screen that now fails at 200% (Spec D7).                                                                                                          |
| `design/topics/foundations.md`, `components.md`, `tokens.md`                                                                                                                                                                                                                     | changed           | The type table, the line-height rule and the names. Scales gets the Spec D4 text.                                                                      |
| `lib/design/system.mts` tests                                                                                                                                                                                                                                                    | changed           | Its token count.                                                                                                                                       |
| `design/canvas/project/Type-scale.dc.html`, `design/source/type-scale.html`, `design/type-scale.jpg`, its `design/DESIGN.md` row, `export.json` and `canvas.json` entries, `lib/design/shots.mts`, `shots.test.ts`, `screens.test.ts`, `scripts/__tests__/design-export.test.ts` | deleted / changed | The local session deletes the board and its records. Both snapshot counts are 86.                                                                      |
| `design/canvas/project/*.dc.html`                                                                                                                                                                                                                                                | changed           | The local session renames the roles ([The board prompt](#the-board-prompt)).                                                                           |
| `.design-system/project/`, `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                                                                                                                                                             | changed           | The design system steps write them.                                                                                                                    |
| `design/source/`, `design/*.jpg`                                                                                                                                                                                                                                                 | changed           | The workflow Design: Render snapshots writes them.                                                                                                     |

## Order of work

1. Write the scales, Style Dictionary, design and role-set tests. See them fail.
2. Add the derived mode and the breakpoint block.
3. Edit the token file. Run `npm run tokens`.
4. Rename `mono` to `mono-caption` in the code. Then rename the other roles. Remove the `h1` choices and the phone rules.
5. Edit the three topic files. Fill `SMALL_TYPE`.
6. Step 2: run `npm run design-system`.
7. Run the checks in AGENTS.md › Commands. Add each new 200% failure to `lib/design/large-text.json`, and name it in the PR.
8. Steps 3 to 5: the tech lead runs them, or a local Claude Code session that the tech lead starts. The session needs a signed-in account. The CI build asks for them in the PR and keeps the PR a draft.
9. The same session deletes `Type-scale.dc.html` and its records, as the deletion rule of `design/CANVAS.md` says.
10. Step 7: the session edits the boards from [The board prompt](#the-board-prompt). It then runs the workflow Design: Render snapshots once.
11. Run `npm run design:check` on the new snapshots. Paste the grep of check 3 in the PR Evidence.

## Risks

- **A wrong `mono` rename merges two roles.** Step 4 and the board prompt rename `mono` first. The design check catches a slip.
- **Larger text overflows a part.** For example, `mono-title` is 20px in the 44px date field. The design check names each screen. A fix goes here if it fits the cap.
- **The phone step on boards.** The exporter reads each `var()` from the computed root style, so a 390px board gets step 700. The `sign-in-phone` design check proves it.
- **The `design` job fails between step 3 and step 10.** The boards still hold old `--type-*` names. The PR stays a draft until step 10.
- **Size.** About 800 lines, over the 660 cap. The PR takes `size: accepted` (Spec D3).

## Proof

| Acceptance check                                   | Proven by                                               |
| -------------------------------------------------- | ------------------------------------------------------- |
| 1. Each size is 16 × 1.25ⁿ, rounded                | `design.test.ts`                                        |
| 2. The `type` group holds the 20 names             | `type-roles.test.ts`                                    |
| 3. No old-only name outside `plans/` and `source/` | `git grep -w` in the PR Evidence                        |
| 4. The role-set test fails an unknown name         | `type-roles.test.ts`                                    |
| 5. The page title is step 700 on a phone, else 800 | `e2e/type-scale.spec.ts`                                |
| 6. Each line height follows the rule               | `design.test.ts`, `scales.test.ts`                      |
| 7. Each screen passes the design check             | `npm run design:check` on the workflow's snapshots      |
| 8. The two boards write `var()` names              | The board diff, and `git grep` in the PR Evidence       |
| 9. Map label sizes do not change                   | The empty `map` group diff                              |
| 10. The SC.7 list is current                       | `e2e/large-text.spec.ts`; the PR names each new entry   |
| 11. `SMALL_TYPE` holds four 10px roles             | `design.test.ts`                                        |
| 12. `Type-scale.dc.html` and its records go        | `screens.test.ts`, `shots.test.ts`, the snapshot counts |
| 13. `tokens.md` › Scales                           | The diff; `npm run words`                               |
| 14. The checks pass                                | CI, and the pasted output                               |
| 15. Steps 2 to 7 are done                          | The commits of steps 2 to 5 and 7, and the workflow run |
| 16. The canvas copy matches `.design-system/`      | The sha256 compare of step 5                            |

## Deviations

- `type-roles.test.ts` reads each board `var(--type-*)` name, `KinScape.Text` variant and retired class after step 7. The CI build left it out because the boards held old names.
- `design.test.ts` and `design-export.test.ts` hold the count 86 after the local session deleted `Type-scale.dc.html`.
- `Spacing-and-controls.dc.html` still says "the Type scale board" in one sentence. The build changes no word of a board (Constraints).
- `lib/design/large-text.json` is unchanged. `e2e/large-text.spec.ts` finds no new failure.
- `e2e/map-desktop.spec.ts` expects the scale bar at 10px: the `credits` role is step 200.
- `PeopleLoading.tsx` no longer calls `usePhone`. Its phone test is gone.
- `TextField.module.css` keeps the `data-size='l'` rule, now with `--type-body-*`.
- `scales.mts` takes the tree as an optional third argument of `stepsOf`, to find the `from` group.
