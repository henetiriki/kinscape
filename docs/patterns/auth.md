---
paths:
  - 'proxy.ts'
  - 'server/auth/current.mts'
  - 'server/auth/sessions.mts'
  - 'server/action.mts'
  - 'server/adapters.mts'
  - 'server/boundaries/app-data.ts'
---

# Sign-in and boundary patterns

| Pattern                                                                                                                                                                                                                                                  | Where                                                                        | Enforced by                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Sign-in gate.** `proxy.ts` checks a cookie exists (except static file types); `requireSession()` per page and `currentSession()` per route handler is the full check. Visibility and auth checks go in the page or `openTree`, never only in a layout. | `proxy.ts`, `server/auth/current.mts`, `sessions.mts`                        | `scripts/__tests__/gate.test.ts`, `__tests__/proxy.test.ts`, `e2e/gate.spec.mts` |
| **Client/server boundary.** `server-only` opens each server entry point; a `'use client'` file imports no value from `server/`.                                                                                                                          | `server/{action,adapters}.mts`, `auth/current.mts`, `boundaries/app-data.ts` | `scripts/__tests__/boundary.test.ts`; ESLint `safety/client-imports`             |
