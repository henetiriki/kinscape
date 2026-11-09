# Plan: C651: Give each agent rule one owner and one doc the builder reads

- **Spec:** #651
- **Status:** approved

## Approach

Do the Chore's edits. Move each section's text as it is. Name paths in `docs/code-rules.md` as code spans, so it adds no link cycle. Take the Cache-Control clause out of _New surface_ in `review-code.md`. In `review.md`, point the smell and placement finding to `docs/code-rules.md`, their new owner.

## Decisions

**D1 · The AGENTS.md line for Intents and Specs** · Decides: Tech lead

`AGENTS.md` already has a `docs/how-we-work.md` bullet: "the workflow, labels and roles".

- **A.** Replace the Intent, Spec and how-we-work bullets with one linked bullet.
- **B.** Add a new linked line, and keep the how-we-work bullet.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                    | New / changed | What                                     |
| --------------------------------------------------------------------------------------- | ------------- | ---------------------------------------- |
| `docs/code-rules.md`                                                                    | New           | The five moved sections                  |
| `.github/agent/review-code.md`, `review.md`, `fix-review.md`, `build.md`                | Changed       | Links in place of moved or repeated text |
| `docs/security.md`, `docs/README.md`, `AGENTS.md`, `CLAUDE.md`                          | Changed       | The Chore's edits                        |
| `.github/CODEOWNERS`, `.github/workflows/claude-code-review.yml`                        | Changed       | The new hand-back path; main's copy      |
| `scripts/workflows-diagram.mts`, `.github/workflows/README.md`                          | Changed       | The how-we-work link; the generated file |
| `scripts/doc-links.mts`, `scripts/word-count.mts`                                       | Changed       | Drop the README entry; two budgets       |
| `scripts/__tests__/load-agent-files.test.ts`, `hand-back.test.ts`, `word-count.test.ts` | Changed       | The new file and budgets                 |

## Order of work

1. Tests, and see them fail.
2. Docs and prompts.
3. Workflow, scripts, diagram.

## Risks

On this PR only, the review job fails: main has no `docs/code-rules.md`. The check is not required. Claude skips a PR that changes its workflow.

## Proof

| Acceptance check                                       | Proven by                       |
| ------------------------------------------------------ | ------------------------------- |
| Lint, `format:check`, `words`, `typecheck`, tests      | Output in the PR                |
| `workflows:diagram` leaves no diff                     | `git status` in the PR          |
| Moved text is gone; pointers resolve                   | `git diff`; `doc-links.test.ts` |
| The review job copies `docs/code-rules.md`             | `load-agent-files.test.ts`      |
| `docs/code-rules.md` is a hand-back path               | `hand-back.test.ts`             |
| `security.md` and `AGENTS.md` items, in budget         | `git diff`; `words`             |
| No README entry; the `DESIGN.md` entry lists its cycle | `doc-links.test.ts`             |
