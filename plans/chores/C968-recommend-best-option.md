# Plan: C968: Recommend the option that is best at equal cost

- **Spec:** #968
- **Status:** draft

## Approach

Add the four-line "**The recommendation.**" text to "Decisions" in `docs/how-we-work.md`, between the format block and the **Blocking** paragraph. Copy the text from the Chore word for word. Add the one sentence after `Put your pick first as "(Recommended)".` in step 2 of "Method" in `.claude/skills/refine/SKILL.md`.

After the two edits, the build counts the words of `docs/how-we-work.md` with `countWords`. The new limit is the count rounded up to a multiple of 10: `ceil(count / 10) × 10`. The `budgetFor` case for `docs/how-we-work.md` in `scripts/__tests__/word-count.test.ts` pins 960, so it changes to the new limit ([failing-tests rule](../README.md#failing-tests)).

The link `../../../docs/how-we-work.md#decisions` resolves, and no new link cycle starts: no file that `docs/how-we-work.md` links to links back to the refine skill (`scripts/doc-links.mts`).

## Files that change

| File                                   | New / changed | What                                           |
| -------------------------------------- | ------------- | ---------------------------------------------- |
| `docs/how-we-work.md`                  | Changed       | The recommendation text after the format block |
| `.claude/skills/refine/SKILL.md`       | Changed       | One sentence in step 2 of "Method"             |
| `scripts/word-count.mts`               | Changed       | The `docs/how-we-work.md` limit                |
| `scripts/__tests__/word-count.test.ts` | Changed       | The `budgetFor` case for `docs/how-we-work.md` |

## Order of work

1. The tech lead approves the plan.
2. `.claude/skills/refine/SKILL.md` is a hand-back path, so `claude-hand-back.yml` labels the PR `hand-back`. The tech lead runs `/build-local 968` in a local session.
3. The build makes the edits in [Approach](#approach), then runs the [Commands](../../AGENTS.md#commands) checks.

## Risks

- `.claude/skills/refine/SKILL.md` has about 640 words, and its budget is 650. The new sentence adds 5 words. If `npm run words` fails on that file, stop for the tech lead. The Chore forbids a change to that limit.
- Check 1 fails if a second file quotes the first line of the new rule. Do not quote it in this plan, its Deviations or a test.

## Proof

| Acceptance check                                             | Proven by                                   |
| ------------------------------------------------------------ | ------------------------------------------- |
| 1. One hit for the phrase of check 1                         | `git grep -n -F` with the phrase of check 1 |
| 2. The four lines follow the format block                    | Review of the diff                          |
| 3. Step 2 holds the sentence, and the link opens "Decisions" | Review of the diff; `doc-links.test.ts`     |
| 4. `npm run words` passes; the limit is the rule             | `npm run words`; `word-count.test.ts`       |
| 5. Test, lint, typecheck and format checks pass              | Evidence; CI                                |

## Out of scope

- Other text in the two docs.
- Other word limits.
- The `Recommended:` prefix and `scripts/approve-plan.mts`.
