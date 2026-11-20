# Plan: C1083: Share the add and update code of the Tree stores

- **Spec:** #1083
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** approved

## Approach

Each store gets two private helpers: `added` for the add flow and `updated` for the versioned update. Each `add*` and `update*` method keeps its name, input and result, and calls a helper. A helper gives `undefined` for a refused add, so `addPerson` keeps `undefined`, and `addPlace` and `addRelationship` keep `err('not-found')`.

**`memory-store.mts`.** The rows of a kind have the type `Map<Id, { version: number } & Input>`. `Person`, `Place` and `Relationship` have that shape, so the helpers need no cast.

- `added(scope, rows, id, input)` refuses a frozen Tree, a missing `rows` and an `undefined` id. Otherwise it saves `{ ...structuredClone(input), id, version: 1 }` if the id is not saved. It returns a clone of the saved row.
- `updated(scope, rows, id, input, version, matches?)` gives `not-found` for the same three cases, a missing row or a failed `matches`. It gives `conflict` for a stale version. Otherwise it saves `version + 1` and returns a clone.
- Each kind passes its id check:
  - Person: `parsePersonId` on add, and `person.id` on update, as now.
  - Place: `parsePlaceId`.
  - Relationship: `joinable`, and on update a `matches` on the type and both Persons.

**`database-store.mts`.** A type `TreeTable` names `'person' | 'place' | 'relationship'`. Each kind passes `read`: its typed select by key, mapped to the entity.

- `added(db, scope, { check?, ids, read, table, values })` gives `undefined` if `reaches` fails for `ids` or `check` gives false. Otherwise it inserts with `onConflict` on `(treeId, id)` and `doNothing`, then returns `read`. Relationship passes `bothInTree` as `check`.
- `updated(db, scope, { fields, ids, key, read, table, version })` gives `not-found` if `reaches` fails. It runs the one `updateTable(` call on `key`, the Tree and `version`, as D1 says. `key` is `{ id }`, and Relationship adds its type and both Persons. Then it gives `not-found` if `read` finds no row, `conflict` if the update changed no row, and the row of `read` otherwise.

## Decisions

**D1 · Type the database update helper without a cast** · Decides: Tech lead

The Constraints forbid `any` and a cast in a helper. Kysely types `returningAll()` on the union `TreeTable` as one row with the columns of all three tables. `personOf`, `placeOf` and `relationshipOf` each take the row of one table, so that row needs a cast. The first done check needs one `updateTable(` call.

- **A.** The update returns no row. Then `read` selects the row with its own typed query, in the same transaction. The update locks the row until the commit, so `read` sees the row that this update wrote. Cost: one more query and one transaction for each update.
- **B.** Type the table as a generic `T` and narrow the row with Kysely's `$narrowType<Selectable<Database[T]>>()`. Cost: a type assertion, so a wrong pair of table and mapper compiles.
- **C.** Each kind keeps its own `updateTable(` call, and the helper shares only the `not-found` and `conflict` logic. Cost: the first done check changes to three calls.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Make `addPerson` return a `Result`, as the other two adds do. That changes a `TreeStore` result, which the Constraints forbid.
- Pass the insert and update queries as callbacks. Each kind then keeps its own `onConflict` and `updateTable(` copy.

## Files that change

| File                                       | New / changed | What                                                          |
| ------------------------------------------ | ------------- | ------------------------------------------------------------- |
| `server/trees/memory-store.mts`            | Changed       | `added` and `updated`; the six methods call them              |
| `server/trees/database-store.mts`          | Changed       | `TreeTable`, `added` and `updated`; the six methods call them |
| `plans/chores/C1083-tree-store-helpers.md` | New           | This plan                                                     |

## Order of work

The Constraints allow no test change, so no new test fails first ([test-first rule](../README.md#test-first)). The contract suite passes before and after each step.

1. In `memory-store.mts`, add `updated`, then move the three updates to it. Run `npm test -- server/trees`.
2. Add `added`, then move the three adds to it. Run the same tests.
3. In `database-store.mts`, add `TreeTable` and `updated` (D1), then move the three updates. Run the same tests on PGlite.
4. Add `added`, then move the three adds. Run the same tests.
5. If a helper needs `any` or a cast to pass `npm run typecheck`, stop and ask the tech lead (Constraints).
6. Run `git grep -c "updateTable(" -- server/trees/database-store.mts` and `git grep -c "version + 1" -- server/trees/memory-store.mts`. Each gives 1.
7. Run the checks in [Commands](../../AGENTS.md#commands). Paste the output in the PR.

## Risks

- The union `TreeTable` in `added`, and in `updated` with D1 A, accepts the columns of all three tables. A wrong pair of table and fields compiles, but Postgres throws, and the contract suite runs each kind on PGlite.
- `isVersion` still skips the update for a version that is not an `int4`. Then `read` gives `not-found` or `conflict`, as now.
- Estimate: about 150 changed lines, and each store gets shorter.

## Proof

| Acceptance check                                    | Proven by                                           |
| --------------------------------------------------- | --------------------------------------------------- |
| `updateTable(` appears once in `database-store.mts` | `git grep -c` in step 6, pasted in the PR           |
| `version + 1` appears once in `memory-store.mts`    | `git grep -c` in step 6, pasted in the PR           |
| The contract suite passes on memory and PGlite      | `memory-store.test.ts` and `database-store.test.ts` |
| No test file changes                                | The PR diff                                         |
| `npm test` passes with 100% coverage                | The output, pasted in the PR                        |
| Lint, typecheck, format, words and boundaries pass  | The output of each command, pasted in the PR        |
| `lib/domain/trees/types.ts` and the migrations stay | The PR diff                                         |

## Out of scope

- The `find*` and `list*` methods, and `reaches`.
- The Pin store (#880). It checks its Person and Place on update too, so it adds a `check` to `updated`.

## Deviations

- `database-store.mts` has no change yet. With D1 A, `updateTable(table).set(...)` does not type for a generic or union `TreeTable`: TS2349, "none of those signatures are compatible". Step 5 stops here for the tech lead.
