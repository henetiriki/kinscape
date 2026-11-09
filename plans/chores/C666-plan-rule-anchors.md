# Plan: C666: Name plan rules by anchor, not by number

- **Spec:** #666
- **Status:** approved

## Approach

Do the Chore's edits. Put each `<a id>` inside its list item, so the list keeps its numbers. Expand "rules 2, 3 and 5-8" to six links. In `4-chore.yml`, keep the URL, add `#hand-back` and use the plain-text name. The new test skips comment lines, because the Chore keeps code comments.

## Decisions

**D1 · Link text in Markdown files** · Decides: Tech lead

- **A.** `[failing-tests rule](../../plans/README.md#failing-tests)`.
- **B.** `[plans/README.md, failing-tests rule](…#failing-tests)`, the same words as the plain-text form.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                  | New / changed | What                      |
| ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------- |
| `plans/README.md`                                                                                     | Changed       | 13 anchors; in-file links |
| `.github/agent/{build,fix-review,resolve-conflict,respond,review-code,review}.md`                     | Changed       | Links                     |
| `AGENTS.md`, `docs/building.md`, `.github/pull_request_template.md`, `.claude/skills/refine/chore.md` | Changed       | Links                     |
| `eslint.config.mjs`, `scripts/agent-approve.mts`, `.github/workflows/claude-plan.yml`, `4-chore.yml`  | Changed       | Plain-text names          |
| `scripts/__tests__/plan-rule-citations.test.ts`                                                       | New           | Number and anchor checks  |
| `scripts/__tests__/load-agent-files.test.ts`, `agent-approve.test.ts`                                 | Changed       | Expect the rule name      |

## Order of work

1. The new test, and see it fail on "rule 10".
2. Anchors, then citations, then the two old tests.

## Risks

- `plans/README.md` has about 720 words. The anchors add about 15. If the file passes 750 words, stop and ask: the Chore forbids new rule text.
- The plan PR gets `hand-back`. A person builds it.

## Deviations

- `.github/pull_request_template.md` cites the rule inside an HTML comment, which does not render a link. It uses the plain-text name.

## Proof

| Acceptance check                                  | Proven by                                              |
| ------------------------------------------------- | ------------------------------------------------------ |
| Lint, `format:check`, `words`, `typecheck`, tests | Output in the PR                                       |
| 13 anchors; in-file citations are links           | `plan-rule-citations.test.ts`                          |
| A "rule 10" citation fails the test               | The failing line from step 1, in Evidence              |
| A removed anchor fails the test                   | A test case on a fixture text                          |
| No new link cycle or allowlist entry              | `doc-links.test.ts`; `scripts/doc-links.mts` unchanged |
