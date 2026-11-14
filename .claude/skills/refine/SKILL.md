---
name: refine
description: Interview the user until both sides agree on what is wanted, then draft a KinScape Intent (prefilled form link), the Specs for a milestone or Intent, or a Chore (both filed with `gh`), or refine a filed Bug. Use `/refine intent` (product owner) or `/refine spec`, `chore` or `bug` (tech lead).
disable-model-invocation: true
argument-hint: intent [your idea] | spec <M<n> or intent issue number> | chore [your idea] | bug <issue number>
---

# Refine

Ask questions first. Draft last.

The argument picks the mode. Read the matching file and follow it, with the method below:

- `intent [idea]` → [intent.md](intent.md). For the product owner (PO), in plain language.
- `spec <M<n> | number>` → [spec.md](spec.md).
- `chore [idea]` → [chore.md](chore.md).
- `bug <number>` → [bug.md](bug.md).
- No argument, or anything else: ask which of the four they want.

## Method

Treat the topic as a **design tree**: every decision opens smaller decisions beneath it.

1. **Ask one question, then wait:** of the open questions whose inputs are settled, the one whose answer shapes the most others.
2. **Number it** (Q1, Q2, …; never restart) and give it a short title.
   - **Real alternatives:** call `AskUserQuestion` with just this question. The text starts with `Q<n> ·`. Put your pick first as "(Recommended)".
   - **Otherwise, or without the picker:** ask in chat. End with a 💡 line that a plain "yes" accepts.
3. **Redraw the tree** after each answer.
4. **Find facts, don't ask.** Check `docs/requirements.md`, existing issues and the repo yourself. Ask only about decisions.
5. **A recommendation is not an answer.** A branch stays open until the user confirms it.
6. **Finish** when the user confirms every branch. Then write the draft as the mode file describes.
7. **Check round.** After the draft and before filing, walk each check in the box the mode file names. Ask about a check, one at a time as above, only if:
   - it is vague, or a test can't check it;
   - it misses an edge that a user or a workflow can reach (no data, a Fuzzy date, a failed load, phone);
   - it holds a value the plan would otherwise choose.

   Do not ask about an unlikely case ([AGENTS.md](../../../AGENTS.md#workflow-rules)). Redraft with each answer.

## Rules for every mode

- **Never build anything:** no code, branches, pull requests or edits to repository files. The output is a draft in the conversation. A command that only formats text is fine.
- **Never touch GitHub on your own.** Create or change an issue with `gh` only after the user confirms it in a question of its own, one issue at a time.
- **Use the project's words.** For a new term, add `Proposed term: <name> = <meaning>` under _Open questions_ in an Intent, or under _Out of scope_ in a Spec.
- Follow the [Data rules](../../../AGENTS.md#data-rules).
- **Do not size an Intent.**

## Filing with gh

Use this for a Spec or Chore, after the check round. [bug.md](bug.md) edits a filed Bug.

1. Ask "File it now?". If the answer is not yes, file nothing.
2. Read the title prefix and `labels:` from the form in `.github/ISSUE_TEMPLATE/`.
3. Write the body to a new file outside the repo, in the scratchpad or `$TMPDIR`. Write one `### <label>` heading per form box, in the form's order, because the Spec-link workflow reads "Intent or milestone". Under an empty optional box, write `_No response_`.
4. Run `gh issue create --title <title> --label <label> --body-file <file>` once. Report the issue number.

If `gh` is missing, signed out or fails, say why and give a prefilled link. If the user asks for a link, give it and file nothing.

## Prefilled links

Use a link for `/refine intent` and in the cases above.

- Say the command only turns their text into a link.
- Run [form-link.mjs](scripts/form-link.mjs) with the form's file name. Put each box after a `=== <id>` line (the form's `id:` values, plus `title`). Use a quoted heredoc, never quotes on the command line.
- If it fails or Node is missing, say why and use the blocks.
