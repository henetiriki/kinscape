# Plan: C824: File refined issues with gh by default

- **Spec:** #824
- **Status:** draft

## Approach

`SKILL.md` gets a _Filing with gh_ section, and `spec.md` and `chore.md` point their Hand-over to it. The section reads the title prefix and `labels:` from the form. It writes the body with the Write tool to a `mktemp` file. Then it runs one `gh issue create` and reports the number. For a Bug, the section points to `bug.md`. _Prefilled links_ keeps the three cases of the Chore. The rule "Never touch GitHub on your own" and the description change to match.

## Decisions

**D1 · An empty optional box** · Decides: Tech lead

What goes under the `###` heading of an empty optional box (Constraints, Behaviour and UX, Out of scope)?

- **A.** `_No response_`, as the form writes it.
- **B.** `None`.
- **Other:** your own.

Recommended: A, because a filed issue then matches a form-filed one.

## Files that change

| File                             | New / changed | What                                   |
| -------------------------------- | ------------- | -------------------------------------- |
| `.claude/skills/refine/SKILL.md` | Changed       | Description, rule, new section         |
| `.claude/skills/refine/spec.md`  | Changed       | Hand-over: _Filing with gh_            |
| `.claude/skills/refine/chore.md` | Changed       | Hand-over: _Filing with gh_            |
| `.claude/skills/refine/bug.md`   | Changed       | `gh issue edit <n> --body-file <file>` |

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
