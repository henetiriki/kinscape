# Plan: C681: Load rule files from main in runs that check out a PR branch

- **Spec:** #681
- **Status:** approved

## Approach

This first PR of D3 sets no caller value and says `Refs #681`.

1. Add a `main_files` input, empty by default, to `run-claude` and `claude-run.yml`.
2. A new `run-claude` step writes main's copy of each file in the checkout. It logs `git status --short`, then marks each copy `--skip-worktree`, so `git add -A` stages nothing.
3. A marked, changed file stops `git merge`. So `resolve-conflict.md` restores the files first.

## Decisions

The comment on #681 records D1: A, D2: A, D3: A.

**D4 · Where the second PR goes** · Decides: Tech lead

The second PR sets the callers' values.

**Answer: B** (Tech lead)

- ~~**A.** A new Chore.~~
- **B.** The tech lead edits the callers under this Chore.

~~Recommended: A, because each PR then has one plan.~~

## Order of work

1. Write the tests, see them fail, then change the files.
2. Merge this PR.
3. Merge the two pin PRs: `run-claude` in `claude-run.yml`, then `claude-run.yml` in the callers.
4. Merge the second PR. It says `Closes #681`.

## Files that change

| File                                         | What                   |
| -------------------------------------------- | ---------------------- |
| `.github/actions/run-claude/action.yml`      | The input and the step |
| `.github/workflows/claude-run.yml`           | The input              |
| `.github/agent/resolve-conflict.md`          | The restore            |
| `scripts/__tests__/load-agent-files.test.ts` | New tests              |

## Risks

- If the second PR merges before step 3, those three runs fail at start.
- D2: A needs a Chore for `claude-respond.yml`. None exists.
- On a branch behind `main`, the copied `AGENTS.md` can fail `plan-rule-citations.test.ts` or `npm run words`. The tech lead accepted it: no code.

## Proof

| Acceptance check            | Proven by                                                   |
| --------------------------- | ----------------------------------------------------------- |
| `git status` shows the copy | A test runs the step in a temporary repo: the log shows `M` |
| No merge stop (D1)          | In that repo, the restore, then `git merge` passes          |
| A live build (second PR)    | The first build after the second PR                         |
