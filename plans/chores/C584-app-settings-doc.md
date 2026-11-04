# Plan: C584: CI agents authenticate with a GitHub App

- **Chore:** #584
- **Status:** approved

## Approach

`docs/repo-settings.md` gets a _Secrets and variables_ table (name, set by, read by), replacing the two bot rows in _What's set and why_, and splits _Accounts and access_ into People and Apps. `check-github.sh` lists the expected secret and variable names itself (D1: B), compares them with the repo's and prints them; the doc's table links to the script; the two "is set" checks go, as the names check covers them. Names only; no value is read.

## Decisions

**D1 · Where the expected names live** · Decides: Tech lead

- **A.** `check-github.sh` reads the backticked names in the table's first column with `node -e`, as it reads the ruleset JSON.
- **B.** The script lists them; the doc links to it.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · Proving a workflow push is refused** · Decides: Tech lead

- **A.** The build pushes a one-line edit to a workflow file to a new branch with its own token (no `workflows: write`) and pastes the refusal into Evidence.
- **B.** The tech lead tries it after merge.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                      | New / changed | What                            |
| ------------------------- | ------------- | ------------------------------- |
| `docs/repo-settings.md`   | changed       | The two tables                  |
| `scripts/check-github.sh` | changed       | Exact secret and variable names |

## Order of work

1. Doc, then script; `bash -n`, lint, `format:check`, `words`, tests.
2. Evidence: this plan run, the build run, one respond and one pin run, a review of an App PR, the D2 refusal.
3. After merge: the tech lead runs `check-github.sh`, deletes any PAT secret, removes `henetiriki-bot` and revokes its tokens.

## Risks

- The agent token can't list secrets, so `check-github.sh` first runs as admin after merge.
