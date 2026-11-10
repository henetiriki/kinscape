# Plan: C701: Let the design export hold markup inside a component and skip the browser's border grey

- **Spec:** #701
- **Status:** approved

## Approach

1. `mountImports` builds an HTML child as a React element: `class` becomes `className`, `for` becomes `htmlFor`, and `style` becomes an object. Its children follow the same rule. A non-HTML element (`<svg>`) throws today's error.
2. `inlineStyles` takes the token colours. It skips a `border-*-color` that is not a token when its width is `0px`.
3. `exportSnapshots` passes the tokens to `deps.render`, which passes them to `inlineStyles`.

## Decisions

**D1 · How the test proves `Divider` and `MenuPanel`** · Decides: Tech lead

jsdom has no `<hr>` grey.

- **A.** Render both with React 19 and their CSS module text. Mock `getComputedStyle` to give `0px` and `rgb(128, 128, 128)`.
- **B.** Export a board in Chromium in a Playwright test. It is slower, and it adds no unit coverage.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | What                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `scripts/design-export.mts`               | Steps 1–3.                                                                                  |
| `scripts/types.ts`                        | `render` takes the tokens.                                                                  |
| `scripts/__tests__/design-export.test.ts` | New cases. The `<b>` rejection becomes the `<svg>` case. Two tests get the tokens argument. |

## Order of work

1. See the markup test fail on `Unsupported <div>`, then do step 1.
2. See the `Divider` test fail on the grey, then do steps 2–3.
3. Run `npm run design:export` and the checks.

## Risks

React drops an empty boolean attribute (`hidden=""`). No board on `main` has one inside an `<x-import>`. A fix costs about five lines.

## Proof

| Acceptance check                      | Proven by                   |
| ------------------------------------- | --------------------------- |
| Markup and a nested import            | `mountImports` test         |
| `Divider` and `MenuPanel`             | D1 test                     |
| Token colour on a zero-width border   | `inlineStyles` test         |
| `<svg>` error                         | `mountImports` test         |
| "No snapshot changed", and the checks | Output in the PR's Evidence |
