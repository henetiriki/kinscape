# Plan: C634: Close /refine gaps found in plans with 5 or more decisions

- **Spec:** #634
- **Status:** approved

## Approach

Classify the 59 decisions by cause from each plan and its issue. Drop those #636's round catches (its PR maps DM.12.6.3 D2–D7). Add one STE line per remaining cause. The PR body maps each decision to its cause and line.

## Decisions

**D1 · Build-method decisions** · Decides: Tech lead

Some decisions only pick how to build (`notFound()` or `proxy.ts`).

- **A.** List them as "cannot catch": the plan says how (`chore.md`).
- **B.** Add a line: ask each hard-to-reverse method in `/refine`.
- **Other:** your own.

Recommended: A, because a Spec says what, not how.

**Answer: A** (@henetiriki)

## Files that change

| File                              | What                 |
| --------------------------------- | -------------------- |
| `.claude/skills/refine/spec.md`   | Cause lines; cuts    |
| `.claude/skills/refine/design.md` | Design cause lines   |
| `.claude/skills/refine/chore.md`  | Workflow and picture |

## Risks

- `spec.md` is near its 650 budget: cut text from it, one Deviations line per cut.
- `.claude/skills/**` is a hand-back path: the tech lead builds (rule 13).
- A cause that a form box closes better changes the form and every file that names it: a Deviations line.

## Proof

| Done check                     | Proven by                                 |
| ------------------------------ | ----------------------------------------- |
| `npm run words` passes         | CI                                        |
| Table of all 59 decisions      | PR body                                   |
| Each cause: a line or a reason | PR body table's last column, and the diff |

## Deviations

- Added causes: kit pages, outside formats.
- New `design.md` holds the design lines; `spec.md` was over budget.
- Approach's first-reading table cut; the PR body has the final one.
- `spec.md` cut: Step 2's box list; it points to the form's descriptions.
- `spec.md` cut: Behaviour's edges; the round asks them.
- `spec.md` cut: the link fallback; `SKILL.md` has it.
- `spec.md` cut: "Next.js instead of Vite".
