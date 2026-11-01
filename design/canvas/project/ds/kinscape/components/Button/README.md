An action: primary for the one main action in a view, secondary for the rest.

## Design

- **Buttons:** by height. L 50 (sign-in, full width): `type.button`. M 44: `type.control`, padding 16. S 40: `type.button-s`, padding 16. XS 36: `type.button-s`, padding 12.
- **Primary button:** `--brand` fill, white text.
- **Secondary button:** white, 1px `--line-strong` border, `--ink` text.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |
| `full` | `boolean` | no | Fills the width of its container. |
| `icon` | `"menu" \| "search" \| "alert" \| "back" \| "chevronDown" \| "close" \| "cloudOff" \| "copy" \| "document" \| "done" \| "error" \| "export" \| "eye" \| "eyeOff" \| "fit" \| "forward" \| "info" \| "layers" \| "place" \| "play" \| "signOut" \| "success" \| "warning" \| "zoomIn" \| "zoomOut"` | no | A leading icon, or the only content of an icon-only Button. |
| `label` | `string` | no |  |
| `round` | `boolean` | no | Fully round, as Play. |
| `size` | `"s" \| "l" \| "m" \| "xs"` | no | Heights 50, 44, 40 and 36. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `variant` | `"primary" \| "secondary"` | no |  |

It takes one of these forms. Required props: `children`; or `icon`, `label`.

The other attributes of its HTML element go to the element.
