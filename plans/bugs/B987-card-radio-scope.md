# Plan: B987: Card states share one radio group, so a gallery file shows one selected segment

- **Spec:** #987 (Bug)
- **Requirement IDs:** None. This Bug changes the design system cards and no screen.
- **Status:** approved

## Approach

`Card` in `lib/design/types.ts` gets an optional field `radios`. `states.mts` sets it on `Segmented` and `DateDock`. For a card with `radios`, `previewHtml` in `lib/design/cards.mts` puts each case `figure` in a `form` with the class `ks-scope`. Radios with one name form one group only in one form, so each case shows its own selected segment.

`STYLE` gets `.ks-scope { display: contents; }` for such a card. Each `figure` then stays a flex item of `#root`, and `.ks-case > :last-child` still finds the control. The `form` has an `onSubmit` that calls `preventDefault`, so a submit button or Enter in a field does not reload the card. `Segmented`, `DateDock` and the other cards do not change.

On `main`, `Segmented-1440.png` shows no selected segment in its default state. `DateDock-1440.png` shows no selected Year and no selected 5 in its first two states. The Bug reproduces.

## Decisions

**D1 · Which cases get a form** · Decides: Tech lead

Only `Segmented` renders a radio, and only the `Segmented` and `DateDock` cards hold one. `SearchBar` renders its own `form`, so a form around its cases nests one form in another. React warns, and the HTML is invalid.

- ~~**A.** Put each case of each card in a form. All 64 `preview.html` files change. `SearchBar` needs an exception.~~
- **B.** Add a `Card` field `radios`, and set it on the two cards in `states.mts`. `previewHtml` adds a form only for those cards. Two `preview.html` files change. Cost: one type field, two state lines and one more unit test.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · Who publishes the changed previews** · Decides: Tech lead

[Changing the design system](../../design/CANVAS.md#changing-the-design-system) does not list `lib/design/cards.mts`. But `/publish-design-system` sends each `preview.html`, and `design/canvas/project/ds/kinscape/components/<name>/preview.html` holds a copy.

- **A.** Treat the change as a design system change. The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 6. Step 7 does not apply. The PR stays a draft until then, and says `Closes #987`.
- **B.** This PR ships the code, the tests and the two card images (step 6). A follow-up Chore runs steps 3 to 5. Until then, the published cards and the canvas copy show the fault. The PR says `Refs #987`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- **A unique `name` for each `Segmented` state** in `states.mts`. `DateDock` sets the fixed names `precision` and `speed`, so this fixes only one card.
- **A form around the control, in the `figure`.** `.ks-case > :last-child` would then find the form, so the `ColumnLayout` frame height would not reach the control.

## Files that change

| File                                                   | New / changed | What                                                                                                                              |
| ------------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `lib/design/types.ts`                                  | changed       | `Card` gets the field `radios`                                                                                                    |
| `lib/design/states.mts`                                | changed       | `Segmented` and `DateDock` set `radios`                                                                                           |
| `lib/design/cards.mts`                                 | changed       | `previewHtml` puts each case of a `radios` card in a `form`, and its `STYLE` gets the `.ks-scope` rule                            |
| `lib/design/__tests__/cards.test.ts`                   | changed       | A `radios` preview has the form, its `onSubmit` and the `.ks-scope` rule. Another preview has none. Only the two cards set it     |
| `lib/design/__tests__/react-18.test.tsx`               | changed       | "preview mounts every state": each `radiogroup` holds one checked radio, and a `submit` event is cancelled                        |
| `e2e/gallery-looks.spec.ts`                            | changed       | The Tab test counts a radio group by its form and its name. Its comment no longer says that the `Segmented` cases share one group |
| `design/cards/Segmented-1440.png`, `DateDock-1440.png` | changed       | The workflow writes them (step 6)                                                                                                 |
| `design/canvas/project/ds/`, `canvas.json`, `VERSION`  | changed       | Design system steps 4 and 5 (D2 A)                                                                                                |

## Order of work

1. Change the unit tests. See them fail: no form in a `radios` preview, and no checked radio in the default `Segmented` case.
2. Change `types.ts`, `states.mts` and `cards.mts`. Run the unit tests again.
3. Change the Tab test in `e2e/gallery-looks.spec.ts`. Run `npm run design:gallery`.
4. Run the checks in `AGENTS.md` › Commands, and `npm run design:check`.
5. Design system steps 2 to 6 (D2). The build runs step 2 and pushes. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 6. The session needs a signed-in account.

## Risks

- **Card images.** The `gallery` job fails on `Segmented` and `DateDock` until the workflow commits their images. If another card image changes, the form changed a layout. Then the build stops for the tech lead.
- **Tab order.** Four enabled `Segmented` cases become four tab stops. The Tab test counts them, so it fails if the browser still sees one group.
- **A new radio card.** A card with a radio and no `radios` field shows one selected segment again. The "preview mounts every state" test fails for it, and for a `radios` field on a card with no radio.

## Proof

| What did you expect?                          | Proven by                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Each card state has its own radio scope       | `react-18.test.tsx` "preview mounts every state"; the `gallery-looks.spec.ts` Tab test          |
| Each card image that holds a radio can change | `Segmented-1440.png` and `DateDock-1440.png` from the workflow show a selected segment per case |
| A submit in a card does not reload it         | `react-18.test.tsx`: the `submit` event is cancelled                                            |
| No other card image changes                   | The `gallery` job (`e2e/design-gallery.spec.ts`)                                                |

## Out of scope

- A `lib/design/cards.mts` line in the "When" list of Changing the design system.
- The `DateDock` controls under 44px (#988).

## Deviations

- The tech lead asked for a guard. `react-18.test.tsx` now fails if a card mounts a radio and has no `radios` field, or the reverse.
- "Design: Render snapshots" changed no card image. A selected segment differs from an unselected one by less than the screenshot colour threshold, so `Segmented-1440.png` and `DateDock-1440.png` stay as on `main`. The tech lead left them as they are.
