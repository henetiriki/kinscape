# Plan: C610: Required checks name the app that reports them; check-github covers more settings

- **Chore:** #610
- **Status:** approved

## Approach

`ruleset-main.json` gives each required check an `integration_id` (GitHub Actions `15368`, Codecov `254`) and lists `require_extra_approval_for_unattributed_changes: true`. The labels move to `scripts/github/labels.sh`. `check-github.sh` reads `.permissions.admin` once, wraps `gh` so an HTTP 403 prints 🔒 "needs admin", skips the admin-only reads without an admin's token, and compares the checks as `context@app`, each ruleset's bypass actors with its JSON, the extra-approval flag and the labels. Drift alone sets the exit code.

## Decisions

**D1 · Codecov upload** · Decides: Tech lead

- **A.** `use_oidc: true`; the `token` input and `CODECOV_TOKEN` go.
- ~~**B.** Keep the token.~~

**Answer: A** (@henetiriki)

**D2 · Where `id-token: write` lives** · Decides: Tech lead

- **A.** A `coverage` job after `test` that downloads the report and uploads; no project script runs there.
- ~~**B.** On the `test` job.~~

**Answer: A** (@henetiriki)

**D3 · The live `accessibility` label** · Decides: Tech lead

- **A.** Retire it: unused.
- ~~**B.** Keep it.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                                  | What                                  |
| ----------------------------------------------------- | ------------------------------------- |
| `scripts/github/ruleset-main.json`                    | `integration_id`; extra-approval flag |
| `scripts/github/labels.sh` (new), `setup-github.sh`   | Labels in one file                    |
| `scripts/check-github.sh`                             | Admin flag, 403, new comparisons      |
| `.github/workflows/ci.yml`, `README.md` (regenerated) | `coverage` job                        |
| `docs/repo-settings.md`                               | Checks, approvals, labels, secrets    |

## Order of work

1. Scripts and JSON; `bash -n`. The sandbox can't run `gh` from a script: the tech lead runs `check-github.sh` with the agent's token and as admin, for Evidence.
2. `ci.yml`, diagram, docs; lint, `format:check`, `words`, `test`, `validate:boundaries`, e2e.
3. After merge: `setup-github.sh`, both `check-github.sh` runs, delete `CODECOV_TOKEN`; then a status with context `e2e` posted with the agent token on a throwaway PR stays expected from GitHub Actions.

## Risks

- A wrong `integration_id` fails the ruleset PUT.
- Codecov refuses OIDC: `codecov/*` never report; D1 falls back to B.

## Deviations

- Bypass actors are admin-only too: GitHub omits them for other tokens.
