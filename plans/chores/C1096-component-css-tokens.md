# Plan: C1096: Component CSS uses a token when a token holds that value for that role

- **Chore:** #1096
- **Requirement IDs:** None. The Chore changes a code rule and token use in CSS.
- **Status:** approved

## Approach

Write the token rule once, in the Patterns row "Tokens are the one source" of `docs/architecture.md`. Add one Code smells line in `docs/code-rules.md` that states the rule and links to the row. Change the CSS lines of item 3 from a literal to the token that holds the same value, so the look stays the same. Review enforces the rule, because a value check cannot see the role (Constraint). Six of the components are in `CONTROLS`, so the tech lead runs steps 2 to 6 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). `docs/code-rules.md` is a hand-back path, so the tech lead builds the plan.

### The rule text

The Patterns cell gets these sentences after its current text:

> A size, space, radius, shadow, motion, z or type value in a `.module.css` file uses `var(--token)` when a token holds that value for that role: a 44px hit area is `--size-touch`, a 16px gap is `--space-16`, a mono line height is `--type-mono-line`. A part's own dimension that no token names may stay a literal, such as the 40 × 4 grabber of a sheet. A value that two parts share with no token gets a token in the same Spec, through [Changing the design system](../design/CANVAS.md#changing-the-design-system).

Its _Enforced by_ cell adds "; Review for the token rule".

The Code smells line:

> - Use `var(--token)` in a `.module.css` file when a token holds the value for that role. A part's own dimension may stay a literal. A shared value with no token gets a token: see [Tokens are the one source](architecture.md#patterns).

### The `font-weight` literals

| File and line           | Part                                      | Now   | Change                                                                       |
| ----------------------- | ----------------------------------------- | ----- | ---------------------------------------------------------------------------- |
| `Chip.module.css:15`    | `.chip`, the off state                    | `400` | `var(--type-chip-off-weight)`: the chip-off style holds 400 for an off chip. |
| `Menu.module.css:126`   | `.detail`, caption size and line          | `400` | `var(--type-caption-weight)`: its size and line are the caption style.       |
| `Toast.module.css:32`   | `.action`, label size and line, XS button | `600` | D3                                                                           |
| `Callout.module.css:15` | `.callout strong`, inside small text      | `600` | D4                                                                           |

## Decisions

**D3 · The type style of the Toast action** · Decides: Tech lead

The `.action` rule of `Toast.module.css` sets `--type-label-size` and `--type-label-line` with a literal `font-weight: 600`. The button is 36px tall with 12px padding. `design/DESIGN.md` › Buttons gives an XS button of that size `type.button-s`. Label and button-s both hold 14px, 20px and 600.

- **A.** Write `font-weight: var(--type-label-weight)`. The three values of the rule then name one style. One line changes.
- **B.** Write `font-weight: var(--type-button-s-weight)`. The weight follows `DESIGN.md`, but one rule then mixes two styles. One line changes.
- **C.** Write the three values with the `--type-button-s-` tokens. Three lines change. This breaks the Constraint "Change no component CSS except the lines of item 3".
- **Other:** your own.

**Answer: Other:** - C + lift the Constraint for lines 30 to 32 of Toast.module.css, and change the Files table row to "Lines 30 to 32, as D3 says" (@henetiriki)

**D4 · The bold text of a Callout** · Decides: Tech lead

`.callout strong` sets `font-weight: 600` inside the small style (`--type-small-size`, `--type-small-line`). `--type-small-weight` holds 400. No small style holds 600. `--type-label-weight` holds 600, but for the label style. No other `.module.css` file sets a weight on `strong`.

- **A.** Keep the literal `600`. The plan gives the reason: no token holds 600 for bold small text, and only one part uses the value. No CSS changes.
- **B.** Write `var(--type-label-weight)`. The value is the same, but the token names a different role, against the new rule. One line changes.
- **C.** Add a token for bold small text in `design/tokens.json` and use it. This adds a design system input beyond item 3, and breaks the Constraint "Change no component CSS except the lines of item 3".
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **A Vitest check for literal values.** The Constraint forbids it: a value check cannot see the role.
- **The full rule in both docs.** One fact goes in one file, so `docs/code-rules.md` links to the Patterns row.

## Files that change

| File                                                                                               | New / changed | What                                                          |
| -------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| `docs/architecture.md`                                                                             | changed       | The rule in the "Tokens are the one source" row               |
| `docs/code-rules.md`                                                                               | changed       | One Code smells line                                          |
| `app/components/forms/TextAreaField.module.css`                                                    | changed       | Line 42: `padding: 10px var(--space-12)`                      |
| `app/components/forms/__tests__/TextAreaField.test.tsx`                                            | changed       | Two assertions: `padding: 10px var(--space-12)`               |
| `app/components/actions/KeyHint.module.css`                                                        | changed       | Line 8: `var(--type-mono-line)`; line 9: `2px var(--space-4)` |
| `features/people/components/PersonForm.module.css`                                                 | changed       | Line 43: `column-gap: var(--space-40)`                        |
| `app/components/actions/Chip.module.css`                                                           | changed       | Line 15, as the table says                                    |
| `app/components/overlays/Menu.module.css`                                                          | changed       | Line 126, as the table says                                   |
| `app/components/feedback/Toast.module.css`                                                         | changed       | Lines 31, 32 and 34, as D3 says                               |
| `app/components/feedback/Callout.module.css`                                                       | changed       | Line 15, only if D4 is B                                      |
| `scripts/word-count.mts`                                                                           | changed       | Each budget that the docs go over, to the next multiple of 50 |
| `scripts/__tests__/word-count.test.ts`                                                             | changed       | The pin of each raised budget                                 |
| `design/canvas/project/ds/kinscape/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | Steps 4 and 5                                                 |

## Order of work

The tech lead builds the plan in a local Claude Code session with a signed-in account. The tech lead, or that session, runs steps 3 to 5.

1. Edit the two docs. Run `npm run words`. If a doc goes over its budget, raise it in `scripts/word-count.mts` and its pin in the test.
2. Edit the CSS lines (step 1 of Changing the design system).
3. Run `npm run design-system` (step 2).
4. Run `/publish-design-system` (step 3).
5. Run "Updating the install", 4.1 to 4.6 (step 4).
6. Run "Refreshing the canvas copy", 5.1 to 5.5 (step 5). If 5.4 does not print "No snapshot changed", stop, and list each snapshot that changed. Step 7 then runs.
7. Push the branch. The tech lead runs the workflow Design: Render snapshots (step 6).
8. Run the checks in `AGENTS.md` › Commands.

## Risks

- **A changed look.** Each token holds the same value as its literal, so the look stays the same. Step 5.4 and the render workflow show any snapshot that changes.
- **A cascade from a variable.** A `var()` with a missing token gives the browser default. Each token is in `app/tokens.css` on `main`, and `npm run design:check` compares the screens.

## Proof

| Acceptance check                                                                   | Proven by                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| The Patterns row holds the rule, with type values                                  | Review of `docs/architecture.md`                      |
| Code smells holds the rule in one line                                             | Review of `docs/code-rules.md`                        |
| `TextAreaField`, `KeyHint` and `PersonForm` use the tokens                         | Review of the diff                                    |
| Each `font-weight` literal uses its token, or the plan gives the reason            | The table above, D3 and D4; review of the diff        |
| `npm run words` and `npm test` pass; each raised budget is the next multiple of 50 | The PR Evidence                                       |
| Steps 2 to 6 ran, or 2 to 7                                                        | The step commits on the branch; the workflow run link |
| `canvas/project/ds/kinscape/` matches `.design-system/project/`                    | The report of step 4.6                                |
| `npm run design:export` prints "No snapshot changed"                               | The output of step 5.4 in the PR Evidence             |

## Out of scope

- `TextAreaField` `padding: 9px 11px` in the focus state: no token holds 9px or 11px. It is the padding less the 1px of the focus border.
- `KeyHint` `2px`: no space token holds 2px.
- The `Chip` size and line use the `--type-chip-` tokens with the off weight. Both styles hold the same size and line.
- On a phone, the Toast action uses the body size and line with a 600 weight. Item 3 changes no phone rule.
- Other literal values in components. The rule applies to each line at its next edit.

## Deviations

- The D3 answer names lines 30 to 32 of `Toast.module.css`. The size, weight and line height of `.action` are lines 31, 32 and 34. Line 30 is the font family. The build changes those three lines.
- `TextAreaField.test.tsx` asserts the text `padding: 10px 12px`, so the item 3 change breaks two tests. The build stopped, as the failing-tests rule says. The tech lead chose to list the test and change both assertions to `padding: 10px var(--space-12)`.
- The render workflow (run 44811451216) changed 33 snapshot sources and no image: add-pin-phone, add-pin, map-account-menu-phone, map-account-menu-proposed, map-account-menu, map-credits-narrow-open, map-credits-narrow, map-date-invalid, map-desktop-filters, map-desktop, map-districts, map-empty-date, map-empty-tree, map-loading, map-offline-phone, map-offline, map-pin-count, map-pin-fan, map-pin-popup-failed, map-pin-popup-loading, map-pin-popup, map-sources, people-empty, people-list-no-match, people-list, people-load-failed, person-conflict, person-edit-leave, person-edit, person-errors, person-new, person-save-failed, relationship-save-failed. No board changed, so step 7 has no work.
