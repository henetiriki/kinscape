# Plan: DM.12.1: Kit menu and index

- **Spec:** #152 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06
- **Status:** approved

## Approach

`boards.ts` swaps `number` for `eyebrow` and takes the three new lines; the index reads `eyebrow`. The layout's title becomes a link to `/design-kit` inside the `<p>`, styled as now with no underline. A new client component, `KitMenu`, holds the "Boards" `Button` (menu icon, `aria-haspopup='dialog'`) and a native `<dialog>` opened with `showModal()` (Spec D1 A). The dialog is the sheet; its content fills it, so a click whose target is the dialog itself is the scrim (`::backdrop` in `--scrim`) and closes it. The browser handles Esc, the inert page and focus returning to the button. One media query, `(max-width: 639.98px), (max-height: 499.98px)` (#104 D1, answered on #152), hides the nav list and shows `KitMenu`. The slide is a keyframe on `dialog[open]` over `--motion-sheet`, inside `prefers-reduced-motion: no-preference`.

## Decisions

**D1 · What is current on the index** · Decides: Tech lead
On `/design-kit` no board is current.

- **A.** The title link and the sheet's "All boards" get `aria-current='page'`, with no visual change.
- **B.** Nothing is marked, as today.
- **Other:** your own.

Recommended: A, because a screen reader then says where you are on every kit page.

**Decision D1:** A

## Files that change

| File                                                     | New / changed | What                                                                                         |
| -------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `app/design-kit/boards.ts`                               | Changed       | `eyebrow` replaces `number`; three lines                                                     |
| `app/design-kit/page.tsx`                                | Changed       | Reads `eyebrow`                                                                              |
| `app/design-kit/layout.tsx`, `layout.module.css`         | Changed       | Title link; 61px bar; phone query                                                            |
| `app/design-kit/KitMenu.tsx`, `KitMenu.module.css`       | New           | Button, sheet, rows, "All boards", slide                                                     |
| `app/components/Icon.tsx`                                | Changed       | `menu` path from the snapshot                                                                |
| `app/design-kit/__tests__/KitMenu.test.tsx`              | New           | Opens; six rows in order; current row; close, scrim and row close                            |
| `app/design-kit/__tests__/{layout,page,KitNav}.test.tsx` | Changed       | Title link; eyebrows and lines; D1                                                           |
| `e2e/design-kit.spec.ts`                                 | Changed       | Bar, phone, sheet, focus and motion tests; Tab order starts at title                         |
| `e2e/design-states.ts`                                   | Changed       | `kit-menu-open`: press "Boards", wait for the slide to finish                                |
| `design/screens.json`                                    | Changed       | `design-kit`, `design-kit-phone`, `design-kit-menu-phone` (`/design-kit/type`), all `report` |

## Order of work

1. `boards.ts`, index and their tests.
2. Title link, bar height, phone query; layout test.
3. `menu` icon; `KitMenu` and its test (jsdom lacks `showModal`, so the test stubs it).
4. `screens.json`, design state, e2e.
5. Lint, format, words, tests, validator, e2e, design check, production build.

## Risks

- An open sheet would survive a client-side navigation; the row's `onClick` closes it.
- Tab from the page top meets the title first.

## Proof

| Acceptance check                                      | Proven by                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1440: title link, six labels, current marked, no line | `layout.test.tsx`, `KitNav.test.tsx`; e2e: bar is 61px, current link's `text-decoration` is none              |
| 390 and 800 × 450: title and 44px button, no links    | e2e at both sizes                                                                                             |
| Sheet opens, six rows, current, page unreachable      | `KitMenu.test.tsx`; e2e: dialog "Boards", current row's background is `--brand-tint`, Tab stays in the dialog |
| Esc, close, scrim, a board close it; focus returns    | e2e for each; focus checked after Esc and close                                                               |
| Reduced motion                                        | e2e with `reducedMotion: 'reduce'`: no animation on the dialog; without, one of 240ms                         |
| Three screens in `report`; differences listed         | `screens.json` diff; design check output in the PR                                                            |
| Production 404                                        | `layout.test.tsx`; `VERCEL_ENV=production npm run build`, `npm start`, `curl` each kit route                  |
| Tests, e2e, build pass, 100% coverage                 | Their output in the PR                                                                                        |

## Deviations

- The title link is a client component, `KitTitle` in `KitNav.tsx`, to read the pathname for D1 A.
- The e2e Tab test counts only visible controls.

## Flagged concerns

- `design-kit-menu-phone` shows the type board on a phone, which is DM.12.2, so its score will be high.
- 640–1279px wide is undesigned; it gets the desktop bar as a stopgap (#104 D1).
- The `Button`'s padding is 18px each side; the design's is 12px and 16px. I list it with the differences rather than add a variant.
- `menu` is not on the foundations board's icon list.
