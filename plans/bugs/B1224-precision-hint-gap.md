# Plan: B1224: The pin-edit screen sits about 4 px off its snapshot below the Precision field

- **Spec:** #1224
- **Requirement IDs:** [PIN-01](../../docs/requirements.md#pin-01), [PIN-02](../../docs/requirements.md#pin-02)
- **Status:** approved

## Approach

The board `design/canvas/project/Map-add-pin.dc.html:97` puts the Precision field and its hint in one flex column with `gap: var(--space-8)`. `PinForm` puts the hint straight in the form body, so the body's `gap: var(--space-12)` sets the gap. The build wraps the Precision `SelectField` and the hint in one `div` with the board's column rule. The wrapper is always there, as on the board. Without the hint, the body gap still puts 12 px between the Precision box and the `Sources` label. `.none` in `PinForm.module.css` already holds the same column rule, so the build renames it to `.stack` and uses it for both groups.

## Decisions

**D1 · The 1 px select text, if the score stays above 0.25%** · Decides: Tech lead

The Bug puts the 1 px low text of the `Residence` and `Farm` selects out of scope. It also says to fix it in this Bug if the score stays above 0.25%. That fix can go in `SelectField`, which is in `CONTROLS`. A change to it is a design system input, so steps 3 to 5 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) need the tech lead or a local session.

- **A.** If the score is above 0.25% after the gap fix, the build measures the select text and fixes it in this Bug. If the fix is in `SelectField`, the PR stays a draft until the tech lead runs steps 3 to 5. Cost: a wait for a local session.
- **B.** The build fixes only the gap and reports the two scores in the PR. If a score is above 0.25%, the build files a new Bug for the select text and writes a "Big:" line for check 4. Cost: check 4 stays open until that Bug merges.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Render the wrapper only when the hint shows. The board always draws it, and an empty wrapper changes no gap.
- Add a new `.precision` class next to `.none`. That defines one rule twice ([code rules](../../docs/code-rules.md)).

## Files that change

| File                                            | New / changed | What                                                                                                                           |
| ----------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `features/people/components/PinForm.tsx`        | changed       | `PlaceFields` wraps the Precision `SelectField` and the hint in `<div className={styles.stack}>`; `PersonChoice` uses `.stack` |
| `features/people/components/PinForm.module.css` | changed       | Rename `.none` to `.stack`                                                                                                     |
| `e2e/map-points.ts`                             | changed       | A helper that gives the distance from the bottom of the Precision box of a panel to the top of another element                 |
| `e2e/pin-edit.spec.ts`                          | changed       | The first test checks an 8 px gap to the hint while the precision is fixed, and 12 px to `Sources` after the point moves       |
| `e2e/pins.spec.ts`                              | changed       | The "Add a pin here" test checks an 8 px gap to the hint                                                                       |

## Order of work

1. Add the e2e helper and the three gap checks. Run them on `main`. The hint check fails with 12 px.
2. Wrap the Precision field and the hint, and rename the class.
3. Run the checks in `AGENTS.md` › Commands. Push.
4. Read the `pin-edit` and `pin-form-existing-place` scores in the log of the `design` job.
5. If a score is above 0.25%, follow D1.

## Risks

- A `boundingBox` reads fractional pixels. The helper rounds the gap to a whole pixel, so a subpixel layout does not fail the check.
- The score can stay above 0.25% after the gap fix. D1 says what the build does then.

## Proof

| Acceptance check                                         | Proven by                                                                                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1. `pin-edit`: the hint starts 8 px below the box        | `e2e/pin-edit.spec.ts`, the first test, before the point moves                                                       |
| 2. `pin-form-existing-place`: the hint starts 8 px below | `e2e/pins.spec.ts`, "Add a pin here" saves a Pin at the Place of the Pin                                             |
| 3. No fixed Place: no hint, `Sources` 12 px below        | `e2e/pin-edit.spec.ts`, the first test, after the point moves                                                        |
| 4. Both screens score 0.25% or less                      | The `design` job log on the PR                                                                                       |
| 5. Each other `pin-form*` and `pin-edit*` screen matches | The `design` job on the PR                                                                                           |
| PIN-01 and PIN-02 share `PinForm`                        | `PinForm.test.tsx`, `e2e/pin-form.spec.ts`, `e2e/pin-edit.spec.ts`                                                   |
| #869: "Add a pin here" shows the hint                    | `PinForm.test.tsx`, "fixes the point and the precision of an existing Place"; the new check in `e2e/pins.spec.ts`    |
| #884: the edit form shows the hint                       | `PinForm.test.tsx`, "fixes the precision with its note while the point is unchanged, and frees both when it changes" |
| The 0.5% limit stays                                     | `design/screens.json` is not in _Files that change_                                                                  |
| No edit to the design files                              | No design file is in _Files that change_                                                                             |

## Out of scope

- The 1 px select text, except as D1 says.

## Deviations
