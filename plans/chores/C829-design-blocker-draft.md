# Plan: C829: Send a Spec freed by a design change back to draft

- **Spec:** #829
- **Status:** approved

## Approach

In `agent-unblock.mts`, a freed `type: spec` issue gets a design check before its comment and label edit. A failed `gh` call thus throws into the loop's `catch` and leaves `status: blocked`. Its blockers are the set that the refresh output lists. A helper, `designBlockers`, finds their merged PRs (D5) and reads files with `--paginate --jq '.[].filename'`. A helper, `refineArg`, reads the Intent box (D6).

## Decisions

**D5 · Merged PRs** · Decides: Tech lead

The repo has 478 merged PRs.

- **A.** One `gh pr list --state merged --limit 1000` call per run. An older PR counts as no design change.
- **B.** One `--search <blocker>` call for each blocker. No cap.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D6 · A readable Intent box** · Decides: Tech lead

The box is untrusted text in a comment.

- **A.** Only `#<n>` or `M<n>` is readable.
- **B.** Any first line, in backticks.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D7 · Word budget** · Decides: Tech lead

The line 97 change takes `docs/how-we-work.md` to 958 words. Its budget is 950.

- **A.** Raise the budget to 960 in `scripts/word-count.mts`.
- **B.** Cut 8 words from another line.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                   |
| ----------------------------------------- | ------------- | -------------------------------------- |
| `scripts/agent-unblock.mts`               | Changed       | Two helpers, `draft`, header comment   |
| `scripts/__tests__/agent-unblock.test.ts` | Changed       | Fake reads PRs, files, body; new tests |
| `.github/workflows/claude-unblock.yml`    | Changed       | Header comment                         |
| `docs/how-we-work.md`                     | Changed       | Line 97                                |

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
