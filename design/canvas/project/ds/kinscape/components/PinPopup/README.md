The popup of a Pin (PIN-02): the Person, the event type, both date lines and the address.

## Design

- **Pin popup:** A click on a Pin opens it. The popup is 304px wide and sits `pin-popup-gap` left of the Pin, with its pointer on the right edge. Near the top the popup stops at the free area, and the pointer still marks the Pin.
- **Pin popup, content:** The header holds the Event glyph in `--pin` and the event type in an overline. Under it are the Person's name in `type.h3` and a Close icon button, 8px up and right. Then come the date reading in `type.title` and the recorded date in `type.mono`. A `--surface-2` box (radius `radius.control`, padding 12) holds the overline "Address as recorded" and the address. A desktop popup ends with a primary "Add a pin here" and a secondary "Edit".
- **Pin popup, phone:** A phone shows the popup in the Map date sheet, under the slider and a 1px `--line` rule. The popup has neither "Add a pin here" nor "Edit". A 12.5px line in `--ink-3` says "Look-up only on a phone. Add people and pins on a tablet or computer."
- **Pin popup, loading and failed:** The event type and both date lines show. While loading, a 168px bar replaces the name and a 220px bar replaces the address, each 20px high in `--line`, and both buttons are disabled. If the details fail, an error Alert "Couldn't load this Pin" with the text "The details didn't load." replaces the address. A secondary "Try again" replaces the other buttons.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | `string` | no | The address as recorded; the loaded state shows it, and an empty one reads as no address. |
| `event` | `"other" \| "baptism" \| "birth" \| "burial" \| "death" \| "divorce" \| "land" \| "marriage" \| "occupation" \| "residence"` | yes | The Event type of the Pin. |
| `form` | `"inline" \| "sheet" \| "floating"` | no | A floating popup on a desktop; a sheet region on a phone; `inline` fills the details of the date sheet. |
| `name` | `string` | no | The Person's name; the loaded state shows it. |
| `onClose` | `(() => void)` | no | Called by Close and by Esc inside the floating popup. |
| `onRetry` | `(() => void)` | no | Called by "Try again" in the failed state. |
| `reading` | `string` | yes | The reading of the date, such as "From 1890 to 1905". |
| `recorded` | `string` | yes | The date as recorded, such as "FROM 1890 TO 1905". |
| `state` | `"failed" \| "loaded" \| "loading"` | yes | Loading and failed show the event type and both date lines only. |
