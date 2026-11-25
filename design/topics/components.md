---
paths:
  - 'app/components/**'
  - 'features/*/components/**'
  - 'lib/ui/**'
  - 'app/**/page.tsx'
  - 'lib/design/states.mts'
  - 'lib/design/cards.mts'
---

# Components

## In the repo

`docs/architecture.md` has the component-folder rule. Import a component as `@ks/app/components/<folder>/<Name>`. These folders hold the shared components:

| Folder       | Holds                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `foundation` | Text, Icon, Surface, Divider, focus, Avatar, Wordmark, PageHeader                                                                              |
| `actions`    | Button, IconButton, TextLink, ArrowLink, PersonRow, RelationshipRow, PickerRow, Chip, ChipGroup, Segmented, Tabs, KeyHint, ActionBar, DateText |
| `forms`      | TextField, TextAreaField, SelectField, TokenField, Checkbox, CheckboxField                                                                     |
| `feedback`   | Alert, Banner, Toast, NoticeCard, ProgressBar, LoadingBar, LoadingField, Callout                                                               |
| `overlays`   | Modal, Dialog, Sheet, BottomSheet, Menu, Popup, PinPopup, ClickPopup, PlacedAt                                                                 |
| `layout`     | ColumnLayout, SignInLayout, MapLayout                                                                                                          |
| `auth`       | What only sign-in uses: SignInHero, SignInForm                                                                                                 |

The design system also holds components from `features/map/components/`, `features/people/components/` and `lib/ui/`.

**Page rule.** A screen's Spec names the components it needs and lists any that are missing under **Flagged concerns**. If other pages reuse a part, or it has states of its own, make it a component. Never build it inside a page.

- Before you build Google sign-in, file an Intent issue.
- A media query can't read a variable, so `npm run tokens` writes each marked `@media` condition from `breakpoint`, and `breakpoints.test.ts` checks it.

## Components

- **Buttons:** by height. L 50 (sign-in, full width): `type.button`. M 44: `type.control`, padding 16. S 40: `type.button-s`, padding 16. XS 36: `type.button-s`, padding 12.
- **Primary button:** `--brand` fill, white text.
- **Secondary button:** white, 1px `--line-strong` border, `--ink` text. With an `href`, a button is a plain link with the same look and states.
- **Icon button:** raised variant: 48px, `--radius-panel`, `--shadow-raised`, no border. Same states as the plain one.
- **Text link:** with `onClick` and no `href`, it is a button with the same look.
- **Page header:** a 64px white bar (60px on a phone) with a bottom `--line` border. It holds the Wordmark (icon only on a phone), a divider, the back link and the Avatar at the right.
- **Back link:** a 44px link with the back icon and the name of the page above. It takes its hover, focus and pressed looks from the icon button.
- **Action bar:** a 72px white bar fixed to the bottom of the window, with a top `--line` border. It holds the primary button, then the secondary one. On a phone it adds the safe area of the device below the 72px.
- **Google sign-in (proposed):** not in the requirements yet. It goes under "Sign in", after an "or" divider. White, 1px `--google-border` border, `--google-text` text, "Continue with Google". Use Google's own button or the official "G" mark, never a redrawn one. The dashed box in the JPG marks the spot. If Google sign-in is off, hide the button and the divider.
- **Text field:** M 44px with `type.body` (`type.body-l` on phones); L 48px with `type.body-l` on sign-in; 1px `--field-border`, `radius.control`. Hover: `--ink-3` border. Focus: 2px `--brand` border, no outline. Error: see [Feedback and validation](feedback.md#feedback-and-validation). Clear the password after a failed sign-in.
- **Select field:** the box of the Text field with a native select and a drawn chevron. Error: the look of the Text field, with the icon 8px after the chevron.
- **Long text field:** a label, a textarea and a helper. 1px `--field-border`, `radius.control`, padding 10 12, `type.body` (`type.body-l` on phones). It resizes up and down only, scrolls long content inside, and takes a `maxLength`. Hover: `--ink-3` border. Focus: 2px `--brand` border. Error: the look of the Text field, with the icon at the top right and the message in place of the helper.
- **Fuzzy date field:** a label, a 44px input and one line under it, in `type.mono-m` (`type.body-l` size on phones), ligatures off. 1px `--field-border`, `radius.control`. Hover, focus and error follow the Text field. The line shows the helper, the reading or the error: see [Fuzzy date field](feedback.md#fuzzy-date-field).
- **Person field:** a Text field that picks one Person. The panel is 320px wide, so the field is 280px. A Picker row needs about 440px, so the list is a popover 480px wide. It opens 4px under the field, on its left edge, over the map. It shows at most three rows and scrolls past them. A row that matches a spelling variant shows it. If no Person matches, a 280px notice shows "No one matches “{text}”" and the line "Check the spelling, or add the person to the Tree first." The focus stays in the text box. Down and Up move through the rows, Enter picks one and Esc closes the list. When the user types after a pick, the pick clears. A press outside the field and the list closes it too. The error "Choose a person." follows the Text field.
- **Add a pin button:** the primary Button, 44px high, named "Add a pin". It has the default, hover, focus and pressed looks. A desktop map shows it at the top right, 12px left of the account control and level with it. It opens the empty panel. A phone has no such button.
- **Arrow link:** a text and the forward icon (16px, 4px gap) in `type.link`, with no underline. With an `href` it is a link: hover `--brand-hover`, pressed `--brand-pressed`, focus the ring. Without one it is a label for a row that is one link, and it turns `--brand-pressed` while that link is pressed.
- **Person row:** the whole row is a link to edit. Grid: name, a 200px Dates column, then an Arrow link label "Edit". Minimum height `size.row-l`. The name is "Surname, Given names" in `type.title`. A `type.small` line shows "née {maiden}" and "Matches the spelling “{variant}”" only when needed. The dates are one `type.mono` line: "1889 – 1932", "1889 –", "? – 1932", "1889 – ?" or "? – ?". A missing death date reads "?" only when the Person is marked deceased. A screen reader skips the line and hears the dates in words. An optional "Relationships" text link sits after the row link. Hover: `--surface-2` fill. Pressed: `--segment` fill and a `--brand-pressed` "Edit". Focus: the ring.
- **Relationship row:** the other Person's name, the Person row's line of dates, and an Arrow link "Edit". A parent or child row adds a `type.small` subtype: Biological, Adoptive or Step. A spouse row adds a second `type.mono` line: "Mar. 1875, div. 1890", "Mar. 1875" or "Div. 1890". It has no remove control and no phone form.
- **Picker row:** the whole row is a button that picks the Person. It shows the name, the same note as the Person row and the same line of dates. It has the Person row's default, hover, focus and pressed states. It has no phone form.
- **Segmented control** (date precision, play speed): a `--segment` track; the selected segment is white with a small shadow.
- **Chips** (event type filters): 36px pills. On: `--brand` border, `--brand-tint` fill. Off: `--line-strong` border, white.
- **Tabs** (Layers / Filters): the selected tab gets `--brand-tint`. A count badge in `--brand` shows active filters.
- **Layer rows:** a checkbox (accent `--brand`), the name in `type.label`, a one-line description in `--ink-3`. The description gives live facts, such as how many pins are true on the date.
- **Date dock:** step back, a typed date field, step forward, Year / Month / Day, a contested-claims note and Play with 1, 5 or 10 yr/s. Under that is the 1652–today slider with epoch ticks and the contested years hatched. The thumb snaps to each step at the chosen precision. The date field is the only date readout. Then "Jump to" epoch buttons and keyboard hints.
- **Phone date sheet:** a non-modal bottom sheet, 152px collapsed and 432px expanded, with a grabber ("Expand the sheet"). Collapsed: the stepper around the date field and a round Play, 8px after Forward. Expanded adds the slider. No precision, speed, Jump to or hints.
- **Jurisdiction popup:** "On this spot in {year}", the place name valid on that date, coordinates in mono, then the jurisdiction chain as level / name rows, then pins at that spot.
- **Count marker:** A `--pin` circle with the count marks a Place with two or more Pins on the Map date. Name: "3 Pins".
- **Fan of Pins:** Hover or a first tap spreads the Pins in rings, from below the Place, clockwise in date order. Name: "Birth, about 1850".
- **Pin popup:** A click on a Pin opens it. The popup is 304px wide and sits `pin-popup-gap` left of the Pin, with its pointer on the right edge. Near the top the popup stops at the free area, and the pointer still marks the Pin.
- **Pin popup, content:** The header holds the Event glyph in `--pin` and the event type in an overline. Under it are the Person's name in `type.h3` and a Close icon button, 8px up and right. Then come the date reading in `type.title` and the recorded date in `type.mono`. A `--surface-2` box (radius `radius.control`, padding 12) holds the overline "Address as recorded" and the address. A desktop popup ends with a primary "Add a pin here" and a secondary "Edit".
- **Pin popup, phone:** A phone shows the popup in the Map date sheet, under the slider and a 1px `--line` rule. The popup has neither "Add a pin here" nor "Edit". A `type.caption` line in `--ink-3` says "Look-up only on a phone. Add people and pins on a tablet or computer."
- **Pin popup, loading and failed:** The event type and both date lines show. While loading, a 168px bar replaces the name and a 220px bar replaces the address, each 20px high in `--line`, and both buttons are disabled. If the details fail, an error Alert "Couldn't load this Pin" with the text "The details didn't load." replaces the address. A secondary "Try again" replaces the other buttons.
- **Click popup:** A click on empty map opens it. It has the frame of the Pin popup and sits `popup-gap` left of the point. The overline "Point on the map" sits over the point in `type.mono`: decimal degrees with 6 decimals, latitude first. A Close icon button sits 8px up and right. A `small` line says "The panel opens with this point filled in." A primary "Add a pin here" ends it. The popup is at least 134px high, so the pointer clears the bottom corner. The point shows as a 12px dot in `--brand` with a 2.5px `--surface` edge. Close and Esc close it. M3 adds the jurisdiction chain between the coordinates and the button.
- **Notice card:** white card with the panel shadow, an icon, a `type.title` title and one line of help, plus up to two buttons. A button can be a link. It shows empty and loading states.
- **Banner:** `--ink` background, white text, the `floating` shadow, top centre of the map, with one action. For problems that don't block the map.
- **Menu:** white card, popup shadow, 44px rows with an icon.
- **Dialog:** centred over a `--scrim`, `radius.panel`, close button top right.
- **Alert:** 1px system border, system background and text, padding 12 16, gap 12, a filled 20px icon, a `type.label` title and one line in `type.small`.
- **Toast:** white, popup shadow, bottom centre above the dock. A success toast leaves after 4 seconds. An error toast stays and offers a retry.

Every control has the five states on its component card.

The states are default, hover, focus, pressed and disabled. A Button with an `href` has no disabled state. A disabled Text link is plain text.

Hover darkens or tints. Pressed goes a step darker (`--brand-pressed`, or `--brand-tint` for secondary controls). Disabled uses `--ink-disabled` on `--line` or `--surface-2`. Toggles keep their "on" look after release. Nothing important appears only on hover.
