# Plan: C716: Let a canvas board mount Banner and Segmented without failing the design export

- **Spec:** #716
- **Status:** draft

## Approach

Chromium computes `color-mix()` as `color(srgb …)`, which `snapshotProblems` rejects. Add tokens `white-45` and `white-60` (`rgb(255 255 255 / a)`). Use them in `.bannerAction` and the two `.segItem` hover rules. The colour is the same. Chromium computes `rgba(255, 255, 255, 0.6)`, which the check reads as `white`. The export script does not change.

The tech lead, or a local session they start, runs steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system).

## Decisions

**D1 · Where the fix goes** · Decides: Tech lead

**Answer: C** (@henetiriki). Two alpha tokens.

**D2 · The board that proves the export** · Decides: Tech lead

**Answer: A** (@henetiriki). Add `Banner` and a hovered `Segmented` to the board in `e2e/design-export.spec.mts`.

**D3 · The colour board** · Decides: Tech lead

A test fails if a `colour` token has no swatch. Two swatches make `/design-kit/colour` differ from its snapshot.

- **A.** Add both swatches to **Neutrals**, role `overlay`.
- **B.** Put the tokens in a new group. No swatch needed.
- **Other:** your own.

**Answer: A** (@henetiriki). Fix a board difference in this PR, with a line under `## Deviations`.

## Files that change

- `design/tokens.json`, `app/tokens.css`: the tokens and their notes.
- `Toast.module.css`, `Segmented.module.css`: use the tokens.
- `swatches.ts` and `swatches.test.ts`: two swatches and the count.
- `design-export.test.ts`, `e2e/design-export.spec.mts`: the tests.
- `.design-system/`, `design/canvas/`: generated.

## Order of work

1. Add the tests. See the unit test fail.
2. Add the tokens, then change the CSS and swatches.
3. Run `npm run design-system`.
4. Tech lead or local session: steps 3 to 5.
5. Compare `/design-kit/colour` with its snapshot (D3).

## Proof

| Acceptance check                        | Proven by                |
| --------------------------------------- | ------------------------ |
| `Banner` and hovered `Segmented` export | `design-export.spec.mts` |
| A test fails without the fix            | `design-export.test.ts`  |
| Install matches the design system       | sha256 of both copies    |
| Tests, lint, typecheck, format, words   | PR output                |
