---
name: refine
description: Interview the user until both sides agree on what is wanted, then draft a KinScape Intent, the Specs for a milestone or Intent, or a Chore, each with a prefilled form link, or refine a filed Bug. Use `/refine intent` (product owner) or `/refine spec M<n>` / `/refine spec <intent issue number>` / `/refine chore [idea]` / `/refine bug <issue number>` (tech lead).
disable-model-invocation: true
argument-hint: intent [your idea] | spec <M<n> or intent issue number> | chore [your idea] | bug <issue number>
---

# Refine

Questions first, drafting last.

The argument picks the mode. Read the matching file and follow it, with the method below:

- `intent [idea]` → [intent.md](intent.md). For the product owner (PO), in plain language. Any text after `intent` is the PO's first description of the idea.
- `spec <M<n> | number>` → [spec.md](spec.md). For the tech lead. Slices a milestone or an accepted Intent into Specs.
- `chore [idea]` → [chore.md](chore.md). For the tech lead. Drafts one Chore issue.
- `bug <number>` → [bug.md](bug.md). For the tech lead. Adds four sections to a filed Bug.
- No argument, or anything else: ask which of the four they want.

## Method

Treat the topic as a **design tree**: every decision opens smaller decisions beneath it.

1. **Ask one question, then wait:** of the open questions whose inputs are settled, the one whose answer shapes the most others.
2. **Number it** (Q1, Q2, …; never restart) and give it a short title.
   - **Real alternatives:** call `AskUserQuestion` with just this question: text starting `Q<n> ·`, a header of up to 12 characters, 2–4 options, your pick first as "(Recommended)". The picker adds **Other**.
   - **Otherwise, or without the picker:** ask in chat, ending with a 💡 line worded so a plain "yes" accepts it.
3. **Redraw the tree** after each answer. Skip questions an answer already settled.
4. **Look facts up, don't ask.** Check `docs/requirements.md`, existing issues and the repo yourself. Ask only about decisions. Questions that depend on a pending lookup wait until it's done.
5. **A recommendation is not an answer.** A branch stays open until the user confirms it. Never fill a gap silently; if a question comes up while drafting, ask it.
6. **Finish** when every branch is confirmed. Summarise what was agreed in a few lines, then write the draft as the mode file describes.
7. **Check round.** After the draft and before the link, walk each check in the box the mode file names. Ask about a check, one at a time as above, only if:
   - it is vague, or a test can't check it;
   - it misses an edge that a user or a workflow can reach (no data, a Fuzzy date, a failed load, phone);
   - it holds a value the plan would otherwise choose.

   Do not ask about an unlikely case ([AGENTS.md](../../../AGENTS.md#workflow-rules)).

   Redraft with each answer.

## Rules for every mode

- **Never build anything:** no code, branches, pull requests or edits to repository files. The output is a draft in the conversation. A command that only formats text, such as encoding a form link, is fine.
- **Never touch GitHub on your own.** Create or change an issue only if the user asks and has `gh`, confirming each one.
- **Use the project's words.** The _Key concepts_ terms in `docs/requirements.md` mean exactly that. For a new term, add `Proposed term: <name> = <meaning>` under _Open questions_; don't edit the table.
- **Cite requirement IDs.** Don't invent requirements.
- Follow the [Data rules](../../../AGENTS.md#data-rules).
- **Leave sizing out of an Intent.**

## Prefilled links

Each drafted issue gets one link that opens its form filled in.

- Say the command only turns their text into a link.
- Run [form-link.mjs](scripts/form-link.mjs) with the form's file name and each box after a `=== <id>` line (the form's `id:` values, plus `title`), in a quoted heredoc, never in quotes on the command line:

  ```
  node .claude/skills/refine/scripts/form-link.mjs 2-spec.yml <<'EOF'
  === title
  Spec: …
  === summary
  …
  EOF
  ```

- If it fails or Node is missing, say why and use the blocks. Reprint a block only if it changed.
