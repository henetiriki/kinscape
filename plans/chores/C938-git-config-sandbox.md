# Plan: C938: Stop a branch switch from failing on .git/config in a sandboxed session

- **Spec:** #938
- **Status:** approved

## Approach

Add an `env` block to `.claude/settings.json` with the five `GIT_CONFIG_*` values of #938. Git reads them as command-line config, so a `git switch` writes no upstream to `.git/config`. Change shared step 6 of `build-local` to name the remote in the pull, because the new branch has no upstream. Add a push rule to the shared steps (D1). The `hooks` and `model` keys stay as they are.

## Decisions

**D1 · Push command** · Decides: Tech lead

With `push.autoSetupRemote=true`, a bare `git push` writes an upstream to `.git/config` after the push. The sandbox denies that write. How does a sandboxed session push?

- ~~**A.** Leave as is. A bare `git push` stays, and the new sandboxed session shows if it fails.~~
- **B.** Name the remote. Add a rule to the shared steps of `build-local`: run `git push origin <branch>`. A push that names a refspec sets no upstream.
- ~~**C.** Drop `push.autoSetupRemote`. Remove its two `env` values and set `GIT_CONFIG_COUNT` to 1. Done check 2 goes away.~~
- **Other:** your own.

Recommended: B, because it adds one rule line.

**Answer: B** (Tech lead)

## Files that change

| File                                  | New / changed | What                                    |
| ------------------------------------- | ------------- | --------------------------------------- |
| `.claude/settings.json`               | Changed       | The `env` block                         |
| `.claude/skills/build-local/SKILL.md` | Changed       | Step 6 names `origin`. A push rule (D1) |

## Order of work

1. Add the `env` block after `hooks`. Do not change `hooks` or `model`.
2. Change shared step 6 to the text of "What to change" item 2. Add the push rule of D1 to "Rules for every step".
3. Run the checks in `AGENTS.md` › Commands.
4. In a new sandboxed Claude Code session, run done checks 1 to 4 on a branch that is only on `origin`. Paste the output under Evidence.

## Risks

- Both files are hand-back paths in `.github/CODEOWNERS`. The tech lead builds with `/build-local`.
- CI agent runs also load the `env` block. A branch from `origin/main` then has no upstream, and a bare `git push` sets one. A branch that `actions/checkout` makes keeps its upstream. The Constraint on `.github/agent/` and workflows blocks a CI-only override.
- The `env` block replaces a `GIT_CONFIG_COUNT` that the shell already sets. This is unlikely. A fix needs a hook, which the Constraints block, so the plan adds no code.

## Proof

No unit test covers these two files.

| Done check                               | Proven by                                      |
| ---------------------------------------- | ---------------------------------------------- |
| 1 to 4: values, `git switch`, `git pull` | Output from a new sandboxed session (Evidence) |
| 5, D1: step 6 text, push rule            | Review of the diff                             |
| Constraints: `hooks`, `model`, no hook   | Review of the diff, `npm run format:check`     |

## Out of scope

`.github/agent/`, workflows and the other skills. `fix-review-local` links to the shared steps, so it gets the new step 6.

## Deviations

- The `env` block sits before `hooks`, not after. Key order does not change behaviour.
- The tech lead runs done checks 1 to 4 in a new sandboxed session on this branch, before merge. The output goes under Evidence.
