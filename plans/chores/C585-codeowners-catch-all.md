# Plan: C585: CODEOWNERS covers every path

- **Spec:** #585
- **Status:** approved

## Approach

A catch-all first line in `.github/CODEOWNERS` makes every PR need a code-owner review; the lines after it stay as they are (the last matching line wins). `scripts/hand-back.mts` skips a line whose pattern is `*` or `**`, so `hand-back` keeps meaning an agent-sensitive path and the CI agent still builds ordinary PRs. The docs say who approves.

## Decisions

**D1 · Who owns the catch-all** · Decides: Tech lead

- **A.** `* @henetiriki @starforms`: either person can approve code; the specific lines stay.
- ~~**B.** `* @henetiriki`: every PR needs the tech lead.~~

**Answer: A** (@henetiriki, in session)

**D2 · Hand-back and the catch-all** · Decides: Tech lead

- **A.** `matcher` ignores a `*` or `**` line.
- ~~**B.** No script change: every PR is handed back.~~

**Answer: A** (@henetiriki, in session)

## Files that change

| File                                        | New / changed | What                                                                                       |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `.github/CODEOWNERS`                        | changed       | catch-all first line                                                                       |
| `scripts/hand-back.mts`                     | changed       | `matcher` skips a catch-all; comment                                                       |
| `scripts/__tests__/hand-back.test.ts`       | changed       | a catch-all line owns nothing                                                              |
| `docs/repo-settings.md`                     | changed       | approvals and code-owner rows; a line on `db:migrate` and `account:add` against production |
| `plans/README.md`, `.github/agent/build.md` | changed       | rule 13 and the stop rule name the matcher, not every CODEOWNERS path                      |

## Order of work

1. Plan; test first (rule 12); matcher; CODEOWNERS; docs. Lint the file with `gh api repos/henetiriki/kinscape/codeowners/errors?ref=<branch>`.

## Risks

- Only `*` and `**` are catch-alls to the matcher; `*.md` or `/*` would hand back.
- This PR edits owned paths, so it is labelled `hand-back`: the tech lead builds it.

## Proof

| Acceptance check                                                                | Proven by                                                                               |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A catch-all line owns nothing to the matcher; the real file owns the same paths | `hand-back.test.ts`                                                                     |
| CODEOWNERS parses                                                               | `codeowners/errors`: none                                                               |
| Every PR needs a code owner                                                     | After merge: a throwaway PR touching `proxy.ts` says "Review required from code owners" |
| Lint, format, words, tests, validator, e2e                                      | CI                                                                                      |
