The popup of a Pin (PIN-02): the Person, the event type, both date lines and the address.

## Design

- **Pin popup:** a click on a Pin opens it. A floating popup is 304px wide and sits `pin-popup-gap` left of the Pin, with the pointer on its right edge. A phone shows it as a sheet. The header holds the Event glyph in `--pin` with the event type in an overline, then the Person's name in `type.h3`, and a Close icon button 8px up and right. Under it: the reading of the date in `type.title`, the date as recorded in `type.mono`, then a `--surface-2` box (radius `radius.control`, padding 12) with the overline "Address as recorded" and the address. A desktop popup ends with a primary "Add a pin here" and a secondary "Edit". A phone sheet has neither, and a `--ink-3` 12.5px line says "Look-up only on a phone. Add people and pins on a tablet or computer." Loading: the event type and both date lines show, 20px `--line` bars (168px and 220px wide) stand in for the name and the address, and both buttons are disabled. Failed: an error Alert "Couldn't load this Pin" with "The details didn't load.", and a secondary "Try again" in place of the address and the other buttons. On a phone the details sit in the Map date sheet, under the slider and a 1px `--line` rule. The open Pin shows a selection ring on the map.

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
