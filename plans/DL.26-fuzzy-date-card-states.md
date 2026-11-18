# Plan: DL.26: Each fuzzy date reading is a card state, and /screens/fuzzy-date-readings goes

- **Spec:** #964
- **Requirement IDs:** [PPL-01](../docs/requirements.md#ppl-01), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** draft

## Approach

The `FuzzyDateField` card in `lib/design/states.mts` gains the 10 states of Behaviour 1, after `FuzzyDateField · disabled`, in the order of the table. Each state has `helper: FUZZY_DATE_HELPER`, `label: 'Born'` and its value as `defaultValue`. The field checks `defaultValue` on the first render, so each error state shows its message and the error border with no key press. `react-18.test.tsx` gains the same 10 cases, because its preview test compares the labels and props of each card with its cases. The card `height` grows until the gallery file shows the 16 states.

Then the page folder, its `SCREEN_ONLY` row, its test in `person.test.tsx`, its `design/screens.json` entry and its `SKIPPED` name go. With no name, `SKIPPED` skips nothing, so the constant, its comment and its filter go too. `fuzzy-date-readings` joins `NO_ENTRY`, because its JPG stays.

## Decisions

**D1 · Who builds** · Decides: Tech lead

The Spec says that the tech lead, or a local session, builds it. The [design-system rule](README.md#design-system) lets the CI build agent build the code. The agent then asks in the PR for steps 3 to 5 and keeps the PR as a draft. DL.11 (#912) used option A.

- **A.** The CI build agent runs steps 1 to 5 of Order of work. The tech lead, or a local session that the tech lead starts, runs steps 6 and 7.
- **B.** The tech lead, or a local session, builds all of it. The CI agent does not build.
- **Other:** your own.

Recommended: A, because the code steps need no claude.ai account, and the tech lead only runs the steps that need one.

## Files that change

| File                                                              | New / changed | What                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/states.mts`                                           | changed       | The 10 states; a new `height`                                                                                                                             |
| `lib/design/__tests__/react-18.test.tsx`                          | changed       | The same 10 cases                                                                                                                                         |
| `features/people/components/__tests__/FuzzyDateField.test.tsx`    | changed       | New `it.each`: it renders each new state from `CARDS`, and expects "Reads as" and its reading, or its message with `aria-invalid` and `data-mark="error"` |
| `app/screens/fuzzy-date-readings/page.tsx`, `readings.module.css` | deleted       | Behaviour 4                                                                                                                                               |
| `app/screens/__tests__/person.test.tsx`                           | changed       | The test "show every reading and message of the date field" and its import go. `fuzzy-date-text.test.ts` asserts each reading and message                 |
| `lib/design/__tests__/screens.test.ts`                            | changed       | The `SCREEN_ONLY` row goes; `NO_ENTRY` gains `fuzzy-date-readings`                                                                                        |
| `design/screens.json`                                             | changed       | The `fuzzy-date-readings` entry goes                                                                                                                      |
| `e2e/widths.spec.ts`                                              | changed       | `SKIPPED` goes                                                                                                                                            |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`             | changed       | Design system steps only                                                                                                                                  |
| `design/cards/FuzzyDateField-1440.png`                            | changed       | The workflow commits it                                                                                                                                   |

## Order of work

1. Add the `FuzzyDateField.test.tsx` test. See it fail, because `CARDS` has no `FuzzyDateField · exact`.
2. Add the 10 states and the 10 cases. Run `npm run design:gallery`. Set `height` to the height of the 16 states, rounded up to 20.
3. If an error state shows no error, stop and comment on #893 (Spec concern 4).
4. Delete the folder and its test. Change `SCREEN_ONLY`, `NO_ENTRY`, `design/screens.json` and `e2e/widths.spec.ts`.
5. Run the checks in `AGENTS.md`, and `git grep -n fuzzy-date-readings -- e2e design/screens.json app`. Push.
6. The tech lead, or a local session that the tech lead starts, runs steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). The session needs a signed-in account. No board shows the change, so step 7 does not apply.
7. The tech lead runs the workflow Design: Render snapshots. It commits `design/cards/FuzzyDateField-1440.png`.

## Risks

- **Chore #927 merges first.** Then the card is in `PHONE_CARDS`, and step 7 also commits `FuzzyDateField-390.png`.
- **#979 removes step 4.7 of "Updating the install".** #979 waits for this Spec, so this build runs 4.1 to 4.7, as on `main`.

## Proof

| Acceptance check                      | Proven by                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1. 16 states, readings, error borders | The `FuzzyDateField.test.tsx` test; the preview test in `react-18.test.tsx`; `npm run design:gallery`                           |
| 2. The text of the page on `main`     | The literals of the new test match the literals of `fuzzy-date-text.test.ts`, which tests the two functions that the page calls |
| 3. The card images                    | The `gallery` job after step 7                                                                                                  |
| 4, 5. The design system steps         | The step 3.11 and 4.6 reports in the PR; the sha256 compare of step 4.6                                                         |
| 6. 404, and no file names the route   | The PR pastes the status code from a signed-in dev session, and the empty `git grep` of step 5                                  |
| 7. No snapshot, JPG or board changes  | `git diff main --stat`, pasted in the PR                                                                                        |
| 8. The checks pass                    | `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e` output                                                           |

## Out of scope

- The board `Fuzzy-date-readings`, its snapshot, its JPG, its `design/canvas/export.json` entry and its `design/DESIGN.md` row.
- `lib/design/shots.mts` and `shots.test.ts`: they size the JPG of the board, which stays.
