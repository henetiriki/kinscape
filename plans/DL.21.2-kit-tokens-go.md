# Plan: DL.21.2: The kit tokens go, and the docs stop naming the design kit

- **Spec:** #992
- **Requirement IDs:** [NFR-06](../docs/requirements.md#nfr-06)
- **Status:** approved

## Approach

The build deletes the `kit` family and `breakpoint.desktop-width` from `design/tokens.json`, then runs `npm run tokens`. No stylesheet reads a `--kit-` variable, no media query uses 1279.98px, and no canvas board reads a `--kit-` variable. The rest is words: docs, code comments and test titles, as the Spec and the tables below give them. Two design system inputs change, so the tech lead, or a local session, runs steps 3 to 6 of [Changing the design system](../design/CANVAS.md#changing-the-design-system). No board shows the change, so step 7 does not apply.

## Decisions

**D11 · The label of the `/screens` pattern row** · Decides: Tech lead

Behaviour 6 makes the row "**Living style guide.**" of `docs/architecture.md` name `/screens` only. After DL.21 the design system is the style guide, and `/screens` holds screen states. What is the label?

- **A.** "**Dev screens.**" Cost: one word.
- **B.** "**Living style guide.**" stays. Cost: none.
- **Other:** your own.

**Answer: Other:** [TBC] (@henetiriki)

## Files that change

| File                                                                                                                                                                                                                                   | New / changed | What                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `design/tokens.json`                                                                                                                                                                                                                   | changed       | Behaviour 1. New `space.64` note: "Page padding of ColumnLayout, and the gap above the empty People list." |
| `app/tokens.css`                                                                                                                                                                                                                       | changed       | `npm run tokens`                                                                                           |
| `lib/design/__tests__/design.test.ts`                                                                                                                                                                                                  | changed       | The media query test allows `phone-width` only                                                             |
| `lib/design/__tests__/system.test.ts`                                                                                                                                                                                                  | changed       | The `breakpoint` count is 2. The README sentence of Behaviour 8                                            |
| `design/DESIGN.md`                                                                                                                                                                                                                     | changed       | The table below                                                                                            |
| `design/COMPONENTS.md`                                                                                                                                                                                                                 | changed       | Behaviour 5                                                                                                |
| `docs/glossary.md`                                                                                                                                                                                                                     | changed       | Behaviour 6                                                                                                |
| `docs/architecture.md`                                                                                                                                                                                                                 | changed       | The `/screens` row (D11) and the Layers sentence name `app/screens` only                                   |
| `docs/infrastructure.md`                                                                                                                                                                                                               | changed       | Two rows: "hides the screens", "shows the screens"                                                         |
| `app/components/foundation/Icon.tsx`                                                                                                                                                                                                   | changed       | Behaviour 9                                                                                                |
| The seven dev-page files of Behaviour 7                                                                                                                                                                                                | changed       | "the design kit and screens" becomes "the screens"; `server/dev-pages.mts`: "The built screens: …"         |
| The four files of Behaviour 7 (#992 D10), the five lines of Behaviour 11                                                                                                                                                               | changed       | The words that the Spec gives, and the table below                                                         |
| `app/components/forms/__tests__/TextField.test.tsx`, `foundation/types.ts`, `overlays/Dialog.tsx`, `Dialog.module.css`, `Modal.tsx`, `__tests__/Dialog.test.tsx`, `features/map/components/ZoomControls.tsx`, `lib/design/samples.mts` | changed       | The table below                                                                                            |

**`design/DESIGN.md`** (Behaviour 3, 4 and 8):

| Line on `main`                                | New words                                                  |
| --------------------------------------------- | ---------------------------------------------------------- |
| 133 "`/design-kit/type` shows them."          | "The Text component card shows them."                      |
| 160 The `kit.*` tokens                        | Goes                                                       |
| 221 page rule                                 | "The dev-only `app/screens` is exempt."                    |
| 253 "in [style-4-states.jpg]"                 | "Every control has the five states on its component card." |
| 255 `/design-kit/states` paragraph            | Goes: line 253 names the component cards                   |
| 282 "`/design-kit/feedback` shows it."        | "The DateField component card shows it."                   |
| 302 "`/design-kit/inputs` shows it."          | "The FuzzyDateField component card shows it."              |
| 341 ", and `/design-kit/map-style` builds it" | Goes: no component card shows the map style                |

**Comments and test titles** that the Spec gives no words for. Each says what is true on `main`:

| Line on `main`                                                                         | New words                                                                                          |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `TextField.test.tsx:57` "for the design kit"                                           | "for its component card"                                                                           |
| `types.ts:5` "A state the design kit shows"                                            | "A state that a component card shows"                                                              |
| `Dialog.module.css:55` "the design kit draws it whole"                                 | "a component card draws it whole"                                                                  |
| `Dialog.tsx:20`, `Modal.tsx:55` "Left off in the design kit, where …"                  | "Left off where the panel (head) is only drawn." Component cards pass `onClose`; two boards do not |
| `Dialog.test.tsx:111`, `ZoomControls.tsx:10` "for the design kit"                      | "for its component card"                                                                           |
| `samples.mts:1` "the design kit's boards and the design system's cards both draw them" | "the component cards draw them"                                                                    |
| `NoticeCard.tsx:34`, `NoticeCard.module.css:95` "The kit's phone sample"               | "The phone sample of its component card"                                                           |
| `samples.mts:22` "in the kit and on its card"                                          | "on its component card"                                                                            |

## Order of work

1. Change `design/tokens.json`. Run `npm run tokens`. Change the two tests, and see each fail on `main` values first.
2. Change the docs, the comments and the test titles, as the tables say.
3. Run the search of check 1 and `git diff main -- app/tokens.css` (check 2). Paste both in the PR.
4. Run `npm run design-system` and check 3. Push.
5. The CI build stops here, keeps the PR as a draft and asks in the PR for steps 6 to 8.
6. The tech lead, or a local session that the tech lead starts, runs `/publish-design-system` (3.1 to 3.11), "Updating the install" (4.1 to 4.7; 4.7 can be skipped, as the Spec says) and "Refreshing the canvas copy" (5.1 to 5.5). The session needs a signed-in account.
7. Push. The tech lead runs the workflow Design: Render snapshots on the branch.
8. The PR names each JPG and snapshot that changed, with the reason, and each sentence that went with no new home (DESIGN.md lines 255 and 341).
9. Run each check in `AGENTS.md` › Commands.

## Risks

- **A JPG changes.** No board reads a `--kit-` variable, so I expect none. If a JPG of a board other than `SG-*` or `Kit-*` changes, stop and comment on #893.
- **Merge conflicts.** DL.26 (#964) also edits `design/canvas/project/ds/`. The PR that merges second runs steps 2 to 5 again.

## Proof

| Acceptance check | Proven by                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| 1, 7, 8          | The `git grep -i` output of step 3 in the PR                                                            |
| 2                | The `app/tokens.css` diff in the PR                                                                     |
| 3                | `system.test.ts`; the README search in the PR                                                           |
| 4, 5             | Steps 6 and 7; the sha256 report of step 4.6                                                            |
| 6                | The workflow commit, listed in the PR                                                                   |
| 9                | `npm test`, `npm run typecheck`, `npm run lint`, `npm run words`, `npm run format:check`, `npm run e2e` |

## Out of scope

As the Spec says: the boards, their Screens rows, `NO_ENTRY` and `PHONE_BOARD` (DL.21.3, #993); a new section or card; the `state` prop.

## Deviations

- The CI run could not run `npm run tokens`, so `app/tokens.css` lost the same lines by hand. A local `npm run tokens` makes no diff.
- `system.test.ts` also expects 171 noted tokens, not 172: `desktop-width` had a note.
- D11: the `/screens` row label is the placeholder "**[TBC].**" until the tech lead names the row.
