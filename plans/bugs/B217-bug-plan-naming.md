# Plan: B217: Bug naming and plan location

- **Spec:** #217
- **Status:** approved

## Approach

Bugs follow the Chore pattern. The plan PR is titled `B.<n>: <title without "Bug: "> (plan)` and the plan lives in `plans/bugs/B<n>-<slug>.md`. The id, branch and commit prefix stay `B<n>`, as a Chore's stay `C<n>`. `plans/README.md` gains both rules, the plan prompt names the path, and `word-count.mts` budgets the folder. No bug plan is on `main` yet, so nothing moves.

## Decisions

**D1 · Bug plan word budget** · Decides: Tech lead

- **A.** 600, as a Spec plan.
- ~~**B.** 300, as a Chore plan.~~
- ~~**Other:** your own.~~

Recommended: A, because a Bug takes a Spec's path and can change as much code.

**Answer: A** (Tech lead)

**D2 · Who builds the workflow line** · Decides: Tech lead
`claude-spec-agent.yml` is in `.github/CODEOWNERS`. Rule 4's hand-back covers Chores only.

- **A.** The agent builds it on approval; CODEOWNERS already requires your review.
- ~~**B.** Hand it back as rule 4 says for a Chore.~~
- ~~**Other:** your own.~~

Recommended: A, because CH.3 changed the same workflow this way.

**Answer: A** (Tech lead)

## Files that change

| File                                      | New / changed | What                                    |
| ----------------------------------------- | ------------- | --------------------------------------- |
| `plans/README.md`                         | Changed       | Rule 2: Bug plan path; rule 3: PR title |
| `.github/workflows/claude-spec-agent.yml` | Changed       | Plan prompt: Bug plan path              |
| `scripts/word-count.mts`                  | Changed       | `plans/bugs/` budget (D1)               |
| `scripts/__tests__/word-count.test.ts`    | Changed       | Budget and subfolder cases              |

## Order of work

1. Commit this plan: `plan(B217): approved by @henetiriki`.
2. Word budget and its tests.
3. `plans/README.md`, then the prompt line.
4. Run lint, format check, tests, boundary validator, `npm run words` and `npm run e2e`.

## Proof

| Acceptance check                | Proven by                                      |
| ------------------------------- | ---------------------------------------------- |
| Bug plan PR titled `B.<n>: …`   | The next Bug set `ready-for-agent` after merge |
| Bug plan saved in `plans/bugs/` | The same run                                   |
| Bug plans within budget         | `word-count.test.ts`; `npm run words`          |
