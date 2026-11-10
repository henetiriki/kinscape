# Plan: C681: Load rule files from main in runs that check out a PR branch

- **Spec:** #681
- **Status:** approved

## Approach

This first PR of D3 sets no caller value.

1. Add a `main_files` input, empty by default, to `run-claude` and `claude-run.yml`.
2. A new `run-claude` step writes main's copy of each file in the checkout. It logs `git status --short`, then marks each copy `--skip-worktree`, so `git add -A` stages nothing.
3. A marked, changed file stops `git merge`, so `resolve-conflict.md` restores it first.

## Decisions

The comment on #681 records D1: A, D2: A, D3: A.

**D4 · Where the second PR goes** · Decides: Tech lead

Who edits the callers?

**Answer: B** (Tech lead)

- ~~**A.** A new Chore.~~
- **B.** The tech lead edits the callers under this Chore.

~~Recommended: A, because each PR then has one plan.~~

## Order of work

1. Tests first, then the files.
2. Merge the pin PRs: `run-claude` in `claude-run.yml`, then `claude-run.yml` in the callers.
3. Merge the second PR. It says `Closes #681`.

## Files that change

| File                                                         | What                   |
| ------------------------------------------------------------ | ---------------------- |
| `.github/actions/run-claude/action.yml`                      | The input and the step |
| `.github/workflows/claude-run.yml`                           | The input              |
| `.github/agent/resolve-conflict.md`                          | The restore            |
| `scripts/__tests__/load-agent-files.test.ts`                 | New tests              |
| `claude-{build,fix-review,resolve-conflict}.yml` (second PR) | `main_files`           |

## Risks

- The second PR before step 2 fails three runs at start.
- D2: A needs a Chore for `claude-respond.yml`. None exists.
- The tech lead accepted these, with no code:
  - On a branch behind `main`, the copied `AGENTS.md` can fail `plan-rule-citations.test.ts` or `npm run words`.
  - A listed file missing on a branch fails the copy step; an agent edit to one stays hidden.

## Proof

| Acceptance check            | Proven by                                                   |
| --------------------------- | ----------------------------------------------------------- |
| `git status` shows the copy | A test runs the step in a temporary repo: the log shows `M` |
| No merge stop (D1)          | In that repo, the restore, then `git merge` passes          |
| A live build (second PR)    | A build after the second PR                                 |
