# Plan: B822: Scale bar has no design, and the credits line covers the date dock at some widths

- **Spec:** #822 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-08](../../docs/requirements.md#nfr-08)
- **Status:** approved

## Approach

On desktop, the `Stage` puts the `dock` and `credits` slots in one bottom column. The credits collapse to one line with an expand control (D1), so the dock stays put. The design agent draws both states (D4) before the build of `Credits`.

## Decisions

**D1 · Where the credits line goes when it wraps** · Decides: Tech lead

**Answer: Other** (tech lead). The credits collapse to one line with an expand control. The design agent draws it. Requirements:

- One line from 640 to 1920px. It never covers the dock.
- One control expands it to the attribution text of the sources on screen. A keyboard user reaches it, and it sets `aria-expanded`.
- Expanding moves nothing: the dock, the Layers panel and `freeArea` stay in place.
- The "Attributions" link to the dialog stays (NFR-08).
- The design agent decides the rest: label, icon, place, phone layout.

~~**A.** Credits under the dock; the dock moves up.~~ ~~**B.** Credits gutter to gutter.~~

**D2 · Where the scale bar sits on desktop** · Decides: Tech lead

- **A.** Under the Layers panel: left at the gutter, bottom at `credits-bottom`.
- **B.** In the free map area, at `dock-left`, 8px above the dock.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · How the scale bar looks** · Decides: Tech lead

- **A.** `type.credits` in `--credits` on a `--white-60` fill, with a 1px `--credits` rule on the left, bottom and right. MapLibre sets the distance and the width.
- **B.** The same, in `type.mono`.
- **Other:** your own.

**Answer: Other:** - let the design step decide (@henetiriki)

**D4 · Which boards show the design** · Decides: Tech lead

- **A.** The design agent adds the scale bar to `Map.dc.html`. It draws a new board, `Map-credits-narrow.dc.html`: the bottom 120px of the map at 800px wide, with the credits collapsed and expanded. The phone boards follow D1.
- **B.** The design agent adds the two to `SG-Furniture.dc.html`. The build adds them to `/design-kit/map-furniture`, and the blocking `style-8-components-map` snapshot checks them.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                       | New / changed | What                                                |
| ---------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `features/map/components/Stage.tsx`, `.module.css`, test   | changed       | The bottom column                                   |
| `features/map/components/Credits.tsx`, `.module.css`, test | changed       | The expand control (D1)                             |
| `design/DESIGN.md`                                         | changed       | The Attributions credits rule                       |
| `app/globals.css`                                          | changed       | The scale bar (D2, D3)                              |
| `e2e/map-desktop.spec.ts`                                  | new           | The desktop rows in Proof                           |
| `e2e/map-phone.spec.ts`                                    | changed       | The phone hides the scale bar                       |
| `design/canvas/project/` D4 boards, `VERSION`              | changed, new  | The design agent, then "Refreshing the canvas copy" |
| `design/source/` D4 snapshots, their JPGs                  | changed, new  | Design: Render snapshots                            |

## Order of work

1. Write `e2e/map-desktop.spec.ts` at 640, 800, 1024, 1279, 1440 and 1920px wide. Run it on `main`. Record each failing width under Deviations.
2. Change `Stage`, then `app/globals.css`, then the phone check.
3. Push. The PR stays a draft. The tech lead has the design agent draw the D4 boards, then runs "Refreshing the canvas copy" and the render workflow.
4. Change `Credits` to match the snapshots, and update `design/DESIGN.md`. Run the checks in `AGENTS.md` › Commands and `npm run design:check`.

## Risks

- A later source whose licence needs always-visible credit breaks the collapsed line. Each licence check (NFR-08) catches it.

## Proof

| Acceptance check                                  | Proven by                                               |
| ------------------------------------------------- | ------------------------------------------------------- |
| Credits clear of the dock, 640 to 1920px          | `e2e/map-desktop.spec.ts`                               |
| Every attribution shows on expand; the link works | `e2e/map-desktop.spec.ts` at 640px; `e2e/smoke.spec.ts` |
| Scale bar font, colour, place; clear of the rest  | `e2e/map-desktop.spec.ts`                               |
| #104 on a phone                                   | `e2e/map-phone.spec.ts`                                 |
| #261 `Stage` slots                                | `Stage.test.tsx`, `MapShell.test.tsx`                   |
| NFR-08, BND-06, `SourcesDialog`                   | `Credits.test.tsx`, `SourcesDialog.test.tsx`, smoke     |
| Dock message 12px above the dock                  | `e2e/date-dock.spec.ts`                                 |
| Blocking snapshots                                | `npm run design:check`                                  |

## Deviations

- Step 1 on `main`: the credits check failed at 640, 800 and 1024px. The scale bar check failed at every width.
- `Stage` does not change. The collapsed line never wraps, so the slot never grows. The one-line clip in `Stage.module.css` is gone, because it hid the expanded card.
- At the tech lead's request, a local session drew the D4 boards (canvas version 1794689008-e1f4), then built `Credits`.
- `Credits` takes `collapsible`. The phone keeps the full text line, because the Bug says #104 keeps the phone.
- Two more test edits: `lib/design/__tests__/screens.test.ts` (two `NOT_BUILT` names) and `scripts/__tests__/design-export.test.ts` (92 snapshots, not 90). Both follow the two new boards.
- `e2e/smoke.spec.ts` changed: the credits text sits behind the "Credits" button on desktop.
- The `DESIGN.md` edit needs no design-system publish. After `npm run design-system`, every published file matches the canvas copy.
- D3 design: `type.credits` in `--credits` on `--white-60`, with a 1px `--credits` rule on the left, bottom and right.
- D1 design: the line reads "Credits" with the `info` icon, "·" and "Attributions". The expanded text is a card above the line, over the dock's corner.
- The phone boards stay as they are, because the Bug says #104 keeps the phone.
