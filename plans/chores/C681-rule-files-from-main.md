# Plan: C681: Load rule files from main in runs that check out a PR branch

- **Spec:** #681
- **Requirement IDs:** None
- **Status:** draft

## Approach

This is the first PR of D3. It sets no caller value.

1. Add a `main_files` input to `run-claude` and `claude-run.yml`, empty by default. `run-claude` gives it to `load-agent-files`.
2. When `main_files` is set, a new `run-claude` step copies each file over the checkout and logs `git status --short`. Then it marks each copy `--skip-worktree`, so `git add -A` leaves it out.
3. A marked, changed file stops `git merge`. So `resolve-conflict.md` clears the marks and restores the files before the merge.

## Decisions

The answers on #681: D1: A, D2: A, D3: A.

**D4 · Where the second PR goes** · Decides: Tech lead

The second PR sets `main_files` in the build, fix-review and resolve-conflict callers.

- **A.** A new Chore. File it with the respond Chore (D2).
- **B.** The tech lead edits the callers under this Chore.
- **Other:** your own.

Recommended: A, because each PR then has one plan.

## Files that change

| File                                         | New / changed | What                                                         |
| -------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `.github/actions/run-claude/action.yml`      | changed       | The input and the step                                       |
| `.github/workflows/claude-run.yml`           | changed       | The input                                                    |
| `.github/agent/resolve-conflict.md`          | changed       | The restore                                                  |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | New tests; "loads no main files" allows `run-claude`'s input |

## Order of work

1. Write the tests, and see them fail.
2. Change the three files.

## Risks

- `.github/**` is a hand-back path: the tech lead builds this.
- Only the step's log shows a marked copy.

## Proof

| Acceptance check            | Proven by                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `git status` shows the copy | A test runs the step in a temporary repo: the log shows `M docs/writing.md`; `git add -A` stages nothing |
| No merge stop (D1)          | In that repo, the restore, then `git merge` passes                                                       |
| The checks pass             | The output in the PR                                                                                     |
| A live build                | The first build after the second PR                                                                      |
