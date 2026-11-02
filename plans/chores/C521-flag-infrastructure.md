# Plan: C521: Flag new infrastructure in a Spec's Flagged concerns

- **Spec:** #521
- **Status:** approved

## Approach

State the rule once, in the paragraph under [Decisions](../../docs/how-we-work.md#decisions): a Spec that needs a new service, database, environment variable, secret or CODEOWNERS path lists it under **Flagged concerns** and carries a **Blocking** tech-lead decision. `spec.md` gets an **Infrastructure** bullet in _What to settle_ that links there without restating the list; the form's Flagged concerns description does the same with a full URL, as its intro does. `spec.md` touches a CODEOWNERS path, so this PR is labelled `hand-back` and the tech lead builds it.

## Decisions

**D1 · Room for the new words** · Decides: Tech lead

`how-we-work.md` (850) and `spec.md` (650) are close to their budgets, and the Chore keeps edits to the three files.

- **A.** Trim the same files: fold the rule into the last sentence on hard-to-reverse choices, and shorten nearby wording in `spec.md` if `npm run words` fails.
- **B.** Raise both budgets in `scripts/word-count.mts`; a fourth file.
- **Other:** your own.

**Answer: Other:** - Try to move the infrastructure wording into `architecture` or another suitable topical document and link to it. If that is not possible, go for A. (@henetiriki)

## Files that change

| File                                | What                                     |
| ----------------------------------- | ---------------------------------------- |
| `docs/how-we-work.md`               | The rule, under Decisions                |
| `.claude/skills/refine/spec.md`     | **Infrastructure** bullet linking to it  |
| `.github/ISSUE_TEMPLATE/2-spec.yml` | Flagged concerns description links to it |

## Order of work

1. `how-we-work.md`, then the two links, in one commit.
2. `npm run words`, `npm run format:check`.

## Risks

- A link with a wrong relative depth: `spec.md` uses `../../../docs/`, as its other links do.

## Proof

| Check                                  | By                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Rule stated once, two files link to it | `git grep -n "CODEOWNERS path"` finds only `how-we-work.md`              |
| Budgets                                | `npm run words`                                                          |
| `/refine spec` flags a database slice  | Tech lead's dry run of `/refine spec` on a database slice, noted on #521 |
