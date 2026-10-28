# Plan: AR.5: Design layer split

- **Spec:** #318
- **Requirement IDs:** NFR-01
- **Status:** approved

## Approach

`git mv lib/design/tokens.mts lib/design/css.mts`, so the larger half keeps its history. Then `resolveTokens`, `lookup` and `resolveValue` move to a new `design/tokens.mts`, which exports `REFERENCE` and `isTree`. `Tree` moves to `design/types.ts`. `css.mts` imports all three relatively. `layerOf` loses its special case, so `lib/design/css.mts` falls under the existing `lib/design/` branch and is dev-only. The importers are rewritten with one `sed` per half, then `npm run lint -- --fix` and `npm run format` run.

## Decisions

**D1 · Check the design layer's own imports** · Decides: Tech lead

- **A.** Add `design/**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}` to the `layers/imports` globs and `'design'` to `ROOTS`. The Spec's last check then also allows `ROOTS`.
- **B.** Leave both. Nothing checks `design/` until a later Spec.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Proving checks 3 and 4** · Decides: Tech lead

- **A.** Two new `layerBreak` rows: kit → `@ks/lib/design/css.mts` fires "dev-only code", and kit → `@ks/design/tokens.mts` passes. The Spec's last check then also allows new `layers.test.ts` rows.
- **B.** Lint a throwaway component once and paste the output under Evidence. No test is added.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Old plans that name `lib/design/tokens`** · Decides: Tech lead

`plans/DM.2-design-tokens.md` and `plans/bugs/B230-local-fonts.md` match check 1.

- **A.** The check runs `git grep "lib/design/tokens" -- ':!plans'`, and the Spec says so. Plans stay records of what was built.
- **B.** Edit both plans to the new paths.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                          | New / changed  | What                                                                                                                    |
| --------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `design/tokens.mts`, `design/types.ts`                                                        | New            | Runtime half and `Tree`                                                                                                 |
| `design/__tests__/tokens.test.ts`                                                             | New            | The three `resolveTokens` tests, moved                                                                                  |
| `lib/design/tokens.mts` → `css.mts`                                                           | Renamed        | CSS half only                                                                                                           |
| `lib/design/__tests__/tokens.test.ts`                                                         | Changed        | Loses `resolveTokens` tests; imports `css.mts`                                                                          |
| `scripts/layers.mts`                                                                          | Changed        | Special case and its line-64 comment go                                                                                 |
| `scripts/__tests__/layers.test.ts`                                                            | Changed        | Rows 325 and 331 expect `undefined`; row 409 imports `@ks/design/tokens.mts`; `['design/tokens.mts', 'design']`; D1, D2 |
| `vitest.config.mts`                                                                           | Changed        | `design` in `include` and coverage `include`                                                                            |
| `eslint.config.mjs`                                                                           | Changed (D1 A) | `design/**` glob                                                                                                        |
| The 20 `resolveTokens` importers, `e2e/design-kit.spec.ts` and the 3 other CSS-half importers | Changed        | Specifiers only; the map folder keeps `@/`                                                                              |
| `docs/architecture.md`                                                                        | Changed        | Lines 14, 27 and 47                                                                                                     |
| `docs/architecture-target.md`                                                                 | Changed        | Line 11 drops the `lib/design` split                                                                                    |

## Order of work

1. Change the `layerOf` rows; see `lib/design/tokens.mts` fail as `design`. Drop the special case.
2. Rename, split, move the tests, update `vitest.config.mts`.
3. Rewrite importers, `lint --fix`, `format`.
4. D1 and D2, then docs.

## Risks

- A missed importer fails `npm run typecheck`.
- `css.mts` and `scripts/tokens.mts` run under Node, so a wrong relative path fails `npm run tokens`.
- A gap in the moved tests fails the 100% threshold, which proves they count.

## Proof

| Acceptance check                     | Proven by                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| No importer of `lib/design/tokens`   | `git grep "lib/design/tokens"` (D3) is empty                                                               |
| `app/tokens.css` byte-identical      | `npm run tokens`, then `git diff --exit-code app/tokens.css`                                               |
| Component importing `design/` passes | `npm run lint`; the fitness test; D2 row                                                                   |
| Component importing `css.mts` fails  | D2 row (`dev-only code`)                                                                                   |
| Moved tests count toward 100%        | `npm test` lists `design/__tests__/tokens.test.ts`; coverage table names `design/tokens.mts`               |
| Ratchet                              | `layerOf` rows 325 and 331                                                                                 |
| Design check, kit and map unchanged  | `npm run design:check`, `npm run e2e`                                                                      |
| Tests edited only as allowed         | `npm test`, lint, validator; `git diff origin/main --stat -- '*__tests__*' e2e` lists only the files above |
