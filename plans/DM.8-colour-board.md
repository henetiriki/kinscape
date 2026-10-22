# Plan: DM.8: Colour board

- **Spec:** #146 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** draft

## Approach

`app/design-kit/colour/swatches.ts` lists the groups in board order: Brand (6), Accent (2), Neutrals (13), Focus (2), Over the map (2), Third party (3), then System colours (4). Each swatch has a token path (`colour.brand-pressed`, `map.hatch.colour`), a role (`text`, `border`, `fill only`, `decorative`, `map only`, `overlay`, `disabled`), the token it is measured on and its use line. A ratio not on `surface` says what it is on: `white` on `brand`, `focus-ring-on-dark` on `ink`, `credits` on `map.land`, system text on its `-bg`. `disabled` has no threshold (WCAG exempts inactive controls). The page resolves `design/tokens.json` with `resolveTokens`, like the feedback board, and computes hex and ratios at build time with a new `lib/design/contrast.mts`. System colours reuse `<Alert>` with the board's words, then one line per token; `error-border-soft` shows its use instead of a ratio. The list lives outside `page.tsx`, as Next allows pages only their own exports.

## Decisions

**D1 · Ratio rounding** · Decides: Tech lead
The board rounds to the nearest 0.1. Field-border is 3.02:1.

- **A.** Round down, so a shown ratio never overstates; the design agent updates both boards.
- **B.** Round to nearest, as the board.
- **Other:** your own.

Recommended: B. Threshold tests use unrounded ratios, so rounding cannot hide a failure.

**D2 · Every colour token has a swatch** · Decides: Tech lead

- **A.** A test fails when a `colour.*` token has no swatch or system line.
- **B.** No such test; the design check catches drift visually.
- **Other:** your own.

Recommended: A, so a new token cannot miss the board.

**D3 · Colours with opacity** · Decides: Tech lead
`scrim` is `rgb(24 33 27 / 0.45)`; `map.hatch` has `opacity: 0.34`.

- **A.** As the board: `scrim` shows its `rgb()` value and draws at 45%; the hatch shows its hex at full strength, with 34% in its use line.
- **B.** Both show hex and opacity (`#18211B · 45%`), drawn at that opacity; the design agent updates both boards.
- **Other:** your own.

Recommended: A, as the board; the hatch still shows opacity.

**D4 · Swatch counts** · Decides: PO
The Spec says five groups and 22 swatches; the updated board has six (Interactive is now Focus) and 28. Both have 4 system colours.

- **A.** Tests follow the board; I update the Spec's counts, group names and height (2702, not 1680).
- **B.** Keep 22 and 4; added tokens wait for another Spec.
- **Other:** your own.

Recommended: A, as the Spec says counts follow the updated board.

## Files that change

| File                                                | New / changed | What                                                 |
| --------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `lib/design/contrast.mts`, `__tests__/`             | New           | Parse hex or `rgb()`; WCAG ratio; format (D1)        |
| `app/design-kit/colour/swatches.ts`                 | New           | Groups, swatches, roles, system colours              |
| `app/design-kit/colour/page.tsx`, `page.module.css` | New           | The board                                            |
| `app/design-kit/colour/__tests__/swatches.test.ts`  | New           | Thresholds on real tokens; D2                        |
| `app/design-kit/colour/__tests__/page.test.tsx`     | New           | Groups, counts, order; mocked token changes the text |
| `app/design-kit/boards.ts`                          | Changed       | Row 02 Colour                                        |
| `design/screens.json`                               | Changed       | `style-2-colour`, 1440 × 2702, `report`              |
| `e2e/design-kit.spec.ts`                            | Changed       | Colour in `BOARD_LINKS`; swatch fills match tokens   |
| `design/DESIGN.md`                                  | Changed       | Colours links `/design-kit/colour`                   |

## Order of work

1. Contrast helper and tests.
2. Swatches, page, CSS, unit tests.
3. `boards.ts`, `screens.json`, e2e, `DESIGN.md`.
4. Lint, format, words, tests, validator, e2e, build, design check.

## Risks

- If a text or border swatch fails its threshold, I stop and ask rather than relabel it.

## Proof

| Acceptance check                      | Proven by                                                |
| ------------------------------------- | -------------------------------------------------------- |
| Groups, swatch counts, order (D4)     | `page.test.tsx`                                          |
| Changed token changes hex and ratio   | `page.test.tsx` mocks `tokens.json` with another `ink-3` |
| Text 4.5:1, borders 3:1               | `swatches.test.ts` on unrounded ratios                   |
| `style-2-colour` in `report`; diffs   | `screens.json` diff; design check output in the PR       |
| Nav and index list Colour             | `boards.test.ts`; e2e over `BOARD_LINKS`                 |
| Tests, e2e, build pass, 100% coverage | Their output in the PR                                   |

## Out of scope

- Map colours and the Map style board.
- Changing any colour.
