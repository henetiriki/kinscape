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

Components set these styles with `<Text variant>` (`app/components/foundation/Text.tsx`); `/design-kit/type` shows them.

All three are OFL fonts. The app and the snapshots load the same `@fontsource` files, pinned in `package-lock.json`. Map labels need Public Sans Regular, SemiBold and Italic as glyph PBFs too (see Map style).

| Style    | Font · size / line · weight                | Used for                       |
| -------- | ------------------------------------------ | ------------------------------ |
| Display  | Bricolage 52 / 56 · 700 · tracking −0.02em | Sign-in headline               |
| H1       | Bricolage 32 / 40 · 500 · −0.015em         | Page title                     |
| H1 phone | Bricolage 28 / 32 · 500 · −0.015em         | Page title on a phone          |
| H2       | Bricolage 24 / 32 · 700                    | Dialog and section titles      |
| H3       | Bricolage 22 / 28 · 700                    | Place name in a popup, cards   |
| Title    | Public Sans 15 / 22 · 600                  | Notice titles, row titles      |
| Body L   | Public Sans 16 / 24 · 400                  | Sign-in, fields                |
| Body     | Public Sans 15 / 22 · 400                  | Panels, popups                 |
| Label    | Public Sans 14 / 20 · 600                  | Field labels, layer rows       |
| Small    | Public Sans 13 / 20 · 400, `--ink-3`       | Helper text                    |
| Caption  | Public Sans 12.5 / 18 · 400, `--ink-3`     | Credits, footnotes             |
| Overline | Public Sans 11 / 16 · 600, caps, 0.1em     | Section headings               |
| Button   | Public Sans 16 / 24 · 600                  | 50px buttons (sign-in)         |
| Control  | Public Sans 15 / 22 · 600                  | 44px buttons and controls      |
| Button S | Public Sans 14 / 20 · 600                  | 40px and 36px buttons          |
| Mono L   | JetBrains Mono 22 / 28 · 500               | Map date field                 |
| Mono     | JetBrains Mono 12 / 16 · 400               | Dates and coordinates in lists |

Line height is 1.1–1.25 for headings, 1.45–1.55 for sentences and 1.3–1.4 for one-line UI text. Keep running text under 68 characters a line, and never set body text below 12.5px or map labels below 11px.

The design kit's board titles, page padding and intro width are `kit.*` tokens; only kit pages use them.

## Colours

Every value (colours, type, spacing, radii, shadows, focus, motion and the map) is in `tokens.json`. `npm run tokens` writes it to `app/tokens.css` as CSS custom properties: colours are `--brand`, `--ink-3`; other groups keep their group name (`--radius-panel`). Use a token, never its value. `/design-kit/colour` shows each with its value and contrast ratio. Where a token is used: its note in the `notes` group of `tokens.json`; a test fails if a token has none.

Text colours pass 4.5:1 on `--surface` and `--surface-2`, and each system text colour passes on its own background. Field borders, system borders and icons, and the focus ring pass 3:1. Colour never carries meaning alone: event types have shapes, contested claims are hatched, approximate borders are dashed (NFR-06).

## Shape and depth

Shown with spacing and motion at `/design-kit/foundations`.

| Token   | Value                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Radius  | 8 buttons and fields · 12 panels, dock, popup · 18 top of phone sheet · pills fully round                                         |
| Shadow  | `--shadow-raised` for panels and the dock; `--shadow-floating` for popups; `--shadow-modal`, `--shadow-sheet`, `--shadow-segment` |
| Spacing | 4px steps; 16–20 inside panels, 24 between floating elements on desktop                                                           |
| Touch   | Targets at least 44px. Buttons and fields 44–50px tall                                                                            |
| Focus   | 2px `--focus-ring` outline, 2px offset, on `:focus-visible` only. Fields show a 2px `--brand` border instead                      |

## Components

Each component, its `.module.css` and its test live in one folder of `app/components`, imported as `@ks/app/components/<folder>/<Name>` (a feature's own components: architecture.md):

| Folder       | Holds                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `foundation` | Text, Icon, Surface, Divider, focus, Avatar, Wordmark                   |
| `actions`    | Button, IconButton, TextLink, Chip, ChipGroup, Segmented, Tabs, KeyHint |
| `forms`      | TextField, SelectField, TokenField, Checkbox, CheckboxField             |
| `feedback`   | Alert, Banner, Toast, NoticeCard, ProgressBar, Callout                  |
| `overlays`   | Modal, Dialog, Sheet, BottomSheet, Menu, Popup                          |
| `auth`       | What only sign-in uses: AuthLayout, SignInHero                          |

**Page rule.** A screen's Spec names the components it needs and lists any that are missing under **Flagged concerns**. A page composes components: it has no stylesheet or `className` of its own. A part that is reused, or has states of its own, is a component, never built inside a page.

- **Buttons:** by height. L 50 (sign-in, full width): `type.button`. M 44: `type.control`, padding 16. S 40: `type.button-s`, padding 16. XS 36: `type.button-s`, padding 12.
- **Primary button:** `--brand` fill, white text.
- **Secondary button:** white, 1px `--line-strong` border, `--ink` text.
- **Google sign-in (proposed):** not in the requirements yet, so it needs an Intent issue before it's built. Under "Sign in", after an "or" divider. White, 1px `--google-border` border, `--google-text` text, "Continue with Google". Use Google's own button or the official "G" mark from their branding kit, never a redrawn one; the mockup's dashed box marks the spot. Hide the button and the divider when Google sign-in is off.
- **Text field:** M 44px with `type.body` (`type.body-l` on phones); L 48px with `type.body-l` on sign-in; 1px `--field-border`, radius 8. Hover: `--ink-3` border. Focus: 2px `--brand` border. Error: see Feedback and validation. Clear the password after a failed sign-in.
- **Segmented control** (date precision, play speed): a `--segment` track; the selected segment is white with a small shadow.
- **Chips** (event type filters): 36px pills. On: `--brand` border, `--brand-tint` fill. Off: `--line-strong` border, white.
- **Tabs** (Layers / Filters): the selected tab gets `--brand-tint`. A count badge in `--brand` shows active filters.
- **Layer rows:** a checkbox (accent `--brand`), name 14/600, a one-line description in `--ink-3`. The description reports live facts, such as how many pins are true on the date or where district data exists.
- **Date dock:** step back, a typed date field, step forward, then Year / Month / Day, a contested-claims note and Play with 1, 5 or 10 yr/s. Under that, the 1652–today slider (the thumb snaps to each step at the chosen precision; the date field is the only date readout) with epoch ticks and the contested years hatched, then "Jump to" epoch buttons and keyboard hints.
- **Phone date sheet:** a non-modal bottom sheet, 152px collapsed and 432px expanded, with a grabber ("Expand the sheet"). Collapsed: the stepper around the date field and a round Play. Expanded adds the slider. No precision, speed, Jump to or hints.
- **Jurisdiction popup:** "On this spot in {year}", the place name valid on that date, coordinates in mono, then the jurisdiction chain as level / name rows, then pins at that spot.
- **Notice card:** white card with the panel shadow, an icon, a 15/600 title and one line of help, plus up to two buttons. Used for empty and loading states.
- **Banner:** `--ink` background, white text, top centre of the map, with one action. For problems that don't block the map.
- **Menu:** white card, popup shadow, 44px rows with an icon.
- **Dialog:** centred over a `--scrim`, radius 12, close button top right.
- **Alert:** 1px system border, system background and text, padding 12 16, gap 12, a filled 20px icon, a 14/600 title and one line in `type.small`.
- **Toast:** white, popup shadow, bottom centre above the dock. Success leaves after 4 seconds; errors stay and offer a retry.

Every control has the five states in style-4-states.jpg. Hover darkens or tints, pressed goes a step darker (`--brand-pressed`, or `--brand-tint` for secondary controls), and disabled uses `--ink-disabled` on `--line` or `--surface-2`. Toggles keep their "on" look after release. Nothing important appears only on hover. The controls are built in `/design-kit/states`; `/design-kit` lists the boards (the kit is a 404 in production).

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

## Feedback and validation

Errors block until fixed, warnings don't, success confirms something finished, and info explains something the app did. Each one has an icon and words. Where it goes:

- **A field's problem:** next to the field, replacing its helper text.
- **A problem with one part of the screen:** an alert in that part, such as a failed sign-in above the form.
- **The result of an action:** a toast.
- **A problem with the app:** a banner.

Errors use `role="alert"`; everything else uses `role="status"`.

### Map date field

Built in `/design-kit/feedback`. The field is 188px wide and accepts `1901`, `1901-06` or `1901-06-14`. Single digits (`1901-6-4`) are padded.

1. Check on Enter or when focus leaves, never while typing.
2. When the date is invalid, keep what was typed. Show a 2px `--error-border` and an error icon inside the field, set `aria-invalid`, and link the message with `aria-describedby`.
3. In the dock, the message opens 12px above the dock's top edge and points at the field: 340px wide from the Back button, or the sheet's full width on a phone, where it may cover the credits line. Everywhere else it goes below.
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

## Event glyphs

Each Event type is one 24 × 24 path in `design/source/`, filled `currentColor` (`--pin`), 1em square, in this order everywhere. `EventGlyph` copies the paths; a test keeps them in step.

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

## Copy

- Use the requirements' Key concepts terms (Map date, Pin, Polity, Jurisdiction chain).
- Sentence case everywhere, except map labels for polities and context areas.
- Names on the map are the names valid on the map date (MAP-06).
- No sign-up wording. The sign-in page says accounts are set up by whoever runs KinScape.

## Using the controls on a canvas

The controls are on `window.KinScape`. After React 18, load `components/bundle.css`, then `components/bundle.js`. Mount a control with `<x-import component-from-global-scope="KinScape.Button">`.

