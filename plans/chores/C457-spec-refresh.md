# Plan: C457: Refresh a chained Spec against main

- **Spec:** #457
- **Status:** approved

## Approach

`.github/agent/refresh.md` holds the refresh; "Spec" means all three kinds. `agent-unblock.mts` writes `unblocked=[{number, blockers}]` to `$GITHUB_OUTPUT`, only for issues by the owner, a member or a collaborator. A `refresh` job in `claude-unblock.yml` needs `unblock` and runs per issue (matrix, `fail-fast: false`) on `main`, with `github.token` (`contents: read`, `issues: write`). `refresh-settings.json` allows reading and `gh` on issues and PRs, denying label flags.

## Decisions

**D1 · Rule 11 says "Don't edit the issue"** · Decides: Tech lead

- **A.** Its before-drafting check becomes the refresh (one clause).
- **B.** Leave it; `refresh.md` overrides it.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the unblock run's Claude steps live** · Decides: Tech lead

- **A.** Inline, as `claude-code-review.yml` does; tests keep the copies equal.
- **B.** A `settings` input on `run-claude`, in a Chore first: a pin names a main commit.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                         | What                              |
| -------------------------------------------- | --------------------------------- |
| `.github/agent/refresh.md`                   | New                               |
| `.github/agent/refresh-settings.json`        | New                               |
| `.github/workflows/claude-unblock.yml`       | `refresh` job                     |
| `.github/workflows/claude-plan.yml`          | `agent_files`; prompt line        |
| `.github/workflows/README.md`                | `npm run workflows:diagram`       |
| `scripts/agent-unblock.mts`                  | Output; author filter             |
| `scripts/__tests__/agent-unblock.test.ts`    | Those cases                       |
| `scripts/__tests__/load-agent-files.test.ts` | `claude-unblock.yml` in its lists |
| `scripts/__tests__/agent-settings.test.ts`   | `refresh-settings.json`           |
| `plans/README.md`                            | Rule 3 line; rule 11 per D1       |

## Risks

- A failed `gh` call ends the loop before the output: catch per issue, exit 1 at the end.
- Issue text is untrusted: the token can't push or start runs.

## Proof

| Acceptance check                                                                 | Proven by                                                        |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Unblock refreshes; a failure keeps the swap                                      | `agent-unblock.test.ts`; `load-agent-files.test.ts`; fixture run |
| Path fixed and planned; Drift hands back; Behaviour, checks, Decisions untouched | Fixture Specs' runs and body history                             |
| Coverage, lint, format, words, validate                                          | CI                                                               |

## Deviations

- Settings also allow `git ls-files`; deny other `gh issue edit` flags and `git grep -O`.
- No transcript upload (matrix runs would share an artifact).
- Concurrency group `refresh-<n>`: a shared `thread-<n>` drops queued runs.
- Fixture runs happen after merge.
