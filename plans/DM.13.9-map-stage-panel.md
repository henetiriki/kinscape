# Plan: DM.13.9: Map stage, Panel, layer and filter groups

- **Spec:** #261 (Intent #111)
- **Requirement IDs:** NFR-05, NFR-06, MAP-05, MAP-07, EXP-03
- **Status:** draft

## Approach

New parts in `app/components/`; no screen uses them yet.

- **Tokens.** Add the Stage's edges from DM.13.8's Spec, which DM.13.8 didn't write: `search-top` 20, `account-top` 24, `furniture-top` 88, `furniture-bottom` 28, `dock-height` 176, `credits-bottom` 6; `phone.pill-top` 16, `layers-top` 80, `sheet-top` 76, `overlay-top` 144, `sheet-collapsed` 152. Placement adds `popup-gap` 14 and `popup-point-y` 114, as map-desktop draws.
- **`Stage`:** the map is `children`; each slot is a placed box. The overlay area spans `dock-left` to the gutter and `furniture-top` to the dock's top; its content centres. One `@media` block at `breakpoint` holds the phone form.
- **`Panel`:** an `aside`: `Tabs fill` head, scrolling body (padding 16; a `gap` prop, 14 or 20 as each tab draws), then `footer` at `margin-top: auto`.
- **`LayerGroup`:** `role="group"` named by its overline `h3`; rows are `CheckboxField`s, which gain `size='m'` (44; Spec D1=A).
- **`ChipGroup`:** a `fieldset` and `legend`, then wrapping `Chip`s with `glyph`; `onToggle(value)`.
- **`FilterFields`:** Person and Branch `SelectField`s around Surname `TokenField` and Event type `ChipGroup`. "Clear filters" is a `Button` in the Panel's `footer`.
- **`PlacedPopup`** in `Popup.tsx`: at a point in the overlay area, shifted by `-100% - popup-gap` and `-popup-point-y`, with `PopupPointer` on its right edge.

## Decisions

**D1 · Surnames after "Clear filters"** · Decides: Tech lead

`TokenField` keeps its own values, so clearing would leave the surname chips.

- **A.** An optional `values` prop: when given, the field shows it and calls `onChange`. Current callers are unchanged.
- **B.** `FilterFields` remounts the field with a new `key` on Clear.
- **Other:** your own.

Recommended: A, because the other fields are already driven by props.

**D2 · The phone's Layers button** · Decides: Tech lead

The Spec's slots omit the Layers button its phone check places.

- **A.** A `layers` slot, phone only. `account`, `zoom` and `credits` hide there: the account sits in the pill; no phone snapshot draws zoom or credits.
- **B.** On a phone the `zoom` slot holds it.
- **Other:** your own.

Recommended: A, because each slot keeps one meaning.

**D3 · Panel tab height** · Decides: Tech lead

`Tabs fill` is 44 tall; the snapshots draw the Panel's tabs 40 tall.

- **A.** `Panel.module.css` sets them to `--size-control-s`, keeping the 44 hit area; `Tabs` is unchanged.
- **B.** Keep 44.
- **Other:** your own.

Recommended: A, because the snapshot is the reference.

**D4 · Size** · Decides: Tech lead

I estimate 700 changed lines, 270 of them tests; the cap is about 600.

- **A.** Build as one; stop and split past 750.
- **B.** Move `ChipGroup` and `FilterFields` to a new Spec.
- **Other:** your own.

Recommended: A, because the parts share one test setup.

## Files that change

| File                                                       | What             |
| ---------------------------------------------------------- | ---------------- |
| `design/tokens.json`, `app/tokens.css`                     | The values above |
| The five new parts; `Popup`, `CheckboxField`, `TokenField` | With tests       |
| `design.test.ts`; `DESIGN.md` › Layout                     | The Stage        |

## Order of work

1. Failing tests; tokens and `npm run tokens`.
2. `CheckboxField`, `TokenField`, the parts, `PlacedPopup`, `DESIGN.md`.
3. Lint, typecheck, test, validator, e2e.

## Risks

- **Placement unseen:** jsdom computes no CSS and DM.13.8 D3 adds no board, so tests read the stylesheet; the map screen Spec measures it.
- **A moved board:** changed parts keep their defaults; the `blocking` screens catch a slip.

## Proof

| Acceptance check                     | Proven by                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Stage edges from tokens, no other px | `Stage.test.tsx` slots; `design.test.ts`: no `px` outside `@media`          |
| Phone positions                      | `design.test.ts`: the `@media` block places slots from `layout.phone`       |
| Panel badge, `onSelect`              | `Panel.test.tsx`                                                            |
| LayerGroup                           | `LayerGroup.test.tsx`, click and Space                                      |
| ChipGroup                            | `ChipGroup.test.tsx`, nine chips, Space                                     |
| Popup placement                      | `Popup.test.tsx`: `--x`, `--y`, pointer; `design.test.ts`: translate tokens |
| Tests, e2e, validator, 100%, 0.5%    | Output in the PR                                                            |

## Out of scope

Wiring into `MapShell` (it keeps `left: 392px`) and `LayersPanel`; DM.13.10's sheet and dock.
