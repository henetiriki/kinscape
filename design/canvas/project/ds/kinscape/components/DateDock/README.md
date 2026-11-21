The Map date control.

## Design

- **Date dock:** step back, a typed date field, step forward, Year / Month / Day, a contested-claims note and Play with 1, 5 or 10 yr/s. Under that is the 1652–today slider with epoch ticks and the contested years hatched. The thumb snaps to each step at the chosen precision. The date field is the only date readout. Then "Jump to" epoch buttons and keyboard hints.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `contestedCount` | `number` | no | Contested claims on the Map date. |
| `contestedYears` | `ContestedYears[]` | no | Year spans drawn hatched on the slider. |
| `day` | `Day` | yes |  |
| `defaultText` | `string` | no | Text the date field starts with instead of the date, checked on the first render. A design board sets it; the app does not. |
| `details` | `ReactNode` | no | The phone sheet only: content under the slider, such as the Pin popup. With it the sheet is open. |
| `epochs` | `Epoch[]` | no | Epochs for Jump to; they are also the slider's ticks. |
| `hasBorders` | `((day: Day) => boolean)` | no | Whether a Boundary version is valid on a day; a typed date without one shows the warning. |
| `lastDay` | `Day` | yes |  |
| `onChange` | `(day: Day) => void` | yes |  |
| `onPlay` | `((speed: number) => void)` | no | Play pressed, with the speed in years per second. |
| `sheet` | `{ expanded: boolean; onExpandedChange: (expanded: boolean) => void; }` | no | The phone sheet instead of the dock. |
