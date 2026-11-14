# Plan: C824: File refined issues with gh by default

- **Spec:** #824
- **Status:** approved

## Approach

`filing.md` holds the filing steps. `SKILL.md` gets a _Filing with gh_ section that links to it, and `spec.md` and `chore.md` link their Hand-over to `filing.md`. The steps read the title prefix and `labels:` from the form. They write the body with the Write tool to a new file outside the repo. Then they run one `gh issue create` and report the number. For a Bug, `SKILL.md` points to `bug.md`. _Prefilled links_ serves `/refine intent`, a request for a link and a failed `gh`. The rule "Never touch GitHub on your own" and the description change to match.

## Decisions

**D1 · An empty optional box** · Decides: Tech lead

What goes under the `###` heading of an empty optional box (Constraints, Behaviour and UX, Out of scope)?

- **A.** `_No response_`, as the form writes it.
- **B.** `None`.
- **Other:** your own.

**Answer: A** (@henetiriki)

## Files that change

| File                              | New / changed | What                                   |
| --------------------------------- | ------------- | -------------------------------------- |
| `.claude/skills/refine/SKILL.md`  | Changed       | Description, rule, new section         |
| `.claude/skills/refine/filing.md` | New           | The filing steps                       |
| `.claude/skills/refine/spec.md`   | Changed       | Hand-over: link to `filing.md`         |
| `.claude/skills/refine/chore.md`  | Changed       | Hand-over: link to `filing.md`         |
| `.claude/skills/refine/bug.md`    | Changed       | `gh issue edit <n> --body-file <file>` |

## Risks

- `SKILL.md` and `spec.md` are near their 650 words. Put new text in `filing.md`.
- `.claude/skills/**` is a hand-back path: the tech lead builds ([hand-back rule](../README.md#hand-back)).

## Proof

| Acceptance check                         | Proven by                                                       |
| ---------------------------------------- | --------------------------------------------------------------- |
| `SKILL.md` names gh and one confirmation | Review of the diff                                              |
| Chore prefix, labels, headings           | Evidence: `gh issue view <n> --json title,labels,body`          |
| Spec-link attaches the first Spec        | Evidence: `gh api repos/{owner}/{repo}/issues/<n>/parent`       |
| `gh` missing or signed out               | Evidence: a dry run with `GH_CONFIG_DIR` set to an empty folder |
| The user asks for a link                 | Evidence: a dry run; no issue filed                             |
| `/refine intent`                         | Evidence: a dry run ends with a link; `intent.md` unchanged     |
| `npm run words`, `npm run format:check`  | CI                                                              |

## Deviations

- `filing.md` is a new file. `SKILL.md` was at its 650-word budget and could not hold the filing steps.
- The steps write the body to a new file in the scratchpad or `$TMPDIR`, not to a `mktemp` file. The Write tool cannot fill an existing file that it has not read.
- The steps put the title and each label in single quotes, because a title can hold a backtick or an apostrophe.
- `chore.md` says `_No response_` for an empty Constraints box, as D1 A says. `bug.md` says what to do when `gh` fails.
- `SKILL.md` lost three texts that other files repeat. `argument-hint` shows the argument forms that the description listed. The `form-link.mjs` header shows the heredoc example. The `AskUserQuestion` tool enforces the header and option limits.
- `SKILL.md` lost "for example one that encodes a form link" from the build rule. Only `/refine intent` and the fallback give a link now.
- `bug.md` lost the `BUG_BODY_END` check. A body file replaces the heredoc, so no line can end it.
- The tech lead proves the five behaviour rows of the Proof table on the next `/refine` run. The tech lead files a Bug if one fails. The build ran no dry run.
