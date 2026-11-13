A pill that turns one filter on or off, such as an Event type.

## Design

- **Chips** (event type filters): 36px pills. On: `--brand` border, `--brand-tint` fill. Off: `--line-strong` border, white.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `glyph` | `"other" \| "baptism" \| "birth" \| "burial" \| "death" \| "divorce" \| "land" \| "marriage" \| "occupation" \| "residence"` | no | The Event type this chip filters on; its glyph leads the label. |
| `on` | `boolean` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |

The other attributes of its HTML element go to the element.
