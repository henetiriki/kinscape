# Plan: SC.9.1: One-off sizes become local values with a listed reason

- **Spec:** #1202
- **Requirement IDs:** none. The Spec changes no behaviour.
- **Status:** approved

## Approach

A new module `lib/design/local.mts` holds the three reasons and reads each `/* local: <reason> */` comment. The literals test and the size check both call it. A size passes the size check if its line is a custom property with a listed reason. The `own:` path goes from both checks. Each `own:` line and each list entry of the [table](#local-values) becomes a local value, and `npm run sizes` writes the list again. The computed values stay the same, so `npm run design:check` proves that no screen changes.

## Decisions

**D11 · Four list entries that the D9 rule leaves open** · Decides: Tech lead

D9 A moves 29 entries. Its rule clearly moves 25 of them. These four are each one part of one control, but each also looks like a kind that stays:

- `KeyHint` `padding: 2px`: the block padding of the key cap, or an off-scale space.
- `CountMarker` `line-height: 1`: the count text in the disc.
- `DateSlider` `outline-offset: -6px`: the focus ring that hugs the 28px track, or an offset.
- `SearchBar` `height: 28px`: the length of the divider. Its 1px width stays with the shared dividers.

- **A.** Move all four. The table then moves 29 entries, the count of D9.
- **B.** Move only the `CountMarker` and `SearchBar` entries. `KeyHint` and `DateSlider` keep their entries for SC.13.1 (#1211). The table moves 27, and the build rewords D9 to 27.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D12 · The reason for an `own:` line that places a part** · Decides: Tech lead

Some `own:` lines place or size a part in its control and are no shape outline: `Segmented` `min-width: 40px`, `TextAreaField` `top: 8px`, `LoadingBar` `height: 20px`, and the `DateSlider` `top`, `inset` and `padding` offsets.

- **A.** Each gets `shape`. Only a 1px correction gets `nudge`. The `SignInHero` key gets `drawing`, because it is the key of the hero illustration.
- **B.** An offset that lines a part up with another (`TextAreaField` `top: 8px`, `DateSlider` `top`) gets `nudge`. The rest are as in A.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A local value in TSX `style` props: the Spec keeps inline sizes on the list.

## Local values

Each row is one rule. "List" names the entries that leave `lib/design/off-token-sizes.json`. Each other entry on the list stays (73 of 102 on `main`). Repeated uses share one local value.

| File (rule)                                      | Local values (reason)                                                                                                                                                                                                                                | Replaces                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `actions/Segmented` (`.segItem`)                 | `--seg-min: 40px` (shape)                                                                                                                                                                                                                            | 1 `own:`                                                                                                      |
| `actions/Tabs` (`.count`)                        | `--count-min: 20px` (shape)                                                                                                                                                                                                                          | 1 `own:`                                                                                                      |
| `actions/KeyHint` (`.key`)                       | `--key-pad: 2px` (shape)                                                                                                                                                                                                                             | List: `padding 2px` (D11)                                                                                     |
| `auth/SignInHero` (`.key`)                       | `--key-rule: 1.5px`, `--key-width: 22px` (drawing)                                                                                                                                                                                                   | 1 `own:`; list: `width 22px`                                                                                  |
| `feedback/Alert` (`.alert > svg`)                | `--icon-nudge: 1px` (nudge)                                                                                                                                                                                                                          | List: `margin-top 1px`                                                                                        |
| `feedback/Callout` (`.pointer`)                  | `--pointer: 12px` (shape)                                                                                                                                                                                                                            | List: `height 12px`, `width 12px`                                                                             |
| `feedback/LoadingBar` (`.bar`)                   | `--bar-height: 20px` (shape)                                                                                                                                                                                                                         | 1 `own:`                                                                                                      |
| `feedback/NoticeCard` (`.icon`)                  | `--icon-nudge: 1px` (nudge)                                                                                                                                                                                                                          | List: `margin-top 1px`                                                                                        |
| `feedback/Toast` (`.shape`, `.toast`, `.banner`) | `--shape-height: 48px`, `--toast-height: 50px`, `--banner-height: 52px` (shape)                                                                                                                                                                      | 3 `own:`                                                                                                      |
| `forms/Checkbox` (`.checkbox`, `.tick`)          | `--box-border: 1.5px`, `--tick: 14px` (shape)                                                                                                                                                                                                        | 1 `own:`; list: `height 14px`, `width 14px`                                                                   |
| `forms/TextAreaField` (`… > svg`)                | `--mark-top: 8px` (shape)                                                                                                                                                                                                                            | 1 `own:`                                                                                                      |
| `overlays/BottomSheet` (`.grabber`)              | `--grabber-height: 20px` (shape)                                                                                                                                                                                                                     | 1 `own:`                                                                                                      |
| `overlays/ClickPopup` (`.dot`)                   | `--dot-ring: 2.5px`, `--dot: 12px` (shape)                                                                                                                                                                                                           | 1 `own:`; list: `height 12px`, `width 12px`                                                                   |
| `overlays/PinPopup` (`.event`)                   | `--glyph: 16px` (shape)                                                                                                                                                                                                                              | 1 `own:`                                                                                                      |
| `overlays/Popup` (`.pointer`)                    | `--pointer-radius: 2px`, `--pointer: 16px` (shape)                                                                                                                                                                                                   | 3 `own:`                                                                                                      |
| `lib/ui/EventGlyph` (`.glyph`)                   | `--glyph: 1em` (shape)                                                                                                                                                                                                                               | List: `height 1em`, `width 1em`                                                                               |
| `map/ContestedNote` (`.swatch`)                  | `--swatch-radius: 2px`, `--swatch-height: 14px`, `--swatch-width: 18px` (shape)                                                                                                                                                                      | 1 `own:`; list: `height 14px`, `width 18px`                                                                   |
| `map/CountMarker` (`.marker`)                    | `--disc: 32px`, `--disc-hover: 36px`, `--disc-pressed: 28px`, `--halo-pressed: 40px`, `--count-line: 1` (shape)                                                                                                                                      | 6 `own:`; list: `height`/`width` `32px` and `28px`, `line-height 1` (D11)                                     |
| `map/CountMarker` (`.ring`)                      | `--gap: 5px` gets `/* local: shape */`                                                                                                                                                                                                               | List: `--gap 5px`                                                                                             |
| `map/DateSlider` (`.slider`)                     | `--thumb: 26px`, `--track-top: 12px`, `--mark-top: 8px`, `--mark-height: 12px`, `--band-radius: 2px`, `--tick-width: 2px`, `--years-top: 24px`, `--input-pad: 8px`, `--ring-offset: -6px`, `--thumb-ring: 4px` (shape); `--thumb-nudge: 1px` (nudge) | 8 `own:`; list: `--thumb 26px`, `height 12px` (2), `width 2px`, `margin-top 1px`, `outline-offset -6px` (D11) |
| `map/Legend` (`.hatch`)                          | `--swatch-height: 16px`, `--swatch-width: 32px` (shape)                                                                                                                                                                                              | 1 `own:`; list: `width 32px`                                                                                  |
| `map/PinFan` (`.pin`)                            | `--glyph: 22px`, `--disc: 36px`, `--disc-hover: 40px`, `--disc-pressed: 32px`, `--halo-pressed: 44px` (shape)                                                                                                                                        | 9 `own:`; list: `height 32px`, `width 32px`                                                                   |
| `map/SearchBar` (`.divider`)                     | `--divider-height: 28px` (shape)                                                                                                                                                                                                                     | List: `height 28px` (D11)                                                                                     |

Three `own:` lines take a token (D3): `Credits` and `PlaceMarker` `z-index: var(--z-furniture)`, `Callout` `font-weight: var(--type-label-weight)`.

## Files that change

| File                                                                                                             | New / changed | What                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/local.mts`                                                                                           | New           | `REASONS` (`shape`, `nudge`, `drawing`). `localValues(css)`: each `local:` comment with its line, name, value and reason. `localProblems(css)`: no reason, an unlisted reason, `local:` off a custom property, any `own:`. |
| `lib/design/groups.mts`                                                                                          | Changed       | `OWN` goes.                                                                                                                                                                                                                |
| `lib/design/literals.mts`                                                                                        | Changed       | The `own:` path goes. It adds `localProblems`. The message says "use var(--token)".                                                                                                                                        |
| `lib/design/sizes.mts`                                                                                           | Changed       | `own` and `OWN_LINE` go. A CSS size passes if its line has a local value with a listed reason. The fail message names a local value in place of `own:`.                                                                    |
| `lib/design/types.ts`                                                                                            | Changed       | `Size.own` becomes `Size.local`. New `LocalValue` type.                                                                                                                                                                    |
| `scripts/sizes.mts`                                                                                              | Changed       | After it writes the list, it prints each local value as `<file>:<line>: <name> (<reason>)`.                                                                                                                                |
| `lib/design/off-token-sizes.json`                                                                                | Changed       | The 29 entries of the table leave. `npm run sizes` writes it.                                                                                                                                                              |
| The 22 `.module.css` files of the [table](#local-values), plus `Credits.module.css` and `PlaceMarker.module.css` | Changed       | As the table and D3 say.                                                                                                                                                                                                   |
| `design/kinscape.tokens.json`                                                                                    | Changed       | The `z.furniture` `$description` adds the open Pin fan.                                                                                                                                                                    |
| `design/topics/tokens.md`                                                                                        | Changed       | › Names and › The checks point to local values. › The size check replaces the `own:` case with local values, the reasons and the `npm run sizes` print.                                                                    |
| `docs/architecture.md`                                                                                           | Changed       | Row "Tokens are the one source": local values and `/* local: <reason> */` in place of `own:`; Enforced by names review of each local value. Its _Where_ cell adds `lib/design/local.mts`.                                  |
| `lib/design/__tests__/local.test.ts`                                                                             | New           | Each reason passes. No reason, `misc`, `local:` off a custom property and `own:` each fail with the line.                                                                                                                  |
| `lib/design/__tests__/literals.test.ts`                                                                          | Changed       | The `own comment` cases become local-value cases. A token literal with `own:` now fails.                                                                                                                                   |
| `lib/design/__tests__/sizes.test.ts`                                                                             | Changed       | The `own comment` cases become local-value cases, and `own:` no longer passes a size in CSS or a `style` prop. The repo part adds: no CSS size file has a `localProblems` problem.                                         |
| `scripts/__tests__/sizes.test.ts`                                                                                | Changed       | The run prints each local value with file, line and reason.                                                                                                                                                                |
| `lib/design/__tests__/tokens-page.test.ts`                                                                       | Changed       | › The size check names each reason of `REASONS`.                                                                                                                                                                           |
| `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                        | Changed       | Design system steps 3 to 5 only.                                                                                                                                                                                           |

## Order of work

1. Write `local.test.ts` and the new `sizes.test.ts` and `literals.test.ts` cases. See them fail on the behaviour.
2. Build `local.mts`. Wire it into `literals.mts` and `sizes.mts`. Remove `OWN`.
3. Move each row of the table and the three token lines. Run `npm run sizes`. Compare the removed entries with the table.
4. Add the print to `scripts/sizes.mts`.
5. Edit the `z.furniture` `$description`. Run `npm run tokens`.
6. Edit `design/topics/tokens.md` and `docs/architecture.md`.
7. Run `npm run design:check`.
8. Design system steps ([Changing the design system](../design/CANVAS.md#changing-the-design-system)):
   1. Step 2: the build agent runs `npm run design-system`.
   2. Steps 3 to 5: a local Claude Code session that the tech lead starts runs them. It needs a signed-in account. The build agent asks in the PR and keeps it a draft.
   3. Step 6: no board shows the change, so push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots.
9. Run the checks of AGENTS.md › Commands.

## Risks

- A local value on an outer rule must reach each pseudo-element that uses it. `--thumb` on `.slider` already reaches the range thumbs.
- The snapshot export skips custom properties but writes computed values, which do not change.
- The diff can pass the cap of 660. Then the tech lead adds `size: accepted` (D10).

## Proof

| Acceptance check                                                      | Proven by                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Each screen passes `npm run design:check`                             | `npm run design:check`                                                    |
| `git grep "own:"` on `*.css` and `docs/architecture.md` finds nothing | The grep, pasted in Evidence                                              |
| A local value with a listed reason passes                             | `local.test.ts`, `sizes.test.ts`, `literals.test.ts`                      |
| No reason or `misc` fails with file and line                          | `local.test.ts`; the repo parts of `literals.test.ts` and `sizes.test.ts` |
| `local:` off a custom property fails                                  | `local.test.ts`                                                           |
| `own:` in a `.module.css` file fails                                  | `local.test.ts`; `literals.test.ts` repo part names the file              |
| An off-scale literal off the list fails                               | `sizes.test.ts` (existing case)                                           |
| The list holds no moved entry and no nudge entry                      | `sizes.test.ts` repo part; the diff of `off-token-sizes.json`             |
| The table matches the list                                            | Review of the list diff against the [table](#local-values)                |
| The three token lines                                                 | `literals.test.ts` repo part; the diff                                    |
| `npm run sizes` prints each local value                               | `scripts/__tests__/sizes.test.ts`                                         |
| The checks of AGENTS.md › Commands pass                               | The command output, pasted in Evidence                                    |
| Design system steps 2 to 6 are done                                   | The step commits on the branch                                            |
| The canvas copy has the same sha256                                   | Step 5.2 of the refresh                                                   |

## Out of scope

- Shared sizes on the list: SC.13.1 (#1211) and SC.14 (#1208).
- Layout widths, off-scale spaces, timers, bars and border compensations of one component: SC.13.1 (#1211).
- The list goes, and the check fails with no list: SC.16 (#1210).
- Inline `style` sizes in TSX stay on the list.

## Deviations
