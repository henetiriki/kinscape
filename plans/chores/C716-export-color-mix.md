# Plan: C716: Let a canvas board mount Banner and Segmented without failing the design export

- **Spec:** #716
- **Status:** approved

## Approach

Chromium computes the `color-mix()` values as `color(srgb 1 1 1 / 0.6)`, and `snapshotProblems` rejects `color()`. With D1 A, `inlineStyles` writes each `color(srgb r g b / a)` as `rgba(R, G, B, a)`, with channel `round(x × 255)`. The check reads that value as a token colour (`white`). A non-token mix or another colour space still fails.

## Decisions

**D1 · Where the fix goes** · Decides: Tech lead

- **A.** `inlineStyles` writes `color(srgb …)` as `rgba()`. Snapshots keep the colour forms that their readers read now.
- **B.** `snapshotProblems` reads `color(srgb …)`. Snapshots then hold `color()`, and `/match-design` must read it too.
- **C.** Add two alpha tokens for the two CSS files. The tech lead then runs steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system).
- **Other:** your own.

**Answer: C** (@henetiriki)

**D2 · The board that proves the export** · Decides: Tech lead

The done checks name `npm run design:export`, but the Constraints forbid a board in `design/canvas/`.

- **A.** Add `Banner` and a hovered `Segmented` to the board in `e2e/design-export.spec.mts`. It runs the page steps of `design:export` in Chromium.
- **B.** Also run `design:export` on an uncommitted local board, and paste the output.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

`scripts/design-export.mts`, `scripts/__tests__/design-export.test.ts` and `e2e/design-export.spec.mts`.

## Order of work

1. Add a unit test: `Banner` and a hovered `Segmented` with their CSS and a `color(srgb …)` computed value. See it fail.
2. Change `inlineStyles`.
3. Add both components to the e2e board.

## Proof

| Acceptance check                        | Proven by                |
| --------------------------------------- | ------------------------ |
| `Banner` and hovered `Segmented` export | `design-export.spec.mts` |
| A test fails without the fix            | `design-export.test.ts`  |
| Tests, lint, typecheck, format, words   | PR output                |
