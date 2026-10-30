# Plan: C269: Prepare repo for switching from private to public

- **Spec:** #269
- **Status:** draft

## Approach

Add the licence and policy files. Gate people-triggered workflows on `author_association` in OWNER, MEMBER or COLLABORATOR, in each `if:` and its `run-name` copy. Add the five settings to both scripts.

## Decisions

**D1 · SHA pinning and our `henetiriki/kinscape/…@main` uses** · Decides: Tech lead

The new setting may block the `@main` refs C382 allows, stopping the Claude workflows.

- **A.** Turn it on; after setup, the tech lead checks a `@claude` run starts, else turns it off and reopens #269.
- **B.** Leave it out of this chore.
- **Other:** your own.

Recommended: A, because the issue asks for it and a check shows at once whether it works.

**D2 · Who runs the history secret scan** · Decides: Tech lead

The agent can't install gitleaks.

- **A.** The tech lead runs `gitleaks git` before the flip and pastes the summary in the PR.
- **Other:** your own.

Recommended: A.

## Files that change

| File                                                                                     | What                                                     |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `LICENSE`, `SECURITY.md`                                                                 | New                                                      |
| `package.json`, `README.md`                                                              | Licence; Contributions section                           |
| `.github/workflows/claude.yml`                                                           | Comment's, review's or issue's association               |
| `.github/workflows/claude-{plan,code-review}.yml`                                        | Issue's or PR's association                              |
| `.github/workflows/backlog-{intent-ready,spec-link,milestone}.yml`, `claude-unblock.yml` | Issue's association: form labels reach outsiders' issues |
| `scripts/{setup,check}-github.sh`                                                        | Five settings                                            |
| `docs/repo-settings.md`                                                                  | Dependabot row; new rows                                 |

## Order of work

1. Files, then workflows, then scripts and docs.
2. Run lint, format:check, tests, words, boundaries, e2e.

## Risks

- The bot's own PRs and comments still pass: its association is COLLABORATOR.
- Gating `ci.yml` would skip required checks, which counts as passing; fork runs need approval instead.

## Proof

| Acceptance check                  | Proven by                     |
| --------------------------------- | ----------------------------- |
| Files exist; checks pass          | Step 2 output                 |
| History scan clean                | D2                            |
| Five settings pass                | Tech lead's `check-github.sh` |
| Signed-out page; outsider skipped | Tech lead, after the flip     |

## Out of scope

`ci.yml`, `ci-cache-cleanup.yml` (fork runs need approval; no secrets); `claude-build.yml` (already OWNER-only).
