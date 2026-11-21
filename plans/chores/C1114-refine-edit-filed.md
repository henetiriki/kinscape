# Plan: C1114: /refine edits a filed Spec or Chore

- **Spec:** #1114
- **Status:** approved

## Approach

`SKILL.md` picks the mode from the argument. After `spec`, `M<n>` slices as it does now. After `spec`, a number gets `gh issue view <n> --json issueType --jq .issueType.name`:

- An Intent slices as it does now.
- A Spec goes to the new "Edit a filed Spec" section of `spec.md`.
- A Bug or a Chore gets "#<n> is a <Type>: run `/refine bug <n>`" or "`/refine chore <n>`". The skill edits nothing.

After `chore`, digits with an optional `#` are a filed Chore. Any other text is an idea for a new Chore.

The two edit sections read the issue with `gh issue view <n> --comments` and `--json state,labels,title,body`. They take the plan path from the [item-types table](../README.md#item-types). They find the open plan PR from `closedByPullRequestsReferences` and `gh pr view <pr> --json state`. Before the first question, each edit section follows the closed-issue rule of `filing.md`. The slicing steps of `spec.md` do not change.

`filing.md` gets one section, "Editing a filed issue", that does not name Specs or Chores only. #1117 links `bug.md` to the same section. Its order is:

1. The closed-issue stop.
2. The links question.
3. "Edit #<n> now?".
4. One `gh issue edit <n> --body-file <file>`.
5. The _Links_ steps.
6. The plan check: name the plan, then ask "Set `status: draft`?", or say that `status: blocked` stays.

The plan check reads the label after the _Links_ steps, so a Chore that gets a blocker keeps `status: blocked`.

`agent-unblock.mts` names `/refine spec <issue.number>`. `issue.number` comes from the API, not from the body text. `INTENT`, `refineArg`, the fallback text and the `body` field of `Linked` go, because no other code reads them.

## Decisions

**D1 · A number after `chore` that is not a Chore** · Decides: Tech lead

#1114 reads the Type only after `spec`. #1115 reads no Type after `bug`. What does `/refine chore 1115` do?

- **A.** `chore <n>` also reads the Type. A Spec, Bug or Intent gets the message that names its mode, and the skill edits nothing. Cost: one sentence in `SKILL.md`.
- **B.** `chore <n>` trusts the number. Cost: none, but the skill redrafts a Spec or Bug with the Chore form.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · No Type, or a failed Type read** · Decides: Tech lead

`spec.md` step 1 now says "Without `gh`, ask the user to paste it". The done check says that an Intent number "slices as before". #1114 does not say what the skill does if the issue has no Type, or `gh` fails.

- **A.** Say why. Ask the user if #<n> is an Intent, a Spec, a Bug or a Chore. Then follow that mode, with the pasted body. Cost: one sentence in `SKILL.md`.
- **B.** Say why and edit nothing. Cost: none, but an Intent number without `gh` no longer slices.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · What "check the blocker links" does** · Decides: Tech lead

#1114 item 4 says "Check the blocker links, as _Links_ says". _Links_ step 5 sets `status: blocked` only on a Bug. [Linking issues](../../docs/how-we-work.md#linking-issues) sets it on a blocked Bug or Chore. #1117 keeps the links question in `bug.md` for a Bug.

- **A.** The section shows the current `blockedBy` and `relatesTo` links (_Links_ steps 1 and 2). It asks the links question of `filing.md` step 1. A yes to "Edit #<n> now?" covers the new links. _Links_ step 5 covers a Bug or a Chore. To remove a link, the user uses the issue sidebar. Cost: two changed sentences in `filing.md`.
- **B.** The section only shows the current links and sets none. Cost: none, but an edit that adds a need gives no "blocked by" link.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D4 · A failed `gh issue edit`** · Decides: Tech lead

#1114 does not say what the skill does if `gh` fails at the edit. `bug.md` prints its sections for the tech lead to paste.

- **A.** Say why. Print the whole new body. The tech lead pastes it into the issue's Edit box. Cost: one sentence in `filing.md`.
- **B.** Say why and print nothing. Cost: none, but the user loses the draft.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                      | New / changed | What                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/refine/SKILL.md`          | changed       | `argument-hint`, `description` and the mode list: `spec <M<n> or issue number>`, `chore [idea or Chore number]`. The Type rule, D1 and D2. "Filing with gh" says that `spec.md` and `chore.md` edit a filed issue.                                                                                   |
| `.claude/skills/refine/spec.md`           | changed       | The title names a Spec number. New section "Edit a filed Spec": read the Spec, its comments, its Intent, its plan file and its plan PR. Ask about the change and the contradictions. Redraft the `2-spec.yml` boxes. Redo the Estimate line. Check round. The Answer-line rule. Link to `filing.md`. |
| `.claude/skills/refine/chore.md`          | changed       | The title names a Chore number. New section "Edit a filed Chore": read the Chore, its comments and its plan. Redraft the `4-chore.yml` boxes. Run the Screen again. Check round on _How we'll know it's done_. Link to `filing.md`.                                                                  |
| `.claude/skills/refine/filing.md`         | changed       | New section "Editing a filed issue", in the Approach order, with D3 and D4. _Links_ step 5 names a Bug or a Chore (D3 A).                                                                                                                                                                            |
| `scripts/agent-unblock.mts`               | changed       | `draftLines` names `/refine spec <issue.number>`. Delete `INTENT`, `refineArg`, the fallback text and `body` in `Linked`. The header comment names the new command.                                                                                                                                  |
| `scripts/__tests__/agent-unblock.test.ts` | changed       | Line 508 expects `/refine spec 8`. Replace the two `it.each` blocks at lines 615 and 629 with one test: a Spec #8 with `#12` in its Intent box gets `/refine spec 8`, and the comment has no `12`.                                                                                                   |
| `scripts/word-count.mts`                  | changed       | Own entries for each `refine` file that passes 650 words, in path order before the wildcard. Raise the `spec.md` budget. Each budget is the new count, rounded up to the next 10.                                                                                                                    |
| `scripts/__tests__/word-count.test.ts`    | changed       | Line 73 expects the new `SKILL.md` budget, if `SKILL.md` gets an entry.                                                                                                                                                                                                                              |

`scripts/doc-links.mts` does not change. `filing.md` gets no link to `SKILL.md`, `spec.md` or `chore.md`, so it makes no new link cycle.

## Order of work

1. Change the `agent-unblock.test.ts` assertions. See them fail on `/refine spec 12`.
2. Edit `agent-unblock.mts`.
3. Write "Editing a filed issue" in `filing.md`.
4. Write the edit sections of `spec.md` and `chore.md`. Then edit `SKILL.md`.
5. Set the budgets in `word-count.mts` and its test.
6. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- The CI run of C1111 had its writes to `.claude/skills/` files denied. If this build gets the same denial, it builds the script rows. A local session builds the four skill rows. The build records this under `## Deviations`.
- `SKILL.md` (650) and `spec.md` (800) are near their budgets now. A raised budget is item 6 of #1114, so it is not a big departure.
- #1116 moves the slicing steps out of `spec.md` and depends on its edit section. If this build puts edit text into the slicing steps, #1116 must split them. The edit section of `spec.md` has its own `##` heading after "Hand-over".

## Proof

| Acceptance check                                                                         | Proven by                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/refine spec <Spec number>` edits that Spec and does not slice its Intent               | Review of the `SKILL.md` Type rule and `spec.md` edit section |
| `/refine spec <Intent number or M<n>>` slices as before                                  | Review: the slicing steps of `spec.md` have no diff           |
| A Bug or Chore number after `spec` gets its own mode and no edit                         | Review of the `SKILL.md` Type rule                            |
| `/refine chore <n>` redrafts that Chore; an idea drafts a new Chore                      | Review of `SKILL.md` and the `chore.md` edit section          |
| A contradicted decision keeps its Answer line and gets a new decision that cites it      | Review of the `spec.md` edit section                          |
| An issue with a plan file or open plan PR gets the plan named and "Set `status: draft`?" | Review of "Editing a filed issue"                             |
| A blocked issue with a plan gets no `status: draft` offer and keeps `status: blocked`    | Review of "Editing a filed issue"                             |
| A closed Spec or Chore stops the skill and nothing is edited                             | Review of "Editing a filed issue" and the two edit sections   |
| The unblock comment says `/refine spec <the Spec's own number>`                          | `agent-unblock.test.ts`, the changed and new tests            |
| `npm run words`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` | The five commands                                             |
| The skill changes GitHub only after a yes to a question of its own                       | Review: each `gh issue edit` follows its own question         |
| `bug.md` and `intent.md` do not change                                                   | Review: the diff has no lines in either file                  |

## Out of scope

- `filing.md` line 3 and the Bug text: #1115 and #1117 change them.
- The slicing redirect and the `docs/how-we-work.md` lines that name `/refine spec <Intent number>`: #1116 changes them.
- `.github/workflows/claude-unblock.yml` line 7 says "with `/refine spec`". The text stays true, and the file is a hand-back path.

## Deviations

- The run denied each write to `.claude/skills/refine/`. This build did not change `SKILL.md`, `spec.md`, `chore.md` or `filing.md`. It did not change `word-count.mts` or its test, because the budgets follow the skill text. A local session builds these rows.
