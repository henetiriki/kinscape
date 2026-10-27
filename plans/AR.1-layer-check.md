# Plan: AR.1: Layer check with a shrinking allowlist

- **Spec:** #314
- **Requirement IDs:** NFR-09
- **Status:** approved

## Approach

`scripts/layers.mts` holds the layer map, the allowlist and `layerBreak(file, specifier)`, which names the rule an import breaks. A file's layer comes from its path, so `features/`, `server/` and `lib/domain` are covered before they exist. `eslint.config.mjs` loads a local rule, `layers/imports`, from that module; Node 24 strips the types. The fitness test scans `app`, `lib`, `features` and `server` and checks that the breaks found match the allowlist exactly. Test files, `app/design-kit`, `scripts`, `e2e` and `lib/design` tooling are outside the map.

## Decisions

**D1 · How lint applies the map** · Decides: Tech lead

Which ESLint mechanism reads the layer map?

- **A.** A local rule that checks each import against the map. Feature-to-feature works for any name, and `no-restricted-imports` is untouched, so the component rules can't be overridden.
- **B.** `no-restricted-imports` blocks built from the map and merged with the component patterns. A feature needs a block of its own, so the map lists feature names.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Package imports** · Decides: Tech lead

`filter.ts` imports `maplibre-gl` types and `load.mts` imports `node:` modules; neither breaks a layer-to-layer rule. Which package imports break a layer?

- **A.** `lib/domain` may not import `node:` modules or `maplibre-gl`; no other package limits.
- **B.** Each layer lists the packages it may import.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Gaps in the table** · Decides: Tech lead

The table doesn't say whether `server/` may import itself, or where `app/components/map` sits before it moves.

- **A.** `server/` may import itself; `app/components/map` counts as the kit until it moves, so kit imports of it (`Chip`, `Menu`, `Popup`, `AuthLayout`, `overlays/types.ts`) aren't breaks yet.
- **B.** As A, but `app/components/map` counts as `features/map` now: five more allowlist entries.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                               | New / changed | What                                                                                                |
| ---------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `scripts/layers.mts`               | New           | Layer map, allowlist (path → where it moves), `layerOf`, `layerBreak`, the ESLint rule              |
| `scripts/__tests__/layers.test.ts` | New           | Fitness test, fixtures per layer, `RuleTester` cases, and `ESLint.lintText` against the real config |
| `eslint.config.mjs`                | Changed       | Register `layers/imports` for `app`, `lib`, `features`, `server`                                    |
| `docs/architecture.md`             | Changed       | Layer table and rule; replace "Not enforced"; link the allowlist                                    |
| `docs/architecture-target.md`      | Changed       | Remove _Layers_ and the breaks paragraph; item 1 keeps the tidy-ups                                 |

Allowlist: `app/components/map`, `lib/map/style.ts`, `lib/map/filter.ts`, `forms/DateField.tsx`, `overlays/SourcesDialog.tsx` (to `features/map`); `lib/boundaries/load.mts`, `app-data.ts` (to `server/`).

## Order of work

1. `layers.mts` with unit tests and fixtures.
2. Fitness test against the repo.
3. ESLint rule and config, with `RuleTester` and `lintText` tests.
4. Docs.

## Risks

- ESLint can't import `.mts`: fall back to `layers.mjs` with JSDoc types.
- The fitness test reads TypeScript imports only; CSS `composes` stays unchecked.

## Proof

| Acceptance check                                          | Proven by                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| Kit file importing `lib/` fails lint, naming the rule     | `lintText` on `app/components/forms/X.tsx`                   |
| `features/map` → `features/pins` fails lint and test      | `lintText` and fixture: "features never import each other"   |
| Listed breaks pass                                        | Fitness test on the repo; `npm run lint`                     |
| Fixed but listed break fails, says delete                 | Test with a fixture allowlist entry that breaks nothing      |
| New break fails, names the file                           | Fixture break not on the allowlist                           |
| Each layer fires on a forbidden import, passes an allowed | `it.each` fixtures for all six layers                        |
| Component rules unchanged                                 | `lintText`: `../` in a component, `./components/` in a route |
| Suite passes, no old test edited                          | `npm test`, lint, validator, `design:check`, `npm run e2e`   |

## Deviations

- The `lintText` tests sit in `scripts/__tests__/layers-config.test.ts` and import `eslint.config.mjs`: a second, native copy of `layers.mts` corrupts its coverage.

- `types/modules.d.ts` types it.
- An allowlist entry excuses only imports that are fine in the layer it moves to; mapped code may not import dev-only code.

## Out of scope

`@ks/` and `.mts` lint rules (AR.2); moving files (AR.8, AR.10, AR.11); database layers (M2).
