# Plan: CH.4: Refine a chore

- **Spec:** #194
- **Requirement IDs:** none (process change)
- **Status:** draft

## Approach

A new `.claude/skills/refine/chore.md`, shaped like `spec.md`, relies on `SKILL.md`'s method, rules and _Prefilled links_ without repeating them. Its sections:

1. **Before the first question:** look up the files, settings and workflows the idea touches.
2. **What to settle:** what to change, why, how we'll know it's done, constraints; ask only what the idea leaves open. Every open choice is asked, so none reach the plan.
3. **Screen:** once the change is known, and again before drafting, read `plans/README.md` rule 4 (and rule 7, which it links) and `.github/CODEOWNERS`. If the chore would be handed back, name the path or reason, keep drafting, and tell the tech lead to keep `status: ready-for-dev` and do it themselves or open a quick `chore:` PR, not to set `status: ready-for-agent`.
4. **The draft:** Title starting "Chore: " (`title`), What to change (`change`), Why (`why`), How we'll know it's done (`done`), Constraints (`constraints`); if `4-chore.yml` differs, follow the form.
5. **Hand-over:** one link for `4-chore.yml` (fallback: **Issues → New issue → Chore**). The tech lead files it and, unless handed back, sets `status: ready-for-agent`.

`SKILL.md` gains the mode in `description`, `argument-hint` and the mode list; with no argument it asks which of intent, spec or chore.

`docs/how-we-work.md` adds about 21 words (a `/refine chore` sentence in the tech-lead bullet of _Drafting with Claude_; "draft with `/refine chore`" in the Chore row) and cuts 26:

- "asks questions until you agree on what is wanted" → "asks questions until you agree" (−4).
- "; the app ignores the skill's own setting": the skill sets no model or effort (−7).
- "using the milestone's Intent issue": the table's first row says it (−5).
- "A pull request the PO can try carries `status: ready-for-po`.": the label table says it (−10).

## Decisions

**D1 · Who does the dry run** · Decides: Tech lead

The skill is interactive and `disable-model-invocation: true`, so the build agent can't run it.

- **A.** The build agent runs `form-link.mjs 4-chore.yml` on sample Playwright-pin blocks and pastes the link in the PR body; the tech lead runs `/refine chore pin the Playwright action to a commit` on the PR branch before approving.
- **B.** As A, and the build agent also follows `chore.md` by hand, answering its own questions, and pastes the transcript.
- **Other:** your own.

Recommended: A, because a self-answered interview proves the wording, not the questioning.

## Files that change

| File                             | New / changed | What                                                   |
| -------------------------------- | ------------- | ------------------------------------------------------ |
| `.claude/skills/refine/chore.md` | New           | Interview, screen, draft, hand-over                    |
| `.claude/skills/refine/SKILL.md` | Changed       | `description`, `argument-hint`, mode list              |
| `docs/how-we-work.md`            | Changed       | `/refine chore` in two places; the cuts under Approach |
| `plans/CH.4-refine-chore.md`     | New           | This plan                                              |

## Order of work

1. Commit this plan: `plan(CH.4): approved by @henetiriki`.
2. `chore.md`, then `SKILL.md`.
3. `docs/how-we-work.md`.
4. Run `npm run words`, lint, format check, tests, the boundary validator and e2e; run `form-link.mjs` on the sample blocks.

## Risks

- **Word budgets:** if `how-we-work.md` is still over, trim more in the same file and add a line under _Deviations_.
- **Screen is advice:** a missed path is still caught by CH.3's hand-back and the CODEOWNERS review.

## Proof

| Acceptance check                                     | Proven by                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| Playwright-pin idea gives five blocks and one link   | D1 dry run; `form-link.mjs` output in the PR body            |
| CODEOWNERS path: warns, drafts, keep `ready-for-dev` | Review of `chore.md` _Screen_                                |
| Secret or too big: warns and drafts                  | Review of `chore.md` _Screen_                                |
| Nothing created or changed                           | `SKILL.md` rules; `git status` clean after the dry run       |
| `/refine` alone asks which of three modes            | Review of `SKILL.md` mode list                               |
| Words, lint and format pass                          | `npm run words`, `npm run lint`, `npm run format:check` (CI) |
