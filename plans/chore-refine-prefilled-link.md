# Plan: chore-refine-prefilled-link: `/refine intent` ends with a prefilled GitHub link

- **Spec:** none (tooling/process chore: tech lead approves, merged via bypass)
- **Intent:** none
- **Requirement IDs:** none (process only; no change to `docs/requirements.md`)
- **Status:** approved
- **Branch:** `chore/refine-prefilled-link`; PR title `chore: /refine intent hands over a prefilled Intent form link`

## Approach

Today `/refine intent` prints one block per form box and tells the PO to copy each into the GitHub form. Replace that with a single link. GitHub opens an issue form already filled in when the link carries `template=<file>` plus one query parameter per field, named by the field's `id` (the form-schema docs call `id` "the canonical identifier for the field in URL query parameter prefills"). The PO clicks the link, reviews or edits the form, and presses **Submit**. The issue is created by the PO's own GitHub account, the form applies its own labels (`type: intent`, `status: draft`), and nothing is posted until they submit. No `gh` and no install needed.

Link shape (ids from `.github/ISSUE_TEMPLATE/1-intent.yml`):

```
https://github.com/henetiriki/kinscape/issues/new?template=1-intent.yml
  &title=…&problem=…&outcome=…&acceptance=…&requirements=…&constraints=…&out-of-scope=…&questions=…
```

Rules the skill will follow:

- Percent-encode every value (space `%20`, newline `%0A`, `&` `%26`, `#` `%23`, `%` `%25`, `+` `%2B`, quotes and non-ASCII too). Prefer a one-line shell encoder if one is available; otherwise encode by hand and re-read the link before showing it.
- Omit parameters for empty optional fields.
- If the finished link would be longer than about 6,000 characters (GitHub returns `414 URI Too Long` past its limit), say so and fall back to the existing per-box blocks.
- **Always also print the per-box blocks** below the link, so a broken or truncated link (some terminals wrap long URLs) never blocks the PO.
- The text going into the URL is the PO's own Intent, which the data rules already keep free of real people's data and secrets; the skill re-checks that before building the link.

Same non-goal as before: the skill never posts to GitHub itself. `gh issue create` stays an opt-in for someone who has `gh` and asks for it.

## Alternatives considered

- `gh issue create` as the default: rejected, needs `gh` set up on the PO's Windows machine, bypasses the form (labels and layout must be reproduced by hand), and would author the issue as whoever is signed in to `gh`.
- Link only, without the fallback blocks: rejected, too fragile if a terminal mangles a long URL.
- Do the same for Specs now: deferred. The mechanics are identical (`template=2-spec.yml`, ids `intent`, `requirements`, `summary`, `behaviour`, `design`, `acceptance`, `concerns`, `out-of-scope`), but sub-issue linking is manual and the PO isn't the one filing them. Easy follow-up if wanted.

## Files that change

| File | New / changed | What |
|---|---|---|
| `.claude/skills/refine/intent.md` | changed | *The draft*: build the prefilled link (id table, encoding and length rules, fallback), then print the blocks, then the plain steps (open the link, check the form, press **Submit new issue**). |
| `.claude/skills/refine/SKILL.md` | changed | "Never touch GitHub on your own": a prefilled link the user opens and submits is allowed; creating or editing issues is still only on request. Description line says "ready to submit via a prefilled link or paste". |
| `docs/how-we-work.md` | changed | "Drafting with Claude": the PO opens the link Claude gives and presses Submit; blocks are the fallback. |
| `plans/chore-refine-prefilled-link.md` | new | This plan. |

No change to the issue forms, `AGENTS.md`, `requirements.md` or settings. Edits to `.claude/skills/` work directly in this session (verified last time), so no copy step.

## Order of work

1. Branch `chore/refine-prefilled-link` from up-to-date `main`.
2. "Approved" = the tech lead accepts this plan. Save it as `plans/chore-refine-prefilled-link.md` with `Status: approved` and commit it first: `plan(chore-refine-prefilled-link): approved by @henetiriki`.
3. Make the three edits in one commit.
4. Verify, push, open the PR with the template.

## Risks

- **Prefill parameter names are only documented as "the `id`"**, and the docs don't spell out the exact pattern or which field types work. Mitigation: the proof step opens a real link and checks every field and both labels; if a field doesn't prefill, fix the mapping or fall back before merge.
- **URL length.** Long Intents may exceed the limit. Mitigation: ~6,000-character threshold plus fallback blocks.
- **Encoding mistakes** (a stray `&` or `#` truncates a field). Mitigation: explicit encoding rules, a shell encoder when available, and the dry run uses text containing `&`, `#`, quotes and line breaks.
- **Clickability.** A very long link may wrap in a terminal. Mitigation: the blocks are always printed too.
- **Test issue.** The proof submits a real issue in the repo; the tech lead closes and deletes it afterwards.

## Proof

No Spec, so no acceptance checks. Evidence for the PR:

| Acceptance check | Proven by |
|---|---|
| Link prefills every field | Fresh session: `/refine intent` on a made-up idea; open the link; screenshot shows title and all filled boxes |
| Awkward characters survive | The made-up idea includes `&`, `#`, quotes, a line break and an accented letter; they appear unchanged in the form |
| Labels applied, author is the submitter | Submit the test issue; it has `type: intent` and `status: draft` and shows the tech lead as author; then close and delete it |
| Fallback works | A deliberately long Intent (over the threshold) prints the blocks and says why there is no link |
| Field ids match the form | `grep` of the ids used in `intent.md` against `1-intent.yml` |
| Doc updated | `docs/how-we-work.md` diff |

## Out of scope

Prefilled links for Specs, `gh issue create` flows, step 6 observability (dropped), PO onboarding (step 7), any change to the issue forms.

## Deviations

None.
