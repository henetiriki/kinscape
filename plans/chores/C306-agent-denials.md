# Plan: C306: Agent permission denials

- **Spec:** #306
- **Status:** approved

## Approach

The audit found 89 denials in 68 runs since 2026-10-19. Most came before C277's rules (#286, merged 2026-10-25). Only 4 runs came after them, and 3 of those are already covered by `rules.md`. The effect of C277 hasn't settled, so the rest are left until the next audit.

The gaps are deleting a tracked file (`rm lib/map/plant.ts`) and WebSearch (2 denials). `rules.md` gets one line for both. `settings.json` stays as it is: `Bash(git:*)` already allows `git rm` and `git mv`.

## Decisions

**D1 · Deleting files** · Decides: Tech lead

How should an agent delete or rename a tracked file during a build?

- **A.** Add a line to `rules.md`: delete or rename with `git rm` and `git mv`.
- ~~**B.** Allow `Bash(rm:*)` in `settings.json`.~~

**Answer: A** (@henetiriki)

**D2 · WebSearch (2 denials)** · Decides: Tech lead

- **A.** Leave it denied. Add a line to `rules.md`: with no web access, ask in your comment.
- ~~**B.** Allow `WebSearch` in `settings.json`.~~

**Answer: A** (@henetiriki)

## Files that change

| File                                 | New / changed | What                   |
| ------------------------------------ | ------------- | ---------------------- |
| `.github/agent/rules.md`             | Changed       | One line for D1 and D2 |
| `plans/chores/C306-agent-denials.md` | New           | This plan              |

## Order of work

1. Commit this plan first: `plan(C306): approved by @henetiriki`.
2. Edit `rules.md`; run lint, format check, `npm run words`, tests, the boundary validator and e2e.
3. Open the PR `C.306: Agent permission denials` with `Closes #306`.

## Proof

| Acceptance check                | Proven by                                  |
| ------------------------------- | ------------------------------------------ |
| `rules.md` names both forms     | The diff                                   |
| No `rm` or `WebSearch` denials  | The next audit issue, for runs after merge |
| Lint, format, words, tests, e2e | Their output in the PR                     |

**Hand back:** `.github/agent/**` is in CODEOWNERS, so the tech lead builds this locally.
