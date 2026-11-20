# Plan: C1093: Carry the notes of a draft board into the Components text

- **Chore:** #1093
- **Requirement IDs:** None. The Chore changes a process doc.
- **Status:** approved

## Approach

Edit steps 2 and 4 of "A component that is not built" in `design/COMPONENTS.md`, and nothing else. Step 2 gets two sentences after the `PHONE_CARDS` sentence, so "Add it to `CONTROLS`" still names the component. Step 4 replaces "Then delete the draft board." and keeps the link to the deletion rule.

These differ from the words of the issue, because the [writing rules](../../docs/writing.md#ste) apply to each line that the change edits:

- "shows or states" becomes "shows or says": the same sentence uses "state" as a noun (STE rule 4).
- The step 4 condition goes before its instruction (STE rule 13).

The text names `design/DESIGN.md` in a code span and does not link to it. `DESIGN.md` links to `CANVAS.md`, and `CANVAS.md` links to `COMPONENTS.md`. A link makes a cycle that `scripts/__tests__/doc-links.test.ts` rejects.

The new text of step 2, after its last sentence:

> Write its Components text in `design/DESIGN.md` from the notes of the draft board. A note is each size, rule, offset, state and accessible name that the board shows or says.

The new text of step 4:

> Swap it into each screen board that shows it. Then, when each note of the draft board is in the Components text, in a card state or in the code, delete the board. {D1 sentence} Follow [the deletion rule](CANVAS.md#who-deletes-a-generated-file).

## Decisions

**D1 · The last sentence of step 4** · Decides: Tech lead

The issue adds "The code needs no second copy of a value that it holds." A reader can take it as a rule for the code. It means that the Components text does not repeat a value that the code holds. No related issue holds a value for this text.

- **A.** Keep the sentence of the issue word for word.
- **B.** Write "A note that the code holds needs no second copy in the Components text." The meaning stays.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · Step 2 for a built component** · Decides: Tech lead

"A built component" runs step 2 and draws no draft board. The new text names the notes of the draft board, as "Build the component from that board" already does. The issue says to change no other step. No related issue holds a value for this text.

- **A.** Add the text as above. A built component reads it as it reads "from that board" today.
- **B.** Start the new text with "If there is a draft board,". "A built component" then has no rule for its Components text.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                    |
| ----------------------------------------- | ------------- | ------------------------------------------------------- |
| `design/COMPONENTS.md`                    | changed       | Steps 2 and 4 of "A component that is not built", by D1 |
| `plans/chores/C1093-draft-board-notes.md` | new           | This plan                                               |

## Order of work

1. Edit step 2, then step 4, of `design/COMPONENTS.md`, by D1 and D2.
2. Run the checks in [Commands](../../AGENTS.md#commands).

`design/COMPONENTS.md` is not a [design system input](../../design/CANVAS.md#changing-the-design-system), so no design system step runs. It is not a hand-back path.

## Risks

- **Word budget.** `design/COMPONENTS.md` has 392 of its 600 words. The edit adds about 55.
- **#862 and #863.** Each deletes two draft boards. With this Chore, each build first writes the notes of its boards in the Components text. Neither issue names a value for that text. The Constraints keep both issues unedited.

## Proof

| Acceptance check                                                                                 | Proven by                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Step 2 says to write the Components text from the notes, and says what a note is                 | The diff of `design/COMPONENTS.md`                            |
| Step 4 says to delete a draft board only when each note is in the text, a card state or the code | The diff of `design/COMPONENTS.md`                            |
| Each heading and linked anchor is unchanged, and `npm test` passes                               | No heading line in the diff; `npm test` (`doc-links.test.ts`) |
| `npm run words` passes                                                                           | `npm run words`                                               |

## Out of scope

- A rule for the Components text of a built component (D2).
- An edit to #862 or #863.
