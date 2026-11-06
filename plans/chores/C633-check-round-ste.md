# Plan: C633: Acceptance-check round in /refine; STE for Specs, Bugs and Chores

- **Spec:** #633
- **Status:** approved

## Approach

`SKILL.md` › _Method_ gets a step after _Finish_: the check round, with the three problems from the Chore. Each mode file names the box the round walks; `intent.md` asks in plain words. `docs/how-we-work.md` gets `## Writing Specs, Bugs and Chores` with the five rules. `spec.md`, `chore.md`, the three forms and `AGENTS.md` › _Writing_ link to it. A file over budget loses text from itself.

## Decisions

**D1 · Where each form links to the STE section** · Decides: Tech lead

- **A.** The first text box's `description:` (`summary`, `what`, `change`), matching the Chore's "descriptions".
- **B.** The form's top `markdown` block; `3-bug.yml` gets a new one.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                                 | What                       |
| ------------------------------------ | -------------------------- |
| `.claude/skills/refine/SKILL.md`     | Check round step           |
| `.claude/skills/refine/spec.md`      | Round on Acceptance checks |
| `.claude/skills/refine/chore.md`     | Round on _done_; link      |
| `.claude/skills/refine/intent.md`    | Round in plain words       |
| `docs/how-we-work.md`                | STE section                |
| `.github/ISSUE_TEMPLATE/2-spec.yml`  | Link (D1)                  |
| `.github/ISSUE_TEMPLATE/3-bug.yml`   | Link (D1)                  |
| `.github/ISSUE_TEMPLATE/4-chore.yml` | Link (D1)                  |
| `AGENTS.md`                          | Link in _Writing_          |

## Risks

- `SKILL.md`, `spec.md`, `AGENTS.md` and `how-we-work.md` sit near budget: cut text from that file, one Deviations line per cut.
- `.claude/skills/**` and `AGENTS.md` are hand-back paths: the tech lead builds (rule 13).

## Proof

| Acceptance check              | Proven by                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- |
| `npm run words` passes        | CI                                                                         |
| Round run on DM.12.6.3 (#198) | Evidence: each question and the check that caused it                       |
| STE section and its links     | `git grep -l "how-we-work.md#writing-specs-bugs-and-chores"` lists all six |
