---
paths:
  - 'server/trees/**'
  - 'server/action.mts'
  - 'server/db/TEMPLATE.sql'
  - 'server/db/migrations/**'
  - 'app/data/private-json.ts'
  - 'server/adapters.mts'
---

# Tree data patterns

| Pattern                                                                                                                                                                                                                                  | Where                                             | Enforced by                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Tree data.** `openTree` is the only entry: it resolves the session to a Viewer, opens the Tree and builds the entity groups; reads rows through a `ToView` (NFR-10). `treeAction` reads the cookie.                                    | `server/trees/`, `server/action.mts`              | `server/trees/__tests__/contract.ts`; `scripts/__tests__/scoping.test.ts` and ESLint `no-restricted-imports` |
| **Tree-scoped tables.** A table with `tree_id` has primary key `(tree_id, id)`, `version`, `created_at`, `updated_at`, composite foreign keys to other Tree-scoped tables, and a client-sent UUIDv7 `id`. Copy `server/db/TEMPLATE.sql`. | `server/db/TEMPLATE.sql`, `server/db/migrations/` | `server/db/__tests__/tree-scoped.test.ts`                                                                    |
| **Tree data stays private.** `privateJson()`, `no-store` rules, `[id]` only, memory only. Only TanStack Query fetches: `QUERY_FILES` in `scripts/safety.mts` lists its files.                                                            | `app/data/private-json.ts`                        | `scripts/__tests__/{json-routes,no-store,addresses,memory-only,fetch,tree-urls}.test.ts`                     |
| **Providers behind ports.** Supabase only in allowlisted files; Kysely over `pg`; plain Postgres, no row-level security.                                                                                                                 | `server/adapters.mts`                             | `scripts/__tests__/providers.test.ts`                                                                        |
