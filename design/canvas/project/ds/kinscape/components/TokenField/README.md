A field of removable chips with an input that adds the next one on Enter.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `defaultValues` | `string[]` | no |  |
| `disabled` | `boolean` | no |  |
| `error` | `ReactNode` | no | The problem, shown under the field in place of `helper`. Marks the field as in error. |
| `helper` | `ReactNode` | no |  |
| `label` | `string` | yes |  |
| `onChange` | `((values: string[]) => void)` | no |  |
| `placeholder` | `string` | no |  |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
| `values` | `string[]` | no | When given, the field shows these and only reports changes; the caller holds them. |
