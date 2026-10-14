# Plan: chore: slicing, "which issue", and data rules (handoff step 4)

- **Spec:** none (tooling/process chore: tech lead approves, merged via bypass)
- **Intent:** none
- **Requirement IDs:** none (process only; no change to `docs/requirements.md`)
- **Status:** approved
- **Branch:** `chore/slicing-and-data-rules`; PR title `chore: document slicing, issue routing and data rules`

## Approach

Docs-only PR. The workflow decided in the previous session is not yet written down: one Intent is sliced into several Specs, and each Spec gets its own plan and PR. `AGENTS.md`, `docs/how-we-work.md`, `plans/TEMPLATE.md` and the PR template still assume one plan per milestone (`plans/<milestone>.md`). This PR renames the unit of planning from milestone to Spec everywhere it is referenced, adds a "which issue do I need?" table and data rules to `how-we-work.md`, and puts the agent-facing data rules in `AGENTS.md`. Plan files are named `plans/<spec-id>-<slug>.md`, e.g. `plans/M0.1-hello-vercel.md`, where `M0.1` is the milestone number plus a spec index (stable and readable before an issue number exists). The commit message becomes `plan(<spec-id>): approved by @<tech-lead>`.

## Alternatives considered

- Keep one plan per milestone: rejected, plans for a whole milestone are too big to review and approve in one go.
- Name plans by issue number: rejected, the number does not exist until the Spec is filed and says nothing to a reader.

## Files that change

| File | New / changed | What |
|---|---|---|
| `AGENTS.md` | changed | Source-of-truth bullet and *Plans* rule 2: `plans/<spec-id>-<slug>.md`, one per Spec, new commit message. New **Data rules** section. Commands stays as is (M0). |
| `docs/how-we-work.md` | changed | Loop table "Build" row: plan is per Spec. New **Slicing**, **Which issue do I need?** and **Data rules** sections. Milestones paragraph: each milestone starts as one Intent, sliced into Specs. |
| `plans/TEMPLATE.md` | changed | Header comment and title placeholder use `<spec-id>`. |
| `.github/pull_request_template.md` | changed | `Plan:` hint uses `plans/<spec-id>-<slug>.md`. |
| `plans/chore-slicing-and-data-rules.md` | new | This plan. |

No change to `docs/requirements.md`, issue forms, scripts or repo settings.

## Order of work

1. Branch `chore/slicing-and-data-rules` from up-to-date `main`.
2. Commit this plan first as `plan(chore-slicing-and-data-rules): approved by @henetiriki` (it uses the old naming because the rule it introduces is not merged yet).
3. Edit the four files above in one commit.
4. Verify, push, open the PR with the template.

## Risks

- **Conflict with requirements.** `docs/requirements.md` (Build milestones) says "Each milestone is one agent plan". The new rule supersedes it, but requirements change only through an approved Intent. Left untouched, noted in the PR, and to be covered in the M0 Intent.
- **Naming.** `M0.1` ids need Specs to carry the same id in their title. Documented in the Slicing section.
- Otherwise low risk (docs only).

## Proof

No Spec, so no acceptance checks. Verification before reporting done:

| Check | Proven by |
|---|---|
| No stale per-milestone plan wording | `grep` for `plans/<milestone>`, `plan(<milestone>)` over `AGENTS.md docs .github plans` finds nothing |
| Tables and links render | Read the diff |
| Settings untouched | `scripts/check-github.sh` still passes |
| Lint / tests / validator | None exist yet (Commands is "to be filled in during M0"); stated in the PR |

## Out of scope

`refine` skill (step 5), observability and agent-report section (step 6), PO onboarding (step 7), stack decisions, editing `requirements.md`, filling the Commands section.

## Deviations

None.
