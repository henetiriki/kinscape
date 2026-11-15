One Person in a picker.

## Design

- **Picker row:** the whole row is a button that picks the Person. It shows the name, the same note as the Person row and the same line of dates. It has the Person row's default, hover, focus and pressed states. It has no phone form.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `born` | `string` | yes | Short text of the birth date, such as "bef. 1840". |
| `bornReading` | `string` | yes | Full reading of the birth date, such as "Before 1840". |
| `deceased` | `boolean` | no | Marked deceased. |
| `died` | `string` | yes |  |
| `diedReading` | `string` | yes |  |
| `givenNames` | `string` | yes |  |
| `maidenName` | `string` | no |  |
| `matchedVariant` | `string` | no | A spelling variant that matched the filter. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `surname` | `string` | yes |  |

The other attributes of its HTML element go to the element.
