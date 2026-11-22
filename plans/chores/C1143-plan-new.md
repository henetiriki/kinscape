# Plan: C1143: Set up each plan draft and list its related issues with npm run plan:new

- **Spec:** #1143
- **Status:** approved

## Approach

A new script, `scripts/plan-new.mts`, does the work in three phases:

1. **Read.** It reads the issue with `gh issue view <n> --json number,title,body,issueType`. It reads `dependencies/blocking`, `parent` and the parent's `sub_issues` with `gh api repos/{owner}/{repo}/…`. `gh` fills `{owner}/{repo}` from the checkout, so a local run needs no `GH_REPO`. A 404 on `parent` means no parent. Any other `gh` failure stops the script with a message.
2. **Work out.** Pure functions give the id, the plan path, the branch, the plan PR title and the related issues. The Type check uses `TYPES` of `scripts/issue-status.mts`. The id comes from `/^Spec: ([A-Z]+\d*(?:\.\d+)+) /`, which takes `M2.15.3` and `DM.9`. The slug matches `/^[a-z\d]+(?:-[a-z\d]+)*$/`. If the parent's Type is not Intent, the script lists no parent and no sibling.
3. **Set up.** If no branch and no plan file exists (D2), it runs `git fetch origin main` and `git switch -c <branch> origin/main`. Then it writes `plans/TEMPLATE.md` to the plan path, with `- **Spec:** #<n>` and `- **Status:** draft`. Otherwise it changes nothing and prints "Skipped the setup: <what exists> exists."

The script takes its `gh`, `git` and file calls as arguments, as `scripts/hand-back.mts` does with `gh`. The test passes fakes, so it runs no command. Then the prose changes follow step 5 of the Chore. The plan PR carries the `hand-back` label, because the plan lists `.github/workflows/claude-plan.yml`.

## Decisions

**D1 · The Spec title in the plan PR title** · Decides: Tech lead

The item-types table gives `<spec-id>: <Spec title> (plan)`. The table does not say if `<Spec title>` keeps the "Spec: " prefix and the id. PR #1113 used "M2.15.1: Pin actions: update" for "Spec: M2.15.1 Pin actions: update".

- **A.** Drop "Spec: " and the id: `M2.15.3: Cache Pin writes with setQueryData (plan)`. Cost: none; it matches #1113.
- **B.** Drop "Spec: " only: `M2.15.3: M2.15.3 Cache Pin writes with setQueryData (plan)`. Cost: the id shows twice.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · What counts as an existing branch or plan file** · Decides: Tech lead

Step 2 sets up only if "neither the branch nor the plan file exists". A respond run that revises a plan also reads the related issues (related-issues rule), so it runs `plan:new`. If it gives another slug, an exact-name check finds nothing. The script then switches to a new branch. A fresh CI checkout also has no local copy of a remote branch.

- **A.** Exact names only, local branch only. Cost: a respond run with another slug, or a branch only on `origin`, gets a second branch and a second plan file.
- **B.** Any local or `origin` branch `<prefix>/<id>-*`, or any file `<plan folder>/<id>-*.md`. The script prints the names that it finds. Cost: about 15 lines and three tests.
- **Other:** your own.

**Answer: B** (@henetiriki)

**D3 · Where the requirement IDs come from** · Decides: Tech lead

A sibling is related if it shares a requirement ID with #<n>. A Spec lists its IDs under "Requirement IDs covered". Its Behaviour can name other IDs, such as `PIN-03` in #1130.

- **A.** The IDs under "### Requirement IDs covered" only. Cost: an issue with no such section shares no ID.
- **B.** Each `[A-Z]+-\d+` in the body that `docs/requirements.md` defines. Cost: a sibling that only cites a shared ID shows as related.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · The place of the new Plan PR step** · Decides: Tech lead

Step 5 replaces "Use the plan path and the branch from the table." with "Run `npm run plan:new`." That line comes after "Commit the plan". The script makes the branch and the plan file, so it must come before the commit.

- **A.** Replace the line in place, as step 5 says. Cost: the list puts the setup after the commit.
- **B.** Put "Run `npm run plan:new`." second, after "Refresh the issue", and delete the old line. Cost: one Deviations line.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                         | New / changed | What                                                                                                           |
| -------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `scripts/plan-new.mts`                       | New           | The script of the Approach.                                                                                    |
| `scripts/__tests__/plan-new.test.ts`         | New           | The tests of the Proof table.                                                                                  |
| `package.json`                               | Changed       | `"plan:new": "node scripts/plan-new.mts"`.                                                                     |
| `plans/README.md`                            | Changed       | _Related issues_, _Plan PR_ and _In a local session_, as step 5 says (D4).                                     |
| `scripts/__tests__/load-agent-files.test.ts` | Changed       | The test of the three reads checks the new prompt text, `related-issues rule` and "Related issues read: none". |
| `.github/workflows/claude-plan.yml`          | Changed       | Hand-back: the tech lead replaces lines 78–81, 83 and 84 with the sentence of step 5.                          |

## Order of work

1. Write `scripts/__tests__/plan-new.test.ts`. See it fail on a value, not on the import (test-first rule).
2. Write `scripts/plan-new.mts` and the `package.json` entry. Run `npm test -- --coverage.enabled=false scripts/__tests__/plan-new.test.ts`.
3. Change `plans/README.md`. Run `npm run words`.
4. Change `scripts/__tests__/load-agent-files.test.ts`. It fails until step 5.
5. The tech lead pushes the `claude-plan.yml` commit in a local session.
6. Run the checks of `AGENTS.md` › _Commands_.

## Risks

- `npm test` fails on the draft PR between steps 4 and 5. The Chore accepts this.
- `plans/README.md` has a budget of 1310 words. The new text is about as long as the list that it replaces. If the count fails, cut words in the changed lines only.
- In a local session, a `gh` that a script starts fails in the sandbox. The new README line tells the session to hand the user the command.

## Proof

| Acceptance check                                                                    | Proven by                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A sample Spec, Bug and Chore give the four values of their item-types row           | `plan-new.test.ts`: "gives the item-types values for a Spec, a Bug and a Chore" |
| A blocking issue and an Intent parent are listed                                    | `plan-new.test.ts`: "lists each blocking issue and the Intent parent"           |
| An open sibling with a shared ID is listed; one with no shared ID or closed is not  | `plan-new.test.ts`: "lists only open siblings that share an ID"                 |
| A parent that is not an Intent is not listed                                        | `plan-new.test.ts`: "lists no parent that is not an Intent"                     |
| An existing branch or plan file: no change, and the script says so                  | `plan-new.test.ts`: "skips the setup if the branch or the plan file exists"     |
| Each stop case of step 4                                                            | `plan-new.test.ts`: one test each for Type, Spec id and slug                    |
| The prompt and `plans/README.md` read as step 5 says; the prompt holds `blocked_by` | `load-agent-files.test.ts` (the plan run); review of the README diff            |
| `load-agent-files.test.ts` checks the new prompt text                               | The changed test                                                                |
| The prompt still cites the related-issues rule                                      | `plan-rule-citations.test.ts`                                                   |
| `plans/README.md` says a local session hands the user the command                   | Review of the README diff                                                       |
| `npm test` passes                                                                   | CI, after step 5                                                                |

## Out of scope

- The `# Plan:` heading of the copied template. The agent fills it.
- The pattern files of #1146. That Chore extends `plan:new`.
- A commit, a push, a PR or an issue edit by the script.

## Deviations

- D4 B: `plans/README.md` puts "Run `npm run plan:new`." second, after "Refresh the issue", and drops the old line.
- `PlanNewDeps` is in `scripts/types.ts`, as the lint rule requires.
