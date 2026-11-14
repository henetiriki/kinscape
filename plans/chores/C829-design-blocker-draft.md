# Plan: C829: Send a Spec freed by a design change back to draft

- **Spec:** #829
- **Status:** approved

## Approach

In `agent-unblock.mts`, a freed `type: spec` issue gets a design check before its comment and label edit. A failed `gh` call throws into the loop's `catch` and leaves `status: blocked`. The blockers are those the refresh output lists. A helper, `designBlockers`, finds their merged PRs (D5) and reads files with `--paginate --jq '.[].filename'`. A helper, `refineArg`, reads the Intent box (D6).

## Decisions

**D5 · Merged PRs** · Decides: Tech lead

The repo has 478 merged PRs.

- **A.** One `gh pr list --state merged --limit 1000` call per run. An older PR counts as no design change.
- **B.** One `--search <blocker>` call for each blocker. No cap.
- **Other:** your own.

**Answer: A** (@henetiriki). #829 names the cap.

**D6 · A readable Intent box** · Decides: Tech lead

The box is untrusted text in a comment.

- **A.** Only `#<n>` or `M<n>` is readable.
- **B.** Any first line, in backticks.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D7 · Word budget** · Decides: Tech lead

Line 97 takes `docs/how-we-work.md` to 958 words. The budget is 950.

- **A.** Raise it to 960.
- **B.** Cut 8 words elsewhere.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                             | New / changed | What                                   |
| ---------------------------------------------------------------- | ------------- | -------------------------------------- |
| `scripts/agent-unblock.mts`                                      | Changed       | Helpers, `draft`, header comment       |
| `scripts/__tests__/agent-unblock.test.ts`                        | Changed       | Fake reads PRs, files, body; new tests |
| `.github/workflows/claude-unblock.yml`                           | Changed       | Header comment                         |
| `docs/how-we-work.md`                                            | Changed       | Line 97                                |
| `scripts/word-count.mts`, `scripts/__tests__/word-count.test.ts` | Changed       | Budget 960 (D7)                        |

## Risks

- Hand-back paths: the tech lead builds ([hand-back rule](../README.md#hand-back)).
- A drafted Spec's open plan PR still gets "approve the plan again". Likelihood: low, because the gate stops plans while blocked. Fix: one condition.

## Proof

| Acceptance check                                     | Proven by        |
| ---------------------------------------------------- | ---------------- |
| Each given check                                     | One test each    |
| Line 97 matches                                      | Review           |
| `test`, `lint`, `typecheck`, `format:check`, `words` | CI               |
| The next design Spec gives `draft`                   | Tech lead, there |

## Deviations

- `scripts/word-count.mts` changes: the budget of `docs/how-we-work.md` goes from 950 to 960 (D7).
- `scripts/agent-unblock.mts` also has `readyLines` and `swapLabel`, which keep `run` shorter.
