A modal bottom sheet on a native `<dialog>`.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | yes |  |
| `onClose` | `() => void` | yes | Called when the Close button, the scrim or Esc dismisses the sheet. |
| `open` | `boolean` | yes |  |
| `subtitle` | `string` | no |  |
| `tabs` | `{ label: string; onSelect?: (value: string) => void; selected: string; tabs: Tab[]; }` | no |  |
| `title` | `string` | no |  |

It takes one of these forms. Required props: `children`, `onClose`, `open`, `title`; or `children`, `onClose`, `open`, `tabs`.
