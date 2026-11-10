A modal for a task or a long read: centred over the scrim, or a bottom sheet on a phone.

## Design

- **Dialog:** centred over a `--scrim`, radius 12, close button top right.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `footnote` | `string` | no | A line under the body. |
| `form` | `"sheet" \| "centred"` | no | Forces a form; without it a phone gets the sheet and anything else the centred dialog. |
| `onClose` | `() => void` | yes | Called when the Close button, the scrim or Esc dismisses the dialog. |
| `open` | `boolean` | yes |  |
| `subtitle` | `string` | no |  |
| `title` | `string` | yes |  |
