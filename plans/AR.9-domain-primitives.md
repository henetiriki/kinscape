# Plan: AR.9: Domain primitives

- **Spec:** #322
- **Requirement IDs:** BND-01, NFR-01
- **Status:** approved

## Approach

`Day` is a plain alias (D1=A) in `lib/domain/boundaries/types.ts`; `toDay`, `fromDay`, `isCurrentOn`, `nameOn`, `boundaryOn`, `hasBorders` and the `map-date.ts` functions take or return it. `current<T extends { validFrom: Day; validTo: null | Day }>(rows: readonly T[], day: Day): T[]` filters with `isCurrentOn`; `nameOn` and `boundaryOn` become `current(…).find(polity)`, and `hasBorders` becomes `current(coverage, day).length > 0`. The agreement test goes in `lib/map/__tests__/filter.test.ts`: it runs `featureFilter(dateFilter(day, 'boundary')).filter` from `@maplibre/maplibre-gl-style-spec` (D2=A) on synthetic features and compares each result with `isCurrentOn`.

## Decisions

**D3 · Keeping the declared style-spec on MapLibre's copy** · Decides: Tech lead

`maplibre-gl` needs `^26.4.4`. When Dependabot bumps it past 26.4.4 alone, npm nests a newer copy under `maplibre-gl`, and the test checks a version the map doesn't run.

- **A.** A test that `@maplibre/maplibre-gl-style-spec` resolves to the same file from `maplibre-gl` as from the root, and a `maplibre` group in `.github/dependabot.yml`, listed before `production`, so both bump in one PR.
- **B.** The test only: a lone `maplibre-gl` bump fails CI, and the tech lead bumps the pair by hand.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | New / changed | What                                                                                        |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `lib/domain/boundaries/types.ts`                | changed       | `Day`, with the day comment moved onto it                                                   |
| `lib/domain/boundaries/model.mts`               | changed       | `Day` in signatures; `current`; `nameOn`, `boundaryOn` use it                               |
| `lib/domain/map/coverage.ts`, `map-date.ts`     | changed       | `Day` in signatures; `hasBorders` uses `current`                                            |
| `lib/domain/boundaries/__tests__/model.test.ts` | changed       | cases for `current` (none, some, null end); existing cases untouched                        |
| `lib/map/__tests__/filter.test.ts`              | changed       | agreement cases; D3 resolution case                                                         |
| `package.json`, `package-lock.json`             | changed       | `@maplibre/maplibre-gl-style-spec` `26.4.4`, exact, dev                                     |
| `.github/dependabot.yml`                        | changed       | D3=A only: the `maplibre` group                                                             |
| `docs/architecture.md`                          | changed       | Temporal validity row: "`filter.test.ts` checks that the two agree" replaces "none checks…" |

## Order of work

1. Commit the plan.
2. `current` test against a stub returning `[]`; see it fail; write `current`; switch `nameOn`, `boundaryOn`, `hasBorders` to it.
3. `Day` alias and signatures; `npm run typecheck`.
4. `npm install --save-dev --save-exact @maplibre/maplibre-gl-style-spec@26.4.4`; agreement test; D3.
5. Mutation proof: change `<` to `<=` in `dateFilter`'s `validTo` clause, paste the failing line, revert.
6. Docs row; every check below.

## Risks

- MapLibre's `get` returns null for a missing key as well as a null one, so the test tries both a `validTo: null` and a feature without `validTo`.
- `featureFilter` takes the style-spec's `FilterSpecification`; `dateFilter` returns `maplibre-gl`'s `ExpressionSpecification`. Same version, so the types should match; if not, one cast in the test, with a comment.

## Proof

| Acceptance check                           | Proven by                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Days 999, 1000, 1999, 2000                 | `filter.test.ts`: both give no, yes, yes, no                              |
| No end: on or after start                  | `filter.test.ts`: days 1000, 1001, 100000 with null and missing `validTo` |
| `label` feature under `'boundary'`         | `filter.test.ts`: no on a day inside its range                            |
| `nameOn`, `boundaryOn`, `hasBorders` tests | `model.test.ts`, `coverage.test.ts` pass with no edits to existing cases  |
| A broken edge fails the test               | step 5's failing line in the PR's Evidence                                |
| Everything else passes                     | `npm test`, lint, typecheck, `design:check`, `npm run e2e`                |

## Out of scope

Branded ids, branded `Day` and `FuzzyDate` (M2). `Span` keeps `number`: the Spec doesn't name it. Moving `dateFilter` (AR.10, #323).
