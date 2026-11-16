# Plan: C885: The plan agent reads the related issues before it drafts

- **Spec:** #885
- **Status:** approved

## Approach

- `plans/README.md` gets a rule with anchor `related-issues`, after the stale-facts rule. The rule holds each bullet of "What to change" except Prompt and Test, and the two Constraints on clashes and edits.
- The `claude-plan.yml` prompt tells the agent to follow that rule with three commands:
  - `gh api repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/dependencies/blocking`
  - `gh api repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/parent`, where a 404 means no parent
  - `gh api repos/${{ github.repository }}/issues/<parent>/sub_issues --paginate`
- The prompt also says to add the "Related issues read:" line to the comment.
- `load-agent-files.test.ts` pins the three commands and the comment line.
- `plan-rule-citations.test.ts` lists the new anchor in `RULE_NAMES`.

## Decisions

**D1 · Room for the rule in `plans/README.md`** · Decides: Tech lead

`plans/README.md` has about 898 words. Its budget is 900. The rule needs about 130. #886 also adds text to this file.

- **A.** Raise the budget to 1,100 in `scripts/word-count.mts` and in two cases of `word-count.test.ts`.
- **B.** Cut about 130 words from other rules in `plans/README.md`.
- **Other:** your own.

**Answer: Other:** write the rule in about 85 words and raise the budget to 1,000, not 1,100. The comment line stays in the prompt only. (@henetiriki)

## Files that change

| File                                            | New / changed | What                                    |
| ----------------------------------------------- | ------------- | --------------------------------------- |
| `plans/README.md`                               | Changed       | The related-issues rule                 |
| `.github/workflows/claude-plan.yml`             | Changed       | The three commands and the comment line |
| `scripts/__tests__/load-agent-files.test.ts`    | Changed       | A test that pins the new prompt text    |
| `scripts/__tests__/plan-rule-citations.test.ts` | Changed       | `related-issues` in `RULE_NAMES`        |
| `scripts/word-count.mts`                        | Changed       | D1 A: the `plans/README.md` budget      |
| `scripts/__tests__/word-count.test.ts`          | Changed       | D1 A: the two `plans/README.md` cases   |

## Order of work

1. Add the failing test to `load-agent-files.test.ts`. See it fail on the missing text.
2. Change the prompt.
3. Add the rule and the anchor in `RULE_NAMES`.
4. Apply the D1 answer.
5. Run the Commands checks.

## Risks

- A respond run that revises a plan gets no commands in its prompt. The rule names `dependencies/blocking`, the parent and `sub_issues`, so the agent can make the calls.
- The `parent` call exits 1 with a 404 when there is no parent. The prompt says what a 404 means, so the agent does not stop.

## Proof

| Acceptance check                                | Proven by                                      |
| ----------------------------------------------- | ---------------------------------------------- |
| `plans/README.md` holds the rule; words pass    | `plan-rule-citations.test.ts`; `npm run words` |
| The prompt names the three commands; tests pass | The new test; `npm test`                       |
| Plan runs list the related issues, or "none"    | The tech lead checks the next plan runs        |
| A decision names the related issue and value    | The tech lead checks the first plan under #57  |

## Out of scope

- An edit to a related issue (#886).
- `.github/agent/refresh.md`, `spec-checks.md` and `settings.json`.

## Deviations

- The rule has 98 words, not about 85. `plans/README.md` has 996 words, within the 1,000 budget.
- The `claude-plan.yml` prompt runs `sub_issues` only if the issue has a parent, so the three commands read as three instructions.
