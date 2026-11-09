# Plan: C648: Write down unlikely edge cases and do not build them

- **Spec:** #648
- **Status:** approved

## Approach

Add the `AGENTS.md` bullet. Each of the other six files gets one sentence that links to the bullet. Each new line holds the phrase that the first check greps for. In `fix-review.md` and `SKILL.md`, cut words that repeat a nearby rule. Each cut keeps the rule's meaning and adds a Deviations line.

## Decisions

**D1 · Where the reviewer posts an unlikely-input finding** · Decides: Tech lead

`review.md` already sends gaps that no committed input reaches to one `gh pr comment`.

- **A.** Put the **PLAUSIBLE** finding in that comment. The fix-review run replies in its final PR comment.
- **B.** Post it inline, as for other findings. The fix-review run replies on its thread.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                             | What                       |
| -------------------------------- | -------------------------- |
| `AGENTS.md`                      | Bullet in _Workflow rules_ |
| `.github/agent/review.md`        | Rule in _Findings_ (D1)    |
| `.github/agent/fix-review.md`    | Reply rule (D1); cuts      |
| `.github/agent/build.md`         | Use the final PR comment   |
| `.claude/skills/refine/SKILL.md` | Check round edge; cuts     |
| `.claude/skills/refine/chore.md` | Edge question limit        |
| `.claude/skills/refine/spec.md`  | Use **Flagged concerns**   |

## Risks

- All seven paths hand the PR back: the tech lead builds (rule 13).
- `AGENTS.md` sits near its budget of 700. If the bullet passes it, cut words and add a Deviations line.

## Proof

| Acceptance check                       | Proven by                                         |
| -------------------------------------- | ------------------------------------------------- |
| The grep lists the seven files         | `git grep -l` output in Evidence                  |
| The bullet names the three exclusions  | Diff of `AGENTS.md`                               |
| `npm run words` passes                 | CI                                                |
| `docs/security.md` has no change       | `git diff --stat origin/main` in Evidence         |
| The reviewer and fix-review run follow | The next PR with a speculative guard, after merge |

## Deviations

- Cuts: seven repeated phrases in `fix-review.md`, three in `SKILL.md`.
- `build.md` names the final PR comment, not **Risks** (the plan is approved).
- `fix-review.md` matches the `Unlikely case:` marker, not **PLAUSIBLE**.
