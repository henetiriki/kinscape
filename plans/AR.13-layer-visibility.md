# Plan: AR.13: Layer visibility and the Layers panel

- **Spec:** #326
- **Requirement IDs:** MAP-05, NFR-01
- **Status:** approved

## Approach

`types.ts` adds `type LayerId = string`; a union would mean editing `types.ts` for every new layer. `Layer` gains `label` and `description`. `MapShell` builds `visible` from `layers`, all `true`, and passes `visible[polityLayer.id]` to `Credits` and the notice. `MapView` and `buildStyle` take `visible` and treat a layer as on unless its entry is `false`. In `LayersPanel.tsx`, `LayersRow` draws one layer's row, with its ids from `layer.id` (D1). A new `LayersList` renders one `LayersRow` per layer, and the panel and the phone sheet both use it, so with one layer the markup stays as it is. The fixture layer is proven in unit tests, not on the page, because a page edit would ship a fake row (D2).

## Decisions

**D1 · Where the polity row's `polity-borders` ids come from** · Decides: Tech lead

`polityLayer.id` is `polities`, but the Spec keeps the DOM ids `polity-borders` and `polity-borders-help`.

- **A.** Rename `polityLayer.id` to `polity-borders`. The row uses `id` and `${id}-help`. It matches a drawing-layer id, but DOM and MapLibre ids don't clash.
- **B.** Slugify `label`. Renaming a label would then change the ids, and two equal labels would clash.
- **C.** `Layer` gains a `rowId`. This adds a field the Spec doesn't list.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How the fixture layer is proven** · Decides: Tech lead

- **A.** `__tests__/test-layer.ts` holds the fixture. `MapShell.test.tsx` renders `[polityLayer, testLayer]` (the "one line"), and `MapView.test.tsx` draws and hides it.
- **B.** Also run it in e2e behind `NEXT_PUBLIC_E2E`. That adds shipped code for a test.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Rows on `LayerGroup`/`CheckboxField`: rejected because the markup changes and `design:check` would move.

## Files that change

| File                                                 | New / changed | What                                                                            |
| ---------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `features/map/types.ts`                              | changed       | `LayerId`; `label`, `description`                                               |
| `features/map/layers/polities.ts`                    | changed       | label, description; id (D1)                                                     |
| `features/map/style.ts`                              | changed       | `buildStyle(day, layers, visible = {})`                                         |
| `features/map/components/MapView.tsx`                | changed       | `visible` replaces `showPolities`                                               |
| `features/map/components/MapShell.tsx`               | changed       | `visible` state; polity entry to `Credits` and notice; `LayersList` in sheet    |
| `features/map/components/LayersPanel.tsx`            | changed       | `LayersRow` per layer; `LayersList`                                             |
| `features/map/__tests__/test-layer.ts`               | new           | fixture layer (D2)                                                              |
| `features/map/__tests__/{style,layers}.test.ts`      | changed       | record instead of boolean; `extra` gains label; polity label and description    |
| `features/map/components/__tests__/MapView.test.tsx` | changed       | `visible` prop; inline layers gain label; two-layer hide case                   |
| `MapShell.test.tsx`, `LayersPanel.test.tsx`          | changed       | `[polityLayer]` for `[]`; `visible` for `showPolities`; fixture row and toggle  |
| `docs/architecture.md`                               | changed       | **Map layers** row: label, description, `visible`; panel draws one row each     |
| `docs/architecture-target.md`                        | changed       | item 4 shrinks to `legendRow`, carried to the first second-layer Spec (Spec D1) |

## Order of work

1. Commit the plan.
2. Two-layer cases in `MapView.test.tsx` and `MapShell.test.tsx`. Paste the failure: the fixture's layers aren't hidden alone.
3. Types, `polityLayer`, `buildStyle`, `MapView`, `LayersPanel`, `MapShell`.
4. The listed test edits; both docs.
5. Every check below.

## Risks

- The style snapshot holds `layout.visibility`. With `visible = {}`, `buildStyle(7, [polityLayer])` stays unchanged, so the snapshot must not move.
- A new `visible` object on each toggle reruns every `setFilter`, as `showPolities` does today. `@perf` covers it.
- The phone sheet loses `aria-describedby`: `LayersPanel.test.tsx` checks the accessible name and the description on each row.

## Proof

| Acceptance check                           | Proven by                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Polity panel and sheet unchanged           | `npm run design:check`; e2e `smoke`, `map-phone`, `design` specs                  |
| Unticking one layer hides only its layers  | `MapView.test.tsx` two-layer case (MAP-05)                                        |
| Fixture row and toggle, one file, one line | `MapShell.test.tsx` fixture case; the diff adds only `test-layer.ts` for it       |
| `@perf` and NFR-01                         | `npm run e2e`                                                                     |
| Tests, lint, validator pass                | `npm test`, `npm run lint`, `npm run validate:boundaries`; tests edited as listed |

## Out of scope

A legend row per layer and pins: the first Spec that adds a second layer (M2). A district layer: M4.
