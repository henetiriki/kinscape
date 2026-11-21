# Plan: C1115: /refine bug drafts and files a new Bug

- **Spec:** #1115
- **Status:** draft

## Approach

`SKILL.md` reads the text after `bug`:

- Digits only, with an optional `#`, are a filed Bug. `bug.md` edits it as it does now.
- Any other text is the description of a new Bug. `bug.md` sends it to a new `## New Bug` section.
- With no text, the skill asks for a Bug number or a description.

`## New Bug` comes before "Before the first question" and has its own steps:

1. Take the description as the first report.
2. Find facts as steps 3 and 4 of "Before the first question" say. Steps 1 and 2 read a filed Bug, so they do not apply.
3. Draft the title (`Bug: ` from the form) and the three boxes of `3-bug.yml`. _What happened?_ keeps the tech lead's own words.
4. Settle the four sections as "What to settle" says. Show them as "The draft" says. Run the check round on _Acceptance checks_.
5. Follow the filing steps of `filing.md`. Do not use "Hand-over": it edits a filed Bug.

The section does not link to "Hand-over", so #1117 can replace the "Edit #<number> now?" paragraph and not touch `## New Bug`.

`filing.md` gets the Bug in three places:

- Line 3 says that `bug.md` files a new Bug with these steps.
- Step 5 writes the `### <label>` headings of `3-bug.yml`, then the `<!-- refine bug -->` line, then the four sections. That makes the seven boxes.
- "If `gh` fails" fills the three boxes with `form-link.mjs` and the ids `title`, `what`, `expected` and `where`. It then prints the `<!-- refine bug -->` line and the four sections, as `bug.md` line 33 does for a filed Bug. Step 2's link bullet follows the same rule for a Bug.

A blocker at the links question reaches the `status: blocked` label through _Links_ step 5. #1114 made that step cover a Bug or a Chore (D1).

## Decisions

**D1 · The status label of a new Bug with a blocker** · Decides: Tech lead

Filing step 3 puts `status: blocked` on a new Chore with a blocker at `gh issue create`. _Links_ step 5 (#1114) swaps the label of a blocked Bug or Chore after the create. #1115 says that `gh issue create` makes a Bug with `status: ready-for-dev`, and that a Bug with a blocker gets `status: blocked`. Which call sets the label?

- **A.** `gh issue create` uses the form label, `status: ready-for-dev`. _Links_ step 5 then swaps it for `status: blocked`. Cost: no new text.
- **B.** Step 3 names "a Bug or a Chore", so `gh issue create` uses `status: blocked`. Cost: three words in `filing.md`. The create label then differs from `status: ready-for-dev` in the done check.
- **Other:** your own.

Recommended: A, because both done checks then hold as written. B saves one `gh` call. With A, the Bug has `status: ready-for-dev` for one call, and no workflow starts on that label.

**D2 · Lines outside the Chore's list that say a Bug is only edited** · Decides: Tech lead

The Chore names the mode list, the `argument-hint`, "Filing with gh" and `filing.md` line 3. Four other lines become false:

- the `SKILL.md` `description`: "`gh` files a Spec or Chore";
- the `filing.md` title: "Filing a Spec or Chore with `gh`";
- the `bug.md` title: "`/refine bug <issue number>`";
- `bug.md` line 3: "Make a filed **Bug** clear".

#1116 item 1 rewrites the `SKILL.md` `description` again. #1117 changes only "Hand-over" of `bug.md`.

- **A.** Reword the four lines to name a new Bug too. Cost: about 25 words in three files. The Constraint "Do not change the `bug <n>` flow" applies to the steps, and this option changes no step.
- **B.** Change only the lines that the Chore names. Cost: none, but four lines say that the skill never files a Bug.
- **Other:** your own.

Recommended: A, because a reader of the title or the description must find the new mode.

## Files that change

| File                                   | New / changed | What                                                                                                                                                                                                           |
| -------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/refine/SKILL.md`       | changed       | `argument-hint` and mode list: `bug <number or description>`, with the digits rule and the empty-text question. "Filing with gh": `bug.md` files a new Bug or edits a filed one. The `description` if D2 is A. |
| `.claude/skills/refine/bug.md`         | changed       | New `## New Bug` section before "Before the first question", in the Approach order. One line after line 3 sends a description there. The title and line 3 if D2 is A.                                          |
| `.claude/skills/refine/filing.md`      | changed       | Line 3, step 5, the step 2 link bullet and "If `gh` fails", as the Approach says. The title if D2 is A. Step 3 if D1 is B.                                                                                     |
| `scripts/word-count.mts`               | changed       | Raise the `SKILL.md` and `filing.md` budgets. Add an entry for `bug.md` if it passes 650 words. Each budget is the new count, rounded up to the next 10.                                                       |
| `scripts/__tests__/word-count.test.ts` | changed       | Line 73 expects the new `SKILL.md` budget.                                                                                                                                                                     |

`scripts/doc-links.mts` does not change. `bug.md` already links to `filing.md`, and `filing.md` gets no link to `bug.md`.

## Order of work

1. Edit `filing.md`.
2. Write `## New Bug` in `bug.md`.
3. Edit `SKILL.md`.
4. Set the budgets in `word-count.mts` and its test.
5. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- `SKILL.md` and `filing.md` are near their budgets of 800 and 750 now. A raised budget is item 4 of #1115, so it is not a big departure.
- No unit test runs a skill. Review proves each skill check, as for C1114.
- A description can name a real person. The Data rules in "Rules for every mode" of `SKILL.md` cover this, so the plan adds no rule.

## Proof

| Acceptance check                                                                          | Proven by                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/refine bug <description>` drafts the three boxes, the marker line and the four sections | Review of `## New Bug` and filing step 5                      |
| A yes makes one `gh issue create` with type `Bug`, `status: ready-for-dev`, seven boxes   | Review of filing steps 3, 5 and 7 with `3-bug.yml`            |
| "404 on the map page" is a new Bug                                                        | Review of the digits rule in `SKILL.md`                       |
| A bare number edits that Bug as now                                                       | Review: the steps after `## New Bug` in `bug.md` have no diff |
| No text after `bug` gets the question for a number or a description                       | Review of the `SKILL.md` mode list                            |
| A blocker gives the links and `status: blocked`                                           | Review of filing step 8 and _Links_ step 5 (D1)               |
| A no to "File it now?" files nothing                                                      | Review of filing step 2                                       |
| A failed `gh` call gives a link and prints the four sections                              | Review of "If `gh` fails" in `filing.md`                      |
| `npm run words`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`  | The five commands                                             |
| The skill changes GitHub only after a yes to a question of its own                        | Review: the one `gh issue create` follows "File it now?"      |
| `intent.md`, `spec.md` and `chore.md` do not change                                       | Review: the diff has no lines in these files                  |

## Out of scope

- A Type read after `bug <n>`. The table in "The Type of a number" reads a Type only after `spec` or `chore`. The Constraint keeps the `bug <n>` flow, so #1117 is the place for it.
- The closed-Bug rule and the shared edit steps for `bug <n>`: #1117 adds them.
- `docs/how-we-work.md` line 40 names `/refine bug <number>`. The text stays true.
