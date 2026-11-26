---
paths:
  - 'design/kinscape.tokens.json'
  - 'app/tokens.css'
  - 'app/layout.tsx'
  - 'app/components/**'
  - 'features/*/components/**'
  - 'lib/ui/**'
---

# Foundations

## Brand

- The icon is `app/icon0.svg`: a white tree on forest green, with a 25% corner radius. Never recolour it.
- Wordmark: the icon, then "KinScape" in Bricolage Grotesque 700.
- Tagline: "Borders move. Places don't."

## Fonts

| Font                | Weights                           | Used for                                                |
| ------------------- | --------------------------------- | ------------------------------------------------------- |
| Bricolage Grotesque | 500, 700                          | Wordmark, page titles, the place name in a popup        |
| Public Sans         | 400, 500, 600, italic 400 and 500 | All UI text and every map label                         |
| JetBrains Mono      | 400, 500                          | Dates, coordinates, keyboard hints, code. Ligatures off |

Components set these styles with `<Text variant>` (`app/components/foundation/Text.tsx`). The Text component card shows them.

All three are OFL fonts. The app and the snapshots load the same `@fontsource` files, pinned in `package-lock.json`. Map labels need Public Sans Regular, SemiBold and Italic as glyph PBFs too (see [Map style](map.md#map-style)).

| Style                             | Font · size / line · weight                | Used for                           |
| --------------------------------- | ------------------------------------------ | ---------------------------------- |
| Display (`display`)               | Bricolage 52 / 56 · 700 · tracking −0.02em | Sign-in headline                   |
| H1 (`h1`)                         | Bricolage 32 / 40 · 500 · −0.015em         | Page title                         |
| H1 phone (`h1-phone`)             | Bricolage 28 / 32 · 500 · −0.015em         | Page title on a phone              |
| H2 (`h2`)                         | Bricolage 24 / 32 · 700                    | Dialog and section titles          |
| H3 (`h3`)                         | Bricolage 22 / 28 · 700                    | Place name in a popup, cards       |
| Title (`title`)                   | Public Sans 15 / 22 · 600                  | Notice titles, row titles          |
| Body L (`body-l`)                 | Public Sans 16 / 24 · 400                  | Sign-in, fields                    |
| Body (`body`)                     | Public Sans 15 / 22 · 400                  | Panels, popups                     |
| Label (`label`)                   | Public Sans 14 / 20 · 600                  | Field labels, layer rows           |
| Small (`small`)                   | Public Sans 13 / 20 · 400, `--ink-3`       | Helper text                        |
| Caption (`caption`)               | Public Sans 12.5 / 18 · 400, `--ink-3`     | Credits, footnotes                 |
| Credits (`credits`)               | Public Sans 11 / 16 · 400, `--credits`     | Credits line and scale bar         |
| Overline (`overline`)             | Public Sans 11 / 16 · 600, caps, 0.1em     | Section headings                   |
| Overline tight (`overline-tight`) | Public Sans 11 / 12 · 600, caps, 0.1em     | Layer group headings               |
| Button (`button`)                 | Public Sans 16 / 24 · 600                  | 50px buttons (sign-in)             |
| Control (`control`)               | Public Sans 15 / 22 · 600                  | 44px buttons and controls          |
| Chip (`chip`)                     | Public Sans 13.5 / 20 · 600                | Chip that is on                    |
| Chip off (`chip-off`)             | Public Sans 13.5 / 20 · 400                | Chip that is off                   |
| Button S (`button-s`)             | Public Sans 14 / 20 · 600                  | 40px and 36px buttons              |
| Link (`link`)                     | Public Sans 15 / 22 · 500                  | Links in running text              |
| Link S (`link-s`)                 | Public Sans 13 / 20 · 500                  | Links in helper text and footnotes |
| Mono L (`mono-l`)                 | JetBrains Mono 22 / 28 · 500               | Map date field                     |
| Mono M (`mono-m`)                 | JetBrains Mono 15 / 22 · 400               | Fuzzy date field                   |
| Mono (`mono`)                     | JetBrains Mono 12 / 16 · 400               | Dates and coordinates in lists     |

Line height is 1.1–1.25 for headings, 1.45–1.55 for sentences and 1.3–1.4 for one-line UI text. Keep running text under 68 characters a line.

## Colours

[`design/kinscape.tokens.json`](../kinscape.tokens.json) holds every value (colours, type, spacing, radii, shadows, focus, motion and the map). The app reads the tokens as CSS custom properties. Colours are `--brand` and `--ink-3`; other groups keep their group name (`--radius-panel`). Use a token, never its value. The usage text of a colour token in the design system gives its role and its contrast ratio. The `$description` of each token says where it is used.

Text colours pass 4.5:1 on `--surface` and `--surface-2`. Each system text colour passes on its own background. Field borders, system borders and icons, and the focus ring pass 3:1. Colour never carries meaning alone: event types have shapes, the map hatches contested claims and dashes approximate borders (NFR-06).

## Shape and depth

The `$description` of each `radius` and `shadow` token says where it goes.

| Token   | Value                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spacing | 4px steps; 16–20 inside panels, 24 between floating elements on desktop                                                                                   |
| Touch   | Targets at least 44px. Buttons and fields 44–50px tall                                                                                                    |
| Focus   | 2px `--focus-ring` outline, 2px offset, on `:focus-visible` only. Fields: see Text field                                                                  |
| Icons   | 24px grid, 2px stroke, round caps and joins, `currentColor`. Draw at 16, 18 or 20px (24 on the phone layers button). An icon-only button carries the name |

## Motion

`design/kinscape.tokens.json` holds the durations. Each token is a `motion` token.

| Token            | Use                                                        |
| ---------------- | ---------------------------------------------------------- |
| `press`          | Hover, press: colour and border only                       |
| `popup`          | Popups, menus: fade and 4px rise                           |
| `sheet`          | Phone sheet: slides; follows the finger while dragged      |
| `changed-border` | Changed border: MAP-11 highlight, then gone                |
| `toast`          | Toast: a success toast leaves after 4 seconds; errors stay |
| `easing`         | The curve of each motion: write it after the duration      |
| `press-offset`   | Button press: 1px down                                     |
| `rise-offset`    | Toast: starts 4px low and rises                            |

A map date change redraws at once. Do not animate it. Do not show a loader (NFR-01).

Under `prefers-reduced-motion`, drop every transition except a colour change. Make Play step with no easing curve.
