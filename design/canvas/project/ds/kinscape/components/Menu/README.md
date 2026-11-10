The Avatar and its Menu, 8 below it and right-aligned.

## Design

- **Menu:** white card, popup shadow, 44px rows with an icon.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | `string` | yes |  |
| `footer` | `string` | no | A line under the items. No line is drawn when unset. |
| `form` | `"phone"` | no | `phone`: the card hangs from the nearest positioned ancestor (the search pill), not from the Avatar. With no positioned ancestor it hangs from the page. |
| `groups` | `MenuEntry[][]` | yes |  |
| `initial` | `string` | yes |  |
| `onSelect` | `(id: string) => void` | yes | Called after the menu has closed and the Avatar has focus. |
