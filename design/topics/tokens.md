---
paths:
  - 'design/kinscape.tokens.json'
  - 'app/tokens.css'
  - 'design/tokens.generated.ts'
  - 'scripts/tokens.mts'
  - 'lib/design/**'
---

# Tokens

How a token value travels.

## The source

`design/kinscape.tokens.json` holds the values (DTCG 2025.10) in these groups:

- `scale`
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

A value can refer to another with `{group.name}`. A `$description` holds the usage note.

## The CSS

`npm run tokens` runs Style Dictionary (`lib/design/style-dictionary.mts`). It writes `app/tokens.css` and `design/tokens.generated.ts`. Edit neither. It also rewrites each marked `@media` ([Breakpoints](#breakpoints)). `design.test.ts` fails if one is stale or the source breaks DTCG.

`design/tokens.generated.ts` has an export for each group except `scale`, plus `*Px` and `motionMs` numbers. It also has `hatchLine`, the hatch stripe as `rgba()` text, and `breakpointQuery`.

## Scales

The `scale` group holds the step groups `text`, `line`, `space`, `radius` and `duration`. A token can refer to a step: `{scale.space.400}`.
The settings of a group are in `$extensions.kinscape`: `mode`, `unit` and these inputs:

- **grid:** `grid`, `steps`.
- **ratio:** `base`, `ratio`, `below`, `above`, `round`.
- **hybrid:** `grid`, `limit`, `ratio`, `above`.
- **explicit:** `values`.

`npm run tokens` writes the steps. To change a scale, edit its settings. `design.test.ts` fails on a step that differs.

A step name is a 100-based number. Grid, hybrid and explicit mode start at 100. In ratio mode, the base is 400. A name below 100 fails.

Step n is base × ratioⁿ, then rounded to the nearest multiple of the rounding unit. A halfway value rounds to the larger multiple.

## Units

Text, line heights and spacing use rem, which follows the reader's text size. Other kinds use px. A rem group keeps px inputs. A rem token gets no `*Px` number. The checks compare px: `16px` equals `1rem`.

`e2e/large-text.spec.ts` opens each screen at 200% text. `lib/design/large-text.json` lists the failures. A new failure fails. So does a passing entry.

## Breakpoints

`breakpoint.$extensions.kinscape.queries` names each media query from width and height tokens.

- **Use a query.** Put `/* breakpoint: phone */` before the `{`. `npm run tokens` writes the condition.
- **Change a width.** Edit the token. Then run `npm run tokens`.
- **Add a query.** Add it to `queries`.

`breakpoints.test.ts` fails on an unmarked width or height `@media`, an unknown marker or a stale condition.

## Direct readers

Each module outside tests that imports `design/tokens.generated.ts` or reads `design/kinscape.tokens.json`. `tokens-page.test.ts` names a missing reader of either file.

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
  - `app/components/foundation/usePhone.ts`: the phone query.
  - `app/components/layout/MapLayout.tsx`: the map padding.
  - `app/components/feedback/Toast.tsx`: the toast time.
- **Scripts that build files.**
  - `scripts/tokens.mts` writes the file ([The CSS](#the-css)).
  - `scripts/design-export.mts`
  - `scripts/design-system.mts`
  - `scripts/sizes.mts`
- `scripts/workflows-diagram.mts` colours the workflow diagram.
- **Tool settings that skip the generated file.**
  - `eslint.config.mjs`
  - `knip.ts`

## The design system and the canvas

`npm run design-system` reads `design/kinscape.tokens.json`. See [Changing the design system](../CANVAS.md#changing-the-design-system).

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

1. Edit the value in `design/kinscape.tokens.json`. Edit its `$description`. For a step, edit the group's settings ([Scales](#scales)).
2. Run `npm run tokens`.
3. Run the tests.

Then follow [Changing the design system](../CANVAS.md#changing-the-design-system) for the rest.
