# Plan: C443: Label hand-back PRs

- **Spec:** #443
- **Status:** approved

## Approach

The workflow checks out the base SHA and runs `node scripts/hand-back.mts "$PR"`. The script reads `isCrossRepository`, `headRefOid` and `labels` (`gh pr view`), stopping on a fork or an existing label. It lists the changed files (`gh api --paginate`), fetches each changed `plans/**` file at `headRefOid` through `gh api`, and takes the backticked paths in its table's first column. A path matching base CODEOWNERS, apart from `EXEMPT`, adds the label; the log names it. The matcher handles `*`, `**`, `?` and a leading or no `/`, and throws on other syntax.

## Decisions

**D1 · A failed `gh` call** · Decides: Tech lead

- **A.** Log it and exit 1, so the run is red; a failed plan fetch still falls back to the diff.
- **B.** Log a warning and exit 0.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                     | What                                                |
| ---------------------------------------- | --------------------------------------------------- |
| `scripts/hand-back.mts`                  | New: matcher, `EXEMPT`, `run`                       |
| `scripts/__tests__/hand-back.test.ts`    | New: the issue's cases                              |
| `.github/workflows/claude-hand-back.yml` | New                                                 |
| `.github/workflows/README.md`            | `npm run workflows:diagram`                         |
| `.github/workflows/claude-plan.yml`      | Line 77 deleted                                     |
| `.github/agent/build.md`                 | Line 10 shortened; line 5's `--json` gains `labels` |
| `plans/README.md`                        | Rule 13: the marker sentence links the workflow     |
| `.github/CODEOWNERS`                     | Sorted; adds the script                             |
| `scripts/setup-github.sh`                | The `hand-back` label                               |

## Risks

- Adding the label fails until `setup-github.sh` creates it: run that after merge.
- This PR's base lacks the script, so its own runs fail.
- A PR can edit its own copy of the workflow; code-owner review is the guard.

## Proof

| Acceptance check                                                       | Proven by                                   |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| Diff and plan-table matches (#426); no match, exempt only, rerun, fork | `hand-back.test.ts`                         |
| CODEOWNERS globs; `gh` failure caught and logged                       | `hand-back.test.ts`, the real file included |
| Coverage, words, lint, format, diagram                                 | `npm test`, `npm run words`, CI             |
| Next hand-back plan PR labelled                                        | Its run, linked in its body                 |

## Deviations

- The diff is checked before any plan is fetched; the label goes on with `gh api`.
