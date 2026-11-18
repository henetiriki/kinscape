# Plan: B948: A TextField with a 2px border has a 42px input and no 44px hit area below it on a phone

- **Spec:** #948 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The input of a 2px-border box reaches over that border, as it reaches over the 1px border now. A new rule in `TextField.module.css` gives `.input` `margin-block: -2px` in a box with `:focus-within`, `[data-state='focus']` or `[data-mark]`. The input then fills the 44px box, and its text stays centred, so no look changes. The rule skips `.tokens`, so the `TokenField` keeps its height. The `#948` rows leave `UNDER_44` in `e2e/gallery-looks.spec.ts`, because that test fails while a fixed control stays in the list.

`TextField` is in `CONTROLS`, so the change is a [design system input](../../design/CANVAS.md#changing-the-design-system). No board shows the hit area.

On `main`, `npm run design:gallery -- -g "each control under 44px"` passes, so each `UNDER_44` row still fails: the Bug reproduces.

## Decisions

**D1 · Which sibling Bugs this fix closes** · Decides: Tech lead

`DateField` renders `TextField`, and `FuzzyDateField` composes `.box` and `.input` from `TextField.module.css`. So the new rule also fixes #949 (DateField, 11 rows) and #950 (FuzzyDateField, 3 rows). Their rows must leave `UNDER_44` too, or the gallery test fails. #951 (SelectField, 2 rows) has the same cause on `.select`, which the rule does not touch. #949, #950 and #951 are `status: ready-for-dev`.

- **A.** Fix `.input` only. Remove the `#948`, `#949` and `#950` rows. The PR body closes #948, #949 and #950. #951 stays open. Cost: about 6 lines of CSS.
- **B.** As A, and the rule also covers `.select`, with the pressed (`[data-state='active']`) select box. Remove the `#951` rows too, and close #951. Cost: about 2 more lines of CSS and one more unit check.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Alternatives considered

- **Fix TextField alone.** `DateField` renders `TextField`, so no rule in `TextField.module.css` can fix TextField and leave DateField as it is.
- **A 44px `::before` on the box**, as `TextLink` has. The input fills the box already, so the margin is the smaller change.

## Files that change

| File                                                  | New / changed | What                                                         |
| ----------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `app/components/forms/TextField.module.css`           | changed       | The 2px-border rule (D1); the `.input` comment names 2px too |
| `app/components/forms/__tests__/TextField.test.tsx`   | changed       | The CSS gives the 2px-border rule, and skips `.tokens`       |
| `e2e/gallery-looks.spec.ts`                           | changed       | Remove the `UNDER_44` rows that D1 names                     |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Design system steps 4 and 5                                  |

## Order of work

1. Write the unit test. See it fail on the missing 2px-border rule.
2. Remove the `UNDER_44` rows that D1 names. Run `npm run design:gallery -- -g "each control under 44px"`. See it fail on those rows.
3. Change `TextField.module.css` as D1 says. Run the unit tests and the gallery test again.
4. Run the checks in `AGENTS.md` › Commands, `npm run design:gallery` and `npm run design:check`.
5. Design system steps 2 to 6. The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 and step 6. The session needs a signed-in account. Step 7 does not apply. The PR stays a draft until then.

## Risks

- **A row still fails.** A sibling row can fail for a second cause. Then the build keeps that row, names it in the PR and leaves its Bug open.
- **Snapshots.** The text must not move. `npm run design:check` shows any change. If a blocking snapshot changes, the build stops for the tech lead.

## Proof

| Acceptance check                                                                           | Proven by                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| A point 21px above and below the centre of a focus, error or warning input is on the input | `e2e/gallery-looks.spec.ts` "keeps a 44px hit area", with the `#948` rows gone |
| The CSS gives the 2px-border rule and skips the token field                                | `TextField.test.tsx`                                                           |
| The look of each TextField state does not change                                           | `npm run design:check`; the TextField card images in the gallery job           |

## Out of scope

- The `TokenField` height with a 2px border.
- The `#988` DateDock rows.
