The map's side panel: a tabs head and a body that scrolls.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `bodyId` | `string` | no | The id the tabs' `controls` point to. |
| `children` | `ReactNode` | yes |  |
| `end` | `ReactNode` | no | The legend, or "Clear filters". It sits at the end of the body, after the children. |
| `gap` | `14 \| 20` | no | Space between the body's groups, as the tab draws it. |
| `label` | `string` | yes |  |
| `onSelect` | `((value: string) => void)` | no |  |
| `selected` | `string` | yes |  |
| `tabs` | `Tab[]` | yes |  |
