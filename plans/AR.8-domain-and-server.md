# Plan: AR.8: lib/domain and server/

- **Spec:** #321
- **Requirement IDs:** NFR-09
- **Status:** approved

## Approach

Move files with `git mv` so history follows, then repoint imports. Pure code goes to `lib/domain/{boundaries,map}`; `load.mts` and `app-data.ts` go to `server/boundaries/`. `dayOf` moves into `lib/domain/map/map-date.ts`, its only non-test user, and its tests into `map-date.test.ts`. `app-data.ts` gets `import 'server-only'` (D1); Vitest aliases `server-only` to its `empty.js`, because the default export throws outside Next's server build. `layerOf` maps `lib/domain/` and `lib/map/` to `domain`; any other `lib/` path except `lib/design` falls outside the map.

## Decisions

**D3 · CODEOWNERS and CI cache** · Decides: Tech lead

**Answer: A** (Tech lead, in session)

- **A.** This PR adds `server/** @henetiriki` and `scripts/layers.mts @henetiriki` to `.github/CODEOWNERS`, and `server/**` to the Next cache hash in `ci.yml`. The tech lead reviews it.
- ~~**B.** The tech lead makes these edits.~~

**D4 · The `server-only` package** · Decides: Tech lead

**Answer: A** (Tech lead, in session)

- **A.** Add `server-only` `0.0.1` (exact pin, like the other dependencies).
- ~~**B.** No dependency: ignore it in `import/no-unresolved` and alias Next's private copy.~~

## Files that change

| File                                                                                                      | New / changed | What                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/boundaries/{model.mts,types.ts,schemas.mts}` → `lib/domain/boundaries/`                              | moved         | relative imports kept                                                                                                                                                                                          |
| `lib/map/{coverage,date-input,features,map-date,types}.ts` → `lib/domain/map/`                            | moved         | `map-date.ts` gains `dayOf`                                                                                                                                                                                    |
| `lib/map/filter.ts`                                                                                       | changed       | loses `dayOf` and its `toDay` import                                                                                                                                                                           |
| `server/boundaries/{load.mts,app-data.ts}`                                                                | moved         | `load.mts` imports `../../lib/domain/boundaries/…`; `app-data.ts` adds the marker                                                                                                                              |
| tests under `lib/boundaries/__tests__`, `lib/map/__tests__`                                               | moved         | `model` and `river-borders` → `lib/domain/boundaries`; `load` and `app-data` → `server/boundaries`; `coverage`, `date-input`, `features`, `map-date` → `lib/domain/map`; `dayOf` cases out of `filter.test.ts` |
| `app/page.tsx`, `app/data/polities/route.ts`, `app/components/**`, `app/design-kit/**`, `app/__tests__/*` | changed       | imports only (`@/` kept in `app/components/map`)                                                                                                                                                               |
| `scripts/{validate-boundaries,prepare-map-data}.mts`, `scripts/__tests__/validate-boundaries.test.ts`     | changed       | relative imports                                                                                                                                                                                               |
| `scripts/layers.mts`, `scripts/__tests__/layers.test.ts`                                                  | changed       | narrowed `layerOf`; drop the two `server/` entries; new cases: `lib/other` unmapped, `app/components` → `server/` breaks                                                                                       |
| `scripts/__tests__/{node-loaded,layers-config}.test.ts`                                                   | changed       | fixture and real paths to the new folders                                                                                                                                                                      |
| `scripts/__tests__/vercel-imports.test.ts`                                                                | changed       | `server` in `ROOTS`                                                                                                                                                                                            |
| `vitest.config.mts`                                                                                       | changed       | `server` in test and coverage globs; `server-only` alias                                                                                                                                                       |
| `package.json`, `package-lock.json`                                                                       | changed       | `server-only`                                                                                                                                                                                                  |
| `.github/CODEOWNERS`, `.github/workflows/ci.yml`                                                          | changed       | D3                                                                                                                                                                                                             |
| `docs/architecture.md`                                                                                    | changed       | Where-does-X-go rows, pattern rows, Layers paragraph and table                                                                                                                                                 |

## Order of work

1. Commit the plan.
2. Layer check first: update `layers.test.ts` for the narrowed `layerOf`; see it fail; change `layers.mts`.
3. Install `server-only`; Vitest config.
4. Move domain files and their tests; repoint; `npm test`.
5. Move server files and tests; marker; repoint `app/` and scripts.
6. Docs, CODEOWNERS, `ci.yml`.
7. Run the acceptance greps and every check below.

## Proof

| Acceptance check                           | Proven by                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| No old paths                               | both `git grep`s print nothing                                                          |
| Client component importing `server/` fails | `layers.test.ts` case; `eslint --stdin` on `app/components/x.tsx`                       |
| `/data/polities` byte-identical            | `cmp` of `.next/server/app/data/polities.body` built on `origin/main` and on the branch |
| `validate:boundaries` unchanged            | `diff` of its output before and after, Node 24                                          |
| `server/` tests count                      | coverage lists `server/boundaries/*` at 100%                                            |
| Everything else passes                     | `npm test`, lint, typecheck, `design:check`, `npm run e2e`                              |

## Deviations

- Four `lib/map` test files move, not five; `dayOf`'s cases move inside `map-date.test.ts`.
- `docs/architecture-target.md` names none of the moved paths, so it doesn't change.
- `layers.test.ts`: the bare `@/lib` case becomes `@/lib/domain`, since a bare `lib` is now outside the map (the narrowing this plan makes).
