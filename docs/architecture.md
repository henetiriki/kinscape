# Architecture

How the code is built today: Next.js App Router, React, strict TypeScript, MapLibre. Every rule below is in the code; the _Enforced by_ column says what stops a break. Where the code is headed is in [architecture-target.md](architecture-target.md), which is proposed, not a rule.

## Where does X go

| Change                          | Put it in                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A screen or route               | `app/<route>/page.tsx`: composes components, no CSS of its own (`app/design-kit`, dev-only, is the exception) |
| Shared UI                       | `app/components/<role>/`: `foundation`, `actions`, `forms`, `feedback`, `overlays`                            |
| UI only the map or sign-in uses | `app/components/map/`, `app/components/auth/`                                                                 |
| Pure logic with no I/O          | `lib/map/`, `lib/boundaries/model.mts`, with tests in `__tests__/`                                            |
| Reading data files              | `lib/boundaries/load.mts` and `app-data.ts`: the only `lib/` code that does I/O                               |
| Design checks and token tooling | `lib/design/`; `tokens.mts` is also read at runtime by components                                             |
| A colour, size or font value    | `design/tokens.json`, then `npm run tokens`                                                                   |
| Boundary and name data          | `data/`; basemap files in `public/map/` (`npm run map:prepare`)                                               |
| A tool, check or CI helper      | `scripts/`, with its test beside it                                                                           |
| A browser test                  | `e2e/`                                                                                                        |
| A type shared by two modules    | `types.ts` beside them (also in `.mts` folders: Node erases `import type`); import it with `import type`      |

`.mts` marks a module that Node scripts import, such as `lib/boundaries/model.mts`. This is a habit, not enforced.

## Patterns

| Pattern                                                                                                                                                                                                                                                           | Where                                                               | Enforced by                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Tokens are the one source.** CSS variables, MapLibre paint values and map padding all read `design/tokens.json`.                                                                                                                                                | `lib/design/tokens.mts`, `lib/map/style.ts`, `Stage.tsx` `freeArea` | `lib/design/__tests__/design.test.ts` fails if the generated `app/tokens.css` is stale |
| **Components by role.** One folder per role, holding its components, their `.module.css` where they have styles, and a `__tests__/` folder. Imports use the full `@/app/components/<folder>/<Name>`.                                                              | `app/components/`                                                   | ESLint `no-restricted-imports`; [DESIGN.md](../design/DESIGN.md#components)            |
| **Variants are data attributes.** `data-size`, `data-state`, `data-form` and the like select the look in the component's CSS module; a rule several components share goes in its own module and is taken with `composes`.                                         | `Button.tsx`, `foundation/focus.module.css`                         | Review                                                                                 |
| **Slots.** A frame places named boxes over the map and switches between desktop and phone forms.                                                                                                                                                                  | `app/components/map/Stage.tsx`                                      | Review                                                                                 |
| **State in the shell, controlled children.** `MapShell` owns the Map date and layer toggles; children take a value and `onChange`. `usePhone` picks the form; the server renders desktop.                                                                         | `MapShell.tsx`, `foundation/usePhone.ts`                            | Review                                                                                 |
| **Functional core, imperative shell.** Pure functions in `lib/map` and `lib/boundaries/model.mts`; `MapView` is the only code that creates or drives the map; `lib/map/style.ts` and `filter.ts` build MapLibre styles and expressions, importing only its types. | `lib/map/`, `lib/boundaries/model.mts`, `MapView.tsx`               | Tests (100% coverage)                                                                  |
| **Temporal validity.** A date is an integer day since 1652-01-01; a range is half-open `[validFrom, validTo)`, null meaning current. `isCurrentOn` applies it in code; `dateFilter` repeats it as a MapLibre expression.                                          | `lib/boundaries/model.mts`, `lib/map/filter.ts`                     | Unit tests of each; none checks that the two agree                                     |
| **Load once, filter by expression.** All Boundary versions load once; a Map date change sets layer filters and fetches nothing (NFR-01).                                                                                                                          | `lib/map/filter.ts`, `style.ts`, `MapView.tsx`                      | `@perf` e2e tests                                                                      |
| **Reference data is files, validated.** `loadAppData` throws on bad data, which stops the build; `/data/polities` is built once at deploy.                                                                                                                        | `data/`, `lib/boundaries/app-data.ts`, `app/data/polities/route.ts` | `npm run validate:boundaries` in CI                                                    |
| **Living style guide.** `/design-kit` shows every component and is a 404 in production; `design/screens.json` pairs built screens with snapshots.                                                                                                                 | `app/design-kit/`, `e2e/design-check.spec.ts`                       | `npm run design:check`; `/match-design`                                                |
| **Traceability.** Tests carry `// MAP-03` style tags; plans and PRs cite IDs; code uses the Key concepts terms.                                                                                                                                                   | `docs/requirements.md`, `plans/`                                    | Review                                                                                 |

## Enforcement

- **Lint** (`eslint.config.mjs`): arrow functions only, exported types only in `types.ts` (or `types/*.d.ts`), no default exports outside Next.js files, sorted keys and imports, accessibility rules, full-path imports of components, type imports on their own `import type` line.
- **Fitness test:** `scripts/__tests__/vercel-imports.test.ts` fails when shipped code imports a path that doesn't deploy.
- **Not enforced:** which layer may import which. `app/components/{map,forms,overlays,auth}` import `lib/`, and `../` imports are allowed outside components.

Tests, hooks and word budgets: [AGENTS.md](../AGENTS.md). Security: [security.md](security.md). Workflow: [how-we-work.md](how-we-work.md).
