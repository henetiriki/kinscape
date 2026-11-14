# Plan: B822: Scale bar has no design, and the credits line covers the date dock at some widths

- **Spec:** #822 (Bug)
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-08](../../docs/requirements.md#nfr-08)
- **Status:** approved

## Approach

On desktop, the `Stage` puts the `dock` and `credits` slots in one bottom column. The credits collapse to one line with an expand control (D1), so the dock does not move. The design agent draws both states (D4) first.

## Decisions

**D1 · Where the credits line goes when it wraps** · Decides: Tech lead

**Answer: Other** (tech lead). The credits collapse to one line with an expand control. The design agent draws it. Requirements:

- One line from 640 to 1920px. It never covers the dock.
- One control expands it to the attribution text. A keyboard user reaches it, and it sets `aria-expanded`.
- Expanding moves nothing.
- The "Attributions" link stays (NFR-08).
- The design agent decides the rest.

~~**A.** Credits under the dock; the dock moves up.~~ ~~**B.** Credits gutter to gutter.~~

**D2 · Where the scale bar sits on desktop** · Decides: Tech lead

**Answer: A** (@henetiriki). Under the Layers panel: left at the gutter, bottom at `credits-bottom`. ~~**B.** In the free map area.~~

**D3 · How the scale bar looks** · Decides: Tech lead

**Answer: Other** (@henetiriki). The design step decides. ~~**A.** `type.credits` on `--white-60`, 1px rule.~~ ~~**B.** The same, in `type.mono`.~~

**D4 · Which boards show the design** · Decides: Tech lead

**Answer: A** (@henetiriki). The design agent adds the scale bar to `Map.dc.html`. It draws `Map-credits-narrow.dc.html`: the bottom 120px at 800px wide, collapsed and expanded. ~~**B.** `SG-Furniture.dc.html`.~~

**D5 · Share the dismiss logic** · Decides: Tech lead

**Answer: A** (@henetiriki, in the review). One `useDismiss` hook serves `Menu`, `DateField` and `Credits`. ~~**B.** Dismiss the finding; file a Chore.~~ ~~**C.** A hook for `Credits` only.~~

## Files that change

| File                                                       | New / changed | What                                    |
| ---------------------------------------------------------- | ------------- | --------------------------------------- |
| `features/map/components/Stage.tsx`, `.module.css`, test   | changed       | The bottom column                       |
| `features/map/components/Credits.tsx`, `.module.css`, test | changed       | The expand control (D1)                 |
| `features/map/components/MapShell.tsx`, test               | changed       | `collapsible={!phone}`                  |
| `app/components/overlays/useDismiss.ts`, test              | new           | Esc and press-outside close (D5)        |
| `Menu.tsx`, `DateField.tsx`                                | changed       | Use `useDismiss`                        |
| `design/canvas/project/ds/`                                | changed       | The bundle (design system steps 2 to 5) |
| `e2e/smoke.spec.ts`                                        | changed       | The "Credits" button                    |
| `lib/design/__tests__/`, `scripts/__tests__/` design tests | changed       | 92 snapshots                            |
| `design/DESIGN.md`                                         | changed       | The Attributions credits rule           |
| `app/globals.css`                                          | changed       | The scale bar (D2, D3)                  |
| `e2e/map-desktop.spec.ts`                                  | new           | The desktop rows in Proof               |
| `e2e/map-phone.spec.ts`                                    | changed       | The phone hides the scale bar           |
| `design/canvas/project/` D4 boards, `VERSION`              | changed, new  | Design agent, then canvas refresh       |
| `design/source/` D4 snapshots, their JPGs                  | changed, new  | Design: Render snapshots                |

## Order of work

1. Write `e2e/map-desktop.spec.ts` at 640, 800, 1024, 1279, 1440 and 1920px wide. Run it on `main`. Record each failing width under Deviations.
2. Change `Stage`, then `app/globals.css`, then the phone check.
3. Push. The PR stays a draft. The tech lead has the design agent draw the D4 boards, then runs "Refreshing the canvas copy" and the render workflow.
4. Change `Credits` to match the snapshots, and update `design/DESIGN.md`.
5. Add `useDismiss` and use it in `Menu`, `DateField` and `Credits` (D5). Run steps 2 to 6 of Changing the design system.
6. Run the checks in `AGENTS.md` › Commands and `npm run design:check`.

## Risks

- A later source whose licence needs always-visible credit breaks the collapsed line. Each licence check (NFR-08) catches it.
- D5 changes the design system bundle: one publish cycle, no board change.

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
- `Stage` does not change. The one-line clip in `Stage.module.css` is gone, because it hid the expanded card.
- A local session drew the D4 boards (canvas version 1794689008-e1f4), then built `Credits`.
- `Credits` takes `collapsible`. The phone keeps the full text line (#104).
- D1 design: "Credits" with the `info` icon, "·" and "Attributions". The expanded text is a card above the line.
