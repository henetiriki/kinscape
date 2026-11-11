# Repository settings

GitHub settings live outside git, so we keep them **as code** instead:

- `scripts/setup-github.sh` applies them (labels, milestones, autolinks, repo settings, ruleset, security).
- `scripts/github/ruleset-main.json` defines the ruleset that protects `main`.
- `scripts/check-github.sh` checks the live settings against them and fails on any drift. Run without a repo admin's token, it shows each setting it can't read as 🔒 instead.

**To change a setting:** edit the script or JSON in a PR. After the PR merges, the tech lead runs `./scripts/setup-github.sh` followed by `./scripts/check-github.sh`. Don't change settings by hand in the GitHub UI. If you have to (for example in an emergency), open a PR afterwards so the scripts match again.

[Infrastructure](infrastructure.md) lists the Vercel and Supabase settings.

## What's set and why

| Setting                                  | Value                                                                                                                      | Why                                                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge methods                            | Squash only                                                                                                                | One commit on `main` per PR; linear history                                                                                                                                              |
| Squash commit message                    | PR title + commit messages                                                                                                 | Keeps each PR's `plan(…): approved by @…` line in `main`'s history                                                                                                                       |
| Delete branch on merge                   | On                                                                                                                         | No stale branches                                                                                                                                                                        |
| Suggest updating PR branches, auto-merge | On                                                                                                                         | Branches stay current; nothing auto-merges ([Dependencies](dependencies.md))                                                                                                             |
| Wiki, Projects, Discussions              | Off                                                                                                                        | Fewer places for the PO to look. Work lives in Issues                                                                                                                                    |
| Issue and PR creation                    | Collaborators only                                                                                                         | The repo is public; outsiders can read and fork but not open issues or PRs                                                                                                               |
| Interaction limit                        | Collaborators only, six months                                                                                             | Covers comments; GitHub drops it after six months. `setup-github.sh` records the expiry; `backlog-interaction-limit.yml` opens a Chore and `check-github.sh` fails 30 days before        |
| Ruleset _Protect main_                   | No deletion, no force push, linear history, PR required                                                                    | `main` only changes through a PR a code owner has approved                                                                                                                               |
| Required approvals                       | 1, stale approvals dismissed, conversations resolved, an extra approval when a commit's author isn't its pusher            | One approval from the PO or the tech lead is enough for now                                                                                                                              |
| Last-push approval, up-to-date branches  | Required                                                                                                                   | A push after approval needs a fresh approval; checks run on what will merge                                                                                                              |
| Rulesets _Protect po-preview_, _Tags_    | No deleting `po-preview`; no creating, changing or deleting tags                                                           | `po-preview` (the PO's link) can't be deleted; release tags only move by the tech lead                                                                                                   |
| Code-owner review                        | Required; `.github/CODEOWNERS` covers every path                                                                           | Every PR needs the PO's or the tech lead's approval; the lines after the catch-all need the tech lead's and are the hand-back paths. The tech lead's bypass still works                  |
| Bypass                                   | Repository admin, **via PR only**                                                                                          | The tech lead can merge their own PRs (you can't approve your own PR). The log records every bypass                                                                                      |
| Required status checks                   | The contexts in `scripts/github/ruleset-main.json`, each from the app its `integration_id` names (GitHub Actions, Codecov) | Nothing merges with a red check, and only the named app's report counts                                                                                                                  |
| Dependabot alerts and security fixes     | On                                                                                                                         | Vulnerable dependencies are flagged and fixed by PR                                                                                                                                      |
| Secret scanning, push protection         | On                                                                                                                         | A secret is flagged, and blocked at push                                                                                                                                                 |
| Private vulnerability reporting          | On                                                                                                                         | Outsiders report privately ([SECURITY.md](../SECURITY.md))                                                                                                                               |
| Actions token                            | Read-only; can't approve PRs                                                                                               | Least privilege; an agent's workflow can't approve its own PR                                                                                                                            |
| Actions pinned to a full SHA             | Required                                                                                                                   | A moved tag can't change what runs                                                                                                                                                       |
| Allowed actions                          | GitHub's, this repo's, `claude-code-action`, `codecov-action`, `setup-bun`                                                 | A new third-party action, or one an allowed action calls (`setup-bun` is `claude-code-action`'s), needs a PR to this list                                                                |
| Secrets and variables                    | The names in [_Secrets and variables_](#secrets-and-variables)                                                             | Each job that acts as the bot mints a one-hour token from the App's key with only the permissions it needs (`actions/create-github-app-token`). The repo stores no personal access token |
| Labels                                   | The list in `scripts/github/labels.sh`, and no other                                                                       | `setup-github.sh` creates them and deletes the retired ones; `check-github.sh` compares                                                                                                  |
| Autolinks                                | One per requirement ID prefix, from `docs/requirements.md`; the URL names `main` and ends in its `#map-03`-style anchors   | A bare `MAP-03` in an issue, PR or commit links to its row                                                                                                                               |
| Code scanning                            | CodeQL default setup                                                                                                       | Free on a public repo; flags vulnerable code in PRs                                                                                                                                      |
| Fork PR workflow runs                    | Need approval, for all outside contributors                                                                                | An outsider's PR runs nothing until the team approves it                                                                                                                                 |

## Secrets and variables

`scripts/check-github.sh` lists the names (`expected_secrets`, `expected_variables`). It fails on a missing or extra name. It reads names only, never a value.

| Names                                                                | Set by                 | Read by                                                           |
| -------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| Variables `KINSCAPE_BOT_LOGIN`, `KINSCAPE_BOT_ID`                    | `setup-github.sh`      | Workflows and the `run-claude` action, for the bot's login and id |
| Variable `KINSCAPE_TEAM_LOGINS`                                      | `setup-github.sh`      | The `run-claude` action: whose comments the agents read           |
| Variable `KINSCAPE_INTERACTION_LIMIT_EXPIRES`                        | `setup-github.sh`      | `backlog-interaction-limit.yml`, to open a Chore 30 days before   |
| Variable `KINSCAPE_APP_CLIENT_ID`, secret `KINSCAPE_APP_PRIVATE_KEY` | The tech lead, by hand | Each job that acts as the bot                                     |
| Secret `CLAUDE_CODE_OAUTH_TOKEN`                                     | The tech lead, by hand | The Claude workflows, for the model                               |

Codecov needs no secret: `ci.yml`'s `coverage` job uploads with its own OIDC token.

## Accounts and access

### People

| Who                     | Access               | Notes                                                                                 |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| Tech lead (@henetiriki) | Owner                | Applies settings; merges                                                              |
| Product owner           | Collaborator (write) | Personal repos can't grant less than write; the ruleset stops direct pushes to `main` |

### Apps

| App                            | Access                                  | Notes                                                                                                           |
| ------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Claude (`kinscape-agent[bot]`) | GitHub App, installed on this repo only | Runs the CI agent and `@claude`. Permissions: Contents, Issues, Pull requests and Workflows write; Actions read |
