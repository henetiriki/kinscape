# Plan: C408: Name the repo and bot through variables, not literals

- **Spec:** #408
- **Status:** approved

## Approach

Workflows read `vars.KINSCAPE_BOT_LOGIN` and `vars.KINSCAPE_BOT_ID`; `run-claude` takes them as `bot_login` and `bot_id` inputs; shell steps get them through `env:`. `actions-pin-update.yml`'s regex takes `github.repository`. As only `setup-github.sh` may hold the values, `check-github.sh` checks that the login is set and the id is GitHub's for it. A new test runs the acceptance check's `git grep`.

## Decisions

**D1 · Where `vercel-ignore.mts` reads the repo** · Decides: Tech lead · **Answer: Other** (tech lead)

`KINSCAPE_REPO_SLUG`, an `owner/name` Vercel env var. Unset, every push deploys.

- ~~**A.** `KINSCAPE_REPO`, as the chore says.~~
- ~~**B.** Vercel's `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG`.~~

**D2 · Variables not yet set** · Decides: Tech lead · **Answer: A** (tech lead)

`claude.yml` also requires `vars.KINSCAPE_BOT_LOGIN != ''`, so it fails closed.

- ~~**B.** The tech lead runs this branch's `setup-github.sh` before merging.~~

## Files that change

| File                                                 | What                                 |
| ---------------------------------------------------- | ------------------------------------ |
| `.github/actions/run-claude/action.yml`              | Bot inputs                           |
| `claude.yml`, `claude-build.yml`                     | `run-name` and `if:`; inputs         |
| `claude-run.yml`                                     | Inputs; safety-net author filter     |
| `design-agent-shots.yml`, `actions-pin-update.yml`   | Git identity; pin regex and comment  |
| `scripts/vercel-ignore.mts` and its test             | Repo from `KINSCAPE_REPO_SLUG` (D1)  |
| `scripts/setup-github.sh`, `scripts/check-github.sh` | Default repo, `$REPO/*`, variables   |
| `docs/repo-settings.md`                              | The variables and the Vercel env var |
| `scripts/__tests__/plan-pr-condition.test.ts`        | `WHOLE` starts at the bot variable   |
| `scripts/__tests__/load-agent-files.test.ts`         | Callers pass the bot inputs          |
| `scripts/__tests__/repo-names.test.ts`               | New: the grep check                  |

## Order of work

1. Grep test; see it fail.
2. Workflows, action, scripts, tests, docs.

## Risks

- Unchecked (no web access): `vars` in `run-name`. The first `@claude` run's title proves it.
- Callers pin `run-claude` and `claude-run.yml` by SHA, so changes apply after the pin PRs.
- `check-github.sh` sorts the allowed list, as `$REPO/*` moves.

## Proof

| Acceptance check                                  | Proven by             |
| ------------------------------------------------- | --------------------- |
| Grep finds only the allowed lines                 | `repo-names.test.ts`  |
| Lint, format, tests, boundaries, e2e, `words`     | Output in the PR      |
| Setup, check, `@claude` reply, bot comment, build | Tech lead, post-merge |

## Deviations

- `run-claude` stops first on empty bot inputs, which covers `claude-plan.yml`.
