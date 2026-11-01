A problem or note about one part of the screen.

## Design

- **Alert:** 1px system border, system background and text, padding 12 16, gap 12, a filled 20px icon, a 14/600 title and one line in `type.small`.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `aside` | `ReactNode` | no | A note at the right of the title line. |
| `children` | `ReactNode` | yes |  |
| `title` | `string` | no |  |
| `tone` | `"error" \| "info" \| "success" \| "warning"` | yes |  |
