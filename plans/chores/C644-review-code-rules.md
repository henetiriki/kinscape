# Plan: C644: Review flags code smells, placement and weak tests

- **Spec:** #644
- **Status:** approved

## Approach

Add `.github/agent/review-code.md`: what the review looks for. `review.md` keeps the process and gets the Findings rule. `claude-code-review.yml` loads `review.md review-code.md`. Each rule is one line: an instruction and its signal. No review checklist exists in `.claude/skills/` or `docs/how-we-work.md`.

## Decisions

**D1 · Where the rules go** · Decides: Tech lead

- **A.** New file `review-code.md`, budget 700 words, appended after `review.md`.
- ~~**B.** Raise the `review.md` budget.~~
- ~~**Other:** your own.~~

**Answer: A** (@henetiriki)

**D2 · The existing rules** · Decides: Tech lead

- **A.** Move `review.md` › _The rules_ to `review-code.md`. Point the `docs/security.md` link at it.
- ~~**B.** Leave them in `review.md`.~~
- ~~**Other:** your own.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | New / changed | What                         |
| -------------------------------------------------------- | ------------- | ---------------------------- |
| `.github/agent/review-code.md`                           | New           | The rule groups from #644    |
| `.github/agent/review.md`                                | Changed       | Findings rule; rules out     |
| `.github/workflows/claude-code-review.yml`               | Changed       | Loads both files             |
| `scripts/word-count.mts`, `__tests__/word-count.test.ts` | Changed       | 700-word budget              |
| `scripts/__tests__/load-agent-files.test.ts`             | Changed       | Expects both files, in order |
| `docs/security.md`                                       | Changed       | Link (D2)                    |

## Order of work

1. Change the tests. See them fail.
2. Write the budget, the files and the workflow line.
3. Run the trial on two merged PRs.

## Risks

- The workflow change gets no automated review. The tech lead reviews it.
- A longer prompt costs more tokens on each review.

## Proof

| Acceptance check          | Proven by                         |
| ------------------------- | --------------------------------- |
| The prompt has each group | `load-agent-files.test.ts`; trial |
| `npm run words` passes    | CI                                |
| Trial on two merged PRs   | PR body                           |
