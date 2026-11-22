# Plan: C1133: Check each part of the body in the Spec checks, and run them in /refine on Opus

- **Spec:** #1133
- **Status:** approved

## Approach

In `.github/agent/spec-checks.md`, line 10 starts "Write one line for each check" in place of "End the comment with". After it, a new paragraph and list give the item lines:

- After the four check lines, list each item of the parts that the [Ready check](../README.md#ready-check) names for the issue's type. The link goes to the list and does not copy it.
- Write one line for each item: `<part> <n>: matches main`, `<part> <n>: D<k>` or `<part> <n>: Not checked: <reason>`, with a question.
- For an empty part, write `<part>: empty`.
- If another file puts a line last, keep that line last.

`refresh.md` stays unchanged. Its "Unblock run" closing line comes "after the Spec-check lines", and the item lines are Spec-check lines. With the last rule above, the closing line stays after the item list.

In `.claude/skills/refine/SKILL.md`, a model step comes before "The argument picks the mode". If the session's model is not Opus, the skill says "Run `/model opus` and `/effort high`, then run `/refine` again." Then it stops. The Method gets step 8, after the check round. In the `intent <number>`, `spec`, `chore` and `bug` modes, it runs `git fetch origin main` and the [Spec checks](../../.github/agent/spec-checks.md) against `origin/main` on each draft body. It shows the item list in chat. It then asks about each mismatch as a check-round question, one at a time, and redrafts after each answer. "Filing with gh" then starts "After step 8".

In `.claude/skills/refine/chore.md`, "What to settle" gets one line: write each edge that the interview settles as one line in Constraints. The line names a new draft and [Edit a filed Chore](../../.claude/skills/refine/chore.md#edit-a-filed-chore).

## Decisions

**D1 · Which runs list the items** · Decides: Tech lead

Three run types load `spec-checks.md`: the refresh (`refresh.md`), a respond run (`respond.md` line 10) and the build's reword step (`build.md` line 28). The Chore keeps those three files unchanged. Which comments get the item list?

- **A.** Every run that loads `spec-checks.md`. Cost: a respond comment and the build's final comment grow by one line for each item of each body that they check.
- **B.** Only a refresh comment and `/refine`. `spec-checks.md` says that a respond run and a build write only the four check lines. Cost: one more sentence in `spec-checks.md`.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D2 · What a mismatch line says in /refine** · Decides: Tech lead

`/refine` has no Drift comment, so a mismatch has no `D<k>`. What does its item line say?

- **A.** `<part> <n>: Q<m>`, the number of its check-round question. Cost: one clause in step 8 of `SKILL.md`.
- **B.** `<part> <n>: mismatch`, then the question. Cost: the same clause, and the PO can't see which question answers which line.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Alternatives considered

- Prove the `SKILL.md` and `chore.md` lines by review only. Rejected: a text test fails if a later edit drops a line or moves the model step.
- Put the `/refine` tests in `load-agent-files.test.ts`. Rejected: that file tests `.github/agent/` and the workflows.

## Files that change

| File                                         | New / changed | What                                                                                                                          |
| -------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `.github/agent/spec-checks.md`               | Changed       | Line 10 starts "Write one line"; the item lines, the empty-part line and the last-line rule, with the Ready check link        |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | One test: `spec-checks.md` links to `plans/README.md#ready-check`, the anchor exists, and the item lines follow the checks    |
| `.claude/skills/refine/SKILL.md`             | Changed       | The model step first; Method step 8; "Filing with gh" starts "After step 8"                                                   |
| `.claude/skills/refine/chore.md`             | Changed       | "What to settle": the settled-edge line                                                                                       |
| `scripts/__tests__/refine-skill.test.ts`     | New           | The model step comes before the mode list; step 8 names the four modes and comes before "Filing with gh"; the `chore.md` line |
| `scripts/word-count.mts`                     | Changed       | The `SKILL.md` budget goes from 940 to the new count, rounded up to the next 10, only if the count passes 940                 |
| `scripts/__tests__/word-count.test.ts`       | Changed       | The `SKILL.md` row (line 73) expects the new budget, only if the budget changes                                               |

`spec-checks.md` is a [hand-back path](../README.md#hand-back). The tech lead builds that row in a local session.

## Order of work

1. CI: write the `refine-skill.test.ts` tests. See them fail on the missing lines.
2. CI: edit `SKILL.md` and `chore.md`.
3. CI: run `npm run words`. If `SKILL.md` passes 940, raise its budget and the test row.
4. CI: write the `spec-checks.md` test in `load-agent-files.test.ts`. See it fail on the missing link. Paste that line in the Evidence.
5. Tech lead, in a local session: edit `spec-checks.md`. See the step 4 test pass.
6. Run the checks in `AGENTS.md` › Commands.

## Risks

- The step 4 test fails in CI until step 5. The `hand-back` label keeps the PR a draft, so the failure does not reach `main`.
- A Spec with many items gets a long refresh comment. The Chore asks for each item, so the plan builds no cap.
- The model step reads the model name from the session. If a session hides the name, the skill stops on Opus. Likelihood: low; no shown session hides it. Fix cost: one line that asks the user. The plan builds no fix.

## Proof

| Acceptance check                                                       | Proven by                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `spec-checks.md` holds the item lines and the empty-part line, linked  | Review of step 5; the step 4 test checks the link and the order              |
| A test checks the Ready check link                                     | New test in `load-agent-files.test.ts`                                       |
| `SKILL.md`: the model step first, step 8 before filing, the four modes | New tests in `refine-skill.test.ts`                                          |
| `/refine chore` on Sonnet prints the model line and asks nothing       | Tech lead, in a local session                                                |
| `/refine chore` on Opus shows the item list before "File it now?"      | Tech lead, in a local session                                                |
| The next plan-run refresh comment lists each item                      | Tech lead, after the merge                                                   |
| The unblock closing line comes after the item list                     | The "Unblock run" test (line 760) and the last-line rule in `spec-checks.md` |
| `chore.md` holds the settled-edge line                                 | New test in `refine-skill.test.ts`                                           |
| `lint`, `typecheck`, `format:check`, `words`, `test`                   | CI                                                                           |

## Out of scope

- `refresh.md`, `respond.md`, `build.md` and `.github/workflows/`.
- Spec checks in `/refine intent [idea]` and `/refine intent M<n>`.

## Deviations

- Steps 2–4: the tech lead built them in a local session, because the CI run could not write `SKILL.md` and `chore.md`.
- `docs/how-we-work.md` "Drafting with Claude": the model line keeps "Opus with High effort" and links to the `SKILL.md` model step for the commands. The skill checks only the model.
