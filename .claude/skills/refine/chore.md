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

Once the change is known, and again before drafting, read `plans/README.md` rule 4 (and rule 7, which it links) and `.github/CODEOWNERS`. Don't copy them here.

If the agent would hand the chore back (a path in CODEOWNERS, a secret, token or connection string, or too big), name the path or reason and keep drafting. Tell the tech lead to keep `status: ready-for-dev` and either do it themselves or open a quick `chore:` PR, not to set `status: ready-for-agent`.

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

The tech lead files it. Unless it would be handed back, they then set `status: ready-for-agent` to start planning. Stop there.
