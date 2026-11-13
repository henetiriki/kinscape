A multi-line field with its label and helper text.

## Design

- **Long text field:** a label, a textarea and a helper. 1px `--field-border`, radius 8, padding 10 12, `type.body` (`type.body-l` on phones). It resizes up and down only, scrolls long content inside, and takes a `maxLength`. Hover: `--ink-3` border. Focus: 2px `--brand` border.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `helper` | `ReactNode` | no |  |
| `label` | `string` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
