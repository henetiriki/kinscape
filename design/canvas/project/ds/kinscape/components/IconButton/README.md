An action shown only as an icon, such as zoom, close or step, named by its `label`.

## Design

- **Icon button:** raised variant: 50px, `--radius-panel`, `--shadow-raised`, no border. Same states as the plain one.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | `string` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `variant` | `"raised"` | no | `raised` is 48px with a shadow and no border, for a button over the map. |

The other attributes of its HTML element go to the element.
