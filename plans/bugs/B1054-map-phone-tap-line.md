# Plan: B1054: The collapsed Map-phone sheet draws a tap line that the design does not have

- **Spec:** #1054
- **Requirement IDs:** None (design only). Must not break: [NFR-05](../../docs/requirements.md#nfr-05).
- **Status:** approved

## Approach

The collapsed variant of the `Map-phone` board mounts the real `DateDock` sheet in its `dock` slot. The real sheet has the date stepper and Play, and no tap line. The `Map-phone-states` board keeps its drawn sheet and drops the `sheetHint` line. The States row "Phone, collapsed" in `design/DESIGN.md` then agrees with the Phone bullet. `DESIGN.md` is a design system input, so the branch runs steps 2 to 7 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system). The sheet height is the token `--layout-phone-sheet-collapsed` (152px), so the sheet keeps its size without the line.

## Decisions

**D6 · One render for steps 6 and 7** · Decides: Tech lead

Step 6 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) renders after the design system steps. Step 7 renders again after the board edits. The States row shows on no board, so the step 6 render changes no snapshot.

- **A.** The local session runs steps 3 to 5 and the board edits of step 7 in one sitting. It pushes once, and the tech lead runs one render. Check 10 names that push and render as steps 6 and 7. Cost: none.
- **B.** Two pushes and two renders, in the order of the section. Cost: one more hand-off and one more render.
- **Other:** your own.

**Answer: Other:** - I've set it to hand-back so it builds locally (@henetiriki)

## Alternatives considered

- Drop the line and keep the drawn sheet on `Map-phone`. Check 1 needs the real `DateDock`, so no.

## Files that change

| File                                                             | New / changed | What                                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/DESIGN.md`                                               | changed       | The States row "Phone, collapsed" reads "Date stepper and Play only."                                                                                                     |
| `design/canvas/project/Map-phone.dc.html`                        | changed       | The `collapsed` variant: `sheet` is `h(K.DateDock, …)` with `day`, `lastDay`, `onChange` and `onPlay` (`noop`), and `sheet: { expanded: false, onExpandedChange: noop }`. |
| `design/canvas/project/Map-phone-states.dc.html`                 | changed       | Delete the `<p>{{sheetHint}}</p>` line and the `sheetHint` value.                                                                                                         |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`            | changed       | Steps 4 and 5.                                                                                                                                                            |
| `design/source/` and `design/*.jpg` of the 2 + 7 snapshots below | changed       | The render workflow.                                                                                                                                                      |
| `plans/bugs/B1054-map-phone-tap-line.md`                         | new           | This plan.                                                                                                                                                                |

A `Day` counts days since 1652-01-01. The board writes `MAP_DATE` (1901-06-14) and `TODAY` (2026-10-21) of `lib/design/samples.mts` as numbers, with a comment that names both dates. The bundle exports no date helper. The lookup variant keeps `dateRow` and its drawn dock.

## Order of work

1. A local Claude Code session that the tech lead starts, with a signed-in account (step 1): edit the States row in `design/DESIGN.md`.
2. The same session (step 2): run `npm run design-system`. Keep the PR as a draft.
3. The same session runs steps 3 to 5:
   - `/publish-design-system`;
   - "Updating the install" (4.1 to 4.7);
   - "Refreshing the canvas copy" (5.1 to 5.5).
4. The same session (step 7) edits the two boards as the table says. It runs 5.1 to 5.5, posts the sha256 pairs of 5.2 in the PR, and pushes.
5. The tech lead runs Design: Render snapshots once for steps 6 and 7 (D6: the local session builds the hand-back).
6. The same session: run checks 2, 3, 5 and 8, and the [Commands](../../AGENTS.md#commands) checks. Do the ready check. Write the PR body.

## Risks

- **No board mounts `DateDock` yet.** The exporter can reject a part of it. The collapsed sheet has no slider, so the `color-mix()` hatch of `DateSlider` does not render. If the export still fails, stop: check 2 changes.
- **A pixel changes outside the sheet** (y 692 to 844), for example the sheet shadow. Then check 3 or 8 fails. Stop for the tech lead.
- **#925 also edits `Map-phone-states.dc.html`.** It is `status: blocked`. The later branch rebases on the other. Only the sheet section overlaps.
- **#1052 and #1053 wait on this Bug.** They edit `Map.dc.html`. They share only `canvas.json` and `VERSION`, which each refresh rewrites.

## Proof

| Acceptance check                                     | Proven by                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. `collapsed` mounts `DateDock`, no tap line        | Read the `dock` slot; `git grep "Tap the map"` on the board has no match                           |
| 2. Export passes on both snapshots                   | `npm run design:export` output in the PR                                                           |
| 3. `map-phone` same, `map-phone-collapsed` sheet     | `cmp` with `git show origin/main:design/map-phone.jpg`; changed pixels of the other within y ≥ 692 |
| 4. Same sha256, `Map-phone.dc.html`                  | The 5.2 pairs of the local session                                                                 |
| 5. Test, typecheck, lint, coverage                   | The outputs in the PR                                                                              |
| 6. The States row                                    | Read `design/DESIGN.md`                                                                            |
| 7. No "Tap the map" in `Map-phone-states.dc.html`    | `git grep`                                                                                         |
| 8. 7 snapshots differ in the sheet, 4 same           | `cmp` for the 4; changed pixels of the 7 within y ≥ 692                                            |
| 9. Same sha256, `Map-phone-states.dc.html`           | The 5.2 pairs of the local session                                                                 |
| 10. Steps 2 to 7 ran                                 | The commits and PR comments of each step                                                           |
| 11. `ds/kinscape/` matches `.design-system/project/` | The 4.6 and 5.2 reports                                                                            |
| Must not break: #924 `MapLayout`                     | Read `Map-phone.dc.html`; check 3                                                                  |
| Must not break: #921 `DateDock` card                 | `git diff origin/main -- design/cards/` is empty                                                   |
| Must not break: #925 other boards                    | `git diff --stat origin/main -- design/canvas/project/` names only the two boards and `ds/`        |
| Must not break: NFR-05 lookup                        | `map-phone` is byte-identical (check 3)                                                            |
| Must not break: board edits                          | The same `git diff --stat`                                                                         |

## Out of scope

- The expanded look-up variant: MAP-07.
- Play in the app: MAP-09.
- The `MapLayout` swaps of #925.

## Deviations

- Step 7 read only the two boards and `canvas.json` for 5.2. Step 5 read all 188 canvas files 20 minutes before. When the session published the boards, the canvas had no newer version. (90046cef)
- The local session, not the CI build agent, ran checks 2, 3, 5 and 8, because the PR is a hand-back (D6). The #1054 D2 line still names the CI build agent.
