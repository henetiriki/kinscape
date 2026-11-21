# Plan: C1109: Hand back only the paths CI cannot build, and build the rest of a hand-back PR in CI

- **Spec:** #1109
- **Status:** approved

## Approach

`scripts/hand-back.mts` gets an exported `HAND_BACK` list and an `isHandBack(path)` function that the label script and `agent-approve.mts` share. `toRegExp` stays and reads each `HAND_BACK` pattern. `agent-approve.mts` reads the rows of the plan with `tablePaths`, which it already has in `text`. A `hand-back` PR with a row that is not a hand-back path gives `go=true` and moves the issue to `status: ready-for-agent`. A PR with no such row keeps the current comment, `go=false` and no label move. A table with no rows counts as "each row is a hand-back path", so the current tests hold.

In `build.md`, line 13 becomes one bullet that links to a new `## Hand-back` section after the steps. The dependency stop stays on line 14, which #1111 cites. Step 8 gets a fourth bullet: the PR has the `hand-back` label.

This Chore is a full hand-back under the rules on `main`, because it edits `.github/CODEOWNERS` and workflow comments. The tech lead builds it with `/build-local`.

## Decisions

**D1 · Where the hand-back paths come from** · Decides: Tech lead

Step 1 makes `HAND_BACK` the list, and step 2 names it as the source. A Constraint says that `claude-hand-back.yml` still reads the script and `.github/CODEOWNERS` from the base commit.

- **A.** `HAND_BACK` alone. The script stops reading `.github/CODEOWNERS`. `run` and `matcher` take no CODEOWNERS text, and the CODEOWNERS parser tests go. The workflow still checks out the base commit, so a PR cannot change the list that runs. Its comment on lines 5 and 6 names `HAND_BACK`, not CODEOWNERS. Cost: about 40 fewer lines in the script and the tests.
- **B.** A path is a hand-back path if it matches `HAND_BACK` and a CODEOWNERS line after the catch-all. The script still reads CODEOWNERS, as the Constraint says. `claude-build.yml` adds `.github/CODEOWNERS` to the sparse checkout of the `approve` job, and `agent-approve.mts` reads the file. Cost: two lists to keep in step, and one more workflow edit.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Text outside the issue that the change makes wrong** · Decides: Tech lead

The issue does not name these lines. Each one says that a CODEOWNERS line hands a PR back, or that CI builds nothing on a hand-back PR:

- `docs/repo-settings.md` line 28;
- `.claude/skills/refine/chore.md` line 23;
- `plans/README.md` line 70, the build-ownership rule;
- `.github/workflows/claude-build.yml` lines 5 and 46 to 48 (comments);
- `.github/workflows/claude-hand-back.yml` lines 5 and 6 (comments; D1 A only).

- **A.** Fix each line in this PR. Cost: about 10 changed lines. Each file is already a hand-back path or near a changed rule.
- **B.** Leave them. File a follow-up Chore. Cost: the docs contradict the rule from the merge until that Chore merges.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                                                                                                                      |
| ----------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/hand-back.mts`                   | changed       | `EXEMPT` → `HAND_BACK` with the nine patterns. Export `isHandBack`. Header comment. D1 A: drop the CODEOWNERS read and parser.                            |
| `scripts/__tests__/hand-back.test.ts`     | changed       | The acceptance tests below. Replace the "real .github/CODEOWNERS" block with a `HAND_BACK` block. D1 A: drop the CODEOWNERS parser tests.                 |
| `scripts/agent-approve.mts`               | changed       | Build a `hand-back` PR with a row that is not a hand-back path. Move its issue to `status: ready-for-agent`. Header comment.                              |
| `scripts/__tests__/agent-approve.test.ts` | changed       | Tests for a partial `hand-back` PR: `go=true`, the label move and no comment. The tests at lines 513 to 593 and 725 keep their current result.            |
| `.github/CODEOWNERS`                      | changed       | Line 1 names `HAND_BACK` in `scripts/hand-back.mts` as the source of the hand-back paths. The owner lines stay.                                           |
| `.github/agent/build.md`                  | changed       | Line 13 links to a new `## Hand-back` section with the three steps of issue step 4. Step 8 keeps a `hand-back` PR a draft. Step 9 lists each unbuilt row. |
| `.claude/skills/build-local/SKILL.md`     | changed       | Start from the last CI commit. Build only the hand-back rows that the CI comment lists. Run the ready check, then mark the PR ready.                      |
| `plans/README.md`                         | changed       | The hand-back rule: `HAND_BACK` is the list, CI builds the other rows, and the tech lead builds the rest. D2 A: the build-ownership rule.                 |
| `docs/building.md`                        | changed       | Step 6: CI builds the rows that are not hand-back paths, then the tech lead runs `/build-local`.                                                          |
| `docs/repo-settings.md`                   | changed       | D2 A: line 28 says the lines after the catch-all need the tech lead's review. It links to `HAND_BACK` for the hand-back paths.                            |
| `.claude/skills/refine/chore.md`          | changed       | D2 A: line 23 reads `HAND_BACK`, not `.github/CODEOWNERS`.                                                                                                |
| `.github/workflows/claude-build.yml`      | changed       | D2 A: comments only. A `hand-back` PR with a row that CI can build goes to the build.                                                                     |
| `.github/workflows/claude-hand-back.yml`  | changed       | D1 A and D2 A: comments only. The script and its list come from the base commit.                                                                          |

## Order of work

1. Write the `hand-back.test.ts` tests. See them fail. Then change `hand-back.mts`.
2. Write the `agent-approve.test.ts` tests. See them fail. Then change `agent-approve.mts`.
3. Edit `.github/CODEOWNERS` line 1. Check with `git diff` that only line 1 changes.
4. Edit `build.md`, `build-local/SKILL.md`, `plans/README.md` and `docs/building.md`. Then edit the D2 A files.
5. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- A build agent edits a hand-back path anyway. Code-owner review at merge still stops it. The final comment of the build lists each hand-back row, so the tech lead checks those paths.
- `AGENTS.md`, `docs/security.md`, `docs/writing.md`, `docs/code-rules.md` and `.github/agent/spec-checks.md` are the `main_files` of `claude-build.yml`. A CI build writes main's copy of each into the checkout. These are hand-back paths, so the build does not commit an edit to them.
- `docs/building.md` has a 450-word budget. Step 6 grows by about 15 words. If the file goes over, shorten step 6 only.

## Proof

| Acceptance check                                                                                                 | Proven by                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A PR that changes only `build.md`, `refine/SKILL.md`, `plans/README.md` or `agent-approve.mts` gets no label     | `hand-back.test.ts`: one `run` case for each path                          |
| A PR that changes each `HAND_BACK` pattern, or a plan whose table names one, gets the label                      | `hand-back.test.ts`: `it.each` over `HAND_BACK`, in the diff and in a plan |
| An approved `hand-back` PR with a row that is not a hand-back path gives `go=true` and `status: ready-for-agent` | `agent-approve.test.ts`, new case                                          |
| An approved `hand-back` PR whose rows are all hand-back paths gives `go=false` and the current comment           | `agent-approve.test.ts`, new case and the cases at lines 522 to 545        |
| `.github/CODEOWNERS` has the same owner lines                                                                    | `git diff origin/main -- .github/CODEOWNERS` shows only line 1             |
| The four docs describe the partial build, and `npm run words` passes                                             | Review; `npm run words`                                                    |
| `claude-fix-review.yml` and `claude-resolve-conflict.yml` still skip a `hand-back` PR                            | No edit to either file                                                     |
| The `hand-back` label stays until merge                                                                          | No code removes it; `hand-back.mts` still skips a labelled PR              |

## Out of scope

- The big-departure rule in `build.md` and `build-local/SKILL.md` (#1111).
- Who may push to a hand-back path: the ruleset and CODEOWNERS stay as they are.

## Deviations

- `scripts/word-count.mts` and its test change: the `build.md` budget goes from 530 to 600 words for the new `## Hand-back` section.
- The `build-local/SKILL.md` bullet also covers a PR that had no CI build: the tech lead builds every hand-back row then.
- `docs/repo-settings.md` has realigned table columns. `npm run format` requires them after the line 28 edit.
