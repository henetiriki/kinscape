# Plan: DL.28.3: The map screen mounts the Panel with the Layers tab

- **Spec:** #1057
- **Requirement IDs:** [MAP-05](../docs/requirements.md#map-05), [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

A new `LayersBody` draws the two `LayerGroup` groups and the short `Legend`. `MapShell` mounts it in `Panel` on a desktop and in the Layers `Sheet` on a phone. Each `Layer` gets a `group` id. A `PANEL_GROUPS` constant gives each group its heading and row size, in panel order. `Legend` gets a `rows` prop; the live map passes the rows that it draws. `LayersPanel` goes. The polity layer name becomes "Polities" in code, data and tests (#1057 D3, D12).

## Components

| Part                        | Component                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| Side panel, tab head        | `Panel` (`features/map/components/`), with `Tabs`                              |
| Group heading and rows      | `LayerGroup` (`features/map/components/`)                                      |
| Legend                      | `Legend` (`features/map/components/`), new `rows` prop                         |
| Phone Layers sheet          | `Sheet` (`app/components/overlays/`)                                           |
| Body of the panel and sheet | `LayersBody` (`features/map/components/`), new: app composition, not a control |

## Decisions

**D1 · Where the shared body lives** · Decides: Tech lead

- **A.** A new `features/map/components/LayersBody.tsx` with its test. It takes the place of `LayersPanel.tsx`. Cost: one new file.
- ~~**B.** A local component in `MapShell.tsx`. Cost: `MapShell.tsx` (379 lines) grows by about 50.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

**D2 · The shape of the `Legend` prop** · Decides: Tech lead

- **A.** `rows?: LegendRow[]`, with the keys `border`, `approximate`, `contested`, `uncertain` and `events`. The default is all rows. BND-04 and EXP-02 add their key to the list of the live map. Cost: a type in `features/map/types.ts`.
- ~~**B.** `omit?: LegendRow[]`. Cost: the same keys in the inverse sense.~~
- ~~**C.** A `drawn` boolean. Cost: BND-04 and EXP-02 change what it means.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

**D3 · The shape of the `group` field** · Decides: Tech lead

`lib/design/samples.mts` already names a `LAYER_GROUPS` constant for the boards. The new constant takes another name.

- **A.** `group: LayerGroupId` (`'boundaries' | 'pins'`) on `Layer`. `PANEL_GROUPS` in `features/map/groups.ts` gives the heading and the row size of each id, in panel order. Cost: one new module.
- ~~**B.** `group: 'Boundaries'`, the heading text. Cost: UI text is the key.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

**D4 · Who runs steps 3 to 5 of Changing the design system** · Decides: Tech lead

- **A.** A signed-in local Claude Code session that the tech lead starts, on the branch.
- ~~**B.** The tech lead by hand.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

**D5 · The boards that hold the Sources rows** · Decides: Tech lead

`design/__tests__/sources-boards.test.ts` compares the Sources rows of `Map`, `Map-phone-states` and `Map-credits-narrow` with `data/sources.json`. The rename (D12 of #1057) makes the boards stale.

- **A.** Edit the `SOURCES` line of the three boards, then run step 7 of Changing the design system. Cost: more design-system work; the plan lists no board.
- ~~**B.** Keep "Polity borders" in `data/sources.json`. Cost: undoes #1057 D12.~~
- ~~**C.** Leave the three tests red. Cost: CI fails until a later session fixes the boards.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

**D6 · Two files that the plan did not list** · Decides: Tech lead

`Legend` takes a prop, so `scripts/__tests__/design-system.test.ts` ("`Legend` takes no prop") fails. The no-props branch of `scripts/design-system.mts` is dead, so coverage falls under 100%.

- **A.** Change the test to expect a props table for each control. Remove the dead branch. Cost: a small change to a script.
- ~~**B.** Change the test. Keep the branch under `v8 ignore`. Cost: an ignore comment.~~
- ~~**C.** Leave both red. Cost: CI fails.~~
- ~~**Other:** your own.~~

**Answer: A** (Tech lead)

## Alternatives considered

- `MapFrame` mounts `LayersBody`: rejected by #1057 D10. The boards keep three groups and the full legend.
- A Filters tab with inert fields: rejected by #1057 D1.

## Files that change

| File                                                                                                                   | New / changed | What                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `features/map/types.ts`                                                                                                | changed       | `LayerGroupId`, `group` on `Layer`, `LegendRow`                                                                                     |
| `features/map/groups.ts`                                                                                               | new           | `PANEL_GROUPS`: id, heading, row size                                                                                               |
| `features/map/layers/polities.ts`                                                                                      | changed       | `group: 'boundaries'`, `label: 'Polities'`, doc comment                                                                             |
| `features/map/layers/pins.ts`                                                                                          | changed       | `group: 'pins'`                                                                                                                     |
| `features/map/components/LayersBody.tsx`                                                                               | new           | Groups the layers by `PANEL_GROUPS`; one `LayerGroup` each with rows; `Legend` with the drawn rows                                  |
| `features/map/components/MapShell.tsx`                                                                                 | changed       | Desktop: `Panel` (label "Layers", one tab, `bodyId`) around `LayersBody`; phone `Sheet` holds `LayersBody`; `panel` prop still wins |
| `features/map/components/Legend.tsx`                                                                                   | changed       | `rows` prop; each row draws only if listed                                                                                          |
| `features/map/components/Credits.tsx`                                                                                  | changed       | `POLITY_LAYER = 'Polities'`                                                                                                         |
| `data/sources.json`                                                                                                    | changed       | Each `"layer": "Polity borders"` → `"Polities"`                                                                                     |
| `features/map/components/LayersPanel.tsx`, `.module.css`                                                               | removed       | No user left                                                                                                                        |
| `features/map/components/__tests__/LayersPanel.test.tsx`                                                               | removed       | Its cases move to `LayersBody.test.tsx`                                                                                             |
| `features/map/components/__tests__/LayersBody.test.tsx`                                                                | new           | Group order, headings, rows, help text for the Map date, toggles, the short legend (MAP-05)                                         |
| `features/map/components/__tests__/Legend.test.tsx`                                                                    | changed       | `rows` hides unlisted rows; the default shows all                                                                                   |
| `features/map/components/__tests__/MapShell.test.tsx`                                                                  | changed       | "Polities" names; panel has one tab "Layers"; phone sheet has groups and no tab list; `panel` prop replaces `Panel`                 |
| `features/map/components/__tests__/Credits.test.tsx`                                                                   | changed       | "Polities"                                                                                                                          |
| `features/map/__tests__/layers.test.ts`                                                                                | changed       | Label "Polities", `group` of each layer                                                                                             |
| `app/@map/__tests__/MapWithPins.test.tsx`                                                                              | changed       | Test name and label "Polities"                                                                                                      |
| `app/components/__tests__/onSurface.test.tsx`                                                                          | changed       | Row for `LayersPanel.module.css` → `Panel.module.css` `.panel`                                                                      |
| `lib/design/__tests__/design.test.ts`                                                                                  | changed       | Drop the `LayersPanel.module.css` literal row                                                                                       |
| `lib/design/off-token-sizes.json`                                                                                      | changed       | Drop the `LayersPanel.module.css` entry                                                                                             |
| `lib/design/states.mts`                                                                                                | changed       | State `Legend · drawn marks` with `rows`                                                                                            |
| `lib/design/__tests__/react-18-cases.tsx`                                                                              | changed       | Case for the new state                                                                                                              |
| `e2e/smoke.spec.ts`, `e2e/date-dock.spec.ts`, `e2e/design.spec.ts`, `e2e/map-desktop.spec.ts`, `e2e/map-phone.spec.ts` | changed       | Checkbox name "Polities"; desktop panel structure; phone sheet groups                                                               |
| `e2e/fixture-pins.spec.ts`                                                                                             | changed       | Pins row off hides the Pins, on shows them                                                                                          |
| `e2e/gallery-looks.spec.ts`                                                                                            | changed       | The new Legend state draws no hatch and no halo                                                                                     |
| `design/canvas/project/{Map,Map-phone-states,Map-credits-narrow}.dc.html`                                              | changed       | `SOURCES` rows: layer "Polities" (D5)                                                                                               |
| `scripts/__tests__/design-system.test.ts`, `scripts/design-system.mts`                                                 | changed       | Each control has a props table; the no-props branch goes (D6)                                                                       |
| `design/canvas/project/ds/**`                                                                                          | changed       | Steps 2 to 5 of Changing the design system (generated)                                                                              |

## Order of work

1. Tests first: `LayersBody.test.tsx`, the `Legend` `rows` cases and the "Polities" names fail.
2. Types, `groups.ts` and the `group` field on both layers.
3. `Legend` `rows`, its state and its React 18 case.
4. `LayersBody`, then `MapShell`. Remove `LayersPanel` and its rows in the design tests.
5. The rename in `polities.ts`, `Credits.tsx`, `data/sources.json` and the tests.
6. The e2e edits.
7. Changing the design system ([CANVAS.md](../design/CANVAS.md#changing-the-design-system)). Three boards hold the Sources rows (D5), so step 7 runs for them:
   1. Run `npm run design-system`.
   2. Run `/publish-design-system` (3.1 to 3.11). A signed-in local Claude Code session that the tech lead starts runs steps 2 to 4 (D4).
   3. Run "Updating the install" (4.1 to 4.6).
   4. Run "Refreshing the canvas copy" (5.1 to 5.5).
   5. Run steps 7.1 to 7.5 for the three boards. Push. Run the workflow Design: Render snapshots once.
8. Run the checks in `AGENTS.md`.

## Risks

- **The scale bar.** `Panel` sets `max-height: 100%` and `flex: 1`. `e2e/map-desktop.spec.ts` checks that the scale bar clears the panel.
- **The phone sheet height.** Two groups and the legend are taller than two rows. `Sheet` scrolls its body. `map-phone.spec.ts` checks that the sheet opens and the rows toggle.
- **Duplicate ids.** `Panel` and the phone `Sheet` never mount together, so one `bodyId` is safe.
- **Card images.** The rename changes the `Credits` and `SourcesList` cards. Step 7.5 renders them.

## Proof

| Acceptance check              | Proven by                                                         |
| ----------------------------- | ----------------------------------------------------------------- |
| 1 Panel, tab, groups          | `MapShell.test.tsx`; `e2e/map-desktop.spec.ts`                    |
| 2 Legend rows                 | `LayersBody.test.tsx`; `Legend.test.tsx`; `gallery-looks.spec.ts` |
| 3 Polities toggle and credits | `MapShell.test.tsx`; `e2e/smoke.spec.ts`                          |
| 4 Pins toggle                 | `MapShell.test.tsx`; `e2e/fixture-pins.spec.ts`                   |
| 5 Phone sheet                 | `MapShell.test.tsx`; `e2e/map-phone.spec.ts`                      |
| 6 Pin form in the slot        | `MapShell.test.tsx`                                               |
| 7 Sources list "Polities"     | `SourcesDialog` reads `data/sources.json`; `e2e/smoke.spec.ts`    |
| 8 Legend card states          | `lib/design/__tests__/bundle.test.ts`; `gallery-looks.spec.ts`    |
| 9 Scale bar                   | `e2e/map-desktop.spec.ts`                                         |
| 10 No `LayersPanel`           | `npm run lint:knip`; `git grep`                                   |
| 11 Checks                     | `npm test`, `typecheck`, `lint`, `lint:knip`, `e2e`               |

## Out of scope

- The Filters tab and a new panel name: #1058.
- The "Contested claim" and "Uncertain date" rows on the live map: BND-04, EXP-02.
- The Bug for the `Map` boards (#1057 D10): filed after the merge.

## Deviations

- Big: D5 edits three boards that the plan did not list, and step 7 runs for them.
- Big: D6 edits `scripts/__tests__/design-system.test.ts` and `scripts/design-system.mts`, which the plan did not list.
- `app/screens/map-frame.tsx`: its local `LayersPanel` is now `BoardPanel`, so no file names `LayersPanel` (check 10).
- `features/map/__tests__/style.test.ts` and `MapView.test.tsx`: each test `Layer` has a `group`.
- `LayersBody` leaves out a group that has no layer. `LayersBody.module.css` puts the legend at the bottom edge, as the `end` slot of `Panel` does.
