One choice from a few, as radios: the arrow keys move the choice.

## Design

- **Segmented control** (date precision, play speed): a `--segment` track; the selected segment is white with a small shadow.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | no |  |
| `label` | `string` | yes |  |
| `name` | `string` | yes |  |
| `onChange` | `((value: string) => void)` | no |  |
| `options` | `Segment[]` | yes |  |
| `value` | `string` | yes |  |
