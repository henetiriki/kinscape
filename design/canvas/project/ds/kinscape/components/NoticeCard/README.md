Says what is going on in one line and offers at most two ways out.

## Design

- **Notice card:** white card with the panel shadow, an icon, a 15/600 title and one line of help, plus up to two buttons. A button can be a link. It shows empty and loading states.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `actions` | `[Action, Action] \| [Action]` | no | Up to two buttons; the first is primary. |
| `children` | `ReactNode` | yes | The one line. |
| `icon` | `"menu" \| "search" \| "alert" \| "back" \| "chevronDown" \| "close" \| "cloudOff" \| "copy" \| "document" \| "done" \| "error" \| "export" \| "eye" \| "eyeOff" \| "fit" \| "forward" \| "info" \| "layers" \| "people" \| "place" \| "play" \| "signOut" \| "success" \| "warning" \| "zoomIn" \| "zoomOut"` | no |  |
| `phone` | `boolean` | no | The kit's phone sample: 358 wide with 44 buttons. |
| `progress` | `number` | no |  |
| `size` | `"large"` | no | `large`: the icon on top, an H3 title, 380 wide. |
| `title` | `string` | yes |  |
