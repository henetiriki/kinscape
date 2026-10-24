# Plan: B230: The app's fonts come from Google, the snapshots' from @fontsource

- **Spec:** #230
- **Requirement IDs:** NFR-03
- **Status:** approved

## Approach

`app/layout.tsx` swaps `next/font/google` for `next/font/local`, pointed at the `@fontsource` files `design/source/fonts.css` uses, with the same `--next-font-*` variables. Per D1, Public Sans (normal, italic) and Bricolage Grotesque each get a second `localFont` call for their `latin-ext` files. Each call sets `unicode-range` through `declarations`, with the ranges in the package's own CSS. A latin-ext family can't simply follow the latin one in the stack: the latin variable ends in its metric-matched `Fallback` face (`local('Arial')`, no `unicode-range`), which would draw ő before the latin-ext face is reached. D2 settles how they join.

## Decisions

**D1 · Latin-ext characters** · Decides: Tech lead

- ~~**A.** Latin only, like the snapshots. Those characters fall back to the system font.~~
- **B.** Also load the `latin-ext` files with a second `localFont` call that declares their `unicode-range`.
- ~~**Other:** your own.~~

**Answer: B** (@henetiriki)

**D2 · How the latin-ext faces join the font stack** · Decides: Tech lead

- **A.** Both calls name the same family in `declarations` (`font-family: 'Public Sans'`), so one family holds both ranges. The latin call keeps the variable and fallback metrics; `tokens.css` and its generator don't change.
- **B.** A separate `-ext` family with its own variable, listed _before_ the latin one, with `adjustFontFallback: false` so it adds no fallback face. `fontStack` in `lib/design/tokens.mts` emits both variables; `tokens.css` is regenerated.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                | New / changed       | What                                                                                                                |
| --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app/layout.tsx`                                    | Changed             | `localFont`: Bricolage `200 800`, Public Sans `100 900` normal and italic, JetBrains Mono 400, 500; latin-ext calls |
| `app/__tests__/layout.test.tsx`                     | Changed             | Mock `next/font/local`; assert variables, files, weights and `unicode-range`s                                       |
| `design/source/fonts.css`                           | Changed             | Public Sans italic face                                                                                             |
| `design/DESIGN.md`                                  | Changed             | Fonts: app and snapshots both use the `@fontsource` files pinned in `package-lock.json`                             |
| `package.json`, `package-lock.json`                 | Changed             | Three `@fontsource` packages to `dependencies`                                                                      |
| `lib/design/tokens.mts`, its test, `app/tokens.css` | Changed (D2 B only) | Both variables in each stack                                                                                        |

## Order of work

1. Commit this plan: `plan(B230): approved by @<tech-lead>`.
2. Run `npm run design:check` on `main`; keep the table.
3. Move the packages; add the italic face to `fonts.css`.
4. Rewrite `layout.tsx` and its test; build, and check the CSS in `.next` declares each face and range as planned.
5. `DESIGN.md`.
6. Lint, format, words, tests, validator, e2e, design check.

## Risks

- `src` paths climb into `node_modules` (`../node_modules/…`); Turbopack must resolve them. If not, I'll stop with the error.
- Unit tests mock `next/font/local`, so only the build and e2e prove the real files load.
- Snapshots stay latin-only, so a latin-ext character still differs; no screen shows one.

## Proof

| Acceptance check                                               | Proven by                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| No `next/font/google`; build works with Google blocked         | `grep`; `https_proxy=http://127.0.0.1:9 npm run build` succeeds                                  |
| 15px Public Sans line the same width (±1px) on `/`, 1440 × 900 | An uncommitted e2e test measures one line in the app and in `map-desktop.html`; widths in the PR |
| Design check text differences drop on every screen             | `npm run design:check` table before and after, in the PR                                         |
| Lint, tests (100%), e2e pass                                   | Their output in the PR                                                                           |

## Deviations

- D2 A: Turbopack ignores a custom `font-family` for the variable, so the latin call keeps `next/font`'s name (`publicSans`, `bricolage`) and each latin-ext call declares that name; `e2e/design.spec.ts` checks `'publicSans'`. Both calls are literals (no helpers), and the ext results are assigned to consts, as `next/font` requires.

## Out of scope

The canvas's Google Fonts; latin-ext in the snapshots; JetBrains Mono latin-ext.
