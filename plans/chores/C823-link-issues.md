# Plan: C823: Link issues with blocked-by and relates-to

- **Spec:** #823
- **Status:** draft

## Approach

"Linking issues" takes in the "blocked by" sentences under the label table. `filing.md` gets a _Links_ section; `bug.md` links to it. The draft lists its links before "File it now?". After the yes, the agent reads `blockedBy` and `relatesTo`, then adds each missing link, one `gh api graphql` call each. A blocked Chore files with `status: blocked` in place of the form's status label. A blocked Bug swaps its label with `gh issue edit`. Each hand-over label line adds "except `status: blocked`".

## Decisions

**D1 · Where the blockers come from** · Decides: Tech lead

How does the agent learn the blockers?

- **A.** Ask one question: "Must an open issue close first? Is an earlier issue the reason?"
- **B.** Use only the blockers that the interview or the slice order settled.
- **Other:** your own.

Recommended: A, because only `spec.md` settles an order.

## Files that change

| File                              | New / changed | What                                         |
| --------------------------------- | ------------- | -------------------------------------------- |
| `docs/how-we-work.md`             | Changed       | "Linking issues"                             |
| `.claude/skills/refine/filing.md` | Changed       | _Links_ section                              |
| `.claude/skills/refine/bug.md`    | Changed       | Read `relatesTo` first; link to _Links_      |
| `.claude/skills/refine/spec.md`   | Changed       | Remove the `gh api` offer; status label line |
| `.claude/skills/refine/chore.md`  | Changed       | Status label line                            |
| `plans/README.md`                 | Changed       | "blocked by" is the link                     |

## Order of work

1. Confirm the names and inputs of `addBlockedBy` and `addRelatesTo`.
2. Edit the six files.
3. Remove the `Relates to` line from #820, #821 and #822.

## Risks

- The CI hook denied a schema read of the mutations, so step 1 comes first.
- `plans/README.md` and `how-we-work.md` are near their budgets.

## Proof

| Acceptance check           | Proven by                                               |
| -------------------------- | ------------------------------------------------------- |
| The three text checks      | Review of the diff                                      |
| No second link on a re-run | Evidence: `/refine bug` twice; `relatesTo` count stays  |
| #820 to #822               | Evidence: each body, and its `relatesTo` from `graphql` |
| `words`, `format:check`    | CI                                                      |
