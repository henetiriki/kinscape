# Plan: chore-model-defaults: Opus (high effort) for planning, Sonnet for building

- **Spec:** none (tooling/process chore: tech lead approves, merged via bypass)
- **Intent:** none
- **Requirement IDs:** none (process only; no change to `docs/requirements.md`)
- **Status:** approved
- **Branch:** `chore/model-defaults`; PR title `chore: plan on Opus at high effort, build on Sonnet`

## Approach

Planning is where judgement matters (interviews in `/refine`, plans in plan mode); building from an approved plan is more mechanical. Encode that in three places, each doing what it is good at:

1. **`/refine` frontmatter**: `model: opus` and `effort: high`. The docs say a skill's `model` override applies only for the rest of the turn it is invoked in, so this alone guarantees Opus for the first turn only. `effort` applies "while the skill is active", but the docs don't say whether that spans turns.
2. **A one-line check at the start of `/refine`** to cover the rest of the interview: if the session isn't on Opus at high effort, say so once and give the two commands (`/model opus`, `/effort high`), then carry on. It never blocks. The effort check uses `${CLAUDE_EFFORT}` (substituted into the skill body); the model check uses the model the session reports for itself.
3. **Project default `"model": "opusplan"`** in `.claude/settings.json`: Opus in plan mode, Sonnet when executing. That matches our workflow, where every code change is planned in plan mode, approved, then built. `/refine` runs outside plan mode, so this covers coding, not the interview.

Deliberately **not** setting a project-wide `effortLevel`: it would apply to every model, including Sonnet while building.

Stated in `CLAUDE.md` (Claude-specific notes) so the intent is written down, and in one line of `docs/how-we-work.md` for the PO.

## Alternatives considered

- `context: fork` so the whole skill runs as an Opus subagent: rejected, the subagent can't see the conversation or ask questions part-way, which breaks the interview.
- Project default `"model": "opus"`: rejected, builds would run on Opus too.
- No hint, rely on frontmatter: rejected, the override lapses after the first turn.

## Files that change

| File | New / changed | What |
|---|---|---|
| `.claude/skills/refine/SKILL.md` | changed | Frontmatter `model: opus`, `effort: high`; a short "Model check" paragraph before *Method* using `${CLAUDE_EFFORT}`. |
| `.claude/settings.json` | new | `{ "model": "opusplan" }` only. Tracked and shared. The agent sandbox cannot write this path, so I stage it in the scratchpad and the tech lead copies it in (same as the skill files in step 5). |
| `CLAUDE.md` | changed | Claude-specific note: plan and `/refine` on Opus at high effort; build on Sonnet; project default is `opusplan`. |
| `docs/how-we-work.md` | changed | One sentence under *Drafting with Claude*: it works best on Opus, and the skill says how to switch if needed. |
| `plans/chore-model-defaults.md` | new | This plan. |

No change to `AGENTS.md`, the issue forms or settings in GitHub. `.claude/settings.local.json` stays untracked.

## Order of work

1. Branch `chore/model-defaults` from up-to-date `main`.
2. "Approved" = the tech lead accepts this plan. Save it as `plans/chore-model-defaults.md` with `Status: approved` and commit it first: `plan(chore-model-defaults): approved by @henetiriki`.
3. Edit the skill, `CLAUDE.md` and `how-we-work.md`; stage `settings.json` in the scratchpad for the tech lead to copy.
4. Verify in a fresh session (below), record what actually happens, adjust the wording if the persistence rules differ from the docs, then commit, push and open the PR.

## Risks

- **Persistence of `model` and `effort` across turns is unclear in the docs.** Mitigation: the hint step makes the outcome correct either way, and the proof step observes the real behaviour and records it in the PR.
- **`opusplan` in project settings affects the PO's sessions too.** Outside plan mode they run on Sonnet. Mitigation: the `/refine` hint tells them to switch. Opus at high effort uses Pro limits faster, but an interview is short.
- **Project settings take precedence over user settings**, so someone's personal `model` choice is overridden for this repo on launch. They can still switch mid-session with `/model`. Acceptable, and stated in the PR.
- **Model aliases move.** `opus` and `sonnet` resolve to the current versions on the Anthropic API; on other providers they may resolve to older ones. Not relevant to this project today.

## Proof

No Spec, so no acceptance checks. Evidence for the PR, from a fresh session on the branch:

| Acceptance check | Proven by |
|---|---|
| Project default applied | `/model` shows `opusplan`; plan mode runs on Opus; after the plan is approved, building runs on Sonnet |
| `/refine` starts on Opus at high effort | Run `/refine intent` from a Sonnet session; first turn reports Opus and high effort |
| Persistence is known | After the PO-style second reply, check `/model` and `/effort` again; note whether they reverted |
| Hint appears when needed | If the second turn is back on Sonnet, the skill's one-line hint with `/model opus` and `/effort high` was shown once; none when already on Opus |
| Docs updated | `CLAUDE.md` and `how-we-work.md` diffs |
| Skill still valid | `/refine` still appears with its argument hint |

## Out of scope

Subagent models, an `effortLevel` default, per-model effort in `modelSettings`, OpenTelemetry or cost tracking, any change to who can use which model.

## Deviations

- Test in the Claude desktop app: it started on Sonnet 5.5 at medium effort, ignored the skill's `model` and `effort` frontmatter, and the Model check printed nothing. (The CLI applied the project `opusplan` default as intended.) Rewrote the check in `SKILL.md` as a mandatory first step with a fixed warning line, treated unreadable effort as "unknown, so warn", and pointed to the app's model and effort selectors as well as `/model` and `/effort`. Intent unchanged.
- Second desktop test (fresh Sonnet 5.5 at medium session on this branch): the Model check was still skipped, although the scripted opening in `intent.md` was followed. A hook was considered and rejected: `UserPromptSubmit` input has no model or effort field (`model` only on `SessionStart` and model-switch events, `effort` only on tool-use events), so it could only show an unconditional reminder, and the PO on Windows would need Bash and PowerShell variants. Moved the warning into the scripted openings of `intent.md` and `spec.md` (step 0) and referenced it from `SKILL.md`. Intent unchanged.
- Third desktop test (Sonnet 5.5, medium): the warning was still skipped. Conclusion: the desktop app can't be made to enforce Opus or High effort from the skill. Removed the warning prose from `SKILL.md`, `intent.md` and `spec.md`, since instructions the model doesn't follow only add text and imply a safeguard that isn't there. Kept the `model` and `effort` frontmatter (a documented request, harmless, not yet observed in the CLI) and corrected `CLAUDE.md` and `docs/how-we-work.md` to say plainly that in the app the user must pick Opus and High effort in the selectors first.
