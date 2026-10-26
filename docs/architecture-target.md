# Target architecture

**Status: proposed. None of this is a rule yet.** [architecture.md](architecture.md) says what the code does today. When an item below is built, move it there and delete it here. Each item ships as its own Spec or chore; the tech lead approves its plan.

Why: M2 adds sign-in, a database, an API and Tree-scoped data ([NFR-09](requirements.md#non-functional-requirements)). Today nothing enforces layering, `MapShell` holds all state, and adding a map layer edits three files.

## Layers

| Layer             | Holds                                                                                  | May import                                                                         |
| ----------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `design`          | `design/tokens.json` and `resolveTokens` (today `lib/design/tokens.mts`)               | nothing                                                                            |
| `lib/domain`      | pure logic and types                                                                   | itself                                                                             |
| `server/`         | file and database access, session, `env.ts`, logger, the action wrapper; `server-only` | `lib/domain`                                                                       |
| `app/components`  | the shared UI kit                                                                      | `design`, itself                                                                   |
| `features/<name>` | that feature's UI, queries and actions                                                 | `design`, `lib/domain`, `server/`, `app/components`, itself; never another feature |
| `app/` routes     | thin pages, route handlers, server actions                                             | everything above; a route composes features                                        |

Features don't import each other: a route passes one feature's output to another (for example, the map takes its layers as props).

Today's breaks, which the lint rule lists as an allowlist and the work below empties: `app/components/map` and `lib/map/style.ts`, `filter.ts` (move to `features/map`); `forms/DateField` (imports `lib/map`); `overlays/SourcesDialog` (imports `lib/boundaries`); `lib/boundaries/load.mts` and `app-data.ts` (file I/O; move to `server/`). `app/design-kit` is dev-only and exempt. `app/page.tsx` and `app/data/polities/route.ts` break nothing: routes may import `lib/domain` and `server/`.

## Before the database

1. **Layer rules and tidy-ups.** Enforce the table with a lint rule and a fitness test in the style of `vercel-imports.test.ts`. `@/` imports everywhere; a written rule for `.mts`; `lib/design` split into runtime (`tokens.mts`) and tooling.
2. **Feature slices.** `features/map`, then `people` and `pins`: each with `components/`, domain code, `queries`, `actions`, tests and an `index.ts` as its public API. `app/components` stays the shared kit.
3. **State ownership.** URL (shareable, MAP-10), then server, then a feature store, then local `useState`. `useMapState` reads `searchParams` through a schema.
4. **Map layer registry.** A layer is one file exporting `{ id, sources, layers, filters(day), legendRow, toggle }`; `MapView` iterates the layers it is given, the route passes in each feature's layer, and visibility is `Record<LayerId, boolean>`.
5. **Schema-first validation.** One schema gives the type and the parser for the loader, route handlers, server actions and forms. Needs a validation library: the tech lead decides which ([dependencies](dependencies.md)).
6. **Domain primitives.** Branded ids (`PersonId`, `TreeId`), `Day`, a `FuzzyDate` value object, and an as-of helper built on `isCurrentOn`, with a test that `dateFilter` agrees with it.

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
16. **A naming test** that fails when the repo declares a type, function or component named for a synonym of a Key concepts term (`User` for Account, `Marker` for Pin). It scans declarations only, so MapLibre's `Marker` and a sign-in library's `User` pass.
