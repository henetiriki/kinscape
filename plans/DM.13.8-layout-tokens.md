# Plan: DM.13.8: Layout tokens for the map and sign-in screens

- **Spec:** #260 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

Three groups go into `design/tokens.json` after `motion`; `npm run tokens` writes them unchanged, since `cssName` already prefixes every non-colour group.

- **`layout`**, desktop values flat (`--layout-popup-width`), with `phone` and `sign-in` sub-groups (`--layout-phone-sheet-top`, `--layout-sign-in-hero`). The menu offset is `{space.8}`. "A notice centres in the free map area" is a rule, not a value: it goes in `DESIGN.md` › Layout.
- **`breakpoint`**: `phone-width: 639.98px`, `phone-height: 499.98px`.
- **`z`**: `furniture: 1`, `menu: 10`.

The six components swap literals for tokens:

| File                    | Literal → token                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `Popup.module.css`      | `304px` → `--layout-popup-width`                                                   |
| `Menu.module.css`       | `296px`, `space-8` offset, `z-index: 10` → `menu-width`, `menu-offset`, `--z-menu` |
| `Dialog.module.css`     | `760px`, sheet `56px` → `dialog-width`, `phone-sources-top`                        |
| `NoticeCard.module.css` | `360px`, `380px` → `notice-width`, `notice-width-l`                                |
| `SearchBar.module.css`  | `340px` → `search-width`                                                           |
| `Toast.module.css`      | phone `80px`, `164px` → `phone-banner-top`, `phone-date-message-bottom`            |

`MapShell`, `LayersPanel`, `ZoomControls` and `Callout` write `z-index: 1`; they read `--z-furniture`. `MapShell` keeps `left: 392px`. `Dialog.tsx` builds its `PHONE` query from `breakpoint`. `Dialog`'s desktop `100dvh - 80px` and the snapshot's dialog top 120 differ; the token is written but not used, as using it would move the dialog.

New checks in `lib/design/__tests__/design.test.ts`: dock left = gutter + panel + gutter; each of the six stylesheets lacks its listed literals; every `max-width`/`max-height` in an `@media` under `app/**/*.css` equals `breakpoint` (D1).

## Decisions

**D1 · The one `min-width` query** · Decides: Tech lead

`design-kit/surfaces/page.module.css` writes `@media (min-width: 640px) and (min-height: 500px)`, the desktop side of the breakpoint.

- **A.** The test accepts a `min-` value equal to `breakpoint` + 0.02px. No stylesheet outside the six changes.
- **B.** Rewrite it as `not all and ((max-width: 639.98px) or (max-height: 499.98px))`, so every query writes the same literal.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | What                                   |
| -------------------------------------------------------- | -------------------------------------- |
| `design/tokens.json`, `app/tokens.css`                   | `layout`, `breakpoint`, `z`            |
| The six component stylesheets                            | Tokens, as tabled above                |
| `MapShell`, `LayersPanel`, `ZoomControls`, `Callout` CSS | `--z-furniture`                        |
| `app/components/Dialog.tsx`                              | `PHONE` from `breakpoint`              |
| `lib/design/__tests__/design.test.ts`                    | Dock sum, literals, media queries      |
| `design/DESIGN.md`                                       | Layout: the tokens and the notice rule |

## Order of work

1. Tests first: dock sum, literals and media queries fail.
2. Tokens; `npm run tokens`.
3. Swap the stylesheets and `Dialog.tsx`; `DESIGN.md`.
4. Lint, typecheck, test, validator, e2e.

## Risks

- **A shifted screen:** `calc()` and `var()` render the same pixels; the `blocking` screens at 0.5% catch any slip.
- **Unused tokens:** most `layout` values have no reader until DM.13.9 to DM.13.11 and the screen Specs; the Spec asks for that.

## Proof

| Acceptance check                       | Proven by                                       |
| -------------------------------------- | ----------------------------------------------- |
| Groups hold each value; `tokens.css`   | `tokens.json` diff; `design.test.ts` up-to-date |
| Six stylesheets hold no listed literal | `design.test.ts` literal check                  |
| Dock left = gutter + panel + gutter    | `design.test.ts` dock check                     |
| A media query off `breakpoint` fails   | `design.test.ts` media check                    |
| Blocking screens ≤ 0.5%                | `npm run e2e`; output in the PR                 |
| Tests, e2e, validator, 100%            | Output in the PR                                |

## Out of scope

Board 03; tablet; `MapShell`'s `left`; the Stage, sheet, Date dock and auth parts (DM.13.9 to DM.13.11).
