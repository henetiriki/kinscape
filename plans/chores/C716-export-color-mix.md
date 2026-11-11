# Plan: C716: Let a canvas board mount Banner and Segmented without failing the design export

- **Spec:** #716
- **Status:** approved

## Approach

Chromium computes `color-mix()` as `color(srgb …)`, which `snapshotProblems` rejects. Add tokens `white-45` and `white-60`. Use them in `.bannerAction` and `.segItem`. A radio with `outline: none` computes black, so `inlineStyles` skips an off-token colour of a `none` outline.

## Decisions

**D1 · Where the fix goes** · Decides: Tech lead

- **A.** `inlineStyles` writes `color(srgb …)` as `rgba()`.
- **B.** `snapshotProblems` reads `color(srgb …)`.
- **C.** Add two alpha tokens for the two CSS files.
- **Other:** your own.

**Answer: C** (@henetiriki)

**D2 · The board that proves the export** · Decides: Tech lead

- **A.** Add `Banner` and a hovered `Segmented` to the e2e board.
- **B.** Also run `design:export` on a local board.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The colour board** · Decides: Tech lead

- **A.** Add both swatches to **Neutrals**, role `overlay`.
- **B.** Put the tokens in a new group.
- **Other:** your own.

**Answer: A** (@henetiriki). Fix a board difference in this PR. Add a Deviations line.

**D4 · The black outline colour** · Decides: Tech lead

- **A.** `inlineStyles` skips it.
- **B.** `.segItem input` takes `color: inherit`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · The new chips on the colour board** · Decides: Tech lead

- **A.** Add them to `EDGED`.
- **B.** Use a dark backing.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

- `design/tokens.json`, `app/tokens.css`, `Toast.module.css`, `Segmented.module.css`.
- `swatches.ts`, `colour/page.tsx`.
- Counts: `swatches.test.ts`, `colour/__tests__/page.test.tsx`, `lib/design/__tests__/system.test.ts`.
- `design-export.mts`, `design-export.test.ts`, `e2e/design-export.spec.mts`.
- `design/screens.json`. Generated: `design/canvas/`.

## Order of work

1. Add the tests. See them fail.
2. Add the tokens. Change the CSS, swatches and `inlineStyles`.
3. Run `npm run design-system`.
4. Tech lead: steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). Both copies match.
5. Design agent: `SG-Colour` swatches.

## Proof

| Acceptance check                        | Proven by                |
| --------------------------------------- | ------------------------ |
| `Banner` and hovered `Segmented` export | `design-export.spec.mts` |
| A test fails without the fix            | `design-export.test.ts`  |

## Deviations

- The render job changed `design/map-districts.jpg` by 19 bytes (`13e6714`). This change did not cause it.
- The `SG-Colour` boards are taller, so `design/screens.json` heights for `style-2-colour` (2765) and `style-2-colour-phone` (4693) changed. `screens.test.ts` requires them.
