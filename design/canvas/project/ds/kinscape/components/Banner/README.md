A problem with the app that doesn't stop the map, with one action.

## Design

- **Banner:** `--ink` background, white text, top centre of the map, with one action. For problems that don't block the map.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | `string` | yes |  |
| `children` | `string` | yes |  |
| `icon` | `"menu" \| "search" \| "alert" \| "back" \| "chevronDown" \| "close" \| "cloudOff" \| "copy" \| "document" \| "done" \| "error" \| "export" \| "eye" \| "eyeOff" \| "fit" \| "forward" \| "info" \| "layers" \| "place" \| "play" \| "signOut" \| "success" \| "warning" \| "zoomIn" \| "zoomOut"` | yes |  |
| `onAction` | `(() => void)` | no |  |
| `placed` | `boolean` | no | Fix it at its phone position, under the search bar. |
