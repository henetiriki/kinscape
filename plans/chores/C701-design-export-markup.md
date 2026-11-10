# Plan: C701: Let the design export hold markup inside a component and skip the browser's border grey

- **Spec:** #701
- **Status:** approved

## Approach

1. `mountImports` builds an HTML child as a React element: `class` becomes `className` and `for` becomes `htmlFor`. A non-HTML element (`<svg>`) throws today's error.
2. `inlineStyles` takes the token colours. It skips a `border-*-color` that is not a token when its width is `0px`.
3. `exportSnapshots` passes the tokens to `deps.render`, which passes them to `inlineStyles`.

## Decisions

**D1 · How the test proves `Divider` and `MenuPanel`** · Decides: Tech lead

- **A.** Render both with React 19 and their CSS module text. Mock `getComputedStyle` to give `0px` and `rgb(128, 128, 128)`.
- **B.** Export a board in Chromium in a Playwright test.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | What                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| `scripts/design-export.mts`               | Steps 1–3.                                                   |
| `scripts/types.ts`                        | `render` takes the tokens.                                   |
| `scripts/__tests__/design-export.test.ts` | New cases. `<b>` becomes `<svg>`. Four tests get the tokens. |
| `e2e/design-export.spec.mts`              | Pass the tokens. Run `defineBuilder`.                        |

## Order of work

1. Fail the markup test; do step 1.
2. Fail the `Divider` test; do steps 2–3.
3. Run `npm run design:export` and the checks.

## Deviations

- The tokens are `r,g,b` strings in an array: `page.evaluate` cannot send a `Set`.
- The skip covers `border-color`.
- `contents` keeps a single space between two elements in markup.
- A markup `style` goes to the element as text through a `ref`, so a `var()` shorthand survives.
- `defineBuilder` puts the builder on `window`, and `mountImports` reads it: `page.evaluate` sends one function.
- `inlineStyles` exceeds 60 lines.

## Risks

React drops an empty boolean attribute (`hidden=""`). No board on `main` has one in an `<x-import>`.

## Proof

| Acceptance check                      | Proven by           |
| ------------------------------------- | ------------------- |
| Markup and a nested import            | `mountImports` test |
| `Divider` and `MenuPanel`             | D1 test             |
| Token colour on a zero-width border   | `inlineStyles` test |
| `<svg>` error                         | `mountImports` test |
| "No snapshot changed", and the checks | PR Evidence         |
