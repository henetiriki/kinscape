# Plan: B1063: A checked Checkbox shows no tick in a design snapshot

- **Spec:** #1063
- **Requirement IDs:** None (design only). Must not break: [NFR-06](../../docs/requirements.md#nfr-06), [PPL-01](../../docs/requirements.md#ppl-01), [MAP-05](../../docs/requirements.md#map-05).
- **Status:** approved

## Approach

`Checkbox` renders a `<span>` wrapper that holds the `<input>` and an inline `<svg aria-hidden="true">` tick. The wrapper is a one-cell grid, and both children sit in that cell, centred. The tick is 14 × 14px, with `viewBox="0 0 24 24"`, the path `M5 12.5l4.5 4.5L19 7.5`, stroke width 3.2 and round caps and joins. These are the values of the mask on `main`, so the tick keeps its place and size. The tick takes `stroke="currentColor"`, and `Checkbox.module.css` sets its `color` to `var(--white)`. The snapshot then holds `rgb(255, 255, 255)`, which the snapshot check reads.

`.checkbox::after` and its `mask: url()` go. The rule `.checkbox:not(:checked) + .tick` sets `visibility: hidden`, and Playwright reads that as hidden (check 2). The tick has `pointer-events: none`, so a click on the box reaches the `<input>`. The `<input>` keeps its class, its `::before` hit area and each state rule, so the role, the name, the keys and the fill do not change (check 3). `Checkbox` passes each prop to the `<input>`, as on `main`.

The wrapper takes `flex: none`. The rule `.row > input` of `CheckboxField.module.css` goes, because the `<input>` is no longer a child of the row.

`snapshotProblems` and `inlinePseudoStyles` do not change. `inlineStyles` writes the tick's styles on its `style`, because no rule of the tick has a pseudo-element.

`Checkbox` is in `CONTROLS`, so [Changing the design system](../../design/CANVAS.md#changing-the-design-system) applies. The export e2e reads `design/canvas/project/ds/kinscape/`, so check 4 passes only after step 5. No board changes: `Person-new`, `Sign-in-proposed` and `Sign-in-phone-default-proposed` already mount `KinScape.CheckboxField`. Step 7 has no board to swap.

## Alternatives considered

- **The snapshot check reads a `data:` mask.** The tech lead chose the `<svg>` in the Bug, and #1055 needs the check as it is.
- **A `tick` path in `Icon`.** `Icon` draws a stroke of width 2, and a new path changes `Icon-1440.png`. #921 keeps that card as it is.

## Files that change

| File                                                                                      | New / changed | What                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/forms/Checkbox.tsx`                                                       | changed       | The wrapper, the `<input>` and the `<svg>` tick                                                                                          |
| `app/components/forms/Checkbox.module.css`                                                | changed       | `.box` and `.tick`; no `.checkbox::after` and no `url(`                                                                                  |
| `app/components/forms/CheckboxField.module.css`                                           | changed       | No `.row > input` rule                                                                                                                   |
| `app/components/forms/__tests__/Checkbox.test.tsx`                                        | changed       | Check 1                                                                                                                                  |
| `app/components/forms/__tests__/CheckboxField.test.tsx`                                   | changed       | "draws a 44 row with size m" and "draws the plain sign-in form" read the row with `closest('[data-size]')` and `closest('[data-plain]')` |
| `e2e/gallery-looks.spec.ts`                                                               | changed       | Check 2, on "Checkbox on · default" and "Checkbox off · default"                                                                         |
| `e2e/design-export.spec.mts`                                                              | changed       | Check 4: a board that mounts a checked `KinScape.Checkbox`                                                                               |
| `design/canvas/VERSION`, `design/canvas/project/ds/`, `design/canvas/project/canvas.json` | changed       | Design system steps 3 to 5                                                                                                               |
| `design/source/*.html`, `design/*.jpg`, `design/cards/*.png`                              | changed       | The render of step 6                                                                                                                     |
| `plans/bugs/B1063-checkbox-tick.md`                                                       | new           | This plan                                                                                                                                |

The two `CheckboxField` tests change because the parent of the `<input>` is now the wrapper ([failing-tests rule](README.md#failing-tests)).

## Order of work

1. Write the test of check 1. See it fail on the missing `<svg>`, and paste the failing line in the PR.
2. Change `Checkbox.tsx`, `Checkbox.module.css` and `CheckboxField.module.css`. Change the two `CheckboxField` tests.
3. Write the gallery test of check 2 and the export board of check 4. The export board passes only after step 5.
4. Run `npm run design-system` (design step 2). Run the gallery test of check 2.
5. A local Claude Code session that the tech lead starts, with a signed-in account, runs design steps 3 to 5:
   - `/publish-design-system`;
   - "Updating the install" (4.1 to 4.7);
   - "Refreshing the canvas copy" (5.1 to 5.5).

   It posts the sha256 pairs of `ds/kinscape/` (check 8) in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.

6. The tech lead runs Design: Render snapshots on the branch (design step 6).
7. Compare each JPG and card image with `origin/main` (checks 5 to 7):
   - Use `cmp` on each file.
   - For each file that differs, post the box of `changedPixels` in `lib/design/check.mts`.
   - In each of the seven snapshots, find the tick `<svg>` after the checked `<input>`.
   - For each visible difference of the tick, ask the tech lead to decide.
8. Run the [Commands](../../AGENTS.md#commands) checks. Do the ready check. Write the PR body.

## Risks

- **The tick takes a click.** Then Playwright fails a click on a checkbox with "intercepts pointer events". `pointer-events: none` on the tick stops this. The smoke and navigation e2e tests click checkboxes, so they prove it.
- **The stroke differs from the mask by anti-aliasing.** Then the three card images and the seven JPGs differ at the edge of the tick. Check 7 lists each one, and the tech lead decides (Expected per).
- **The `LayersPanel` box moves.** The wrapper is an inline grid in the `.checkbox` span, so the line box can change its height. Then the box moves down by a pixel or two. No snapshot holds a `LayersPanel`, so step 7 cannot show it. Compare the box of "Polity borders" on `/` before and after the change with `boundingBox()`, and post both in the PR.

## Proof

| Acceptance check                                         | Proven by                                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1. An `<input>` and an `<svg aria-hidden>`; no `url(`    | `Checkbox.test.tsx`; `git grep "url(" app/components/forms/Checkbox.module.css` has no match               |
| 2. The tick shows only when checked                      | `e2e/gallery-looks.spec.ts`                                                                                |
| 3. Role, name, Space key and 44px hit area               | `Checkbox.test.tsx`, `CheckboxField.test.tsx`; `gallery-looks.spec.ts` hit area; `date-dock.spec.ts` Space |
| 4. `snapshotProblems` empty; the snapshot holds the tick | `e2e/design-export.spec.mts` in `npm run e2e`                                                              |
| 5. The seven snapshots and JPGs draw the tick            | Step 7: the `<svg>` in each `source/` file; each JPG beside `Checkbox-1440.png`                            |
| 6. Only the seven JPGs differ, or the PR names them      | `cmp` and the boxes of step 7                                                                              |
| 7. The three card images                                 | `cmp` and the boxes of step 7                                                                              |
| 8. Same sha256 under `ds/kinscape/`                      | The 5.2 pairs in the PR                                                                                    |
| 9. Test, typecheck, lint, coverage                       | The outputs in the PR                                                                                      |
| Must not break: NFR-06                                   | Check 3; the "Deceased" box still fills (`design.spec.ts` "the checkbox uses the brand colour")            |
| Must not break: PPL-01 "Deceased"                        | The `PersonForm` tests                                                                                     |
| Must not break: MAP-05 layer rows                        | `LayerGroup` and `LayersPanel` tests; `e2e/navigation.spec.ts` toggles                                     |
| Must not break: #469 React 18 and 19                     | `react-18.test.tsx` "Checkbox and CheckboxField tick"                                                      |
| Must not break: #921 other cards                         | `cmp` in step 7                                                                                            |
| Must not break: #1055 exporter                           | `git diff origin/main -- scripts/design-export.mts` is empty                                               |
| Must not break: `design.spec.ts` brand colour            | `npm run e2e`                                                                                              |

## Out of scope

- A change to `snapshotProblems` or the exporter.
- A change to any board.

## Deviations

- `features/map/components/__tests__/LayerGroup.test.tsx` also read the row with `parentElement`. It now uses `closest('[data-size]')`, for the same reason as the two `CheckboxField` tests.
