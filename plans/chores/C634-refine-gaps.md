# Plan: C634: Close /refine gaps found in plans with 5 or more decisions

- **Spec:** #634
- **Status:** draft

## Approach

Classify the 59 decisions by cause from each plan and its issue. Drop those #636's round catches (its PR maps DM.12.6.3 D2–D7). Add one STE line per remaining cause. First reading of the causes:

| Cause                                          | Example        | Line in                     |
| ---------------------------------------------- | -------------- | --------------------------- |
| Line estimate under the merged size            | DM.13.10 D5–D6 | `spec.md` › Step 1          |
| A board draws a part, state or value not named | DM.12.6.1 D1   | `spec.md` › What to settle  |
| A board draws no close, leave, timer or fail   | DM.6 D1, D4    | `spec.md` › What to settle  |
| How the design check sees a timed part         | DM.5 D4        | `spec.md` › Proof           |
| Workflow edges: forks, re-runs, races, edits   | C266 D2–D5     | `chore.md` › What to change |
| A picture's content and themes                 | C436 D1–D5     | `chore.md` › What to change |
| How to build it                                | DM.4 D1        | PR body: cannot catch (D1)  |

## Decisions

**D1 · Build-method decisions** · Decides: Tech lead

Some decisions only pick how to build (`notFound()` or `proxy.ts`).

- **A.** List them as "cannot catch": the plan says how (`chore.md`).
- **B.** Add a line: ask each hard-to-reverse method in `/refine`.
- **Other:** your own.

Recommended: A, because asking every method makes `/refine` a plan.

## Files that change

| File                             | What              |
| -------------------------------- | ----------------- |
| `.claude/skills/refine/spec.md`  | Lines above; cuts |
| `.claude/skills/refine/chore.md` | Lines above       |

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
