# Plan: C402: Keep the composite actions' pins current and upload the transcript from runner.temp

- **Spec:** #402
- **Status:** approved

## Approach

Both uploads take `${{ runner.temp }}/claude-execution-output.json`, with a test. Dependabot's `github-actions` entry takes `directories: ['/', '/.github/actions/*']`. A new test expects each `uses:` in `.github/actions/*/action.yml`, except `henetiriki/kinscape/…@main`, to end in a 40-character SHA.

## Decisions

**D1 · Keeping the review workflow and run-claude bumped together** · Decides: Tech lead

The `actions` group takes minor and patch only, so a major bump of `claude-code-action` or `upload-artifact` arrives outside it and the pin-equality test fails until both files carry it.

- **A.** Keep the group as it is; merge a major's pair of PRs together.
- ~~**B.** Drop `update-types` from the group, so majors join it too.~~
- ~~**Other:** your own.~~

Recommended: A, because a major needs reading anyway, and B bundles every action's major into one PR.

**Answer: A** (Tech lead)

## Files that change

| File                                         | What                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `.github/actions/run-claude/action.yml`      | Upload path                                                                                            |
| `.github/workflows/claude-code-review.yml`   | Upload path                                                                                            |
| `.github/dependabot.yml`                     | `directories`                                                                                          |
| `.github/workflows/claude.yml`               | Wrap lines 76 and 88–89                                                                                |
| `.github/workflows/claude-run.yml`           | Wrap lines 113–114 and 148–149                                                                         |
| `scripts/__tests__/load-agent-files.test.ts` | Pin and upload-path tests; the pin-equality comment no longer says Dependabot skips `.github/actions/` |

## Order of work

1. Add the upload-path test; see it fail; fix both paths.
2. Add the pin test; change `setup-workspace`'s checkout to `@v7`, see it fail, revert.
3. Dependabot `directories`; wrap the comments.

## Risks

- Unchecked (no web access here): whether a group spans `directories` in one PR. If not, the tech lead merges each pair by hand, whatever D1 says.

## Proof

| Acceptance check                          | Proven by                                          |
| ----------------------------------------- | -------------------------------------------------- |
| `npm test`, lint, `format:check`, `words` | Output in the PR                                   |
| Pin test fails on a tag                   | Step 2's failing line                              |
| Dependabot lists each actions directory   | Tech lead, Dependabot page after merge             |
| `claude-execution-output` artifact        | Next plan or build run and next review after merge |

## Deviations

- Added a test that the pin test sees `setup-workspace`'s steps.
