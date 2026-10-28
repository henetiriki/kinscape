# Plan: AR.6: Schemas for the table files

- **Spec:** #319
- **Requirement IDs:** NFR-09
- **Status:** approved

## Approach

New `lib/boundaries/schemas.mts` exports `polityRow`, `nameRow` and `sourceRow`, built from `z.object` (which strips unknown keys) and three shared pieces: `text` (`z.string().min(1)`), `day` (D2) and `isoDate`, which refines `text` with `isIsoDate`, moved here from `load.mts`. `types.ts` derives `Polity`, `PolityName` and `Source` with `z.output<typeof …>` through `import type`, keeping their comments. In `load.mts`, `readRows` takes a schema and calls `safeParse`, pushing `data` or today's message; `parsePolity`, `parseName`, `parseSource`, `SOURCE_FIELDS` and the per-item `isRecord` call go, since `z.object` already rejects `null` and arrays. The boundary half, with `isRecord`, `isText`, `isDay` and `isEndDay`, is untouched. The UI imports only the types, so Zod stays out of the browser bundle.

Zod 4.6.7 is the latest release and already sits in the lockfile as a dev-only dependency of `eslint-plugin-react-hooks`. It is MIT-licensed, has no dependencies and no install scripts, and ships ES modules.

## Decisions

**D1 · Where Zod is listed** · Decides: Tech lead

- **A.** `dependencies` at `4.6.7`: the loader runs inside `next build`, and M2's schemas run per request.
- **B.** `devDependencies`: enough while only the build and the validator use it; it moves in M2.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Whole-number days** · Decides: Tech lead

Zod 4's `.int()` takes only safe integers (up to 2^53); today's `Number.isInteger` takes any whole number.

- **A.** `z.number().int()`: the usual form, which AR.7 (#320) reuses. A day past 2^53 becomes an invalid row.
- **B.** `z.number().refine(Number.isInteger)`: exactly today's rule.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                    | New / changed | What                                                                     |
| --------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `package.json`, `package-lock.json`     | Changed       | `zod` at `4.6.7` (D1)                                                    |
| `lib/boundaries/schemas.mts`            | New           | The three row schemas; `isIsoDate`                                       |
| `lib/boundaries/types.ts`               | Changed       | `Polity`, `PolityName`, `Source` derived                                 |
| `lib/boundaries/load.mts`               | Changed       | `readRows` takes a schema; row parsers go                                |
| `lib/boundaries/__tests__/load.test.ts` | Changed       | One new case: unknown fields dropped from each row type; no case changed |
| `docs/architecture.md`                  | Changed       | Pattern row: **Schema first**, Zod, type derived in `types.ts`           |
| `docs/architecture-target.md`           | Changed       | Item 5 deleted                                                           |

## Order of work

1. Record `npm run validate:boundaries` output on `main`.
2. Add Zod (`npm install --save-exact zod@4.6.7`).
3. Write the unknown-fields test; it passes on today's code, so for rule 12 run it once against a `.strict()` schema and paste that failure.
4. Schemas, `types.ts`, `load.mts`.
5. Docs.

## Risks

- Zod leaves an absent optional key out of the output, so `processing` stays absent as today; the new test asserts the exact keys.
- `z.output` gives `processing?: string | undefined`; `tsc` proves every importer still compiles.
- Zod fails to load under plain Node: the validator run in the Proof covers it.

## Proof

| Acceptance check                                 | Proven by                                                      |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Same rows from today's data, unknown fields gone | Existing load tests; new unknown-fields case                   |
| Error text unchanged                             | Existing load tests, unedited                                  |
| Validator output unchanged under Node 24         | `npm run validate:boundaries` before and after, both in the PR |
| `2026-02-30` rejected                            | Existing `not a real day` case                                 |
| Types derived, importers compile                 | `npm run typecheck`; `types.ts` diff                           |
| Schema file imports only Zod and relative paths  | `vercel-imports.test.ts`, layer check (`lib/` is `lib/domain`) |
| Suite passes, no load test changed               | `npm test`, lint, `design:check`, `npm run e2e`                |

## Deviations

- `docs/architecture.md` line 3: dropped "Every rule below is in the code;" to stay within the 800-word budget.
- `docs/architecture.md` line 21: dropped "; `import type` may use it." for the same reason; the ESLint message in `scripts/node-loaded.mts` still says it.

## Out of scope

Boundary GeoJSON schemas (AR.7, #320); moving the loader to `server/` (AR.8, #321); richer messages and form schemas (M2).
