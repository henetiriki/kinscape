# Plan: C824: File refined issues with gh by default

- **Spec:** #824
- **Status:** approved

## Approach

`filing.md` holds the filing steps. `SKILL.md` gets a _Filing with gh_ section that links to it, and `spec.md` and `chore.md` point their Hand-over to it. The steps read the title prefix and `labels:` from the form. It writes the body with the Write tool to a `mktemp` file. Then it runs one `gh issue create` and reports the number. For a Bug, the section points to `bug.md`. _Prefilled links_ keeps the three cases of the Chore. The rule "Never touch GitHub on your own" and the description change to match.

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
| `.claude/skills/refine/spec.md`   | Changed       | Hand-over: _Filing with gh_            |
| `.claude/skills/refine/chore.md`  | Changed       | Hand-over: _Filing with gh_            |
| `.claude/skills/refine/bug.md`    | Changed       | `gh issue edit <n> --body-file <file>` |

## Risks

- `SKILL.md` and `spec.md` are near their 650 words. Cut text from that file, with one Deviations line for each cut.
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
- The tech lead proves the five behaviour rows of the Proof table on the next `/refine` run. The tech lead files a Bug if one fails. The build ran no dry run.
