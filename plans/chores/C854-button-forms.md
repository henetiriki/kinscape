# Plan: C854: Add a button form of TextLink and a raised IconButton

- **Spec:** #854
- **Status:** draft

## Approach

With `onClick` and no `href`, `TextLink` renders a `<button type="button">` with the `.textLink` class. A `.textLink:where(button)` rule removes the button's background, border and padding, and keeps the text at the left. `IconButton` gets `variant?: 'raised'` (`data-variant`): `--size-field-l`, `--radius-panel`, `--shadow-raised`, no border. It keeps the `.iconBtn` state rules. `LayersButton` renders the raised `IconButton`.

## Decisions

**D2 · How DateField and the kit place the button form** · Decides: Tech lead

`TextLink` takes no `className`, but the callers need `align-self` and the phone fix's `display` rules.

- **A.** The caller wraps the `TextLink` in a `span` with `display: flex` and those rules.
- **B.** `TextLink` takes a `className`. Its design system props change.
- **Other:** your own.

Recommended: A, because the props stay closed and a flex `span` adds no height.

**D3 · `LayersButton.module.css`** · Decides: Tech lead

The variant holds its whole look.

- **A.** Delete the file.
- **B.** Keep its size rules there, and leave them out of the variant.
- **Other:** your own.

Recommended: A, because a module with no rules is dead code.

## Files that change

| File                                                           | New / changed | What                     |
| -------------------------------------------------------------- | ------------- | ------------------------ |
| `TextLink`, `IconButton`: each file, module and test           | Changed       | The two forms            |
| `DateField`, `surfaces/sections.tsx`: each file and module     | Changed       | Use the button form (D2) |
| `LayersButton.tsx`, `MapControls.test.tsx`                     | Changed       | Use the raised variant   |
| `LayersButton.module.css`                                      | Deleted (D3)  | No rule remains          |
| `states/page.tsx`, `lib/design/states.mts`, `design/DESIGN.md` | Changed       | Add the forms            |
| `design/screens.json`, `hover.test.ts`, the tests that count   | Changed       | Heights and counts       |
| The boards of step 3                                           | Changed       | Swaps and the new row    |

## Order of work

1. Write the tests of the two forms, and see them fail. Build the forms and use them.
2. Run steps 2 to 9 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 and 8.
3. In step 7, the design agent does these tasks:
   - It swaps the eight boards that the Chore lists.
   - It draws the row "Raised icon button" by hand on `SG-Controls` and `SG-Controls-phone`, as each row there is drawn.
4. File one follow-up issue for the drawings that the design agent left.

## Risks

- `.iconBtn` has `position: relative`, so the Layers button paints later. `npm run design:check` shows a shadow change.
- A `<button>` has its own font and text rules. `npm run design:check` on the Feedback and Surfaces boards shows a change.

## Proof

| Acceptance check         | Proven by                                      |
| ------------------------ | ---------------------------------------------- |
| Callers use the forms    | Their tests; `git grep` in Evidence            |
| The kit row              | `states/__tests__/page.test.tsx`; design:check |
| Coverage and boards      | `npm test`; `npm run design:check`             |
| Design system and export | Step 4.6; `npm run design:export`              |
| The follow-up issue      | Its link under `## Deviations`                 |
