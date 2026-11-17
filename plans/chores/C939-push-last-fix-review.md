# Plan: C939: Push last in a review fix, and ask first in a local fix

- **Spec:** #939
- **Status:** approved

## Approach

Rewrite "The fix" of `fix-review.md` as the seven steps of #939 and the failed-push rule. The reply stays "Fixed in <sha>.": the commit gives the sha, and a merge keeps it. In `fix-review-local`, replace the three push overrides with the six overrides of #939.

## Decisions

**D1 · Word budget of `fix-review.md`** · Decides: Tech lead

The file is at about 355 of its 360 words. The failed-push rule adds about 40.

- **A.** Raise the budget to 420 in `scripts/word-count.mts` and `scripts/__tests__/word-count.test.ts`.
- **B.** Cut other lines of `fix-review.md` to stay at 360.
- **Other:** your own.

**Answer: Other:** - 450 budget (@henetiriki)

**D2 · The skill's reply on a fixed thread** · Decides: Tech lead

The skill now says "After the push, reply on each thread that you fixed. Say what changed."

- **A.** Keep "Say what changed", and move the reply before the push.
- **B.** Drop the line. The skill replies "Fixed in <sha>." as `fix-review.md` does.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · A merge conflict after a failed push** · Decides: Tech lead

#939 does not say what the fixer does if the merge conflicts.

- **A.** Run `git merge --abort`. Push nothing. Post the comment of a failed second push.
- **B.** Resolve the conflict as `resolve-conflict.md` does.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `.github/agent/fix-review.md`                | Changed       | The seven steps and the failed-push rule                            |
| `.claude/skills/fix-review-local/SKILL.md`   | Changed       | The six overrides; D2                                               |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | The "Fixed after the push" test checks the new order; two new tests |
| `scripts/word-count.mts`, its test           | Changed       | D1: 450                                                             |

## Order of work

1. Change the order test. See it fail on `main`'s text.
2. Add the failed-push and skill tests. See each fail.
3. Edit `fix-review.md` and the skill.
4. Run the checks in `AGENTS.md` › Commands.

## Risks

- Both text files are hand-back paths. The tech lead builds with `/build-local`.
- **Unlikely case:** the second push fails, and the threads stay resolved with no fix on the branch. Two pushes must fail in one run. The comment tells the tech lead. A fix (reopen each thread) adds a step and a test.

## Proof

| Done check                                  | Proven by                            |
| ------------------------------------------- | ------------------------------------ |
| 1: push after reply, resolve, body, comment | `load-agent-files.test.ts`           |
| 2: one merge, one push, then a comment      | `load-agent-files.test.ts`           |
| 3: question before fix in the skill         | `load-agent-files.test.ts`           |
| 4: `npm run words`, `npm test`              | Evidence                             |
| 5, 6: the next CI and local fix             | The tech lead, after the merge       |
| Constraints                                 | Review of the diff: no workflow file |

## Deviations

- D3 widens to each failed merge, not only a conflict: abort, push nothing, post the comment. The tech lead decided this in the local fix of PR #941, after the review found an unlikely case.
- The build skipped the reword step. The tech lead decided that the fix reword #939 for the D3 rule and this widening.
