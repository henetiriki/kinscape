# Plan: EV.2: Event glyphs as SVG

- **Spec:** #304
- **Requirement IDs:** PIN-03, NFR-06
- **Status:** approved

## Approach

`EventGlyph` draws an inline 24 × 24 SVG with one `currentColor` path from `EVENT_PATHS`. The paths are copied from `design/source/kse-*.svg`, the way `Icon` copies `PATHS`. The glyph is 1em square in `--pin` and has no `size` prop. A new `EVENT_ORDER` gives the display order. `EventType` becomes `keyof typeof EVENT_PATHS`, which adds Land and Occupation (PIN-03 as EV.1 left it). A sync test reads each `kse-*.svg` and fails when a path differs. Callers stop passing `size`; the kit boards set `font-size` on a wrapper. The map-style sample draws four of the SVGs with the white pin halo.

## Decisions

**D1 · Land and Occupation** · Decides: Tech lead
**Answer: A** (Tech lead)

- **A.** Ten Event types. The snapshots and `kse-land.svg` and `kse-occupation.svg` add Land and Occupation; the Spec's "eight" becomes "ten".

**D4 · Baptism label** · Decides: PO
**Answer: A** (as the snapshots)

- **A.** The UI says Baptism, Land and Occupation.

## Files that change

| File                                                | New / changed     | What                                                                                           |
| --------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `app/components/map/EventGlyph.tsx`, `.module.css`  | changed           | `EVENT_PATHS` (10), `EVENT_ORDER`, SVG render; 1em, `vertical-align: -0.125em`                 |
| `app/components/map/types.ts`                       | changed           | `EventType` from `EVENT_PATHS`                                                                 |
| `app/components/map/Legend.tsx` (+ css)             | changed           | drop `size={13}`; 13px on the row                                                              |
| `app/design-kit/map-furniture/sections.tsx` (+ css) | changed           | `EVENT_ORDER`, names for Land and Occupation, "All ten", 10-column grid, sizes set on wrappers |
| `app/design-kit/inputs/sections.tsx`                | changed           | Land and Occupation chips (off), "All ten"                                                     |
| `app/design-kit/map-style/Preview.tsx`              | changed           | glyphs sample: Birth, Residence, Marriage, Death SVGs, 16px, `map.pin` fill and halo           |
| `app/components/**/__tests__/*`                     | changed           | see Proof                                                                                      |
| `design/DESIGN.md` › Event glyphs                   | changed           | each Event type with its SVG file, in order                                                    |
| `e2e/*.spec.ts`                                     | changed if needed | any counts or glyph text that break                                                            |

The Spec issue body changes "eight" to "ten" and records D4 (`gh issue edit`).

## Order of work

1. Commit this plan as `plan(EV.2): approved by @henetiriki`.
2. `EventGlyph`, its CSS, `types.ts`, the sync test and the unit test.
3. Callers and kit boards, then their tests.
4. Map-style sample, then DESIGN.md.
5. Lint, `npm test`, the validator, `npm run e2e` and `npm run design:check`. Fix any differences with `/match-design`.
6. Open the PR (`ready-for-po`) with map-furniture shots on desktop and phone.

## Risks

- Sub-pixel differences between the SVG and the snapshot baseline can fail `design:check`. Copy the snapshot's `vertical-align` and sizes exactly.
- `Object.keys(EVENT_PATHS)` is in alphabetical order. Everything that renders in display order uses `EVENT_ORDER`.

## Proof

| Acceptance check                                                                                               | Proven by                                                                         |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| One `svg` per Event type: viewBox 0 0 24 24, `fill=currentColor`, `aria-hidden`, path equal to its `kse-*.svg` | `EventGlyph.test.tsx`                                                             |
| 1em at 13px, colour `--pin`                                                                                    | `EventGlyph.test.tsx` (CSS module), e2e computed style in `map-furniture.spec.ts` |
| A changed `kse-*.svg` path fails the sync test; every file maps to one Event type                              | `EventGlyph.sync.test.ts`                                                         |
| Chip, ChipGroup, Legend and Popup: glyph before the name, no glyph character or U+FE0E                         | `Parts`, `ChipGroup`, `Legend`, `Popup` tests                                     |
| 30 screens match                                                                                               | `npm run design:check`                                                            |
| The PO can tell the glyphs apart at 12px without colour                                                        | Preview and shots in the PR                                                       |
| Lint, 100% coverage, validator, e2e                                                                            | Output pasted in the PR                                                           |

## Out of scope

- Map pin SDF icons, their halo and the fuzzy fade (EXP-02).
- The Filters screen (`map-*-filters`): not built yet.

## Deviations

- 1em and `--pin` are proven by a unit test on the CSS module only; no e2e computed-style check.
- The map-furniture "Facts" text and `design/screens.json` heights follow the new snapshots.
