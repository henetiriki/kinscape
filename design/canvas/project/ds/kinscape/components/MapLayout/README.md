The map screen's frame: the map is `children`, and each slot is a placed box over it.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `account` | `ReactNode` | no | The account control, on desktop. |
| `action` | `ReactNode` | no | The "Add a pin" button, on desktop: 12px left of the account control. |
| `children` | `ReactNode` | no | The map. |
| `credits` | `ReactNode` | no | The source credits, on desktop. |
| `dock` | `ReactNode` | no | The date dock. |
| `layers` | `ReactNode` | no | The Layers button, on a phone. |
| `overlay` | `ReactNode` | no | The popup area over the map. |
| `overlayAt` | `"top"` | no | `top` puts the overlay at the slot's top edge; otherwise it centres. |
| `panel` | `ReactNode` | no | The side panel, or the sheet on a phone. |
| `search` | `ReactNode` | no | The search bar. |
| `zoom` | `ReactNode` | no | The zoom controls, on desktop. |
