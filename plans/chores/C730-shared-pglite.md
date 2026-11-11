# Plan: C730: Share one PGlite per file in three database tests

- **Spec:** #730
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** approved

## Approach

`sharedTestDb()` makes one `PGlite` client and one `pgliteDriver`. Each `empty()` makes a Kysely handle with `createDb()` on that driver, with a `destroy` that does nothing. Then it drops and creates the `public` schema. `fresh()` adds `migrate()` on `server/db/migrations`. `createTestDb()` does not change. Each of the three files calls `fresh()` and closes the client in `afterAll`.

## Decisions

**D1 · Duration on a slower runner** · Decides: Tech lead

On the agent runner, `main` takes 27.84 s, not 8.45 s. Where must the 40 tests take under 4 s?

- **A.** On the build runner. If not, stop and report both times.
- **B.** On the tech lead's machine. The PR also shows the runner's times.
- **Other:** your own.

**Answer: Other** (@henetiriki): The 40 tests need no Duration limit. The PR shows the Duration before and after, and the task passes if all tests and checks pass.

**D2 · Last constraint ends mid-sentence** · Decides: Tech lead

The issue ends "The helper shares one connection". What does it share?

- **A.** One client, driver and lock for all handles in a file.
- **B.** One client. Each handle gets its own driver and lock.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                              | New / changed | What                       |
| ------------------------------------------------- | ------------- | -------------------------- |
| `server/db/__tests__/pglite.ts`                   | changed       | Add `sharedTestDb()`       |
| `server/db/__tests__/pglite.test.ts`              | changed       | Three tests for the helper |
| `server/trees/__tests__/database-store.test.ts`   | changed       | Use `fresh()`              |
| `server/auth/__tests__/database-sessions.test.ts` | changed       | Use `fresh()`              |
| `server/auth/__tests__/database-throttle.test.ts` | changed       | Use `fresh()`              |

## Order of work

1. Record the before output.
2. Write the three helper tests, then `sharedTestDb()`.
3. Change the three files.
4. Record the after and `grep` outputs.

## Risks

- A failed test can leave the connection inside a transaction. Kysely rolls back on an error, so this is unlikely. A fix costs one line; it is not planned.

## Deviations

- D1 replaces the issue's "under 4 s" done check. The 40 tests have no Duration limit.
- `createTestDb()` builds its dialect with the new `dialectFor()`, which `sharedTestDb()` also uses. Its behaviour does not change (630467a).
