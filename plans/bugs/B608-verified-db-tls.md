# Plan: B608: Database connections use verified TLS

- **Spec:** #608 (Bug)
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03), [NFR-09](../../docs/requirements.md#nfr-09)
- **Status:** approved

## Approach

`createPgDb` passes `ssl: { ca, rejectUnauthorized: true }`, with `ca` read once from `server/db/root-ca.crt`. It first removes `sslmode` from the connection string, so the pinned CA is the one used. `serverEnv` refines both URL variables: `sslmode` must be absent or `verify-full`, and `ssl`, `sslrootcert`, `sslcert`, `sslkey` and `uselibpqcompat` are rejected. `parseEnv` runs in `instrumentation.ts`, so a URL that asks for less stops the server at boot. `parseDirectUrl` shares the refinement, and `db:migrate` and `account:add` already call `createPgDb`, so they need no code change. `next.config.ts` traces the `.crt` into every server function.

## Decisions

**D1 · CA source** · Decides: Tech lead

- **A.** Supabase's root CA checked in at `server/db/root-ca.crt`. It is a public certificate.
- **B.** A new environment variable holding the CA.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Direct URL** · Decides: Tech lead

- **A.** Same treatment for `scripts/db-migrate.mts` and `scripts/account-add.mts`.
- **B.** App only.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Which `sslmode` values boot** · Decides: Tech lead

- **A.** Only absent or `verify-full`; the other SSL keys above are rejected.
- **B.** Reject only `disable`, `allow`, `prefer`, `no-verify` and `uselibpqcompat`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                   | New / changed | What                                                                                                     |
| -------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `server/db/root-ca.crt`                | new           | Supabase root CA                                                                                         |
| `server/db/database.mts`               | changed       | `poolConfig(url, ca)` returns the pool config; `createPgDb` uses it; the CA is read on first use         |
| `server/env.mts`                       | changed       | Refinement on both URL variables                                                                         |
| `next.config.ts`                       | changed       | `outputFileTracingIncludes` for the `.crt`                                                               |
| `server/db/__tests__/database.test.ts` | changed       | `poolConfig` removes `sslmode`, keeps other parameters; `pg`'s `ConnectionParameters` on it keeps the CA |
| `server/__tests__/env.test.ts`         | changed       | Each rejected value fails naming the variable, not its value; absent and `verify-full` pass              |
| `docs/repo-settings.md`                | changed       | URL rows end `?sslmode=verify-full`; Supabase table gains the Enforce SSL setting                        |

## Order of work

1. Commit this plan: `plan(B608): approved by @henetiriki`.
2. Write the failing `env` and `poolConfig` tests, then the code, then the docs.
3. Run lint, `format:check`, `words`, `npm test`, `validate:boundaries`, `e2e` and the type check.
4. Open the PR. The tech lead sets the variables and the Supabase setting on Preview, then Production, in the order in `docs/repo-settings.md`.

## Risks

- The `.crt` missing from a function's trace fails the first query; the Preview deployment shows it before Production.
- The CA expires; its date goes in the `docs/repo-settings.md` row.

## Proof

| Acceptance check                                          | Proven by                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Every connection verifies the server certificate          | `poolConfig` test through `ConnectionParameters`; Preview sign-in |
| A weaker setting stops the server at boot                 | `env` tests; a local run with a rejected URL                      |
| `db:migrate` and `account:add` use the same configuration | `parseDirectUrl` tests; a local `db:migrate` run                  |

## Out of scope

Vercel function region.

## Deviations

- The file is `server/db/root-ca.crt` and the reader `rootCa()`, not `supabase-ca.crt`: `scripts/__tests__/providers.test.ts` keeps provider names out of `server/db`.
- No local `db:migrate` run: the `parseDirectUrl` tests prove the URL check. The tech lead runs `db:migrate` against Preview with `?sslmode=verify-full` after rollout.
