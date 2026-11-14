One row of the people list, and one link to edit the Person.

## Design

- **Person row:** the whole row is a link to edit. Grid: name, Born, Died, then "Edit" with the forward icon. Minimum height `size.row-l`. The name is "Surname, Given names" in `type.title`. A `type.small` line shows "née {maiden}" and "Matches the spelling “{variant}”" only when needed. Born and Died are `type.mono`. Died shows "—" with no date, and "Deceased" when marked deceased. Hover: `--surface-2` fill. Pressed: `--segment` fill and a `--brand-pressed` "Edit". Focus: the ring.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `born` | `string` | yes |  |
| `deceased` | `boolean` | no | Marked deceased with no date. |
| `died` | `string` | no |  |
| `form` | `"phone"` | no | `phone`: a row that is no link. |
| `givenNames` | `string` | yes |  |
| `href` | `string` | yes |  |
| `maidenName` | `string` | no |  |
| `matchedVariant` | `string` | no | A spelling variant that matched the filter when the name did not. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `surname` | `string` | yes |  |

The other attributes of its HTML element go to the element.
