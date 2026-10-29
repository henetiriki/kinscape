# Target architecture

**Status: proposed. None of this is a rule yet.** [architecture.md](architecture.md) says what the code does today. When an item below is built, move it there and delete it here. Each item ships as its own Spec or chore; the tech lead approves its plan.

Why: M2 adds sign-in, a database, an API and Tree-scoped data ([NFR-09](requirements.md#non-functional-requirements)). Still missing: a database, a feature slice for people and pins, and state ownership (`MapShell` holds all state).

Layers are enforced: see [architecture.md](architecture.md#enforcement). Features don't import each other: a route passes one feature's output to another (for example, the map takes its layers as props).

## Before the database

1. **Feature slices.** `people` and `pins`, each with `components/`, domain code, `queries`, `actions` and tests, per [architecture.md](architecture.md#where-does-x-go).
2. **State ownership.** URL (shareable, MAP-10), then server, then a feature store, then local `useState`. `useMapState` reads `searchParams` through a schema.
3. **Map layer `legendRow`.** A layer also exports a `legendRow`; the first Spec that adds a second layer carries it.
4. **Domain primitives.** Branded ids (`PersonId`, `TreeId`), a branded `Day`, and a `FuzzyDate` value object.

## With the database and API

5. **Ports and adapters.** Repository interfaces in the domain; adapters for files (Polity and Boundary version: global, read-only), the database (Tree data) and memory (tests).
6. **Tree-scoped repository.** Built from the session, so a tree id can't be left out ([security.md](security.md)).
7. **One wrapper for actions and route handlers**, in `server/`: authorise, validate, execute, revalidate, return `Result<T, E>`. Expected failures don't throw.
8. **Mapping.** Row to domain object to view model; raw rows never reach the client.
9. **Contract tests.** One suite runs against the memory and database adapters. Every entity's plan includes "Tree A can't read Tree B". Fixtures are synthetic.
10. **Platform**, with the session in `server/`. A typed `env.ts` that splits server from `NEXT_PUBLIC_` and fails at boot; a logger that scrubs Person data; `loading`, `error` and `not-found` per route on `NoticeCard`.

## For agents

11. **Recipe skills:** add a component, add a map layer, add a Tree-scoped entity; each a checklist of files, tests and requirement IDs.
12. **Nested `AGENTS.md`** of a few lines in `features/`, `lib/domain` and `server/`.
13. **ADRs** in `docs/decisions/` for choices that outlive one plan.
14. **A naming test** that fails when the repo declares a type, function or component named for a synonym of a Key concepts term (`User` for Account, `Marker` for Pin). It scans declarations only, so MapLibre's `Marker` and a sign-in library's `User` pass.
