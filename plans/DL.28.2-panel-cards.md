# Plan: DL.28.2: The Layers and Filters panel joins the design system

- **Spec:** #1051
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05)
- **Status:** approved

## Approach

Add `Panel`, `LayerGroup` and `FilterFields` to `CONTROLS` after `EventGlyph`, so that the group "Map" holds nine cards. `react-18.test.tsx` gets the same five cases, because its "previews" test compares them with each card.

`Panel` changes to match the board (Spec D1):

- The `footer` prop becomes `end`. `Panel` renders it in a block `div` at the end of the `tabpanel`, with `margin-top: auto`. The `Legend` fills that width, and the `Button` keeps its own width at the left.
- `.head` takes `padding: var(--space-4)` and `border-bottom: 1px solid var(--line)`. `Tabs` already puts 4px between tabs, and the 40px tab rule stays. The `.footer` rule goes.
- `.panel` takes `flex: 1`, and `.body` takes `flex: 1 1 auto`. The panel then fills the slot, as the board's `aside` does. `max-height: 100%` stays.
- The width follows D1.

The card states take their values from `lib/design/samples.mts`:

| State                          | Values                                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Panel · Layers tab`           | Tabs Layers and Filters (count 1). Children: the three `LayerGroup` groups of the board's default. `end`: `Legend`.                                                                       |
| `Panel · Filters tab`          | `gap: 20`. Child: `FilterFields` with the board's values (Anyone, Rossouw, the ten Event types, Everyone). `end`: `Button` "Clear filters".                                               |
| `LayerGroup · rows on and off` | Boundaries: Polities on, Districts off, as the board's default draws them. `design: ['Layer rows']`.                                                                                      |
| `FilterFields · empty`         | No person, no surname, no Event type, branch Everyone.                                                                                                                                    |
| `FilterFields · with values`   | Person "J. Rossouw", surname Rossouw, Birth and Marriage, branch "Ancestors of…". The board's Person list holds only "Anyone", so this synthetic name comes from `FilterFields.test.tsx`. |

The Event type chips come from `EVENT_TYPES`, because `states.mts` runs in Node. Each `Panel` state has its own `bodyId`. Handlers: `Panel` `onSelect`. `FilterFields` takes its four `on…` props.

A local session swaps the `panel` slot of `Map.dc.html` (step 7). The slot builds `K.Panel` with `createElement`, named "Layers and filters" after the Layers button. The board state gains `person`, `surnames` and `branch`, and the panel takes `selected`, `checked` and the `on…` props from the state (Spec D3). The drawn `<aside`, the `tab` style and the chip styles go.

## Decisions

**D1 · The width of `Panel` in its card** · Decides: Tech lead

`Panel` has `width: 100%`. The `Map` board slot is 320 wide, but a card state has no box, so the panel spans the card.

- **A.** `.panel` takes `width: var(--size-panel)` and `max-width: 100%`. Cost: the slot and the panel both read `--size-panel`.
- **B.** `Card` gets a `box` width, and `previewHtml` wraps each state in it. Cost: a change to `cards.mts` and its tests for one card.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · `ClearFilters` after the change** · Decides: Tech lead

`ClearFilters` draws `Button full`. The board and Spec D1 draw a left-aligned button. No screen mounts it. #1058 says "`ClearFilters` is a button that takes `onClear`".

- **A.** `ClearFilters` drops `full`, and its comment names the end of the Filters tab. #1058 stays true. Cost: one line.
- **B.** Delete `ClearFilters` and its test. #1058 uses `Button`. Cost: the build rewords #1058.
- **C.** Keep it. Cost: when #1058 mounts it, it is full width, unlike the board.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · The space between the filter fields** · Decides: Tech lead

The board puts 20px between the four fields. `FilterFields` puts 16px.

- **A.** `.fields` takes `gap: var(--space-20)`. Cost: none on a screen. No screen mounts it.
- **B.** Keep 16px. Cost: on `map-desktop-filters`, Surname, Event type and Branch move up, and the PR lists them (Spec D4).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The Surname helper** · Decides: Tech lead

The board draws "Matches spelling variants too (Rossouw, Rossau)" under Surname. `FilterFields` passes no `helper`. #1058 D2 (PO, open) decides what Surname matches.

- **A.** Leave it out. The PR lists it as a visible difference on `map-desktop-filters`. Cost: the board loses the line until #1058.
- **B.** `FilterFields` shows the board's text. Cost: the card and the board promise a match rule before #1058 D2 has an answer.
- **Other:** your own.

**Answer: Other:** . FilterFields takes an optional surnameHelper prop and passes it to TokenField helper. The board and the two card states with values pass the board’s text as a sample. (@henetiriki)

## Files that change

| File                                                      | New / changed | What                                                                                        |
| --------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `features/map/components/Panel.tsx`                       | changed       | `end` in the `tabpanel`, in place of `footer`.                                              |
| `features/map/components/Panel.module.css`                | changed       | The head, fill and width rules of the Approach. No `.footer`.                               |
| `features/map/components/FilterFields.tsx`                | changed       | D2.                                                                                         |
| `features/map/components/FilterFields.module.css`         | changed       | D3.                                                                                         |
| `features/map/components/__tests__/Panel.test.tsx`        | changed       | The footer test becomes checks 3 and 4.                                                     |
| `features/map/components/__tests__/FilterFields.test.tsx` | changed       | D2: `ClearFilters` has no `data-full`.                                                      |
| `lib/design/bundle.mts`                                   | changed       | Three controls after `EventGlyph`.                                                          |
| `lib/design/samples.mts`                                  | changed       | The layer groups, the tabs, the filter choices and values of the Approach.                  |
| `lib/design/states.mts`                                   | changed       | Three cards in the group "Map".                                                             |
| `lib/design/__tests__/react-18.test.tsx`                  | changed       | Three imports, three `COMPONENTS` entries and five cases.                                   |
| `lib/design/__tests__/bundle.test.ts`                     | changed       | 57 controls, with the three names.                                                          |
| `lib/design/__tests__/cards.test.ts`                      | changed       | Groups `[14, 6, 8, 9, 8, 9, 3]`, and the title says "9 Map".                                |
| `scripts/__tests__/design-system.test.ts`                 | changed       | The two `toHaveLength(54)` become 57.                                                       |
| `e2e/gallery-looks.spec.ts`                               | changed       | Check 5: "Clear filters" in `Panel · Filters tab` is 44 tall and narrower than the body.    |
| `docs/architecture.md`                                    | changed       | The React 18 row names `Panel`, `LayerGroup` and `FilterFields`.                            |
| `design/cards/*.png`                                      | new           | `Panel-1440.png`, `LayerGroup-1440.png`, `FilterFields-1440.png`. The workflow writes them. |
| `design/canvas/project/Map.dc.html`                       | changed       | Step 7: the `panel` slot.                                                                   |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`     | changed       | Steps 4 and 5 of Changing the design system.                                                |

## Order of work

1. Change the tests of Files that change. See them fail on the footer, the counts and the missing controls ([test-first rule](README.md#test-first)).
2. Change `Panel`, then `FilterFields` as D2 and D3 say.
3. Change `samples.mts`, `bundle.mts` and `states.mts`, and the row in `docs/architecture.md`.
4. Run `npm run design-system` and `npm run design:gallery`. Set each card height from the render. Start values: `Panel` 760, `LayerGroup` 200, `FilterFields` 480.
5. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
6. Push. Keep the PR as a draft ([design-system rule](README.md#design-system)).

Then do steps 3 to 7 of [Changing the design system](../design/CANVAS.md#changing-the-design-system):

- The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5. The session needs a signed-in account.
- The tech lead runs the workflow Design: Render snapshots (step 6). It commits the three card images.
- A local session swaps the `Map` panel slot (step 7), refreshes the canvas copy and pushes. The tech lead runs the workflow again.
- The PR lists each visible difference in the ten JPGs, and the tech lead decides on each (Spec D4).

## Risks

- **A nested slot has no handler.** A preview gives no-op handlers to the card's own control only. A click on a checkbox or a chip inside `Panel` calls nothing, and the console shows an error. No test clicks a card, and no screen mounts these. A fix adds a `handlers` field to `Slot`, about 10 lines. The tech lead decides whether to build it.
- **Visible differences.** The real chips, selects, badge and "Clear filters" can differ from the drawing in type and padding. The PR lists each (Spec D4). D3 and D4 name the two known ones.
- **#1057.** Its concern names `max-height: 100%`, which stays. `flex: 1` fills the slot, and the slot box does not change, so the scale bar check still holds.
- **Other board edits.** #1052, #1053 and #1055 are merged. #1056 rewrites `mount` after this Spec, and the panel slot does not use `mount`.
- **#925.** Its Out of scope names "Component cards for the Layers panel". After this Spec the cards exist, and the build checks that line.
- **Missing card images.** The `design` job fails on the three cards until the workflow commits their images.

## Proof

| Acceptance check | Proven by                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------- |
| 1                | `bundle.test.ts` (57) and `react-18.test.tsx` "mounts with the props of its first case". |
| 2                | `design-system.test.ts` line 1 test, and `react-18.test.tsx` "previews".                 |
| 3, 4             | `Panel.test.tsx`.                                                                        |
| 5                | `e2e/gallery-looks.spec.ts`.                                                             |
| 6                | The step 7 diff of `Map.dc.html`, with no `<aside`.                                      |
| 7                | `npm run design:export` in step 7, and the `design` job.                                 |
| 8                | The workflow's commit, and the PR's list of visible differences.                         |
| 9                | The commits of steps 4, 5 and 7, and the workflow runs.                                  |
| 10               | Step 4.6 of "Updating the install".                                                      |
| 11               | Command output in the PR, with 100% coverage.                                            |

## Out of scope

- The map screen mounts `Panel` (MAP-05): DL.28.3 (#1057).
- The Filters tab filters pins (EXP-03): DL.28.4 (#1058).
- The phone sheets and their boards: #925.
- Cards for the credits line and the account menu.
