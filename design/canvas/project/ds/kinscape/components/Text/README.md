Text in one style of the type scale.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `as` | `"div" \| "h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "label" \| "p" \| "span"` | no |  |
| `htmlFor` | `string` | no | For `as='label'`. |
| `tone` | `"error" \| "info" \| "warning"` | no | The colour of a message; the style's own colour without it. |
| `variant` | `"body" \| "button" \| "caption" \| "h1" \| "h2" \| "h3" \| "label" \| "link" \| "small" \| "title" \| "display" \| "bodyL" \| "buttonS" \| "chip" \| "chipOff" \| "control" \| "credits" \| "h1Phone" \| "linkS" \| "mono" \| "monoL" \| "overline"` | yes |  |

It takes one of these forms. Required props: `as`, `variant`; or `variant`.

The other attributes of its HTML element go to the element.
