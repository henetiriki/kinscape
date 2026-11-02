# Plan: C519: The review opens each follow-up with the status of its earlier findings

- **Spec:** #519
- **Status:** approved

## Approach

As the Chore says, with the rule's text per D1; the test asserts "All earlier findings addressed". Handed back (rule 13).

## Decisions

**D1 · Fitting the budget** · Decides: Tech lead

`review.md` counts 440 words; the Chore's wording adds about 80 net, over its 500.

- **A.** Keep 500 with a 69-word rule: "After the first review, open with one `gh pr comment`: "All earlier findings addressed", or a link to each still-open finding with a one-line reason. Check each against the current code, not only `.since-last-review.diff`; one is addressed if the code fixes it or the author's reply gives a reason you accept, not by a resolved thread alone. With no new findings, it also lists the plan items and rules checked (no bare "No issues found")."
- **B.** Keep the Chore's wording and raise the limit to 525; the Chore's count changes to match.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | New / changed | What                        |
| ---------------------------------------------------------------- | ------------- | --------------------------- |
| `.github/agent/review.md`                                        | Changed       | Findings bullets            |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | Changed       | 450 → 500 (D1)              |
| `scripts/__tests__/load-agent-files.test.ts`                     | Changed       | Asserts the phrase is there |

## Risks

- `fix-review.md` reads the Bot's newest gaps comment; the status comment only links findings, so isn't one.

## Deviations

- D1 A's rule counted 505 words in place, over the 500 limit; five words trimmed, same meaning and phrase.

## Proof

| Acceptance check                                     | Proven by                                 |
| ---------------------------------------------------- | ----------------------------------------- |
| The rule is on `main`; `npm run words` passes        | `npm run words`                           |
| Both test files pass; the assertion fails without it | A failing run first, then `npm test`      |
| The next push's review opens with a status comment   | After merge, on a PR with an open finding |
