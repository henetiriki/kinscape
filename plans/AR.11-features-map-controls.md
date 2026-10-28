# Plan: AR.11: features/map: the controls

- **Spec:** #324
- **Requirement IDs:** NFR-01, NFR-09
- **Status:** approved

## Approach

One commit `git mv`s every file (D1, D2 of the Spec) so history follows; the next fixes imports. Then the `ui` layer, the `ALLOWLIST` and `@/` removal, each test-first. Forced changes the Spec doesn't list:

- `EventGlyph` leaves the kit globs, so `design.test.ts` and `hover.test.ts` add `lib/ui`; counts stay 55 and 49.
- `EventGlyph.sync.test.ts` reads `design/source` one folder up less.
- ESLint's Node-loaded block keeps relative imports with `no-restricted-imports: off` once `LEGACY_ALIAS` goes.
- `node-loaded.test.ts` and `vercel-imports.test.ts` fixtures use `@/`; the `@/` copy of the `@ks/` case goes.
- The target doc has no layer table; it drops "empties the allowlist" and "`@/` imports everywhere".

## Deviations

- `layerBreak` loses its `as` parameter, which only `listed` used.
- The two `@/` test fixtures are template literals, so `git grep -I "'@/"` finds nothing outside `plans/`.

## Decisions

**D1 · Whether `design` may import `ui`** · Decides: Tech lead

The Spec lets `design` import `ui`, while `ui` imports `design`: the cycle the Spec's D2 rejected. Nothing in `design/` needs `ui`.

- **A.** `design` imports nothing, as today; reword the Spec's line to "`kit`, `feature` and `routes`".
- **B.** As the Spec says: `design: ['ui']`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Acceptance check 1 and binary files** · Decides: Tech lead

`git grep "'@/"` matches the bytes of `design/style-7-components-surfaces-phone.jpg`.

- **A.** Prove it with `git grep -I "'@/"` (skips binaries); add `-I` to the Spec's check.
- **B.** Exclude `design/*.jpg` with a pathspec.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                                 | New / changed | What                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `app/components/map/{EventGlyph.*,types.ts,hatch.ts}`, tests → `lib/ui/`                                                             | moved         | `@ks/` imports; sync test's `design/source` path                                                                        |
| `app/components/map/{Avatar,Wordmark}.*`, tests → `foundation/`                                                                      | moved         | `@ks/` imports                                                                                                          |
| rest of `app/components/map/`, `forms/DateField.*`, `overlays/{SourcesDialog.*,sourcesWords.ts}`, tests → `features/map/components/` | moved         | `@ks/` imports; CSS `composes` paths                                                                                    |
| `Chip`, `ChipGroup` test, `actions/types`, `overlays/types`, `Menu`, `Popup`, `AuthLayout`                                           | changed       | new paths                                                                                                               |
| `features/map/components/{MapShell,MapView}` and tests; `app/design-kit/**` (8 files)                                                | changed       | new paths                                                                                                               |
| `scripts/layers.mts`                                                                                                                 | changed       | `ui` layer, `named('ui')`; drop `ALLOWLIST`, `covers`, `entryOf`, `listed`, the `@/` branch                             |
| `scripts/__tests__/layers.test.ts`                                                                                                   | changed       | `problems` without allowlist; drop `entryOf` and listed cases; fixtures to `@ks/`; `ui` cases; `@/` resolves to nothing |
| `scripts/__tests__/layers-config.test.ts`                                                                                            | changed       | drop the `@/` case; `lib/ui` importing the kit fails                                                                    |
| `scripts/__tests__/{node-loaded,vercel-imports}.test.ts`, `scripts/node-loaded.mts`                                                  | changed       | `@/` fixtures and comment                                                                                               |
| `eslint.config.mjs`                                                                                                                  | changed       | drop `LEGACY_ALIAS`, `^@/` pattern, map block; Node-loaded blocks                                                       |
| `tsconfig.json`, `vitest.config.mts`                                                                                                 | changed       | drop `@/`                                                                                                               |
| `app/components/__tests__/{onSurface,hover}.test.ts*`, `lib/design/__tests__/design.test.ts`                                         | changed       | repo paths; alias column goes; `lib/ui` globs                                                                           |
| `docs/architecture.md`, `docs/architecture-target.md`, `design/DESIGN.md`                                                            | changed       | the Spec's lines; `ui` row; Slots path                                                                                  |

## Order of work

1. Commit the plan.
2. `git mv` only, committed.
3. Imports; `npm run typecheck`, `npm test`.
4. `ui` cases first (kit → `ui` passes, `ui` → kit fails); paste the failing line; then the layer.
5. `targetOf('@/…')` undefined case first; then drop `@/` everywhere.
6. Drop the `ALLOWLIST` and its tests.
7. Glob tests, docs.
8. Every check below.

## Risks

- A CSS `composes` path left on `@/` fails only at build: `npm run build` and `design:check` catch it.
- Over 600 lines: split as the Spec's Flagged concerns say.

## Proof

| Acceptance check                          | Proven by                                                          |
| ----------------------------------------- | ------------------------------------------------------------------ |
| No `@/`; `app/components/map` gone        | `git grep -I "'@/"` (D2), `git ls-files app/components/map`: empty |
| Kit imports only `lib/ui`                 | the Spec's `git grep` output                                       |
| No allowlist; a new break fails           | `layers.test.ts` repo and "new break" cases                        |
| `lib/ui` importing the kit fails          | `layers.test.ts` and `layers-config.test.ts` cases                 |
| Design kit unchanged                      | `/design-kit` e2e, `npm run design:check`                          |
| Suite passes, tests edited only as listed | `npm test`, lint, validator, `npm run e2e`; this table             |
