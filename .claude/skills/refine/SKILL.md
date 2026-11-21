---
name: refine
description: Interview the user until you both agree on the idea. Then draft a KinScape Intent, the Specs for a milestone or Intent, or a Chore, or refine a filed Spec, Chore or Bug. `gh` files a Spec or Chore. An Intent gets a prefilled form link. Use `/refine intent` (product owner) or `/refine spec`, `chore` or `bug` (tech lead).
disable-model-invocation: true
argument-hint: intent [your idea] | spec <M<n> or issue number> | chore [your idea or Chore number] | bug <issue number>
---

# Refine

Ask questions first. Draft last.

The argument picks the mode. Read the matching file and follow it, with the method below:

- `intent [idea]` → [intent.md](intent.md). For the product owner (PO), in plain language. Any text after `intent` is the PO's first description of the idea.
- `spec <M<n> | number>` → [spec.md](spec.md). For the tech lead. Slices a milestone or an accepted Intent into Specs. Edits a filed Spec.
- `chore [idea | number]` → [chore.md](chore.md). For the tech lead. Drafts one Chore issue, or redrafts a filed Chore. Digits, with an optional `#`, are an issue number. Any other text is an idea.
- `bug <number>` → [bug.md](bug.md). For the tech lead. Adds four sections to a filed Bug.
- No argument, or anything else: ask which of the four they want.

## The Type of a number

For a number after `spec` or `chore`, run `gh issue view <n> --json issueType --jq .issueType.name`. `M<n>` needs no Type.

| Type   | Mode                 |
| ------ | -------------------- |
| Intent | `spec`: slices it    |
| Spec   | `spec`: edits it     |
| Bug    | `bug`                |
| Chore  | `chore`: redrafts it |

- If the Type is not the mode that the user typed, say "#<n> is a <Type>: run `/refine <mode> <n>`". Edit nothing.
- If the issue has no Type, or `gh` fails, say why. Ask the user whether #<n> is an Intent, a Spec, a Bug or a Chore. Ask the user to paste the issue body. Then follow that mode. If `gh` failed, [filing.md](filing.md#editing-a-filed-issue) says what to skip.

## Method

Treat the topic as a **design tree**: every decision opens smaller decisions beneath it.

1. **Ask one question, then wait:** of the open questions whose inputs are settled, the one whose answer shapes the most others.
2. **Number it** (Q1, Q2, …; never restart) and give it a short title.
   - **Real alternatives:** call `AskUserQuestion` with just this question. The text starts with `Q<n> ·`. Put your pick first as "(Recommended)". Choose it as [Decisions](../../../docs/how-we-work.md#decisions) says.
   - **Otherwise, or without the picker:** ask in chat. End with a 💡 line that a plain "yes" accepts.
3. **Redraw the tree** after each answer. Skip questions an answer already settled.
4. **Find facts, don't ask.** Check `docs/requirements.md`, existing issues and the repo yourself. Ask only about decisions.
5. **A recommendation is not an answer.** A branch stays open until the user confirms it. Never fill a gap silently. If a question arises while you draft, ask it.
6. **Finish** when the user confirms every branch. Summarise what you agreed in a few lines. Then write the draft as the mode file describes.
7. **Check round.** After the draft and before filing, walk each check in the box the mode file names. Ask about a check, one at a time as above, only if:
   - it is vague, or a test can't check it;
   - it misses an edge that a user or a workflow can reach (no data, a Fuzzy date, a failed load, phone);
   - it holds a value the plan would otherwise choose.

   Do not ask about an unlikely case ([AGENTS.md](../../../AGENTS.md#workflow-rules)). Redraft with each answer.

## Rules for every mode

- **Never build anything:** no code, branches, pull requests or edits to repository files. The output is a draft in the conversation. A command that only formats text is fine.
- **Never touch GitHub on your own.** For each issue, ask the user to confirm in a question of its own. After a yes, run `gh` to create or change that issue.
- **Use the project's words.** The _Key concepts_ terms in `docs/requirements.md` and the `docs/glossary.md` terms mean exactly that. For a new term, add `Proposed term: <name> = <meaning>` under _Open questions_ in an Intent, or under _Out of scope_ in a Spec.
- **Cite requirement IDs.** Don't invent requirements.
- Follow the [Data rules](../../../AGENTS.md#data-rules).
- **Do not size an Intent.**

## Filing with gh

After the check round, file a Spec or Chore as [filing.md](filing.md) says. [spec.md](spec.md) and [chore.md](chore.md) edit a filed Spec or Chore. [bug.md](bug.md) edits a filed Bug.

## Prefilled links

Use a link for `/refine intent`, and where [filing.md](filing.md) says.

- Say the command only turns their text into a link.
- Run [form-link.mjs](scripts/form-link.mjs) with the form's file name. Put each box after a `=== <id>` line (the form's `id:` values, plus `title`). Use a quoted heredoc, never quotes on the command line.
- If it fails or Node is missing, say why and use the blocks. Reprint a block only if it changed.
