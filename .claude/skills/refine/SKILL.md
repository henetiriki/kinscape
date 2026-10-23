---
name: refine
description: Interview the user until both sides agree on what is wanted, then draft a KinScape Intent, the Specs for a milestone or Intent, or a Chore, each with a prefilled form link. Use `/refine intent` (product owner) or `/refine spec M<n>` / `/refine spec <intent issue number>` / `/refine chore [idea]` (tech lead).
disable-model-invocation: true
argument-hint: intent [your idea] | spec <M<n> or intent issue number> | chore [your idea]
---

# Refine

Questions first, drafting last. Agree on what is wanted before anything is written down. Nothing is built.

The argument picks the mode. Read the matching file and follow it, with the method below:

- `intent [idea]` → [intent.md](intent.md). For the product owner (PO), in plain language. Any text after `intent` is the PO's first description of the idea.
- `spec <M<n> | number>` → [spec.md](spec.md). For the tech lead. Slices a milestone or an accepted Intent into Specs.
- `chore [idea]` → [chore.md](chore.md). For the tech lead. Drafts one Chore issue and warns if the agent would hand it back.
- No argument, or anything else: ask which of the three they want.

## Method

Treat the topic as a **design tree**: every decision opens smaller decisions beneath it.

1. **Ask one question, then wait:** of the open questions whose inputs are settled, the one whose answer shapes the most others.
2. **Number it** (Q1, Q2, …; never restart) and give it a short title.
   - **Real alternatives:** call `AskUserQuestion` with just this question: text starting `Q<n> ·`, a header of up to 12 characters, 2–4 options, your pick first as "(Recommended)". The picker adds **Other**.
   - **Otherwise, or without the picker:** ask in chat, ending with a 💡 line worded so a plain "yes" accepts it. Say so the first time.
3. **Redraw the tree** after each answer. Skip questions an answer already settled.
4. **Look facts up, don't ask.** Check `docs/requirements.md`, existing issues and the repo yourself. Ask only about decisions. Questions that depend on a pending lookup wait until it's done.
5. **A recommendation is not an answer.** A branch stays open until the user confirms it. Never fill a gap silently; if a question comes up while drafting, ask it.
6. **Finish** when every branch is confirmed. Summarise what was agreed in a few lines, then write the draft as the mode file describes.

## Rules for every mode

- **Never build anything:** no code, branches, pull requests or edits to repository files. The output is a draft in the conversation. A command that only formats text, such as encoding a form link, is fine.
- **Never touch GitHub on your own.** Print the draft under one heading per form box. Create or change an issue only if the user asks and has `gh`, confirming each one.
- **Use the project's words.** The _Key concepts_ terms in `docs/requirements.md` mean exactly that. For a new term, add `Proposed term: <name> = <meaning>` under _Open questions_; don't edit the table.
- **Cite requirement IDs** (e.g. `MAP-03`). Don't invent requirements. If something isn't covered, ask.
- Follow the data rules in `AGENTS.md`.
- **Leave sizing out of an Intent.** Slicing happens only in spec mode.

## Prefilled links

Each drafted issue gets one link that opens its form filled in.

- Re-check the data rules first.
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
