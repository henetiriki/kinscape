# Plan: C619: Fitness tests for Tree scoping, the sign-in gate and the client/server boundary

- **Chore:** #619
- **Requirement IDs:** [NFR-03](../../docs/requirements.md#nfr-03), [NFR-10](../../docs/requirements.md#nfr-10)
- **Status:** approved

## Approach

Three checks in `scripts/safety.mts`, each with a test over the repo and over fixtures (the `scripts/layers.mts` pattern); `eslint.config.mjs` reads the same lists. Scoping: `appAdapters` only in `server/action.mts`, `auth/current.mts` and `trees/`; the Tree methods of `TreeStore` only in `server/trees/`; `app/` and `features/` take values from `server/` only via those entry points, `app-data` and `repository.mts`. Gate: the matcher skips named file extensions; every route is public, or matched and checking the session (a `layout.tsx` above counts). Boundary: `server-only` opens each entry point; a `'use client'` file imports no value from `server/`.

## Decisions

**D1 · The sign-in action's adapters** · Decides: Tech lead

- **A.** `server/auth/current.mts` gains `signIn(raw)` and `signOut()`; the action imports only those.
- ~~**B.** Allowlist the file.~~

**Answer: A** (@henetiriki)

**D2 · `/data/` under the gate** · Decides: Tech lead

- **A.** The matcher covers it; with no cookie the proxy answers 401 there.
- ~~**B.** Keep the skip; accept an unmatched `route.ts` that checks the session.~~

**Answer: A** (@henetiriki)

**D3 · Where `server-only` goes** · Decides: Tech lead

- **A.** `action.mts`, `adapters.mts`, `auth/current.mts`, `app-data.ts`; not `env.mts` and `database.mts`, which scripts import under Node, where it throws.
- ~~**B.** Those too, with `--conditions=react-server`.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | What                        |
| ---------------------------------------------------------------- | --------------------------- |
| `scripts/safety.mts`, `sources.mts`, their tests                 | Checks, lint rule, fixtures |
| `eslint.config.mjs`, `scripts/__tests__/layers-config.test.ts`   | Import rules                |
| `proxy.ts`, `__tests__/proxy.test.ts`, `e2e/gate.spec.mts`       | Extensions; D2; every route |
| `server/auth/current.mts`, `app/sign-in/actions.ts`, their tests | D1                          |
| `server/action.mts`, `adapters.mts`, `docs/architecture.md`      | D3; test names in the rows  |

## Order of work

1. Checks and tests; see the repo fail.
2. D1–D3, ESLint, `proxy.ts`, e2e, docs.
3. Break each rule for the PR's Evidence.

## Deviations

- `app/components/` stays out of the ESLint scoping block: the layer rule covers it.
- The e2e is `gate.spec.mts`: a `.ts` spec loads as CommonJS, where `import.meta` fails.
