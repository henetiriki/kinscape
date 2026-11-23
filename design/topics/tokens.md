---
paths:
  - 'design/tokens.json'
  - 'design/tokens.mts'
  - 'app/tokens.css'
  - 'scripts/tokens.mts'
  - 'lib/design/**'
---

# Tokens

How a token value travels today. A Spec that changes the path updates this page.

## The source

`design/tokens.json` holds the values in these groups:

- `colour`
- `shadow`
- `font`
- `type`
- `space`
- `radius`
- `size`
- `focus`
- `motion`
- `layout`
- `breakpoint`
- `z`
- `map`

A value can refer to another with `{group.name}`. The `notes` group holds the usage note of each token that needs one.

## The CSS

`npm run tokens` runs `scripts/tokens.mts`. It writes `app/tokens.css` as custom properties. `lib/design/__tests__/design.test.ts` checks that file.

## Direct readers

Each module outside tests that imports or reads `design/tokens.json`. `lib/design/__tests__/tokens-page.test.ts` fails and names a module that this list lacks. Each reads the file, not the CSS, for the reason given.

- **MapLibre paint and the drawings that copy the map.** MapLibre takes values, not `var()`.
  - `features/map/style.ts`
  - `features/map/layers/pins.ts`
  - `features/map/layers/polities.ts`
  - `features/map/components/Legend.tsx`
  - `lib/ui/hatch.ts`
  - `app/components/auth/SignInHero.tsx`
  - `app/components/layout/SignInLayout.tsx`
  - `app/screens/map-frame.tsx`
  - `app/screens/map-account-menu/page.tsx`
  - `app/screens/map-pin-count/MapPinCountScreen.tsx`
- **JavaScript that needs a number.**
  - `app/components/foundation/usePhone.ts`: the breakpoint.
  - `app/components/layout/MapLayout.tsx`: the map padding.
  - `app/components/feedback/Toast.tsx`: the toast time.
- **Scripts that build files.**
  - `scripts/tokens.mts`
  - `scripts/design-system.mts`
  - `scripts/design-export.mts`
  - `scripts/sizes.mts`
- **The workflow diagram.** `scripts/workflows-diagram.mts` colours the diagram from the colour tokens.

## The design system and the canvas

See [Changing the design system](../CANVAS.md#changing-the-design-system). This page does not repeat those steps.

## The checks

- `lib/design/__tests__/literals.test.ts` fails on a `.module.css` literal that equals a token of its group.
- Write `/* own: <reason> */` on a literal that is a part's own dimension.

- `lib/design/__tests__/sizes.test.ts` fails on a size that is off the tokens ([The size check](#the-size-check)).

The rule is the "Tokens are the one source" row in [`docs/architecture.md`](../../docs/architecture.md).

## The size check

`lib/design/sizes.mts` reads each size in each `.module.css` file, in `app/globals.css` and in each inline `style` prop of a `.tsx` file outside tests. A size is a length, a duration, a z-index, an opacity or a font weight. It is also a length in `@media` or in a custom property. The check does not read SVG attributes.

A size passes in these cases:

- It is `0`, a percentage, an `fr`, a keyword, `100vw`, `100vh`, `100dvh` or a `* 1px` multiplier.
- It equals a token of its property's group.
- Its line has `/* own: <reason> */`. In a `style` prop, `// own: <reason>` also works.
- It is on `lib/design/off-token-sizes.json`.

Other sizes fail the test, with the file, line, property and value. A property with no group (opacity, border width, transform offsets, custom properties) always needs a reason or an entry.

An entry holds a file, a property, a value and a `count`. The test fails if the code has more copies than the count. It also fails if the code has fewer, so the list only gets shorter. After you fix a size, or add an `own:` reason, run `npm run sizes` to write the list again.

In a `style` prop, the check reads only literals. It skips an identifier, a call and a template with an expression.

## Change a value

1. Edit the value in `design/tokens.json`. Edit its note in `notes`.
2. Run `npm run tokens`.
3. Run the tests.

Then follow [Changing the design system](../CANVAS.md#changing-the-design-system) for the rest.
