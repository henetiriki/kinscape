# Repository settings

GitHub settings live outside git, so we keep them **as code** instead:

- `scripts/setup-github.sh` applies them (labels, milestones, repo settings, ruleset, security).
- `scripts/github/ruleset-main.json` defines the ruleset protecting `main`.
- `scripts/check-github.sh` checks the live settings against them and fails on any drift.

**To change a setting:** edit the script or JSON in a PR, then after merge the tech lead runs `./scripts/setup-github.sh` followed by `./scripts/check-github.sh`. Don't change settings by hand in the GitHub UI. If you have to (e.g. in an emergency), follow up with a PR so the scripts match again.

## What's set and why

| Setting | Value | Why |
|---|---|---|
| Merge methods | Squash only | One commit on `main` per PR; linear history |
| Squash commit message | PR title + commit messages | Keeps each PR's `plan(…): approved by @…` line in `main`'s history |
| Delete branch on merge | On | No stale branches |
| Suggest updating PR branches, auto-merge | On | Branches stay current; auto-merge is ready for when CI exists |
| Wiki, Projects, Discussions | Off | Fewer places for the PO to look. Work lives in Issues |
| Ruleset *Protect main* | No deletion, no force push, linear history, PR required | `main` only changes through a reviewed PR |
| Required approvals | 1, stale approvals dismissed, conversations resolved | PO approval of a product PR is their recorded sign-off |
| Bypass | Repository admin, **via PR only** | The tech lead can merge chore PRs (you can't approve your own PR). Every bypass is logged |
| Required status checks | _Not yet_ | Added in M0.2 once CI exists |
| Dependabot alerts and security fixes | On | Free on private repos |
| Actions token | Read-only; can't approve PRs | Least privilege; an agent's workflow can't approve its own PR |

## Accounts and access

| Who | Access | Notes |
|---|---|---|
| Tech lead (@henetiriki) | Owner | Applies settings; merges |
| Product owner | Collaborator (write) | Personal repos can't grant less than write; the ruleset stops direct pushes to `main` |
| Claude GitHub App | Not installed | Agents work through the tech lead's local Claude Code session |
