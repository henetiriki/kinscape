# Plan: C1158: Give each hidden SVG role="img", so the tests query it by role

- **Spec:** #1158
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** draft

## Approach

Add `role='img'` beside `aria-hidden='true'` on the 11 `<svg>` elements of step 1. `aria-hidden` keeps each one out of the accessibility tree, so `getByRole('img', { hidden: true })` finds it and a screen reader hears no change. In the 23 tests of step 2, replace the `querySelector` call with a role query, keep each assertion, and remove the disable. A test reads an attribute with `getAttribute` or `dataset`, which the `no-node-access` rule allows. In `HIDE_MAP` of `e2e/design-check.spec.ts`, add `:not([aria-hidden="true"])`, so the design check still compares each icon (D1 of #1158). A new gallery test reads the accessibility snapshot of two cards that draw icons and finds no `img` node.

Each query keeps the scope of the old line, with one rule:

- If the old line searched a node that has a role (a link, a form, a card, a chip), wrap that node in `within()`.
- If the old line searched `container` or a box span that has no role, use `screen`. The render then holds the same SVGs, because `afterEach(cleanup)` in `vitest.setup.ts` unmounts each render.
- If the old line found an SVG by `data-icon` or `data-event`, keep that attribute in the check. Filter or map the result of `getAllByRole` by it.

## Files that change

| File                                                           | New / changed | What                                                                                                                                 |
| -------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `app/components/foundation/Icon.tsx`                           | changed       | `role='img'` on `Icon` and `FilledIcon`.                                                                                             |
| `app/components/forms/Checkbox.tsx`                            | changed       | `role='img'` on the tick.                                                                                                            |
| `app/components/auth/SignInHero.tsx`                           | changed       | `role='img'` on both drawings.                                                                                                       |
| `features/map/components/DateDock.tsx`                         | changed       | `role='img'` on `Chevron`.                                                                                                           |
| `features/map/components/Legend.tsx`                           | changed       | `role='img'` on the 3 line and halo drawings.                                                                                        |
| `features/map/components/PinFan.tsx`                           | changed       | `role='img'` on the lines drawing.                                                                                                   |
| `lib/ui/EventGlyph.tsx`                                        | changed       | `role='img'` on the glyph.                                                                                                           |
| `app/components/actions/__tests__/ArrowLink.test.tsx`          | changed       | 22, 78: the `data-icon` values of the images `within` the link and the label contain `forward`.                                      |
| `app/components/actions/__tests__/Button.test.tsx`             | changed       | 82: `within(link)` finds an image.                                                                                                   |
| `app/components/actions/__tests__/ChipGroup.test.tsx`          | changed       | 33: each chip holds an image with a `data-event`.                                                                                    |
| `app/components/actions/__tests__/PersonRow.test.tsx`          | changed       | 201: the `data-icon` values of the images `within(edit)` contain `forward`.                                                          |
| `app/components/actions/__tests__/RelationshipRow.test.tsx`    | changed       | 58: as `PersonRow`, `within(link)`.                                                                                                  |
| `app/components/feedback/__tests__/NoticeCard.test.tsx`        | changed       | 63: `within(card()).queryByRole` gives `null`. 80: the image `within(card())` has `width` 28.                                        |
| `app/components/forms/__tests__/SelectField.test.tsx`          | changed       | 52: `screen` finds 2 images.                                                                                                         |
| `app/components/forms/__tests__/TextAreaField.test.tsx`        | changed       | 98: `screen` finds the image.                                                                                                        |
| `app/components/forms/__tests__/TextField.test.tsx`            | changed       | 69, 82, 161: the `data-icon` values of the images contain `error`, `warning` and `search`.                                           |
| `app/components/foundation/__tests__/Icon.test.tsx`            | changed       | 10: `svgOf` becomes `screen.getByRole('img', { hidden: true })`. 52: `getAllByRole` gives the 3 icons in document order.             |
| `app/components/foundation/__tests__/PageHeader.test.tsx`      | changed       | 30: the first image `within(links[0])`.                                                                                              |
| `app/components/overlays/__tests__/PinPopup.test.tsx`          | changed       | 37: the image with `data-event` `residence`.                                                                                         |
| `features/map/components/__tests__/Legend.test.tsx`            | changed       | 22, 36: the images with a `data-event`, in order.                                                                                    |
| `features/map/components/__tests__/PinFan.test.tsx`            | changed       | 42: as `Legend`.                                                                                                                     |
| `features/map/components/__tests__/SearchBar.test.tsx`         | changed       | 18: the `data-icon` values of the images `within(form)` contain `search`.                                                            |
| `lib/ui/__tests__/EventGlyph.test.tsx`                         | changed       | 23, 69: `screen.getByRole('img', { hidden: true })`.                                                                                 |
| `e2e/design-check.spec.ts`                                     | changed       | `HIDE_MAP`: `svg[role="img"]:not([aria-hidden="true"])`.                                                                             |
| `e2e/gallery-looks.spec.ts`                                    | changed       | New test: the `Icon` and `Legend` gallery files hold hidden `svg[role="img"]` nodes, and their `ariaSnapshot()` holds no `img` node. |
| `design/canvas/project/ds/kinscape/`, `canvas.json`, `VERSION` | changed       | Steps 3 to 5 of Changing the design system.                                                                                          |

No test changes what it checks. Each test keeps its name, so the Vitest count stays the same.

## Order of work

1. Add `role='img'` to the 11 SVGs.
2. Rewrite the 23 lines, one test file at a time. Run `npm test` after each file.
3. Change `HIDE_MAP` and add the gallery test.
4. Run `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run words` and `npm test`.
5. Run the steps of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). No board shows a role, so step 7 does not run:
   1. Step 2: run `npm run design-system`. The CI build agent does this step.
   2. Steps 3 to 5: the tech lead, or a local Claude Code session that the tech lead starts, runs them. The session needs a signed-in account. The CI build agent asks for them in the PR, and keeps the PR a draft.
   3. Step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots.
6. Compare each file under `design/canvas/project/ds/kinscape/` with `.design-system/project/` by sha256.

## Risks

- **A wider scope.** `SelectField` 52 and `TextAreaField` 98 searched the box span, and now search the whole render. Today each field draws no SVG outside the box, so the check is the same. A later SVG outside the box makes the check looser. A fix is a test id on the box, which #1159 adds (`SelectField` 50, `TextAreaField` 96).
- **A stricter query.** `getByRole` fails on two matches, but `querySelector` takes the first. The plan uses `getByRole` only where the scope holds one SVG, and `getAllByRole` in all other places. `npm test` shows each mismatch.
- **The design check.** If a snapshot draws a hidden `svg[role="img"]`, `HIDE_MAP` stops a mask on it. On `main`, each of the 44 snapshots in `design/source/` has one `svg[role="img"]`: the map, with no `aria-hidden`.

## Proof

| Acceptance check                                                                          | Proven by                                                                                   |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| The 23 disables of step 2 are gone                                                        | A PR table of file, line and reason text; `git grep` for each reason text                   |
| The 11 SVGs have `role='img'` and `aria-hidden`                                           | A PR table; `SignInHero.test.tsx`, `Icon.test.tsx`, `PinPopup.test.tsx` check `aria-hidden` |
| A gallery test finds no `img` node in the accessibility snapshot of an icon card          | The new test in `e2e/gallery-looks.spec.ts`; it fails if one icon loses `aria-hidden`       |
| `HIDE_MAP` hides no `svg` with `aria-hidden="true"`                                       | The diff of `e2e/design-check.spec.ts`; the CI `design` job                                 |
| `npm run lint`, `npm test` and `npm run design:gallery` pass, with the same count         | Local output and the CI `gallery` job; the Vitest count before and after in the PR          |
| Steps 2 to 6 of Changing the design system are done                                       | The commits of steps 2 to 5; the CI `design` and `gallery` jobs                             |
| Each file under `canvas/project/ds/kinscape/` has the sha256 of `.design-system/project/` | Step 6 of the Order of work                                                                 |

## Out of scope

- The 9 disables that read `path` children or sibling order, which the Constraints keep.
- `SignInHero.test.tsx` 21. An ESLint override of #1153 already covers it.
- The `PinFan.test.tsx` disables at 67, 69, 76 and 80. They read the `line` and `circle` children of the SVG, not the SVG.
- The test ids of #1159.

## Deviations
