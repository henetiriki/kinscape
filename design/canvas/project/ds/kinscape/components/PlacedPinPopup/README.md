The floating popup at a map point, in pixels from the corner of the overlay area.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | `string` | no | The address as recorded; the loaded state shows it, and an empty one reads as no address. |
| `event` | `"other" \| "baptism" \| "birth" \| "burial" \| "death" \| "divorce" \| "land" \| "marriage" \| "occupation" \| "residence"` | yes | The Event type of the Pin. |
| `name` | `string` | no | The Person's name; the loaded state shows it. |
| `onAddHere` | `(() => void)` | no | "Add a pin here" in the floating popup calls it. |
| `onClose` | `(() => void)` | no | Called by Close and by Esc inside the floating popup. |
| `onEdit` | `(() => void)` | no | "Edit" in the floating popup calls it. |
| `onRetry` | `(() => void)` | no | Called by "Try again" in the failed state. |
| `reading` | `string` | yes | The reading of the date, such as "From 1890 to 1905". |
| `recorded` | `string` | yes | The date as recorded, such as "FROM 1890 TO 1905". |
| `state` | `"failed" \| "loaded" \| "loading"` | yes | Loading and failed show the event type and both date lines only. |
| `x` | `number` | yes |  |
| `y` | `number` | yes |  |
