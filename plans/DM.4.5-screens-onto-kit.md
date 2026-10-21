# Plan: DM.4.5: Existing screens onto modules and kit controls

- **Spec:** #134 (Intent #111)
- **Requirement IDs:** NFR-06, MAP-03
- **Status:** approved

## Approach

Each map component gets a `*.module.css` holding the rules it now takes from `globals.css`, then swaps hand-made controls for kit ones (Spec D1 A): `IconButton` for Back and Forward, with the board's 16px chevron SVGs; `Segmented` for Precision; `Checkbox` for the layer row; `<Text>` for the panel heading (overline), layer name (label), help (small), dialog title (h2) and date column (mono). `Text` takes no `className`, so spacing lives on the parent in its module (`gap`). Values come from `design/source/map-desktop.html` and `map-sources.html`. The board's Attributions link (11px, inline) and dialog close (borderless, round) aren't kit controls, so each stays a `<button>` styled from the board in its module. Names, ids and the date field are unchanged. `globals.css` keeps the reset, body, `:focus-visible` and `.map`.

## Decisions

**D1 · Labelling the layer name** · Decides: Tech lead
`Text` types its props as a `span`'s, so `<Text as='label'>` can't take `htmlFor`.

- **A.** A plain `<label htmlFor>` wraps `<Text variant='label'>`.
- **B.** Widen `Text`'s props so `as='label'` accepts `htmlFor`.
- **Other:** your own.

Recommended: A, because B changes a kit API the Spec doesn't ask for.

**Answer (tech lead, PR #140): B**, despite the API change.

**D2 · Precision keys** · Decides: PO
Today Year, Month and Day are three Tab stops and the arrow keys do nothing. The kit's `Segmented` is native radios: one Tab stop, arrows move the choice.

- **A.** Take the kit behaviour; reword the Spec's keyboard check to say so.
- **B.** Keep three Tab stops by changing `Segmented` for this screen.
- **Other:** your own.

Recommended: A, because it is the standard radio-group pattern and the kit already proves it on `/design-kit`.

**Answer (PO, via PR #140): A.**

## Files that change

| File (`app/components/`)           | New / changed | What                                                        |
| ---------------------------------- | ------------- | ----------------------------------------------------------- |
| `MapShell.tsx`, `.module.css`      | Changed / new | `.bottom`                                                   |
| `LayersPanel.tsx`, `.module.css`   | Changed / new | `.panel`, row layout; `Checkbox`; D1 B                      |
| `Text.tsx`, `__tests__/Text.test.tsx` | Changed       | `as='label'` accepts `htmlFor` (D1 B)                       |
| `DateDock.tsx`, `.module.css`      | Changed / new | `.dock*`, field's mono rules; `IconButton`s; `Segmented`    |
| `DateSlider.tsx`, `.module.css`    | Changed / new | Slider rules, same look                                     |
| `Credits.tsx`, `.module.css`       | Changed / new | `.credits`, Attributions button                             |
| `SourcesDialog.tsx`, `.module.css` | Changed / new | `.scrim`, `.dialog*`, table; `Text` h2, mono                |
| `../globals.css`                   | Changed       | Delete the moved rules and `.mono`                          |
| `__tests__/*`                      | Changed       | `aria-checked` becomes `checked`; queries by role and name  |
| `e2e/smoke.spec.ts`                | Changed       | `.credits` locator becomes a role query                     |
| `e2e/date-dock.spec.ts`            | Changed       | New keyboard test: Tab order, arrows, Space on the checkbox |

## Order of work

1. Run `npm run design:check`; keep the `map-desktop` number.
2. Panel, slider, dock, credits, MapShell, dialog; run each one's tests after it.
3. Delete the moved rules from `globals.css`.
4. Lint, format, tests (100%), boundaries, e2e, build, `design:check`.
5. Side-by-side image of `/` against `design/map-desktop.jpg` for the PR, listing the differences (Spec D2 A: stays `report`).

## Risks

- **Precision value.** `Segmented` returns a `string`; a guard against `PRECISIONS` narrows it to `Precision`, with no cast.
- **Focus ring.** `e2e/design.spec.ts` checks every Tab stop's outline; the kit controls carry the ring, so it should pass unchanged.
- **Size.** About 800 lines, mostly moves (Spec D3 A).

## Proof

| Acceptance check                          | Proven by                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Dock and panel use kit components         | Unit tests find each control by role, radios as native `input`s         |
| Matches `map-desktop.jpg` outside the map | `design:check` output; side-by-side image and difference list in the PR |
| Tab, arrow keys, Space                    | New e2e keyboard test (D2)                                              |
| Checkboxes and radio group keep names     | `getByRole('checkbox' \| 'radiogroup', { name })` in unit tests         |
| `globals.css` holds none of the old rules | `grep -E '\.(dock\|segmented\|layer\|panel\|dialog\|credits)'` is empty |
| Tests, e2e and boundaries pass, 100%      | Their output in the PR                                                  |

## Out of scope

- Board content the build lacks: panel tabs and other layers, Play and speed, contested-claims note, the dialog's lead line. They go in the PR's difference list.
