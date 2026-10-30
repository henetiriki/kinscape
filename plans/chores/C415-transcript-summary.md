# Plan: C415: Keep secrets out of Claude's transcript artifacts

- **Spec:** #415
- **Status:** approved

## Approach

`agent-transcript.mts` gains a CLI that writes `parseTranscript`'s result, and `readSummary`, which `run-summary.mts` and `denial-audit.mts` call. After Claude runs, `run-claude` and `claude-code-review.yml` sparse-check out main's `scripts`, write the summary as `claude-execution-output.json` in its own folder, scan it with gitleaks, and upload it for 7 days if clean. No transcript writes nothing: the since-last-review check still works.

## Decisions

**D1 · Transcripts uploaded before the change** · Decides: Tech lead

Old artifacts last 14 days; callers run the old `run-claude` until its pin PR merges.

- ~~**A.** `readSummary` also reads a transcript array.~~
- ~~**B.** Summaries only: those runs show "No output", and the audit skips them.~~
- **Other:** your own.

**Answer: Other** (Tech lead): B; old transcripts are deleted, so the audit's gap is 7 days, not 14.

**D2 · Paths outside the workspace** · Decides: Tech lead

- **A.** `//proc/**`, `//sys/**`, `//etc/**`, `//home/runner/work/_temp/**` (runner temp), `~/.gitconfig`, `~/.config/**`.
- ~~**B.** `//proc/**` and the runner temp only.~~
- **Other:** your own.

**Answer: A** (Tech lead). `/tmp` and `~/.claude`, holding Claude Code's saved output, stay readable.

**D3 · A gitleaks hit or error** · Decides: Tech lead

**Answer:** no upload; `github.token` comments a :rotating_light: warning on the thread. The job's result stands.

## Files that change

| File                                                                                | What                                    |
| ----------------------------------------------------------------------------------- | --------------------------------------- |
| `scripts/{agent-transcript,run-summary,denial-audit}.mts`, their tests              | CLI, `readSummary`; readers use it      |
| `.github/actions/run-claude/action.yml`, `.github/workflows/claude-code-review.yml` | Summarise, scan, upload 7 days; comment |
| `.github/agent/{settings,review-settings}.json`                                     | Deny rules                              |
| `scripts/__tests__/load-agent-files.test.ts`                                        | Upload steps                            |
| `scripts/__tests__/agent-settings.test.ts`                                          | New: deny rules                         |

## Risks

- Deny rules aren't a boundary: `git diff --no-index` still reads any file. The artifact change protects the PAT.

## Proof

| Acceptance check                 | Proven by                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Upload holds only summary fields | `agent-transcript.test.ts`: only `Transcript` keys; a `tool_result`'s text gone |
| Readers use the summary          | `run-summary`, `denial-audit` tests                                             |
| Only a clean scan uploads        | `load-agent-files.test.ts`                                                      |
| Deny rules kept                  | `agent-settings.test.ts`                                                        |
| Checks pass                      | Lint, format, tests, boundaries                                                 |
