# Plan: DL.12: Layout, breakpoint and z tokens in the design system

- **Spec:** #913
- **Requirement IDs:** None. This Spec changes the content of the design system only.
- **Status:** approved

## Approach

`design/tokens.json` loses `layout.dialog-top`, because no code reads it (D1). It gets 45 notes: 39 `layout`, 3 `breakpoint` and 3 `z`. `noteProblems` adds the three groups to `GROUPS`. So the test in `design.test.ts` fails for each of these tokens with no note.

`systemTokens` writes `layout`, `breakpoint` and `z` as token lists, like `size`. These lists take resolved values. The format rules (`lib/design/format.mts`) allow an alias only in `color`. Thus `layout-menu-offset` is `8px`, not `{space-8}`, and so are `layout-sign-in-pane-y` and `layout-sign-in-pane-x`. `README_SECTIONS` gets "Layout" after "Colours".

Each note names the component or screen that uses the token, from a `git grep` of `var(--<token>)` and of `layout[…]` in `features/map/components/Stage.tsx`. The PR body lists each note with that file.

## Decisions

**D2 · The three families in the design system's `tokens.css`** · Decides: Tech lead

`systemCss` writes `tokens.css`, "what the type would compile from `tokens.json`". Today its `:root` holds `spacing`, `radius`, `size` and `focus`. The Spec does not say if `layout`, `breakpoint` and `z` go in it. No related issue holds a value for this.

- **A.** `systemCss` writes the three families in `:root`, after `focus`. `tokens.css` then matches `tokens.json` as the type would compile it.
- **B.** `tokens.css` does not change. It then lacks three families that `tokens.json` has.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                  | New / changed | What                                                                                                                                                                                                         |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/tokens.json`                  | changed       | `layout.dialog-top` goes (D1). `notes` gains `layout`, `breakpoint` and `z`: 45 notes.                                                                                                                       |
| `app/tokens.css`                      | changed       | `npm run tokens` deletes `--layout-dialog-top: 120px;`.                                                                                                                                                      |
| `lib/design/notes.mts`                | changed       | `GROUPS` gains `layout`, `breakpoint` and `z`.                                                                                                                                                               |
| `lib/design/system.mts`               | changed       | `README_SECTIONS` gains "Layout". `systemTokens` writes the three families from `resolveTokens`. `systemCss` writes them (D2 A).                                                                             |
| `lib/design/types.ts`                 | changed       | `SystemTokens` gains `layout`, `breakpoint` and `z`, each `{ tokens: SystemToken[] }`.                                                                                                                       |
| `lib/design/__tests__/notes.test.ts`  | changed       | The fixture gains a `breakpoint` and a `z` token, and notes for them and `layout.dock-left`. "Stays out of the design system" loses its `layout` note. The count of 14 rises. New tests: Acceptance check 4. |
| `lib/design/__tests__/system.test.ts` | changed       | `all()` and the expected groups gain the three families; the count 126 becomes 171. The README test expects "## Layout". New tests: Acceptance check 1, and D2.                                              |
| `plans/DL.12-layout-tokens.md`        | New           | This plan                                                                                                                                                                                                    |

## Order of work

1. Change the tests in `notes.test.ts` and `system.test.ts`. See them fail on the missing note and on the missing family ([test-first rule](README.md#test-first)).
2. Change `types.ts`, `notes.mts` and `system.mts`.
3. Delete `layout.dialog-top` from `design/tokens.json`. Write the 45 notes. Run `npm test` until `design.test.ts` › "has a note for every token" passes.
4. Run `npm run tokens`. In `git diff app/tokens.css`, the only change must be the removal of `--layout-dialog-top: 120px;`.
5. Run the checks in `AGENTS.md` › Commands.
6. Run the steps of [Changing the design system](../design/CANVAS.md#changing-the-design-system):
   1. Run `npm run design-system`.
   2. Run `/publish-design-system` (steps 3.1 to 3.11).
   3. Run "Updating the install" (4.1 to 4.7).
   4. Run "Refreshing the canvas copy" (5.1 to 5.5).

   No board changes, so steps 6 and 7 do not apply. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 2 to 4. The session needs a signed-in account. The CI build agent asks for them in the PR and keeps the PR as a draft ([design-system rule](README.md#design-system)).

## Risks

- `noteProblems` rejects a note that holds its token's value. A `z` note thus holds no "1" or "5", and a note for `breakpoint.phone-width` holds no "639.98px". The test of step 3 catches each.
- Only the design kit boards use `breakpoint.desktop-width`. Its note names them. DL.21 (#929) deletes the kit, so that Spec must change the note.
- DL.6 (#899) adds `layout.list-width`. If DL.6 merges first, the `layout` count is 40, and the build changes the count in `system.test.ts`. Acceptance check 1 then needs a reword by the tech lead.
- The Design System type may show a `layout`, `breakpoint` or `z` family empty, or may not read a unitless `z` value. Step 6.2 checks the page. If a family shows empty, the build stops and comments on #893 (Spec concern).
- D1 says `Dialog.module.css` centres a dialog with `align-self: center`. That rule centres the sheet handle. The browser centres a modal dialog. D1 still holds: no code reads `layout.dialog-top`.
- `design/canvas/project/ds/kinscape/components/bundle.css` holds `--layout-dialog-top`. Step 6.4 refreshes that copy, and Acceptance check 7 proves it.

## Proof

| Acceptance check | Proven by                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1                | `system.test.ts`: `system.layout.tokens`, `breakpoint` and `z` have 39, 3 and 3 tokens, each with a name, a value and a usage. |
| 2                | `system.test.ts` › "passes the format rules": `formatProblems` checks each name and each repeated name.                        |
| 3                | `system.test.ts` › `readme`: the headings in `README_SECTIONS` order, and no link into the repo.                               |
| 4                | `notes.test.ts`: a fixture `layout`, `breakpoint` or `z` token with no note gives one message that names it.                   |
| 5                | Order of work step 4. The PR pastes the `git diff app/tokens.css` output.                                                      |
| 6                | Order of work step 6. The PR lists each step and who ran it.                                                                   |
| 7                | Step 4.6 of "Updating the install" and step 5.2: the PR pastes the sha256 report.                                              |
| 8                | The tech lead opens the published design system.                                                                               |
| 9                | The PR pastes the output of the checks in `AGENTS.md` › Commands.                                                              |

## Out of scope

- The motion rules: DL.17 (#918).
- The `kit` tokens: DL.21 (#929).
- `layout.list-width` and its note: DL.6 (#899).

## Deviations

- `lib/design/__tests__/format.test.ts` also changed: its fixture gains the three families, and the family count 17 becomes 20.
