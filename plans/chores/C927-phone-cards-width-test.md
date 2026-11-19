# Plan: C927: The width-rule test reads the stylesheet of each component card

- **Spec:** #927
- **Status:** approved

## Approach

The width-rule test walks `CONTROLS`, not `app/components/`. For each entry, it reads `<name>.module.css` in the folder of `path`, if that file exists, and applies `WIDTH_RULE`. On `main`, it then names `DateField` and `FuzzyDateField` too. `PHONE_CARDS` gains each card that it names.

## Decisions

**D1 · Cards that share a file with another card** · Decides: Tech lead

`RemovableChip`, `BackLink`, `DialogPanel` and `SheetPanel` are in the files of `Chip`, `PageHeader`, `Dialog` and `Sheet`, whose stylesheets have a width rule. Step 1 of the issue does not see these four cards. `RemovableChip` changes at phone width (`.removable` in `Chip.module.css`).

- **A.** Keep step 1 as the issue says. The PR names the four cards.
- **B.** The test also reads the stylesheet of the file in `path`. The four cards join `PHONE_CARDS`, with four more `-390.png` images. Step 1 of the issue changes.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                                       | New / changed | What                          |
| ---------------------------------------------------------- | ------------- | ----------------------------- |
| `lib/design/__tests__/cards.test.ts`                       | Changed       | The test walks `CONTROLS`     |
| `lib/design/cards.mts`                                     | Changed       | `PHONE_CARDS` and its comment |
| `design/cards/DateField-390.png`, `FuzzyDateField-390.png` | New           | The workflow writes them      |

## Deviations

- D1 B: the test also reads the stylesheet named for the file in `path`. `PHONE_CARDS` gains `RemovableChip`, `BackLink`, `DialogPanel` and `SheetPanel`, with their `-390.png` images from the same workflow run.

## Order of work

1. Change the test. See it fail and name `DateField` and `FuzzyDateField`. Paste the failing line in the PR.
2. Add each card that the test names to `PHONE_CARDS`. The comment gives the count of cards with a width rule, names `Modal`, and says that the test reads the folder of each `CONTROLS` entry.
3. Add a `@media (max-width: 639.98px)` rule to `SearchBar.module.css`. Paste the failure. Remove the rule.
4. The PR names each card whose child card has a width rule. On `main` these are `ChipGroup`, `TokenField`, `DateDock` and `SearchBar`.
5. The tech lead runs Design: Render snapshots on the branch. Then the PR leaves the draft state.

## Risks

- Until step 5, the `gallery` job has no phone image for the new cards. The job skips a draft PR.

## Proof

| Acceptance check                              | Proven by                                     |
| --------------------------------------------- | --------------------------------------------- |
| 1. A new width rule fails `npm test`          | The failure of step 3, pasted in the PR       |
| 2. `PHONE_CARDS` and the two images           | `lib/design/cards.mts`; the workflow's commit |
| 3. The gallery matches; the stray test passes | The `gallery` job and `npm test`, linked      |
| 4. The PR body lists each card and its rule   | The PR body                                   |
| 5. The checks pass                            | The output of each command, pasted in the PR  |

## Out of scope

- A change to a component, a stylesheet or `WIDTH_RULE`.
- A card whose child card has a width rule.
