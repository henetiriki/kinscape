# Plan: B988: DateDock controls under 44px have no 44px hit area on a phone

- **Bug:** #988
- **Requirement IDs:** [NFR-05](../../docs/requirements.md#nfr-05), [NFR-06](../../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The fix is CSS only, and the slider and Jump to keep their look. The slider's input grows to a 44px box: 8px padding above and below, and an 8px negative margin that takes the space back. The track, the thumb and the marks stay where they are. Each epoch button gets a 44px-tall `::before`, as `Button` size xs has.

The 1 and 5 speed segments fail on the side: 21px right of "1" is on "5", 4px away. A 44px area for each would overlap its neighbour, so D1 picks the fix. Then the `#988` entry leaves `UNDER_44`.

## Decisions

**D1 · How the 1 and 5 speed segments get a 44px hit area** · Decides: Tech lead

Each is 30px or 33px wide, with a 4px gap. The `Map` snapshot (`design/source/map-desktop.html`, line 1077) draws each speed segment at least 40px wide. The app has no minimum. The phone sheet shows no speed control (`design/DESIGN.md` › Phone date sheet). A tablet with touch shows the dock (NFR-05).

- **A.** Give `.segItem` in `Segmented.module.css` a 40px minimum width. Only "1" and "5" grow, by 10px and 7px, to match the snapshot. With the 4px gap, each 44px area then ends where the next begins. The bundle changes, but no board does.
- **B.** Keep the look. The test counts a side point on a segment of the same group as a hit. A tap 21px right of "1" then selects "5".
- **C.** Keep the look and the two labels in `UNDER_44`, with the reason that the phone sheet shows no speed. The Bug closes with two controls listed.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A 44px slider track: the thumb and marks move, so the look changes.
- `Button` size xs for the epoch buttons: it has `type.button-s`, not mono, so the look changes.
- A shared hit-area rule in `foundation/` for the 20 modules that copy it: a refactor outside this Bug.

## Files that change

| File                                            | New / changed | What                                                                                                                                                     |
| ----------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/map/components/DateSlider.module.css` | changed       | The input: 8px block padding, -8px block margin, 44px tall                                                                                               |
| `features/map/components/JumpTo.module.css`     | changed       | `.epoch`: `position: relative` and a centred `::before`, `var(--size-touch)` tall                                                                        |
| `app/components/actions/Segmented.module.css`   | changed       | D1 A: `.segItem` `min-width: 40px` and `justify-content: center`, with a comment that names the snapshot                                                 |
| `e2e/gallery-looks.spec.ts`                     | changed       | Remove the `#988` entry and the `EPOCHS` import. `UNDER_44` stays, empty, for the next Bug. D1 B: change the side check. D1 C: keep the two segment keys |
| `e2e/design.spec.ts`                            | changed       | The focus-ring test measures the gap to the slider track, not to its padded box. The slider keeps `outline-offset: -6px`                                 |

## Order of work

1. Change the slider and Jump to CSS, then the segment CSS as D1 says.
2. Remove the `#988` entry. Run `npm run design:gallery -- -g "keeps a 44px hit area"`.
3. Run the checks in `AGENTS.md` › Commands and `npm run design:check` on the map screens.
4. Run the design system steps, because `DateDock` and `Segmented` are in `CONTROLS`:
   - Step 2: the build agent runs `npm run design-system`.
   - Steps 3 to 5: the tech lead, or a local session that the tech lead starts, runs them. The session needs a signed-in claude.ai account. The PR stays a draft until then.
   - Step 6: the build agent pushes. The tech lead runs Design: Render snapshots. If a board shows the change, step 7 applies. I expect none: the `Map` board draws the dock in its own HTML.

## Risks

- The global focus ring follows the slider's box, so it can grow to 44px. Check the focused slider in the gallery at 1440px. If it grows, set a negative `outline-offset` to keep it on the track.
- The slider's 8px above sits in the dock's 8px gap. In the phone sheet it can cover the date row. The hit-area test catches an overlap in the card. Check the expanded sheet at 390px by hand.
- D1 A needs the 4px segment gap. At the snapshot's 2px gap, 21px right of "5" lands on "10".

## Proof

| Acceptance check                                                                     | Proven by                                                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| The slider, each epoch button and the 1 and 5 segments keep a 44px hit area at 390px | `gallery-looks.spec.ts` "each control under 44px tall or wide keeps a 44px hit area"             |
| The controls leave `UNDER_44`                                                        | The same test: its last assertion fails while a fixed control stays listed                       |
| The look changes only in the speed segments                                          | `npm run design:check` on the map screens; the `DateDock` card image in Design: Render snapshots |

## Out of scope

- The 52px minimum width that the snapshot gives the precision segments.

## Deviations

- The `e2e/design.spec.ts` focus-ring test measured the padded slider box, so it read `-6px`. It now adds the input's block padding, as the Risks entry on the focus ring expects.
