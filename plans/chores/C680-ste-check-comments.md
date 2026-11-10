# Plan: C680: Tell the agents to check comments against the STE rules

- **Spec:** #680
- **Requirement IDs:** None
- **Status:** approved

## Approach

Add one line to `.github/agent/rules.md`, after the line about how to post PR and issue text. The line tells the agent to check each sentence against `docs/writing.md` › STE before it posts a comment. Every agent run that posts a comment loads `rules.md` first, so one line covers all of them.

## Decisions

**D1 · Wording of the line** · Decides: Tech lead

The Chore's draft repeats three STE rules, and its Constraints say not to copy them. Which wording goes in?

- **A.** The draft as written. It names the rules that the #572 comment broke, but it repeats rule text.
- **B.** Only the check: "Before you post a comment, check each sentence against `docs/writing.md` › STE." This copies no rule. The rules are already in context through `CLAUDE.md`.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                     | New / changed | What                       |
| ------------------------ | ------------- | -------------------------- |
| `.github/agent/rules.md` | changed       | Add the line chosen in D1. |

## Order of work

1. Add the line.
2. Run `npm run words` and `npm run format:check`.

## Risks

`.github/agent/**` is a hand-back path, so the tech lead builds this change.

## Proof

| Acceptance check                                    | Proven by                                         |
| --------------------------------------------------- | ------------------------------------------------- |
| `rules.md` has the line, and `npm run words` passes | The diff and the `npm run words` output in the PR |
| The next plan or unblock comment follows STE        | The tech lead checks one comment after the merge  |

## Out of scope

- PR bodies and commit messages.
