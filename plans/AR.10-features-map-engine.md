# Plan: AR.10: features/map: engine and shell

- **Spec:** #323
- **Requirement IDs:** NFR-01
- **Status:** approved

## Approach

One commit `git mv`s the files so history follows; the next fixes imports to `@ks/`. `app/components/map` stays on the allowlist: `DateDock` and `DateSlider` still import `lib/domain`. The Spec's list misses these forced changes:

- `layers-config.test.ts:27`: its `lib/map` fixture becomes unchecked.
- `design.test.ts` globs gain `features/`, so the moved files keep their colour, media-query and `controls.css` checks.
- `vercel-imports.test.ts` `ROOTS` and the `ci.yml` build-cache key gain `features`.

The architecture-target "Feature slices" item moves into architecture.md as a "Where does X go" row.

## Decisions

**D1 · Rule behind "nothing else reaches into the feature"** · Decides: Tech lead

The Spec's D1, answered here. Today a route may import `@ks/features/map/components/MapView`.

- **A.** Here: `layerBreak` reports "Layer rule: import features/map through its index.ts." when code outside a feature imports a path below `features/<name>/` other than `index`. ESLint and the fitness test share `layerBreak`, so both fail. Tests stay outside the map. About 50 lines with cases.
- **B.** AR.12 (#325): drop acceptance check 1 and the "Nothing else reaches" bullet from the Spec.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How `style.ts` imports the filter** · Decides: Tech lead

The Spec says `./filter`, but ESLint rejects relative imports outside Node-loaded files (`layers-config.test.ts:99`, architecture.md line 21).

- **A.** `@ks/features/map/filter`, like every other import; reword the Spec's line.
- **B.** Allow relative imports inside `features/**`: an ESLint block, a test and an architecture.md line.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                    | New / changed | What                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/map/{style,filter}.ts` and `__tests__/` → `features/map/`                                                          | moved         | `@ks/` imports; the filter import per D2                                                                                                             |
| `app/components/map/{MapShell.tsx,MapShell.module.css,MapView.tsx}` and their `__tests__/` → `features/map/components/` | moved         | `@ks/` imports and `vi.mock` paths; controls as `@ks/app/components/map/<Control>`                                                                   |
| `features/map/index.ts`                                                                                                 | new           | exports `MapShell`                                                                                                                                   |
| `app/page.tsx`, `app/__tests__/page.test.tsx`                                                                           | changed       | import and mock `@ks/features/map`                                                                                                                   |
| `scripts/layers.mts`                                                                                                    | changed       | drop the `lib/map/` branch, its comment and two entries; D1=A rule                                                                                   |
| `scripts/__tests__/layers.test.ts`                                                                                      | changed       | `lib/domain/...` fixtures; drop `lib/map` cases; line 116 path; D1=A cases                                                                           |
| `scripts/__tests__/layers-config.test.ts`                                                                               | changed       | line 27 fixture; D1=A: a deep import from `app/` fails                                                                                               |
| `vitest.config.mts`                                                                                                     | changed       | `features` in both lists                                                                                                                             |
| `lib/design/__tests__/design.test.ts`                                                                                   | changed       | `features/map/style.ts`; component glob adds `features/*/components` (count stays 55); CSS globs add `features/`; layout-literal keys are repo paths |
| `scripts/__tests__/vercel-ignore.test.ts`                                                                               | changed       | sample paths                                                                                                                                         |
| `scripts/__tests__/vercel-imports.test.ts`                                                                              | changed       | `features` in `ROOTS`                                                                                                                                |
| `.github/workflows/ci.yml`                                                                                              | changed       | `features/**` in the Next.js cache key                                                                                                               |
| `docs/architecture.md`                                                                                                  | changed       | the Spec's rows and lines; a `features/<name>/` row                                                                                                  |
| `docs/architecture-target.md`                                                                                           | changed       | item 2 keeps `people` and `pins`                                                                                                                     |
| `design/DESIGN.md`                                                                                                      | changed       | `MapShell` leaves the `map` row; line 159 names `features/<name>/components/`                                                                        |

## Order of work

1. Commit the plan.
2. `git mv` only, committed.
3. Imports, `index.ts`, page, vitest lists; `npm run typecheck`, `npm test`.
4. `layers.mts` cleanup and fixtures.
5. D1=A: cases first; paste the failing line; then the rule.
6. `design.test.ts`, the vercel tests, `ci.yml`, docs.
7. Every check below.

## Risks

- `page.tsx` is a server component importing a `'use client'` component through `index.ts`. The boundary stays at `MapShell.tsx`; `npm run build` and e2e prove it.
- The move could change the client bundle split; the `@perf` tests measure the redraw.

## Proof

| Acceptance check                        | Proven by                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Deep import fails lint and layer check  | D1=A cases in `layers-config.test.ts` (ESLint) and `layers.test.ts`                                    |
| `lib/map/` gone                         | `git ls-files lib/map` output, empty                                                                   |
| Moved tests meet 100%                   | `npm test` coverage output                                                                             |
| `@perf` within NFR-01                   | `npm run e2e` output                                                                                   |
| `window.kinscapeMap` unchanged          | `MapView.tsx` diff is imports only; e2e specs that wait for it pass                                    |
| Lint, design check, validator unchanged | `npm run lint`, `npm run design:check`, `npm run validate:boundaries`, no test edits beyond this table |

## Deviations

- `app/components/__tests__/hover.test.ts` also globs `features/*/components`, so `MapShell.module.css` keeps its hover check (count stays 49).

## Out of scope

`lib/map/` sample paths in `node-loaded.test.ts`, `test-modifiers-config.test.ts` and `vercel-imports.test.ts:110` stay: they name no file and still pass.
