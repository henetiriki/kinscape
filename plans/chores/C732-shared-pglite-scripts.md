# Plan: C732: Share one PGlite per file in the account-add and db-migrate tests

- **Spec:** #732
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** draft

## Approach

Each file calls `sharedTestDb()` once at the top and calls `close()` in `afterAll`.

In `account-add.test.ts`, `migrated()` calls `await shared.fresh()` and keeps the `destroy` mock. `snapshot()` takes a `Kysely<Database>`, not `ReturnType<typeof createTestDb>`, so the file does not name `createTestDb`.

In `db-migrate.test.ts`, each of the four tests that opens a database starts with `const db = await shared.empty()` and passes `() => db` as `open`. The test "says so when nothing is pending" calls `await shared.empty()` again for the second `run()`, because `run()` calls a real `destroy()` on the first handle. The shared driver ignores `destroy()`, so the client stays open.

## Files that change

| File                                    | New / changed | What                                   |
| --------------------------------------- | ------------- | -------------------------------------- |
| `scripts/__tests__/account-add.test.ts` | changed       | Use `fresh()`; type `snapshot()` input |
| `scripts/__tests__/db-migrate.test.ts`  | changed       | Use `empty()` in four tests            |

## Order of work

1. Record the before output of the `vitest` command in the issue.
2. Change `account-add.test.ts`, then `db-migrate.test.ts`.
3. Record the after output and the `grep -n createTestDb` output.
