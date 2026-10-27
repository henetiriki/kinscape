# Plan: C310: The denial audit's cost is an API-price estimate

- **Spec:** #310
- **Status:** approved

## Approach

`parseTranscript` gives each denial a `costUsd`: its turn's share of the run's cost. A turn is the `assistant` events sharing one `message.id`, counted once. A turn's weight is its tokens times fixed ratios: input 1, cache write 1.25 (1-hour writes 2), cache read 0.1, output 5, with output scaled so the turns sum to the output tokens the result reports. Runs mixing models split each model's `result.modelUsage[model].costUSD` among that model's turns; a turn whose model has no entry splits the run's `total_cost_usd`. A turn with two denied calls splits its share between them.

The audit's first line says, both labelled estimates at API prices: the cost of all runs read, and the denied calls' cost as a share of the cost of the runs that had denials. The table gains a **Cost** column per pattern.

## Decisions

**D1 · Count the turn after each denial?** · Decides: Tech lead

- **A.** No: only the turn that made the denied call; the line says it is a lower bound.
- **B.** Yes: add the next turn, which usually retries.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                        | What                              |
| ------------------------------------------- | --------------------------------- |
| `scripts/types.ts`                          | `Denial` gains optional `costUsd` |
| `scripts/agent-transcript.mts` and its test | Allocate each denial's cost       |
| `scripts/denial-audit.mts` and its test     | Both figures, labels, Cost column |

## Order of work

1. Commit this plan.
2. Transcript allocation with tests, then the audit.

## Risks

If `modelUsage` or `cache_creation` is absent, the fallbacks apply.

## Deviations

- Output is scaled because an event's `output_tokens` is a snapshot from the start of the turn: run 40306375255's sum 937, against 4,936 reported.
- Without `tool_use_id` no denial has a cost, so the issue states how many denials couldn't be linked.
- Both cost figures sit in a second paragraph, not the first line.
