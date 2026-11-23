---
paths:
  - 'app/components/feedback/**'
  - 'app/components/forms/**'
  - 'features/map/components/**'
  - 'features/people/components/**'
---

# Feedback

## States

| State                | Design                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First load (NFR-02)  | Panel and date dock render at once from the URL. The map area shows a "Loading the map" card with a progress bar. For a date change, see [Motion](foundations.md#motion).         |
| No pins in the tree  | A notice card in the middle of the map. The map still works as an atlas. No add button until data entry is designed.                                                              |
| No pins on this date | A notice card at the top reads "No pins in {year}" and "Jump to {nearest year}". When filters are on, it also has "Clear filters". The Pins row reads "0 of N true on this date". |
| Districts on         | Thin district lines under polity borders. Where coverage is partial, the Districts row says where (e.g. "On this date: Cape Colony only").                                        |
| Terrain failed       | A banner with Retry. Borders and pins keep working because they load up front.                                                                                                    |
| Account menu         | Signed-in email, People, Export all data (JSON and GeoJSON, NFR-04), Sources and attributions, Sign out, and the last backup time (Export, backup time: M3).                      |
| Phone, collapsed     | Date stepper and Play only.                                                                                                                                                       |

## Feedback and validation

Errors block until fixed, warnings don't, success confirms something finished, and info explains something the app did. Each one has an icon and words. Where it goes:

- **A field's problem:** next to the field, in place of its helper text.
- **A problem with one part of the screen:** an alert in that part, such as a failed sign-in above the form.
- **The result of an action:** a toast.
- **A problem with the app:** a banner.

### Map date field

The DateField component card shows it. The field is 188px wide and accepts `1901`, `1901-06` or `1901-06-14`. The field pads single digits (`1901-6-4`).

1. Check on Enter or when focus leaves, never while the user types.
2. When the date is invalid, keep what was typed. Show a 2px `--error-border` and an error icon inside the field. Set `aria-invalid`. Link the message with `aria-describedby`.
3. In the dock, the message opens 12px above the dock's top edge and points at the field. It is 340px wide from the Back button. On a phone it is the sheet's full width and may cover the credits line. Everywhere else it goes below the field.
4. The map, slider and URL stay on the last good date, and the message names it.
5. Esc restores the last good date. The slider, step buttons and Jump to buttons also clear the error.
6. A good date gets no success styling: the map moving is the confirmation.

| Case                    | Message                                        | Fix offered              |
| ----------------------- | ---------------------------------------------- | ------------------------ |
| Wrong format            | Use 1901, 1901-06 or 1901-06-14.               |                          |
| Before 1652             | Dates run from 1652 to today.                  | Go to 1652               |
| After today             | That's after today.                            | Go to today              |
| Doesn't exist           | February 1901 has 28 days.                     | Go to the last valid day |
| No borders for the date | No borders are mapped for 1750 yet. (warning)  |                          |
| More precise than set   | Switched to month precision. (info, 4 seconds) |                          |

### Fuzzy date field

The FuzzyDateField component card shows it. It is a label, a 44px input and one line under the input. The input text is Mono M with ligatures off. On a phone it takes the size and line of Body L, 16 / 24.

1. The line is one `aria-live="polite"` slot. It shows the helper, "Reads as **{reading}**", or the error message.
2. The reading follows the typing. The error shows on Enter or when focus leaves, never while the user types.
3. An error keeps the text. It shows a 2px `--error-border` and an error icon inside the field. Set `aria-invalid` and link the message with `aria-describedby`.
4. Empty text shows the helper, not an error. A good date gets no success styling.
5. The `error` prop sets a form error. The slot shows the field's own error first.

### Loading bar

The LoadingBar card shows a 20px `--line` bar. The LoadingField card shows a label over one or two bars.
