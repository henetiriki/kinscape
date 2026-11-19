# Plan: B1071: The real DateDock sheet draws differently from the phone date sheet on the Map-phone-states board

- **Spec:** #1071
- **Requirement IDs:** [MAP-03](../../docs/requirements.md#map-03). Must not break: [NFR-06](../../docs/requirements.md#nfr-06).
- **Status:** approved

## Approach

The real `DateDock` is right (Expected per), so only one gap changes. In the sheet, `DateDock` wraps the round `PlayButton` in a `span` with class `sheetPlay`: `display: flex; margin-left: var(--space-4)`. `Button` takes no `className`, so the wrapper holds the margin. Play then sits 8px from Forward.

`DateDock` gains `defaultText?: string` and passes it to `DateField`, which already checks it on the first render and opens the message. `MapShell` does not set it.

The `DateDock` card gains three states: the phone sheet, the dock with `1901-02-30`, and the sheet with `1901-02-30`. The sheet states need `sheet.onExpandedChange`, but the card's `give` helper only gives a no-op to items of a list prop. `give` also gives it to an object prop, and skips a state that does not have the prop. `DateDock` joins `PHONE_CARDS`: its sheet fills the width, and the `DateField` callout changes at 640px. The comment of `PHONE_CARDS` says so.

This changes components in `CONTROLS`, `lib/design/states.mts` and `design/DESIGN.md`, so [Changing the design system](../../design/CANVAS.md#changing-the-design-system) steps 2 to 7 apply. Only a local session edits `design/canvas/` ([D1](#decisions)). Do not use the [board swap prompt](../../design/COMPONENTS.md#board-swap-prompt): it keeps the old board on a pixel change, and check 7 expects a change.

## Decisions

**D1 · Who builds this Bug** · Decides: Tech lead

The CI build agent cannot run design steps 3 to 5 or edit `design/canvas/` ([design-system rule](../README.md#design-system)). No path of this plan is in `.github/CODEOWNERS`, so no `hand-back` label comes. #1052, #1053 and #1055 were hand-backs.

- **A.** Hand-back: the tech lead adds the `hand-back` label. A local session that the tech lead starts does all of Order of work except step 7. Cost: one local session.
- **B.** Split: the CI build agent does steps 1 to 4 and keeps the PR as a draft. A local session does steps 5 and 6. The CI build agent does steps 8 and 9. Cost: two more hand-offs.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · What the invalid-date boards show** · Decides: Tech lead

The real `DateDock` starts on Year, and it has no precision prop. With `day` 91109 and `1901-02-30` typed, the message reads "The map still shows 1901.", not "1901-02-28". On `map-date-invalid`, Year is selected, not Day. Check 7 lets the dock and the message change.

- **A.** Accept both as the real `DateDock`: a date typed at Year precision shows them in the app too. Cost: none.
- **B.** `DateDock` also gains `defaultPrecision`, and the boards pass `day`. The boards then keep "1901-02-28" and Day. Cost: a second prop that #1071 does not ask for, and the app does not set.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Change the boards to 6px gaps and the drawn borders. The tech lead chose the real `DateDock` (Expected per).
- A `className` on `Button` for the Play margin: it widens the `Button` API for one use.
- A `gap` of 8px on the `DateField` row: it changes Back and Forward too (check 1).

## Files that change

| File                                                                                      | New / changed | What                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/map/components/DateDock.tsx`                                                    | changed       | `defaultText` prop, passed to `DateField`. The round Play sits in `span.sheetPlay`.                                                                                                                                                                                             |
| `features/map/components/DateDock.module.css`                                             | changed       | `.sheetPlay`: `display: flex; margin-left: var(--space-4)`.                                                                                                                                                                                                                     |
| `features/map/components/__tests__/DateDock.test.tsx`                                     | changed       | Check 2: `defaultText` in the dock and in the sheet shows the text and "February 1901 has 28 days.".                                                                                                                                                                            |
| `e2e/gallery-looks.spec.ts`                                                               | changed       | Check 1: on the "DateDock · phone sheet" card state at 390px, Back, field and Forward are 4px apart, and Play is 8px from Forward.                                                                                                                                              |
| `lib/design/states.mts`                                                                   | changed       | `DateDock`: states "phone sheet", "invalid date" and "phone sheet · invalid date"; `handlers` adds `sheet.onExpandedChange`; `box` makes each state fill the card; `height` fits six states; `pad` clears the dock's callout.                                                   |
| `lib/design/__tests__/react-18.test.tsx`                                                  | changed       | The three new cases.                                                                                                                                                                                                                                                            |
| `lib/design/cards.mts`, `lib/design/types.ts`                                             | changed       | `give` gives a no-op to an object prop, and skips a missing prop. `PHONE_CARDS` lists `DateDock`, and its comment gives why. The `handlers` doc names the object prop.                                                                                                          |
| `lib/design/__tests__/cards.test.ts`                                                      | changed       | A preview gives `sheet.onExpandedChange` a no-op, and a state without `sheet` mounts.                                                                                                                                                                                           |
| `design/DESIGN.md`                                                                        | changed       | Phone date sheet: "a round Play, 8px after Forward" (check 8).                                                                                                                                                                                                                  |
| `design/canvas/project/Map-phone-states.dc.html`                                          | changed       | `dock`: `h(K.DateDock, { day: 91109, defaultText: v.dateError ? '1901-02-30' : undefined, key: variant, lastDay: 136894, onChange: noop, onPlay: noop, sheet: { expanded: false, onExpandedChange: noop } })`. The drawn sheet, the `date-msg-phone` block and their values go. |
| `design/canvas/project/Map.dc.html`                                                       | changed       | `dock` in `date-invalid`: the same `h(K.DateDock, …)` with `defaultText: '1901-02-30'` and `key`. The drawn dock, the `date-msg` callout and each value only they use go. The comments give the new why.                                                                        |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION` | changed       | Steps 4 and 5.                                                                                                                                                                                                                                                                  |
| `design/source/`, `design/*.jpg` of 12 shots, `design/cards/DateDock-*.png`               | changed / new | The render workflow (check 7, check 3).                                                                                                                                                                                                                                         |
| `plans/bugs/B1071-datedock-sheet.md`                                                      | new           | This plan.                                                                                                                                                                                                                                                                      |

`key` remounts the dock when the variant changes on the canvas: `defaultText` sets only the first text.

## Order of work

1. Write the tests of checks 1 and 2. See each fail on the behaviour (the field shows `1901`; Play is 4px from Forward). Paste the failing lines in the PR.
2. Change `DateDock.tsx` and `DateDock.module.css`.
3. Write the `give` test, see it fail, then change `cards.mts` and `types.ts`. Add the card states, the `react-18.test.tsx` cases and the `PHONE_CARDS` entry. Change `DESIGN.md`.
4. Run `npm run design-system` (design step 2).
5. A local Claude Code session that the tech lead starts, with a signed-in account, runs `/publish-design-system` and "Updating the install" (design steps 3 and 4).
6. The same session edits the two boards on the canvas with the Artifact tool, as the table says (design step 7). It runs "Refreshing the canvas copy" (5.1 to 5.5). It posts the sha256 pairs (check 9) and the `npm run design:export` output (check 6) in the PR. It discards the exported `source/` changes, commits `design/canvas/` alone and pushes.
7. The tech lead runs Design: Render snapshots on the branch (design steps 6 and 7 in one render).
8. Compare with `origin/main`. Use `cmp` for `map-phone`, `map-account-menu-phone`, the other 10 `Map` JPGs and each card image except `DateDock`. For the 12 changed JPGs, post the `changedPixels` box of `lib/design/check.mts`.
9. Run the [Commands](../../AGENTS.md#commands) checks. Do the ready check. Write the PR body.

## Risks

- **The dock's callout overlaps the state above it on the card.** `pad` gives it room. Read `DateDock-1440.png` and `DateDock-390.png` after step 7.
- **A pixel changes outside the sheet, the dock or the message.** The sheet uses `BottomSheet`, which `map-phone-collapsed` already draws. If check 7 fails, stop for the tech lead.
- **The JPG blocks spread a change.** Read "inside the sheet" as its box and shadow, widened to whole 8×8 blocks.
- **#1072 also edits both boards and `PHONE_CARDS`** (the `overlay` slot and the offline banner). The branch that lands second rebases on the other. Its render takes the other's JPGs as the baseline, as #1072 says.

## Proof

| Acceptance check                                       | Proven by                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1. Gaps 4, 4 and 8px at 390px                          | `e2e/gallery-looks.spec.ts`                                                                 |
| 2. `defaultText` in dock and sheet; none as on `main`  | `DateDock.test.tsx`: the new tests and the existing ones                                    |
| 3. Card states, `PHONE_CARDS`, `DateDock-390.png`      | `react-18.test.tsx`, `cards.test.ts`; the file after step 7                                 |
| 4. `Map-phone-states` mounts `DateDock`, nothing drawn | Read the slot; `git grep "28 days"` on the board has no match                               |
| 5. `Map` `date-invalid` mounts `DateDock`              | Read the slot; `git grep "28 days\|readonly"` on the board has no match                     |
| 6. The export passes on three boards                   | The `npm run design:export` output in the PR                                                |
| 7. Only 12 JPGs change, inside the sheet or dock       | `cmp` and the boxes of step 8                                                               |
| 8. `DESIGN.md` gives the 8px gap                       | Read the Phone date sheet line                                                              |
| 9. Steps 2 to 7; same sha256                           | The 4.6 and 5.2 pairs in the PR                                                             |
| 10. Test, typecheck, lint, e2e, coverage               | The outputs in the PR                                                                       |
| Must not break: MAP-03 steps by year, month as year    | `DateDock.test.tsx` "keeps the phone sheet on Year and shows no precision note"             |
| Must not break: NFR-06 keyboard                        | `e2e/map-phone.spec.ts` "the keyboard reaches Layers, the grabber, the steps and the field" |
| Must not break: #924 and #925 slots                    | Read the boards; the boxes of check 7 hold only the dock, the sheet and the message         |
| Must not break: #1054 no tap line                      | The `map-phone-collapsed` box holds only the date row                                       |
| Must not break: #988 44px hit area                     | `e2e/gallery-looks.spec.ts` "each control under 44px tall or wide keeps a 44px hit area"    |
| Must not break: sheet 152px, message 12px above        | `e2e/map-phone.spec.ts`                                                                     |
| Must not break: `map-phone.jpg`                        | `cmp` in step 8                                                                             |

## Out of scope

- The drawn look-up sheet of `map-phone.jpg`.
- The `overlay` slot and the offline banner: #1072.

## Deviations

- Check 1 is in `e2e/gallery-looks.spec.ts`, not `e2e/map-phone.spec.ts`. The app passes no `onPlay`, so its phone sheet has no Play. The card state has one.
- The `DateDock` card sets `box: '100%'`. Without it, the sheet takes the width of its content (475px at 390px), not the width of the card.
- `DateDock` gained `defaultText` before the first e2e run of step 1. The build type-checks the unit test of check 2.
