# Plan: C1095: One drawing brief in CANVAS.md replaces the prompt of each Spec

- **Chore:** #1095
- **Status:** draft

## Approach

Rewrite `design/CANVAS.md` › Drawing a board as one standing brief in three parts: the rules for the drawing, the records of a new board, and a link to step 7 of Changing the design system. The heading stays, so each other heading and anchor of the file stays as it is. The exporter rules come from `scripts/design-export.mts`. If a rule of the #539 prompt differs from the code, the code wins. Then rewrite the body of #539 with one `gh issue edit` call. Last, set the budget of `design/CANVAS.md` to the next multiple of 50 above its new count, and change its pin.

## Decisions

**D1 · The "Not designed yet" line** · Decides: Tech lead

Step 3 of the "After the canvas" steps of #539 changes the line about the screens that add pins in `design/DESIGN.md` › Not designed yet. The Chore removes those steps, and its list of records has no such item.

- **A.** The records of the brief get one more item: if a board designs a screen under Not designed yet, change that line. Cost: about 20 words in `design/CANVAS.md`.
- **B.** The new Behaviour line of #539 also names the change. Cost: #539 gets a longer line, and each later design Spec writes it again.
- **C.** Drop it. Cost: the line stays stale after #539 merges.
- **Other:** your own.

Recommended: A, because each design Spec draws a screen from that list.

**D2 · Where the session draws** · Decides: Tech lead

The #539 prompt draws on the canvas and edits no repo file. Its step 1 then runs [Refreshing the canvas copy](../../design/CANVAS.md#refreshing-the-canvas-copy) (5.1 to 5.5). Item 3 of the Chore links step 7, which edits the repo copy first and then publishes.

- **A.** The brief draws each board in the repo copy, `design/canvas/project/`, and publishes as step 7 says. No refresh runs. Cost: the session of #539 needs the repo on its branch, with write access.
- **B.** The brief draws on the canvas, then runs steps 5.1 to 5.5. It links step 7 only for an edit to a board that exists. Cost: the brief does not match item 3, and the export runs after the canvas changes.
- **Other:** your own.

Recommended: A, because step 7 runs the export before it publishes, so a board that fails the export never reaches the canvas.

**D3 · Two rules of the #539 prompt** · Decides: Tech lead

The #539 prompt puts each screen board on the canvas page of its screen ("the same canvas page as Add-pin.dc.html"). It also says "Change no other board." The list of the Chore for the brief has neither.

- **A.** The brief gets both. The `canvas.json` entry names the page of the other boards of the screen, or Drafts. The session edits no board that the Spec does not list. Cost: about 30 words.
- **B.** Leave both out. The Acceptance check of #539 on unchanged snapshots covers the second. Cost: the session picks the canvas page.
- **Other:** your own.

Recommended: A, because the brief then holds each standing rule of the prompt.

**D4 · Lines of #539 that name the prompt** · Decides: Tech lead

After the edit, two lines of #539 name a prompt that is gone. Flagged concerns says "A signed-in person runs the prompt." The answer of D12 says "Behaviour, the prompt, "After the canvas" and the Acceptance checks name the boards".

- **A.** Change the Flagged concerns line to "A signed-in person draws the boards." Keep the D12 answer as the record of the answer. Cost: one more line of #539 changes.
- **B.** Change only what item 4 of the Chore names. Cost: Flagged concerns names a missing prompt.
- **Other:** your own.

Recommended: A, because a reader of #539 then finds no step that does not exist.

## Alternatives considered

- A template in the `refine` skill that writes the prompt: `.claude/skills/**` is a hand-back path, and each Spec still repeats the facts.

## Files that change

| File                                   | New / changed | What                                                                      |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------- |
| `design/CANVAS.md`                     | changed       | Drawing a board: the rules for the drawing, the records, the step 7 link  |
| `scripts/word-count.mts`               | changed       | The budget of `design/CANVAS.md`: the next multiple of 50 above its count |
| `scripts/__tests__/word-count.test.ts` | changed       | The pin of that budget                                                    |
| `plans/chores/C1095-drawing-brief.md`  | new           | This plan                                                                 |

The body of #539 also changes.

## Order of work

1. Compare the six rules of the #539 prompt with `scripts/design-export.mts`. Write each rule as the code checks it.
2. Rewrite Drawing a board, as items 1 to 3 of the Chore and the answers say. Keep each other heading.
3. Run `npm run words`. Set the budget to the next multiple of 50 above the count of `design/CANVAS.md`. Change the pin.
4. Read the body of #539 with `gh issue view 539 --json body`. Rewrite it with one `gh issue edit 539 --body-file -` call:
   - Remove the prompt paragraph and its code block.
   - Remove "After the canvas" and its six steps.
   - Add one Behaviour line: draw and register the boards as [Drawing a board](../../design/CANVAS.md#drawing-a-board) says.
   - Keep the board list, the Acceptance checks and the Decisions.
5. Read #539 again and compare it with step 4.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- The exporter has no check for `<sc-for>` inside a table. The HTML parser moves the element out of the table. The build keeps the rule and names the parser as its reason.
- One body edit can drop text of #539. Step 5 reads the body back. If a part is missing, the build edits again from the body of step 4.

## Proof

| Acceptance check                                                                                        | Proven by                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Drawing a board lists the six exporter rules and names `scripts/design-export.mts`                      | Review of the diff                                      |
| It says to mount `MapLayout`, read a README, use the system, draw on Drafts, and what the PR body lists | Review of the diff                                      |
| It lists the records of a new board, with the README check, and links step 7                            | Review of the diff                                      |
| #539 holds no prompt and no "After the canvas", and its Behaviour points to Drawing a board             | `gh issue view 539` after step 5                        |
| `npm run words` and `npm test` pass, and the budget is the next multiple of 50                          | `npm run words`, `scripts/__tests__/word-count.test.ts` |

## Out of scope

- Skills, #860, each board and each design system input.

## Deviations
