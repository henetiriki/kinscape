# Plan: C592: Tighten the agent tool list and the approval checks

- **Spec:** #592
- **Status:** approved

## Approach

`settings.json` denies git configuration, `.git/` and the `gh` writes no prompt uses; `gh api` keeps GET only, so the plan prompt links a blocker with `gh issue edit --add-blocked-by`, and `npm run review:threads` lists and resolves review threads for the fix. `agent-approve.mts` stops when the review's commit is not the PR head and outputs the commit it made; `claude-run.yml` takes `head` and fails before Claude runs if the checkout differs. A refresh edits its matrix issue only. Every claude-code-action step sets `display_report: false`.

## Decisions

**D1 · `npm install`** · Decides: Tech lead

- **A.** `npm ci` only; a plan that adds a package stops (rule 6).
- ~~**B.** Keep `npm install:*`.~~

**Answer: A** (@henetiriki, in session)

**D2 · `gh api`** · Decides: Tech lead

- **A.** Keep `gh api:*`; deny the method and body flags.
- ~~**B.** As A, plus an allow list of routes.~~

**Answer: A** (@henetiriki, in session)

**D3 · Refresh edit** · Decides: Tech lead

- **A.** A hook in `refresh-settings.json` allows `gh issue edit` on the job's `ISSUE`, in the form `refresh.md` gives.
- ~~**B.** A script that edits `ISSUE` from stdin.~~

**Answer: A** (@henetiriki, in session)

## Files that change

| File                                                                                | What                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------ |
| `.github/agent/settings.json`, `refresh-settings.json`, `build.md`, `fix-review.md` | Denies, `npm ci` only; hook; wording |
| `scripts/review-threads.mts` (new), `agent-approve.mts`, tests, `package.json`      | `list`, `resolve`; `COMMIT`, `head`  |
| `.github/workflows/claude-{run,build,plan,unblock,code-review}.yml`, `run-claude`   | `head`; `ISSUE`; `display_report`    |
| `scripts/__tests__/{agent-settings,agent-approve,load-agent-files}.test.ts`         | Checks                               |

## Order of work

1. Tests first (rule 12), then the rest. `claude-build.yml` pins the branch commit of `claude-run.yml`; `actions-pin-update.yml` moves it after merge.

## Risks

- C588 also edits `fix-review.md`: rebase whichever merges second.
- A push between approval and build fails the run with a comment: approve again.

## Proof

| Acceptance check                            | Proven by                                               |
| ------------------------------------------- | ------------------------------------------------------- |
| Denied and allowed commands; one issue only | `agent-settings.test.ts`                                |
| A moved head stops; the build checks it     | `agent-approve.test.ts`; step test; a build after merge |
