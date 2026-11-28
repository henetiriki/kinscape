# Plan: SC.13: Spacing follows the chosen scale, and controls take their height from text and spacing

- **Spec:** #1207
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The CI build changes the code. `scale.space` takes the hybrid mode, and each `space` name refers to its new step. Three new `size` tokens hold the parts of the small, medium and large control (D11). `npm run tokens` writes each one as a `calc()`. The ten mapped `size` tokens refer to them (Spec D5). Each control under 44px gets a hit area (D12). A local session then runs steps 3 to 5 and 7. It deletes the Spacing and controls board and changes the two loading rows on `Map-add-pin.dc.html` (Spec D7).

### The steps

| Name                                     | Before → after step | Value |
| ---------------------------------------- | ------------------- | ----- |
| `2xs`, `xs`, `s`, `m` (each role)        | 100–400, same       | 4–16  |
| `inset-l`, `gap-l`, `inset-xl`, `gap-xl` | 500, 600 → 500      | 24    |
| `inset-2xl`, `gap-2xl`                   | 700 → 600           | 32    |
| `inset-3xl`, `gap-3xl`, `inset-4xl`      | 800, 900 → 700      | 44    |
| `inset-5xl`                              | 1000 → 800          | 64    |

### The controls

| Token                 | Parts                                                  | 16px root |
| --------------------- | ------------------------------------------------------ | --------- |
| `size.control-small`  | `type.control-small.line`, `space.inset.2xs`, hairline | 30px      |
| `size.control-medium` | `type.control.line`, `space.inset.xs`, hairline        | 42px      |
| `size.control-large`  | `type.control.line`, `space.inset.s`, hairline         | 50px      |

The CSS is `calc(<line> + 2 * <inset> + 2 * var(--border-hairline))`, with `var()` names. `control` and `field` refer to medium. `control-l`, `field-l` and `search` refer to large. `control-s`, `control-xs`, `chip` and `chip-s` refer to small.

### The CSS changes

- `Button`: the `::before` hit area covers each size except `l`.
- `IconButton`, the `Toast` button: a `::before` hit area, as `Chip` has.
- `TextField`, `SelectField`, `FuzzyDateField`: the box is a `<label>` with a 44px `::before` behind its content (D12 B). The password input takes `aria-label`, so the eye button does not add to its name. A token field takes the same rule, so its box is 42px.
- `ZoomControls`, `DateDock`, `JumpTo`: each hit area stays clear of its neighbour (check 5).
- `SearchBar` input: `min-height: var(--size-touch)`.
- `TextAreaField`: block padding `var(--space-inset-xs)`. In focus and error, each padding is less by `border.emphasis` − `border.hairline` (Spec D8).
- `LoadingField`: one bar is `var(--size-field)`. Two bars are `calc(2 * var(--type-body-line) + 2 * var(--space-inset-xs) + 2 * var(--border-hairline))`.

## Decisions

**D11 · The DTCG shape of a control size** · Decides: Tech lead

DTCG 2025.10 has no expression type. `cssText` writes a `dimension` only from `{ value, unit }`.

- **A.** Each control size is a `dimension` token. `$extensions.kinscape.control` holds three references: `line`, `inset` and `border`. `npm run tokens` writes its `$value` as the px sum at a 16px root, as it writes a scale step. It writes the CSS as the `calc()`. A test fails a stale `$value`. Cost: a new module of about 60 lines and its test. `sizePx` holds the 16px value, and the size check passes a literal `42px`.
- **B.** The `$value` is the string `calc({type.control.line} + 2 * {space.inset.xs} + 2 * {border.hairline})`. Cost: the file breaks DTCG 2025.10 (#1188 D1). `cssText`, `dtcgProblems`, the design system and the size check each need a string branch. No `sizePx` number.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D12 · The 44px hit area of a field input** · Decides: Tech lead

A text `input` has no `::before`. The input already reaches over the box border by 1px or 2px.

- **A.** The input and the select reach one more pixel past the box: `margin-block` is −2px with a 1px border and −3px with a 2px border. The input is 44px in a 42px box, and it grows with the box at 200% text. Cost: two margin values, and the input overlaps 1px outside the box. Its background is transparent, so no pixel changes.
- **B.** A `<label>` wraps the box, and the box takes a `::before` hit area. Cost: new markup in `TextField`, `TextAreaField`, `FuzzyDateField`, `PersonField` and `DateField`, and their tests.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- The formula in the CSS formatter only: it breaks Spec D3, which puts the parts in the token file.
- A new top-level `control` group: it adds a group to `tokens.md` › The source and to the design system groups, for three tokens.

## Files that change

| File                                                                                                                                                                                                                                                                                                                                                     | New / changed     | What                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/control-sizes.mts`, `lib/design/types.ts`                                                                                                                                                                                                                                                                                                    | new / changed     | The parts, the 16px `$value` and the `calc()` text (D11).                                                                                                                                                                                           |
| `lib/design/__tests__/control-sizes.test.ts`                                                                                                                                                                                                                                                                                                             | new               | The sum, the `calc()`, a stale `$value`, a reference to no token.                                                                                                                                                                                   |
| `scripts/tokens.mts`, `lib/design/style-dictionary.mts`, `lib/design/__tests__/style-dictionary.test.ts`                                                                                                                                                                                                                                                 | changed           | `read` writes the control sizes after the steps. The CSS writes the `calc()`.                                                                                                                                                                       |
| `design/kinscape.tokens.json`                                                                                                                                                                                                                                                                                                                            | changed           | Hybrid `scale.space`. The `space` references of [The steps](#the-steps). The three control sizes and the ten references.                                                                                                                            |
| `app/tokens.css`, `design/tokens.generated.ts`                                                                                                                                                                                                                                                                                                           | changed           | `npm run tokens` writes them.                                                                                                                                                                                                                       |
| `lib/design/__tests__/design.test.ts`                                                                                                                                                                                                                                                                                                                    | changed           | Checks 1 to 4: the steps, the nearest step with its tie rule, each control-size `calc()`, a stale `$value`. The snapshot count is 85.                                                                                                               |
| `app/components/forms/TextField.tsx`, `SelectField.tsx`, `features/people/components/FuzzyDateField.tsx`, `app/components/forms/__tests__/TextField.test.tsx`, `features/map/components/__tests__/FilterFields.test.tsx`                                                                                                                                 | changed           | D12 B: the label box. The tests check it. The order test reads `label[for]`.                                                                                                                                                                        |
| `features/map/components/ZoomControls.module.css`, `DateDock.module.css`, `JumpTo.module.css`                                                                                                                                                                                                                                                            | changed           | Check 5: the hit areas.                                                                                                                                                                                                                             |
| `e2e/map-phone.spec.ts`, `e2e/map-points.ts`                                                                                                                                                                                                                                                                                                             | changed           | The phone controls are at least 42px and the Layers button is 50px. The select box is the parent of the select.                                                                                                                                     |
| `app/components/actions/Button.module.css`, `IconButton.module.css`, `feedback/Toast.module.css`, `forms/TextField.module.css`, `forms/TextAreaField.module.css`, `feedback/LoadingField.module.css`, `features/map/components/SearchBar.module.css`                                                                                                     | changed           | [The CSS changes](#the-css-changes).                                                                                                                                                                                                                |
| `app/components/feedback/LoadingField.tsx`, `features/map/components/Panel.module.css`, `app/components/actions/Chip.module.css`                                                                                                                                                                                                                         | changed           | Comments that give old heights.                                                                                                                                                                                                                     |
| `lib/design/off-token-sizes.json`                                                                                                                                                                                                                                                                                                                        | changed           | The `LoadingField` 68px entry and the `TextAreaField` 10px, 9px and 11px padding entries go.                                                                                                                                                        |
| `app/components/forms/__tests__/TextAreaField.test.tsx`                                                                                                                                                                                                                                                                                                  | changed           | The new padding names.                                                                                                                                                                                                                              |
| `e2e/gallery-looks.spec.ts`                                                                                                                                                                                                                                                                                                                              | changed           | Button 50 / 42 / 30 / 30. AddPinButton, SelectField and Clear filters 42. NoticeCard 30. The chip test of check 6. New tests: a two-row text area is 66px, the loading rows match the fields (check 8), and a medium Button at 200% text (check 9). |
| `lib/design/large-text.json`                                                                                                                                                                                                                                                                                                                             | changed           | Each screen that now fails or passes at 200%.                                                                                                                                                                                                       |
| `lib/design/__tests__/system.test.ts`                                                                                                                                                                                                                                                                                                                    | changed           | Its token count.                                                                                                                                                                                                                                    |
| `design/topics/foundations.md`, `components.md`, `feedback.md`, `tokens.md`                                                                                                                                                                                                                                                                              | changed           | New heights and steps. Touch gives the rule. Scales gets the Spec D9 sentence.                                                                                                                                                                      |
| `design/canvas/project/Spacing-and-controls.dc.html`, `design/source/spacing-and-controls.html`, `design/spacing-and-controls.jpg`, its `design/DESIGN.md` row, `export.json` and `canvas.json` entries, `lib/design/shots.mts`, `lib/design/__tests__/shots.test.ts`, `lib/design/__tests__/screens.test.ts`, `scripts/__tests__/design-export.test.ts` | deleted / changed | The local session deletes the board and its records. Both snapshot counts are 85.                                                                                                                                                                   |
| `design/canvas/project/Map-add-pin.dc.html`, `design/canvas/project/Map-phone-states.dc.html`                                                                                                                                                                                                                                                            | changed           | The two loading-row heights of Spec D7.                                                                                                                                                                                                             |
| `.design-system/project/`, `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                                                                                                                                                                                                                                     | changed           | The design system steps write them.                                                                                                                                                                                                                 |
| `design/source/`, `design/*.jpg`, `design/cards/`                                                                                                                                                                                                                                                                                                        | changed           | The workflow Design: Render snapshots writes them.                                                                                                                                                                                                  |

## Order of work

1. Write the control-size, Style Dictionary and design tests. See them fail.
2. Add `control-sizes.mts`. Connect it to `read` and the CSS format.
3. Edit the token file. Run `npm run tokens`.
4. Make [The CSS changes](#the-css-changes). Change the tests that pin old heights. Add the new gallery tests.
5. Edit the four topic files.
6. Step 2: run `npm run design-system`.
7. Run the checks in AGENTS.md › Commands. Update `lib/design/large-text.json`, and name each change in the PR.
8. Steps 3 to 5: the tech lead runs them, or a local Claude Code session that the tech lead starts. The session needs a signed-in account. The CI build asks for them in the PR and keeps the PR a draft.
9. The same session deletes `Spacing-and-controls.dc.html` and its records, as the deletion rule of `design/CANVAS.md` says.
10. Step 7: the session changes the two loading rows on `Map-add-pin.dc.html` (Spec D7). It then runs the workflow Design: Render snapshots once.
11. Run `npm run design:check` on the new snapshots. Paste the grep of check 14 in the PR Evidence.

## Risks

- **The export of a `calc()` size.** No local run proves it (Spec, Flagged concerns). The workflow run in step 10 and the design check prove it.
- **A fixed offset no longer fits.** Map furniture at a `layout.*` offset can overlap a shorter control. The design check names each screen. A fix goes here if it fits the cap.
- **Size.** The Spec measures about 650 lines against the 660 cap. If the diff passes the cap, the build stops and asks the tech lead to split ([too-big rule](BUILD.md#too-big)).
- **Word budgets.** `tokens.md` has 13 words left (Spec D9). The build trims other text in the file to fit the sentence.
- **The `design` job fails between steps 3 and 10.** The board still draws the old loading rows. The PR stays a draft until step 10.

## Proof

| Acceptance check                                      | Proven by                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| 1. `scale.space` steps                                | `design.test.ts`                                             |
| 2. Each `space` name takes the nearest step           | `design.test.ts`                                             |
| 3. Each control-size height                           | `control-sizes.test.ts`, `design.test.ts`                    |
| 4. Each mapped `size` token is its `calc()`           | `design.test.ts`                                             |
| 5. Each tap area at 390px, `UNDER_44` empty           | `gallery-looks.spec.ts`                                      |
| 6. Phone chip 44px, removable chip and × 30px         | `gallery-looks.spec.ts`                                      |
| 7. A two-row text area is 66px                        | `gallery-looks.spec.ts`                                      |
| 8. No field moves when the Persons arrive             | `gallery-looks.spec.ts`; the `pin-edit-loading` design check |
| 9. A medium control at 200%                           | `gallery-looks.spec.ts`                                      |
| 10. The 200% list                                     | `e2e/large-text.spec.ts`; the PR names each change           |
| 11. Each screen passes the design check               | `npm run design:check` on the workflow's snapshots           |
| 12. The board and its records go                      | `screens.test.ts`, the snapshot counts                       |
| 13. `shots.mts` has no `spacing-and-controls`         | `shots.test.ts`                                              |
| 14. No old height or spacing value in the topic files | `git grep` in the PR Evidence                                |
| 15. The checks pass                                   | CI, and the pasted output                                    |
| 16. Steps 2 to 7 are done                             | The commits of steps 2 to 5 and 7, and the workflow run      |
| 17. The canvas copy matches `.design-system/`         | The sha256 compare of step 5                                 |

## Out of scope

- The layout fixes at 200% text and the shared sizes on the SC.2 list: SC.13.1 (#1211).
- Rounding and borders: SC.14 (#1208).

## Deviations

- D12 B is built. The `<label>` box covers the text field, the select and the date field. `TextAreaField` and `TokenField` keep their boxes: each is 44px or taller where it has an input.
- Check 5 holds: `UNDER_44` is empty. The date row of the phone sheet starts 4px lower, so the grabber's hit area stays off the field. `npm run design:check` named only `map-account-menu-phone`: see the `Map-phone-states.dc.html` line.
- Acceptance check 5 asks for a 44px hit area. The `ZoomControls` buttons are 1px apart, so each hit area is 43px: its button and the gap below. The test point of the check lies in that gap. A 44px area would overlap its neighbour. The tech lead accepted 43px.
- `JumpTo` rows wrap 16px apart, not 8px, so the 44px hit areas of the epoch buttons do not overlap.
- The local-session steps are done: design system steps 2 to 5 and 7, the board deletion and the `Map-add-pin.dc.html` rows. The date row of the phone sheet follows its move through the published bundle.
- `size` in `lib/design/system.mts` uses resolved values: the design system does not allow an alias outside `color`.
- `lib/design/large-text.json` needs no change: the 200% run gives the same list.
- `Toast.module.css` hit area is `min-width: 100%` with a 44px width. A `calc(100% + 2px)` is an off-token size.
- `Map-phone-states.dc.html` draws the account menu 74px from the top, from the pill (16), the search height (50) and the menu offset (8). The 52px pill put it at 76px. The tech lead allowed this edit after `design:check` named `map-account-menu-phone`.
- The error callout of the phone sheet lifts 52px, not 48px, so it stays 12px above the sheet after the date row moves 4px down (`map-phone.spec.ts`).
