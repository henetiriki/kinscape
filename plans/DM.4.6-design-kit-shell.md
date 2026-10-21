# Plan: DM.4.6: Design kit shell

- **Spec:** #141 (Intent #111)
- **Requirement IDs:** NFR-06
- **Status:** approved

## Approach

`app/design-kit/boards.ts` exports `BOARDS` (slug, number, title, line), Type 01 then States 04. `layout.tsx` calls `notFound()` in production, sets the title template, and renders a banner (`data-design-hide`) holding the heading and `KitNav`, then the page. `KitNav` is a client component: `usePathname()` sets `aria-current='page'`; its links are `TextLink`s, so they share the kit's focus ring. The states board moves with `git mv` to `states/`; both boards drop their own production check and take their `metadata.title` from `BOARDS`. The design check adds `[data-design-hide] { display: none !important }` before it shoots the built page, so each board starts at the top as now.

## Decisions

**D1 · The shell heading's element** · Decides: Tech lead
The states board already has an `<h1>`; the index has no heading of its own.

- **A.** "KinScape design kit" is a `<p>` styled as `h3`; the index's `<main>` opens with `<h1>Boards</h1>`.
- **B.** An `<h1>` in the layout; the states board then has two.
- **Other:** your own.

Recommended: A, because each page's own title stays its top heading.

**Answer: A** (@henetiriki)

**D2 · The current board's look** · Decides: Tech lead
`DESIGN.md` has no nav design.

- **A.** Weight 600, no underline, `--ink`; still a link.
- **B.** No visual change; `aria-current` only.
- **Other:** your own.

Recommended: A, because sighted keyboard users see where they are.

**Answer: A** (@henetiriki)

## Files that change

| File                                                | New / changed | What                                                         |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `app/design-kit/boards.ts`                          | New           | `BOARDS`                                                     |
| `app/design-kit/layout.tsx`, `layout.module.css`    | New           | 404, title template, banner                                  |
| `app/design-kit/KitNav.tsx`                         | New           | Nav, `aria-current`, D2                                      |
| `app/design-kit/page.tsx`                           | Changed       | Now the index: D1 heading, one link and line per row         |
| `app/design-kit/states/page.tsx`, `page.module.css` | Moved         | From `app/design-kit/`; no 404; title from `BOARDS`          |
| `app/design-kit/type/page.tsx`                      | Changed       | No 404; title from `BOARDS`                                  |
| `app/design-kit/states/__tests__/page.test.tsx`     | Moved         | Drops the 404 test                                           |
| `app/design-kit/type/__tests__/page.test.tsx`       | Changed       | Drops the 404 test                                           |
| `app/design-kit/__tests__/layout.test.tsx`          | New           | 404 in production; banner and children otherwise             |
| `app/design-kit/__tests__/KitNav.test.tsx`          | New           | Both links in order; `aria-current` on the matching one only |
| `app/design-kit/__tests__/page.test.tsx`            | Changed       | Index lists each row with its link and line                  |
| `app/design-kit/__tests__/boards.test.ts`           | New           | Each `/design-kit/*` route in `screens.json` has a row       |
| `e2e/design-check.spec.ts`                          | Changed       | Hide `[data-design-hide]` before the built shots             |
| `e2e/design-kit.spec.ts`                            | Changed       | `/design-kit/states`; index and nav tests                    |
| `design/screens.json`                               | Changed       | `style-4-states` route                                       |
| `design/DESIGN.md`                                  | Changed       | `/design-kit/states`; the index lists the boards             |

## Order of work

1. On `main`, run `npm run design:check` and keep the report.
2. `boards.ts` and its test; move the states board; layout, nav, index; tests.
3. Design check hide rule, `screens.json`, e2e, `DESIGN.md`.
4. Lint, tests, validator, e2e, design check, production build.

## Risks

- Tab from the page top now reaches the nav first; the existing ring test counts every live `a`, so it covers the nav links unchanged.
- `notFound()` in a layout must 404 every child in a static build; proven below.

## Proof

| Acceptance check                      | Proven by                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Index lists Type and States           | Index unit test; e2e follows each link                                                               |
| Nav lists, marks, Tab order           | `KitNav` unit test; e2e on all three routes: `aria-current`, then Tab reaches each link in order     |
| Same design differences               | `npm run design:check` report matches step 1 for `style-1-type` and `style-4-states`                 |
| Production 404                        | Layout unit test; `VERCEL_ENV=production npm run build`, `npm start`, `curl` shows 404 for all three |
| Missing row fails                     | `boards.test.ts`; shown failing with a row removed                                                   |
| `npm test`, `e2e`, `build` pass, 100% | CI and pasted output                                                                                 |

## Flagged concerns

- The shell is not designed: it uses `Text`, `TextLink` and spacing tokens only, plus D2.

## Deviations

- New `app/design-kit/page.module.css` lays out the index; the old one moved to `states/`.
- `boards.ts` also exports `boardTitle(slug)`, which each board's `metadata.title` reads.
