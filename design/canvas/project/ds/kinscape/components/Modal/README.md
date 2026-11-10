A modal on a native `<dialog>`: the browser handles Esc, the inert page and focus return.

## Design

- **Dialog:** centred over a `--scrim`, radius 12, close button top right.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `onClose` | `() => void` | yes | Called when the scrim or Esc dismisses the modal. |
| `open` | `boolean` | yes |  |

The other attributes of its HTML element go to the element.
