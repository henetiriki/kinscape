# Plan: AR.4: `@ks/` in the design kit, routes and tests

- **Spec:** #317
- **Requirement IDs:** none (engineering-only)
- **Status:** approved

## Approach

`eslint.config.mjs` gets two patterns: `LEGACY_ALIAS` (`@/**`, "`@/` is legacy: use `@ks/`.") and `RELATIVE` (regex `^\.{1,2}/`, "Import by full path through `@ks/`, as in @ks/app/components/<folder>/<Name>."). Flat config replaces a rule's options per file rather than merging them, so three `no-restricted-imports` blocks replace the two component blocks: every linted file gets both patterns, `app/components/map/**` gets `RELATIVE` only, and `nodeLoadedFiles()` gets `LEGACY_ALIAS` only. One relative pattern means one message per import, so the component-rule tests still pass. `nodeLoadedFiles()` adds `*.mjs`.

The PR body records the rewrite commands. `'@/` becomes `'@ks/` through one `find … sed`, as in AR.3. Relative specifiers get one `sed` per folder, longest `../` chain first, anchored on `from '`, `import '`, `import('` and `ock('`, so `join(import.meta.dirname, '../…')` and `next/font` `path:` strings stay. Then `npm run lint -- --fix` moves the converted imports into the internal group, and `npm run format` runs.

## Decisions

**D1 · The Spec's `./` list leaves out `lib/map`** · Decides: Tech lead

`lib/map` has 6 `./` import lines, making 126. The Summary and acceptance check 2 already cover them.

- **A.** Convert them; on approval add "6 in `lib/map`" and "about 126" to the Spec's Behaviour.
- **B.** Convert them; leave the Spec as it is.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Which `.mjs` files count as Node-loaded** · Decides: Tech lead

The only other `.mjs`, `.claude/skills/refine/scripts/form-link.mjs`, has no relative imports.

- **A.** Root `*.mjs`, as the Spec says. A relative import added to `form-link.mjs` would fail lint.
- **B.** `**/*.mjs`, and the Spec's flagged concern is reworded.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                                                                                                                                                                                                                                       | New / changed | What                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                                                                                                                                                                                                                                        | Changed       | `LEGACY_ALIAS`, `RELATIVE` and three blocks                                                                          |
| `scripts/node-loaded.mts`                                                                                                                                                                                                                                  | Changed       | `'*.mjs'` (per D2)                                                                                                   |
| `scripts/__tests__/node-loaded.test.ts`                                                                                                                                                                                                                    | Changed       | Expects `*.mjs`                                                                                                      |
| `scripts/__tests__/layers-config.test.ts`                                                                                                                                                                                                                  | Changed       | New cases; fixture specifiers change from `@/` to `@ks/`, because the ban would otherwise also report three of them  |
| `app/design-kit/**`, `app/__tests__/*`, `app/data/polities/route.ts`, `app/layout.tsx`, the shared kit, `app/components/map/*` (not its `@/`), `lib/map/**`, `lib/boundaries/app-data.ts`, `lib/boundaries/__tests__/*`, `lib/design/__tests__/*`, `e2e/*` | Changed       | Specifiers only                                                                                                      |
| `app/components/foundation/focus.module.css`                                                                                                                                                                                                               | Changed       | Comment line 1 names `@ks/…`                                                                                         |
| `docs/architecture.md`                                                                                                                                                                                                                                     | Changed       | Line 21: `@/` only in the map folder until AR.11 (#324), relative imports only in Node-loaded files; lines 41 and 44 |

## Order of work

1. New lint cases; see them fail.
2. `node-loaded.mts`, then the lint blocks and the fixture specifiers.
3. The rewrites, then the comment in `focus.module.css`, `lint --fix` and `format`.
4. Docs.

## Risks

- A wrong path fails `npm run typecheck`. A `vi.mock` path that stops matching leaves the real tokens in place, so its assertions fail.
- `e2e/` uses an alias for the first time. Playwright reads `tsconfig` `paths`, and `npm run e2e` proves it. If it can't resolve them, stop (rule 6).
- `tokens.css` must load before `globals.css`. The sorter leaves side-effect imports in place, and the design check confirms the order.

## Proof

| Acceptance check                                    | Proven by                                                                                                                                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `'@/` outside the map folder                     | `git grep "'@/" -- app lib e2e ':!app/components/map'` finds only `onSurface.test.tsx:14-15`                                                                                                                      |
| No relative import outside Node-loaded files        | `git grep -lE "from '\.\.?/"` lists only `*.mts`, `scripts/`, `eslint.config.mjs` and a `types.ts` beside an `.mts`                                                                                               |
| `@/` fails with "use `@ks/`", passes in the map     | `layers-config.test.ts`: `app/x.tsx` fails, `app/components/map/X.tsx` passes                                                                                                                                     |
| Relative import fails outside, passes in Node files | `layers-config.test.ts`: `./` and `../` fail in `lib/map/a.ts`, and pass in `lib/boundaries/x.mts` and `scripts/x.ts`                                                                                             |
| `eslint.config.mjs` passes                          | `npm run lint`; a `layers-config.test.ts` case lints its two imports                                                                                                                                              |
| Every board loads                                   | `npm run e2e` (`e2e/design-kit.spec.ts`)                                                                                                                                                                          |
| Suite passes, tests edited only in import strings   | `npm test`, lint, typecheck, validator, `npm run build`, `design:check`, `npm run e2e`; `git diff origin/main -I"'(@ks/\|@/\|\.\.?/)" --stat -- '*__tests__*' e2e` lists only the two lint tests and sorter moves |
