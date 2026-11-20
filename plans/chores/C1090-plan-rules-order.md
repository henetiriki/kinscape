# Plan: C1090: Order plans/README.md by the plan lifecycle

- **Spec:** #1090
- **Status:** draft

## Approach

`plans/README.md`, `AGENTS.md` and `scripts/agent-approve.mts` are hand-back paths, so the tech lead builds this Chore with `/build-local`.

The build moves each rule under its `##` heading, in the order that "What to change" gives. Each rule keeps its text, its bold lead-in and its anchor. The rule numbers go. Only these edits change text:

- The `item-types` table takes the id, plan path, branch and plan PR title from `plans-committed-first`, `plan-pr-flow` and `chores`. One sentence under the table names the PRs that need no issue and no plan.
- The rules write `<id>` in place of `<spec-id>`, and the table defines `<id>`. Then `plan(<id>): draft` does not read as a step for a Spec only.
- `plan-pr-flow` gets the lead-ins **In GitHub Actions** and **In a local session**. The second takes the `Status: approved` sentence and the approval commit text from `plans-committed-first`.
- `hand-back` takes "The tech lead plans and builds a hand-back" from `chores`. The sentence goes after the "no plan PR" sentence.
- `too-big` links to `hand-back` for a Chore that gets no plan PR.
- The list of five rules in `chores` goes, because other rules also apply to a Chore.

The table:

| Item  | Id                          | Plan path                     | Branch                  | Plan PR title                             |
| ----- | --------------------------- | ----------------------------- | ----------------------- | ----------------------------------------- |
| Spec  | `<spec-id>`, such as `M0.1` | `plans/<spec-id>-<slug>.md`   | `spec/<spec-id>-<slug>` | `<spec-id>: <Spec title> (plan)`          |
| Bug   | `B<n>`                      | `plans/bugs/B<n>-<slug>.md`   | `bug/B<n>-<slug>`       | `B.<n>: <title without "Bug: "> (plan)`   |
| Chore | `C<n>`                      | `plans/chores/C<n>-<slug>.md` | `chore/C<n>-<slug>`     | `C.<n>: <title without "Chore: "> (plan)` |

`<n>` is the issue number. The current Bug branch is `bug/<spec-id>-<slug>`, and a Bug's id is `B<n>`, so the cell keeps its value.

## Decisions

**D1 · The rule that the hand-back reply cites** · Decides: Tech lead

`scripts/agent-approve.mts` posts "(plans/README.md, chores rule)" on an approved `hand-back` PR. `agent-approve.test.ts` expects "chores rule". `plan-rule-citations.test.ts` fails if a cited name has no anchor. "What to change" names only `AGENTS.md` and `docs/building.md`, but `npm test` must pass.

- **A.** Cite the `hand-back` rule. It says that the CI agent does not build a hand-back, and it gets the "tech lead plans and builds" sentence. One line in the script and one in its test change.
- **B.** Cite `item-types`. The same two lines change, but the table does not say who builds a hand-back.
- **Other:** your own.

Recommended: A, because the reply tells who builds the PR, and the `hand-back` rule says that.

**D2 · The check for a rule with no anchor** · Decides: Tech lead

`plan-rule-citations.test.ts` finds a numbered list item with no anchor. With no rule numbers, the check finds nothing and cannot fail. The `RULE_NAMES` check still finds a lost or moved anchor.

- **A.** Replace the check. Map each `##` heading to the anchors under it, in order. A section with no anchor fails. About 25 test lines change.
- **B.** Delete the check and its fixture test. About 10 test lines go.
- **Other:** your own.

Recommended: A, because a test then proves the heading-order done check. B loses that test, and the review checks the order.

## Files that change

| File                                            | New / changed | What                                                        |
| ----------------------------------------------- | ------------- | ----------------------------------------------------------- |
| `plans/README.md`                               | changed       | The headings, the table and the edits in Approach           |
| `AGENTS.md`                                     | changed       | One link to `#item-types` in place of the two old links     |
| `docs/building.md`                              | changed       | No branch names; a link to `#item-types`                    |
| `scripts/agent-approve.mts`                     | changed       | The hand-back reply cites the rule of D1                    |
| `scripts/__tests__/agent-approve.test.ts`       | changed       | It expects the rule of D1                                   |
| `scripts/__tests__/plan-rule-citations.test.ts` | changed       | `RULE_NAMES` in the new order with `item-types`; D2's check |

The [failing-tests rule](../README.md#failing-tests) lets the build change the two tests.

## Order of work

1. In `plan-rule-citations.test.ts`, write the new `RULE_NAMES` and the check of D2. See the test fail on the current `plans/README.md`.
2. Rewrite `plans/README.md` as Approach says. See the test pass.
3. In `agent-approve.test.ts`, expect the rule of D1. See it fail. Then change the reply in `agent-approve.mts`.
4. In `AGENTS.md`, write "(names and paths: the [item-types table](plans/README.md#item-types))".
5. In `docs/building.md`, replace the branch sentence and the `chores` link with one link to the table.
6. Run `npm run format`, then the Commands checks.
7. In the PR body, list each sentence that moves into the table or goes.

## Risks

- `plans/README.md` had 1,155 of its 1,200 words after C891. The headings and the table add words. The numbers, the list of five rules and the moved sentences go. If the count passes 1,200, cut words from the moved text. The Constraint keeps the budget.
- `## Item types` gives GitHub the anchor `item-types`, and `<a id="item-types">` gives a second one. A link still opens the right place. The `<a>` tag stays, because `plan-rule-citations.test.ts` reads only `<a id>` tags.
- A rule can read differently in its new place. The PR body list lets the tech lead compare each meaning.

## Proof

| Acceptance check                                 | Proven by                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Seven `##` headings in order                     | `plan-rule-citations.test.ts` (D2 A), or the review (D2 B)        |
| One table row each, with the current values      | The diff and the PR body list                                     |
| Each anchor stays, except the two                | `plan-rule-citations.test.ts` (`RULE_NAMES`)                      |
| No link to `#plans-committed-first` or `#chores` | `doc-links.test.ts`, `plan-rule-citations.test.ts` and `git grep` |
| No text limits a rule to one item type           | The review; `<id>` in the rules                                   |
| `docs/building.md` gives no branch name          | `git grep` for `spec/`, `bug/` and `chore/`                       |
| Words, format and tests pass                     | `npm run words`, `npm run format:check`, `npm test`               |
| The PR body lists moved and removed sentences    | The PR body                                                       |

## Out of scope

- Links in other files in `plans/`.
- `<spec-id>` in `plans/TEMPLATE.md`.
