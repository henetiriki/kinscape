# Plan: C1116: /refine intent slices a milestone into Intents and an Intent into Specs

- **Spec:** #1116
- **Status:** approved

## Approach

`SKILL.md` reads the text after `intent`:

- Digits, with an optional `#`, are an issue number. The Type table reads its Type. An Intent goes to `slice-intent.md`. A Spec, Bug or Chore gets "#<n> is a <Type>: run `/refine <mode> <n>`".
- `M` and digits only go to `slice-milestone.md`.
- Any other text, or no text, is the PO's flow in `intent.md`.

After `spec`, `M<n>` or an Intent number prints the redirect of item 1 and edits nothing.

`slice-intent.md` takes the slicing steps of `spec.md`: _Before the first question_, _What to settle_, _Step 1: slice_, _Step 2: draft each Spec_ and _Hand-over_. `spec.md` keeps _Edit a filed Spec_ and two sections that the edit mode reads (D1 A):

- _Estimate_: the 600-line cap, the `git show --shortstat` measure, the "no comparable Spec" line and the confirm step.
- _Draft the boxes_: the `2-spec.yml` headings, the Estimate line, the grep rule, STE and the check round.

`slice-intent.md` links to both. Its first step reads the Intent with `gh issue view <number> --comments`. A closed Intent stops it: it edits nothing and says that a change needs a new Intent. A child Intent's title gives `M<n>.<k>`, so its Specs get `M<n>.<k>.<j>`.

`slice-milestone.md` finds the umbrella with `gh issue list --type Intent --state all --search "M<n> in:title"`. It takes the title that starts `Intent: M<n> `, with a space, so a child `Intent: M<n>.<k>` does not match. It reads the umbrella with `--comments` and applies the closed-Intent stop. It drafts the boxes of `1-intent.yml` for each child.

"Filing a child Intent" in `filing.md`:

1. Read the milestone whose title starts `M<n> ` from `gh api repos/{owner}/{repo}/milestones`. #292 (M4) has no milestone, so the umbrella cannot give it.
2. Ask "File the child Intents now?" as a question of its own.
3. Run `gh issue create` per child with `--type Intent`, `--label 'status: ready-for-dev'` and `--milestone '<title>'`.
4. Run one `addSubIssue` call per child, with the umbrella id from _Links_ step 1 and the URL that `gh issue create` prints (`subIssueUrl`).
5. If a call fails, follow _Links_ step 6.

## Decisions

D1 to D4 have answers. The issue body holds each answer, cited as "#1116 plan D<n>".

**D5 · Two slice lists on one milestone Intent** · Decides: Tech lead

`/refine intent M2` and `/refine intent 57` both post a slice list on #57. Items 2 and 3 both say "edit the comment that holds an earlier slice list". Each mode can write over the list of the other.

- **A.** The first line of each list names its kind: `Slice list: child Intents` or `Slice list: Specs`. Each mode edits only a comment with its own first line. A list with no first line is a Spec list. Cost: one sentence in each slice file.
- **B.** The skill shows each list comment and asks which one to edit. Cost: one more question per run, and a wrong answer writes over a list.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D6 · `/refine intent M0`** · Decides: Tech lead

M0 has no Intent issue (`spec.md` step 1), and its milestone has no open issue. `/refine intent M0` has no umbrella.

- **A.** `slice-milestone.md` says that M0 has no Intent issue, and stops. Cost: one sentence. No mode slices M0 into Specs.
- **B.** `intent M0` slices M0 into Specs, as `spec M0` does now. Cost: one exception in `SKILL.md` and one bullet in `slice-intent.md`. `intent M<n>` then has two meanings.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D7 · The umbrella after its last child Intent closes** · Decides: Tech lead

`docs/how-we-work.md` line 9 says "When its last Spec closes, a workflow sets the Intent to `status: ready-for-po`". `backlog-intent-ready.yml` runs only when a Spec closes. If a child Intent closes last, no workflow flags the umbrella. The Constraint keeps the workflows as they are.

- **A.** Add one sentence after line 9: when the last child Intent closes, the PO checks the umbrella and closes it. The tech lead files a Chore for the workflow. Cost: one sentence, and a hand-back Chore.
- **B.** Leave line 9. Cost: none, but the line is false for an umbrella.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D8 · Lines outside the Chore's list that become false** · Decides: Tech lead

Three lines say that the skill files no Intent with `gh`:

- `SKILL.md` line 64: "file a Spec, Chore or Bug as filing.md says";
- `SKILL.md` line 68: "Use a link for `/refine intent`";
- the `filing.md` title and line 3.

- **A.** Reword the three lines to name a child Intent, and the link for the PO's flow only. Cost: about 20 words.
- **B.** Change only the lines that the Chore names. Cost: none, but three lines contradict "Filing a child Intent".
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                       | New / changed | What                                                                                                                                                                                             |
| ------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.claude/skills/refine/SKILL.md`           | changed       | Item 1, as the Approach says. Lines 64 and 68 if D8 is A.                                                                                                                                        |
| `.claude/skills/refine/slice-intent.md`    | new           | Item 2, as the Approach says, with D5.                                                                                                                                                           |
| `.claude/skills/refine/slice-milestone.md` | new           | Item 3, as the Approach says, with D5 and D6.                                                                                                                                                    |
| `.claude/skills/refine/spec.md`            | changed       | Title `/refine spec <Spec number>`. Keep _Estimate_, _Draft the boxes_ and _Edit a filed Spec_ only.                                                                                             |
| `.claude/skills/refine/filing.md`          | changed       | New section "Filing a child Intent", in the Approach order. The title and line 3 if D8 is A.                                                                                                     |
| `.claude/skills/refine/design.md`          | changed       | Title `Design branches for /refine intent <n>`.                                                                                                                                                  |
| `docs/how-we-work.md`                      | changed       | Lines 7, 8, 36, 49 and 50 as item 6 says. The sentence after line 9 if D7 is A.                                                                                                                  |
| `design/CANVAS.md`                         | changed       | Line 7: `/refine intent <n>` slices a design Spec first.                                                                                                                                         |
| `plans/README.md`                          | changed       | Line 134: the line cap in `/refine intent <n>` › Step 1.                                                                                                                                         |
| `scripts/word-count.mts`                   | changed       | Move the `spec.md` entry to `slice-intent.md`. Delete the `spec.md` entry if the file fits 650. Raise each grown budget. Each budget is the new count, rounded up to the next 10, in path order. |
| `scripts/__tests__/word-count.test.ts`     | changed       | Line 73 expects the new `SKILL.md` budget, if it changes.                                                                                                                                        |

`scripts/doc-links.mts` does not change. No new file links to `SKILL.md`, and `spec.md` gets no link to `slice-intent.md`, so the build makes no new link cycle.

## Order of work

1. Write `slice-intent.md` from the slicing steps. Cut them from `spec.md`, and name its two kept sections.
2. Write `slice-milestone.md`, then "Filing a child Intent" in `filing.md`.
3. Edit `SKILL.md`, then `design.md`.
4. Edit `docs/how-we-work.md`, `design/CANVAS.md` and `plans/README.md`.
5. Run `git grep -n "refine spec"`. Only edit-mode lines, old plans and `claude-unblock.yml` line 7 stay.
6. Set the budgets in `word-count.mts` and its test.
7. Run the checks in [Verifying your work](../../AGENTS.md#verifying-your-work), with `npm run words` last.

## Risks

- The CI run of C1111 could not write to `.claude/skills/`. On the same denial, the build builds the other rows, a local session builds the skill rows, and `## Deviations` records it.
- `docs/how-we-work.md`, `plans/README.md` and `design/CANVAS.md` are near their budgets. Item 9 allows a raised budget.
- #1117 also edits `filing.md`. The PR that merges second rebases.
- No unit test runs a skill, so review proves each skill check.

## Proof

| Acceptance check                                                       | Proven by                                                  |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `intent M<n>` files child Intents with the label, milestone and parent | Review of `slice-milestone.md` and "Filing a child Intent" |
| A failed link call names each link still to set                        | Review of _Links_ step 6                                   |
| `intent <n>` slices into Specs; a child Intent gives `M<n>.<k>.<j>`    | Review of `slice-intent.md`                                |
| `intent 57` slices into Specs                                          | Review of the `SKILL.md` mode list                         |
| A Spec, Bug or Chore number after `intent` names its mode              | Review of the Type table                                   |
| An earlier slice list is edited, with no second list                   | Review of D5 in both slice files                           |
| A closed Intent stops both slice modes                                 | Review of both slice files                                 |
| `spec M<n>` and `spec <Intent number>` print the redirect              | Review of `SKILL.md`                                       |
| `intent` with other text starts the PO's flow                          | Review of the `SKILL.md` mode list                         |
| No file names `/refine spec` for slicing, except `claude-unblock.yml`  | Order of work step 5                                       |
| The five commands pass                                                 | The five commands                                          |
| The Constraint files do not change                                     | Review of the diff                                         |
| A `gh` write follows a yes to its own question                         | Review                                                     |

## Out of scope

- The `backlog-intent-ready.yml` flag for an umbrella (D7): a hand-back Chore.
- `.github/workflows/claude-unblock.yml` line 7 (#1116 plan D4).
- A milestone for #292: the tech lead sets it in the issue sidebar.

## Deviations

- The CI run denied each write to `.claude/skills/refine/`. A local session built the six skill rows and their budgets.
- The `design/CANVAS.md` and `plans/README.md` edits fit their budgets.
- The budgets are `SKILL.md` 940, `filing.md` 1030 and `slice-intent.md` 820. `spec.md` and `slice-milestone.md` fit the default 650, so `spec.md` has no entry.
- `slice-milestone.md` skips a child that already exists, so a re-run files no duplicate.
- `filing.md` stops if no milestone has the title `M<n> `. The call adds `?state=all`, so a closed milestone matches (#1121 review, tech lead).
- The `filing.md` title and section are "File a child Intent", not "Filing …" (STE rule 8). The anchor is `#file-a-child-intent`.
- "File a child Intent" sets a blocker link for each child that must close before another (_Links_ step 3).
- Big: `slice-intent.md` edits only a comment whose first line is `Slice list: Specs`. A list with no first line is not a Spec list: #57 holds about 15 such lists. If no comment has the first line, the skill posts a new list. This changes D5 A (#1121 review, tech lead).
- Big: `slice-milestone.md` starts the child number `<k>` after the highest `M<n>.<k>` in the title of any filed issue, Spec or Intent. Numbers from 1 clash with Specs such as `M2.1`. `docs/how-we-work.md` examples are `M2.16` and `M2.16.1` (#1121 review, tech lead).
- `docs/how-we-work.md`: a child Intent starts approved, with no approver. The tech lead files it. The Loop table, the milestone row and the Tech lead role say so. The budget is 1110 (#1121 review, tech lead).
