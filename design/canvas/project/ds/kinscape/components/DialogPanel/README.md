The Dialog as drawn: a modal Surface with a fixed head and a body that scrolls.

## Design

- **Dialog:** centred over a `--scrim`, radius 12, close button top right.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `footnote` | `string` | no | A line under the body. |
| `form` | `"sheet" \| "centred"` | yes |  |
| `onClose` | `(() => void)` | no | No board passes it: a board only draws the panel. |
| `subtitle` | `string` | no |  |
| `title` | `string` | yes |  |
| `titleId` | `string` | yes |  |
