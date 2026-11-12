# Plan: C786: Add a project glossary and rename the design artifacts

- **Spec:** #786
- **Status:** approved

## Approach

The tech lead builds this in a local session: it edits hand-back paths and needs a claude.ai sign-in.

The first table links the _Key concepts_, the `how-we-work.md` roles and issue types, and the hand-back rule. The glossary terms table adds these rows:

| Term          | Meaning                                                    | Avoid |
| ------------- | ---------------------------------------------------------- | ----- |
| CI agent      | Claude Code that a GitHub Actions workflow runs            | —     |
| Exporter      | `npm run design:export`. It writes snapshots from boards.  | —     |
| Local session | A Claude Code session that the tech lead starts            | —     |
| Plan PR       | The draft PR that holds a plan until its approval          | —     |
| Plan run      | A CI agent run that refreshes an issue and drafts its plan | —     |

## Decisions

**D1 · The create step in `tools.md`** · Decides: Tech lead

Step 8 names `SKILL.md` only. Line 7 of `publish-design-system/tools.md` also creates the artifact as "KinScape".

- **A.** Change that title too.
- **B.** Keep it.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                            | New / changed | What               |
| ----------------------------------------------- | ------------- | ------------------ |
| `plans/chores/C786-glossary.md`                 | New           | This plan          |
| `docs/glossary.md`                              | New           | The two tables     |
| `docs/README.md`                                | Changed       | A glossary row     |
| `AGENTS.md`                                     | Changed       | The terms rule     |
| `.claude/skills/publish-design-system/SKILL.md` | Changed       | Lines 8 and 16     |
| `.claude/skills/publish-design-system/tools.md` | Changed       | Line 7 (D1)        |
| `scripts/word-count.mts`                        | Changed       | A 1200-word budget |
| `scripts/__tests__/word-count.test.ts`          | Changed       | Its row            |
| `design/canvas/**`                              | Changed       | The refresh        |

## Order of work

1. Write the docs, the skill titles and the budget.
2. Rename the two artifacts. Set the `designSystems` entry title.
3. Run "Refreshing the copy" (5.1 to 5.5).
4. File the follow-up Chore.

## Risks

- `AGENTS.md` is near its budget. Add the fewest words.
- If the rename leaves the `canvas.json` title, set it on the canvas.

## Proof

| Acceptance check | Proven by                        |
| ---------------- | -------------------------------- |
| Budget           | `npm test`, `npm run words`      |
| Links            | The PR lists each target         |
| Artifact names   | A claude.ai screenshot in the PR |
