# `/refine spec <Spec number>`: for the tech lead

Edit a filed Spec. `SKILL.md` sends a Spec number here. Do not slice its Intent.

## Estimate

Cap each Spec at about 600 changed lines. Do not count lockfiles, data files, fonts and the plan.

Estimate each Spec from a merged Spec of the same kind:

- Run `git show --shortstat <merge commit> -- . ':!design/canvas/' ':!design/source/' ':!design/*.jpg' ':!package-lock.json'`.
- If no merged Spec has the same kind, write `Estimate: about N lines, no comparable Spec`.
- Ask the tech lead to confirm N before you draft.

## Draft the boxes

Show one heading per box of `.github/ISSUE_TEMPLATE/2-spec.yml`, in order, after the title (`Spec: M0.1 Hello Vercel`). Fill each box as its description says.

Put the line `Estimate: about N lines, measured on <Spec> (#n)` under Flagged concerns.

Grep each file, board, code and name before you write it into a Spec. Do not take it from a plan, an issue or memory.

Write each box in [STE](../../../docs/writing.md#ste). Run the check round on _Acceptance checks_.

## Edit a filed Spec

1. Follow Read in [Editing a filed issue](filing.md#editing-a-filed-issue). Stop at a closed Spec.
2. Read its Intent, from the Intent box.
3. Ask only about what the user wants to change, and about what the repo now contradicts.
4. Redraft each box of `2-spec.yml` as _Draft the boxes_ says. Measure the Estimate again as _Estimate_ says.
5. Keep each answered decision with its Answer line. If the change contradicts an answered decision, add a new decision that cites it.
6. Run the check round on _Acceptance checks_.
7. Follow Write in [Editing a filed issue](filing.md#editing-a-filed-issue).
