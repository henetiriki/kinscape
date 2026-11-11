# `/refine chore [idea]`: for the tech lead

Draft one **Chore** issue: tooling, CI, docs, process or settings. Any text after `chore` is the first description of the idea. A Chore says **what** will change and how we'll know it's done; the agent's plan says how.

## Before the first question

Find the files, settings and workflows that the idea touches. What exists is a fact to find.

## What to settle

Ask questions as described in `SKILL.md`, only about what the idea leaves open:

- **What to change:** the files or settings, and the edges. For a workflow, ask about each fork, re-run, race, edit and manual change that a user or a workflow can reach. For a picture, ask about each box, arrow, label and theme.
- **Why:** the problem it fixes.
- **Done:** how we'll know, as a check someone can run or see.
- **Constraints:** anything it must not touch or break.
- **Design system:** does the idea change a [design system input](../../../design/CANVAS.md#changing-the-design-system)? If it does, read that section. Add its **Issue text** to the draft: the done checks, and the Constraint sentence in Constraints. Add the output of step 5.4 in [Refreshing the copy](../../../design/CANVAS.md#refreshing-the-copy) as another done check. If the Chore adds components, add this done check: "Each drawing the design agent left has a line in one follow-up issue, with the reason."

Ask about every open choice, so that none reach the plan. A Chore has no decisions box.

## Screen

After you know the change, read the [hand-back rule](../../../plans/README.md#hand-back), the [too-big rule](../../../plans/README.md#too-big) and `.github/CODEOWNERS`. Read them again before you draft. Don't copy them here.

If the [hand-back rule](../../../plans/README.md#hand-back) would hand the chore back, name the path or reason and keep drafting.

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
> **Constraints** (optional; omit if none)

The box ids are `title`, `change`, `why`, `done` and `constraints`.

Write each box in [STE](../../../docs/writing.md#ste). Then run the check round on _How we'll know it's done_.

## Hand-over

Give **one link** for form `4-chore.yml`, as _Prefilled links_ in [SKILL.md](SKILL.md) describes. If a link doesn't work: **Issues → New issue → Chore**, and copy each block into the box with the same name.

The tech lead files it and sets the status label, as [Roles and labels](../../../docs/how-we-work.md#roles-and-labels-whose-turn-is-it) says. Stop there.
