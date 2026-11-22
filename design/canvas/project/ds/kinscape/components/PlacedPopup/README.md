The floating Popup at a map point, in pixels from the corner of the overlay area: left of the point, with its pointer on the right edge.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `chain` | `ChainLevel[]` | yes |  |
| `coordinates` | `string` | yes |  |
| `onClose` | `(() => void)` | no | Called by Close and by Esc inside the popup. |
| `onCopied` | `((ok: boolean) => void)` | no | Called with whether the chain reached the clipboard; the caller shows the Toast. |
| `pins` | `PopupPin[]` | yes |  |
| `place` | `string` | yes |  |
| `x` | `number` | yes |  |
| `y` | `number` | yes |  |
| `year` | `number` | yes |  |
