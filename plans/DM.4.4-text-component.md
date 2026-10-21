# Plan: DM.4.4: Typography: Text component and /design-kit/type

- **Spec:** #133 (Intent #111)
- **Requirement IDs:** NFR-06, NFR-03
- **Status:** approved

## Approach

`app/components/Text.tsx` renders `as` with `styles[variant]` from `Text.module.css`: one class per board style (Spec D1 A), each reading its five `--type-*` tokens. Small and caption add `--ink-3`, overline `uppercase`, and the mono styles `font-variant-ligatures: none` (`DESIGN.md` › Fonts). The props are a union over variants: display, h1, h2 and h3 require `as`; the rest default to `p` (body, bodyL) or `span` (Spec D2 B). No `className`. `app/design-kit/type/page.tsx` builds the 14 rows from a table, each sample a `<Text>`, under the board's header and beside its Rules; it 404s in production with the `/design-kit` check.

## Decisions

**D1 · The Map labels column** · Decides: Tech lead
The panel sits under a "Map labels" heading and above a note describing map-label styles (y ≈ 1385–1685).

- **A.** Leave the whole column empty, keeping its width so Rules stays in place; one ignore region covers heading, panel and note.
- **B.** Show the heading and note; ignore only the grey panel.
- **Other:** your own.

Recommended: A, because the note describes the map style, which the Spec carries forward with the panel.

**Answer: A** (@henetiriki)

**D2 · Kit header and Rules styles** · Decides: Tech lead
The type board's header and two-column notes match the states board's, styled in `app/design-kit/page.module.css`.

- **A.** Move `.kitHeader`, `.kitEyebrow`, `.kitTitle`, `.kitLead` and the `.kitNotes` rules to `app/design-kit/kit.module.css`; both pages import it.
- **B.** Copy them into `app/design-kit/type/page.module.css`.
- **Other:** your own.

Recommended: A, because one rule then sets both boards' headers; `design:check` on `style-4-states` before and after proves `/design-kit` is unchanged.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | New / changed | What                                                                                           |
| --------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `app/components/Text.tsx`, `Text.module.css`  | New           | The component, its prop union and 14 classes                                                   |
| `app/components/__tests__/Text.test.tsx`      | New           | Element and class per variant; `h3` as `h2`; defaults; `@ts-expect-error` on `h1` without `as` |
| `app/design-kit/type/page.tsx`, `.module.css` | New           | Header, rows, empty Map labels column (D1), Rules; 1790px tall like the board                  |
| `app/design-kit/type/__tests__/page.test.tsx` | New           | 404 in production; 14 rows otherwise                                                           |
| `app/design-kit/kit.module.css`               | New           | D2 A                                                                                           |
| `app/design-kit/page.tsx`, `page.module.css`  | Changed       | D2 A: import the moved classes                                                                 |
| `design/screens.json`                         | Changed       | `style-1-type`: `/design-kit/type`, 1440 × 1790, `report`, D1 ignore region                    |
| `e2e/design-kit.spec.ts`                      | Changed       | Each sample's computed font family, size, line height, weight and tracking equal its token     |
| `design/DESIGN.md`                            | Changed       | Fonts: styles come from `<Text>`, shown at `/design-kit/type`                                  |

## Order of work

1. Run `npm run design:check`; keep the `style-4-states` result.
2. Measure the D1 region in `design/source/style-1-type.html`.
3. `Text`, its module and tests.
4. D2 move; `design:check` matches step 1.
5. The type page, its test, the `screens.json` entry; `design:check`.
6. The e2e test.
7. Lint, format, tests, boundaries, e2e, build, `design:check`.

## Risks

- **Font family and size:** `--type-*-font` resolves through next/font variables to generated names; the e2e test compares each sample with a probe element styled by the same tokens, not with the token's text.
- **Type error check:** `next build` type-checks test files, proving `@ts-expect-error`.
- **Threshold:** text edges kept `style-4-states` at 2.0%; if `style-1-type` misses 0.5% it stays `report` and the gap goes under Deviations.

## Proof

| Acceptance check                            | Proven by                                                      |
| ------------------------------------------- | -------------------------------------------------------------- |
| Computed styles equal tokens                | New e2e test on `/design-kit/type`                             |
| `h3` as `h2`                                | `Text.test.tsx`: heading level 2 with the `h3` class           |
| Default `p` and `span`                      | `Text.test.tsx`                                                |
| `h1` without `as` is a type error           | `@ts-expect-error` in `Text.test.tsx`; `npm run build`         |
| Design check within threshold, or gap noted | `design:check` output in the PR; Deviations                    |
| 404 in production                           | `page.test.tsx` with `VERCEL_ENV=production`, as `/design-kit` |
| Tests and e2e pass, 100% coverage           | Their output in the PR                                         |

## Deviations

- `style-1-type` stays `report` at 2.24% (`style-4-states`: 2.04%).
- Samples render as `div`s with `data-variant`, keeping one `h1`.

## Out of scope

- `<Text>` on existing screens, including `/design-kit` (DM.4.5); map labels; the colour and foundations boards.
