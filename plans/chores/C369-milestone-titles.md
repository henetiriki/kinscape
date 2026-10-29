# Plan: C369: Align the milestone titles with the requirements

- **Spec:** #369
- **Status:** approved

## Approach

`setup-github.sh` retitles M5 `M5 Apartheid-era homelands and richer views`, as `docs/requirements.md:260` has it. The Milestones loop lists live milestones as `number|title` and matches each wanted one on its `M<n>` prefix: none → create (as today); title differs → `gh api -X PATCH repos/$REPO/milestones/<number> -f title=…` and echo `milestone renamed: …`; same → skip. Only the title is patched, so live descriptions are left alone. The tech lead authorised building this CODEOWNERS path in this session.

## Files that change

| File                                    | What                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `scripts/setup-github.sh`               | M5 title; the loop matches on `M<n>`, patches the title |
| `plans/chores/C369-milestone-titles.md` | This plan                                               |

## Order of work

1. Branch `chore/C369-milestone-titles` from `origin/main`; commit this plan as `plan(C369): approved by @henetiriki`.
2. Edit the script; `bash -n scripts/setup-github.sh`.
3. Run the Milestones section against a stub `gh` (scratchpad, not committed) that serves today's live list: expect one PATCH to milestone 6 and nothing else. Serve the renamed list: expect no calls. Serve a list without M4: expect one create for M4.
4. `npm run lint`, `npm run format:check`, `npm run words`, `npm test`.
5. Open PR `C.369: Align the milestone titles with the requirements` with `Closes #369`; `status: ready-for-dev` stays for the tech lead's run.

## Risks

- A typo in the PATCH changes a live milestone wrongly: step 3 shows the exact calls before anyone runs it.
- The list call returns 30 milestones per page; there are 7.

## Proof

| Acceptance check            | Proven by                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Live M5 shows the new title | Tech lead runs `./scripts/setup-github.sh`, then `gh api repos/henetiriki/kinscape/milestones` |
| Re-running changes nothing  | Step 3's second run; the tech lead's re-run prints no `milestone` lines                        |

## Out of scope

`docs/requirements.md`; milestone descriptions.
