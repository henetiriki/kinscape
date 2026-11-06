# Plan: C623: Branded ids, a Day type and one validity module

- **Spec:** #623
- **Requirement IDs:** [BND-01](../../docs/requirements.md#bnd-01), [PIN-04](../../docs/requirements.md#pin-04), [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** approved

## Approach

Types first; `npm run typecheck` then lists every caller. Kysely's `Database` types id columns as `AccountId` and `TreeId`, so rows arrive branded. `overlaps` replaces the inline checks in `features.mts` and `validate-boundaries.mts`. Renames use `git mv`.

## Decisions

**D1 · Making a Day from a number** · Decides: Tech lead

Zod, slider steps, label spans and fixtures start from numbers.

- **A.** One more maker, `asDay(n)`, beside `toDay`.
- **B.** `as Day` at each site.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Malformed ids in the store contract** · Decides: Tech lead

- **A.** Stores keep a UUID guard; the cases stay, casting their string.
- **B.** The guards go; the cases move to the `ids` tests.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · One PR or two** · Decides: Tech lead

About 1,000 changed lines, past the 600 cap.

- **A.** One PR.
- **B.** Split: ids, `findTree`, sign-in names; then the rest.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| Files                                                      | What                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `lib/domain/ids/`, `lib/domain/validity/` (new)            | Types, makers, tests                                     |
| `lib/domain/{auth,boundaries,dates,map,trees}/`            | Brands, `Validity`, `yearOf`, `.mts`, precisions         |
| `server/{auth,db,trees}/`, `server/adapters.mts`           | `findTree({…})`, `signIn`, branded rows; `uuid.mts` goes |
| `features/map/`, `app/`, `scripts/validate-boundaries.mts` | Imports, `yearOf`, `Validity`                            |
| Their tests (rule 10)                                      | Branded fixtures, renamed imports                        |
| `docs/architecture.md`                                     | _Temporal validity_ row                                  |

## Order of work

Failing `validity` and `ids` tests; ids and `findTree`; sign-in names; Day and `Validity`; `.mts`; `yearOf`; docs.

## Deviations

- `brands.test.ts` holds the three `@ts-expect-error` misuses.
- `validTo` stays typed in test helpers and `prepare-map-data.mts` (a string).

## Proof

| Acceptance check                     | Proven by                                                  |
| ------------------------------------ | ---------------------------------------------------------- |
| Typecheck rejects the three misuses  | Three errors in Evidence                                   |
| The three greps                      | Outside `design/canvas/` (not ours); D2 B renamed `plans/` |
| `.mts` import; no precision list     | Lint; `fuzzy-date.mts`                                     |
| "BET 1848 AND 1852" by `isCurrentOn` | `fuzzy-date.test.ts`                                       |
| No behaviour change                  | Contract suite, `npm test`, e2e                            |
