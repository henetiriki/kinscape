# Plan: AR.3: `@ks/` in the shared kit

- **Spec:** #316
- **Requirement IDs:** none (engineering-only)
- **Status:** draft

## Approach

One command renames every `'@/` to `'@ks/` in the shared kit and its tests, and the PR body records it so the review can re-run it:

```sh
find app/components/{actions,auth,feedback,forms,foundation,overlays} app/components/__tests__ -type f -exec sed -i "s#'@/#'@ks/#g" {} +
```

On `origin/main` (d5c4f06) that is 138 lines in 72 files, all single-quoted. 19 are CSS `composes`, one is a `composes` string in `onSurface.test.tsx`, and 8 import from `app/components/map`. The shared kit has no `vi.mock`. Then `npm run format`, and the two lint messages and the two docs are edited by hand. The sorter already treats `@ks/` as internal (AR.2), and the order inside each file is unchanged because every alias in it changes together.

## Decisions

**D1 · `onSurface.test.tsx` checks map and Toast CSS with one string** · Decides: Tech lead

Its table holds `map/LayersPanel`, `map/DateDock` (staying on `@/`) and `feedback/Toast` (moving to `@ks/`), all matched against one `'@/…'` string. A plain rename fails the map rows.

- **A.** Add an alias column to the `it.each` rows (`'@/'` for map, `'@ks/'` for Toast). Exact match stays, and AR.11 (#324) removes the column.
- **B.** Match `from '@(ks)?/app/…'` with a regex. One line, but it accepts either alias.
- **C.** Convert the two map `composes` lines now. That changes the Spec's scope.
- **Other:** your own.

Recommended: A, because the assertion stays exact.

**D2 · Prettier rewraps `Button.tsx:3`** · Decides: Tech lead

The import is 80 characters now and becomes 82, so `npm run format` splits it over four lines. The read-back diff then shows `Button.tsx` too.

- **A.** Accept the wrap, and the check lists it as an exception.
- **B.** Add `// prettier-ignore` above it.
- **Other:** your own.

Recommended: A, because a formatter exception would outlast the rename.

**D3 · Stale facts in the Spec** · Decides: Tech lead

The Spec says the rename includes `vi.mock` strings (there are none) and gives about 140 lines in 73 files (138 in 72). Its "every mock still matches" check has nothing to prove.

- **A.** On approval, reword those lines and the checks that D1, D2 and the new lint case touch.
- **B.** Leave the Spec as it is, and the plan's Proof explains the gaps.
- **Other:** your own.

Recommended: A, because the Spec then describes what merges.

## Files that change

| File                                                                                                       | New / changed | What                                                               |
| ---------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ |
| 72 files in `app/components/{actions,auth,feedback,forms,foundation,overlays}`, `app/components/__tests__` | Changed       | `'@/` to `'@ks/`; `onSurface.test.tsx` per D1; `Button.tsx` per D2 |
| `eslint.config.mjs`                                                                                        | Changed       | Lines 134 and 150: `@ks/app/components/<folder>/<Name>`            |
| `scripts/__tests__/layers-config.test.ts`                                                                  | Changed       | New case: both component rules' messages name `@ks/`               |
| `design/DESIGN.md`                                                                                         | Changed       | Line 159 names `@ks/`                                              |
| `docs/architecture.md`                                                                                     | Changed       | Line 28 row names `@ks/`                                           |

## Order of work

1. Lint case first, then see it fail on the message; then the two messages.
2. The rename command, then `npm run format`, then D1 and D2.
3. Docs.

## Risks

- A missed specifier still resolves through `@/`, so tests pass anyway: the `git grep` check catches it.
- `composes` isn't resolved by Vitest: `npm run build` and the design check prove the CSS (AR.2 D2).

## Proof

| Acceptance check                         | Proven by                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| No `'@/` in the shared kit               | `git grep "'@/" -- <the seven folders>` is empty                                                                                |
| Read-back diff shows only lint and docs  | `git diff origin/main -I"'@(ks)?/" --stat` lists only `eslint.config.mjs`, the two docs, the lint test and the D1/D2 exceptions |
| `../` import fails, message names `@ks/` | New `layers-config.test.ts` case                                                                                                |
| Mocks still match                        | Per D3; `npm test`                                                                                                              |
| Suite passes                             | `npm test`, lint, validator, `npm run build`, `design:check`, `npm run e2e`                                                     |
| Docs name `@ks/`                         | The diff of `DESIGN.md` and `architecture.md`                                                                                   |

## Out of scope

`app/components/map` (AR.10 #323, AR.11 #324); the design kit, routes, other tests, relative imports and the `@/` ban (AR.4 #317).
