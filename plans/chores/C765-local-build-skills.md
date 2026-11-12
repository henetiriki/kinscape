# Plan: C765: Add /build-local and /fix-review-local skills for a plan PR

- **Spec:** #765
- **Status:** approved

## Approach

Each skill has the #765 frontmatter, stop checks, a link to its agent file and one line per override. `build-local` holds the shared steps (D2).

## Decisions

**D1 · Room in `docs/building.md`** · Decides: Tech lead

- **A.** Raise the budget to 450 in `word-count.mts`, and its test.
- **B.** Cut 20 words from other lines of `docs/building.md`.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · Where the shared steps go** · Decides: Tech lead

- **A.** `build-local` holds them under one heading. `fix-review-local` links to it.
- **B.** Each skill repeats them.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Ready state of a design system plan** · Decides: Tech lead

- **A.** Ignore the draft bullet of `build.md` step 6 after every design-system step.
- **B.** Always leave such a PR a draft.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · Gaps comment** · Decides: Tech lead

- **A.** Follow `fix-review.md` for it.
- **B.** Skip it.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D5 · Label on a hand-back PR** · Decides: Tech lead

- **A.** Stop only if the PR has no `hand-back` label.
- **B.** Stop on the label.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What              |
| ------------------------------------------ | ------------- | ----------------- |
| `.claude/skills/build-local/SKILL.md`      | New           | The skill         |
| `.claude/skills/fix-review-local/SKILL.md` | New           | The skill         |
| `docs/building.md`                         | Changed       | One step          |
| `scripts/word-count.mts`                   | Changed       | D1 A: budget      |
| `scripts/__tests__/word-count.test.ts`     | Changed       | D1 A: budget case |
| `scripts/doc-links.mts`                    | Changed       | Allowlist         |

## Order of work

1. D1 A: see the budget test fail, then fix the budget.
2. Write the skills and the `docs/building.md` line.
3. Run the checks.

## Risks

- `.claude/skills/**` is a hand-back path. The tech lead builds.

## Proof

| Done check                       | Proven by                               |
| -------------------------------- | --------------------------------------- |
| Files, frontmatter, links, words | Review, `npm run words`, `format:check` |
| Push, ready state, replies, asks | The tech lead runs each skill and case  |

## Out of scope

Agent files, workflows, `plans/README.md`, labels.

## Deviations

- `build-local` stops on an unapproved plan, asks for approval on GitHub and reads the plan again before it continues.
- `build-local` also fetches `main`, so the stale-facts check reads a current `origin/main`.
- `scripts/doc-links.mts` allows the link cycle through both skills, `docs/building.md` and the agent files, because #765 requires those links. The `doc-links` test failed in CI without it.
- `build-local` asks the tech lead if a commit after the approval commit changes the plan. The tech lead chose to build this unlikely case.
- `build-local` reads only the comments of the team and of `kinscape-agent` for the build-ownership step.
- `docs/building.md` names only a `hand-back` PR, because CI builds and fixes any other PR.
- `fix-review-local` sets `GH_REPO` for `review:threads` and replies with a GraphQL mutation, because a local shell has no repo variable and `list` prints no comment id.
