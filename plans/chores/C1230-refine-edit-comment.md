# Plan: C1230: /refine posts a comment after it edits a filed issue

- **Spec:** #1230
- **Requirement IDs:** None: the Chore changes the `/refine` skill text only.
- **Status:** approved

## Approach

Add a new Write step 4 to `filing.md` › _Editing a filed issue_, after the body edit of step 3. The step posts one comment that lists the changed boxes and decisions. Step 2 shows the comment text under "Edit #<n> now?". Step 5 (the old step 4) holds both failure rules. The new step moves the failure step to 5, the links step to 6 and the labels step to 7. Thus "Write steps 2 to 5" in `slice-intent.md` covers the question, the edit, the comment and the failure rules, as acceptance check 3 says. The build updates each reference to a moved step number. `bug.md` replaces only the rule for a failed body edit. So a Bug whose comment fails gets the shared rule and does not print its four sections again. New text assertions in `refine-skill.test.ts` prove each check.

## Decisions

**D1 · The first line of the comment** · Decides: Tech lead

The Chore names the list and the last line of the comment, but not its first line. The comment on #1230 from 25 November starts "The body changed:". Which first line does the comment get?

- **A.** The line "The body changed:", then the list. This costs four words in `filing.md`.
- **B.** No first line. The list starts the comment. This adds no words.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                     | New / changed | What                                                                                                                                                                                                                                               |
| ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/refine/filing.md`        | changed       | Write step 2 shows the comment and says that one yes covers it. New step 4 posts the comment. Step 5 holds the two failure rules. The pasted-body rule above _Read_ skips Write steps 1 to 4, 6 and 7, and prints the comment text under the body. |
| `.claude/skills/refine/slice-intent.md`  | changed       | _Hand-over_: to replace a Spec's body, follow Write steps 2 to 5 of [Editing a filed issue](../../.claude/skills/refine/filing.md#editing-a-filed-issue).                                                                                          |
| `.claude/skills/refine/bug.md`           | changed       | _Hand-over_: the rule for a failed `gh` also prints the comment text under the four sections. It replaces the first rule of Write step 5, in place of "Write step 4".                                                                              |
| `scripts/word-count.mts`                 | changed       | Raise the `filing.md` and `slice-intent.md` budgets by no more than the words that each file gains.                                                                                                                                                |
| `scripts/__tests__/refine-skill.test.ts` | changed       | New assertions on the text of `filing.md`, `slice-intent.md` and `bug.md`.                                                                                                                                                                         |

## Order of work

1. Write the failing assertions in `refine-skill.test.ts`. Each reads the text of one section only.
2. Edit `filing.md`: steps 2, 4 and 5, and the step numbers in the pasted-body rule.
3. Edit the _Hand-over_ sections of `slice-intent.md` and `bug.md`.
4. Run `git grep -n "Write step"` and fix each moved step number outside `plans/`.
5. Count the words that `filing.md` and `slice-intent.md` gain against `main`. Raise each budget by that count or less.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- A step number that moves can leave a stale reference in another skill file. Step 4 of _Order of work_ finds each one. The test asserts the numbers in `bug.md` and `slice-intent.md`.
- The budget rise can exceed the words that the change adds. Step 5 counts against `main`, and the PR body gives each count.

## Proof

| Acceptance check                                                                                                        | Proven by                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. After a yes and a good body edit, the skill posts one comment with the changed boxes, the decisions and the end line | `refine-skill.test.ts`: Write step 4 contains `gh issue comment <n> --body-file`, "each decision" and "No other box changed."                            |
| 2. "Edit #<n> now?" names the comment and shows its text                                                                | `refine-skill.test.ts`: Write step 2 names the comment and says to show its text                                                                         |
| 3. `/refine intent <n>` follows Write steps 2 to 5 for a replaced Spec                                                  | `refine-skill.test.ts`: `slice-intent.md` › _Hand-over_ contains "Write steps 2 to 5" and the link to `filing.md#editing-a-filed-issue`                  |
| 4. A failed body edit posts no comment and prints the body and the comment text                                         | `refine-skill.test.ts`: Write step 5 contains "post no comment" and says to print the comment text                                                       |
| 5. A failed comment gives the reason and prints the comment text                                                        | `refine-skill.test.ts`: Write step 5 has the rule for a failed comment                                                                                   |
| 6. After a `gh` failure and a pasted body, the skill prints the comment text under the body                             | `refine-skill.test.ts`: the pasted-body rule says to print the comment text under the body; `bug.md` › _Hand-over_ says the same under the four sections |
| 7. `npm run words` passes, and each budget grows by no more than the added words                                        | `npm run words` output, and the word count of each file on `main` and on the branch in the PR body                                                       |
| 8. The checks in `AGENTS.md` › Commands pass                                                                            | The output of each check in the PR body                                                                                                                  |

## Out of scope

- A comment after `/refine` files a new issue. The Chore covers an edit only.
- A change to `spec.md` or `chore.md`. Each links to _Write_ and gets the new step from it.

## Deviations

- The `slice-intent.md` link is `filing.md#editing-a-filed-issue`, a relative link that works from that folder.
- Write step 4 starts "If the edit worked,", so a failed edit posts no comment.
