# Plan: C619: Fitness tests for Tree scoping, the sign-in gate and the client/server boundary

- **Chore:** #619
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

Three checks in `scripts/safety.mts`, tested over the repo and fixtures; `eslint.config.mjs` reads the same lists. Scoping: `appAdapters` only in `server/action.mts`, `auth/current.mts` and `trees/`; `TreeStore`'s Tree methods only in `server/trees/`; `app/` and `features/` take values from `server/` only via those, `app-data` and `repository.mts`. Gate: the matcher skips named extensions; every route is public, or matched and checking the session itself (D4). Boundary: `server-only` opens each entry point; `'use client'` files import no value from `server/`.

## Decisions

**D1 · The sign-in action's adapters** · Decides: Tech lead

- **A.** `auth/current.mts` gains `signIn` and `signOut`; the action imports those.
- ~~**B.** Allowlist the file.~~

**Answer: A** (@henetiriki)

**D2 · `/data/` under the gate** · Decides: Tech lead

- **A.** The matcher covers it; the proxy answers 401 with no cookie.
- ~~**B.** Keep the skip.~~

**Answer: A** (@henetiriki)

**D3 · Where `server-only` goes** · Decides: Tech lead

- **A.** `action.mts`, `adapters.mts`, `auth/current.mts`, `app-data.ts`; not `env.mts`, `database.mts` (Node scripts import them).
- ~~**B.** Those too, with `--conditions=react-server`.~~

**Answer: A** (@henetiriki)

**D4 · Gated layouts** · Decides: Tech lead

- **A.** Every page calls `requireSession()` (new in `auth/current.mts`): a layout's redirect doesn't stop its page rendering.
- ~~**B.** The proxy makes the full check, or layouts keep counting.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                                                           | What                        |
| ------------------------------------------------------------------------------ | --------------------------- |
| `scripts/safety.mts`, `sources.mts`, `types.ts`, their tests, `layers.test.ts` | Checks, lint rule, fixtures |
| `eslint.config.mjs`, `scripts/__tests__/layers-config.test.ts`                 | Import rules                |
| `proxy.ts`, `__tests__/proxy.test.ts`, `e2e/gate.spec.mts`                     | Matcher; D2; e2e            |
| `server/auth/current.mts`, `app/sign-in/actions.ts`, their tests               | D1                          |
| `server/action.mts`, `adapters.mts`, `docs/architecture.md`                    | D3; docs                    |
| `app/design-kit/**/page.tsx`, `app/screens/add-pin/page.tsx`, their tests      | D4                          |

## Order of work

1. Checks and tests; the repo fails.
2. D1–D4, ESLint, proxy, e2e, docs.
3. Break each rule for Evidence.

## Deviations

- `app/components/` is outside the ESLint scoping block (the layer rule covers it).
- The session check is per file.
- `gate.spec.mts`: `.ts` specs load as CommonJS.
