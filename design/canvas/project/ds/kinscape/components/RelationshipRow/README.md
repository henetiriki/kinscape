One relationship of a Person.

## Design

- **Relationship row:** the other Person's name, the Person row's line of dates, and an "Edit" text link. A parent or child row adds a `type.small` subtype: Biological, Adoptive or Step. A spouse row adds a second `type.mono` line: "Mar. 1875, div. 1890", "Mar. 1875" or "Div. 1890". It has no remove control and no phone form.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `born` | `string` | yes | Short text of the birth date, such as "bef. 1840". |
| `bornReading` | `string` | yes | Full reading of the birth date, such as "Before 1840". |
| `deceased` | `boolean` | no | Marked deceased. |
| `died` | `string` | yes |  |
| `diedReading` | `string` | yes |  |
| `divorced` | `string` | no |  |
| `divorcedReading` | `string` | no |  |
| `givenNames` | `string` | yes |  |
| `href` | `string` | yes | The edit page of the relationship. |
| `married` | `string` | no |  |
| `marriedReading` | `string` | no |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `subtype` | `"step" \| "adoptive" \| "biological"` | no | A parent or child link. A spouse link has none. |
| `surname` | `string` | yes |  |
