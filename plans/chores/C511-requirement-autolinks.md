# Plan: C511: Autolink requirement IDs in issues, PRs and commits

- **Spec:** #511
- **Status:** draft

## Approach

Both scripts read the prefixes with one `sed` over the ID cells of `docs/requirements.md` (`| <a id="map-01"></a>MAP-01 |` gives `MAP`), and stop if it finds none. `setup-github.sh` lists `repos/$REPO/autolinks`, deletes any with an unknown prefix or another URL, then creates the missing ones (`is_alphanumeric=true`), printing only what it changes. `check-github.sh` compares the sorted `prefix url alphanumeric` list with the expected one in a single `check`, so a missing, wrong or extra autolink fails it.

## Decisions

**D1 · Where the prefix list is read** · Decides: Tech lead

Both scripts need it.

- **A.** The same `sed` line in each, as `check-github.sh` already re-reads the ruleset JSON itself.
- **B.** A shared `scripts/github/requirement-prefixes.sh` both source.
- **Other:** your own.

Recommended: A, because it is one line and adds no file.

## Files that change

| File                      | New / changed | What                                          |
| ------------------------- | ------------- | --------------------------------------------- |
| `scripts/setup-github.sh` | Changed       | `== Autolinks` step                           |
| `scripts/check-github.sh` | Changed       | Autolinks check                               |
| `docs/repo-settings.md`   | Changed       | _What's set and why_ row; intro list of steps |

## Order of work

1. Setup step, then check.
2. `repo-settings.md`.
3. Lint, `format:check`, `words`, tests.

## Risks

- An unreadable or reformatted `requirements.md` would delete every autolink: the empty-list stop prevents it.
- Hand-back: `setup-github.sh` is a code-owner path; the tech lead builds and runs it as admin.

## Proof

| Acceptance check                               | Proven by                                 |
| ---------------------------------------------- | ----------------------------------------- |
| Check passes, then fails on a deleted or extra | Tech lead runs both scripts, output in PR |
| `MAP-03` in a comment links to its row         | Tech lead posts one on the PR             |
| Second setup run changes nothing               | Its output prints no autolink lines       |
