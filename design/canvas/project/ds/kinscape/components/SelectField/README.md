A native select with its label and a drawn chevron.

## Design

- **Select field:** the box of the Text field with a native select and a drawn chevron. Error: the look of the Text field, with the icon 8px after the chevron.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `error` | `ReactNode` | no | The problem, shown under the field. Marks the field as in error. |
| `hideLabel` | `boolean` | no | Names the select without showing the label. |
| `label` | `string` | yes |  |
| `options` | `{ label: string; value: string; }[]` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
