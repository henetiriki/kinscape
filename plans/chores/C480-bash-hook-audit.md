# Plan: C480: Hook the agents' shell denials and show which workflow and rule each audit row hits

- **Spec:** #480
- **Status:** approved

## Approach

One `jq` program, inline as the Bash `PreToolUse` hook in both settings files, reads the command up to its first `<<` (a heredoc body is text). A leading `cd <cwd>` then `;` or `&&` is cut: it returns `updatedInput` and an `additionalContext` marker, with no `permissionDecision`, so the rules still judge the rest. Any other `cd`, or a listed program at command position (`cat`, `grep`, `head`, `ls`, `sed` not after a single `|`, where they filter output), gets `deny` with a reason naming the alternative.

The audit shows each pattern's workflows and settings rule.

## Decisions

**D1 · How a strip is counted** · Decides: Tech lead

- **A.** `agent-transcript.mts` counts Bash calls starting `cd <init cwd>` that weren't denied; the summary gains `stripped`.
- **B.** Count the marker, if it reaches the transcript.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                  | What                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `.github/agent/settings.json`, `review-settings.json` | The hook                                                      |
| `.github/agent/rules.md`                              | Drop what the hook says                                       |
| `scripts/types.ts`                                    | `Transcript` gains `stripped`                                 |
| `scripts/agent-transcript.mts` and its test           | Count strips; hook denials if `permission_denials` omits them |
| `scripts/denial-audit.mts` and its test               | Workflow, settings status, suggestion, stripped line          |
| `scripts/__tests__/agent-settings.test.ts`            | Copies equal; hook cases via `bash -c`                        |
| `scripts/__tests__/run-summary.test.ts`               | Fixture gains `stripped`                                      |

## Risks

- If `updatedInput` needs `allow`, the rest would skip the allowlist: stop (rule 6).
- Agents `cd`-ing elsewhere keep a `Bash: cd` row.

## Proof

| Acceptance check                | Proven by                |
| ------------------------------- | ------------------------ |
| Hook, copies equal              | `agent-settings.test.ts` |
| Audit rows                      | `denial-audit.test.ts`   |
| `rules.md` no longer repeats it | The diff                 |
| Next weekly audit               | Its issue                |

## Deviations

- Checked locally with `claude -p`: hook denials are in `permission_denials`, and `cd <cwd>; curl x` is still denied by the allowlist. No transcript fallback.
- The audit runs the hook to show `denied by the hook`.
