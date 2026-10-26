# Plan: C298: Move `lib/` and `scripts/` exported types into per-folder `types.ts` and lint for it

- **Spec:** #298
- **Status:** approved

## Approach

Cut each imported type into its folder's `types.ts` unchanged; owners import it back. Types a moved one needs move too, unexported where nothing else uses them (C296 D1).

- **Move:** `lib/boundaries` `BoundaryData`, `BoundaryVersion`, `Polity`, `PolityName`, `Source` (with `Confidence`, `Level`); `lib/design` `Outcome`, `Result`, `Shot`; `lib/map` `Fix`, `Precision`, `Problem`, `Span`; `scripts` `Denial`, `Gh`, `Transcript`, `DesignShotsCiDeps`, `PrepareMapDataDeps`.
- **Unexport in place:** `LoadResult`, `Area`, `Config`, `Known`, `Score`, `Screen`, `Size`, `Check`, `PolityCollection`, `PolityFeature`, `Get`.

The lint rule bans `ExportNamedDeclaration > TSTypeAliasDeclaration` and `> TSInterfaceDeclaration` in a block ignoring `**/types.ts` and `types/*.d.ts`; both blocks spread one shared array of the arrow-function selectors.

## Decisions

**D1 · `claude-plugin-pin-check`'s `Gh` takes no `input`** · Decides: Tech lead

- **A.** It uses the shared `Gh`; its `gh` ignores `input`.
- **B.** A second `GhRead` in `scripts/types.ts`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Nothing imports `design-shots.mts`'s `Deps`** · Decides: Tech lead

- **A.** Unexport it in place, still `Deps`.
- **B.** Move it as `DesignShotsDeps`, like the other two.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Order of work

1. One commit per folder: types, importers, then lint, format and typecheck.
2. Lint rule and the _Enforcement_ line in `docs/architecture.md`.

## Risks

- The diff is about 350 lines. If it passes 600, I stop under rule 7.

## Proof

| Acceptance check                                                    | Proven by                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Lint fails on `export type` and `export interface`, passes the rest | Lint output with each form, plus `export type { X } from './types'`, added to `lib/map/filter.ts`, then reverted |
| The `git grep` finds only `types.ts`; no script's own `Gh`, `Deps`  | Its output                                                                                                       |
| Lint, tests, validator, e2e                                         | Their output                                                                                                     |
| Under 600 lines                                                     | `git diff --stat origin/main`                                                                                    |
