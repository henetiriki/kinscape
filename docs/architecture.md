# Architecture

Built: Next.js App Router, React, TypeScript, MapLibre.

## Where does X go

| Change                          | Put it in                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A screen or route               | `app/<route>/page.tsx` ([page rule](../design/topics/components.md#in-the-repo); lint: `no-restricted-syntax`)   |
| Shared UI                       | `app/components/<role>/`                                                                                         |
| UI only the map or sign-in uses | `features/map/components/`, `app/components/auth/`                                                               |
| UI the kit and features share   | `lib/ui/`                                                                                                        |
| A feature's UI and engine       | `features/<name>/`                                                                                               |
| A map layer                     | `features/<name>/layers/<layer>.ts`, exported by `index.ts`; routes pass layers to `MapShell`                    |
| Pure logic, no I/O              | `lib/domain/`, tests in `__tests__/`                                                                             |
| Reading data files              | `server/boundaries/load.mts` and `app-data.ts`                                                                   |
| A server variable or table      | `server/env.mts` (lint: `no-restricted-syntax`); a new `server/db/migrations/NNNN.sql` (never edit)              |
| Tree data                       | `server/trees/`, behind `openTree`: its `TreeStore` methods, group and mapper                                    |
| Design checks and token tooling | `lib/design/` (dev-only), with the Style Dictionary hooks; the runtime `resolveTokens` is in `design/tokens.mts` |
| A colour, size or font value    | `design/kinscape.tokens.json` + `$description`, then `npm run tokens` ([path](../design/topics/tokens.md))       |
| Boundary and name data          | `data/`; basemap files in `public/map/` (`npm run map:prepare`)                                                  |
| A tool, check or CI helper      | `scripts/`, tests in `__tests__/`                                                                                |
| A browser test                  | `e2e/`                                                                                                           |
| A type shared by two modules    | `types.ts` beside them (`import type`, also in `.mts`)                                                           |

Import repo paths by alias: `#ks/` in `.mts` and `.mjs` files, `@ks/` elsewhere. ESLint rejects the other alias, relative paths and `.ts`/`.tsx` imports (`.mts`: values only).

## Patterns

| Pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Where                                                                                                                                                                                                                  | Enforced by                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tokens are the one source.** `npm run tokens` writes `app/tokens.css` and `design/tokens.json` from `design/kinscape.tokens.json`. MapLibre paint values and map padding read `design/tokens.json`. In a `.module.css` file, a literal that equals a token of its property's group uses `var(--token)`. If the value is a part's own dimension, the literal carries `/* own: <reason> */` in its place. A value that two parts share with no token gets a token in the same Spec, through [Changing the design system](../design/CANVAS.md#changing-the-design-system). | `design/tokens.mts`, `lib/design/css.mts`, `lib/design/dtcg.mts`, `lib/design/style-dictionary.mts`, `lib/design/literals.mts`, `lib/design/sizes.mts`, `features/map/style.ts`, `layers/`, `MapLayout.tsx` `freeArea` | `lib/design/__tests__/design.test.ts` fails if `app/tokens.css` or `design/tokens.json` is stale or the source breaks the DTCG rules; `lib/design/__tests__/literals.test.ts` fails on a token literal; `lib/design/__tests__/sizes.test.ts` fails on a new off-token size; Review for each `own:` reason |
| **Traceability.** Tests carry `// MAP-03` tags; plans and PRs cite IDs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `docs/requirements.md`, `plans/`                                                                                                                                                                                       | Review                                                                                                                                                                                                                                                                                                    |

Each area has a file in `docs/patterns/`. A session loads it when it reads a matching file.

- [Component patterns](patterns/components.md): `app/components/**`, `app/Links.tsx`, `lib/ui/EventGlyph.tsx`, `features/people/components/FuzzyDateField.tsx`, `features/people/components/PersonField.tsx`, `features/map/components/DateField.tsx`, `features/map/components/SearchBar.tsx`, `features/map/components/ZoomControls.tsx`, `features/map/components/LayersButton.tsx`, `features/map/components/AddPinButton.tsx`, `features/map/components/DateDock.tsx`, `features/map/components/Legend.tsx`, `features/map/components/CountMarker.tsx`, `features/map/components/PinFan.tsx`, `features/map/components/Panel.tsx`, `features/map/components/LayerGroup.tsx`, `features/map/components/FilterFields.tsx`, `features/map/components/SourcesDialog.tsx`, `features/map/components/Credits.tsx`
- [Map patterns](patterns/map.md): `app/@map/**`, `app/MapHost.tsx`, `features/map/components/MapShell.tsx`, `app/components/foundation/usePhone.ts`, `features/map/filter.ts`, `features/map/style.ts`, `features/map/components/MapView.tsx`, `features/map/types.ts`, `features/map/layers/**`
- [Domain patterns](patterns/domain.md): `lib/domain/**`, `features/map/components/MapView.tsx`, `features/map/filter.ts`, `server/boundaries/load.mts`
- [Reference data patterns](patterns/data.md): `data/**`, `server/boundaries/app-data.ts`, `app/data/polities/route.ts`
- [Tree data patterns](patterns/tree-data.md): `server/trees/**`, `server/action.mts`, `server/db/TEMPLATE.sql`, `server/db/migrations/**`, `app/data/private-json.ts`, `server/adapters.mts`
- [Sign-in and boundary patterns](patterns/auth.md): `proxy.ts`, `server/auth/current.mts`, `server/auth/sessions.mts`, `server/action.mts`, `server/adapters.mts`, `server/boundaries/app-data.ts`
- [Dev screen patterns](patterns/dev-screens.md): `app/screens/**`, `e2e/design-check.spec.ts`
- [CI image patterns](patterns/ci-images.md): `docker/*/Dockerfile`

## Enforcement

- **Lint** (`eslint.config.mjs`): arrow functions only, exported types only in `types.ts`, alias imports by extension; the config lists the rest.
- **knip** (`knip.ts`, in `npm run lint:knip`): unused files, exports, types and dependencies. `knip --production` also fails on an export that only a test uses. If a later slice wires an export, tag it `/** @later #<issue> */`.
- **Fitness tests** (`scripts/__tests__/`): `vercel-imports` (undeployed imports), `later-tags` (`@later` tags with no issue).
- **Layers** (`scripts/layers.mts`, ESLint rule `layers/imports`, test `layers.test.ts`): a layer may import only the layers in its row. `lib/domain` may not import Node built-ins or `maplibre-gl`. `features/` holds only feature folders, imported from outside through `index.ts`. Layer code may not import tests, `app/screens`, `scripts`, `e2e` or `lib/design`.
  | Layer             | Holds                                  | May import                                                                                   |
  | ----------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
  | `design`          | `design/`                              | nothing                                                                                      |
  | `lib/domain`      | pure logic and types                   | itself                                                                                       |
  | `server/`         | file and database access               | `lib/domain`, itself                                                                         |
  | `lib/ui`          | UI the kit and features share          | `design`, itself                                                                             |
  | `app/components`  | the shared UI kit                      | `design`, `lib/ui`, itself                                                                   |
  | `features/<name>` | that feature's UI, queries and actions | `design`, `lib/domain`, `server/`, `app/components`, `lib/ui`, itself; never another feature |
  | `app/` routes     | pages, route handlers, server actions  | everything above                                                                             |
