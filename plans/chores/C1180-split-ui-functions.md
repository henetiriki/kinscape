# Plan: C1180: Split the UI functions over 60 lines and remove their disables

- **Spec:** #1180
- **Requirement IDs:** None. This Chore changes no behaviour.
- **Status:** approved

## Approach

Each of the 25 functions gets Extract Function and Split Phase until each function holds 60 lines or fewer. Then its disable line goes. Each component keeps its props type, its DOM and its exported names. The two moves are these:

- State, effects and handlers go to a `use<Name>` hook. The hook keeps the order of the hooks and of the effects.
- Each block of markup goes to a sub-component, with no new wrapper element.

Each new function goes in the same file, at module level, with no `export` (D2). Coverage stays at 100%, because the same tests run the same lines. A `v8 ignore` line moves with the line that it covers.

## Decisions

**D2 · Where the extracted functions go** · Decides: Tech lead

`lib/design/__tests__/bundle.test.ts:133` fails for a `.tsx` file in an `app/components/<role>/` folder that is not in `CONTROLS` or `EXCLUDED`. The Chore lets the diff change no file under `__tests__/`, and no `CONTROLS` entry. `docs/patterns/map.md` says that only `MapView.tsx` drives the map. #1181 has no value for this.

- **A.** Put each new function in the file of the function that it came from, at module level, with no `export`. Cost: some files grow, for example `MapView.tsx` from 411 lines to about 450.
- **B.** Same file in `app/components/`, but new files (such as `useMapEvents.ts`) in `features/`. Cost: 10 or more new files, `knip` exports, and a `docs/patterns/` path edit, which is a hand-back path.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **Move a long JSX block into a new component file.** In `app/components/`, the `EXCLUDED` test then fails (D2).
- **Raise the cap in the lint rule.** The Chore asks for the split.

## Files that change

The line count is the count of `max-lines-per-function` on `main` at `e57d73f5`.

| File                                                         | New / changed | What                                                                                                                                                                                         |
| ------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/components/actions/PersonRow.tsx`                       | Changed       | `PersonRow` (69): the name and note lines to a part. Keep the intersection props type as it is.                                                                                              |
| `app/components/auth/SignInForm.tsx`                         | Changed       | `SignInForm` (113): the submit state to `useSignIn`; the alert and the fields to parts.                                                                                                      |
| `app/components/auth/SignInHero.tsx`                         | Changed       | `SignInHero` (119): one part for each group of the SVG sketch (the coast, the borders, the labels). The path data does not change.                                                           |
| `app/components/feedback/NoticeCard.tsx`                     | Changed       | `NoticeCard` (66): the action buttons to a part.                                                                                                                                             |
| `app/components/forms/TextField.tsx`                         | Changed       | `TextField` (98): the input with its marks to a part.                                                                                                                                        |
| `app/components/forms/TokenField.tsx`                        | Changed       | `TokenField` (95): the key handling to `useTokens`; the chip list to a part.                                                                                                                 |
| `app/components/overlays/Menu.tsx`                           | Changed       | `Menu` (65): the open state and the dismiss to `useMenu`. Keep the `jsx-a11y` disable.                                                                                                       |
| `app/components/overlays/PinPopup.tsx`                       | Changed       | `PinPopup` (135): the header, the body, the loading form, the failed form and the actions to parts.                                                                                          |
| `app/components/overlays/Popup.tsx`                          | Changed       | `Popup` (98): the header and the chain rows to parts.                                                                                                                                        |
| `app/screens/map-frame.tsx`                                  | Changed       | `MapFrame` (88): the slot content to parts.                                                                                                                                                  |
| `features/map/components/DateDock.tsx`                       | Changed       | `DateDock` (160): the note state to `useNote`; the field, the sheet form and the desktop row to parts.                                                                                       |
| `features/map/components/DateField.tsx`                      | Changed       | `DateField` (150): the text, problem and Esc state to `useDateText`; the callout and the message below the field to parts.                                                                   |
| `features/map/components/DateSlider.tsx`                     | Changed       | `DateSlider` (85): the ticks and the hatches to parts.                                                                                                                                       |
| `features/map/components/MapShell.tsx`                       | Changed       | `MapShell` (191): the Pin close effects to `useClosePin`; the dock, the overlay and the zoom slots to parts.                                                                                 |
| `features/map/components/MapView.tsx`                        | Changed       | `MapView` (259): one hook for each phase: map creation, padding, source data, the icon resolver, filters and markers, and the open point. `MapView` stays the only part that drives the map. |
| `features/map/layers/pins.ts`                                | Changed       | `pinsLayer` (84): the sources, the style layers and the markers to helper functions.                                                                                                         |
| `features/people/components/FuzzyDateField.tsx`              | Changed       | `FuzzyDateField` (93): the reading and problem state to a hook; the line under the input to a part.                                                                                          |
| `features/people/components/PeopleList.tsx`                  | Changed       | `PeopleList` (159): the search state to a hook; the header, the empty state and the list to parts.                                                                                           |
| `features/people/components/PersonField.tsx`                 | Changed       | `PersonFieldList` (83) and `PersonField` (129): the key and pick logic to a hook; the list rows and the no-match notice to parts.                                                            |
| `features/people/components/PersonForm.tsx`                  | Changed       | `PersonForm` (292): the values, errors and `submit` to `usePersonForm`; the alerts, the Name group, the Life group, the leave dialog and the toast to parts.                                 |
| `features/people/components/PersonRelationships.tsx`         | Changed       | `PersonRelationships` (163): the state to a hook; each group of rows and the dialogs to parts. Keep `PersonRelationshipsProps`.                                                              |
| `features/people/components/PinForm.tsx`                     | Changed       | `PinForm` (207): the save logic to a hook; the field groups, the alerts and the toast to parts.                                                                                              |
| `features/people/components/RelationshipDetails.tsx`         | Changed       | `RelationshipDetails` (163): the values and save logic to a hook; the subtype and date groups to parts.                                                                                      |
| `features/people/components/RelationshipPicker.tsx`          | Changed       | `RelationshipPicker` (74): the search state to a hook.                                                                                                                                       |
| `scripts/__tests__/length-disables.test.ts`                  | Changed       | `CAP` is 22. Lines 71 to 75 use `CAP + 1` and `CAP` in place of 48 and 47 (#1180 D1). The case "flags a count over the cap" then tests 23 and 22.                                            |
| `design/canvas/project/ds/kinscape/`                         | Changed       | Step 5: the new `components/bundle.js` and each other file that step 3 sends.                                                                                                                |
| `design/canvas/project/canvas.json`, `design/canvas/VERSION` | Changed       | Step 5: the `version` and `copiedAt` of the `designSystems` entry, and the version line.                                                                                                     |

Each removed disable is part of the row of its file. The parts in each row are a guide: a small departure if a different cut fits better.

## Order of work

1. Before any code change, run `npm run design-system`. Paste the sha256 of each file under `.design-system/project/` in the PR Evidence.
2. Refactor the 12 `CONTROLS` functions (11 files) in one commit. Remove their disables. Run `npm test` and `npm run lint` on the commit.
3. Refactor `features/map/` and `app/screens/map-frame.tsx` in one commit, then `features/people/` and `app/components/auth/` in one commit. Run the same checks after each.
4. If `main` has a different set of disables in `app/` and `features/`, refactor that set (Constraint 3). Set `CAP` and lines 71 to 75 (#1180 D1). Run `npm test`.
5. Run the checks of `AGENTS.md` › Commands.
6. Design system, step 2: run `npm run design-system`. Compare each sha256 with step 1. Only `components/bundle.js`, `checksums.json` and `design-system.json` may differ. If `index.d.ts`, a README or a preview differs, stop and ask the tech lead in the PR (Constraint 2).
7. Push. Keep the PR a draft. In the PR, ask the tech lead for steps 3 to 5.
8. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5. The session needs a signed-in claude.ai account.
9. Design system, step 6: no board shows the change, so step 7 does not run. Push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, stop. The Chore allows no image update, so a failure is a behaviour change. Fix the code.

## Risks

- A sub-component that a render defines remounts on each render, and loses focus and state. Define each part at module level only.
- A hook that moves an effect can change the order in which effects run. `MapView` and `DateField` depend on it. Keep the order of the effects as on `main`.
- `DateField` sets state during render when the date changes from outside. Keep this block in the body of `useDateText`, not in an effect.
- Prettier can move a comment off its line. Read each diff for moved `v8 ignore` and `jsx-a11y` comments.
- The `gallery` job runs only on a ready PR. The tech lead marks the PR ready after step 5. That run proves the card images.

## Proof

| Acceptance check                                                                           | Proven by                                                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `git grep "before the rule (C1174)" -- app features` finds nothing.                        | The pasted output.                                                  |
| `npm run lint` passes.                                                                     | The pasted output and CI.                                           |
| `npm test` passes with 100% coverage, with no other test change.                           | The pasted output; `git diff --stat main -- '**/__tests__/**' e2e`. |
| The `e2e`, `design` and `gallery` jobs pass with no image update.                          | CI on the ready PR.                                                 |
| The build runs steps 2 to 6 of _Changing the design system_.                               | The sha256 lists of steps 1 and 6, and the commits of step 5.       |
| Each file under `canvas/project/ds/kinscape/` has the sha256 of `.design-system/project/`. | The step 4.6 report of the session.                                 |

## Out of scope

- The disables in `scripts/`, `server/` and `lib/`: #1181.
- The `jsx-a11y` disables in `Menu.tsx`, `PinPopup.tsx`, `Popup.tsx` and `Modal.tsx`.

## Deviations

- Big: step 6 stops. `components/index.d.ts` differs from step 1. `DateField`, `FuzzyDateField`, `PersonField`, `PersonFieldList` and `DateDock` now take `props: <Name>Args` or a named type, where they took an inline type. The props types are the same. The tech lead accepted the new declaration text. No wrapper is added.
- Small: five component READMEs differ from step 1 (`ColumnLayout`, `PersonFieldList`, `PinPopup`, `Popup`, `Surface`). TypeScript lists the members of four unions in a new order. `PersonFieldList` shows the alias `Rows`. The props types are the same. Step 3 sends these files with the new declaration text.
- Small: a component with a long destructured prop list takes one `props` argument, and a hook or a part reads it. The line count of `max-lines-per-function` includes the parameters.
- Small: a ref that a hook uses is made in the component and passed to the hook (the `react-hooks/refs` rule). A named props type is `<Name>Args` where `<Name>Props` is a bundle type name.
