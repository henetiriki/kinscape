# Plan: C575: CI agent runs as a GitHub App

- **Spec:** #575
- **Status:** approved

## Approach

Each job that used `secrets.KINSCAPE_BOT_PAT` gets a step `id: bot` that mints a one-hour token with the pinned `actions/create-github-app-token` from `vars.KINSCAPE_APP_CLIENT_ID` and `secrets.KINSCAPE_APP_PRIVATE_KEY`, right before the first step that needs it, with only the permissions that job needs; `steps.bot.outputs.token` replaces the PAT. The bot variables take the App's bot login and id.

## Decisions

Answered on #575: **D1: Other** (`client-id` from a new variable `KINSCAPE_APP_CLIENT_ID`, set by hand), **D2: B** (the review keeps `claude[bot]`), **D3: A** (the review also runs for the bot's PRs), **D4: A** (only the pin job's token writes workflow files).

## Files that change

| File                                                                                                                                                                         | New / changed | What                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `.github/workflows/claude-run.yml`, `claude-plan.yml`, `claude-build.yml`, `claude-fix-review.yml`, `claude-respond.yml`, `design-agent-shots.yml`, `actions-pin-update.yml` | changed       | mint steps; key input; tokens; comments                              |
| `.github/workflows/claude-code-review.yml`                                                                                                                                   | changed       | D3                                                                   |
| `.github/actions/run-claude/action.yml`                                                                                                                                      | changed       | input descriptions                                                   |
| `scripts/setup-github.sh`, `scripts/check-github.sh`                                                                                                                         | changed       | bot login and id; `[bot]` encoded; App variable and secret checked   |
| `docs/repo-settings.md`                                                                                                                                                      | changed       | variables, secret and bot rows                                       |
| `scripts/__tests__/setup-workspace.test.ts`, `load-agent-files.test.ts`, `repo-names.test.ts`                                                                                | changed       | App token, no key in unblock, new id                                 |
| `scripts/__tests__/app-token.test.ts`                                                                                                                                        | new           | no PAT; each bot job mints first, pinned; workflows write in pin job |

## Order of work

1. Tests first (rule 12); workflows, scripts, docs; checks; PR as the admin, labelled `hand-back`.

## Risks

- The first mint checks the installation and the client id; a failure stops the job before anything runs.
- The collaborators-only policy or the interaction limit may refuse the App's PR (checked after merge).

## Proof

| Acceptance check                              | Proven by           |
| --------------------------------------------- | ------------------- |
| No PAT; each bot job mints its own token      | `app-token.test.ts` |
| Lint, `format:check`, `words`, tests pass     | pasted output       |
| Scripts, plan run, pin run, policy, token age | after merge         |

## Deviations

- Safety net matches the bot's GraphQL login (no `[bot]`) and searches `app/<name>` (review).
- Gate and return tokens get pull-requests write: a stop comments on a PR thread (review).
