# Plan: C765: Add /build-local and /fix-review-local skills for a plan PR

- **Spec:** #765
- **Status:** approved

## Approach

Each skill has the frontmatter that #765 gives. The body has:

1. The shared steps (D2).
2. The skill's stop checks.
3. A link to its agent file, then one line per override.

## Decisions

**D1 · Room in `docs/building.md`** · Decides: Tech lead

- **A.** Raise the budget to 450 in `word-count.mts`, with its test case.
- **B.** Cut 20 words from other lines of `docs/building.md`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the shared steps go** · Decides: Tech lead

- **A.** `build-local` holds them under one heading. `fix-review-local` links to that heading.
- **B.** Each skill repeats them.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Ready state of a design system plan** · Decides: Tech lead

- **A.** Ignore the `build.md` step 6 draft bullet if the session ran every design-system step.
- **B.** Always leave such a PR a draft.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What                  |
| ------------------------------------------ | ------------- | --------------------- |
| `.claude/skills/build-local/SKILL.md`      | New           | The skill             |
| `.claude/skills/fix-review-local/SKILL.md` | New           | The skill             |
| `docs/building.md`                         | Changed       | One line after step 5 |
| `scripts/word-count.mts`                   | Changed       | D1 A: budget          |
| `scripts/__tests__/word-count.test.ts`     | Changed       | D1 A: budget case     |
| `scripts/doc-links.mts`                    | Changed       | Link-cycle allowlist  |

## Order of work

1. D1 A: change the test case and see it fail. Then change the budget.
2. Write `build-local`, `fix-review-local`, then the `docs/building.md` line.
3. Run the checks, then each done check on a plan PR.

## Risks

- `.claude/skills/**` is a hand-back path: the tech lead builds.
- `fix-review-local` skips the reviewer's gaps comment. A CI fix-review run takes it.

## Proof

| Done check                       | Proven by                               |
| -------------------------------- | --------------------------------------- |
| Files, frontmatter, links, words | Review, `npm run words`, `format:check` |
| Push, ready state, replies       | The tech lead runs each skill           |
| Each stop and each session ask   | The tech lead runs each case            |

## Out of scope

Agent files, workflows, `plans/README.md`, labels.

## Deviations

- `build-local` stops on an unapproved plan, asks for approval on GitHub and reads the plan again before it continues.
- `build-local` also fetches `main`, so the stale-facts check reads a current `origin/main`.
- `scripts/doc-links.mts` allows the link cycle through both skills, `docs/building.md` and the agent files, because #765 requires those links. The `doc-links` test failed in CI without it.
- `fix-review-local` sets `GH_REPO` for `review:threads` and replies with a GraphQL mutation, because a local shell has no repo variable and `list` prints no comment id.
