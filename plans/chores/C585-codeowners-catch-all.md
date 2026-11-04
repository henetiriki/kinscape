# Plan: C585: CODEOWNERS covers every path

- **Spec:** #585
- **Status:** approved

## Approach

A catch-all first line in `.github/CODEOWNERS` makes every PR need a code-owner review; the lines after it stay (the last match wins). `scripts/hand-back.mts` skips a `*` or `**` line, so `hand-back` still means an agent-sensitive path. The docs say who approves. The `db:migrate` line follows: `scripts/db-migrate.mts` isn't a hand-back path, so the PO alone can approve it.

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

| File                                                                | New / changed | What                                                                                       |
| ------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `.github/CODEOWNERS`                                                | changed       | catch-all first line                                                                       |
| `scripts/hand-back.mts`                                             | changed       | `matcher` skips a catch-all; wording                                                       |
| `scripts/__tests__/hand-back.test.ts`                               | changed       | a catch-all line owns nothing                                                              |
| `docs/repo-settings.md`                                             | changed       | approvals and code-owner rows; a line on `db:migrate` and `account:add` against production |
| `plans/README.md`, `.github/agent/build.md`                         | changed       | rule 13 defines a hand-back path; the stop rule links to it                                |
| `scripts/setup-github.sh`, `.github/workflows/claude-hand-back.yml` | changed       | "code-owner path" becomes "hand-back path", as in the log line                             |

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
