# Plan: C646: Move the writing rules to docs/writing.md and add STE rules

- **Spec:** #646
- **Status:** approved

## Approach

Do the ten steps of #646 in order. Move all of `AGENTS.md` › _Writing_, including the word-budget line, to _All text_. Keep the `## Writing` heading, so that _Known mistakes_ still links.

## Decisions

**D1 · The link in `review-code.md` line 11** · Decides: Tech lead

It cites "`AGENTS.md` Writing", which becomes one link.

- **A.** Change it to `docs/writing.md`.
- **B.** Keep it (Constraints).
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The `git grep -l "writing.md"` check** · Decides: Tech lead

`word-count.mts`, two tests and this plan also match.

- **A.** Read "lists" as "includes".
- **B.** Other wording in the Chore.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | What                                     |
| -------------------------------------------------------- | ---------------------------------------- |
| `docs/writing.md`                                        | New: steps 1–2                           |
| `CLAUDE.md`, `AGENTS.md`, `docs/how-we-work.md`          | Steps 3–5                                |
| `.claude/skills/refine/{bug,chore,spec}.md`              | Step 6                                   |
| `.github/ISSUE_TEMPLATE/{2-spec,3-bug,4-chore}.yml`      | Step 6                                   |
| `.github/CODEOWNERS`                                     | Step 7                                   |
| `.github/workflows/claude-code-review.yml`               | Step 8: `main_files`, `cp`, `git status` |
| `scripts/__tests__/load-agent-files.test.ts`             | Expected imports add `docs/writing.md`   |
| `.github/agent/review-code.md`                           | Step 9; D1                               |
| `scripts/word-count.mts`, `__tests__/word-count.test.ts` | Step 10; add to the default `run` list   |

## Risks

- Hand-back paths: the tech lead builds this (rule 13).
- Until merge, `main` has no `docs/writing.md`, so this PR's review fails to load it.

## Proof

| Acceptance check                        | Proven by                             |
| --------------------------------------- | ------------------------------------- |
| `npm run words`; 600-word limit         | Output; `word-count.test.ts`          |
| No `writing-specs-bugs-and-chores` link | `git grep` output, outside `plans/`   |
| `writing.md` links                      | `git grep -l` output (D2)             |
| Sections and 16 rules                   | Review of `docs/writing.md`           |
| No STE in `how-we-work.md`              | `git grep -n STE docs/how-we-work.md` |
| One finding for STE breaks              | First review after merge              |
