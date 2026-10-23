# Plan: DM.12.7: Map furniture components

- **Spec:** #186 (Intent #111)
- **Requirement IDs:** NFR-06, NFR-05, EXP-04, MAP-05
- **Status:** approved

## Approach

- **Wordmark:** `size` 44, 36 or 32 (icon radius 25%; name H2 at 44, H3 otherwise) and `iconOnly`, whose `img` is named "KinScape"; beside the name it has `alt=""`.
- **SearchBar:** `form='bar' | 'pill'`, a `role="search"` form that prevents submit. The bar is the 32 Wordmark, a 1 × 28 line and the 340 field with `aria-keyshortcuts="/"` and the Key hint; the pill is the icon-only Wordmark, the bare 16px field and an `account` slot. The "/" listener (from TextField) runs only for the bar. Esc with text clears and cancels the key, so the browser's own clear doesn't also fire; with none it blurs.
- **ZoomControls:** a white card of three IconButtons, corners rounded per button so the card needs no `overflow: hidden`. `atMin` and `atMax` set `aria-disabled` and skip the handler. **LayersButton:** 48 (`size.field-l`), `onClick`. IconButton gains `[aria-disabled='true']` styles.
- **Legend:** an `h3` overline, four rows and the four-glyph row. Swatch values come from `resolveTokens(tokens.json).map` as CSS variables, as `map-style/Preview.tsx` does.
- **Kit:** `/design-kit/map-furniture` reuses `inputs/Board.tsx` (Section, Variant, Matrix, Facts); the Event glyph section reuses board 06's sample. The pill's `account` is DM.12.6.3's live `AccountMenu`.

## Decisions

**D1 · Legend padding on a phone** · Decides: Tech lead

The Spec says the padding differs; board 08, `map-desktop` and `map-phone-layers` all draw 12 16, radius 12.

- **A.** Same at both widths, as the snapshots draw. Rewords the Spec's Legend line and drops its flagged concern.
- **B.** Different values, chosen at build time.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The uncertain-date swatch's white stroke** · Decides: Tech lead

The board draws 1.5; the map's pin halo is `map.pin.halo-width` (2).

- **A.** Read `map.pin.halo-width`, so the swatch matches the map.
- **B.** 1.5 as drawn, a constant in the CSS.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                      | New / changed | What                              |
| ------------------------------------------------------------------------- | ------------- | --------------------------------- |
| `design/tokens.json`, `app/tokens.css`                                    | Changed       | `size.search` = 52                |
| `app/components/` Wordmark, SearchBar, ZoomControls, LayersButton, Legend | New           | Components, CSS, tests            |
| `app/components/IconButton.module.css`                                    | Changed       | `aria-disabled` look              |
| `app/design-kit/map-furniture/` page, sections, CSS, test                 | New           | Board 08                          |
| `app/design-kit/boards.ts`                                                | Changed       | "Style guide · 08" after Surfaces |
| `design/screens.json`                                                     | Changed       | 1440 × 4294; phone 390 × 6246     |
| `e2e/map-furniture.spec.ts`                                               | New           | Keys, focus, 390px                |

## Order of work

1. Token, Wordmark, Legend, with tests.
2. SearchBar, ZoomControls, LayersButton, IconButton, with tests.
3. Kit page, boards, `screens.json`, e2e; then the checks, design check and build.

## Risks

- Browsers clear a search field on Esc themselves; a unit test and e2e prove one Esc clears and the second blurs.
- Two "/" listeners on one page would both fire; the kit sets the shortcut on one bar only.

## Proof

| Acceptance check              | Proven by                                                              |
| ----------------------------- | ---------------------------------------------------------------------- |
| Every variant, in order       | Page test of section and variant order; design check scores in the PR  |
| Wordmark sizes, icon name     | `Wordmark.test.tsx`: `alt` both ways; e2e icon sizes 44, 36, 32        |
| "/" and Esc                   | e2e: "/" on the body focuses; Esc clears; Esc blurs                    |
| Input type, name, shortcut    | `SearchBar.test.tsx`                                                   |
| Zoom out at minimum           | `ZoomControls.test.tsx`: `aria-disabled`, no call; e2e: Tab reaches it |
| Focus ring not cut            | e2e: no ancestor clips (`overflow: visible`); design-check focus state |
| Swatches match tokens         | `Legend.test.tsx`: each CSS variable equals its resolved token         |
| Legend follows a token change | Same test, built from `tokens.json` at import                          |
| 390px                         | e2e: pill and layers button ≥ 44; no sideways scroll                   |
| Tests, e2e, build, coverage   | Their output in the PR                                                 |

## Out of scope

- The map screen, MapLibre's zoom control, search results and wiring (Spec).
