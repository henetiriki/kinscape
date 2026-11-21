An anchor has no disabled state, so a disabled link is plain text that says so.

## Design

- **Text link:** with `onClick` and no `href`, it is a button with the same look.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | no |  |
| `href` | `string` | no | Required unless `disabled` or `onClick`. |
| `onClick` | `(() => void)` | no |  |
| `size` | `"small"` | no | `small` is 13 / 20, for dense surfaces such as the Sources dialog. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
