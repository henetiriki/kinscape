# Plan: C601: agents read collaborator comments only; interaction-limit reminder

- **Spec:** #601
- **Status:** approved

## Approach

`claude-code-action` v1.0.266 filters comments, reviews and review comments by `include_comments_by_actor` (bots as `name[bot]`); the trigger comment is separate. `run-claude` gets a `team_logins` input from a new variable `KINSCAPE_TEAM_LOGINS`, adds `bot_login`, and stops when it is empty. `setup-github.sh` sets it through a helper `check-github.sh` shares, and records the limit's `expires_at` from the PUT reply as `KINSCAPE_INTERACTION_LIMIT_EXPIRES`. A weekly workflow (`issues: write`) opens a Chore when that date is under 30 days away or unset, once per open title.

## Decisions

**D1 · Which logins** · Decides: Tech lead

- ~~**A.** CODEOWNERS' catch-all line (owner, PO); `henetiriki-bot` excluded.~~
- **B.** Every write collaborator (adds `henetiriki-bot`).

**Answer: B** (@henetiriki)

**D2 · The variable** · Decides: Tech lead

- **A.** The expiry GitHub returns.
- ~~**B.** The date set; the workflow adds six months.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                                     | New / changed | What                                       |
| -------------------------------------------------------- | ------------- | ------------------------------------------ |
| `.github/actions/run-claude/action.yml`, its test        | changed       | `team_logins` input, filter, check         |
| `.github/workflows/claude-respond.yml`, `claude-run.yml` | changed       | Pass the variable                          |
| `.github/agent/rules.md`, `build.md`, `respond.md`       | changed       | `--jq` association filter; others not read |
| `scripts/github/team-logins.sh`                          | new           | Logins of the write collaborators          |
| `scripts/setup-github.sh`, `check-github.sh`             | changed       | Set and check both variables               |
| `.github/workflows/backlog-interaction-limit.yml`        | new           | Weekly reminder Chore                      |
| `.github/workflows/README.md`                            | changed       | `npm run workflows:diagram`                |
| `docs/repo-settings.md`                                  | changed       | Limit row; two variable rows               |

## Order of work

1. Helper, scripts, docs row.
2. Action and callers; prompts.
3. Workflow; regenerate README.

## Risks

- A run without the variable stops at the check: the tech lead sets it before merge.
- The filter runs only after the pin PR merges.

## Proof

| Acceptance check              | Proven by                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| Only the team's comments read | After the pin PR, `@claude` names the authors it sees      |
| Prompts filter                | Diff                                                       |
| Variables set and checked     | Both scripts' output in Evidence                           |
| Reminder once                 | `workflow_dispatch` twice with a near date in the variable |
| Checks pass                   | Evidence                                                   |

## Deviations

- The action's test follows the renamed check step.
