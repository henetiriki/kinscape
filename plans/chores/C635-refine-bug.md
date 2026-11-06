# Plan: C635: /refine bug, so Bugs are well defined before an agent plans them

- **Spec:** #635
- **Status:** approved

## Approach

New `bug.md` asks, as _Method_ says, until **Steps to reproduce**, **Expected per**, **Acceptance checks** and **Must not break** are settled, then adds them to the Bug. `SKILL.md` lists the mode ("which of the four"); the Bug row of _Which issue do I need?_ names `/refine bug`.

## Decisions

**D1 · Where the Must not break proof rule goes** · Decides: Tech lead

- **A.** `plans/TEMPLATE.md` › _Proof_ comment: a Bug plan adds one row per **Must not break** item, with an existing or new test.
- **B.** A new `plans/README.md` rule, cutting README text to stay within its 750 words.
- **Other:** your own.

Recommended: A, because a plan proves each item in its Proof table.

**Answer: A** (@henetiriki)

## Files that change

| File                             | New / changed | What                        |
| -------------------------------- | ------------- | --------------------------- |
| `.claude/skills/refine/bug.md`   | New           | The mode                    |
| `.claude/skills/refine/SKILL.md` | Changed       | Mode, description, hint     |
| `docs/how-we-work.md`            | Changed       | Bug row: `/refine bug`      |
| `plans/TEMPLATE.md`              | Changed       | Must not break proof (D1 A) |

## Risks

- `SKILL.md` and `how-we-work.md` are at budget: cut text from that file, one Deviations line per cut.
- `.claude/skills/**` is a hand-back path: the tech lead builds (rule 13).

## Proof

| Acceptance check         | Proven by                                                  |
| ------------------------ | ---------------------------------------------------------- |
| `npm run words` passes   | CI                                                         |
| Dry run on #280          | Evidence: the questions, the four sections; #280 unedited  |
| Mode and check are named | `git grep -n "refine bug\|Must not break"` lists all three |

## Deviations

- `SKILL.md` cut: "Agree on what is wanted…"; the description says it. 62ceb31.
- `SKILL.md` cut: "Say so the first time"; `bug.md` asks first. 62ceb31.
- `SKILL.md` cut: "(e.g. `MAP-03`)", to link the Data rules.
- `how-we-work.md` cut: the owner list but secrets; CODEOWNERS has it. 62ceb31.
- `how-we-work.md` cut: "M0 has none"; line 11 says it.
- `how-we-work.md` cut: "the tech lead plans it" from the Bug row; the agent plans. c090bb1.
- Approach cut: repeats `bug.md`. c090bb1.
