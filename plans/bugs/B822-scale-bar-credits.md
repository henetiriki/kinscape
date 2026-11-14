# Plan: B822: Scale bar has no design, and the credits line covers the date dock at some widths

- **Spec:** #822 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-08](../../docs/requirements.md#nfr-08)
- **Status:** draft

## Approach

On desktop, the `Stage` puts the `dock` and `credits` slots in one bottom column, with the credits under the dock (D1 A). The `credits` slot is at least `furniture-bottom` minus `credits-bottom` tall, so one line leaves the dock where it is now. Each extra line moves the dock up. `app/globals.css` places and styles MapLibre's scale bar from tokens (D2, D3). After the build, the design agent draws the design on the D4 boards.

By the CSS, two lines need 26px, and the credits have 22px. Step 1 checks this in a browser.

## Decisions

**D1 · Where the credits line goes when it wraps** · Decides: Tech lead

- **A.** The credits stay under the dock, and the dock moves up by each extra line. The Layers panel and `freeArea` do not move.
- **B.** The credits run from gutter to gutter, right-aligned, as in the `map-desktop` snapshot. Below about 820px they still wrap, and the panel and the dock both move up. The scale bar then takes D2 B.
- **Other:** your own.

Recommended: A, because it keeps the 1440px view the same.

**D2 · Where the scale bar sits on desktop** · Decides: Tech lead

- **A.** Under the Layers panel: left at the gutter, bottom at `credits-bottom`.
- **B.** In the free map area, at `dock-left`, 8px above the dock.
- **Other:** your own.

Recommended: A, because the strip under the panel is empty.

**D3 · How the scale bar looks** · Decides: Tech lead

- **A.** `type.credits` in `--credits` on a `--white-60` fill, with a 1px `--credits` rule on the left, bottom and right. MapLibre sets the distance and the width.
- **B.** The same, in `type.mono`.
- **Other:** your own.

Recommended: A, because it matches the credits line beside it.

**D4 · Which boards show the design** · Decides: Tech lead

- **A.** The design agent adds the scale bar to `Map.dc.html`. It draws a new board, `Map-credits-narrow.dc.html`: the bottom 120px of the map at 800px wide.
- **B.** The design agent adds the two to `SG-Furniture.dc.html`. The build adds them to `/design-kit/map-furniture`, and the blocking `style-8-components-map` snapshot checks them.
- **Other:** your own.

Recommended: A, because it adds no kit code.

## Files that change

| File                                               | New / changed | What                                                |
| -------------------------------------------------- | ------------- | --------------------------------------------------- |
| `features/map/components/Stage.tsx`, `.module.css` | changed       | The bottom column; the credits' minimum height      |
| `features/map/components/__tests__/Stage.test.tsx` | changed       | The column and the minimum height                   |
| `app/globals.css`                                  | changed       | The scale bar (D2, D3)                              |
| `e2e/map-desktop.spec.ts`                          | new           | The desktop rows in Proof                           |
| `e2e/map-phone.spec.ts`                            | changed       | The phone hides the scale bar                       |
| `design/canvas/project/` D4 boards, `VERSION`      | changed, new  | The design agent, then "Refreshing the canvas copy" |
| `design/source/` D4 snapshots, their JPGs          | changed, new  | Design: Render snapshots                            |

## Order of work

1. Write `e2e/map-desktop.spec.ts` at 640, 800, 1024, 1279, 1440 and 1920px wide. Run it on `main`. Record each failing width under Deviations.
2. Change `Stage`, then `app/globals.css`, then the phone check.
3. Run the checks in `AGENTS.md` › Commands and `npm run design:check`.
4. Push. The PR stays a draft. The tech lead has the design agent draw the D4 boards, then runs "Refreshing the canvas copy" and the render workflow.

## Risks

- At 640px the credits take about four lines, so the dock moves up about 48px.

## Proof

| Acceptance check                                 | Proven by                                               |
| ------------------------------------------------ | ------------------------------------------------------- |
| Credits clear of the dock, 640 to 1920px         | `e2e/map-desktop.spec.ts`                               |
| Every attribution and the link show and work     | `e2e/map-desktop.spec.ts` at 640px; `e2e/smoke.spec.ts` |
| Scale bar font, colour, place; clear of the rest | `e2e/map-desktop.spec.ts`                               |
| #104 on a phone                                  | `e2e/map-phone.spec.ts`                                 |
| #261 `Stage` slots                               | `Stage.test.tsx`, `MapShell.test.tsx`                   |
| NFR-08, BND-06, `SourcesDialog`                  | `Credits.test.tsx`, `SourcesDialog.test.tsx`, smoke     |
| Dock message 12px above the dock                 | `e2e/date-dock.spec.ts`                                 |
| Blocking snapshots                               | `npm run design:check`                                  |

## Deviations
