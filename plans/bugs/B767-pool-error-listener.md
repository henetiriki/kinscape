# Plan: B767: The database pool has no error listener

- **Spec:** #767 (Bug)
- **Requirement IDs:** [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** draft

## Approach

A new `createPool(connectionString)` in `server/db/database.mts` makes the `pg.Pool` from `poolConfig` and adds an `error` listener. `createPgDb` passes that pool to `PostgresDialect`. The listener writes one `console.error` line: a fixed text and the error's `code` (D1). `pg` removes the broken idle client from the pool, so the next query opens a new connection with no more code. The app, `db:migrate`, `account:add` and `seed-ci` all call `createPgDb`, so they need no change.

## Decisions

**D1 · What the log line holds** · Decides: Tech lead

A `pg` error message can name the host, and a server message can quote a value.

- **A.** A fixed text and the error's `code` only, for example `The database closed an idle connection (57P01)`.
- **B.** A fixed text and the error's `message`.
- **Other:** your own.

Recommended: A, because the security rules forbid secrets and Person data in logs, and only a fixed text is sure to hold neither.

## Files that change

| File                                   | New / changed | What                                                                                                                    |
| -------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `server/db/database.mts`               | changed       | `createPool` with the `error` listener; `createPgDb` uses it                                                            |
| `server/db/__tests__/database.test.ts` | changed       | An `error` event on the pool writes one line, which holds the code and not the password or the message                  |
| `server/db/__tests__/postgres.test.ts` | changed       | In `database-postgres`: end an idle connection with `pg_terminate_backend`; one line is logged; the next query succeeds |
| `server/db/__tests__/postgres.ts`      | changed       | The comment on `open` names the reason that stays: a handle that a failed test left open must close before the drop     |

## Order of work

1. Write the `database.test.ts` test and see it fail on the missing log line.
2. Write `createPool` and the listener.
3. Write the `postgres.test.ts` test. It runs in CI's `database-postgres` project.
4. Update the comment in `postgres.ts`.
5. Run the checks in `AGENTS.md` › Commands.

## Risks

- A burst of dropped connections writes one line each. The pool holds at most 10 clients, so a burst is at most 10 lines.
- An error on an active client still rejects its query, as now. The listener catches only the idle-client event.

## Proof

| Acceptance check                                   | Proven by                                               |
| -------------------------------------------------- | ------------------------------------------------------- |
| A dropped idle connection writes one log line      | `database.test.ts` (emitted event); `postgres.test.ts`  |
| The line holds no connection string or Person data | `database.test.ts`: the password and message are absent |
| The pool opens a new connection on the next query  | `postgres.test.ts`                                      |
| The server keeps running                           | `postgres.test.ts`: Vitest fails on an uncaught error   |

## Out of scope

- Retry of a query that fails on an active client.
- An alert on repeated pool errors.
