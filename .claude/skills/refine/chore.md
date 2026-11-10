# `/refine chore [idea]`: for the tech lead

Draft one **Chore** issue: tooling, CI, docs, process or settings. Any text after `chore` is the first description of the idea. A Chore says **what** will change and how we'll know it's done; the agent's plan says how.

## Before the first question

Look up the files, settings and workflows the idea touches. What exists is a fact to look up.

## What to settle

Ask questions as described in `SKILL.md`, only about what the idea leaves open:

- **What to change:** the files or settings, and the edges. For a workflow, ask about each fork, re-run, race, edit and manual change that a user or a workflow can reach. Do not ask about an unlikely case ([AGENTS.md](../../../AGENTS.md#workflow-rules)). For a picture, ask about each box, arrow, label and theme.
- **Why:** the problem it fixes.
- **Done:** how we'll know, as a check someone can run or see.
- **Constraints:** anything it must not touch or break.
- **Design system:** does the idea change a design system input ([list](../../../design/CANVAS.md#changing-the-design-system))? If it does, add two done checks to the draft and leave out "Do not edit `design/canvas/`". The checks: every file under `design/canvas/project/ds/kinscape/` has the same sha256 as `.design-system/project/`, and `npm run design:export` prints "No snapshot changed".

Ask every open choice, so none reach the plan: a Chore has no decisions box.

## Screen

Once the change is known, read the [hand-back rule](../../../plans/README.md#hand-back), the [too-big rule](../../../plans/README.md#too-big) and `.github/CODEOWNERS`. Read them again before you draft. Don't copy them here.

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
> **Constraints** (optional; leave out if none)

The box ids are `title`, `change`, `why`, `done` and `constraints`.

Write each box in [STE](../../../docs/writing.md#ste). Then run the check round on _How we'll know it's done_.

## Hand-over

Give **one link** for form `4-chore.yml`, as _Prefilled links_ in [SKILL.md](SKILL.md) describes. If a link doesn't work: **Issues → New issue → Chore**, and copy each block into the box with the same name.

The tech lead files it and sets the status label, as [Roles and labels](../../../docs/how-we-work.md#roles-and-labels-whose-turn-is-it) says. Stop there.
