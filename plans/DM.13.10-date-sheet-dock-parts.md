# Plan: DM.13.10: Phone bottom sheet and Date dock parts

- **Spec:** #262 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06, MAP-03, MAP-08, MAP-09
- **Status:** approved

## Approach

New parts in `app/components/`, props only; new `DateDock` props are optional.

- **`BottomSheet`:** a `section` named "Map date", not a dialog; 152 or 432 tall (new `layout.phone.sheet-expanded`). "Expand the sheet" (64×20, `aria-expanded`) calls `onExpandedChange(!expanded)`.
- **`PlayButton`:** a pill, or `round`; both named "Play through time".
- **`JumpTo`:** `epochs: { label?: string; year: number }[]`; `current` is outlined with `aria-current`; `onJump(year)`.
- **`ContestedNote`:** swatch and "N contested claims on this date"; nothing at 0.
- **`DateKeyHints`:** ← → "1 {precision} · with Shift ×10".
- **`DateSlider`:** optional `ticks` and `contested` years. A decorative layer under the native range draws the 4px track, ticks, hatched spans and labels at `calc(13px + (100% - 26px) * f)`, in line with the 26px thumb. `DateDockDrawing`'s hatch moves to `hatch.ts`.
- **`DateDock`:** `DateField` (`placement='above'`) replaces the read-only input and can set the precision. Desktop adds the Spec's parts; `sheet` keeps the stepper, round Play and slider, in a `div` so the region isn't named twice.

## Decisions

**D1 · Speed control** · Decides: Tech lead

The Spec says "pressed state"; `DESIGN.md` makes speed a Segmented control: radios, which are checked.

- **A.** `Segmented`, like precision; the acceptance check is reworded to "checked".
- ~~**B.** Three toggle buttons with `aria-pressed`, styled as `Segmented`.~~

**Answer: A** (@henetiriki)

**D2 · Slider year labels** · Decides: Tech lead

The snapshot labels 1652, 1700 to 1950 by 50 without 1900, and Today.

- **A.** Computed: 1652, every 50th year, Today; 1900 shows.
- ~~**B.** A `labels` prop; `DateDock` passes the snapshot's years.~~

**Answer: A** (@henetiriki)

**D3 · The slider in the collapsed sheet** · Decides: Tech lead

The collapsed snapshot has no slider; the expanded one has.

- **A.** `DateDock` takes `expanded` with `sheet` and draws the slider only then.
- ~~**B.** Always draw it; the caller hides it.~~

**Answer: A** (@henetiriki)

**D4 · Shift ×10** · Decides: Tech lead

The hints promise Shift ×10; the native range steps by 1.

- **A.** `DateSlider` handles Shift+←/→ as 10 steps.
- ~~**B.** Leave it to the map screen Spec.~~

**Answer: A** (@henetiriki)

**D5 · Size** · Decides: Tech lead

I estimate 850 changed lines, 320 of them tests; the cap is about 600.

- **A.** Build as one; stop and ask past 950.
- ~~**B.** Split off `DateSlider`'s ticks, hatch and labels.~~

**Answer: A** (@henetiriki)

**D6 · Size overrun** · Decides: Tech lead

The build changes 1012 lines, 376 of them tests.

- **A.** Keep one PR.
- **B.** Split off `DateSlider`'s ticks, hatch and labels.
- **Other:** your own.

## Deviations

- `DateDock` takes `sheet={{ expanded, onExpandedChange }}`; Play, Jump to and the note show only when passed.
- `e2e/design.spec.ts` takes a text field's 2px brand border, with no outline, as its focus mark.
- `DateField.module.css`: `.row >` makes phone callout padding win.

## Files that change

| File                                                                               | What                   |
| ---------------------------------------------------------------------------------- | ---------------------- |
| `BottomSheet`, `PlayButton`, `JumpTo`, `ContestedNote`, `DateKeyHints`, `hatch.ts` | New, with tests        |
| `DateSlider`, `DateDock` and their CSS and tests                                   | As above               |
| `design/tokens.json`, `app/tokens.css`                                             | `phone.sheet-expanded` |
| `map-furniture/DateDockDrawing.*`                                                  | Read `hatch.ts`        |
| `design/DESIGN.md`                                                                 | Date dock, phone sheet |

## Order of work

1. Failing tests.
2. Token; `hatch.ts`; the parts; `DateSlider`; `DateDock`; `DESIGN.md`.
3. All checks.

## Risks

- **The app's dock changes:** `MapShell`'s dock gets the field, labels and hints; e2e covers them.
- **Marks off the thumb:** jsdom has no CSS; tests read each mark's `--f`.

## Proof

| Acceptance check                          | Proven by                                       |
| ----------------------------------------- | ----------------------------------------------- |
| Expand calls back; not a dialog           | `DateParts.test.tsx`: no `aria-modal`, no inert |
| 1652, 1902 buttons; `aria-current`; jump  | `DateParts.test.tsx`                            |
| Hatched 1900–1902; ticks at epochs        | `DateSlider.test.tsx`                           |
| Play and speeds by keyboard, state        | `DateDock.test.tsx`: each takes focus; checked  |
| `DateField`; error above the field        | `DateDock.test.tsx`                             |
| Phone sheet lacks precision, speed, hints | `DateDock.test.tsx` with `sheet`                |
| Tests, e2e, validator, 100%, 0.5%         | Output in the PR                                |

## Out of scope

Passing the new props from `MapShell`; Play timers; Play's pause look; dragging the sheet; tablet.
