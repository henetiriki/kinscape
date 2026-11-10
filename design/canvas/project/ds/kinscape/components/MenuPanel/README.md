The account Menu's card: who is signed in, the item groups split by dividers, and a footer line.

## Design

- **Menu:** white card, popup shadow, 44px rows with an icon.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | `string` | yes |  |
| `footer` | `string` | no | A line under the items. No line is drawn when unset. |
| `groups` | `MenuEntry[][]` | yes |  |
| `hovered` | `string` | no | The item drawn hovered. |
| `inert` | `boolean` | no | Only drawn: out of the tab order and the accessibility tree. |
| `menuRef` | `Ref<HTMLDivElement>` | no |  |
| `onKeyDown` | `((event: KeyboardEvent<HTMLDivElement>) => void)` | no |  |
| `onSelect` | `((id: string) => void)` | no |  |
