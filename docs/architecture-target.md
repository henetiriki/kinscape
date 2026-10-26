# Target architecture

**Status: proposed. None of this is a rule yet.** [architecture.md](architecture.md) says what the code does today. When an item below is built, move it there and delete it here. Each item ships as its own Spec or chore; the tech lead approves its plan.

Why: M2 adds sign-in, a database, an API and Tree-scoped data ([NFR-09](requirements.md#non-functional-requirements)). Today nothing enforces layering, `MapShell` holds all state, and adding a map layer edits three files.

## Layers

```
design tokens → components (no domain knowledge) → features/<name> → app/ routes (thin)
lib/domain (pure) ← server/ (I/O, `server-only`)
```

A lower layer never imports a higher one. A lint rule and a fitness test, in the style of `vercel-imports.test.ts`, enforce it.

## Before the database

1. **Layer rules and tidy-ups.** `@/` imports everywhere; a written rule for `.mts`; `lib/design` split into runtime (`tokens.mts`) and tooling.
2. **Feature slices.** `features/map`, then `people` and `pins`: each with `components/`, domain code, `queries`, `actions`, tests and an `index.ts` as its public API. `app/components` stays the shared kit.
3. **State ownership.** URL (shareable, MAP-10), then server, then a feature store, then local `useState`. `useMapState` reads `searchParams` through a schema.
4. **Map layer registry.** A layer is one file exporting `{ id, sources, layers, filters(day), legendRow, toggle }`; `MapView` iterates the registry, and visibility is `Record<LayerId, boolean>`.
5. **Schema-first validation.** One schema gives the type and the parser for the loader, route handlers, server actions and forms. Needs a validation library: the tech lead decides which ([dependencies](dependencies.md)).
6. **Domain primitives.** Branded ids (`PersonId`, `TreeId`), `Day`, a `FuzzyDate` value object, and an as-of helper built on `isCurrentOn`.

## With the database and API

7. **Ports and adapters.** Repository interfaces in the domain; adapters for files (Polity and Boundary version: global, read-only), the database (Tree data) and memory (tests).
8. **Tree-scoped repository.** Built from the session, so a tree id can't be left out ([security.md](security.md)).
9. **One wrapper for actions and route handlers:** authorise, validate, execute, revalidate, return `Result<T, E>`. Expected failures don't throw.
10. **Mapping.** Row to domain object to view model; raw rows never reach the client.
11. **Contract tests.** One suite runs against the memory and database adapters. Every entity's plan includes "Tree A can't read Tree B". Fixtures are synthetic.
12. **Platform.** A typed `env.ts` that splits server from `NEXT_PUBLIC_` and fails at boot; a logger that scrubs Person data; `loading`, `error` and `not-found` per route on `NoticeCard`.

## For agents

13. **Recipe skills:** add a component, add a map layer, add a Tree-scoped entity; each a checklist of files, tests and requirement IDs.
14. **Nested `AGENTS.md`** of a few lines in `features/`, `lib/domain` and `server/`.
15. **ADRs** in `docs/decisions/` for choices that outlive one plan.
16. **A naming test** that fails on synonyms for Key concepts terms, such as `User` or `Marker`.
