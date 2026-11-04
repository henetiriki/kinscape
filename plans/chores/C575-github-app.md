# Plan: C575: CI agent runs as a GitHub App

- **Spec:** #575
- **Status:** approved

## Approach

Each job that used `secrets.KINSCAPE_BOT_PAT` gets a step `id: bot` that mints a one-hour token with the pinned `actions/create-github-app-token` from `vars.KINSCAPE_APP_CLIENT_ID` and `secrets.KINSCAPE_APP_PRIVATE_KEY`, right before the first step that needs it, with only the permissions that job needs; `steps.bot.outputs.token` replaces the PAT. `claude-run.yml`'s `secrets:` input becomes `KINSCAPE_APP_PRIVATE_KEY`. The bot variables take the App's bot login and id. Hand-back: code-owner paths (rule 13).

## Decisions

Answered on #575: **D1: Other** (`client-id` from a new variable `KINSCAPE_APP_CLIENT_ID`, set by hand), **D2: B** (the review keeps `claude[bot]`), **D3: A** (the review also runs for the bot's PRs).

## Files that change

| File                                                                                                                                                                         | New / changed | What                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `.github/workflows/claude-run.yml`, `claude-plan.yml`, `claude-build.yml`, `claude-fix-review.yml`, `claude-respond.yml`, `design-agent-shots.yml`, `actions-pin-update.yml` | changed       | mint steps; the key as input; tokens; comments                       |
| `.github/workflows/claude-code-review.yml`                                                                                                                                   | changed       | D3                                                                   |
| `scripts/setup-github.sh`, `scripts/check-github.sh`                                                                                                                         | changed       | bot login and id; `[bot]` encoded; `KINSCAPE_APP_CLIENT_ID` checked  |
| `docs/repo-settings.md`                                                                                                                                                      | changed       | variables, secret and bot rows                                       |
| `scripts/__tests__/setup-workspace.test.ts`, `load-agent-files.test.ts`, `repo-names.test.ts`                                                                                | changed       | App token, no key in unblock, new id                                 |
| `scripts/__tests__/app-token.test.ts`                                                                                                                                        | new           | no PAT; each bot job mints first, pinned; workflows write in pin job |

## Order of work

1. Record the answers on #575; commit the plan. Tests first (rule 12).
2. Workflows, scripts, docs; lint, `format:check`, `words`, `typecheck`, tests. PR as the admin, labelled `hand-back`.

## Risks

- A user token can't list App installations: the first mint is the check, and fails its job before anything runs; so does an unset `KINSCAPE_APP_CLIENT_ID`.
- The collaborators-only policy or the interaction limit may refuse the App's PR: confirmed after merge.

## Proof

| Acceptance check                              | Proven by           |
| --------------------------------------------- | ------------------- |
| No PAT; each bot job mints its own token      | `app-token.test.ts` |
| Lint, `format:check`, `words`, tests pass     | pasted output       |
| Scripts, plan run, pin run, policy, token age | after merge         |

## Out of scope

Deleting the PAT and `KINSCAPE_APP_ID`, revoking tokens, removing `henetiriki-bot`: one by one on approval.
