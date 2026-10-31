# Plan: DS.3: Publish the design system to Claude

- **Spec:** #446
- **Requirement IDs:** None (design tooling)
- **Status:** approved

## Approach

A project skill, `/publish-design-system`, does what needs the signed-in tools: it checks they exist, creates or reads the address, uploads and writes. Everything decidable without them is a tested script, `scripts/design-system-publish.mts`: reading the address from `DESIGN.md`, listing changed files, and stamping the index with `by` and the icon records. The skill runs `npm run design-system`, then the script, then publishes the paths the script prints, the index last. Its `.claude/skills/**` path hands the build back to the tech lead (rule 13). This Actions run can't see the artifact tools, so the build names their calls.

## Decisions

**D1 · Which tools publish** · Decides: Tech lead

- **A.** The artifact tools, as the Spec says. The address is a `claude.ai/artifact/<id>` link, like the canvas. Nothing depends on standalone Claude Design (#442's constraint).
- **B.** `DesignSync`: projects on claude.ai/design, writes behind a plan the user approves. Its own description says standalone Claude Design closes by 14 December 2026, and it has no upload that returns the `blob` an icon record needs.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D2 · How a changed file is found** · Decides: Tech lead

- **A.** Publish `checksums.json` (each file's SHA-256) beside the index. The skill reads only that file; the script prints the paths whose hash differs. Acceptance check 3 also lists `checksums.json` (Spec edit).
- **B.** The skill reads every published file and compares it itself. No Spec edit, but about 30 reads a run, and fonts are binary.
- **Other:** your own.

**Answer: A** (@henetiriki)

**D3 · Who `lastChange.by` names** · Decides: Tech lead

- **A.** `git config user.name` on the machine that runs it.
- **B.** The signed-in claude.ai account's name, if the tools expose it; else A.
- **Other:** your own.

**Answer: B** (@henetiriki)

## Files that change

| File                                              | New / changed | What                                                                                                     |
| ------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `.claude/skills/publish-design-system/SKILL.md`   | New           | The steps, stop message, first-run address write, final list and link                                    |
| `scripts/design-system-publish.mts`               | New           | `address`, `checksums`, `changed`, `stamp`; subcommands of the same names                                |
| `scripts/__tests__/design-system-publish.test.ts` | New           | Address found, missing, or malformed (stops); unchanged gives `[]`; one colour gives the two token files |
| `design/DESIGN.md`                                | Changed       | The artifact's link in the opening paragraph, written by the first run                                   |

## Order of work

1. Test fails on the behaviour (rule 12), then the script.
2. `SKILL.md`.
3. Runs, in order: `claude -p "/publish-design-system"` (check 4); first run (check 1); a second run (check 2); one colour changed in an uncommitted `tokens.json`, run, then revert and run again (check 3).

## Risks

- **A second artifact.** If `DESIGN.md` has a design-system link that `address` can't parse, the script exits non-zero and the skill stops instead of creating one.
- **Colour test left live.** Check 3's last run republishes the true value.
- **Sharing.** The artifact starts private; the tech lead shares it on its page.

## Proof

| Acceptance check              | Proven by                                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| First run creates and records | Skill output, the artifact's link, `DESIGN.md` diff, in Evidence |
| Same commit sends the index   | Second run's list in Evidence; `changed` unit test               |
| One colour, three files       | That run's list and the artifact's value in Evidence; unit test  |
| Artifacts off: stops          | `claude -p` output in Evidence                                   |
| Checks pass                   | `lint`, `format:check`, `words`, `npm test` output in Evidence   |

## Out of scope

- Installing the system on the canvas: DS.4. Components: DS.7.

## Deviations

- Extra exports `sendList`, `assetRecords` and `cli`; their types are in `scripts/types.ts`.
- D3: no artifact tool returns the account's name, so `by` is `git config user.name`.
- `upload_asset` takes 10 files a call: two calls for 11 icons.
- `design/DESIGN.md`'s link lands in a follow-up PR on `spec/DS.3-publish-design-system-followup`: the tech lead's first run wrote it after #456 merged.
