# Repository settings

GitHub settings live outside git, so we keep them **as code** instead:

- `scripts/setup-github.sh` applies them (labels, milestones, repo settings, ruleset, security).
- `scripts/github/ruleset-main.json` defines the ruleset protecting `main`.
- `scripts/check-github.sh` checks the live settings against them and fails on any drift.

**To change a setting:** edit the script or JSON in a PR, then after merge the tech lead runs `./scripts/setup-github.sh` followed by `./scripts/check-github.sh`. Don't change settings by hand in the GitHub UI. If you have to (e.g. in an emergency), follow up with a PR so the scripts match again.

## What's set and why

| Setting                                  | Value                                                   | Why                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Merge methods                            | Squash only                                             | One commit on `main` per PR; linear history                                                           |
| Squash commit message                    | PR title + commit messages                              | Keeps each PR's `plan(…): approved by @…` line in `main`'s history                                    |
| Delete branch on merge                   | On                                                      | No stale branches                                                                                     |
| Suggest updating PR branches, auto-merge | On                                                      | Branches stay current; nothing auto-merges ([Dependencies](dependencies.md))                          |
| Wiki, Projects, Discussions              | Off                                                     | Fewer places for the PO to look. Work lives in Issues                                                 |
| Ruleset _Protect main_                   | No deletion, no force push, linear history, PR required | `main` only changes through a reviewed PR                                                             |
| Required approvals                       | 1, stale approvals dismissed, conversations resolved    | One approval from the PO or the tech lead is enough for now                                           |
| Code-owner review                        | Required, for the paths in `.github/CODEOWNERS`         | A PO approval alone can't merge a change to agent-sensitive paths. The tech lead's bypass still works |
| Bypass                                   | Repository admin, **via PR only**                       | The tech lead can merge chore PRs (you can't approve your own PR). Every bypass is logged             |
| Required status checks                   | lint, format, test, e2e, boundaries, words, Codecov     | Nothing merges with a red check. Names match the CI job names and Codecov's statuses                  |
| Dependabot alerts and security fixes     | On                                                      | Free on private repos                                                                                 |
| Actions token                            | Read-only; can't approve PRs                            | Least privilege; an agent's workflow can't approve its own PR                                         |

## Vercel

Vercel has no settings-as-code here: the tech lead sets these by hand in the Vercel dashboard, and nothing checks for drift. Update this table in the same PR as any change.

| Setting                   | Value                                                                                                                                                                              | Why                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project                   | `kinscape`, Hobby plan, Git repo `henetiriki/kinscape`                                                                                                                             | Every PR gets a preview; every merge to `main` deploys production                                                                                  |
| Production branch         | `main`                                                                                                                                                                             | Production only changes through a merged PR                                                                                                        |
| Framework, Node           | Next.js; Node 24.x (from `package.json` `engines`)                                                                                                                                 | Matches local development                                                                                                                          |
| Vercel Authentication     | Standard Protection: previews need a Vercel sign-in, production is public                                                                                                          | Previews stay private; production is empty until sign-in (NFR-03) arrives in M2                                                                    |
| Ignored Build Step        | Automatic (the default) in the dashboard; `vercel.json` runs `scripts/vercel-ignore.mts`                                                                                           | The file is the only rule                                                                                                                          |
| Deploy rule               | A push skips its deployment only when every changed file is on the invisible list in `scripts/vercel-ignore.mts`. `po-preview` always deploys. If GitHub can't be read, it deploys | Plan, docs, test and CI changes nobody can see don't deploy, and a docs-only merge doesn't redeploy production                                     |
| `KINSCAPE_GIT_READ_TOKEN` | Fine-grained token for `henetiriki/kinscape` only, Contents read-only; Sensitive, Production and Preview; expires after 90 days; the owner rotates it                              | The script reads the changed files from the GitHub API, as Vercel's clone has no remote. Once it expires every push deploys until a new one is set |

## Accounts and access

| Who                       | Access               | Notes                                                                                                                                                           |
| ------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tech lead (@henetiriki)   | Owner                | Applies settings; merges                                                                                                                                        |
| Product owner             | Collaborator (write) | Personal repos can't grant less than write; the ruleset stops direct pushes to `main`                                                                           |
| Claude (`henetiriki-bot`) | Bot account          | Runs the Spec agent and `@claude` in GitHub Actions, using the `CLAUDE_CODE_OAUTH_TOKEN` and `KINSCAPE_BOT_PAT` secrets. The Claude GitHub App is not installed |
