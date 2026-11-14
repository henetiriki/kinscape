# Plan: B820: Map zoom controls differ from the design and miss the Avatar

- **Spec:** #820
- **Requirement IDs:** [MAP-01](../../docs/requirements.md#map-01)
- **Status:** draft

## Approach

`MapShell` puts `ZoomControls` in the `Stage` `zoom` slot on desktop. `MapView` stays the only code that drives the map (D1). `MapView` drops `NavigationControl`, and `app/globals.css` drops its MapLibre top-right rules. `MAX_BOUNDS` stops zoom out at about 4.9 at 1440 × 900, not at `MIN_ZOOM` 3. So `MapView` sets the real minimum (D2). Fit calls the first-view `fitBounds` again.

## Components

| Part      | Component                                        |
| --------- | ------------------------------------------------ |
| Zoom card | `ZoomControls` (`features/map/components/`)      |
| Slot      | `Stage` `zoom` slot (`features/map/components/`) |

## Decisions

**D1 · How `MapShell` drives the zoom** · Decides: Tech lead

- **A.** `MapView` takes a `ref` with `zoomIn`, `zoomOut` and `fit` (`useImperativeHandle`). It reports `atMin` and `atMax` through `onZoomLimits` on each `zoomend` and `resize`.
- **B.** `MapView` renders `ZoomControls` into the `zoom` slot with `createPortal`.
- **C.** `MapShell` holds the MapLibre map. This breaks the "only `MapView` drives the map" pattern.
- **Other:** your own.

Recommended: A, because it keeps the architecture pattern, and `MapShell` keeps all slot content.

**D2 · Where Zoom out stops** · Decides: Tech lead

- **A.** A pure `coverZoom(bounds, width, height)` gives the smallest zoom at which the window fits inside `MAX_BOUNDS`. On load and `resize`, `MapView` calls `setMinZoom(Math.max(MIN_ZOOM, coverZoom(…)))`.
- **B.** Zoom out is `aria-disabled` only at `MIN_ZOOM`. At desktop sizes it never disables. The acceptance check changes.
- **Other:** your own.

Recommended: A, because only A meets the acceptance check.

## Files that change

| File                                                | New / changed | What                                                          |
| --------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| `lib/domain/map/zoom.mts`, `__tests__/zoom.test.ts` | New           | `coverZoom` (D2)                                              |
| `features/map/components/MapView.tsx`, its test     | Changed       | Drop `NavigationControl`; `ref`, `onZoomLimits`, minimum      |
| `features/map/components/MapShell.tsx`, its test    | Changed       | `ZoomControls` in the `zoom` slot, desktop only               |
| `app/globals.css`                                   | Changed       | Drop the `ctrl-group` focus and `ctrl-top-right` rules        |
| `e2e/map-phone.spec.ts`                             | Changed       | Lines 94 and 246 find "Zoom in" by role, not MapLibre's class |
| `e2e/map-zoom.spec.ts`                              | New           | The acceptance checks at 1440 × 900                           |

## Order of work

1. Write the failing e2e checks and `coverZoom` tests.
2. Add `coverZoom`, then the `MapView` changes, then `MapShell`.
3. Remove the `globals.css` rules.
4. Run the checks in `AGENTS.md` and `npm run design:check`.

## Risks

- MapLibre's `fitBounds` may add the map's padding to its own. The Fit test compares the centre and zoom with the first view's, so it fails if Fit drifts.
- If MapLibre's clamp under `maxBounds` differs from `coverZoom`, the minimum test fails. The build then reads MapLibre's constrain code and matches it.

## Proof

| Acceptance check                                     | Proven by                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Three buttons in the `zoom` slot; no MapLibre button | `map-zoom.spec.ts`; `MapShell.test.tsx`                                          |
| Card right edge = Avatar's; top = `furniture-top`    | `map-zoom.spec.ts` (bounding boxes)                                              |
| Zoom in and out change the zoom by one               | `map-zoom.spec.ts` (`kinscapeMap.getZoom()`)                                     |
| `aria-disabled` at a limit, in the Tab order, inert  | `map-zoom.spec.ts`; `MapView.test.tsx` (`onZoomLimits`)                          |
| Fit returns to the first view                        | `map-zoom.spec.ts` (centre and zoom against load)                                |
| Account menu paints above the card                   | `map-zoom.spec.ts` (`elementFromPoint` over the card)                            |
| No card on a phone                                   | `map-phone.spec.ts` line 94                                                      |
| MAP-01 pan and zoom                                  | `smoke.spec.ts`                                                                  |
| #572 account menu                                    | `account-menu.spec.ts`; `map-account-menu` snapshot                              |
| #186 `ZoomControls` and kit demo                     | `MapControls.test.tsx`; `map-furniture.spec.ts`                                  |
| #261 `Stage` slots                                   | `Stage.test.tsx`                                                                 |
| #104 phone hides zoom                                | `map-phone.spec.ts` line 94                                                      |
| `smoke.spec.ts` clicks "Zoom out"                    | `smoke.spec.ts`                                                                  |
| Scale bar unchanged                                  | `MapView.test.tsx` (`ScaleControl` once); `globals.css` keeps `ctrl-bottom-left` |

## Out of scope

- The scale bar and credits line (#822).

## Deviations
