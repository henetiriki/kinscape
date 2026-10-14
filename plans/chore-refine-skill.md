# Plan: chore-refine-skill: a `/refine` skill for Intents and Specs (handoff step 5)

- **Spec:** none (tooling/process chore: tech lead approves, merged via bypass)
- **Intent:** none
- **Requirement IDs:** none (process only; no change to `docs/requirements.md`)
- **Status:** approved
- **Branch:** `chore/refine-skill`; PR title `chore: add /refine skill for drafting Intents and Specs`

## Approach

Add one project skill, `.claude/skills/refine/`, that interviews the user until both sides share an understanding, then drafts the result in the shape of our GitHub issue forms. It is adapted from two MIT-licensed sources: `refine` (rameezk/skills, Rameez Khan) for the structure (design tree, rounds of numbered questions each with a recommended answer, fact-finding by looking things up instead of asking, no unconfirmed branches, never starts building) and `grilling` (mattpocock/skills, Matt Pocock) for the interview style. It is invoked by the user only (`disable-model-invocation: true`) in two modes via the argument:

- `/refine intent`: for the PO, plain language, no technical terms or code. Reads `docs/requirements.md` itself for facts. Ends with the draft **Intent** text, field by field as in `.github/ISSUE_TEMPLATE/1-intent.yml`, for the PO to paste into the Intent form.
- `/refine spec <intent #>`: for the tech lead and Claude. Reads the accepted Intent (`gh issue view`), asks the design questions, and ends with (a) a confirmed list of Specs the Intent is sliced into (ids `M0.1`, `M0.2`, per `docs/how-we-work.md`), then (b) one **Spec** per slice, field by field as in `2-spec.yml`, with **Flagged concerns** for anything unresolved.

Both modes only ever print drafts, under one heading per form box. In practice the PO opens GitHub, clicks New issue → Intent, copies each block into the matching box of the web form and submits. The skill never touches GitHub. Creating or editing issues itself (via `gh`) happens only if the user then asks for it, one confirmation per issue.

Adaptations from the sources:

- Their hand-offs (`to-spec`, `to-tickets`, `decision-context`, `tracker-config`) are replaced with our forms. Slicing, which `refine` forbids, becomes an explicit last step of spec mode.
- New domain terms: proposed in the draft under *Open questions* as `Proposed term: X = …` for the *Key concepts* table. `docs/requirements.md` changes only through an approved Intent (AGENTS.md), so the skill never edits it. No ADR folder is created; hard-to-reverse decisions go in the Spec's *Technical design* and *Flagged concerns*.
- The Data rules (no real people's data, no secrets, untrusted content) are restated in the skill so the PO's session follows them.

## Alternatives considered

- Two separate skills (`refine-intent`, `refine-spec`): rejected, the interview mechanics are shared, so one skill with a mode keeps them in one place. Mode-specific rules live in sibling files.
- Letting the skill create issues itself: rejected for now, the PO is new to GitHub and the PO's Claude may not have `gh`. Drafts to paste are safer and still work everywhere.
- A claude.ai ZIP upload: dropped, the PO runs the skill from the repo.

## Files that change

| File | New / changed | What |
|---|---|---|
| `.claude/skills/refine/SKILL.md` | new | Frontmatter (`name`, `description`, `disable-model-invocation: true`, `argument-hint`), the shared interview method, mode dispatch, and the rule that nothing is built or filed without confirmation. |
| `.claude/skills/refine/intent.md` | new | PO mode: plain-language rules, the Intent form fields in order, how to draft "How we'll know it works" as Given/When/Then, and where to put unresolved questions. |
| `.claude/skills/refine/spec.md` | new | Tech-lead mode: reading the Intent, design questions, slicing step, Spec form fields, Flagged concerns, and the stack questions that belong to M0. |
| `.claude/skills/refine/NOTICE.md` | new | Attribution and the full MIT notices for both sources, with the source repo URLs and the paths adapted. |
| `docs/how-we-work.md` | changed | A short "Drafting with Claude" paragraph: PO runs `/refine intent`, Claude runs `/refine spec`; drafts are pasted, not auto-filed. |
| `plans/chore-refine-skill.md` | new | This plan. |

No change to `AGENTS.md`, `requirements.md`, issue forms or repo settings.

## Order of work

1. Branch `chore/refine-skill` from up-to-date `main`.
2. "Approved" = the tech lead accepts this plan in plan mode. Save it as `plans/chore-refine-skill.md` with `Status: approved` and commit it first on the branch: `plan(chore-refine-skill): approved by @henetiriki`. The PR approval later signs off code and final plan together.
3. Write the skill files (see Risks for how, because of the sandbox), then the `how-we-work.md` paragraph, in one commit.
4. Verify, push, open the PR with the template.

## Risks

- **Sandbox cannot write to `.claude/skills/`** (denied in this session's Bash and likely for edit tools). Mitigation (agreed): stage the four files under the session scratchpad, the tech lead moves them into `.claude/skills/refine/` (same arrangement as the `.github/` files in step 1), then commit.
- **Licence.** Both sources are MIT, which requires keeping the copyright and permission notice with substantial portions. Mitigation: `NOTICE.md`. Both licences and the `refine` and `grilling` text were read only through summaries, so the skill is a rewrite for our workflow, not a copy; the NOTICE still credits both.
- **Skill discovery.** Project skills may only load in a new session. The dry run therefore happens in a fresh session on the branch.
- **PO non-technical.** The biggest quality risk is jargon leaking into the PO's session. Mitigated by explicit rules in `intent.md` and by the dry run.

## Proof

No Spec, so no acceptance checks. Evidence for the PR:

| Acceptance check | Proven by |
|---|---|
| Skill is valid and discoverable | In a fresh session on the branch, `/refine` appears with its argument hint |
| User-only invocation | `disable-model-invocation: true` in the frontmatter; the skill does not appear in the model-invoked skill list |
| Intent mode matches the form | Dry run of `/refine intent` on a made-up idea (synthetic, no real data); output has every field of `1-intent.yml`, in order, in plain language. Transcript pasted in the PR |
| Spec mode matches the form | Dry run of `/refine spec` against a made-up Intent; output has a slice list and every required field of `2-spec.yml`, including Flagged concerns |
| Attribution present | `NOTICE.md` names both authors, licences and URLs |
| Settings untouched | `scripts/check-github.sh` passes (run locally by the tech lead; it cannot run in the agent sandbox) |

## Out of scope

Observability and the agent-report section (step 6), PO onboarding and their multi-user Intent (step 7), the M0 Intent itself (step 8), any claude.ai ZIP, auto-filing issues, editing `requirements.md` or the issue forms, an ADR folder.

## Deviations

None.
