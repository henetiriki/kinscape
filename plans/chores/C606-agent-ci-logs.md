# Plan: C606: Agents read a failed CI job's log with gh api

- **Spec:** #606
- **Status:** approved

## Approach

Since C.415 the agents may not read the runner temp folder, where claude-code-action's `download_job_log` saves a CI log, so a run that downloads one cannot read it (#602). `rules.md` gains one line: read a failed job's log with `gh api --allow-escape-sequences repos/{owner}/{repo}/actions/jobs/<job id>/logs`, the id from the job URL `gh pr checks <n>` prints. It prints to stdout, `Bash(gh api:*)` allows it, and every run's shell has the App token with `actions: read`. `settings.json` denies `mcp__github_ci__download_job_log`, so no run takes the dead route; `get_ci_status` stays.

## Decisions

**D1 · Where** · Decides: Tech lead

- **A.** `rules.md`: every agent.
- ~~**B.** `respond.md` only.~~

**Answer: A** (@henetiriki, in session)

**D2 · The action's download tool** · Decides: Tech lead

- **A.** Deny `mcp__github_ci__download_job_log`.
- ~~**B.** Leave it.~~

**Answer: A** (@henetiriki, in session)

## Files that change

| File                                       | What            |
| ------------------------------------------ | --------------- |
| `.github/agent/rules.md`                   | The log line    |
| `.github/agent/settings.json`              | The deny        |
| `scripts/__tests__/agent-settings.test.ts` | Checks the deny |

## Order of work

1. The test (rule 12), then the deny, then the rule line.

## Risks

- `gh` refuses to print the log without `--allow-escape-sequences` (seen on #602's log). If the runner's `gh` predates the flag, the command fails with "unknown flag" and the agent names it in its comment.
- The log reaches the model with its ANSI codes; the e2e reporter's are few.

## Proof

| Acceptance check                             | Proven by                                                       |
| -------------------------------------------- | --------------------------------------------------------------- |
| A reply quotes the failing test from the log | An `@claude` comment on a PR with a failed e2e job, after merge |
| The deny is in `settings.json`; budgets hold | `agent-settings.test.ts`; `npm run words`                       |

## Out of scope

The C.415 temp-folder deny and the workflows' permissions.
