# Architecture

How the code is built today: Next.js App Router, React, strict TypeScript, MapLibre. Every rule below is in the code; the _Enforced by_ column says what stops a break. Where the code is headed is in [architecture-target.md](architecture-target.md), which is proposed, not a rule.

## Where does X go

| Change                          | Put it in                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| A screen or route               | `app/<route>/page.tsx`: composes components, no CSS of its own                     |
| Shared UI                       | `app/components/<role>/`: `foundation`, `actions`, `forms`, `feedback`, `overlays` |
| UI only the map or sign-in uses | `app/components/map/`, `app/components/auth/`                                      |
| Pure logic with no I/O          | `lib/<area>/` (`boundaries`, `map`), with its tests in `__tests__/`                |
| A colour, size or font value    | `design/tokens.json`, then `npm run tokens`                                        |
| Boundary and name data          | `data/`; basemap files in `public/map/` (`npm run map:prepare`)                    |
| A tool, check or CI helper      | `scripts/`, with its test beside it                                                |
| A browser test                  | `e2e/`                                                                             |

`.mts` marks a module that Node scripts import, such as `lib/boundaries/model.mts`. This is a habit, not enforced.

## Patterns

| Pattern                                                                                                                                                                                   | Where                                                               | Enforced by                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Tokens are the one source.** CSS variables, MapLibre paint values and map padding all read `design/tokens.json`.                                                                        | `lib/design/tokens.mts`, `lib/map/style.ts`, `Stage.tsx` `freeArea` | `lib/design/__tests__/design.test.ts` fails if the generated `app/tokens.css` is stale |
| **Components by role.** One folder per role; each component has its `.module.css` and test beside it. Imports use the full `@/app/components/<folder>/<Name>`.                            | `app/components/`                                                   | ESLint `no-restricted-imports`; [DESIGN.md](../design/DESIGN.md#components)            |
| **Variants are data attributes.** `data-size`, `data-state` and `data-form` select the look; shared rules use `composes`.                                                                 | `Button.tsx`, `Button.module.css`                                   | Review                                                                                 |
| **Slots.** A frame places named boxes over the map and switches between desktop and phone forms.                                                                                          | `app/components/map/Stage.tsx`                                      | Review                                                                                 |
| **State in the shell, controlled children.** `MapShell` owns the Map date and layer toggles; children take a value and `onChange`. `usePhone` picks the form; the server renders desktop. | `MapShell.tsx`, `foundation/usePhone.ts`                            | Review                                                                                 |
| **Functional core, imperative shell.** Pure functions in `lib/`; `MapView` is the only code that touches MapLibre.                                                                        | `lib/map/`, `lib/boundaries/model.mts`, `MapView.tsx`               | 100% coverage; a `v8 ignore` needs a reason                                            |
| **Temporal validity.** A date is an integer day since 1652-01-01; a range is half-open `[validFrom, validTo)`, null meaning current. Every dated thing uses `isCurrentOn`.                | `lib/boundaries/model.mts`                                          | Unit tests                                                                             |
| **Load once, filter by expression.** All Boundary versions load once; a Map date change sets layer filters and fetches nothing (NFR-01).                                                  | `lib/map/filter.ts`, `style.ts`, `MapView.tsx`                      | `@perf` e2e tests                                                                      |
| **Reference data is files, validated.** `loadAppData` throws on bad data, which stops the build; `/data/polities` is built once at deploy.                                                | `data/`, `lib/boundaries/app-data.ts`, `app/data/polities/route.ts` | `npm run validate:boundaries` in CI                                                    |
| **Living style guide.** `/design-kit` shows every component and is a 404 in production; `design/screens.json` pairs built screens with snapshots.                                         | `app/design-kit/`, `e2e/design-check.spec.ts`                       | `npm run design:check`; `/match-design`                                                |
| **Traceability.** Tests carry `// MAP-03` style tags; plans and PRs cite IDs; code uses the Key concepts terms.                                                                           | `docs/requirements.md`, `plans/`                                    | Review                                                                                 |

## Rules that stop a bad change

- **Lint** (`eslint.config.mjs`): arrow functions only, no default exports outside Next.js files, keys and imports sorted, accessibility rules, no `../` imports in components.
- **Tests:** Vitest at 100% coverage on `app`, `lib` and `scripts`; Playwright in `e2e/`.
- **Fitness test:** `scripts/__tests__/vercel-imports.test.ts` fails when shipped code imports a path that doesn't deploy.
- **Pre-commit** (`.husky/`): ESLint and Prettier on staged files. **Word budgets:** `scripts/word-count.mts`.
- Layering between `app/` and `lib/`, and `../` imports outside components, are not enforced.

Security rules: [security.md](security.md). Workflow: [how-we-work.md](how-we-work.md).
