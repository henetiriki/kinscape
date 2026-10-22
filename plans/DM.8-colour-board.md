# Plan: DM.8: Colour board

- **Spec:** #146 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** draft

## Approach

`app/design-kit/colour/swatches.ts` lists the groups in board order. Each swatch has a token path (`colour.brand-pressed`, `map.hatch`), a role (`text`, `border`, `fill only`, `decorative`, `map only`), the token it is measured on (default `colour.surface`) and its use line. The page resolves `design/tokens.json` with `resolveTokens`, as the feedback board does, and computes each hex and ratio at build time with a new `lib/design/contrast.mts`. Swatches without their own token show the token they use (Spec D1): icon green and link are `brand`, link hover `brand-hover`, disabled fill `line`. System colours reuse `<Alert>` with the board's words, then three lines from `error`, `error-border` and `error-bg`. The list lives outside `page.tsx` because Next allows pages only their own exports.

## Decisions

**D1 · Ratio rounding** · Decides: Tech lead
Field-border is 3.02:1.

- **A.** Round down to one decimal, so a shown ratio never overstates. Some may read 0.1 under the board.
- **B.** Round to nearest, as the board.
- **Other:** your own.

Recommended: A, because WCAG thresholds are not rounded.

**D2 · Every colour token has a swatch** · Decides: Tech lead

- **A.** A test fails when a `colour.*` token has no swatch, except `white` (same as `surface`).
- **B.** No such test; the design check catches drift visually.
- **Other:** your own.

Recommended: A, so a new token cannot miss the board.

**D3 · Colours with opacity** · Decides: Tech lead
`scrim` is `rgb(24 33 27 / 0.45)`; `map.hatch` has `opacity: 0.34`.

- **A.** Both show hex and opacity (`#18211B · 45%`); the swatch fill draws at that opacity.
- **B.** `scrim` shows its raw `rgb()` value.
- **Other:** your own.

Recommended: A, matching hatch, and the Spec asks for hex.

**D4 · Swatch counts** · Decides: PO
The acceptance check says 22 swatches and 4 system colours; the updated board will have more.

- **A.** Tests follow the updated board; I reword the acceptance check to its counts when it lands.
- **B.** Keep 22 and 4; added tokens wait for another Spec.
- **Other:** your own.

Recommended: A, as Behaviour already says the counts follow the updated board.

## Files that change

| File                                                | New / changed | What                                                 |
| --------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `lib/design/contrast.mts`, `__tests__/`             | New           | Parse hex or `rgb()`; WCAG ratio; format (D1)        |
| `app/design-kit/colour/swatches.ts`                 | New           | Groups, swatches, roles, system colours              |
| `app/design-kit/colour/page.tsx`, `page.module.css` | New           | The board                                            |
| `app/design-kit/colour/__tests__/swatches.test.ts`  | New           | Thresholds on real tokens; D2                        |
| `app/design-kit/colour/__tests__/page.test.tsx`     | New           | Groups, counts, order; mocked token changes the text |
| `app/design-kit/boards.ts`                          | Changed       | Row 02 Colour                                        |
| `design/screens.json`                               | Changed       | `style-2-colour`, `report`                           |
| `e2e/design-kit.spec.ts`                            | Changed       | Colour in `BOARD_LINKS`; swatch fills match tokens   |
| `design/DESIGN.md`                                  | Changed       | Colours links `/design-kit/colour`                   |

## Order of work

1. Check the design agent's updated screenshot and snapshot are on the branch; recount swatches (D4).
2. Contrast helper and tests.
3. Swatches, page, CSS, unit tests.
4. `boards.ts`, `screens.json`, e2e, `DESIGN.md`.
5. Lint, format, words, tests, validator, e2e, build, design check.

## Risks

- A text or border swatch added by the design agent may fail its threshold (`icon-disabled` is about 2.4:1). I stop and ask rather than relabel it.
- `brand-tint-hover` and `brand-tint-pressed` are on neither the board nor the Spec's list for the design agent; under D2 A they need swatches.
- `screens.json` takes the updated snapshot's height; today's is 1741, not the Spec's 1680.

## Proof

| Acceptance check                      | Proven by                                                |
| ------------------------------------- | -------------------------------------------------------- |
| Five groups, swatch counts, order     | `page.test.tsx`                                          |
| Changed token changes hex and ratio   | `page.test.tsx` mocks `tokens.json` with another `ink-3` |
| Text 4.5:1, borders 3:1               | `swatches.test.ts` on unrounded ratios                   |
| `style-2-colour` in `report`; diffs   | `screens.json` diff; design check output in the PR       |
| Nav and index list Colour             | `boards.test.ts`; e2e over `BOARD_LINKS`                 |
| Tests, e2e, build pass, 100% coverage | Their output in the PR                                   |

## Out of scope

- Map colours and the Map style board.
- Changing any colour.
