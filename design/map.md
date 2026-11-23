---
paths:
  - 'features/map/**'
  - 'lib/ui/EventGlyph.tsx'
  - 'design/source/kse-*.svg'
  - 'data/sources.json'
---

# Map

## Event glyphs

Each Event type is one 24 × 24 path. It uses `currentColor` (`--pin`) as its fill and is 1em square. The order below is the same everywhere.

| Event      | SVG                           |
| ---------- | ----------------------------- |
| Birth      | `kse-birth.svg`               |
| Baptism    | `kse-baptism-christening.svg` |
| Residence  | `kse-residence.svg`           |
| Marriage   | `kse-marriage.svg`            |
| Divorce    | `kse-divorce.svg`             |
| Death      | `kse-death.svg`               |
| Burial     | `kse-burial.svg`              |
| Land       | `kse-land.svg`                |
| Occupation | `kse-occupation.svg`          |
| Other      | `kse-other.svg`               |

On the map these are SDF icons in `--pin`, with a 2px white halo.

## Map style

Every map visual is something MapLibre GL can draw: flat fills, solid or dashed lines, one `fill-pattern` hatch, a hillshade layer, circles and SDF symbols. [map-style.jpg](map-style.jpg) shows the full layer stack. The map colours:

| Use                     | Value                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Sea (background)        | `map.sea`                                                                                           |
| Land                    | `map.land`                                                                                          |
| Coastline               | `map.coastline`                                                                                     |
| Rivers                  | `map.river`, wider with zoom                                                                        |
| Polity border           | `map.border`; dashed when confidence is low                                                         |
| District border         | `map.district`                                                                                      |
| Changed border (MAP-11) | `map.changed` (`--brand`), fades out                                                                |
| Polity fills            | `map.polity`, keyed by Polity id; `default` for any other (muted tints of similar lightness)        |
| Contested hatch         | 45° stripes, 3px in 9px, `map.hatch`                                                                |
| Hillshade               | `map.hillshade`                                                                                     |
| Polity label            | Public Sans SemiBold, uppercase; `map.polity-label`; contested note in italic `map.contested-label` |
| Place label             | Public Sans Medium; `map.place-label`; dot `map.place-dot`                                          |
| Water and river labels  | Public Sans Italic; `map.water-label`, `map.river-label`; sizes in tokens                           |
| Context labels          | Public Sans Italic, uppercase, `map.context-label`                                                  |
| Quiet labels            | `map.muted-label`                                                                                   |
| Label halo              | `map.label-halo`, the land colour                                                                   |
| Pins                    | `map.pin`, with its `halo` ring                                                                     |
| Uncertainty halo        | `map.pin-halo`; radius grows with the date range                                                    |
| Selected point          | `map.selected` (`--brand`)                                                                          |

Avoid what MapLibre can't do: shadows, glows or gradients on polygons, dashed circle outlines, and boxes behind labels. Anything you click or type into is HTML over the map.

## Attributions

NFR-08 requires the app to credit every source. The design fixes the format. The licence checks (NFR-08, BND-06) supply the text.

- One sources file in the repo lists each source: layer, title, author, licence, licence link, attribution text and the date of the check. After you check its licence, add a source to the map.
- **Credits line** under the date dock is one line at every desktop width: a "Credits" button with the `info` icon, " · " and an "Attributions" link. `type.credits`, `--credits`.
- **Credits card:** The "Credits" button sets `aria-expanded`. It opens a card above the line with the attribution text of the sources on screen, joined with " · ". The card covers the dock's corner and moves nothing. A second press, a press outside it or Esc closes it. A dialog on top keeps the card open.
- The scale bar sits under the Layers panel: left at the gutter, bottom at `credits-bottom`. It uses `type.credits` in `--credits` on `--white-60`, with a 1px `--credits` rule on the left, bottom and right. MapLibre sets the distance and the width. A phone hides it.
- **Sources and attributions dialog** opens from the "Attributions" link or the account menu. It lists every source as layer, source (with its detail line), licence and date checked.
- The boards show the rows of `data/sources.json`. A test keeps them in step.
