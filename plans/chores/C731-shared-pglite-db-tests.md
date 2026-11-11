# Plan: C731: Share one PGlite per file in the tree-scoped and migrate tests

- **Spec:** #731
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

Each file makes one `sharedTestDb()` at module level and calls `close()` on it in `afterAll`, as `database-store.test.ts` does. In `migrate.test.ts`, `beforeEach` calls `await shared.empty()`. In `tree-scoped.test.ts`, the first `beforeEach` calls `await shared.empty()`. The second calls `await shared.fresh()` in place of `createTestDb()` and `migrate()`. The module-level `let db` keeps its name and gets the type `Kysely<Database>`, because it has no initial value now. `pglite.ts`, the test bodies and the expected values do not change.

## Files that change

| File                                      | New / changed | What                                                 |
| ----------------------------------------- | ------------- | ---------------------------------------------------- |
| `server/db/__tests__/migrate.test.ts`     | changed       | Use `empty()`; `close()` in `afterAll`               |
| `server/db/__tests__/tree-scoped.test.ts` | changed       | Use `empty()` and `fresh()`; `close()` in `afterAll` |

## Order of work

1. Run the done-check `vitest` command on `main` and record its output.
2. Change `migrate.test.ts`.
3. Change `tree-scoped.test.ts`. Remove the `migrate` import, which it no longer uses.
4. Run the `vitest` command and the `grep` again, and record both outputs.
5. Run the checks in `AGENTS.md` › _Verifying your work_.

## Risks

- Two tests in `migrate.test.ts` make a migration fail inside a transaction on the shared connection. Kysely rolls the transaction back before it throws, so the next `empty()` starts clean. If it does not, the next test fails at once.

## Deviations

- Both files keep their `afterEach` calls to `db.destroy()`, as the issue says. On the shared client, `destroy()` closes nothing.

## Proof

| Acceptance check                          | Proven by                                                      |
| ----------------------------------------- | -------------------------------------------------------------- |
| All 17 tests pass                         | The `vitest` command on the two files, before and after output |
| No `createTestDb` in the two files        | `grep -n createTestDb` on the two files, empty output          |
| Only setup and teardown lines change      | The PR diff                                                    |
| `createTestDb()` and the helper unchanged | No change to `server/db/__tests__/pglite.ts`                   |
