# Plan: C1159: Give the remaining Testing Library targets a role or a test id

- **Spec:** #1159
- **Requirement IDs:** [NFR-06](../../docs/requirements.md#nfr-06) (the sign-in form gets a name)
- **Status:** approved

## Approach

`SignInForm.tsx` takes an id from `useId()`. Both `h1` branches get that id, and the `<form>` gets `aria-labelledby` with it. The two tests then use `getByRole('form', { name: 'Sign in' })`. Each of the other 67 nodes gets one `data-testid` in the component that renders it. The table in _Test ids_ gives each id. Each test then queries by test id, keeps its assertion and loses its disable. The 44 kept disables keep their reasons, except the 4 new reasons in `PinFan.test.tsx` (#1159 D2). The ids are in shared controls, so steps 2 to 6 of [Changing the design system](../../design/CANVAS.md#changing-the-design-system) run. No board shows the change, so step 7 does not run.

## Test ids

One id names one part. Where two components draw the same part, they use the same id (#1159 step 3).

| Id                         | Component that sets it                                                        | Disables that it removes                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spacer`                   | `ActionBar.tsx`                                                               | `ActionBar` 32, `ColumnLayout` 90 and 105                                                                                                         |
| `pointer`                  | `Callout.tsx`, `Popup.tsx`                                                    | `Callout` 21, `Popup` 191                                                                                                                         |
| `handle`                   | `PinPopup.tsx`, `Popup.tsx`                                                   | `PinPopup` 193 (D5)                                                                                                                               |
| `loading-bar`              | `LoadingBar.tsx`                                                              | `LoadingBar` 9, `LoadingField` 11 and 26, `PinPopup` 68, `PinForm` 235                                                                            |
| `loading-bars`             | `LoadingField.tsx` (the `data-rows` group)                                    | `LoadingField` 13 and 28                                                                                                                          |
| `ring`                     | `CountMarker.tsx`                                                             | `CountMarker` 29, 31 and 38, `PlaceMarker` 101, `map-pin-count` 28                                                                                |
| `slider-tick`              | `DateSlider.tsx`                                                              | `DateSlider` 33 and 85                                                                                                                            |
| `contested-span`           | `DateSlider.tsx`                                                              | `DateSlider` 46                                                                                                                                   |
| `divider`                  | `SearchBar.tsx`                                                               | `SearchBar` 31                                                                                                                                    |
| `header-row`               | `PeopleList.tsx`                                                              | `PeopleList` 170                                                                                                                                  |
| `place-marker`             | `PlaceMarker.tsx` (the root with `data-open`)                                 | `PlaceMarker` 41, 55, 69 and 80                                                                                                                   |
| `field-box`                | `TextField.tsx`, `SelectField.tsx`, `TextAreaField.tsx`, `FuzzyDateField.tsx` | `TextField` 93, `SelectField` 28, 50 and 83, `TextAreaField` 29, 96 and 114, `DateField` 431, `FuzzyDateField` 83, 169 and 238, `PersonField` 361 |
| `date-anchor`              | `DateField.tsx` (the `data-fill` span)                                        | `DateField` 372 and 379                                                                                                                           |
| `field-row`                | `CheckboxField.tsx`                                                           | `CheckboxField` 49                                                                                                                                |
| `message-slot`             | `FuzzyDateField.tsx` (the `aria-live` div)                                    | `FuzzyDateField` 26                                                                                                                               |
| `<slot>-slot`              | `MapLayout.tsx` (D4)                                                          | `MapLayout` 46, `MapShell` 334, 338, 351, 353 and 386, `map-account-menu` 24, 60 and 62, `pin-form` 19 and 32                                     |
| `column-frame`             | `ColumnLayout.tsx`                                                            | `ColumnLayout` 101                                                                                                                                |
| `menu-anchor`, `menu-drop` | `Menu.tsx`                                                                    | `Menu` 219 and 227                                                                                                                                |
| `menu-wrapper`             | `Menu.tsx` (the `inert` div)                                                  | `Menu` 253                                                                                                                                        |
| `placed-at`                | `PlacedAt.tsx`                                                                | `PlacedAt` 13 and 30, `map-pin-count` 19 and 21, `map-pin-fan` 33 and 54                                                                          |
| `map-host`                 | `app/MapHost.tsx`                                                             | `MapHost` 19                                                                                                                                      |
| `layer-row`                | the mock in `MapWithPins.test.tsx`                                            | `MapWithPins` 82                                                                                                                                  |
| `dialog-panel`             | `Dialog.tsx` (the panel root with `data-form`)                                | `react-18.test.tsx` 67                                                                                                                            |

If a `PersonField` or `DateField` box comes from `TextField`, the id comes from `TextField` alone. The build checks each row against the node that the old query reached.

## Decisions

**D4 · How the `MapLayout` slots name their test ids** · Decides: Tech lead

`MapLayout.tsx` 71 renders each slot from one `data-slot={slot}` line. Tests pick one slot by name, and `MapLayout.test.tsx` 46 counts all slots. No related issue holds a value for this.

- **A.** `data-testid={`${slot}-slot`}`, such as `action-slot` and `panel-slot`. A test finds one slot with `getByTestId('panel-slot')`. `MapLayout.test.tsx` 46 counts with `getAllByTestId(/-slot$/)`.
- **B.** One id, `map-slot`, on each slot. A test takes `getAllByTestId('map-slot')` and picks the slot by its `dataset.slot`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · What `PinPopup.test.tsx` 193 checks** · Decides: Tech lead

The test now checks that no `aria-hidden` node other than an `svg` exists. Its reason names the handle only. A test id can check the handle only.

- **A.** Give the handle in `PinPopup.tsx` and `Popup.tsx` the id `handle`. The test uses `expect(screen.queryByTestId('handle')).toBeNull()`. The check is narrower: a new `aria-hidden` span does not fail it.
- **B.** Keep the disable and the query. Change its reason to "the test checks that no aria-hidden node except an svg exists". Step 2 then has 66 disables, and step 4 has 45. The build rewords the issue.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- A role for slots and decorative nodes: no ARIA role fits them, and a role adds them to the accessibility tree (#1159 D3).
- `aria-label` on the sign-in form: it adds a second copy of the name. `aria-labelledby` reads the `h1`, so no text changes.

## Files that change

The assertions in each test stay the same. Only the query and the disable line change.

| File                                                                                                   | New / changed | What                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------ |
| `app/components/auth/SignInForm.tsx`, `app/components/auth/__tests__/SignInForm.test.tsx`              | changed       | Form name from the `h1`; 2 role queries                      |
| `app/components/actions/ActionBar.tsx`, `app/components/actions/__tests__/ActionBar.test.tsx`          | changed       | `spacer`                                                     |
| `app/components/feedback/{Callout,LoadingBar,LoadingField}.tsx` and their tests                        | changed       | `pointer`, `loading-bar`, `loading-bars`                     |
| `app/components/forms/{TextField,SelectField,TextAreaField,CheckboxField}.tsx` and their tests         | changed       | `field-box`, `field-row`                                     |
| `app/components/layout/{ColumnLayout,MapLayout}.tsx` and their tests                                   | changed       | `column-frame`, slot ids                                     |
| `app/components/overlays/{Popup,PinPopup,PlacedAt,Menu,Dialog}.tsx` and the tests of the first four    | changed       | `pointer`, `handle`, `placed-at`, menu ids, `dialog-panel`   |
| `app/MapHost.tsx`, `app/__tests__/MapHost.test.tsx`, `app/@map/__tests__/MapWithPins.test.tsx`         | changed       | `map-host`; `layer-row` in the mock                          |
| `app/screens/{map-account-menu,map-pin-count,map-pin-fan,pin-form}/__tests__/page.test.tsx`            | changed       | Queries only                                                 |
| `features/map/components/{CountMarker,DateSlider,SearchBar,PlaceMarker,DateField}.tsx` and their tests | changed       | `ring`, slider ids, `divider`, `place-marker`, `date-anchor` |
| `features/map/components/__tests__/MapShell.test.tsx`                                                  | changed       | Slot queries                                                 |
| `features/map/components/__tests__/PinFan.test.tsx`                                                    | changed       | New reason at 68, 70, 77 and 81 (#1159 D2)                   |
| `features/people/components/{FuzzyDateField,PeopleList}.tsx` and their tests                           | changed       | `field-box`, `message-slot`, `header-row`                    |
| `features/people/components/__tests__/{PersonField,PinForm}.test.tsx`                                  | changed       | Queries only                                                 |
| `lib/design/__tests__/react-18.test.tsx`                                                               | changed       | `dialog-panel` query                                         |
| `design/canvas/project/ds/kinscape/**`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`   | changed       | Design system steps 2 to 5                                   |

## Order of work

1. Change the code, one commit per folder. Run `npm run lint` and `npm test` after each.
2. Run `npm run design-system`.
3. Steps 3 to 5 (`/publish-design-system`, "Updating the install", "Refreshing the canvas copy"): a local Claude Code session that the tech lead starts runs them. It needs a signed-in account. The CI build asks for this in the PR and keeps the PR as a draft.
4. Step 6: push the branch. If the `design` or `gallery` job fails on a snapshot or a card image, run the workflow Design: Render snapshots on it.

## Risks

- **More than one match.** A test that renders two field boxes or slots makes `getByTestId` throw. The test then uses `within()` on the field's container or `getAllByTestId` with an index. The assertion stays the same.
- **The wrong node.** Old queries such as `parentElement` chains in `map-pin-fan` and `closest('[data-fill]')` in `DateField` reach one node. The build puts the id on that node and checks that the test fails if the id moves.
- **Bundle size.** Each id ships in builds (Constraint). The cost is about 30 short attributes.

## Proof

| Acceptance check                                                                         | Proven by                                                                                              |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| The 69 disables are gone                                                                 | A PR table: file, line and old reason, and `git grep` with no match                                    |
| The 44 kept disables, and the new `PinFan` reason                                        | A PR table of the 44, each with its reason                                                             |
| Lint, tests and the gallery pass with the same test count                                | `npm run lint`, `npm test` and `npm run design:gallery` output, with the Vitest count before and after |
| Design system steps 2 to 6                                                               | The step commits on the branch                                                                         |
| Each `canvas/project/ds/kinscape/` file has the same sha256 as `.design-system/project/` | Step 4.2 of "Updating the install"                                                                     |

## Deviations

- `app/screens/map-frame.tsx`: `AtPoint` also sets `placed-at`. The `map-pin-count` and `map-pin-fan` pages wrap the marker in `AtPoint`, not in `PlacedAt`.

## Out of scope

- The 44 kept disables and their queries.
- `compiler.reactRemoveProperties`.
