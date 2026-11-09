# Plan: C653: Split the hosting settings out of repo-settings.md

- **Spec:** #653
- **Status:** draft

## Approach

Move the Vercel and Supabase sections of `docs/repo-settings.md` into a new `docs/infrastructure.md`, with only the issue's listed edits. Point the `#vercel` links at it. A person builds it: it edits hand-back paths.

## Decisions

**D1 · The review-code.md bullet** · Decides: Tech lead

The bullet also asks for `server/env.mts`, which the new sentence does not say. What replaces the bullet?

- **A.** Keep "in `server/env.mts`", and link the sentence for the rest.
- **B.** Only the link. The reviewer stops checking `server/env.mts`.
- **Other:** your own.

Recommended: A, because a variable missing from `server/env.mts` gets no check.

## Files that change

| File                               | New / changed | What                              |
| ---------------------------------- | ------------- | --------------------------------- |
| `docs/infrastructure.md`           | New           | The moved sections                |
| `docs/repo-settings.md`            | Changed       | Sections out; one link line       |
| `AGENTS.md`, `docs/building.md`    | Changed       | `#vercel` links                   |
| `scripts/check-production.mts`     | Changed       | Comment                           |
| `docs/README.md`                   | Changed       | Owner row                         |
| `docs/security.md`                 | Changed       | Row sentence                      |
| `.github/agent/review-code.md`     | Changed       | New surface bullet (D1)           |
| `scripts/word-count.mts`, its test | Changed       | Two budgets, two `budgetFor` rows |

## Order of work

1. Add the `budgetFor` rows; see them fail. Set the budgets.
2. Move the sections, then make the edits.
3. Change the links, rows and sentence.

## Risks

`git diff -M` does not pair text moved into a new file. `git diff --color-moved` shows the moved lines.

## Proof

| Acceptance check                               | Proven by                                                       |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Checks pass; no `repo-settings.md#vercel` link | `npm run lint`, `format:check`, `words`, `npm test` (link test) |
| Word budgets                                   | `npm run words`                                                 |
| The tables in the right file                   | Reading both files                                              |
| The moved text unchanged                       | `git diff --color-moved` against `main`                         |
| `docs/security.md` sentence, ≤350 words        | Reading it; `npm run words`                                     |
