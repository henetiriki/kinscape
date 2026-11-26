# Plan: SC.9: Feature components use purpose names for spacing

- **Spec:** #1201
- **Requirement IDs:** none. The Spec changes no behaviour.
- **Status:** approved

## Approach

Each `var(--space-N)` in the code changes to the purpose name of its role with the same step. The property sets the role, as SC.8 (#1200) D13 says. The px value sets the suffix. Each value on `main` has a name in its role, so no line needs an `own:` reason. `PinFan` reads two new CSS variables: `MAP_SHARED` gets the `fan-line` and `fan-ring` opacities, which `design/kinscape.tokens.json` already holds. The bundle carries all of `app/tokens.css`, so the boards that draw `KinScape.PinFan` get the same values.

### The mapping

| Property                                         | Role    |
| ------------------------------------------------ | ------- |
| `padding*`, `top`, `right`, `bottom`, `left`     | `inset` |
| a negative margin                                | `inset` |
| `gap`, `row-gap`, `column-gap`, `margin-inline*` | `gap`   |
| `margin-left`, `margin-right`                    | `gap`   |
| `margin-top`, `margin-bottom`                    | `stack` |

| `space-N` | 4     | 8    | 12  | 16  | 20  | 24   | 32    | 40    | 48    | 64    |
| --------- | ----- | ---- | --- | --- | --- | ---- | ----- | ----- | ----- | ----- |
| Suffix    | `2xs` | `xs` | `s` | `m` | `l` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` |

These lines need more than the tables:

- `DateDock.module.css` `--callout-lift`: `calc(var(--space-inset-m) + var(--space-inset-s))` (Spec D2).
- `DateField.module.css` lines 32 and 40: the `--callout-lift` fallback is `var(--space-inset-s)`, because `bottom` reads it.
- `LayerGroup.module.css` `margin: 0 0 var(--space-4)`: a block margin, so `space-stack-2xs`.
- `DateSlider.module.css` `margin: calc(-1 * var(--space-8)) 0`: a negative margin, so `space-inset-xs`.
- `PersonField.tsx` `max-height`: `space-inset-2xs`, the block padding of the list (Spec D2).
- A test sample with no role, such as `width: calc(...)`, uses the `inset` name of its value.

## Alternatives considered

- **Local values for the fan opacities.** Rejected: the Spec names the `map` opacities, and #1202 keeps local values for one-off sizes.
- **A size-check rule for `stroke-opacity`.** Not built: see Risks.

## Files that change

| File                                                                                                                                                                                 | New / changed | What                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `lib/design/css.mts`                                                                                                                                                                 | changed       | `MAP_SHARED` adds `fan-line.opacity` and `fan-ring.opacity`. The comment names the fan opacities.  |
| `app/tokens.css`                                                                                                                                                                     | changed       | `npm run tokens` adds `--map-fan-line-opacity: 0.5` and `--map-fan-ring-opacity: 0.25`.            |
| `features/map/components/PinFan.module.css`                                                                                                                                          | changed       | `.line` uses `var(--map-fan-line-opacity)`. `.ring` uses `var(--map-fan-ring-opacity)`.            |
| `features/map/components/{ContestedNote,Credits,DateDock,DateField,DateKeyHints,DateSlider,FilterFields,JumpTo,LayerGroup,Legend,MapShell,Panel,SearchBar,SourcesDialog}.module.css` | changed       | Each `space-N` changes as [The mapping](#the-mapping) says.                                        |
| `features/people/components/{PeopleList,PeoplePage,PersonField,PersonForm,PersonRelationships,PinForm,RelationshipDetails,RelationshipPicker,SavedToast}.module.css`                 | changed       | The same.                                                                                          |
| `features/people/components/PersonField.tsx`                                                                                                                                         | changed       | `max-height` uses `var(--space-inset-2xs)`.                                                        |
| `app/globals.css`                                                                                                                                                                    | changed       | `padding: 0 var(--space-inset-2xs)`.                                                               |
| `app/screens/map-pin-count/MapPinCountScreen.tsx`                                                                                                                                    | changed       | `space-gap-s`, `space-inset-m` and `space-gap-2xs`.                                                |
| `lib/design/cover.html`                                                                                                                                                              | changed       | `bottom` and `left` use `space-inset-2xl`. The layout comment names the purpose names.             |
| `features/people/components/__tests__/PersonField.test.tsx`                                                                                                                          | changed       | The two `max-height` strings expect `var(--space-inset-2xs)`.                                      |
| `features/map/components/__tests__/DateField.test.tsx`                                                                                                                               | changed       | The padding string expects `space-inset-s`, `space-inset-m` and `space-inset-2xs`.                 |
| `lib/design/__tests__/literals.test.ts`                                                                                                                                              | changed       | The samples on lines 178 to 180 and 274 use `space-gap-xs` or `space-inset-xs`. Each still passes. |
| `lib/design/__tests__/sizes.test.ts`                                                                                                                                                 | changed       | The sample on line 165 uses `space-gap-xs`.                                                        |
| `e2e/design-export.spec.mts`                                                                                                                                                         | changed       | The board sample uses `var(--space-inset-m)` for its padding and its width.                        |
| `.design-system/project/`, `design/canvas/project/ds/`, `design/canvas/project/canvas.json`, `design/canvas/VERSION`                                                                 | changed       | The design system steps write them.                                                                |

No `off-token-sizes.json` entry changes, because no literal changes.

## Order of work

1. Edit `MAP_SHARED`. Run `npm run tokens`.
2. Edit `PinFan.module.css`.
3. Edit the other CSS lines, `PersonField.tsx`, `app/globals.css`, `MapPinCountScreen.tsx` and `cover.html`.
4. Edit the five test files.
5. Run `npm run sizes`. The list stays the same.
6. Step 2 of [Changing the design system](../design/CANVAS.md#changing-the-design-system): run `npm run design-system`.
7. Run the checks in AGENTS.md › Commands, `npm run design:check` and the `git grep` of acceptance check 2.
8. Steps 3 to 5: the tech lead runs them, or a local Claude Code session that the tech lead starts. The session needs a signed-in account. The CI build asks for them in the PR and keeps the PR a draft.
9. Step 6: push the branch. If the `design` or `gallery` job then fails on a snapshot or a card image, run the workflow Design: Render snapshots. No board changes, so step 7 does not run.

## Risks

- **A wrong role.** Each name has the same value as the old one, so the look does not change. Review checks the role of each line against [The mapping](#the-mapping).
- **No check fails a new `stroke-opacity` literal.** `groups.mts` reads only `opacity`. The failure: a later `stroke-opacity` literal passes the checks. The likelihood is low: only `PinFan` uses one. The fix adds `stroke-` to the `opacity` rule and moves the `literals.test.ts` line 197 case to the failing list, about 6 lines. The tech lead decides.
- **#1058 merges first.** If it adds `space-N`, the build moves those lines too.

## Proof

| Acceptance check                                                               | Proven by                                                                                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Each screen passes `design:check` as on `main`                                 | `npm run design:check`                                                                                         |
| No `var(--space-[0-9]` outside `design/canvas/`, `design/source/` and `plans/` | `git grep` in the PR evidence                                                                                  |
| Each `PinFan` `stroke-opacity` uses a `map` opacity, same value                | `git grep stroke-opacity` in the PR evidence; `app/tokens.css` values; `map-pin-fan` screens in `design:check` |
| The checks in AGENTS.md › Commands pass                                        | CI, and the pasted output                                                                                      |
| Steps 2 to 6 are done                                                          | The commits of steps 2 to 5, and the `design` and `gallery` jobs                                               |
| The canvas copy matches `.design-system/project/`                              | The sha256 compare of step 5                                                                                   |

## Out of scope

- The `features/` border widths and the `DateSlider` tick and thumb: SC.8 (#1200).
- Local values with a listed reason: SC.9.1 (#1202).
- The boards move to the new names, and the `space-N` tokens go: SC.11.1 (#1205).
