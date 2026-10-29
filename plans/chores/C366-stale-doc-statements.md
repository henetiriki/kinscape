# Plan: C366: Fix stale statements in the process and architecture docs

- **Spec:** #366
- **Status:** draft

## Approach

Reword each statement #366 names to match the file it describes, adding no new rules. One commit, docs only.

## Files that change

| File                          | New / changed | What                                                                                                                                                                                       |
| ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/building.md`            | Changed       | _If a run stalls_: `blocked` only with no comment and no plan PR (`claude-run.yml`). _Merging_: CODEOWNERS paths need the tech lead, linking `repo-settings.md`. "Spec Agent" → "CI agent" |
| `docs/how-we-work.md`         | Changed       | Preview and Live rows: invisible changes (docs, plans, tests, CI) get no preview or deploy, linking `repo-settings.md#vercel`                                                              |
| `docs/repo-settings.md`       | Changed       | "Spec agent" → "CI agent"                                                                                                                                                                  |
| `design/DESIGN.md`            | Changed       | Components, `foundation` row: drop `controls`                                                                                                                                              |
| `docs/architecture.md`        | Changed       | "A map layer": `features/<name>/layers/<layer>.ts`, exported through `index.ts`; the route passes layers to `MapShell`; the polity layer stays in `features/map/layers/`                   |
| `docs/architecture-target.md` | Changed       | Line 7: layers-as-props sentence → link to `architecture.md#where-does-x-go`                                                                                                               |

## Order of work

1. Edit the six files.
2. Run `npm run words`, `npm run format:check` and `npm run lint`.

## Risks

- `how-we-work.md` (850) and `architecture.md` (800) may pass their budgets. I shorten my own new wording first, then stop and ask rather than cut other text.
- #235 edits `DESIGN.md` Screens; this touches only Components, so it should merge cleanly.

## Proof

| Acceptance check                     | Proven by                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Each statement matches its file      | Cited in the PR: `claude-run.yml:223-255`, ruleset code-owner review, `scripts/vercel-ignore.mts`, `app/components/foundation/`, `app/page.tsx` |
| Words, format and lint pass; budgets | Their output                                                                                                                                    |

## Out of scope

`AGENTS.md`, `security.md`, workflows, `requirements.md`, and older plans that say "Spec Agent".
