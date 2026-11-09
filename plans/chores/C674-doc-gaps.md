# Plan: C674: Close the gaps left by the doc clean-up

- **Spec:** #674
- **Status:** approved

## Approach

Make the seven edits in #674 as it words them. In workflows and scripts, edit comment lines only. Name each rule as `plans/README.md#<anchor>`. This includes the bare "rule 3" in `claude-build.yml` and "(rule 4)" in `agent-approve.mts`. `AGENTS.md`, `docs/code-rules.md`, the workflows, `agent-approve.mts` and `hand-back.mts` are hand-back paths, so the tech lead builds it.

## Decisions

**D1 · Form of a rule name in a comment** · Decides: Tech lead

- **A.** `plans/README.md#chores`: the anchor as a link fragment.
- **B.** `plans/README.md, chores rule`: the form the agent prompts use.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                                                                                              | New / changed | What                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------- |
| `docs/README.md`                                                                                                  | Changed       | Four owner rows             |
| `docs/architecture-target.md`                                                                                     | Changed       | Items 5 and 7               |
| `AGENTS.md`                                                                                                       | Changed       | `npm run words` in Commands |
| `docs/code-rules.md`, `docs/architecture.md`                                                                      | Changed       | Key concepts copies deleted |
| `claude-build.yml`, `claude-fix-review.yml`, `claude-hand-back.yml`, `claude-resolve-conflict.yml`                | Changed       | Rule anchors                |
| `scripts/agent-approve.mts`, `scripts/hand-back.mts`, `load-agent-files.test.ts`, `test-modifiers-config.test.ts` | Changed       | Rule anchors                |
| `claude-code-review.yml`                                                                                          | Changed       | Actions token row; no C575  |
| `scripts/check-github.sh`                                                                                         | Changed       | Secrets and variables note  |

## Order of work

1. The docs, then `npm run words`.
2. The comments, then the full check list.

## Proof

| Acceptance check                   | Proven by                                                  |
| ---------------------------------- | ---------------------------------------------------------- |
| Verifying checks pass              | Their output in the PR                                     |
| No diagram diff                    | `npm run workflows:diagram`, `git diff`                    |
| New rows link existing files       | The link test, with no allowlist change                    |
| Items 5 and 7; Key concepts copies | `git diff` of the three docs                               |
| Word limits                        | `npm run words`                                            |
| No rule number, no C575            | The two `git grep` lines in #674                           |
| Anchors exist; comment lines only  | `git grep` of each anchor in `plans/README.md`; `git diff` |
