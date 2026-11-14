# Plan: C823: Link issues with blocked-by and relates-to

- **Spec:** #823
- **Status:** approved

## Approach

"Linking issues" replaces the "blocked by" sentences under the label table. `filing.md` gets a _Links_ section, and `bug.md` links to it. After the yes to "File it now?", the agent reads `blockedBy` and `relatesTo`, then adds each missing link. "Blocked by" uses `gh issue edit --add-blocked-by`, because the CI hook denies a mutation. "Relates to" uses one `gh api graphql` call. A blocked Chore files with `status: blocked`. A blocked Bug swaps its label if it lacks that one. The Bug and Chore label lines add "except `status: blocked`".

## Decisions

**D1 · Where the blockers come from** · Decides: Tech lead

How does the agent learn the blockers?

- **A.** Ask one question: "Must an open issue close first? Is an earlier issue the reason?"
- **B.** Use only the blockers that the interview or the slice order settled.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                   | New / changed | What                                    |
| -------------------------------------- | ------------- | --------------------------------------- |
| `docs/how-we-work.md`                  | Changed       | "Linking issues"                        |
| `.claude/skills/refine/filing.md`      | Changed       | _Links_ section                         |
| `.claude/skills/refine/bug.md`         | Changed       | Read `relatesTo` first; link to _Links_ |
| `.claude/skills/refine/spec.md`        | Changed       | Remove the `gh api` offer               |
| `.claude/skills/refine/chore.md`       | Changed       | Status label line                       |
| `plans/README.md`                      | Changed       | "blocked by" is the link                |
| `scripts/word-count.mts`               | Changed       | `how-we-work.md` budget: 850 to 950     |
| `scripts/__tests__/word-count.test.ts` | Changed       | The same budget                         |

## Order of work

1. Confirm the names and inputs of `addBlockedBy` and `addRelatesTo`.
2. Edit the files in the table.
3. Remove the `Relates to` line from #820, #821 and #822.

## Risks

- The CI hook denied a schema read of the mutations, so step 1 comes first.
- `plans/README.md` is near its budget.

## Proof

| Acceptance check           | Proven by                                               |
| -------------------------- | ------------------------------------------------------- |
| The three text checks      | Review of the diff                                      |
| No second link on a re-run | Evidence: `/refine bug` twice; `relatesTo` count stays  |
| #820 to #822               | Evidence: each body, and its `relatesTo` from `graphql` |
| `words`, `format:check`    | CI                                                      |

## Deviations

- `scripts/word-count.mts` and its test: the `docs/how-we-work.md` budget goes from 850 to 950. "Linking issues" is 93 words over the old budget. The tech lead chose this in the build session.
- Proof row "No second link on a re-run": no live second run. _Links_ step 2 reads `blockedBy` and `relatesTo` before step 3 and step 4 add a link, and step 5 skips a label that exists. The tech lead accepted the gap.
