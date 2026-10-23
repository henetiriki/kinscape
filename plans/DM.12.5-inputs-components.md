# Plan: DM.12.5: Inputs and actions components

- **Spec:** #184 (Intent #111)
- **Requirement IDs:** NFR-06, NFR-05, EXP-03, MAP-05
- **Status:** approved

## Approach

- **Button:** `size` (`l | m | s | xs` from `size.control-*`; adds `control-xs` = 36, Spec D2), `full`, `icon`, `round`. A union type requires `label` when there are no children. XS gets Chip's centred 44px `::before` (Spec D1).
- **TextField:** `size='l'` and `type`. Password owns the eye toggle; search shows the icon and an `aria-hidden` Key hint. `SelectField` and `TokenField` share its CSS, which hides the native clear button and select arrow.
- **Chip:** `glyph`; `RemovableChip` has a "Remove <value>" button with a 44px hit area.
- **Tabs:** `count` and `controls`; name "<label>, <n> active", badge `aria-hidden`; roving `tabIndex`; arrows select.
- **New:** CheckboxField, Divider, KeyHint, EventGlyph. Alert's `title` becomes optional. Seven icon paths come from board 03's snapshot.
- **Kit page:** `/design-kit/inputs` uses the States board's layout. `searchParams.part` of `'2'` gives part 2, anything else part 1; on a phone CSS shows that part and links the other, a desktop shows both (Spec D3).

## Decisions

**D1 · How an Event glyph draws** · Decides: Tech lead

- **A.** The DESIGN.md character plus U+FE0E (never emoji), sized 12, 14 or 16px, as the board draws it.
- **B.** An SVG per glyph: the same on every OS, but unlike the snapshot.

Answer: A

**D2 · The "/" shortcut** · Decides: Tech lead

- **A.** A `shortcut` prop sets `aria-keyshortcuts` and focuses the field on "/" unless a text input has focus. The kit sets it on one field.
- **B.** Attribute and hint only; screen Specs wire the key.

Answer: A

**D3 · What Enter adds to the token field** · Decides: Tech lead

- **A.** The trimmed text; nothing if it is empty or already there (any case).
- **B.** Whatever was typed.

Answer: A

**D4 · Arrow keys at the last tab** · Decides: Tech lead

- **A.** Wrap to the other end, as the ARIA practices do.
- **B.** Stop.

Answer: A

## Files that change

| File                                                                                   | New / changed | What                                   |
| -------------------------------------------------------------------------------------- | ------------- | -------------------------------------- |
| `design/tokens.json`, `app/tokens.css`                                                 | Changed       | `size.control-xs`                      |
| `app/components/` Button, TextField, Chip, Tabs, Alert, Icon                           | Changed       | New forms                              |
| `app/components/` SelectField, TokenField, CheckboxField, Divider, KeyHint, EventGlyph | New           | Components                             |
| `app/components/__tests__/*`                                                           | New / changed | A test per component                   |
| `app/design-kit/inputs/page.tsx`, `.module.css`, test                                  | New           | Board 06                               |
| `app/design-kit/boards.ts`, `foundations/values.ts`                                    | Changed       | Row after Feedback; 7 icons            |
| `app/design-kit/__tests__/boards.test.ts`                                              | Changed       | Ignore a route's query                 |
| `design/screens.json`                                                                  | Changed       | Board 06 ×3; board 03 at 1248 and 2671 |
| `e2e/inputs.spec.ts`, `e2e/design-kit.spec.ts`                                         | New / changed | Behaviour, sizes, 390px; nav           |

## Order of work

1. Token, icons, EventGlyph, Divider, KeyHint, Alert.
2. Button, Tabs, CheckboxField, TextField, SelectField, Chip, TokenField, each with tests.
3. Kit page, boards, screens.json, e2e; then the AGENTS.md checks, design check and build.

## Deviations

- Button S also gets the 44px hit area; inputs reach over their border.
- `KeyHint` takes `decorative`; the dock hint is not hidden.
- Kit page split into `Board.tsx` and `sections.tsx`.

## Risks

- `searchParams` makes the page render per request; the layout still 404s it in production.
- Fonts draw ✚ and ✱ differently (D1 A); the design check shows it.

## Proof

| Acceptance check            | Proven by                                                          |
| --------------------------- | ------------------------------------------------------------------ |
| Every variant, in order     | Page test of section and row order; design check scores in the PR  |
| Button heights              | e2e: 50, 44, 40, 36                                                |
| Nameless icon-only Button   | `@ts-expect-error` in `Button.test.tsx`; lint runs `tsc`           |
| Password eye                | `TextField.test.tsx`: name and `type`, both ways                   |
| Token field                 | `TokenField.test.tsx`: × removes and focuses the input; Enter adds |
| Tabs                        | `Tabs.test.tsx`: name; Left and Right select                       |
| Checkbox field              | Test: `aria-describedby`; label text toggles                       |
| Untitled Alert              | `Alert.test.tsx`: same role and class                              |
| 44px hit areas              | e2e: `elementFromPoint` 21px from the × and XS centres             |
| 390px                       | e2e: no sideways scroll; targets ≥ 44                              |
| Foundations icons           | Page test: 19 icons; `Icon.test.tsx`: stroke width 2               |
| Tests, e2e, build, coverage | Their output in the PR                                             |
