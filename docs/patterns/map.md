---
paths:
  - 'app/@map/**'
  - 'app/MapHost.tsx'
  - 'features/map/components/MapShell.tsx'
  - 'app/components/foundation/usePhone.ts'
  - 'features/map/filter.ts'
  - 'features/map/style.ts'
  - 'features/map/components/MapView.tsx'
  - 'features/map/types.ts'
  - 'features/map/layers/**'
---

# Map patterns

| Pattern                                                                                                                                                                                                               | Where                                                            | Enforced by                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **Persistent map.** The `@map` slot holds `MapShell`; `MapHost` shows or hides it.                                                                                                                                    | `app/@map/`, `MapHost.tsx`                                       | `navigation.spec.ts`                                          |
| **State in the shell, controlled children.** `MapShell` owns the Map date and map layer toggles; children are controlled; `usePhone` picks the form, the server renders desktop.                                      | `features/map/components/MapShell.tsx`, `foundation/usePhone.ts` | Review                                                        |
| **Load once, filter by expression.** All Boundary versions load once; a Map date change only sets filters (NFR-01).                                                                                                   | `features/map/filter.ts`, `style.ts`, `components/MapView.tsx`   | `@perf` e2e tests                                             |
| **Map layers.** A `Layer` holds id, label, description (text, or a function of the Map date), sources, style layers, `icons` and `filters(day)`; `visible[id]` defaults on; one panel row each; `MapView` names none. | `features/map/types.ts`, `layers/`                               | `features/map/__tests__/layers.test.ts` (`'use client'` each) |
