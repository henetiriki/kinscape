# Plan: DM.4: Design kit with buttons and simple controls

- **Spec:** #115 (Intent #111)
- **Requirement IDs:** NFR-06, NFR-03
- **Status:** approved

## Approach

One component per control in `components/` (`Button` with `primary`/`secondary`, `IconButton`, `TextLink`, `Checkbox`, `Chip`, `Segmented`, `Tabs`), styled in a new `app/controls.css` from tokens. Each rule names its pseudo-class and its static stand-in together (D2). `app/design-kit/page.tsx` copies the board's layout, header, Rules and Sizes from a table of rows. Toggles are native elements: chips set `aria-pressed`, the checkbox is a styled `<input type="checkbox">`, segments are `radio`s as in the date dock, tabs set `aria-selected`. A 20px checkbox and a 36px chip get a 44px hit area from a transparent `::before`.

## Decisions

**D1 · How production gets a 404** · Decides: Tech lead

- **A.** The page calls `notFound()` when `VERCEL_ENV` is `production`; Vercel sets it at build, so the static page is a 404 there.
- **B.** `proxy.ts` answers `/design-kit` with a 404 in production.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How a state is shown without the pointer** · Decides: Tech lead

- **A.** A `data-state="hover|focus|active"` prop; each rule reads `:hover, [data-state='hover']`. The Hover, Focus and Pressed cells are `inert`, so keyboard and screen reader meet each control in Default and Disabled only.
- **B.** A kit-only stylesheet repeating each state's rule under a class: two copies to keep in step.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Board values with no token** · Decides: Tech lead
Button text is 15px (`DESIGN.md`: 16); chip and segment text 13.5px; segment radii 9px and 7px; link radius 2px.

- **A.** Add `type.control` (15/600), `type.chip` (13.5/600), `radius.segment`, `radius.segment-item`, `radius.link` to `tokens.json`. Border widths and the 1px press shift stay literal, as in `globals.css`.
- **B.** Use the nearest token (16px, `small`, `control`, `small`) and let the threshold absorb it.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The Text field row (DM.5)** · Decides: Tech lead

- **A.** The kit keeps the row's label and height with empty cells; `screens.json` ignores that row until DM.5.
- **B.** Leave the row out: every row below shifts, so the check can't be `blocking` until DM.5.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · Size** · Decides: Tech lead
About 800 changed lines, over the 600 cap; CSS and tests are most of it.

- **A.** Keep one Spec.
- **B.** Split: buttons and link first, toggles in DM.4.1.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                 | New / changed | What                                                                |
| ------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------- |
| `components/{Button,IconButton,TextLink,Checkbox,Chip,Segmented,Tabs}.tsx` and tests | New           | The controls                                                        |
| `app/controls.css`, `app/layout.tsx`                                                 | New, changed  | Control styles; import them                                         |
| `app/design-kit/page.tsx` and test                                                   | New           | The kit; D1                                                         |
| `design/screens.json`                                                                | Changed       | `style-4-states`: `/design-kit`, 1440 × 1502, `blocking`, D4 ignore |
| `design/tokens.json`, `app/tokens.css`                                               | Changed       | D3 A only                                                           |
| `lib/design/__tests__/design.test.ts`                                                | Changed       | Scan `controls.css` for colour literals                             |
| `e2e/design-kit.spec.ts`                                                             | New           | Focus order, names, hit areas                                       |
| `design/DESIGN.md`                                                                   | Changed       | One line: controls live in `/design-kit`                            |

## Order of work

1. Tokens (D3), then each control, test first.
2. Kit page and D1.
3. `screens.json`; `/match-design style-4-states` until under 0.5%.
4. E2E, then the checks.

## Risks

- **Overlapping hit areas:** the kit's two checkboxes sit 10px apart, so their 44px areas overlap.
- **Public previews:** Vercel Authentication covers them ([settings](../docs/repo-settings.md#vercel)).

## Proof

| Acceptance check                         | Proven by                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Each control in five states              | Design check; side-by-side image in the PR                                                         |
| Production 404                           | Unit test with `VERCEL_ENV=production`; local production build, `curl` shows 404                   |
| Matches `style-4-states`                 | `blocking` design check passes in CI                                                               |
| Tab: brand ring, disabled skipped        | E2E: each focused element's outline is 2px brand; no disabled control is focused                   |
| Icon buttons named; toggles report state | Unit tests by role and name; E2E checks `aria-pressed`, `checked`, `aria-checked`, `aria-selected` |

## Deviations

- `Segmented` and `Tabs` are client components (they hold handlers).
- `style-4-states` is `report`, not `blocking`: 2.0% of pixels differ, all text edges, over the 0.5% limit. Tech lead decides.
