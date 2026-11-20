# Plan: DL.29: The design loop steps match what main does

- **Spec:** #979
- **Requirement IDs:** None. The Spec changes docs, one skill description and two word budgets.
- **Status:** approved

## Approach

Edit the text of `design/CANVAS.md`, `design/COMPONENTS.md`, `docs/code-rules.md` and one skill description, item by item as the Spec lists them. Change no heading, so the anchors that `scripts/__tests__/load-agent-files.test.ts` pins stay. Then raise the two word budgets to the next multiple of 50 that holds the new text. Change their pins. This Spec is a hand-back ([hand-back rule](README.md#hand-back)): the tech lead, or a local session that the tech lead starts, builds it.

## Files that change

| File                                            | New / changed | What                                                                                                                                                                                                                                                                              |
| ----------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design/CANVAS.md`                              | changed       | Items 1, 2, 3, 4 to 7, 8 and 9. Step 4.7 goes. The order list and the paste prompt say "4.1 to 4.6". Steps 6 and 7 get the new text. The 5.x lead paragraph names its two cases, and 5.5 names the workflow, not step 7. The gallery check joins "Making the snapshots and JPGs". |
| `design/COMPONENTS.md`                          | changed       | Items 10 and 11: the three swap rules above the board swap prompt, and the new prompt.                                                                                                                                                                                            |
| `docs/code-rules.md`                            | changed       | Item 12: four lines under "Test quality".                                                                                                                                                                                                                                         |
| `.claude/skills/publish-design-system/SKILL.md` | changed       | Item 3: the description names `lib/design/cards.mts` and `lib/design/samples.mts`.                                                                                                                                                                                                |
| `scripts/word-count.mts`                        | changed       | Item 13: the budgets of `design/CANVAS.md` and `docs/code-rules.md`.                                                                                                                                                                                                              |
| `scripts/__tests__/word-count.test.ts`          | changed       | Item 13: the two pins follow.                                                                                                                                                                                                                                                     |
| `plans/DL.29-design-loop-steps.md`              | new           | This plan.                                                                                                                                                                                                                                                                        |

## Order of work

1. `design/CANVAS.md`, "Changing the design system":
   - Add the two files to **When**.
   - Add the merge rule to **Where**.
   - Change the order list for items 1 and 4 to 6.
   - Change **Issue text** for item 2.
2. `design/CANVAS.md`, "Updating the install": delete 4.7. Change the paste prompt to "4.1 to 4.6".
3. `design/CANVAS.md`, "Refreshing the canvas copy": name the two cases in the lead paragraph. In 5.5, the workflow renders the snapshots.
4. `design/CANVAS.md`, "Making the snapshots and JPGs": add the gallery check of item 8 to the card-image paragraph.
5. `design/COMPONENTS.md`: add the three swap rules, then the new prompt. The prompt does these things:
   - It starts from `design/canvas/project/`.
   - It asks that `npm run design:export` passes.
   - It asks for no pixel compare.
6. `docs/code-rules.md`: add the four lines of item 12.
7. The skill description: add the two files, in the order of the **When** list.
8. Run `npm run words`. Raise each budget to the next multiple of 50 that holds the file. Change its pin.
9. Run the checks in `AGENTS.md` › Commands.

No step changes a design system input, so the steps of [Changing the design system](../design/CANVAS.md#changing-the-design-system) do not run.

## Risks

- **"2 to 7" includes step 6.** Item 2 says that the first done check lists "2 to 7" if a board shows the change. Item 5 says that step 6 then does not run. Step 6 states its own condition ("if no board shows the change"), so the plan keeps the words of acceptance check 2.
- **The budget of `design/COMPONENTS.md`.** The Spec raises no budget for it. Its count is well under 600, so the new text fits. If `npm run words` fails on it, stop for the tech lead: acceptance check 12 holds no budget change for it.

## Proof

| Acceptance check | Proven by                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| 1                | `git grep -n -F "4.7" design/CANVAS.md` finds no line; read the order list and the prompt                     |
| 2, 4, 5, 8       | Read "Changing the design system"                                                                             |
| 3                | `git grep -n -F "lib/design/samples.mts"` on `design/CANVAS.md` and the skill                                 |
| 6                | Read the lead paragraph of "Refreshing the canvas copy"                                                       |
| 7                | Read "Making the snapshots and JPGs"                                                                          |
| 9                | Read `design/COMPONENTS.md`; `git grep -n -F "the pixels match" design/COMPONENTS.md` finds no line           |
| 10               | Read "Test quality"                                                                                           |
| 11               | `npm run words`, `npm test`, `npm run lint` and `npm run format:check` pass; `load-agent-files.test.ts` holds |
| 12               | `git diff --name-only origin/main` lists only the seven files above                                           |

## Out of scope

The Spec's "Out of scope / carried forward" list holds.

## Deviations

- The **Where** line of `design/CANVAS.md` also changes: "The refresh and the workflow in steps 6 and 7 each commit" becomes "The refresh in step 5, the session in step 7 and the workflow each commit". The new step 7 does not run the refresh, so the old text was wrong. The review found it (f8b9a61a).
- The budget of `docs/code-rules.md` is 450, and its pin follows. `countWords` gives 381 words on `main` and 437 on this branch (`wc -w`: 410 and 470). 437 is over 400, so 450 is the next multiple of 50 that holds the file (a6e6d5fc).
