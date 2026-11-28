The popup of a click on empty map (PIN-01), at a map point in pixels from the corner of the overlay area, with the point drawn as a dot.

## Design

- **Click popup:** A click on empty map opens it. It has the frame of the Pin popup and sits `popup-gap` left of the point. The overline "Point on the map" sits over the point in `type.mono-caption`: decimal degrees with 6 decimals, latitude first. A Close icon button sits 8px up and right. A `small` line says "The panel opens with this point filled in." A primary "Add a pin here" ends it. The popup is at least 134px high, so the pointer clears the bottom corner. The point shows as a 12px dot in `--brand` with a 2.5px `--surface` edge. Close and Esc close it. M3 adds the jurisdiction chain between the coordinates and the button.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `onAdd` | `(point: ClickPoint) => void` | yes | Called by "Add a pin here" with the point. |
| `onClose` | `(() => void)` | no | Called by Close and by Esc inside the popup. |
| `point` | `ClickPoint` | yes |  |
| `x` | `number` | yes |  |
| `y` | `number` | yes |  |
