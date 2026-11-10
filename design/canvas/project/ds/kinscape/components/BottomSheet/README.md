The phone's non-modal date sheet: the map stays usable behind it.

## Design

- **Phone date sheet:** a non-modal bottom sheet, 152px collapsed and 432px expanded, with a grabber ("Expand the sheet"). Collapsed: the stepper around the date field and a round Play. Expanded adds the slider. No precision, speed, Jump to or hints.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `expanded` | `boolean` | yes |  |
| `onExpandedChange` | `(expanded: boolean) => void` | yes |  |
