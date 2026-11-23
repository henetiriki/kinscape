The list of a `PersonField`: a row for each match, or the no-match notice.

## Design

- **Person field:** a Text field that picks one Person. The panel is 320px wide, so the field is 280px. A Picker row needs about 440px, so the list is a popover 480px wide. It opens 4px under the field, on its left edge, over the map. It shows at most three rows and scrolls past them. A row that matches a spelling variant shows it. If no Person matches, a 280px notice shows "No one matches “{text}”" and the line "Check the spelling, or add the person to the Tree first." The focus stays in the text box. Down and Up move through the rows, Enter picks one and Esc closes the list. When the user types after a pick, the pick clears. A press outside the field and the list closes it too. The error "Choose a person." follows the Text field.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `activeId` | `string` | no | The id of the row with the focus look: `id`, a hyphen and the Person's id. |
| `id` | `string` | yes |  |
| `onPick` | `(person: PersonSummary) => void` | yes |  |
| `place` | `{ left: number; top: number; }` | no | The viewport point of the list's top left corner. |
| `query` | `string` | yes | The text that the user typed. The no-match notice quotes it. |
| `rows` | `Rows` | yes | Each match, with the spelling variant that matched. |
