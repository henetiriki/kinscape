The Filters tab, in order: Person, Surname, Event type, Branch.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `branch` | `string` | yes |  |
| `branches` | `Choice[]` | yes |  |
| `events` | `string[]` | yes | The chosen Event types. |
| `eventTypes` | `ChipOption[]` | yes |  |
| `onBranchChange` | `(value: string) => void` | yes |  |
| `onEventToggle` | `(value: string) => void` | yes |  |
| `onPersonChange` | `(value: string) => void` | yes |  |
| `onSurnamesChange` | `(values: string[]) => void` | yes |  |
| `people` | `Choice[]` | yes |  |
| `person` | `string` | yes |  |
| `surnameHelper` | `string` | no | A line under Surname, such as what the field matches. |
| `surnames` | `string[]` | yes |  |
