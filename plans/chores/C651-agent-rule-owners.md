# Plan: C651: Give each agent rule one owner and one doc the builder reads

- **Spec:** #651
- **Status:** approved

## Approach

Do the Chore's edits. Name paths in `docs/code-rules.md` as code spans, so it adds no link cycle. Move the Cache-Control clause. In `review.md`, point the smell and placement finding to `docs/code-rules.md`.

## Decisions

**D1 · The AGENTS.md line for Intents and Specs** · Decides: Tech lead

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
2. Docs, prompts, workflow, scripts, diagram.

## Risks

On this PR only, the review job fails: main has no `docs/code-rules.md`. The check is not required.

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

## Deviations

- `code-rules.md` words each rule as a builder instruction.
- `security.md` gains a `## Workflows` heading; Cache-Control keeps its scope.
- `review.md` and `fix-review.md` say what to write; `fix-review.md` links its checks to Verifying. `AGENTS.md` keeps the Intent route.
- The rule-group test also checks both docs.
