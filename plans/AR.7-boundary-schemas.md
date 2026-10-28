# Plan: AR.7: Schemas for boundary versions

- **Spec:** #320
- **Requirement IDs:** BND-01, BND-07, NFR-09
- **Status:** approved

## Approach

`lib/boundaries/schemas.mts` gains `boundaryProperties` (the seven properties, from the existing `text` and `day`, plus `z.enum` for level and confidence, `z.boolean()` for contested), `multiPolygon` (`type: z.literal('MultiPolygon')`, `coordinates: z.custom<number[][][][]>(Array.isArray)`, the one asserted type; Spec D1: A) and `boundaryFeature`, which wraps both with `type: z.literal('Feature')`. `types.ts` derives `BoundaryVersion` as the feature's `properties` and `geometry` plus `file: string`; the hand-written type and `Confidence`/`Level` go. In `load.mts`, `parseFeature` calls `boundaryFeature.safeParse` and picks the message as D1 says; `isMultiPolygon`, `isText`, `isDay` and `isEndDay` go. The collection checks (`type`, `features`) stay as they are. The **Schema first** row in `docs/architecture.md` already covers any schema, so no doc changes.

## Decisions

**D1 · Picking the error message** · Decides: Tech lead

A bad feature must give one of three messages, in today's order.

- **A.** One `boundaryFeature` parse; the issue paths pick the message: a root or `type` issue gives `must be a "Feature"`, else a `properties` issue gives `has invalid properties`, else `geometry must be a MultiPolygon`.
- **B.** Three parses in today's order: the feature's `type`, then `boundaryProperties`, then `multiPolygon`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Extra keys on a geometry** · Decides: Tech lead

Today a geometry's extra keys (a GeoJSON `bbox`, say) are kept. The shipped files have none.

- **A.** Strip them (`z.object`), as properties are; nothing reads them and the type doesn't name them.
- **B.** Keep them (`z.looseObject`), exactly as today.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                    | New / changed | What                                                    |
| --------------------------------------- | ------------- | ------------------------------------------------------- |
| `lib/boundaries/schemas.mts`            | Changed       | `boundaryProperties`, `multiPolygon`, `boundaryFeature` |
| `lib/boundaries/types.ts`               | Changed       | `BoundaryVersion` derived                               |
| `lib/boundaries/load.mts`               | Changed       | `parseFeature` uses the schema; four helpers go         |
| `lib/boundaries/__tests__/load.test.ts` | Changed       | One new case: shipped data; no case changed             |

## Order of work

1. Record `npm run validate:boundaries` output on `main`.
2. Add the shipped-data case: for each feature in `data/boundaries/`, the loaded Boundary version equals its seven properties plus `file` and `geometry`. It passes on today's code.
3. Schemas, `types.ts`, `load.mts`. For rule 12, run the existing `reports each bad feature` case once with the D1 message order reversed, and paste the failure.
4. Typecheck, lint, tests, validator, design check, e2e.

## Risks

- `day` is `z.number().int()` (AR.6 D2), so a day past 2^53 is now invalid properties.
- `z.custom` wrongly typed would hide a bad shape from `tsc`: it is the only assertion, and `validate-boundaries.mts` still walks coordinates with turf.
- Zod issue order changing in an update: D1 A checks every issue's path, not the first.

## Proof

| Acceptance check                                   | Proven by                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Shipped files deep-equal today's                   | New shipped-data case                                                                                         |
| Error text unchanged                               | Existing `reports boundary file shape errors` and `reports each bad feature`, unedited                        |
| Validator output unchanged under Node 24           | `npm run validate:boundaries` before and after, both in the PR                                                |
| Non-numeric coordinate loads; validator reports it | Existing `fails geometry that cannot be read as polygons` (`[null]`: no loader error, one `invalid geometry`) |
| `BoundaryVersion` derived, importers compile       | `npm run typecheck`; `types.ts` diff                                                                          |
| Suite passes, no load test changed                 | `npm test`, lint, `design:check`, `npm run e2e`                                                               |

## Out of scope

Moving the loader to `server/` (AR.8, #321); deeper geometry checks (the validator); richer messages.
