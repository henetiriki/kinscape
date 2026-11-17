# Plan: C952: Add reply and cd rules to CLAUDE.md

- **Spec:** #952
- **Status:** draft

## Approach

Add the two sections of "What to change" to `CLAUDE.md`, after "Claude-specific notes". The text is as the Chore gives it, except for the answers to D1 and D2. `CLAUDE.md` has about 65 counted words, and the new text adds about 70, so it stays in its budget of 150. `CLAUDE.md` is a hand-back path, so the tech lead builds.

## Decisions

**D1 · The subshell rule in CI** · Decides: Tech lead

CI agent runs also load `CLAUDE.md`. `.github/agent/rules.md` tells a CI agent to use no `&&` in a Bash call, and the settings deny it. A CI agent that obeys `(cd dir && command)` gets a denial. How does the Commands section treat CI?

- **A.** Add the text as it is. A CI agent works from the project root, so the subshell rule seldom applies.
- **B.** Start the rule with "In a local session,". This adds four words.
- **C.** Change the subshell rule to a tool flag, for example `git -C dir` or `npm --prefix dir`. This uses no `&&`.
- **Other:** your own.

Recommended: B, because CI then gets no rule that its settings deny.

**D2 · The Commands heading** · Decides: Tech lead

`CLAUDE.md` imports `AGENTS.md`, which has a `## Commands` section for `npm` scripts. The new section has the same heading. Which heading does the new section use?

- **A.** `## Commands`, as the Chore says.
- **B.** `## Shell`. Done check 1 then reads "both sections" as Replies and Shell.
- **Other:** your own.

Recommended: B, because one context then has one Commands section.

## Files that change

| File        | New / changed | What                                      |
| ----------- | ------------- | ----------------------------------------- |
| `CLAUDE.md` | Changed       | The Replies and Commands sections, D1, D2 |

## Order of work

1. Add the two sections with the answers to D1 and D2.
2. Run the checks in `AGENTS.md` › Commands.
3. Open a new local session. Ask a question that needs a decision. Paste the reply under Evidence.
4. In that session, run a command in `app/screens`. Then run `git status --ignored app/screens`. Paste the output under Evidence.

## Risks

- The STE limits in `docs/writing.md` name repo text, not chat replies. The new Replies line extends them to replies. The Constraint keeps `docs/writing.md` as it is.

## Proof

| Done check                                            | Proven by                      |
| ----------------------------------------------------- | ------------------------------ |
| 1: both sections                                      | Review of the diff             |
| 2: `npm run words`                                    | `npm run words` output         |
| 3: **Your turn** list                                 | Reply from a new local session |
| 4: no `.cc-writes` folder                             | `git status --ignored` output  |
| Constraints: `AGENTS.md`, `docs/writing.md` unchanged | Review of the diff             |

## Out of scope

`AGENTS.md`, `docs/writing.md` and `.github/agent/rules.md`.

## Deviations
