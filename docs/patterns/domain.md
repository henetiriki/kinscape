---
paths:
  - 'lib/domain/**'
  - 'features/map/components/MapView.tsx'
  - 'features/map/filter.ts'
  - 'server/boundaries/load.mts'
---

# Domain patterns

| Pattern                                                                                                                                                                                                         | Where                                                                                                    | Enforced by                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Functional core, imperative shell.** Pure functions in `lib/domain`; only `MapView` creates or drives the map; `style.ts`, `layers/` and `filter.ts` build MapLibre styles and expressions from its types.    | `lib/domain/`, `features/map/components/MapView.tsx`                                                     | Tests (100% coverage)                                           |
| **Temporal validity.** A `Day` counts days since 1652-01-01; a `Validity` is half-open `[validFrom, validTo)`, null = current; `isCurrentOn` applies it, `dateFilter` and `spanFilter` as MapLibre expressions. | `lib/domain/validity/`, `lib/domain/boundaries/model.mts`, `lib/domain/dates/`, `features/map/filter.ts` | Unit tests; `filter.test.ts` checks the two agree               |
| **Schema first.** A Zod schema parses; `types.ts` derives the type from it.                                                                                                                                     | `lib/domain/boundaries/schemas.mts`, `types.ts`, `server/boundaries/load.mts`                            | `npm run typecheck`; `server/boundaries/__tests__/load.test.ts` |
