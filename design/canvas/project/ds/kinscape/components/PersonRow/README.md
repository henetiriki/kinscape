One row of the people list, and one link to edit the Person.

## Design

- **Person row:** the whole row is a link to edit. Grid: name, a 200px Dates column, then "Edit" with the forward icon. Minimum height `size.row-l`. The name is "Surname, Given names" in `type.title`. A `type.small` line shows "née {maiden}" and "Matches the spelling “{variant}”" only when needed. The dates are one `type.mono` line: "1889 – 1932", "1889 –", "? – 1932", "1889 – ?" or "? – ?". A missing death date reads "?" only when the Person is marked deceased. A screen reader skips the line and hears the dates in words. An optional "Relationships" text link sits after the row link. Hover: `--surface-2` fill. Pressed: `--segment` fill and a `--brand-pressed` "Edit". Focus: the ring.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `born` | `string` | yes | Short text of the birth date, such as "bef. 1840". |
| `bornReading` | `string` | yes | Full reading of the birth date, such as "Before 1840". |
| `deceased` | `boolean` | no | Marked deceased. |
| `died` | `string` | yes |  |
| `diedReading` | `string` | yes |  |
| `form` | `"phone"` | no | `phone`: a row that is no link. |
| `givenNames` | `string` | yes |  |
| `href` | `string` | yes |  |
| `maidenName` | `string` | no |  |
| `matchedVariant` | `string` | no | A spelling variant that matched the filter when the name did not. |
| `relationshipsHref` | `string` | no | Adds a "Relationships" link beside the edit link. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `surname` | `string` | yes |  |

The other attributes of its HTML element go to the element.
