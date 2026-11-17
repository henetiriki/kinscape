# Plan: DL.18.1: Legend, EventGlyph and DateDock join the design system

- **Spec:** #921
- **Requirement IDs:** None. This Spec changes the design system and no screen.
- **Status:** draft

## Approach

Add `DateDock`, `Legend` and `EventGlyph` to `CONTROLS` after `LayersButton`, so that the group "Map" holds six cards. `react-18.test.tsx` gets the same cases, because its "previews" test compares them with each card.

The card states:

- `EventGlyph`: `one('EventGlyph · <type>', { event })` for each type of `EVENT_TYPES` (`lib/domain/pins/schemas.mts`). `states.mts` runs in Node, which cannot load `EventGlyph.tsx`. `schemas.test.ts` keeps `EVENT_TYPES` equal to `EVENT_ORDER`.
- `Legend`: `Legend · default`.
- `DateDock`: `DateDock · Map date`, `· with epochs` and `· with contested claims`. Handlers: `onChange` and `onPlay`. `design: ['Date dock']`.

The `DateDock` values go in `lib/design/samples.mts`:

| Value            | Sample                                                      | Source                                                                   |
| ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `day`            | `MAP_DATE = '1901-06-14'`                                   | The date field of the `Map` board                                        |
| `lastDay`        | `TODAY = '2026-10-21'`                                      | The `max` of the `DateField` card, moved to `samples.mts`                |
| `epochs`         | 1652, 1806, 1854, 1880, 1902, 1910, 1976, 1994, Today(2026) | The Jump to list of the `Map` board                                      |
| `contestedCount` | 2                                                           | "2 contested claims on this date" on the `Map` board                     |
| `contestedYears` | `[{ from: 1900, to: 1901 }]`                                | The hatch of the `Map` board slider: about two years, over the date 1901 |

The `DateField` card and `react-18.test.tsx` take `MAP_DATE` and `TODAY` from there too. No card joins `PHONE_CARDS` (Spec Behaviour 5).

## Decisions

**D1 · One radio group across the `DateDock` states** · Decides: Tech lead

`Segmented` makes radios with a fixed `name` (`precision`, `speed`). A gallery file puts all states in one document with no `form`. Thus the radios of the three docks are one group, and only the last dock shows Year and 5 as selected. `Segmented-1440.png` on `main` shows the same fault: only one of its five states has a selected segment. AC 6 forbids a change to `DateDock`.

- **A.** Build the three states as the Spec says. The first two docks show no selected segment in the card image. The build files a Bug that names the `Segmented` and `DateDock` cards and the shared radio group.
- **B.** File the Bug now and add it as a blocker of #921. The Bug gives each card state its own radio scope, for example a `form` around each case in `previewHtml`. It can change each card image that holds a radio.
- **Other:** your own.

Recommended: A, because each acceptance check still passes, and one Bug fixes both cards.

## Files that change

| File                                                  | New / changed | What                                                                                                     |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `lib/design/bundle.mts`                               | changed       | `CONTROLS` gains `DateDock`, `Legend` and `EventGlyph` after `LayersButton`.                             |
| `lib/design/samples.mts`                              | changed       | `MAP_DATE`, `TODAY` and the dock samples of the Approach.                                                |
| `lib/design/states.mts`                               | changed       | Three cards in the group "Map", after the `LayersButton` card. `dateField` reads `MAP_DATE` and `TODAY`. |
| `lib/design/__tests__/react-18.test.tsx`              | changed       | Three imports, three `COMPONENTS` entries and the cases of the Approach.                                 |
| `lib/design/__tests__/bundle.test.ts`                 | changed       | The list test names 52 controls.                                                                         |
| `lib/design/__tests__/cards.test.ts`                  | changed       | The group count test expects `[14, 6, 8, 6, 8, 9, 1]`, and its title says "6 Map".                       |
| `scripts/__tests__/design-system.test.ts`             | changed       | The two `toHaveLength(49)` become 52.                                                                    |
| `docs/architecture.md`                                | changed       | The React 18 row names `DateDock.tsx`, `Legend.tsx` and `lib/ui/EventGlyph.tsx`.                         |
| `design/cards/*.png`                                  | new           | `DateDock-1440.png`, `Legend-1440.png` and `EventGlyph-1440.png`. The workflow writes them.              |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION` | changed       | Steps 4 and 5 of Changing the design system.                                                             |

## Order of work

1. Change the four tests. See them fail on the missing controls: the `KinScape` keys, the 52 count and the group counts ([test-first rule](README.md#test-first)).
2. Change `samples.mts`, `bundle.mts` and `states.mts`.
3. Change the row in `docs/architecture.md`.
4. Run `npm run design-system`. Record the size of `bundle.js` before and after.
5. Run `npm run design:gallery`. Set each card height from the render. Start values: `EventGlyph` 140, `Legend` 280, `DateDock` 720.
6. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
7. Run `git diff --stat origin/main -- features/map/components/ lib/ui/` and paste the empty output.
8. Push. Keep the PR as a draft ([design-system rule](README.md#design-system)).

The tech lead, or a local Claude Code session that the tech lead starts, runs steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). The session needs a signed-in account. No board changes, so step 7 does not apply. The tech lead then runs the workflow Design: Render snapshots on the branch.

## Risks

- **DateDock in the bundle.** If `DateDock` cannot mount, or its card image differs between two runs, follow the Spec: comment on #893, and leave `DateDock` out.
- **Dock width.** The board gives the dock 1048px. A card has no box, so the dock takes the width of its content. If the slider is too short to read, the PR shows it and asks the tech lead.
- **Bundle size.** `bundle.js` already holds the tokens that `Legend` reads.
- **Missing card images.** The `design` job fails on the three cards until the workflow commits their images.

## Proof

| Acceptance check | Proven by                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| 1                | `design-system.test.ts`: a folder for each of 52 cards, and line 1 names `group="Map"`.          |
| 2                | `react-18.test.tsx` "previews": the `EventGlyph` captions equal its ten card states.             |
| 3                | `npm run design:gallery`.                                                                        |
| 4                | The `design` job, after the workflow commits the images, on two runs.                            |
| 5                | `react-18.test.tsx`: "mounts with the props of its first case" and "preview mounts every state". |
| 6                | Step 7 of Order of work.                                                                         |
| 7                | The tech lead's PR comment and the workflow's commit.                                            |
| 8                | Step 4.6 of "Updating the install".                                                              |
| 9                | The tech lead opens the design system.                                                           |
| 10               | Command output in the PR, with 100% coverage.                                                    |

## Out of scope

- A card state for the phone sheet form of `DateDock`.
- The board `/design-kit/map-furniture` and its tests: DL.19 (#922).
- The Map boards on the canvas: DL.28 (#924).
