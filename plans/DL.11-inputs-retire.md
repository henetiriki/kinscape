# Plan: DL.11: Button sizes on its card; the inputs tests move, and /design-kit/inputs goes

- **Spec:** #912
- **Requirement IDs:** [NFR-05](../docs/requirements.md#nfr-05), [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The `Button` card gains `Button · size l`, `Button · size s` and `Button · size xs` after the `Button secondary` states. `react-18.test.tsx` gains the same three cases, because its preview test compares each card with them. The size `m` button in the height test is `Button secondary · default`. The removable chip tests use the × of `RemovableChip · default`, named "Remove Birth".

The four tests go into `gallery-looks.spec.ts` and use `hitsControl`. The phone hit-area test reads each name in `CARDS`, as `design-gallery.spec.ts` does. It checks each visible `button`, `input`, `select`, `a` and `[role="tab"]` that is not disabled or inert. A failure message names the figure caption and the control.

`e2e/inputs.spec.ts` goes whole. Its seven "part N" tests check the parts of the board, so they go with the board, as in #922 item 2. In `e2e/design-kit.spec.ts`, the "Inputs" entry of `BOARD_LINKS` gets `gone: true`. The index and nav tests skip a `gone` path, but they still expect its link.

## Decisions

**D1 · The icon on the three size states** · Decides: Tech lead

Spec item 1 says "a secondary button with the text 'Copy chain'". `Button secondary` shows the `copy` icon. `ICON_SIZE` in `Button.tsx` gives each size its own icon size.

- **A.** Each size state has `icon: 'copy'`. The card shows the icon at each size.
- **B.** No icon. The card shows the text only.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Who builds** · Decides: Tech lead

The Spec says that the tech lead, or a local session, builds it. The [design-system rule](README.md#design-system) lets the CI build agent build the code. The agent then asks in the PR for steps 3 to 5 and keeps the PR as a draft.

- **A.** The CI build agent builds steps 1 to 6 of Order of work. The tech lead, or a local session that the tech lead starts, runs steps 7 and 8.
- **B.** The tech lead, or a local session, builds all of it. The CI agent does not build.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                         | New / changed | What                                                                                                                     |
| -------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `lib/design/states.mts`                                                                      | changed       | Three `Button` states (D1); raise `height` if the gallery file needs it                                                  |
| `lib/design/__tests__/react-18.test.tsx`                                                     | changed       | The same three cases                                                                                                     |
| `e2e/gallery-looks.spec.ts`                                                                  | changed       | The four tests of the table                                                                                              |
| `e2e/inputs.spec.ts`                                                                         | deleted       | Item 6.2                                                                                                                 |
| `app/design-kit/inputs/{page,pageParts,people,rows,sections}.tsx`, `__tests__/page.test.tsx` | deleted       | Item 6.1                                                                                                                 |
| `app/design-kit/inputs/Board.tsx`                                                            | changed       | Delete `phoneLead`, `phoneHint`, `note`, `LINK_COLUMNS` and `code`, and each other branch that coverage names (item 6.9) |
| `app/design-kit/inputs/page.module.css`                                                      | changed       | Line 1 names no route                                                                                                    |
| `design/screens.json`                                                                        | changed       | Delete the seven `/design-kit/inputs` entries                                                                            |
| `lib/design/__tests__/screens.test.ts`                                                       | changed       | `NO_ENTRY` gains the seven `style-6-components-inputs*` names                                                            |
| `e2e/design-kit.spec.ts`                                                                     | changed       | `gone` flag, the two phone loops lose `inputs`, a 404 test                                                               |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`                                        | changed       | Design system steps only                                                                                                 |
| `design/cards/Button-1440.png`                                                               | changed       | The workflow commits it                                                                                                  |

## Order of work

1. Add the three states and cases (D1). Run `npm run design:gallery`.
2. Add the four gallery tests. If a card fails the phone hit-area test, follow the Spec's concern: list the card with a reason, and file a Bug.
3. Delete the board files, `e2e/inputs.spec.ts` and the seven entries. Add the seven names to `NO_ENTRY`.
4. Change `e2e/design-kit.spec.ts` and line 1 of `page.module.css`.
5. Delete the dead code of `Board.tsx`. Run `npm test` and delete each branch that coverage names.
6. Check that #914, #915, #917, #918 and #922 name the retirement steps of DL.11. On 2026-11-17 each does, so no reword is necessary. Run the checks in `AGENTS.md`, and push.
7. The tech lead, or a local session that the tech lead starts, runs steps 2 to 5 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). The session needs a signed-in account. No board shows the change, so step 7 does not apply.
8. The tech lead runs the workflow Design: Render snapshots. It commits `design/cards/Button-1440.png`.

## Risks

- The phone hit-area test reads about 60 cards. A fixed bar or a scrim in a card can cover a point 21px from a control. The build reads each failure in the gallery file before it files a Bug.
- The first retirement can meet a check that needs a screen entry for each canvas board. Then stop and comment on #893.

## Proof

| Acceptance check | Proven by                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 2, 3          | `npm run design:gallery`; for 3, a local run without the `::before` of size `xs` fails and names the card, and the PR pastes that line |
| 4                | `git grep -n design-kit/inputs -- app e2e lib design/screens.json` in the PR                                                           |
| 5                | The 404 test in `e2e/design-kit.spec.ts`                                                                                               |
| 6                | `npm run design:check`                                                                                                                 |
| 7, 8             | The step 7 report in the PR; the sha256 compare of step 4.6                                                                            |
| 9                | `git diff main --stat` in the PR                                                                                                       |
| 10               | The check output in the PR                                                                                                             |
| 11               | `Board.tsx` in the diff                                                                                                                |

## Deviations

- The phone hit-area test measures the label of a radio, because the radio is hidden.
- Nine cards fail the phone hit-area test. `UNDER_44` in `e2e/gallery-looks.spec.ts` lists each with its Bug: #943 to #951.
- The Spec says "text" and D1 adds the `copy` icon, so the local build reworded item 1 of #912 (#942 plan D1).

## Out of scope

- The `.matrixNote` rules of `page.module.css`, which no code uses after this Spec: DL.21 (#929) deletes the file.
