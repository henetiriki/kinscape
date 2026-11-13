# Plan: C811: Split board 06 so each part is 7500px or less

- **Spec:** #811
- **Status:** approved

## Approach

`Section` takes a `desktopPart` beside `part`. `page.tsx` reads `?part=` for each width. The header shows the eyebrow and next-part link of each width.

## Decisions

**D4 · Desktop parts** · Decides: Tech lead

The 7500px rule gives 2, not the 3 of D2.

- **A.** Use 2 desktop parts and 4 phone parts.

**Answer: A** (Tech lead)

**D5 · Phone order** · Decides: Tech lead

The old phone order does not hold.

- **A.** Accept the new order.

**Answer: A** (Tech lead)

## Deviations

- Measured with `e2e/inputs.spec.ts`: each part is 7500px or less. Desktop part 1 holds Buttons to Key hints. Desktop part 2 holds Page header to Person row.
- Phone parts: 1 Buttons, Text fields · 2 Chips, Button as a link, Long text field · 3 Tabs to Key hints · 4 Page header, Back link, Action bar, Fuzzy date field, Person row. Each part draws in app order (D5).
- `?part=2` shows desktop part 2. `?part=3` and `?part=4` show desktop part 1.
- `screens.json` heights come from the JPGs: 7285 and 6892 on a desktop, 5789, 5893, 6122 and 5979 on a phone.
- The design agent first linked each board to the route of `page.tsx`. A snapshot link must be a board file, as on board 07, so the agent changed the 6 links.
- The render workflow re-rendered `design/map-desktop.jpg`: 24 bytes larger. Nothing else changed in it.

## Files that change

- `app/design-kit/inputs/*`, `e2e/inputs.spec.ts`.
- `lib/design/check.mts` and its test.
- `design/screens.json`, `design/canvas/export.json`, the Screens table.
- Count 74 → 77: `design.test.ts`, `design-export.test.ts`.

## Order of work

1. Write the tests. See them fail.
2. Measure each built section. If the 7500px rule does not give 2 and 4 parts, stop.
3. Write the code. Run step 2 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). Push.
4. Tech lead: steps 3 to 6, this prompt, steps 8 and 9.
5. Set the `screens.json` heights from the JPGs. Run `npm run design:check`. List any other differing section under Deviations.

```text
Do not edit design/source/, the JPGs or boards 07 and 08.
Split SG-Inputs into SG-Inputs and SG-Inputs-2 at x 0 and 3400.
Split SG-Inputs-phone and -phone-2 into SG-Inputs-phone to -phone-4 at x 1520, 1990, 2460 and 2930.
Give each board its sections from app/design-kit/inputs/, in the old order.
Keep each section byte for byte, except Long text field, Fuzzy date field and Person row.
Redraw those three with the real components and the text of people.tsx.
Remove their "Drawn by hand" notes. On a phone, draw the Person row heading.
Copy each eyebrow and next-part link from page.tsx.
Title each frame as board 07 does. Set its height to 7500 or less.
Follow the exporter rules.
```
