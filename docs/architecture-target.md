# Target architecture

**Status: proposed. None of this is a rule yet.** [architecture.md](architecture.md) says what the code does today. When an item below is built, move it there and delete it here. Each item ships as its own Spec or chore; the tech lead approves its plan.

Why: M2 adds sign-in, a database, an API and Tree-scoped data ([NFR-09](requirements.md#non-functional-requirements)). Today nothing enforces layering, `MapShell` holds all state, and adding a map layer edits three files.

Layers are enforced: see [architecture.md](architecture.md#enforcement). The work below empties the allowlist. Features don't import each other: a route passes one feature's output to another (for example, the map takes its layers as props).

## Before the database

1. **Tidy-ups.** `@/` imports everywhere; a written rule for `.mts`.
2. **Feature slices.** `features/map`, then `people` and `pins`: each with `components/`, domain code, `queries`, `actions`, tests and an `index.ts` as its public API. `app/components` stays the shared kit.
3. **State ownership.** URL (shareable, MAP-10), then server, then a feature store, then local `useState`. `useMapState` reads `searchParams` through a schema.
4. **Map layer registry.** A layer is one file exporting `{ id, sources, layers, filters(day), legendRow, toggle }`; `MapView` iterates the layers it is given, the route passes in each feature's layer, and visibility is `Record<LayerId, boolean>`.
5. **Domain primitives.** Branded ids (`PersonId`, `TreeId`), `Day`, a `FuzzyDate` value object, and an as-of helper built on `isCurrentOn`, with a test that `dateFilter` agrees with it.

## With the database and API

7. **Ports and adapters.** Repository interfaces in the domain; adapters for files (Polity and Boundary version: global, read-only), the database (Tree data) and memory (tests).
8. **Tree-scoped repository.** Built from the session, so a tree id can't be left out ([security.md](security.md)).
9. **One wrapper for actions and route handlers**, in `server/`: authorise, validate, execute, revalidate, return `Result<T, E>`. Expected failures don't throw.
10. **Mapping.** Row to domain object to view model; raw rows never reach the client.
11. **Contract tests.** One suite runs against the memory and database adapters. Every entity's plan includes "Tree A can't read Tree B". Fixtures are synthetic.
12. **Platform**, with the session in `server/`. A typed `env.ts` that splits server from `NEXT_PUBLIC_` and fails at boot; a logger that scrubs Person data; `loading`, `error` and `not-found` per route on `NoticeCard`.

## For agents

13. **Recipe skills:** add a component, add a map layer, add a Tree-scoped entity; each a checklist of files, tests and requirement IDs.
14. **Nested `AGENTS.md`** of a few lines in `features/`, `lib/domain` and `server/`.
15. **ADRs** in `docs/decisions/` for choices that outlive one plan.
16. **A naming test** that fails when the repo declares a type, function or component named for a synonym of a Key concepts term (`User` for Account, `Marker` for Pin). It scans declarations only, so MapLibre's `Marker` and a sign-in library's `User` pass.
