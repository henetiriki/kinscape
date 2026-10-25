# Plan: DM.13.10: Phone bottom sheet and Date dock parts

- **Spec:** #262 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06, MAP-03, MAP-08, MAP-09
- **Status:** draft

## Approach

New parts in `app/components/`, props only; new `DateDock` props are optional.

- **`BottomSheet`:** a `section` named "Map date", not a dialog; 152 or 432 tall (new `layout.phone.sheet-expanded`) from `expanded`. "Expand the sheet" (64×20, 40×4 bar, `aria-expanded`) calls `onExpandedChange(!expanded)`.
- **`PlayButton`:** a pill, or `round`; both named "Play through time".
- **`JumpTo`:** `epochs: { label?: string; year: number }[]` ("Today" is a label); `current` is outlined with `aria-current`; `onJump(year)`.
- **`ContestedNote`:** swatch and "N contested claims on this date"; nothing at 0.
- **`DateKeyHints`:** ← → "1 {precision} · with Shift ×10".
- **`DateSlider`:** optional `ticks` and `contested` (years). A decorative layer under the native range draws the 4px track, inner ticks, hatched spans and labels at `calc(13px + (100% - 26px) * f)`, in line with the 26px thumb. The hatch style moves from `DateDockDrawing` to a shared `hatch.ts`.
- **`DateDock`:** `DateField` (`placement='above'`) replaces the read-only input and can set the precision. Desktop adds the Spec's parts; `sheet` keeps the stepper (field filled), round Play and slider, in a `div` so the region isn't named twice.

## Decisions

**D1 · Speed control** · Decides: Tech lead

The Spec says "pressed state"; `DESIGN.md` makes speed a Segmented control: radios, which are checked.

- **A.** `Segmented`, like precision; the acceptance check is reworded to "checked".
- **B.** Three toggle buttons with `aria-pressed`, styled as `Segmented`.
- **Other:** your own.

Recommended: A, because it matches precision.

**D2 · Slider year labels** · Decides: Tech lead

The snapshot labels 1652, 1700 to 1950 by 50 without 1900, and Today.

- **A.** Computed: 1652, every 50th year, Today; 1900 shows.
- **B.** A `labels` prop; `DateDock` passes the snapshot's years.
- **Other:** your own.

Recommended: A, because no map screen is `blocking` yet.

**D3 · The slider in the collapsed sheet** · Decides: Tech lead

The collapsed snapshot has no slider; the expanded one has.

- **A.** `DateDock` takes `expanded` with `sheet` and draws the slider only then.
- **B.** Always draw it; the caller hides it.
- **Other:** your own.

Recommended: A, because the dock owns the slider's precision.

**D4 · Shift ×10** · Decides: Tech lead

The hints promise Shift ×10; the native range steps by 1.

- **A.** `DateSlider` handles Shift+←/→ as 10 steps.
- **B.** Leave it to the map screen Spec.
- **Other:** your own.

Recommended: A, so the hint is true.

**D5 · Size** · Decides: Tech lead

I estimate 850 changed lines, 320 of them tests; the cap is about 600.

- **A.** Build as one; stop and ask past 950.
- **B.** Move `DateSlider`'s ticks, hatch and labels to a new Spec.
- **Other:** your own.

## Files that change

| File                                                                               | What                   |
| ---------------------------------------------------------------------------------- | ---------------------- |
| `BottomSheet`, `PlayButton`, `JumpTo`, `ContestedNote`, `DateKeyHints`, `hatch.ts` | New, with tests        |
| `DateSlider`, `DateDock` and their CSS and tests                                   | As above               |
| `design/tokens.json`, `app/tokens.css`                                             | `phone.sheet-expanded` |
| `map-furniture/DateDockDrawing.*`                                                  | Read `hatch.ts`        |
| `design/DESIGN.md`                                                                 | Date dock, phone sheet |

## Order of work

1. Failing tests, from the acceptance checks.
2. Token; `hatch.ts`; the five parts; `DateSlider`; `DateDock`; `DESIGN.md`.
3. Lint, typecheck, test, validator, e2e.

## Risks

- **The app's dock changes:** `MapShell` gets the new field and slider; e2e covers them. No `blocking` screen renders either.
- **Marks off the thumb:** jsdom computes no CSS; tests read each mark's `--f`.

## Proof

| Acceptance check                          | Proven by                                         |
| ----------------------------------------- | ------------------------------------------------- |
| Expand calls back; not a dialog           | `BottomSheet.test.tsx`: no `aria-modal`, no inert |
| 1652, 1902 buttons; `aria-current`; jump  | `JumpTo.test.tsx`                                 |
| Hatched 1900–1902; ticks at epochs        | `DateSlider.test.tsx`                             |
| Play and speeds by keyboard, state        | `DateDock.test.tsx`: Tab order, D1 state          |
| `DateField`; error above the field        | `DateDock.test.tsx`                               |
| Phone sheet lacks precision, speed, hints | `DateDock.test.tsx` with `sheet`                  |
| Tests, e2e, validator, 100%, 0.5%         | Output in the PR                                  |

## Out of scope

Wiring into `MapShell`; Play timers, epochs and contested counts; Play's pause look; dragging the sheet; board 08's drawing; tablet.
