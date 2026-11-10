"What was this spot part of on the map date?": the Jurisdiction chain and the pins there.

## Design

- **Jurisdiction popup:** "On this spot in {year}", the place name valid on that date, coordinates in mono, then the jurisdiction chain as level / name rows, then pins at that spot.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `chain` | `ChainLevel[]` | yes |  |
| `coordinates` | `string` | yes |  |
| `form` | `"floating" \| "sheet"` | yes | A floating popup on a desktop; a sheet region on a phone. |
| `onClose` | `(() => void)` | no | Called by Close and by Esc inside the popup. |
| `onCopied` | `((ok: boolean) => void)` | no | Called with whether the chain reached the clipboard; the caller shows the Toast. |
| `pins` | `PopupPin[]` | yes |  |
| `place` | `string` | yes |  |
| `year` | `number` | yes |  |
