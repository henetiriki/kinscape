# Plan: C811: Split board 06 so each part is 7500px or less

- **Spec:** #811
- **Status:** approved

## Approach

`Section` takes a `desktopPart` beside `part`. `page.tsx` reads `?part=` for each width, with part 1 for any other value. The header shows the eyebrow and next-part link of each width, as board 07 does. No frame overlaps, so boards 07 and 08 stay in place.

## Files that change

- `app/design-kit/inputs/*`, `e2e/inputs.spec.ts`.
- `lib/design/check.mts` and its test.
- `design/screens.json`, `design/canvas/export.json`, the Screens table.
- Count 74 → 78: `design.test.ts`, `design-export.test.ts`.

## Order of work

1. Write the tests. See them fail.
2. Measure each built section. If the 7500px rule does not give 3 and 4 parts, stop for the tech lead.
3. Write the code. Run step 2 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). Push.
4. Tech lead: steps 3 to 6, then this prompt, then steps 8 and 9.
5. Set the `screens.json` heights from the JPGs. Run `npm run design:check`. List any other differing section under Deviations.

```text
Do not edit design/source/, the JPGs or boards 07 and 08.
Split SG-Inputs into SG-Inputs, -2 and -3 at x 0, 3400 and 4920.
Split SG-Inputs-phone and -phone-2 into SG-Inputs-phone to -phone-4 at x 1520, 1990, 2460 and 2930.
Give each board its sections from app/design-kit/inputs/, in the old order.
Keep each section byte for byte, except Long text field, Fuzzy date field and Person row.
Redraw those three with the real components and the text of people.tsx.
Remove their "Drawn by hand" notes. On a phone, draw the Person row heading.
Copy each eyebrow and next-part link from page.tsx.
Title each frame as board 07 does. Set its height, 7500 or less, in canvas.json and $preview.
Keep <title>, <x-dc> and data-dc-script. Mount components with <x-import>. Use token colours.
Report each export error with its board name.
```
