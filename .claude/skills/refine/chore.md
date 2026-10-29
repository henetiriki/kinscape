# `/refine chore [idea]`: for the tech lead

Draft one **Chore** issue: tooling, CI, docs, process or settings. Any text after `chore` is the first description of the idea. A Chore says **what** will change and how we'll know it's done; the agent's plan says how.

## Before the first question

Look up the files, settings and workflows the idea touches. What exists is a fact to look up.

## What to settle

Ask questions as described in `SKILL.md`, only about what the idea leaves open:

- **What to change:** the files or settings, and the edges.
- **Why:** the problem it fixes.
- **Done:** how we'll know, as a check someone can run or see.
- **Constraints:** anything it must not touch or break.

Ask every open choice, so none reach the plan: a Chore has no decisions box.

## Screen

Once the change is known, and again before drafting, read `plans/README.md` rule 13 (and rule 7, which it links) and `.github/CODEOWNERS`. Don't copy them here.

If rule 13 would hand the chore back, name the path or reason and keep drafting.

## The draft

Show one heading per box of `.github/ISSUE_TEMPLATE/4-chore.yml`, in order. If the form differs, follow the form.

> **Title** (starting "Chore: ")
>
> **What to change**
>
> **Why**
>
> **How we'll know it's done**
>
> **Constraints** (optional; leave out if none)

The box ids are `title`, `change`, `why`, `done` and `constraints`.

## Hand-over

Give **one link** for form `4-chore.yml`, as _Prefilled links_ in [SKILL.md](SKILL.md) describes. If a link doesn't work: **Issues → New issue → Chore**, and copy each block into the box with the same name.

The tech lead files it and sets the status label, as [Roles and labels](../../../docs/how-we-work.md#roles-and-labels-whose-turn-is-it) says. Stop there.
