# Plan: C618: Commands line says `npm run dev` and `npm run build` need `KINSCAPE_MEMORY_ADAPTERS=1` outside Vercel

- **Chore:** #618
- **Status:** approved

## Approach

One edit to `AGENTS.md`. The _Commands_ line gains a parenthetical in the style of its neighbours: `npm run dev` and `npm run build` (both need `KINSCAPE_MEMORY_ADAPTERS=1` outside Vercel). That adds 6 words to a file at 697 of 700, so the _Source of truth_ bullet on Key concepts drops its list of terms (12 words): the table is the source, the list is already incomplete, and _Writing_ says to say each fact once and link. Result: 691 words. `AGENTS.md` is a hand-back path (rule 13), so the tech lead builds this in a local session.

## Files that change

| File                             | New / changed | What                                                   |
| -------------------------------- | ------------- | ------------------------------------------------------ |
| `AGENTS.md`                      | Changed       | Commands line parenthetical; Key concepts list removed |
| `plans/chores/C618-build-env.md` | New           | This plan                                              |

## Order of work

1. Branch `chore/C618-build-env` from `origin/main`; commit the plan.
2. Edit `AGENTS.md`; commit.
3. Run `KINSCAPE_MEMORY_ADAPTERS=1 npm run build` with no `.env.local`, then lint, `format:check`, `words`, tests, `validate:boundaries` and e2e.

## Risks

- The `next dev` managed block in `AGENTS.md` is outside the count; the edit must not touch it.
- The hand-back workflow labels the PR `hand-back`: expected for a tech-lead PR.

## Proof

| Acceptance check                                   | Proven by                                     |
| -------------------------------------------------- | --------------------------------------------- |
| Commands line names the variable for dev and build | Reading the diff                              |
| `KINSCAPE_MEMORY_ADAPTERS=1 npm run build` passes  | Running it in a worktree with no `.env.local` |
| `words` and every other check pass                 | Local run of the check list; CI on the PR     |

## Out of scope

Any change to the app, workflows or settings; making a bare `next build` pass without variables.
