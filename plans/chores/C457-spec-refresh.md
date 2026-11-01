# Plan: C457: Refresh a chained Spec against main

- **Spec:** #457
- **Status:** approved

## Approach

`.github/agent/refresh.md` holds the refresh as #457 words it; "Spec" means all three kinds, as in `docs/building.md`. `agent-unblock.mts` writes `unblocked=[{number, blockers}]` to `$GITHUB_OUTPUT`, only for issues by the owner, a member or a collaborator. A `refresh` job in `claude-unblock.yml` needs `unblock` and runs per issue (matrix, `fail-fast: false`, concurrency `thread-<n>`) on `main`, with `github.token` (`contents: read`, `issues: write`), whose edits start no run. `refresh-settings.json` allows Read, `git grep`, `gh issue view|edit|comment` and `gh pr view|diff`, denying label flags. `claude-plan.yml` loads `refresh.md` and refreshes first.

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

| Acceptance check                            | Proven by                                                        |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Unblock refreshes; a failure keeps the swap | `agent-unblock.test.ts`; `load-agent-files.test.ts`; fixture run |
| Path fixed and planned; Drift hands back    | Fixture Specs' runs                                              |
| Behaviour, checks, Decisions untouched      | Those runs' body history                                         |
| Coverage, lint, format, words, validate     | CI                                                               |
