# Target architecture

**Status: proposed. None of this is a rule yet.** [architecture.md](architecture.md) says what the code does today. When an item below is built, move it there and delete it here. Each item ships as its own Spec or chore; the tech lead approves its plan.

Why: M2 adds sign-in, a database, an API and Tree-scoped data ([NFR-09](requirements.md#non-functional-requirements)). Today `MapShell` holds all state.

Layers are enforced: see [architecture.md](architecture.md#enforcement). Features don't import each other: a route passes one feature's output to another (see [where does X go](architecture.md#where-does-x-go)).

## Before the database

1. **Feature slices.** `people` and `pins`, each with `components/`, domain code, `queries`, `actions` and tests, per [architecture.md](architecture.md#where-does-x-go).
2. **State ownership.** URL (shareable, MAP-10), then server, then a feature store, then local `useState`. `useMapState` reads `searchParams` through a schema.
3. **Map layer `legendRow`.** A layer also exports a `legendRow`; the first Spec that adds a second layer carries it.
4. **Domain primitives.** Branded ids (`PersonId`, `TreeId`), and a branded `Day`.

## With the database and API

5. **Ports and adapters.** Adapters for files (Polity and Boundary version: global, read-only); `TreeStore` is built (see [architecture.md](architecture.md#patterns)).
6. **Every entity's plan includes "Tree A can't read Tree B"**, run through the contract suite.
7. **Platform**, with the session in `server/`. A typed `env.ts` that splits server from `NEXT_PUBLIC_` and fails at boot; a logger that scrubs Person data; `loading`, `error` and `not-found` per route on `NoticeCard`.

## For agents

8. **Recipe skills:** add a component, add a map layer, add a Tree-scoped entity; each a checklist of files, tests and requirement IDs.
9. **Nested `AGENTS.md`** of a few lines in `features/`, `lib/domain` and `server/`.
10. **ADRs** in `docs/decisions/` for choices that outlive one plan.
11. **A naming test** that fails when the repo declares a type, function or component named for a synonym of a Key concepts term (`User` for Account, `Marker` for Pin). It scans declarations only, so MapLibre's `Marker` and a sign-in library's `User` pass.
