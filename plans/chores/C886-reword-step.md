# Plan: C886: The build rewords the Spec and the related issues that a plan answer changes

- **Spec:** #886
- **Status:** approved

## Approach

- `build.md` gets step 1, anchor `reword`, with each "What to change" bullet from Source to A closed issue. It finds a sibling's plan PR with `gh pr list --state open --search "Closes #<n> in:body"`.
- If a body already holds the answer's text and its cite, step 1 does not edit that body. It does not comment on the sibling's plan PR again.
- The plan-pr-flow rule and `how-we-work.md` › Decisions link to `reword`. Each new sentence is no longer than the one it replaces.
- `build-local/SKILL.md` names `build.md` step 7, not 6.

## Decisions

**D1 · How the build reads `spec-checks.md`** · Decides: Tech lead

A build loads only `rules.md` and `build.md` from `main`. Its checkout is the PR branch, and `docs/security.md` forbids a rule file from the PR head.

- **A.** Add the file to `main_files` in `claude-build.yml`, and to its test.
- **B.** The step runs `git show origin/main:.github/agent/spec-checks.md`. A build checkout can lack `origin/main`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · "Edit no related issue" in the related-issues rule** · Decides: Tech lead

- **A.** Change it to "Only the build edits a related issue."
- **B.** Keep it. It applies only before a plan.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · A Spec check that fails after a reword** · Decides: Tech lead

- **A.** Do as `respond.md` says: fix the new text, and ask about each problem that stays in the final PR comment.
- **B.** Undo the edit. Name the issue as a failed reword.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | What                  |
| -------------------------------------------- | --------------------- |
| `.github/agent/build.md`                     | Step 1                |
| `plans/README.md`                            | Plan-pr-flow rule; D2 |
| `docs/how-we-work.md`                        | Decisions             |
| `.claude/skills/build-local/SKILL.md`        | Step 7                |
| `scripts/word-count.mts`                     | `build.md` budget 450 |
| `scripts/__tests__/word-count.test.ts`       | Its case              |
| `scripts/__tests__/load-agent-files.test.ts` | Pins step 1; D1 A     |
| `.github/workflows/claude-build.yml`         | D1 A                  |

## Order of work

1. Add the failing tests. See them fail.
2. Change `word-count.mts`. Write the step.
3. Change the other files. Apply the answers.
4. Run the Commands checks.

## Risks

- `plans/README.md` has 996 of 1,000 words. The edit to plan-pr-flow removes about 5.
- If `doc-links` finds a new cycle, add the file to the `ALLOWLIST` entry that holds `build.md`.

## Proof

| Acceptance check                  | Proven by                                 |
| --------------------------------- | ----------------------------------------- |
| Step 1; words and tests pass      | The new test; `npm run words`; `npm test` |
| Respond run changes the plan only | The ready check                           |
| The other five checks             | The tech lead checks the first builds     |

## Deviations

- `claude-build.yml` names `spec-checks.md` in `main_files` (D1). The issue names no workflow edit.
- The related-issues rule changes one sentence (D2). The issue does not name that rule.
