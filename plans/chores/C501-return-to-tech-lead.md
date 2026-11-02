# Plan: C501: Hand an issue back to the tech lead when a plan or build run ends without handing off

- **Spec:** #501
- **Status:** approved

## Approach

New `scripts/agent-return.mts plan|build <n>` swaps `ready-for-agent` for `ready-for-dev` per the Spec's condition. `agent-approve.mts` sets the label from `go`, skipping `hand-back`, `blocked` or on-target issues; a failed move is logged without changing `go` or the exit code.

## Decisions

**D1 · Where the hand-back after `run` goes** · Decides: Tech lead

For a build, `run`'s workspace is the PR branch, so a step there needs another checkout of `main`.

- **A.** A `return` job after `run` (`if: always()`), with the gate's sparse checkout and `contents: read`; reword the Spec's Trigger.
- **B.** A last step in `run`, as the Spec says.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · The `approve` stop's label is set twice** · Decides: Tech lead

With Spec D2, `agent-approve.mts` sets `ready-for-dev` on `go=false`, so the script called there never acts.

- **A.** No extra step; reword that done check to "sets `ready-for-dev`".
- **B.** Call it anyway (Spec D1).
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                          | What                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `scripts/agent-return.mts` + test (new)       | The Spec's cases                               |
| `scripts/agent-approve.mts` + test            | Label by outcome                               |
| `scripts/issue-status.mts` + test             | Drop row 2; its tests expect no move (rule 10) |
| `claude-run.yml`                              | D1; gate step when a build stops               |
| `claude-build.yml`, workflows `README.md`     | Notes                                          |
| `plans/README.md`, `.github/agent/refresh.md` | The Spec's deletes                             |

## Order of work

1. `agent-return` test first, then the script.
2. `agent-approve` and `issue-status` in one commit.

## Risks

- The bot's label starts a skipped `claude-plan.yml` run.

## Proof

| Check                                | By                          |
| ------------------------------------ | --------------------------- |
| Script, approve and status cases     | Unit tests                  |
| Gate stop, plan drift, stopped build | Runs linked on #501         |
| Coverage, words                      | `npm test`, `npm run words` |

## Deviations

- `return` skips a cancelled `run`: a newer run follows.
- Callers pin `claude-run.yml`, so the run proofs follow the merge and the pin PR, linked on #501.
