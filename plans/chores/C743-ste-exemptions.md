# Plan: C743: Add three STE exemptions to docs/writing.md

- **Spec:** #743
- **Status:** draft

## Approach

`docs/writing.md` › _STE_ gets one lead sentence and a bullet list of the three exemptions, in the Chore's words. No other line changes. The `## STE` and `## All text` headings stay, so the `#ste` and `#all-text` anchors stay. The file has 421 of 600 words; the change adds about 70.

## Decisions

**D1 · Where the exemptions go** · Decides: Tech lead

- **A.** After rule 16, as "These exemptions apply:" and a bullet list. A bullet list keeps the rule numbers 1 to 16 unique.
- **B.** In the scope paragraph above the rules, as sentences. Rule 15 asks for a vertical list, so B breaks STE.
- **Other:** your own.

Recommended: A, because the exemptions cite rule numbers, and the reader sees those rules first.

## Files that change

| File                                  | What                  |
| ------------------------------------- | --------------------- |
| `docs/writing.md`                     | Three exemptions (D1) |
| `plans/chores/C743-ste-exemptions.md` | This plan             |

## Risks

- `docs/writing.md` is a hand-back path. The tech lead builds.

## Proof

| Done check                       | Proven by       |
| -------------------------------- | --------------- |
| _STE_ holds the three exemptions | The diff        |
| `npm run words` passes           | `npm run words` |
| `npm test` passes                | `npm test`      |

## Out of scope

- The fixes in the five audit Chores, #744 to #748.

## Deviations
