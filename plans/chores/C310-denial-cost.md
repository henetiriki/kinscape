# Plan: C310: The denial audit's cost is an API-price estimate

- **Spec:** #310
- **Status:** approved

## Approach

`parseTranscript` gives each denial a `costUsd`: its turn's share of the run's cost. A turn is the `assistant` events sharing one `message.id`, counted once, since each event repeats the turn's `usage`. A turn's weight is its tokens times fixed ratios: input 1, cache write 1.25 (1-hour writes 2), cache read 0.1, output 5. Runs mixing models split each model's `result.modelUsage[model].costUSD` among that model's turns; without `modelUsage`, the run's `total_cost_usd` is split. A turn with two denied calls splits its share between them.

The audit's first line says, both labelled estimates at API prices: the cost of all runs read, and the denied calls' cost as a share of the cost of the runs that had denials. The table gains a **Cost** column per pattern.

## Decisions

**D1 · Count the turn after each denial?** · Decides: Tech lead

- **A.** No: only the turn that made the denied call; the line says it is a lower bound.
- **B.** Yes: add the next turn, which usually retries or rewords.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                        | What                              |
| ------------------------------------------- | --------------------------------- |
| `scripts/types.ts`                          | `Denial` gains optional `costUsd` |
| `scripts/agent-transcript.mts` and its test | Allocate each denial's cost       |
| `scripts/denial-audit.mts` and its test     | Both figures, labels, Cost column |

## Order of work

1. Commit this plan: `plan(C310): approved by @henetiriki`.
2. Transcript allocation with tests, then the audit; lint, `npm test`, `npm run words`.

## Risks

`modelUsage` and `cache_creation` are checked against run 40306375255's artifact before building; if absent, the fallbacks above apply.

## Deviations

- The artifact couldn't be downloaded in the build, so the `modelUsage` and `cache_creation` shapes are unchecked; the fallbacks cover their absence.
- Both cost figures sit in a second paragraph after the first line, not in it.
