# Plan: C465: Name CI runs 'CI: <PR title>' or 'CI: main'

- **Spec:** #465
- **Status:** draft

## Approach

Add one `run-name` to `ci.yml`, between `name: CI` and `on:`, in the literal form `backlog-issue-status.yml` uses: `run-name: 'CI: ${{ github.event.pull_request.title || github.ref_name }}'`. A PR run has a title, so it shows `CI: <PR title>`; a push has none, so `github.ref_name` gives `CI: main`. A comment above it names the two titles and says there is no "Skipped" form, because only the jobs have an `if:` and `format` and `words` run on every run. Nothing else in the file changes.

## Files that change

| File                       | What                            |
| -------------------------- | ------------------------------- |
| `.github/workflows/ci.yml` | `run-name` and its comment only |

No test reads a run-name from `ci.yml`: `next-build-cache`, `npm-cache-path`, `vercel-ignore` and `workflows-diagram` read other parts.

## Order of work

1. Add the comment and `run-name`.
2. Run lint, `format:check`, `words` and tests.

## Risks

- The PR is handed back (rule 13): the tech lead builds it.
- A malformed expression would fail every CI run, so every required check. The PR's own CI run proves it parses and shows the title.

## Proof

| Acceptance check                          | Proven by                                          |
| ----------------------------------------- | -------------------------------------------------- |
| `CI: <PR title>` for a PR run             | Actions tab, the build PR's own CI run (tech lead) |
| `CI: main` for a push to `main`           | Actions tab, the run after merge (tech lead)       |
| Lint, `format:check`, `words`, `npm test` | CI                                                 |

## Out of scope

Triggers, `concurrency`, job names and any `if:`; `claude-run.yml` and the push, schedule and `workflow_dispatch` workflows.
