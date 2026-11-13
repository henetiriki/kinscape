# Plan: C806: Check Spec edits for drift before the agent posts them

- **Spec:** #806
- **Status:** approved

## Approach

In `refresh.md`, step 4 keeps its drift rule and adds the four checks as a sub-list. Its last line says to finish every check, then post the one comment of step 5. In `respond.md`, one new bullet applies after an issue body edit. It links to step 4 of `refresh.md` and copies no check. `word-count.mts` gets a 400-word line for `refresh.md` above the 300-word `.github/agent` line.

## Decisions

**D1 · Where the respond agent reads step 4** · Decides: Tech lead

A respond run on a PR has the PR head checked out. `docs/security.md` says never to read a prompt file from the PR head.

- **A.** `respond.md` says to read it with `git show origin/main:.github/agent/refresh.md`, after `git fetch origin main`.
- **B.** It reads `refresh.md` in the checkout.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                       | New / changed | What                            |
| -------------------------- | ------------- | ------------------------------- |
| `.github/agent/refresh.md` | changed       | The four checks in step 4       |
| `.github/agent/respond.md` | changed       | Run step 4 after a body edit    |
| `scripts/word-count.mts`   | changed       | A 400-word limit for refresh.md |

## Risks

- `.github/agent/**` is a hand-back path. The tech lead builds.
- `refresh.md` is near 300 words now. The checks must fit in 400.

## Proof

| Done check                                      | Proven by                                          |
| ----------------------------------------------- | -------------------------------------------------- |
| Step 4 lists four checks, then one comment      | The diff                                           |
| `respond.md` runs the checks and fixes its text | The diff                                           |
| The 400 limit, and `npm run words` passes       | `npm run words`                                    |
| Lint, format and tests pass                     | `npm run lint`, `npm run format:check`, `npm test` |
| Three files and the plan only                   | `git diff --stat origin/main`                      |

## Out of scope

- A `word-count.test.ts` row for the new limit: the diff holds no other file.
