A row of tabs that switches panels, such as Layers and Filters.

## Design

- **Tabs** (Layers / Filters): the selected tab gets `--brand-tint`. A count badge in `--brand` shows active filters.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | no |  |
| `fill` | `boolean` | no | The tabs share the row, 44 tall (a phone sheet head). |
| `label` | `string` | yes |  |
| `onSelect` | `((value: string) => void)` | no |  |
| `selected` | `string` | yes |  |
| `tabs` | `Tab[]` | yes |  |
