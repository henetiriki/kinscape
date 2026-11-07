# Plan: C639: Plans follow the STE writing rules

- **Spec:** #639
- **Status:** approved

## Approach

Add "plans" to the two lines that name what the STE rules cover. Change only those words. Keep the heading _Writing Specs, Bugs and Chores_, so that the links to `#writing-specs-bugs-and-chores` stay correct. Do not change merged plans.

## Files that change

| File                  | What                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/how-we-work.md` | _Writing Specs, Bugs and Chores_, first sentence: "New Specs, Bugs, Chores and plans follow these Simplified Technical English (ASD-STE100) rules:" |
| `AGENTS.md`           | _Writing_, last bullet: "Specs, Bugs, Chores and plans: [STE rules](docs/how-we-work.md#writing-specs-bugs-and-chores)."                            |

## Order of work

1. Edit `docs/how-we-work.md`.
2. Edit `AGENTS.md`.
3. Run `npm run words`, `npm run lint` and `npm run format:check`.

## Risks

- `AGENTS.md` is a hand-back path: `claude-hand-back.yml` labels this PR `hand-back`, and the tech lead builds it (`plans/README.md` rule 13).
- Each file gets one word. If a file goes over its budget (`AGENTS.md` 700, `docs/how-we-work.md` 850), cut text from that file. Add one Deviations line for each cut.

## Proof

| Acceptance check                                       | Proven by                                                            |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `docs/how-we-work.md` and `AGENTS.md` name plans       | `git grep -n "Chores and plans"` shows one line in each file         |
| `npm run words` passes                                 | CI, and its output in Evidence                                       |
| Links to `#writing-specs-bugs-and-chores` stay correct | Heading not changed; `git grep -l` lists the same files as on `main` |

## Out of scope

- Merged plans, `plans/README.md` and `plans/TEMPLATE.md`.
