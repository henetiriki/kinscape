A single-line field with its label and, below it, helper text or an error that replaces it.

## Design

- **Text field:** M 42px and L 50px (sign-in) with `type.body`; 1px `--field-border`, `radius.control`. Hover: `--ink-3` border. Focus: 2px `--brand` border, no outline. Error: see Feedback and validation. Clear the password after a failed sign-in.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `date` | `boolean \| "fill"` | no | The map date look: 188px wide, mono, centred. `fill` takes the width of its container instead. |
| `defaultShown` | `boolean` | no | A password starts shown, as text. |
| `error` | `ReactNode` | no | The problem, shown under the field in place of `helper`. Marks the field as in error. |
| `helper` | `ReactNode` | no |  |
| `hideLabel` | `boolean` | no | Names the input without showing the label. |
| `label` | `string` | yes |  |
| `mark` | `"error" \| "warning"` | no | Marks the field when its message is shown elsewhere, or as a warning. |
| `shortcut` | `string` | no | A key that focuses the field when no text input has focus. A search field shows it as a hint. |
| `size` | `"l"` | no | `l` is the 48px sign-in field. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `type` | `"search" \| "text" \| "email" \| "password"` | no |  |

The other attributes of its HTML element go to the element.
