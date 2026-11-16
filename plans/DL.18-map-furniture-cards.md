# Plan: DL.18: SearchBar, ZoomControls and LayersButton join the design system

- **Spec:** #920
- **Requirement IDs:** None. This Spec changes the design system and no screen.
- **Status:** approved

## Approach

Add the three map components to `CONTROLS` after `TokenField`, so that the group "Map" follows "Forms". Add "Map" after "Forms" to `GROUPS` and to the type `Group`. Each card copies the cases of `/design-kit/map-furniture` (`sections.tsx`, `ZoomDemo.tsx`). `react-18.test.tsx` gets the same cases, because its "previews" test compares them with each card.

The card states:

- `SearchBar`: `bar`; `bar with text` (`defaultValue: 'Kimberley'`); `pill` and `pill with text`, each with the `AVATAR` slot in `account`. No handlers.
- `ZoomControls`: `default`, `active`, `focus` and `hover` (`state` on Zoom in, as the board's matrix); `most zoom` (`atMax`, the board's "Disabled" column); `least zoom` (`atMin`). Handlers: `onFit`, `onZoomIn` and `onZoomOut`.
- `LayersButton`: `grid('LayersButton', …)` with `disabled` and `state`, the same five columns as the board's matrix.

None of the three CSS files has a width rule, so no card joins `PHONE_CARDS` (D1).

## Decisions

**D1 · Reach of the width-rule test** · Decides: Tech lead

The test "names each card whose component CSS has a width rule" (`cards.test.ts`) reads only `app/components/`. Thus it does not read `DateField.module.css` and `FuzzyDateField.module.css`, which have a `max-width` rule but are not in `PHONE_CARDS`. #920 Behaviour 4 and #921 Behaviour 5 say that a card joins `PHONE_CARDS` "as the test of that list demands".

- **A.** Keep the test as it is. None of the three cards joins `PHONE_CARDS`. A width rule that a map component gets later goes unseen.
- **B.** Make the test read the CSS file next to each path in `CONTROLS`. `DateField` and `FuzzyDateField` then join `PHONE_CARDS`, and the workflow adds two more card images. This changes two cards that #920 does not name, and #921 inherits the wider test.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Use `grid` for `ZoomControls`. Rejected: `grid` passes `disabled`, which `ZoomControls` does not take. `linkGrid` and two `one` calls give the states.

## Files that change

| File                                                  | New / changed | What                                                                                                              |
| ----------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                                 | changed       | `Group` gains `'Map'`.                                                                                            |
| `lib/design/cards.mts`                                | changed       | `GROUPS` gains `'Map'` after `'Forms'`.                                                                           |
| `lib/design/bundle.mts`                               | changed       | `CONTROLS` gains `SearchBar`, `ZoomControls` and `LayersButton` after `TokenField`.                               |
| `lib/design/states.mts`                               | changed       | Three cards in the group "Map", `design: []`, after the `TokenField` card. Heights: 360, 240 and 140.             |
| `lib/design/__tests__/react-18.test.tsx`              | changed       | Three imports, three `COMPONENTS` entries, and the cases of the Approach.                                         |
| `lib/design/__tests__/bundle.test.ts`                 | changed       | The list test names 48 controls.                                                                                  |
| `lib/design/__tests__/cards.test.ts`                  | changed       | The group count test expects `[14, 6, 8, 3, 8, 9]`. Its title names the six groups and drops "of app/components". |
| `scripts/__tests__/design-system.test.ts`             | changed       | The two `toHaveLength(45)` become 48.                                                                             |
| `docs/architecture.md`                                | changed       | The React 18 row names `SearchBar.tsx`, `ZoomControls.tsx` and `LayersButton.tsx`.                                |
| `design/cards/*.png`                                  | new           | `SearchBar-1440.png`, `ZoomControls-1440.png` and `LayersButton-1440.png`. The workflow writes them.              |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Steps 4 and 5 of Changing the design system.                                                                      |

## Order of work

1. Change the four tests. See them fail on the missing controls: `KinScape` keys, the 48 count and the group counts ([test-first rule](README.md#test-first)).
2. Change `types.ts`, `cards.mts`, `bundle.mts` and `states.mts`.
3. Change the row in `docs/architecture.md`.
4. Run `npm run design-system`. Record the size of `bundle.js` before (69,452 bytes on `main`) and after.
5. Run `npm run design:gallery`. Check that the pill is as wide as the board's pill.
6. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
7. Run `git diff --stat origin/main -- features/map/components/` and paste the empty output.
8. Push. Keep the PR as a draft ([design-system rule](README.md#design-system)).

The tech lead, or a local Claude Code session that the tech lead starts, runs steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). The session needs a signed-in account. No board changes, so step 7 does not apply. The tech lead then runs the workflow Design: Render snapshots on the branch.

## Risks

- **React 18.** If a component cannot mount in the bundle, stop. Comment the component and the error on #893.
- **The "/" key.** Each `bar` state adds a `keydown` listener for "/". If the states disturb one another, the PR names it, and the build comments on #893.
- **Pill width.** The board holds each pill in a 311px or 193px box. The card has no box, so the pill takes the width of its `figure`. If the pill collapses, the PR shows it and asks the tech lead.
- **Bundle size.** `checkScript` stops at 6 MB, less than the 15 MiB that the Spec names. On `main`, `bundle.js` is 69,452 bytes.
- **Missing card images.** The `design` job fails on the three cards until the workflow commits their images.

## Proof

| Acceptance check | Proven by                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| 1                | `design-system.test.ts`: a folder for each of 48 cards, and line 1 names `group="Map"`.          |
| 2                | `npm run design:gallery` (`e2e/design-gallery.spec.ts` opens each card at 1440px and 390px).     |
| 3                | The `design` job, after the workflow commits the three card images.                              |
| 4                | `react-18.test.tsx`: "mounts with the props of its first case" and "preview mounts every state". |
| 5                | `npm run design:check` and `npm run e2e` output in the PR.                                       |
| 6                | Step 7 of Order of work.                                                                         |
| 7                | The tech lead's PR comment and the workflow's commit.                                            |
| 8                | Step 4.6 of "Updating the install".                                                              |
| 9                | The tech lead opens the design system.                                                           |
| 10               | Command output in the PR, with 100% coverage.                                                    |

## Out of scope

- `Legend`, `EventGlyph` and `DateDock`: DL.18.1 (#921).
- The board `/design-kit/map-furniture` and its tests: DL.19 (#922).
- The Map boards on the canvas: DL.28 (#924).
- `DateField` stays in the group "Forms".

## Deviations

- `design/map-districts.jpg`: the workflow Design: Render snapshots rewrote it by 6 bytes in `5ba746e7`. No board changed.
