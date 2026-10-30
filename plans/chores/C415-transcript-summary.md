# Plan: C415: Keep secrets out of Claude's transcript artifacts

- **Spec:** #415
- **Status:** draft

## Approach

`agent-transcript.mts` gains a CLI that writes `parseTranscript`'s result, and `readSummary`, which `run-summary.mts` and `denial-audit.mts` call. After Claude runs, `run-claude` and `claude-code-review.yml` sparse-check out main's `scripts` into a subfolder, write the summary as `claude-execution-output.json` in its own folder, and upload that for 7 days. No transcript writes nothing, so the since-last-review check still works. The `run-summary` action is unchanged.

## Decisions

**D1 · Transcripts uploaded before the change** · Decides: Tech lead

Old artifacts last 14 days, and callers run the old `run-claude` until its pin PR merges.

- **A.** `readSummary` also reads a transcript array.
- **B.** Summaries only: those runs show "No output", and the audit skips them.
- **Other:** your own.

Recommended: A: one line.

**D2 · Paths outside the workspace** · Decides: Tech lead

- **A.** `//proc/**`, `//sys/**`, `//etc/**`, `//home/runner/work/_temp/**` (runner temp: checkout's credentials, settings, transcript), `~/.gitconfig`, `~/.config/**`.
- **B.** `//proc/**` and the runner temp only.
- **Other:** your own.

Recommended: A. Neither denies `/tmp` or `~/.claude`, where Claude Code saves long tool output for `Read`.

## Files that change

| File                                                                                | What                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `scripts/{agent-transcript,run-summary,denial-audit}.mts`, their tests              | CLI, `readSummary`; readers use it       |
| `.github/actions/run-claude/action.yml`, `.github/workflows/claude-code-review.yml` | Summarise, upload 7 days; comment        |
| `.github/agent/settings.json`                                                       | Deny rules                               |
| `scripts/__tests__/load-agent-files.test.ts`                                        | Upload path, retention, script from main |
| `scripts/__tests__/agent-settings.test.ts`                                          | New: deny rules                          |

## Risks

- Not a boundary: `git diff --no-index` or an edited npm script still reads any file. The artifact change is what protects the PAT.
- Transcripts uploaded already stay downloadable after the flip: the tech lead deletes them first.

## Proof

| Acceptance check                 | Proven by                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Upload holds only summary fields | `agent-transcript.test.ts`: fixture with a `tool_result`; only `Transcript` keys, its text gone |
| Readers use the summary          | `run-summary`, `denial-audit` tests                                                             |
| Deny rules kept                  | `agent-settings.test.ts`                                                                        |
| Checks pass                      | Lint, format, tests, boundaries, e2e output                                                     |

## Out of scope

`review-settings.json`: the issue names `settings.json` only.
