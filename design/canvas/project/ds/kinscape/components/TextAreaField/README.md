A multi-line field with its label and helper text.

## Design

- **Long text field:** a label, a textarea and a helper. 1px `--field-border`, `radius.control`, padding 8 12, `type.body`. It resizes up and down only, scrolls long content inside, and takes a `maxLength`. Hover: `--ink-3` border. Focus: 2px `--brand` border. Error: the look of the Text field, with the icon at the top right and the message in place of the helper.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `error` | `ReactNode` | no | The problem, shown under the field in place of `helper`. Marks the field as in error. |
| `helper` | `ReactNode` | no |  |
| `label` | `string` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
