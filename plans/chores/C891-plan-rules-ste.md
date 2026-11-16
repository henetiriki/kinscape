# Plan: C891: Make the rules of plans/README.md follow STE

- **Spec:** #891
- **Status:** approved

## Approach

`plans/README.md` is a hand-back path, so the tech lead builds this Chore with `/build-local`.

The build rewrites each rule that the table names. A rewrite keeps the facts of its rule. No anchor, link or rule moves. The numbers are the [STE rules](../../docs/writing.md#ste) that each rule breaks.

| Rule                    | Breaks                                      |
| ----------------------- | ------------------------------------------- |
| Intro line (D1)         | 3                                           |
| `plans-committed-first` | 3                                           |
| `plan-pr-flow`          | 3, 7 ("On approval"), 9 ("would merge"), 15 |
| `chores`                | 3, 14 (seven sentences)                     |
| `small-departures`      | 2                                           |
| `big-departures`        | 2, 8, 9, 13                                 |
| `too-big`               | 1, 2                                        |
| `missing-components`    | 1, 2, 3, 13, 14 (ten sentences)             |
| `failing-tests`         | 2, 8, 13                                    |
| `stale-facts`           | 8, 14 (seven sentences)                     |
| `test-first`            | 1, 2, 8                                     |
| `hand-back`             | 8, 10 ("Hand back" in the label)            |
| `design-system`         | 2, 10 ("sign in")                           |
| `ready-check`           | 11 ("leaves draft")                         |

`related-issues` and `build-ownership` have no break.

## Decisions

**D1 · Rewrite the intro line too** · Decides: Tech lead

"What to change" names the rules. The first acceptance check names the whole file. The intro line is not a rule, and it is in the passive voice.

- **A.** Rewrite the intro line too.
- **B.** Rewrite the rules only. The review does not see the intro line, because it reads only added lines.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Lists of more than two nouns** · Decides: Tech lead

STE rule 15 asks for a vertical list "for more than two items". Five rules hold a noun list in one sentence, for example "file names, step order, an extra helper". `docs/writing.md` keeps such lists inline.

- **A.** Make only sequences and lists of instructions vertical.
- **B.** Make each list of more than two items vertical.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                   | What                                  |
| -------------------------------------- | ------------------------------------- |
| `plans/README.md`                      | The rewrites                          |
| `scripts/word-count.mts`               | Its budget, if the count passes 1,000 |
| `scripts/__tests__/word-count.test.ts` | Its two cases, if the budget changes  |

## Order of work

1. Rewrite each rule that the table names.
2. Run `npm run words`. If `plans/README.md` passes 1,000 words, raise its budget by the count.
3. Run the Commands checks.
4. Post one PR comment with a table of each old sentence beside its new sentence.

## Risks

- A rewrite can change what an agent does. The comment of step 4 lets the tech lead check each meaning.
- The file has 980 of its 1,000 words. The rewrites add words, so the budget can rise.

## Proof

| Acceptance check                     | Proven by             |
| ------------------------------------ | --------------------- |
| No STE break in `plans/README.md`    | The review of the PR  |
| Old sentences beside new ones        | The comment of step 4 |
| `plan-rule-citations.test.ts` passes | `npm test`            |
| No change to `RULE_NAMES`            | The diff              |
| `npm run words` passes               | `npm run words`       |
