# KinScape design

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

Components set these styles with `<Text variant>` (`app/components/foundation/Text.tsx`). The Text component card shows them.

All three are OFL fonts. The app and the snapshots load the same `@fontsource` files, pinned in `package-lock.json`. Map labels need Public Sans Regular, SemiBold and Italic as glyph PBFs too (see Map style).

| Style          | Font · size / line · weight                | Used for                       |
| -------------- | ------------------------------------------ | ------------------------------ |
| Display        | Bricolage 52 / 56 · 700 · tracking −0.02em | Sign-in headline               |
| H1             | Bricolage 32 / 40 · 500 · −0.015em         | Page title                     |
| H1 phone       | Bricolage 28 / 32 · 500 · −0.015em         | Page title on a phone          |
| H2             | Bricolage 24 / 32 · 700                    | Dialog and section titles      |
| H3             | Bricolage 22 / 28 · 700                    | Place name in a popup, cards   |
| Title          | Public Sans 15 / 22 · 600                  | Notice titles, row titles      |
| Body L         | Public Sans 16 / 24 · 400                  | Sign-in, fields                |
| Body           | Public Sans 15 / 22 · 400                  | Panels, popups                 |
| Label          | Public Sans 14 / 20 · 600                  | Field labels, layer rows       |
| Small          | Public Sans 13 / 20 · 400, `--ink-3`       | Helper text                    |
| Caption        | Public Sans 12.5 / 18 · 400, `--ink-3`     | Credits, footnotes             |
| Overline       | Public Sans 11 / 16 · 600, caps, 0.1em     | Section headings               |
| Overline tight | Public Sans 11 / 12 · 600, caps, 0.1em     | Layer group headings           |
| Button         | Public Sans 16 / 24 · 600                  | 50px buttons (sign-in)         |
| Control        | Public Sans 15 / 22 · 600                  | 44px buttons and controls      |
| Button S       | Public Sans 14 / 20 · 600                  | 40px and 36px buttons          |
| Mono L         | JetBrains Mono 22 / 28 · 500               | Map date field                 |
| Mono M         | JetBrains Mono 15 / 22 · 400               | Fuzzy date field               |
| Mono           | JetBrains Mono 12 / 16 · 400               | Dates and coordinates in lists |

Line height is 1.1–1.25 for headings, 1.45–1.55 for sentences and 1.3–1.4 for one-line UI text. Keep running text under 68 characters a line. Set no body text below 12.5px and no map label below 11px.

## Colours

`tokens.json` holds every value (colours, type, spacing, radii, shadows, focus, motion and the map). `npm run tokens` writes it to `app/tokens.css` as CSS custom properties. Colours are `--brand` and `--ink-3`; other groups keep their group name (`--radius-panel`). Use a token, never its value. The usage text of a colour token in the design system gives its role and its contrast ratio. The `notes` group of `tokens.json` says where each token is used.

Text colours pass 4.5:1 on `--surface` and `--surface-2`. Each system text colour passes on its own background. Field borders, system borders and icons, and the focus ring pass 3:1. Colour never carries meaning alone: event types have shapes, the map hatches contested claims and dashes approximate borders (NFR-06).

## Layout

- Desktop first. The map fills the window and everything else floats on it with a 24px gutter.
- Desktop: search bar top left. The Layers / Filters panel sits below it, 320px wide. The date dock runs along the bottom, right of the panel. Account and zoom controls are top right. The credits line sits under the dock.
- Phone: search pill on top, a layers button under it, and a bottom sheet. When collapsed, the sheet holds only the date stepper and Play. When the user taps the map, the sheet opens with the look-up result. A user cannot edit on a phone.
- Sizes, offsets and stacking come from the `layout`, `breakpoint` and `z` tokens in `tokens.json`. A media query can't read a variable, so a test checks each against `breakpoint`.
- `MapLayout` places the search, account, zoom, panel, dock, credits and overlay slots from those tokens. On a phone only, it also places a Layers button. Its overlay area runs from `dock-left` to the gutter and from `furniture-top` to the dock's top. A popup sits left of its map point (`popup-gap`, `popup-point-y`), with the pointer on its right edge.
- A notice centres in the free map area, not the window.
- `SignInLayout` places the sign-in hero and form from `layout.sign-in`. On desktop the hero is left, and the form pane is at least 440 wide with a form of at most 360. On a phone, a 188px hero with the wordmark over it comes first, then the form. `SignInHero`'s coast and border lines are a hand-drawn sketch, traced from no dataset (NFR-08).
- `ColumnLayout` frames the People screens: a header, one centred column that scrolls and an optional action bar. `column` sets the width, gap and padding. `list` and `detail` are `layout.list-width` wide; `form` is `layout.content-width` wide.
- Pass MapLibre `padding` so the map centres in the space the panel and dock leave.

## Shape and depth

| Token   | Value                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Radius  | See the `radius` notes in `tokens.json`                                                                                                                                  |
| Shadow  | See the `shadow` notes in `tokens.json`                                                                                                                                  |
| Spacing | 4px steps; 16–20 inside panels, 24 between floating elements on desktop                                                                                                  |
| Touch   | Targets at least 44px. Buttons and fields 44–50px tall                                                                                                                   |
| Focus   | 2px `--focus-ring` outline, 2px offset, on `:focus-visible` only. Fields: see Text field                                                                                 |
| Icons   | 24px grid, 2px stroke, round caps and joins, `currentColor`. Draw at 16, 18 or 20px (24 on the phone layers button). `aria-hidden`; an icon-only button carries the name |

## Motion

`tokens.json` holds the durations. Each token is a `motion` token.

| Token            | Use                                                        |
| ---------------- | ---------------------------------------------------------- |
| `press`          | Hover, press: colour and border only                       |
| `popup`          | Popups, menus: fade and 4px rise                           |
| `sheet`          | Phone sheet: slides; follows the finger while dragged      |
| `changed-border` | Changed border: MAP-11 highlight, then gone                |
| `toast`          | Toast: a success toast leaves after 4 seconds; errors stay |

A map date change redraws at once. Do not animate it. Do not show a loader (NFR-01).

Under `prefers-reduced-motion`, drop every transition except a colour change. Make Play step with no easing curve.

## Components

`docs/architecture.md` has the component-folder rule. Import a component as `@ks/app/components/<folder>/<Name>`. These folders hold the shared components:

| Folder       | Holds                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `foundation` | Text, Icon, Surface, Divider, focus, Avatar, Wordmark, PageHeader                                                                    |
| `actions`    | Button, IconButton, TextLink, ArrowLink, PersonRow, RelationshipRow, PickerRow, Chip, ChipGroup, Segmented, Tabs, KeyHint, ActionBar |
| `forms`      | TextField, TextAreaField, SelectField, TokenField, Checkbox, CheckboxField                                                           |
| `feedback`   | Alert, Banner, Toast, NoticeCard, ProgressBar, Callout                                                                               |
| `overlays`   | Modal, Dialog, Sheet, BottomSheet, Menu, Popup                                                                                       |
| `layout`     | ColumnLayout, SignInLayout, MapLayout                                                                                                |
| `auth`       | What only sign-in uses: SignInHero, SignInForm                                                                                       |

**Page rule.** A screen's Spec names the components it needs and lists any that are missing under **Flagged concerns**. A page composes components: it has no stylesheet or `className` of its own. If other pages reuse a part, or it has states of its own, make it a component. Never build it inside a page. The dev-only `app/screens` is exempt.

- **Buttons:** by height. L 50 (sign-in, full width): `type.button`. M 44: `type.control`, padding 16. S 40: `type.button-s`, padding 16. XS 36: `type.button-s`, padding 12.
- **Primary button:** `--brand` fill, white text.
- **Secondary button:** white, 1px `--line-strong` border, `--ink` text. With an `href`, a button is a plain link with the same look and states, and it has no disabled state.
- **Icon button:** raised variant: 48px, `--radius-panel`, `--shadow-raised`, no border. Same states as the plain one.
- **Text link:** with `onClick` and no `href`, it is a button with the same look.
- **Page header:** a 64px white bar (60px on a phone) with a bottom `--line` border. It holds the Wordmark (icon only on a phone), a divider, the back link and the Avatar at the right.
- **Back link:** a 44px link with the back icon and the name of the page above. It takes its hover, focus and pressed looks from the icon button.
- **Action bar:** a 72px white bar fixed to the bottom of the window, with a top `--line` border. It holds the primary button, then the secondary one. On a phone it adds the safe area of the device below the 72px.
- **Google sign-in (proposed):** not in the requirements yet. Before you build it, file an Intent issue. It goes under "Sign in", after an "or" divider. White, 1px `--google-border` border, `--google-text` text, "Continue with Google". Use Google's own button or the official "G" mark, never a redrawn one. The dashed box in the JPG marks the spot. If Google sign-in is off, hide the button and the divider.
- **Text field:** M 44px with `type.body` (`type.body-l` on phones); L 48px with `type.body-l` on sign-in; 1px `--field-border`, radius 8. Hover: `--ink-3` border. Focus: 2px `--brand` border, no outline. Error: see Feedback and validation. Clear the password after a failed sign-in.
- **Long text field:** a label, a textarea and a helper. 1px `--field-border`, radius 8, padding 10 12, `type.body` (`type.body-l` on phones). It resizes up and down only, scrolls long content inside, and takes a `maxLength`. Hover: `--ink-3` border. Focus: 2px `--brand` border.
- **Fuzzy date field:** a label, a 44px input and one line under it, in `type.mono-m` (`type.body-l` size on phones), ligatures off. 1px `--field-border`, radius 8. Hover, focus and error follow the Text field. The line shows the helper, the reading or the error: see Fuzzy date field.
- **Arrow link:** a text and the forward icon (16px, 4px gap) in `type.link`, with no underline. With an `href` it is a link: hover `--brand-hover`, pressed `--brand-pressed`, focus the ring. Without one it is a label for a row that is one link, and it turns `--brand-pressed` while that link is pressed.
- **Person row:** the whole row is a link to edit. Grid: name, a 200px Dates column, then an Arrow link label "Edit". Minimum height `size.row-l`. The name is "Surname, Given names" in `type.title`. A `type.small` line shows "née {maiden}" and "Matches the spelling “{variant}”" only when needed. The dates are one `type.mono` line: "1889 – 1932", "1889 –", "? – 1932", "1889 – ?" or "? – ?". A missing death date reads "?" only when the Person is marked deceased. A screen reader skips the line and hears the dates in words. An optional "Relationships" text link sits after the row link. Hover: `--surface-2` fill. Pressed: `--segment` fill and a `--brand-pressed` "Edit". Focus: the ring.
- **Relationship row:** the other Person's name, the Person row's line of dates, and an Arrow link "Edit". A parent or child row adds a `type.small` subtype: Biological, Adoptive or Step. A spouse row adds a second `type.mono` line: "Mar. 1875, div. 1890", "Mar. 1875" or "Div. 1890". It has no remove control and no phone form.
- **Picker row:** the whole row is a button that picks the Person. It shows the name, the same note as the Person row and the same line of dates. It has the Person row's default, hover, focus and pressed states. It has no phone form.
- **Segmented control** (date precision, play speed): a `--segment` track; the selected segment is white with a small shadow.
- **Chips** (event type filters): 36px pills. On: `--brand` border, `--brand-tint` fill. Off: `--line-strong` border, white.
- **Tabs** (Layers / Filters): the selected tab gets `--brand-tint`. A count badge in `--brand` shows active filters.
- **Layer rows:** a checkbox (accent `--brand`), name 14/600, a one-line description in `--ink-3`. The description gives live facts, such as how many pins are true on the date.
- **Date dock:** step back, a typed date field, step forward, Year / Month / Day, a contested-claims note and Play with 1, 5 or 10 yr/s. Under that is the 1652–today slider with epoch ticks and the contested years hatched. The thumb snaps to each step at the chosen precision. The date field is the only date readout. Then "Jump to" epoch buttons and keyboard hints.
- **Phone date sheet:** a non-modal bottom sheet, 152px collapsed and 432px expanded, with a grabber ("Expand the sheet"). Collapsed: the stepper around the date field and a round Play, 8px after Forward. Expanded adds the slider. No precision, speed, Jump to or hints.
- **Jurisdiction popup:** "On this spot in {year}", the place name valid on that date, coordinates in mono, then the jurisdiction chain as level / name rows, then pins at that spot.
- **Notice card:** white card with the panel shadow, an icon, a 15/600 title and one line of help, plus up to two buttons. A button can be a link. It shows empty and loading states.
- **Banner:** `--ink` background, white text, the `floating` shadow, top centre of the map, with one action. For problems that don't block the map.
- **Menu:** white card, popup shadow, 44px rows with an icon.
- **Dialog:** centred over a `--scrim`, radius 12, close button top right.
- **Alert:** 1px system border, system background and text, padding 12 16, gap 12, a filled 20px icon, a 14/600 title and one line in `type.small`.
- **Toast:** white, popup shadow, bottom centre above the dock. A success toast leaves after 4 seconds. An error toast stays and offers a retry.

Every control has the five states on its component card. Hover darkens or tints. Pressed goes a step darker (`--brand-pressed`, or `--brand-tint` for secondary controls). Disabled uses `--ink-disabled` on `--line` or `--surface-2`. Toggles keep their "on" look after release. Nothing important appears only on hover.

## States

| State                | Design                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First load (NFR-02)  | Panel and date dock render at once from the URL. The map area shows a "Loading the map" card with a progress bar. For a date change, see Motion.                       |
| No pins in the tree  | A notice card in the middle of the map. The map still works as an atlas. No add button until data entry is designed.                                                              |
| No pins on this date | A notice card at the top reads "No pins in {year}" and "Jump to {nearest year}". When filters are on, it also has "Clear filters". The Pins row reads "0 of N true on this date". |
| Districts on         | Thin district lines under polity borders. Where coverage is partial, the Districts row says where (e.g. "On this date: Cape Colony only").                                        |
| Terrain failed       | A banner with Retry. Borders and pins keep working because they load up front.                                                                                                    |
| Account menu         | Signed-in email, People, Export all data (JSON and GeoJSON, NFR-04), Sources and attributions, Sign out, and the last backup time (Export, backup time: M3).                      |
| Phone, collapsed     | Date stepper and Play only.                                                                                                                                                       |

## Feedback and validation

Errors block until fixed, warnings don't, success confirms something finished, and info explains something the app did. Each one has an icon and words. Where it goes:

- **A field's problem:** next to the field, in place of its helper text.
- **A problem with one part of the screen:** an alert in that part, such as a failed sign-in above the form.
- **The result of an action:** a toast.
- **A problem with the app:** a banner.

Errors use `role="alert"`. Everything else uses `role="status"`.

### Map date field

The DateField component card shows it. The field is 188px wide and accepts `1901`, `1901-06` or `1901-06-14`. The field pads single digits (`1901-6-4`).

1. Check on Enter or when focus leaves, never while the user types.
2. When the date is invalid, keep what was typed. Show a 2px `--error-border` and an error icon inside the field. Set `aria-invalid`. Link the message with `aria-describedby`.
3. In the dock, the message opens 12px above the dock's top edge and points at the field. It is 340px wide from the Back button. On a phone it is the sheet's full width and may cover the credits line. Everywhere else it goes below the field.
4. The map, slider and URL stay on the last good date, and the message names it.
5. Esc restores the last good date. The slider, step buttons and Jump to buttons also clear the error.
6. A good date gets no success styling: the map moving is the confirmation.

| Case                    | Message                                        | Fix offered              |
| ----------------------- | ---------------------------------------------- | ------------------------ |
| Wrong format            | Use 1901, 1901-06 or 1901-06-14.               |                          |
| Before 1652             | Dates run from 1652 to today.                  | Go to 1652               |
| After today             | That's after today.                            | Go to today              |
| Doesn't exist           | February 1901 has 28 days.                     | Go to the last valid day |
| No borders for the date | No borders are mapped for 1750 yet. (warning)  |                          |
| More precise than set   | Switched to month precision. (info, 4 seconds) |                          |

### Fuzzy date field

The FuzzyDateField component card shows it. It is a label, a 44px input and one line under the input. The input text is Mono M with ligatures off. On a phone it takes the size and line of Body L, 16 / 24.

1. The line is one `aria-live="polite"` slot. It shows the helper, "Reads as **{reading}**", or the error message.
2. The reading follows the typing. The error shows on Enter or when focus leaves, never while the user types.
3. An error keeps the text. It shows a 2px `--error-border` and an error icon inside the field. Set `aria-invalid` and link the message with `aria-describedby`.
4. Empty text shows the helper, not an error. A good date gets no success styling.

## Event glyphs

Each Event type is one 24 × 24 path in `design/source/`. It uses `currentColor` (`--pin`) as its fill and is 1em square. The order below is the same everywhere. `EventGlyph` copies the paths. A test keeps them in step.

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

Every map visual is something MapLibre GL can draw: flat fills, solid or dashed lines, one `fill-pattern` hatch, a hillshade layer, circles and SDF symbols. map-style.jpg shows the full layer stack. The map colours:

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
| Label halo              | `map.label-halo`, the land colour                                                                   |
| Uncertainty halo        | `map.pin-halo`; radius grows with the date range                                                    |
| Selected point          | `map.selected` (`--brand`)                                                                          |

Avoid what MapLibre can't do: shadows, glows or gradients on polygons, dashed circle outlines, and boxes behind labels. Anything you click or type into is HTML over the map.

## Copy

- Use the requirements' Key concepts terms (Map date, Pin, Polity, Jurisdiction chain).
- Sentence case everywhere, except map labels for polities and context areas.
- Names on the map are the names valid on the map date (MAP-06).
- No sign-up wording. The sign-in page says whoever runs KinScape creates accounts.

## Using the controls on a canvas

The controls are on `window.KinScape`. After React 18, load `components/bundle.css`, then `components/bundle.js`. Mount a control with `<x-import component-from-global-scope="KinScape.Button">`.

