# Plan: B1250: Agent runs on a PR branch lose AGENTS.md, so npm test fails

- **Spec:** #1250
- **Requirement IDs:** None: the change is to agent CI tooling.
- **Status:** approved

## Approach

The build, fix-review and resolve-conflict workflows drop `AGENTS.md` from `main_files`. Then the copy step of `run-claude` does not mark the file skip-worktree, and the restore of `claude-code-action` can write `main`'s copy. The restore also stages that copy. So a `SessionStart` hook in `.github/agent/settings.json` runs `git checkout refs/remotes/origin/main -- AGENTS.md && git reset -q -- AGENTS.md && git update-index --skip-worktree -- AGENTS.md` (#1250 D1, plan D1). The first command writes `main`'s copy, so the run reads it even if the restore fails. The hook has the matcher `startup`, so it runs once, when Claude starts. Tests run the copy step, a simulated restore and the hook's command in a temporary repo, as the C681 tests do.

## Files that change

| File                                            | New / changed | What                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/agent/settings.json`                   | changed       | Add a `SessionStart` entry with the matcher `startup` and the command of D1.                                                                                                                                                                                                                               |
| `scripts/__tests__/load-agent-files.test.ts`    | changed       | `the callers`: the tests "%s names the files CLAUDE.md imports and the code rules" and "claude-build.yml names those files and the Spec checks" expect each list without `AGENTS.md`. A new test fails if one of the three lists names `AGENTS.md`. New tests in `the copy step` run the hook (see Proof). |
| `.github/workflows/claude-build.yml`            | changed       | Remove `AGENTS.md` from `main_files`. The comment says that the action restores it.                                                                                                                                                                                                                        |
| `.github/workflows/claude-fix-review.yml`       | changed       | Remove `AGENTS.md` from `main_files`.                                                                                                                                                                                                                                                                      |
| `.github/workflows/claude-resolve-conflict.yml` | changed       | Remove `AGENTS.md` from `main_files`.                                                                                                                                                                                                                                                                      |

The three workflow rows are hand-back paths. The tech lead builds them in a local session ([hand-back rule](../README.md#hand-back)).

## Order of work

1. CI build: write the hook tests and see them fail. Then add the hook to `settings.json`.
2. CI build: change the `the callers` tests. They fail until step 3.
3. Tech lead: remove `AGENTS.md` from the three `main_files` lists, and run the checks in `AGENTS.md` › Commands.
4. After the merge: read the log of the next build. The restore has no error, and `npm test` passes.

## Risks

- **A second `SessionStart`.** Claude Code also fires `SessionStart` after a compaction. Then a reset in the middle of the resolve-conflict merge would remove `main`'s merged `AGENTS.md` from the index. The matcher `startup` stops this.
- **Other runs.** Each run of `run-claude` loads `settings.json`, so plan and respond runs also run the hook. On a `main` checkout the reset changes nothing. The mark stops a commit of `AGENTS.md`, which is a hand-back path.
- **A later action version.** If a bump of `claude-code-action` drops the restore, the first command of the hook still writes `main`'s copy (plan D1). A failing `SessionStart` hook does not stop a run, so the hook repairs the file and does not compare it.
- **No `main` ref.** If `refs/remotes/origin/main` is absent, the first command fails and the hook stops. The file keeps the checkout's copy. The restore of the action needs the same ref.
- **The hook does not fire.** If `claude-code-action` does not run `SessionStart` hooks, the index keeps `main`'s copy. Step 4 shows it: `git ls-files -v AGENTS.md` has no `S`.
- **This PR's own build.** The build of this plan runs with the Bug, so `npm test` fails the same 11 tests. The build names #1250 for them in its Evidence. Step 3 runs the checks on the full change.

## Decisions

**D1 · A guard against a lost restore** · Decides: Tech lead

The review asked for a guard if a later action version drops the restore (Must not break 2). A failing `SessionStart` hook only prints an error, so a compare in the hook cannot stop the run. What does the hook do?

- **A.** The hook writes `main`'s copy first: `git checkout refs/remotes/origin/main -- AGENTS.md`, then the two commands of #1250 D1. Cost: one command, and acceptance check 4 names three commands.
- **B.** The hook compares the file with `main`'s and prints an error. Cost: the run still reads the PR head's copy.
- **C.** No guard. Cost: a dropped restore reads the PR head's `AGENTS.md` and no test fails.

Recommended: A, because the run then reads `main`'s copy whatever the action does.

**Answer: A** (Tech lead)

## Proof

| Acceptance check                                            | Proven by                                                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `AGENTS.md` equals `main`'s copy                         | New test: the copy step with the build's list, then a simulated restore (`rm`, then `git checkout main -- AGENTS.md`), gives `main`'s text. Step 4 checks a live run. |
| 2. The test fails if a list names `AGENTS.md`               | New test in `the callers`                                                                                                                                             |
| 3. The commit does not change `AGENTS.md`                   | New test: after the restore and the hook, `git add -A` and a commit leave `AGENTS.md` out of the commit                                                               |
| 4. The hook runs the commands of D1                         | New test: the `SessionStart` entry of `settings.json` has the matcher `startup` and the three commands. Another test: the hook writes `main`'s copy if no restore ran |
| 5. The index holds the branch's copy, with the mark         | New test: after the restore and the hook, `git diff --cached` is empty and `git ls-files -v AGENTS.md` starts with `S`                                                |
| 6. The other files are `main`'s copies, with the mark       | Existing test "logs the file that differs from the branch, and git add stages nothing"                                                                                |
| 7. The checks pass                                          | Step 3                                                                                                                                                                |
| Must not break 1: no run reads a rule file from the PR head | The test of check 1; the existing `the callers` tests for the other files                                                                                             |
| Must not break 2: `docs/security.md` › Workflows            | As Must not break 1                                                                                                                                                   |
| Must not break 3: the merge of `resolve-conflict.md`        | New test: after the restore and the hook, the steps of `resolve-conflict.md` › The merge let `git merge` pass                                                         |
| Must not break 4: the review's copy step                    | Existing test "puts main's copies of the imports in the checkout before Claude"                                                                                       |

## Out of scope

- The action also restores its other protected paths from the base branch. This plan changes only `AGENTS.md`.

## Deviations

- Big: The hook runs three commands, not two. Acceptance check 4 of #1250 names two. The review finding on `claude-build.yml` asked for a guard (Must not break 2). The tech lead chose plan D1 option A.
