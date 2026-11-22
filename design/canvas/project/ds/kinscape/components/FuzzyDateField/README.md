A GEDCOM date typed as text.

## Design

- **Fuzzy date field:** a label, a 44px input and one line under it, in `type.mono-m` (`type.body-l` size on phones), ligatures off. 1px `--field-border`, `radius.control`. Hover, focus and error follow the Text field. The line shows the helper, the reading or the error: see Fuzzy date field.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `defaultValue` | `string` | no | Text to start with. The field checks it on the first render, unless `state` is `focus`. |
| `error` | `ReactNode` | no | A problem that the caller found, such as an empty date. The slot shows it after the field's own error. |
| `helper` | `ReactNode` | no | The slot shows it while the text is empty or does not read as a date. |
| `label` | `string` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
