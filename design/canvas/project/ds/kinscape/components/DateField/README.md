The typed Map date.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `after` | `ReactNode` | no | Beside the field on the right: the step forward button. |
| `before` | `ReactNode` | no | Beside the field on the left: the step back button. |
| `day` | `number` | yes | The last good date: what the map shows. |
| `defaultText` | `string` | no | Text to start with instead of the date; it is checked on the first render, unless `state` is `focus`. |
| `fill` | `boolean` | no | The field takes the width the row leaves, as in the phone date sheet. |
| `keepPrecision` | `boolean` | no | A typed date or a fix commits at the field's precision, never a finer one. |
| `max` | `number` | yes | The last Map date: today. |
| `min` | `number` | yes | The first Map date. |
| `notice` | `Notice` | no | Something the app did, shown while it is passed; the caller clears it. |
| `onChange` | `(day: number, precision: Precision) => void` | yes |  |
| `placement` | `"above" \| "below"` | no | `above` opens the message over the field, for the dock at the bottom of the screen. |
| `precision` | `"day" \| "month" \| "year"` | yes |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
