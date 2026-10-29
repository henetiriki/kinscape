# Plan: C367: Make the issue forms, PR template and /refine skills agree with the workflow docs

- **Spec:** #367
- **Status:** draft

## Approach

Reword the six files below; who approves what stays only in `how-we-work.md` › Roles and labels, linked by its full GitHub URL from the forms. `/refine spec M<n>` finds its Intent with `gh issue list --label "type: intent" --state all --search "M<n> in:title"`. Field ids and labels stay (`backlog-spec-link.yml` reads `### Intent or milestone`).

## Decisions

**D1 · `building.md` lines 9 and 27** · Decides: Tech lead

They say the tech lead sets `status: ready-for-agent`, outside #367's file list.

- **A.** Leave them: one-line pointers.
- **B.** Shorten them in this PR.
- **Other:** your own.

Recommended: A, because each is a step, not the approval flow.

## Files that change

| File                                  | What                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.github/ISSUE_TEMPLATE/2-spec.yml`   | `description:` drops "approved by…"; markdown's approval flow → next step plus link                   |
| `.github/ISSUE_TEMPLATE/1-intent.yml` | Drops "will turn it into a Spec once you accept it"; adds the link                                    |
| `.github/ISSUE_TEMPLATE/4-chore.yml`  | Hand-back list: "a path in `.github/CODEOWNERS`, a secret, or too big"                                |
| `.github/pull_request_template.md`    | Deviations: leave the line out if none; no "None"                                                     |
| `.claude/skills/refine/spec.md`       | Step 1 looks up the Intent number (M0 excepted); Intent box `#57`; Hand-over → one sentence plus link |
| `.claude/skills/refine/intent.md`     | Hand-over step 2 gains the link                                                                       |
| `.claude/skills/refine/chore.md`      | Screen: rule 4's list; Hand-over → one sentence plus link                                             |

## Order of work

1. Edit the files, one commit.
2. Run `npm run words`, `npm run format:check`, `npm run lint`.

## Risks

- #373 also edits `chore.md` and may remove the quick `chore:` PR route; whichever merges second rebases.

## Proof

| Acceptance check                         | Proven by                                                       |
| ---------------------------------------- | --------------------------------------------------------------- |
| `/refine spec M2` prints `#57`, links    | The lookup's output in the PR; `backlog-spec-link.yml:59` regex |
| `ready-for-agent` flow only in one place | `git grep "ready-for-agent"` output in the PR                   |
| Skills ≤ 650 words; words, format pass   | Their output                                                    |

## Out of scope

`AGENTS.md`, `how-we-work.md`, `.github/agent/respond.md` (CODEOWNERS), workflows, scripts.
