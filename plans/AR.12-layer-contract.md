# Plan: AR.12: Layer contract and the polity layer

- **Spec:** #325
- **Requirement IDs:** MAP-04, NFR-01
- **Status:** draft

## Approach

A snapshot of today's `buildStyle(7, true)` is committed first, so the refactor is proven against the old code, not a copy of it. `Layer` goes in `features/map/types.ts`; `polityLayer` moves the source, the four drawing layers and `polityFilters` out of `style.ts`. `buildStyle(day, layers, visible = true)` places each drawing layer ahead of its `before` basemap layer or at the end, strips `before`, and sets `visibility`. The third argument keeps today's first render when `showPolities` starts false. `MapView` loops over `layers` and each layer's `filters(mapDay)` where it now loops over `POLITY_LAYERS`.

## Decisions

**D1 · How the page hands a layer to the client map** · Decides: Tech lead

`app/page.tsx` is a Server Component and `MapShell` a Client Component. Next.js throws when a Server Component passes a function as a prop (`node_modules/next/dist/docs/01-app/02-guides/server-and-client-boundary.md`), and `filters(day)` is one.

- **A.** `layers/polities.ts` starts with `'use client'`, so the page passes a client reference that resolves to the real object in the browser. The Spec stands. Every layer file needs the directive; a unit test checks each file in `features/map/layers/`.
- **B.** Filters become data: each drawing layer names `{ kind, extra }` and `MapView` calls `dateFilter`. Rewords the Spec's `filters(day)`; a layer filtered on anything else needs a contract change.
- **C.** `MapShell` imports `polityLayer`; the page is unchanged. Simplest, but the page no longer picks the layers; rewords the Spec's page line.
- **Other:** your own.

Recommended: A, because it keeps the Spec's contract and page line, and React allows a `'use client'` module's exports as props.

## Files that change

| File                                                    | New / changed | What                                                                                      |
| ------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `features/map/types.ts`                                 | new           | `Layer`, `DrawingLayer` (a MapLibre layer with optional `before`)                         |
| `features/map/layers/polities.ts`                       | new           | `polityLayer`: source, four drawing layers, `filters`                                     |
| `features/map/style.ts`                                 | changed       | basemap only; `buildStyle(day, layers, visible)`; `POLITY_LAYERS`, `polityFilters` go     |
| `features/map/components/{MapView,MapShell}.tsx`        | changed       | `layers` prop                                                                             |
| `features/map/index.ts`, `app/page.tsx`                 | changed       | export and pass `polityLayer`                                                             |
| `features/map/__tests__/style.test.ts`, `__snapshots__` | changed, new  | snapshot; `polityFilters` cases move to `layers.test.ts`                                  |
| `features/map/__tests__/layers.test.ts`                 | new           | polity filters; `'use client'` check (D1 A)                                               |
| `features/map/components/__tests__/MapView.test.tsx`    | changed       | ids written out instead of `POLITY_LAYERS`; `layers` prop; test-layer case                |
| `MapShell.test.tsx`, `app/__tests__/page.test.tsx`      | changed       | expect `layers`                                                                           |
| `lib/design/__tests__/design.test.ts`                   | changed       | no-colour-literal list adds `layers/polities.ts`, where the paint values move             |
| `docs/architecture.md`                                  | changed       | _Where does X go_ row "A map layer"; a **Layers** pattern row; `style.ts` mentions follow |

## Order of work

1. Commit the plan.
2. Snapshot test of `buildStyle(7, true)` on today's code, committed alone.
3. Test-layer case in `MapView.test.tsx`; paste its failure (the filter isn't set).
4. Types, `polityLayer`, `buildStyle`, `MapView`, `MapShell`, page, index.
5. Listed test changes; architecture doc.
6. Every check below.

## Risks

- D1 A fails only on a real page render: `npm run build` and the e2e specs that load `/` catch it.
- A leftover `before` key is an unknown property MapLibre rejects: the snapshot fails on it.

## Proof

| Acceptance check                                   | Proven by                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| `buildStyle(day, [polityLayer])` deep-equals today | step 2's snapshot, unchanged in the diff, now called with `[polityLayer]`       |
| Same `setFilter` calls per layer id                | `MapView.test.tsx` "refilters every polity layer", ids written out              |
| A test layer's filters apply                       | `MapView.test.tsx` test-layer case                                              |
| NFR-01 budget                                      | `npm run e2e` including `@perf`                                                 |
| Test, lint, design check pass                      | `npm test`, `npm run lint`, `npm run design:check`; tests edited only as listed |

## Out of scope

Per-layer visibility, the panel and legend rows: AR.13 (#326).
