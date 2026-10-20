# KinScape design

The look of KinScape: fonts, colours, components and the map style. The screenshots in this folder are the reference mockups, designed with Claude Design on the [design canvas](https://claude.ai/artifact/1MyZCdZRhzfvXXxma2Zrie). Behaviour lives in [`docs/requirements.md`](../docs/requirements.md); this file only covers how things look.

## Screens

| Screen                                  | File                                               |
| --------------------------------------- | -------------------------------------------------- |
| Sign in, desktop                        | [sign-in-desktop.jpg](sign-in-desktop.jpg)         |
| Sign in, phone, wrong password          | [sign-in-phone-error.jpg](sign-in-phone-error.jpg) |
| Map, desktop, Layers tab, point clicked | [map-desktop.jpg](map-desktop.jpg)                 |
| Map, desktop, Filters tab               | [map-desktop-filters.jpg](map-desktop-filters.jpg) |
| Map, phone, look-up only (NFR-05)       | [map-phone.jpg](map-phone.jpg)                     |
| Map, phone, sheet collapsed             | [map-phone-collapsed.jpg](map-phone-collapsed.jpg) |
| First load                              | [map-loading.jpg](map-loading.jpg)                 |
| No pins in the tree                     | [map-empty-tree.jpg](map-empty-tree.jpg)           |
| No pins on this date                    | [map-empty-date.jpg](map-empty-date.jpg)           |
| Districts layer on                      | [map-districts.jpg](map-districts.jpg)             |
| Terrain failed to load                  | [map-offline.jpg](map-offline.jpg)                 |
| Account menu                            | [map-account-menu.jpg](map-account-menu.jpg)       |
| Sources and attributions                | [map-sources.jpg](map-sources.jpg)                 |
| Map style: MapLibre layer stack         | [map-style.jpg](map-style.jpg)                     |

![Map, desktop](map-desktop.jpg)

People, pins and boundary shapes in the mockups are illustrative, not data.

## Brand

- The name is **KinScape**, capital S, in UI text and docs.
- The icon is `app/icon0.svg`: a white tree on forest green, with a 25% corner radius. Never recolour it.
- Wordmark: the icon, then "KinScape" in Bricolage Grotesque 700.
- Tagline: "Borders move. Places don't."

## Fonts

| Font                | Weights                           | Used for                                                |
| ------------------- | --------------------------------- | ------------------------------------------------------- |
| Bricolage Grotesque | 500, 700                          | Wordmark, page titles, the place name in a popup        |
| Public Sans         | 400, 500, 600, italic 400 and 500 | All UI text and every map label                         |
| JetBrains Mono      | 400, 500                          | Dates, coordinates, keyboard hints, code. Ligatures off |

All three are on Google Fonts under the OFL. Map labels need Public Sans Regular, SemiBold and Italic as glyph PBFs too (see [Map style](#map-style)).

| Role               | Size / weight                                               |
| ------------------ | ----------------------------------------------------------- |
| Sign-in headline   | Bricolage 52 / 700, tracking -0.02em                        |
| Page title         | Bricolage 32 / 500 (28 on phone)                            |
| Popup place name   | Bricolage 22 / 700                                          |
| Body, inputs       | Public Sans 15–16 / 400. Inputs are 16 so phones don't zoom |
| Labels, row titles | Public Sans 14 / 600                                        |
| Helper text        | Public Sans 12.5–13 / 400, `--ink-3`                        |
| Section heading    | Public Sans 11 / 600, uppercase, tracking 0.1em             |
| Map date field     | JetBrains Mono 22 / 500                                     |

## Colours

```css
:root {
  --brand: #264f29; /* primary buttons, selection, focus, active states */
  --brand-hover: #1d3e20;
  --brand-tint: #e6eee4; /* selected tab, pressed chip */
  --focus-ring: #9dbb9f;
  --ink: #18211b; /* main text, dark banners */
  --ink-2: #2e3a33; /* secondary text on light grounds */
  --ink-3: #4a544c; /* helper text, section headings */
  --surface: #ffffff; /* panels, dock, popup */
  --surface-2: #f4f5f0; /* insets, search field, sign-in page */
  --segment: #eef0ea; /* segmented control track */
  --line: #e2e5dd; /* dividers */
  --line-strong: #c9cfc5; /* secondary button and field borders */
  --field-border: #b9c0b6;
  --scrim: rgb(24 33 27 / 0.45); /* behind dialogs */
  --error: #7e2316;
  --error-border: #b4412f;
  --error-bg: #fbedea;
  --pin: #9a3b12; /* pins, clusters, event glyphs */
}
```

Text colours pass 4.5:1 on `--surface` and `--surface-2`. Colour never carries meaning alone: event types have shapes, contested claims are hatched, approximate borders are dashed (NFR-06).

## Layout

- Desktop first. The map fills the window and everything else floats on it with a 24px gutter.
- Desktop: search bar top left. The Layers / Filters panel sits below it, 320px wide. The date dock runs along the bottom, right of the panel. Account and zoom controls are top right. The credits line sits under the dock.
- Phone: search pill on top, a layers button under it, and a bottom sheet. Collapsed, the sheet holds only the date stepper and Play. Tapping the map opens it with the look-up result. No editing on a phone.
- Pass MapLibre `padding` so the map centres in the space the panel and dock leave.

## Shape and depth

| Token        | Value                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| Radius       | 8 buttons and fields · 12 panels, dock, popup · 18 top of phone sheet · pills fully round |
| Shadow       | `0 1px 2px rgb(24 33 27 / 0.08), 0 6px 20px rgb(24 33 27 / 0.12)`                         |
| Popup shadow | `0 1px 2px rgb(24 33 27 / 0.1), 0 10px 30px rgb(24 33 27 / 0.2)`                          |
| Spacing      | 4px steps; 16–20 inside panels, 24 between floating elements on desktop                   |
| Touch        | Targets at least 44px. Buttons and fields 44–50px tall                                    |
| Focus        | 3px `--focus-ring` outline, 2px offset                                                    |

## Components

- **Primary button:** `--brand` fill, white 16/600 text, 50px tall on sign-in, 40–44 elsewhere.
- **Secondary button:** white, 1px `--line-strong` border, `--ink` text.
- **Google sign-in (proposed):** not in the requirements yet, so it needs an Intent issue before it's built. Under "Sign in", after an "or" divider. White, 1px `#747775` border, `#1F1F1F` text, "Continue with Google". Use Google's own button or the official "G" mark from their branding kit, never a redrawn one; the mockup's dashed box marks the spot. Hide the button and the divider when Google sign-in is off.
- **Text field:** 48px, 1px `--field-border`, radius 8. On error: 1.5px `--error-border`, plus an alert box above the fields in `--error-bg`. Clear the password after a failed attempt.
- **Segmented control** (date precision, play speed): a `--segment` track; the selected segment is white with a small shadow.
- **Chips** (event type filters): 36px pills. On: `--brand` border, `--brand-tint` fill. Off: `--line-strong` border, white.
- **Tabs** (Layers / Filters): the selected tab gets `--brand-tint`. A count badge in `--brand` shows active filters.
- **Layer rows:** a checkbox (accent `--brand`), name 14/600, a one-line description in `--ink-3`. The description reports live facts, such as how many pins are true on the date or where district data exists.
- **Date dock:** step back, a typed date field, step forward, then Year / Month / Day, a contested-claims note and Play with 1, 5 or 10 yr/s. Under that, the 1652–today slider with epoch ticks and the contested years hatched, then "Jump to" epoch buttons and keyboard hints.
- **Jurisdiction popup:** "On this spot in {year}", the place name valid on that date, coordinates in mono, then the jurisdiction chain as level / name rows, then pins at that spot.
- **Notice card:** white card with the panel shadow, an icon, a 15/600 title and one line of help, plus up to two buttons. Used for empty and loading states.
- **Banner:** `--ink` background, white text, top centre of the map, with one action. For problems that don't block the map.
- **Menu:** white card, popup shadow, 44px rows with an icon.
- **Dialog:** centred over a `--scrim`, radius 12, close button top right.

## States

| State                | Design                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First load (NFR-02)  | Panel and date dock render at once from the URL. The map area shows a "Loading the map" card with a progress bar. Only on first load: changing the date never shows a loader (NFR-01). |
| No pins in the tree  | A notice card in the middle of the map. The map still works as an atlas. No add button until data entry is designed.                                                                   |
| No pins on this date | A notice card at the top: "No pins in {year}", then "Jump to {nearest year}", plus "Clear filters" when filters are on. The Pins row reads "0 of N true on this date".                 |
| Districts on         | Thin district lines under polity borders. Where coverage is partial, the Districts row says where (e.g. "On this date: Cape Colony only").                                             |
| Terrain failed       | A banner with Retry. Borders and pins keep working because they load up front.                                                                                                         |
| Account menu         | Signed-in email, Export all data (JSON and GeoJSON, NFR-04), Sources and attributions, Sign out, and the last backup time.                                                             |
| Phone, collapsed     | Date stepper and Play only, and a hint to tap the map.                                                                                                                                 |

## Attributions

NFR-08 requires every source to be credited in the app. The design fixes the format; the licence checks (NFR-08, BND-06) supply the text.

- One sources file in the repo lists each source: layer, title, author, licence, licence link, attribution text and the date it was checked. A source isn't added to the map until its licence is checked.
- The credits line under the date dock joins the attribution text of the sources on screen with " · " and ends with an "Attributions" link. 11px, `#24302B`.
- The "Sources and attributions" dialog, opened from that link or the account menu, lists every source as layer, source, licence and date checked.
- The mockups show `[Source]` and `[Licence]` until the checks are done. Don't fill them in with guesses.

## Event glyphs

| Event     | Glyph | Event          | Glyph |
| --------- | ----- | -------------- | ----- |
| Birth     | ●     | Burial         | ▼     |
| Baptism   | ○     | Land ownership | □     |
| Residence | ■     | Occupation     | ▲     |
| Marriage  | ◆     | Other          | ✱     |
| Death     | ✚     |                |       |

On the map these are SDF icons in `--pin`, with a 2px white halo.

## Map style

Every map visual is something MapLibre GL can draw: flat fills, solid or dashed lines, one `fill-pattern` hatch, a hillshade layer, circles and SDF symbols. The full layer stack is in [map-style.jpg](map-style.jpg). The map colours:

| Use                     | Value                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sea (background)        | `#C9D5D2`                                                                                                                                                             |
| Land                    | `#E9EBE2`                                                                                                                                                             |
| Coastline               | `#7E9A98`, 0.9px                                                                                                                                                      |
| Rivers                  | `#6E99A3`, 1–3px by zoom                                                                                                                                              |
| Polity border           | `#3B3A2F`, 1.5px; dashed `[4, 2.6]` when confidence is low                                                                                                            |
| District border         | `#6F7263`, 0.8px                                                                                                                                                      |
| Changed border (MAP-11) | `--brand`, 4px, fades out                                                                                                                                             |
| Polity fills            | Cape `#D3DCC4` · Natal `#DCD3BD` · OFS `#E3D2B2` · ZAR `#D9CFBA` · Basutoland `#D9CFD9` · Swaziland `#CBD6DA` (other polities: pick muted tints of similar lightness) |
| Contested hatch         | 45° stripes, 3px in 9px, `#8B4A1C` at 34%                                                                                                                             |
| Hillshade               | shadow `#5B6355`, highlight `#FFFFFF`, exaggeration 0.3                                                                                                               |
| Polity label            | Public Sans SemiBold, uppercase, tracking 0.15em, `#2E2C22`; contested note in italic `#6B3412`                                                                       |
| Place label             | Public Sans Medium, `--ink`, dot 3.4px with white stroke                                                                                                              |
| Water and river labels  | Public Sans Italic, `#3F646C`                                                                                                                                         |
| Context labels          | Public Sans Italic, uppercase, `#56615A`                                                                                                                              |
| Label halo              | Land colour, 1.5px                                                                                                                                                    |
| Uncertainty halo        | `--pin`, opacity 0.24, blur 0.8, radius grows with the date range                                                                                                     |
| Selected point          | 17px ring, `--brand`, 2.5px                                                                                                                                           |

Avoid what MapLibre can't do: shadows, glows or gradients on polygons, dashed circle outlines, and boxes behind labels. Anything you click or type into is HTML over the map.

## Copy

- Use the requirements' Key concepts terms (Map date, Pin, Polity, Jurisdiction chain).
- Sentence case everywhere, except map labels for polities and context areas.
- Names on the map are the names valid on the map date (MAP-06).
- No sign-up wording. The sign-in page says accounts are set up by whoever runs KinScape.

## Not designed yet

A Spec that needs one of these lists it under **Flagged concerns** instead of inventing the UI:

- Adding or editing people, relationships, pins and sources.
- Clicking inside a contested area: how the popup shows both claims (BND-04, MAP-07).
- Search results (EXP-04).
- Person panel, life trail and migration view (EXP-05 to EXP-07).
- The slider mid-drag at month or day precision, and the changed-border flash (MAP-11).
- Comparing two dates (MAP-12).
- Pin warnings (PIN-08) and source records on the map (PIN-07).
- Tablet layout (NFR-05).
