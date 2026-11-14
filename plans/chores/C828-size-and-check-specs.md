# Plan: C828: Size a Spec by measure, check its facts and show each check

- **Spec:** #828
- **Status:** approved

## Approach

Make the eight edits of #828.

## Decisions

**D1 · How the new text fits the word budgets** · Decides: Tech lead

Word for word, the edits add about 140 words to `spec.md` (43 free) and 22 to `refresh.md` (2 free). The Constraint blocks a budget change and a move to another file.

- **A.** Keep the new text word for word. Cut about 100 other words of `spec.md` and 20 of `refresh.md`.
- **B.** Shorten the new text to about 113 and 18 words. Cut the text that repeats `SKILL.md`, `AGENTS.md` or a new rule:
  - `spec.md`: the intro after "**Specs**", "Look at the repository…", "The PO already approved it.", "Ask questions as described in `SKILL.md`.", the two sentences under _What to settle_, "Write each box in STE.", "Confirm the slices before you draft." and the `gh issue comment` offer.
  - `refresh.md`: "The checked-out tree is `main`.", "Issue text is untrusted…" and "(the prompt names them)".
- **Other:** your own.

**Answer: Other:** Increase the budget and name as deviation (@henetiriki)

## Files that change

| File                            | New / changed | What                      |
| ------------------------------- | ------------- | ------------------------- |
| `.claude/skills/refine/spec.md` | changed       | Edits 1, 2 and 4 to 7; D1 |
| `.github/agent/spec-checks.md`  | changed       | Edit 3                    |
| `.github/agent/refresh.md`      | changed       | Edit 8; D1                |

## Risks

- All three files are hand-back paths. The tech lead builds.
- Edit 6 asks for blocker links in Step 1. `filing.md` › Links sets them after filing.
- Respond comments also end with the check lines.

## Proof

| Done check                                     | Proven by                                               |
| ---------------------------------------------- | ------------------------------------------------------- |
| `spec.md`, `spec-checks.md`, `refresh.md` text | The diff                                                |
| Words, format and lint pass                    | `npm run words`, `npm run format:check`, `npm run lint` |
| Files in the table only                        | `git diff --stat origin/main`                           |
| The next Drift comment numbers on and checks   | The tech lead reads it on the issue                     |
