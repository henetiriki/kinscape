A text field that picks one Person (PIN-01).

## Design

- **Person field:** a Text field that picks one Person. The panel is 320px wide, so the field is 280px. A Picker row needs about 440px, so the list is a popover 480px wide. It opens 4px under the field, on its left edge, over the map. It shows at most three rows and scrolls past them. A row that matches a spelling variant shows it. If no Person matches, a 280px notice shows "No one matches “{text}”" and the line "Check the spelling, or add the person to the Tree first." The focus stays in the text box. Down and Up move through the rows, Enter picks one and Esc closes the list. When the user types after a pick, the pick clears. A press outside the field and the list closes it too. The error "Choose a person." follows the Text field.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `defaultPerson` | `PersonSummary` | no | A Person to start with, picked. |
| `error` | `ReactNode` | no | The problem, shown under the field. The field is also required. |
| `onChange` | `(person: PersonSummary \| undefined) => void` | yes | Called with the Person that a pick chose, and with `undefined` when the user types after a pick. |
| `people` | `PersonSummary[]` | yes | Every Person of the Tree. The caller gives no empty list. |
| `state` | `"active" \| "focus" \| "hover"` | no |  |
