# Plan: DL.28.4: The credits line joins the design system

- **Spec:** #1074
- **Requirement IDs:** None. The Spec changes the design system, the export and two boards, and no screen.
- **Status:** approved

## Approach

**The component.** `Credits` gains `defaultOpen?: boolean`, the first value of its `open` state. The app does not set it. In `Credits.module.css`, each button of both forms takes `position: relative` and `z-index: 1` (D3), and a `::before` hit area with the declarations of `TextLink` (D2). The `::before` uses `min-width`, not `max()`, because the export refuses `max()`. `MapLayout.module.css` does not change (D4).

**The card.** Add `Credits` to `CONTROLS` after `SourcesList`, so that the group "Map" holds 11 cards.

| Field      | Value                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `box`      | `SHEET_BOX`, `'358px'`: the phone credits box. It holds the 300px open card.                                                                                 |
| `design`   | `['Credits line', 'Credits card']`                                                                                                                           |
| `handlers` | `['onOpenAttributions']`                                                                                                                                     |
| `pad`      | From the render, so that the open card stays inside its case. Start value 100.                                                                               |
| `height`   | From the render. Start value 400.                                                                                                                            |
| States     | `Credits · one line` (`collapsible`), `Credits · open` (`collapsible`, `defaultOpen`), `Credits · full text`. Each has `showPolities` and `sources.sources`. |

The card has no `width` and does not join `PHONE_CARDS`. The comment of `SHEET_BOX` names `Credits`.

**`DESIGN.md`.** In › Attributions, the line bullet starts with the bold name "Credits line", and the card bullet with "Credits card". The words of each bullet do not change.

**The clip.** `CanvasSnapshot` gains `clip?: { height; width; x; y }` in viewport px. Before it renders, `exportSnapshots` throws `<name>: the clip is not inside the viewport` for a bad clip (check 7). A new page function `clipPage` runs after `inlineStyles` and before `pageHtml`. It moves the body content into an inner box at `-x`, `-y`, with the viewport size. An outer box of the clip size with `overflow: hidden` holds it. Each value is px, so `snapshotProblems` passes. An entry with no clip skips `clipPage` (check 6). `shotFor` does not change, so each JPG keeps 1440 × 900. `design/CANVAS.md` › Making the snapshots and JPGs gets two sentences on the `clip`.

**The boards** (step 7):

- `Map.dc.html`: the `MapLayout` import gains `credits="{{credits}}"`. When `chrome` is true, `renderVals` returns `h(K.Credits, { collapsible: true, onOpenAttributions: noop, showPolities: true, sources: SOURCES_DIALOG.sources })`. The drawn line goes, and the scale bar stays.
- `Map-credits-narrow.dc.html`: the frame is 800 × 900 and mounts `KinScape.MapLayout`. `panel` holds `Panel` with the Layers tab, its three `LayerGroup` and `Legend`, as `Map.dc.html` gives them. `dock` holds `DateDock` with the props of `Map.dc.html`. `credits` holds `Credits` from a `const SOURCES = [ … ];` line (D1), with `defaultOpen` in the `open` variant. The map is the frame's background. The two drawn boxes, the drawn line and the drawn card go. The scale bar stays as markup.
- `export.json`: both `map-credits-narrow` entries take `viewport` 800 × 900 and `clip` `{ x: 0, y: 780, width: 800, height: 120 }`.

## Decisions

**D1 to D4** have answers on #1074: D1 B, D2 A, D3 A, D4 A. The Approach follows them.

**D5 · The canvas size of the two narrow boards** · Decides: Tech lead

On `main`, the frame, both `$preview` values, the wrapper's `hint-size` and both tiles in `canvas.json` are 800 × 120. Behaviour 7 and 8 make the frame 800 × 900, and only the export clips it. No related issue holds a value for these sizes.

- **A.** The frame, both `$preview` values, `hint-size` and both tiles take 800 × 900. The session sets the tiles when it publishes the boards, and step 5 copies `canvas.json`. Cost: the two tiles on the "states" page grow by 780px.
- **B.** Only the frame changes. Cost: the canvas tiles show the top 120px of the frame, which has no credits line.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D6 · The narrow board calls no board helper** · Decides: Tech lead

Behaviour 11 says that a board that calls a helper loads `./board-helpers.js`, and that the test lists both narrow boards. `Map-credits-narrow.dc.html` builds its slots with `React.createElement` and calls neither `drawn` nor `mount`. On `main`, `FRAMES` in `board-helpers.test.ts` lists "the boards that call a helper". DL.28.1 plan D6 kept both narrow boards out of it.

- **A.** Neither narrow board loads the helpers, and the test does not list them. Cost: the build rewords Behaviour 11 of #1074.
- **B.** Both boards load the helpers, and `FRAMES` lists `Map-credits-narrow`. The test finds the wrapper through its `<dc-import>`. The `FRAMES` comment says "call a helper or mount `MapLayout`". Cost: one script line that the board does not use.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A frame of 800 × 120 that moves `MapLayout` up by 780px. The Spec chose the `clip`.
- A clip in `shotFor`. Then the HTML snapshot keeps the whole frame, and check 6 fails.

## Files that change

| File                                                                            | New / changed | What                                                                                     |
| ------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `features/map/components/Credits.tsx`                                           | changed       | `defaultOpen`.                                                                           |
| `features/map/components/Credits.module.css`                                    | changed       | D2 hit area, D3 `z-index`.                                                               |
| `features/map/components/__tests__/Credits.test.tsx`                            | changed       | `defaultOpen` opens the card and sets `aria-expanded`. Without it, the card is closed.   |
| `lib/design/bundle.mts`, `states.mts`                                           | changed       | `Credits` in `CONTROLS` and `CARDS`.                                                     |
| `lib/design/__tests__/bundle.test.ts`                                           | changed       | 59 controls, with `Credits`.                                                             |
| `lib/design/__tests__/cards.test.ts`                                            | changed       | Groups `[14, 6, 8, 11, 8, 9, 3]`.                                                        |
| `lib/design/__tests__/react-18.test.tsx`                                        | changed       | One import, one `COMPONENTS` entry, three cases.                                         |
| `scripts/__tests__/design-system.test.ts`                                       | changed       | The two `toHaveLength(58)` become 59.                                                    |
| `scripts/types.ts`                                                              | changed       | `CanvasSnapshot.clip`.                                                                   |
| `scripts/design-export.mts`                                                     | changed       | The clip check, `clipPage`, and its call in the main block.                              |
| `scripts/__tests__/design-export.test.ts`                                       | changed       | `clipPage` in jsdom. A clip outside the viewport throws and names the snapshot.          |
| `e2e/map-desktop.spec.ts`                                                       | changed       | Check 17: at 1440 × 800, a point 21px above the centre of each `Credits` button hits it. |
| `design/DESIGN.md`                                                              | changed       | Two bold names.                                                                          |
| `design/CANVAS.md`                                                              | changed       | The `clip`.                                                                              |
| `docs/architecture.md`                                                          | changed       | The React 18 row names `Credits`.                                                        |
| `design/__tests__/sources-boards.test.ts`                                       | changed       | D1: a second `it.each` on the `SOURCES` line of `Map-credits-narrow`.                    |
| `design/__tests__/board-helpers.test.ts`                                        | changed       | Only with D6 B: `FRAMES` and its comment.                                                |
| `design/canvas/export.json`                                                     | changed       | Step 7: viewport and `clip` of the two narrow entries.                                   |
| `design/canvas/project/Map.dc.html`, `Map-credits-narrow.dc.html`               | changed       | Step 7.                                                                                  |
| `design/canvas/project/Map-credits-narrow-open.dc.html`                         | changed       | Step 7: `$preview` and `hint-size` (D5 A), the script line (D6 B).                       |
| `design/cards/Credits-1440.png`, `design/source/map-*.html`, `design/map-*.jpg` | new, changed  | The workflow writes them.                                                                |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`                           | changed       | Steps 4, 5 and 7 of Changing the design system.                                          |

## Order of work

1. Change the tests of Files that change, except the two board tests. See them fail on `defaultOpen`, the counts, the clip and the hit area ([test-first rule](README.md#test-first)).
2. Change the code, `DESIGN.md`, `CANVAS.md` and the row in `docs/architecture.md`.
3. Run `npm run design-system` and `npm run design:gallery`. Set `pad` and `height` from the render. At 800, 1024 and 1440, check that no dock control reaches the 8px strip, and record it in the PR. Run the checks in `AGENTS.md` › Commands.
4. Push. Keep the PR as a draft ([design-system rule](README.md#design-system)).

Then do steps 3 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system):

- A local signed-in session that the tech lead starts runs steps 3 to 5.
- The tech lead runs the workflow Design: Render snapshots (step 6). It commits the card image.
- The session adds the board tests and sees them fail. It swaps the boards, changes `export.json`, runs `npm run design:export` and pushes. The tech lead runs the workflow.
- When the render passes checks 11 and 12, the session publishes the boards and runs "Refreshing the canvas copy" (5.1 to 5.5).
- The build rewords #1074 ([reword step](../.github/agent/build.md#reword)): item 8 names the canvas size (D5), and item 11 follows D6.

## Risks

- **Other board edits.** #1072 changes `Map.dc.html` too. The later one merges the earlier edit, and its JPGs are the baseline for check 12.
- **The bundle.** If `Credits` cannot mount, stop and comment the error on #893. The PR states the size of `bundle.js` before and after.
- **The dock at 800px.** If the real line does not clear the real `DateDock`, stop, file a Bug, and keep the board.
- **The open card in its case.** It opens over the caption of its case. The build checks the card image.
- **The size.** The Spec estimates about 490 lines. If the diff passes 600, stop and ask the tech lead to split it.

## Proof

| Acceptance check | Proven by                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------- |
| 1                | `Credits.test.tsx`, and the gallery hit-area test on the open state.                        |
| 2                | `design-system.test.ts` (59) and the line 1 test.                                           |
| 3, 4             | `npm run design:gallery` in the pinned image, and the workflow's card image.                |
| 5                | `react-18.test.tsx`.                                                                        |
| 6, 7             | `design-export.test.ts`.                                                                    |
| 8, 9             | The step 7 diff of the boards.                                                              |
| 10               | `design/__tests__/sources-boards.test.ts`.                                                  |
| 11               | `npm run design:export` in step 7, the `design` job, and `file` on the two JPGs.            |
| 12               | The workflow's commit, compared with `main`.                                                |
| 13, 14           | The commits of steps 4, 5 and 7, the workflow runs, and step 4.6 of "Updating the install". |
| 15               | Step 4.7 of "Updating the install".                                                         |
| 16               | Command output in the PR, with 100% coverage.                                               |
| 17               | `e2e/map-desktop.spec.ts`, and `git diff origin/main -- app/components/layout/` is empty.   |

## Out of scope

The Spec's Out of scope: the scale bar, the phone boards and a clip for another board.
