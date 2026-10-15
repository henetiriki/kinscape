---
name: refine
description: Interview the user until both sides agree on what is wanted, then draft a Kinscape Intent or the Specs for a milestone or Intent, each with a prefilled form link. Use `/refine intent` (product owner) or `/refine spec M<n>` / `/refine spec <intent issue number>` (tech lead).
disable-model-invocation: true
argument-hint: intent [your idea] | spec <M<n> or intent issue number>
---

# Refine

Questions first, drafting last. Agree on what is wanted before anything is written down. Nothing is built.

The argument picks the mode. Read the matching file and follow it, with the method below:

- `intent [idea]` → [intent.md](intent.md). For the product owner (PO), in plain language. Any text after `intent` is the PO's first description of the idea.
- `spec <M<n> | number>` → [spec.md](spec.md). For the tech lead. Slices a milestone or an accepted Intent into Specs.
- No argument, or anything else: ask which one they want.

## Method

Treat the topic as a **design tree**: every decision opens smaller decisions beneath it. Work in **rounds**.

1. **Ask the frontier.** The frontier is every open question whose inputs are already settled. Put the whole frontier in one round, then stop and wait. Tell the user how to reply: type in the chat, and "yes" accepts a 💡 suggestion.
2. **Number each question** (Q1, Q2, …) and keep counting across rounds; never restart at Q1. Give each a short title and a body, with options where there are real alternatives. End each with a 💡 line stating your recommended answer, worded so a plain "yes" accepts it.
3. **Redraw the tree** from the answers and build the next frontier.
4. **Look facts up, don't ask.** Check `docs/requirements.md`, existing issues and the repo yourself. Ask only about decisions. Questions that depend on a pending lookup wait for the next round.
5. **A recommendation is not an answer.** A branch stays open until the user confirms it. Never fill a gap silently; if a question comes up while drafting, ask it.
6. **Finish** when every branch is confirmed. Summarise what was agreed in a few lines, then write the draft as the mode file describes.

## Rules for every mode

- **Never build anything:** no code, branches, pull requests or edits to repository files. The output is a draft in the conversation. A command that only formats text, such as encoding a form link, is fine.
- **Never touch GitHub on your own.** Print the draft under one heading per form box. Create or change an issue only if the user asks and has `gh`, confirming each one.
- **Use the project's words.** The *Key concepts* terms in `docs/requirements.md` mean exactly that. For a new term, add `Proposed term: <name> = <meaning>` under *Open questions*; don't edit the table.
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
