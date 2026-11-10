The handle, one of three heads (title, title and subtitle, or tabs) and the content.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `onClose` | `(() => void)` | no |  |
| `subtitle` | `string` | no |  |
| `tabs` | `{ label: string; onSelect?: (value: string) => void; selected: string; tabs: Tab[]; }` | no |  |
| `title` | `string` | no |  |
| `titleId` | `string` | yes |  |

It takes one of these forms. Required props: `children`, `title`, `titleId`; or `children`, `tabs`, `titleId`.
