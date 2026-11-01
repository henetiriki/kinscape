The result of an action.

## Design

- **Toast:** white, popup shadow, bottom centre above the dock. Success leaves after 4 seconds; errors stay and offer a retry.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | `string` | no |  |
| `children` | `string` | yes |  |
| `onAction` | `(() => void)` | no |  |
| `onDismiss` | `(() => void)` | no |  |
| `placed` | `boolean` | no | Fix it at its phone position, above the date sheet. |
| `tone` | `"error" \| "success"` | yes |  |
