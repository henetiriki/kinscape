# Plan: DM.2: Design tokens and fonts

- **Spec:** #113 (Intent #111)
- **Requirement IDs:** NFR-03, NFR-06, MAP-02
- **Status:** approved

## Approach

The tech lead commits `design/tokens.json` on this branch (Spec D1). The build needs today's `--` colours plus `credits` and the segmented-control shadow, `map.polity` keyed by the ids in `data/polities.json` plus `default`, and every colour and width `style.ts` uses.

`lib/design/tokens.mts` flattens the groups and resolves references (D1). `scripts/tokens.mts` (`npm run tokens`) writes `app/tokens.css` with a "generated" header; Prettier skips it. `style.ts` reads the resolved JSON, so MapLibre gets plain values.

`app/layout.tsx` loads the Spec's font weights with `next/font/google` and sets each font's CSS variable on `<html>`. next/font renames the families, so font stacks in `tokens.css` start with that variable.

## Decisions

**D1 · How one token points at another** · Decides: Tech lead
The focus ring and selected point must follow `brand` with no second edit.

- **A.** A string reference, `"focus": "{colour.brand}"`. The CSS gets `var(--brand)` and the map gets the hex.
- **B.** No token for either: the CSS and `style.ts` read `colour.brand` directly.
- **Other:** your own.

Recommended: A, because `tokens.json` then names each use.

**Answer:** A

**D2 · CSS property names** · Decides: Tech lead

- **A.** Colours unprefixed (`--brand`, `--ink-3`); other groups prefixed (`--radius-panel`).
- **B.** Every name prefixed by its group (`--colour-brand`).
- **Other:** your own.

Recommended: A, because `DESIGN.md` and `globals.css` already use those colour names.

**Answer:** A

**D3 · Snapshot colours with transparency** · Decides: Tech lead
The snapshots use ink at six opacities, and the hatch at 38% and 55% where `DESIGN.md` says 34%.

- **A.** Match on red, green and blue only; opacity is its own token.
- **B.** Match exactly: each opacity used needs a token.
- **Other:** your own.

Recommended: A, because otherwise every shadow step needs a token.

**Answer:** A

**D4 · Where the out-of-date check runs** · Decides: Tech lead

- **A.** A Vitest test that fails with "run `npm run tokens`".
- **B.** A `npm run tokens -- --check` step in CI's lint job.
- **Other:** your own.

Recommended: A, because it also fails locally.

**Answer:** A

## Files that change

| File                                   | New / changed | What                                      |
| -------------------------------------- | ------------- | ----------------------------------------- |
| `design/tokens.json`                   | New           | Committed by the tech lead                |
| `lib/design/tokens.mts`                | New           | Flatten, resolve references, CSS output   |
| `scripts/tokens.mts`, `app/tokens.css` | New           | Generator and its output                  |
| `app/globals.css`                      | Changed       | Tokens only; 2px brand focus ring         |
| `app/layout.tsx`                       | Changed       | Fonts; imports `tokens.css`               |
| `lib/map/style.ts`                     | Changed       | Values from `map`                         |
| `e2e/design.spec.ts`                   | New           | Fonts, requests, focus                    |
| `design/DESIGN.md`                     | Changed       | Values replaced by token names and a link |
| `package.json`, `.prettierignore`      | Changed       | `tokens` script; skip the generated CSS   |

## Order of work

1. Check `tokens.json` holds the values above.
2. Resolver and generator, test first.
3. Snapshot colour test: hex and `rgb()` in styles and SVG attributes, never `href="#…"`.
4. `globals.css`, fonts, then `style.ts`.
5. E2E, `DESIGN.md`, checks.

## Risks

- **A value is missing from `tokens.json`:** the tests list it; the tech lead adds it.
- **Fonts need the network at build time:** Vercel and CI have it; unit tests mock `next/font/google`.

## Proof

| Acceptance check                 | Proven by                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Changing `brand` changes all     | Tests: no colour literal in `globals.css`, components or `style.ts`; `map.selected` resolves to `brand`. E2E: focus ring, checkbox and slider thumb match it |
| Changing `map.land` changes land | Test: the land fill and label halo equal `map.land`                                                                                                          |
| Out-of-date CSS fails CI         | The D4 check, with a fixture                                                                                                                                 |
| Snapshot colours are tokens      | Test on the 20 snapshots, plus a fixture with a stray colour                                                                                                 |
| No Google requests; Public Sans  | E2E: no request to a Google domain; `document.fonts.check` passes for the body font                                                                          |
| 2px brand focus outline          | E2E: computed outline on each control the keyboard reaches                                                                                                   |

The app has no links or selected point yet; a token test covers the point.

## Out of scope

Regular and Italic map labels (no glyphs); moving screens onto new controls.
