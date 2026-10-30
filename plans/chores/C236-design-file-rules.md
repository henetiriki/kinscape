# Plan: C236: AGENTS.md rules for design files and design mismatches

- **Spec:** #236
- **Status:** approved

## Approach

One bullet after the `design/DESIGN.md` line in `AGENTS.md` holds both rules, linking to `DESIGN.md` › Screens for how the workflow works:

> - Only the design agent edits `design/canvas/`; a [workflow](design/DESIGN.md#screens) makes `design/source/` and `design/*.jpg` from it. Edit none of them. If the app can't match a snapshot, or one looks wrong, don't build around it: raise a Bug naming the screen and the difference.

## Decisions

**D1 · Room for the rules** · Decides: Tech lead

`AGENTS.md` uses about 648 of its 650 words; the bullet adds 42.

- **A.** Raise the `AGENTS.md` budget in `scripts/word-count.mts` to 700.
- ~~**B.** Keep 650: put the rules in `design/DESIGN.md` › Screens instead, which line 12 already sends agents to.~~
- ~~**Other:** your own.~~

Recommended: A, because every agent loads `AGENTS.md`, while a build agent reads `DESIGN.md` only when it looks up a value.

**Answer: A** (Tech lead)

**D2 · The match-design skill's rule** · Decides: Tech lead

`.claude/skills/match-design/SKILL.md:31` says to "say so" when the design looks wrong; the new rule says to raise a Bug.

- **A.** End that rule with "If the design looks wrong, follow `AGENTS.md`."
- ~~**B.** Leave the skill as it is.~~
- ~~**Other:** your own.~~

Recommended: A, so the rule lives in one place and the two can't disagree.

**Answer: A** (Tech lead)

## Files that change

| File                                   | What                                 |
| -------------------------------------- | ------------------------------------ |
| `AGENTS.md`                            | The bullet                           |
| `scripts/word-count.mts`, its test     | `AGENTS.md` budget 700 (D1 A)        |
| `.claude/skills/match-design/SKILL.md` | Line 31 points to `AGENTS.md` (D2 A) |

## Risks

- The rule also bars editing `design/source/fonts.css` and `kse-*.svg`, which aren't exported; font changes (as in B230) go to the design agent.

## Proof

| Acceptance check                                 | Proven by                                                     |
| ------------------------------------------------ | ------------------------------------------------------------- |
| Each rule stated once; `words` passes            | `git grep` per rule; `npm run words`, `npm test` output in PR |
| Next designed-screen build edits no design files | That PR's file list, linked on #236                           |
