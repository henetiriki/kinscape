# Plan: C938: Stop a branch switch from failing on .git/config in a sandboxed session

- **Spec:** #938
- **Status:** approved

## Approach

Add an `env` block to `.claude/settings.json` with the five `GIT_CONFIG_*` values of #938. Git reads them as command-line config, so a `git switch` writes no upstream to `.git/config`. Change shared step 6 of `build-local` to name the remote in the pull, because the new branch has no upstream. The `hooks` and `model` keys stay as they are.

## Files that change

| File                                  | New / changed | What                                     |
| ------------------------------------- | ------------- | ---------------------------------------- |
| `.claude/settings.json`               | Changed       | The `env` block                          |
| `.claude/skills/build-local/SKILL.md` | Changed       | Shared step 6: `git pull` names `origin` |

## Order of work

1. Add the `env` block after `hooks`. Do not change `hooks` or `model`.
2. Change shared step 6 to the text of "What to change" item 2.
3. Run the checks in `AGENTS.md` › Commands.
4. In a new sandboxed Claude Code session, run done checks 1 to 4 on a branch that is only on `origin`. Paste the output under Evidence.

## Risks

- Both files are hand-back paths in `.github/CODEOWNERS`. The tech lead builds with `/build-local`.
- CI agent runs also load `.claude/settings.json`, so they get the `env` block. Today a branch from `origin/main` tracks `origin/main`. With the change, it has no upstream, and a bare `git push` sets `origin/<branch>`. A branch that `actions/checkout` makes keeps its upstream, because that step runs outside Claude. The Constraint on `.github/agent/` and workflows blocks a CI-only override.
- The `env` block replaces a `GIT_CONFIG_COUNT` that the shell already sets. This is unlikely, and a fix needs a hook, which the Constraints block. The plan adds no code for it.

## Proof

No unit test covers these two files.

| Done check                                      | Proven by                                      |
| ----------------------------------------------- | ---------------------------------------------- |
| 1, 2: `command line:` origin for both values    | Output from a new sandboxed session (Evidence) |
| 3: `git switch` exits 0 with no lock error      | Output from a new sandboxed session (Evidence) |
| 4: `git pull --ff-only origin <branch>` exits 0 | Output from a new sandboxed session (Evidence) |
| 5: step 6 text                                  | Review of the diff                             |
| Constraints: `hooks`, `model`, no hook          | Review of the diff, `npm run format:check`     |

## Out of scope

`.github/agent/`, workflows and the other skills. `fix-review-local` links to the shared steps, so it gets the new step 6.

## Deviations
