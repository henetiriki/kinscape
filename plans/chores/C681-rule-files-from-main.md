# Plan: C681: Load rule files from main in runs that check out a PR branch

- **Spec:** #681
- **Requirement IDs:** None
- **Status:** approved

## Approach

This is the first PR of D3. It sets no caller value and says `Refs #681`.

1. Add a `main_files` input to `run-claude` and `claude-run.yml`, empty by default. `run-claude` gives it to `load-agent-files`.
2. When `main_files` is set, a new `run-claude` step copies each file over the checkout, logs `git status --short`, and marks each copy `--skip-worktree`, so `git add -A` leaves it out.
3. A marked, changed file stops `git merge`. So `resolve-conflict.md` restores the files first.

## Decisions

#681 records D1: A, D2: A, D3: A.

**D4 · Where the second PR goes** · Decides: Tech lead

**Answer: B** (Tech lead)

- ~~**A.** A new Chore.~~
- **B.** The tech lead edits the callers under this Chore.

## Merge order

1. Merge this PR.
2. Merge the pin PR for `run-claude` in `claude-run.yml`.
3. Merge the pin PR for `claude-run.yml` in the callers.
4. Merge the second PR. It sets `main_files` in the build, fix-review and resolve-conflict callers, and says `Closes #681`.

## Files that change

| File                                         | New / changed | What                                 |
| -------------------------------------------- | ------------- | ------------------------------------ |
| `.github/actions/run-claude/action.yml`      | changed       | The input and the step               |
| `.github/workflows/claude-run.yml`           | changed       | The input                            |
| `.github/agent/resolve-conflict.md`          | changed       | The restore                          |
| `scripts/__tests__/load-agent-files.test.ts` | changed       | New tests; one test allows the input |

## Risks

- `.github/**` is a hand-back path: the tech lead builds this.
- If the second PR merges before step 3, those three runs fail at start.

## Proof

| Acceptance check            | Proven by                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `git status` shows the copy | A test runs the step in a temporary repo: the log shows `M docs/writing.md`; `git add -A` stages nothing |
| No merge stop (D1)          | In that repo, the restore, then `git merge` passes                                                       |
| The checks pass             | The PR output                                                                                            |
| A live build                | The first build after the second PR                                                                      |
