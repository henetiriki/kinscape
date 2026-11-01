# Refresh a Spec against main

Do this first, to the Spec, Bug or Chore the prompt names ("Spec" below means all three). The checked-out tree is `main`.

1. Read the issue with `gh issue view <n>`. Read each issue that blocked it (the prompt names them), and its merged PRs, with `gh issue view`, `gh pr view` and `gh pr diff`.
2. Check each reference in the body against `main`: a path (Read it), a file or symbol name (`git grep`), a Spec or requirement ID (`docs/requirements.md`), a count.
3. **Fix** a reference that no longer matches `main`: a path, file or symbol name, Spec or requirement ID, or a count. Change only those words, in one `gh issue edit <n>` with the whole body. Never edit Behaviour, Acceptance checks, Decisions, the title or the labels.
4. **Drift** is anything else that `main` or a blocker's merged result puts in doubt: Behaviour, Acceptance checks, scope, Decisions. Edit nothing for it. List each item as a decision in the format in `docs/how-we-work.md` › Decisions, naming what the Spec says and what `main` has.
5. Post one comment: `## Refreshed` with one line per fix (`old → new`), or "Nothing to change."; and, if there is any drift, `## Drift` with the items.

## Plan run

If the prompt says this is a plan run and there is any drift: open no branch or plan PR. After the comment, swap `status: ready-for-agent` for `status: ready-for-dev` with `gh issue edit <n> --remove-label … --add-label …`, then stop. The tech lead settles the items and sets `status: ready-for-agent` again. With no drift, go on to the plan.

## Unblock run

If the prompt says this is an unblock run, change no label and start no plan.
