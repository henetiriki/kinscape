# Plan: C747: Fix STE and repeated facts in design/DESIGN.md

- **Spec:** #747
- **Status:** draft

## Approach

One pass over `design/DESIGN.md` fixes the items in _What to change_. The Text field bullet keeps the focus border, because `lib/design/states.mts` copies it to the TextField card. The removed repeats give room for the sentence splits. The `SG-Feedback` and `SG-Type` boards hold their own text, so no board changes.

## Decisions

**D1 · Links to `AGENTS.md` and `docs/architecture.md`** · Decides: Tech lead

`docs/architecture.md` links `DESIGN.md`. A link back makes a cycle that `doc-links` rejects.

- **A.** Name the two files in code spans, with no link.
- **B.** Link them. Add the three files as one `ALLOWLIST` entry in `scripts/doc-links.mts`.
- **Other:** your own.

Recommended: A, because `AGENTS.md` names `design/DESIGN.md` the same way.

**D2 · The name of a screen image** · Decides: Tech lead

- **A.** "JPG". "Snapshot" stays for the HTML file, as in `CANVAS.md`.
- **B.** "Mockup".
- **Other:** your own.

Recommended: A, because `CANVAS.md` and `AGENTS.md` use it.

## Files that change

`design/DESIGN.md`, the design system files that steps 4 and 5 change, and `scripts/doc-links.mts` for D1 B.

## Order of work

1. Edit `design/DESIGN.md`.
2. Run `npm run design-system` (step 2), and push.
3. The tech lead, or a local Claude Code session that the tech lead starts, runs steps 3 to 5. The session needs a signed-in account.

## Proof

| Done check                 | Proven by                   |
| -------------------------- | --------------------------- |
| Tests and word budget pass | `npm test`, `npm run words` |
| Steps 2 to 5 ran           | The step 4.6 report         |
| No snapshot changed        | The step 5.4 output         |
