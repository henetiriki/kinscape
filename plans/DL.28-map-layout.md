# Plan: DL.28: MapLayout: the map frame joins the design system

- **Spec:** #924
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

`git mv` moves `Stage.tsx`, its stylesheet and its test to `app/components/layout/`, with the name `MapLayout`. `freeArea` moves in the same file. The slots, `overlayAt` and the CSS rules stay the same. The root class `.stage` becomes `.layout`, as in `SignInLayout`, so no class names the old component. The card follows `SignInLayout`: group "Layout", `width: 1440`, `contain`, `frame: 480` (DL.27 D1). Its one state puts a `Text` in each of the eight slots. The board swap follows DL.27: D1 says how a board fills a named slot, and D2 says the order of step 7.

## Decisions

**D1 · How the boards fill the slots and the drawn map** · Decides: Tech lead

The exporter reads a named prop only from `renderVals()`. It throws on an `<svg>` inside an `<x-import>` (`contents` in `scripts/design-export.mts`). The drawn map is an `<svg>`, and each slot is a named prop. #925 item 2 copies the answer to its 14 boards.

- **A.** `renderVals()` builds each slot. A real component is `React.createElement(KinScape.<Name>, props)`. The drawn map, the Layers panel, the credits line and the open account menu are strings that `dangerouslySetInnerHTML` mounts, as DL.27 D2 did for the hero. The map goes in `children`. Cost: the canvas cannot edit the drawn parts. The drawn Layers and Filters tabs lose their click. `this.state.tab` still picks the panel string, so `map-desktop-filters` keeps its pixels.
- **B.** The drawn map stays as markup under the frame, a sibling and not a child. Only the slots come from `renderVals()`. Cost: Behaviour item 5 and check 10 change, so the Spec changes.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Order of step 7** · Decides: Tech lead

A local session cannot start Chromium, so it cannot check the export or the pixels.

- **A.** Swap the two boards in the repo copy first. CI renders them. If none of the 13 JPGs changes, publish the boards to the canvas. This is the DL.27 D3 order.
- **B.** Swap on the canvas first, then refresh the repo copy. Cost: a failed board is already on the canvas.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                                | New / changed  | What                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `features/map/components/Stage.tsx`, `.module.css`, `__tests__/Stage.test.tsx` → `app/components/layout/MapLayout*` | Moved, changed | New name, class `.layout`, import paths; same rules and tests          |
| `features/map/components/{MapShell,MapView}.tsx` and their tests                                                    | Changed        | Import `MapLayout` and `freeArea` from the new path                    |
| `features/map/index.ts`                                                                                             | Changed        | No `Stage` export                                                      |
| `app/screens/add-pin/page.tsx`, `app/screens/map-account-menu/AccountMenuScreen.tsx`                                | Changed        | Use `MapLayout`                                                        |
| `AddPinPanel.module.css`, `AccountMenu.tsx`, `LayersPanel.module.css`                                               | Changed        | Comments name `MapLayout`                                              |
| `lib/design/bundle.mts`                                                                                             | Changed        | `CONTROLS` gains `MapLayout` after `SignInLayout`                      |
| `lib/design/cards.mts`                                                                                              | Changed        | `PHONE_CARDS` gains `MapLayout`; its comment says eleven               |
| `lib/design/states.mts`                                                                                             | Changed        | The card: one state, a `Text` in each slot                             |
| `lib/design/__tests__/{bundle.test.ts,react-18.test.tsx}`, `scripts/__tests__/design-system.test.ts`                | Changed        | 53 → 54 controls; one React 18 case; line 1 of the `MapLayout` preview |
| `design/DESIGN.md`, `docs/architecture.md`                                                                          | Changed        | Name `MapLayout` (Layout section, `layout` row, two pattern rows)      |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`, `design/cards/MapLayout-{1440,390}.png`                      | Changed        | Steps 2 to 6                                                           |
| `design/canvas/project/{Map,Map-phone}.dc.html`, the 13 snapshots in `design/source/` and their JPGs                | Changed        | Step 7. The nine wrapper boards import these two, so they need no edit |

## Order of work

1. `git mv` the three files. Rename the component, the class and the paths. Update the importers, the index and the comments. Run `npm test` and `npm run e2e`. Commit.
2. Set the control count in `bundle.test.ts` to 54 with `MapLayout`. See it fail on the count. Add `CONTROLS`, `PHONE_CARDS`, the card, the React 18 case and the `design-system.test.ts` lines. Run `npm run design-system` (step 2) and `npm run design:gallery`. Commit.
3. Update `design/DESIGN.md` and `docs/architecture.md`. Push. Keep the PR a draft. Ask in it for steps 3 to 7.
4. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5 (`/publish-design-system`, "Updating the install", "Refreshing the canvas copy"). The session needs a signed-in account.
5. The tech lead runs Design: Render snapshots (step 6).
6. The same person or session swaps `Map` and `Map-phone` with the [board swap prompt](../design/COMPONENTS.md#board-swap-prompt), by D1 and D2. It refreshes the canvas copy. The tech lead runs the workflow again (step 7).

## Risks

- The real `SearchBar` or `DateDock` can differ from the drawn copy by a pixel. Check 11 keeps the drawn slot and files a Bug.
- `Map-phone` mounts `DateDock` with `sheet`. The board passes `{ expanded, onExpandedChange: noop }`.
- Estimate: about 200 changed lines, without the moved lines, the plan, the boards and the generated files. The size cap is not near.

## Proof

| Acceptance check | Proven by                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| 1                | `npm run design:check`; `git diff main -- design/screens.json` is empty                                         |
| 2                | `npm run e2e`; `git diff main -- e2e` is empty                                                                  |
| 3                | `git grep -w Stage -- app features lib scripts design/DESIGN.md` is empty                                       |
| 4                | `MapLayout.test.tsx` holds the eight tests of `Stage.test.tsx`                                                  |
| 5                | `bundle.test.ts`, `react-18.test.tsx`                                                                           |
| 6                | `scripts/__tests__/design-system.test.ts`; line 1 of `.design-system/project/components/MapLayout/preview.html` |
| 7                | `git ls-files design/cards/MapLayout-*`                                                                         |
| 8                | The PR lists who ran each step                                                                                  |
| 9                | `sha256sum` of both trees in the PR                                                                             |
| 10               | The two board files; `git diff --name-only <commit before the swap> HEAD -- 'design/*.jpg'` is empty            |
| 11               | The PR names each kept slot or board, with its Bug                                                              |
| 12               | `npm test`, `npm run typecheck`, `npm run lint`                                                                 |

## Out of scope

As the Spec says.

## Deviations
