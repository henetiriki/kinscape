The Pins of one Place, spread around it (PIN-06).

## Design

- **Fan of Pins:** Hover or a first tap spreads the Pins in rings, from below the Place, clockwise in date order. Name: "Birth, about 1850".

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | no |  |
| `looks` | `Partial<Record<string, ControlState>>` | no |  |
| `onOpen` | `((id: string) => void)` | no | A click on a Pin, with its id. |
| `pins` | `FanPin[]` | yes |  |
