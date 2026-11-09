# `/refine bug <issue number>`: for the tech lead

Make a filed **Bug** clear before an agent plans it. Add four sections below the reporter's three boxes. Keep the reporter's text word for word.

## Before the first question

1. Read the Bug: `gh issue view <number> --comments`. Get the exact body with `gh issue view <number> --json body --jq .body`. Without `gh`, ask the user to paste it.
2. Look up what defines the expected result: requirement IDs in `docs/requirements.md`, merged Specs, `design/DESIGN.md` and the snapshots in `design/`.
3. Read the code the Bug names, as far as the steps need.

## What to settle

Ask questions as described in `SKILL.md`, until these four sections are settled:

- **Steps to reproduce:** numbered steps that show the Bug on `main`, from a named page and state.
- **Expected per:** the requirement ID, Spec or design snapshot that defines the expected result. If none defines it, ask the tech lead, and cite the answer as `Tech lead (Q<n>)`.
- **Acceptance checks:** Given / When / Then checks, each one able to become an automated test.
- **Must not break:** the requirements and Specs that use the code or behaviour the fix changes. Give each its ID or issue number.

## The draft

Show the four sections as `###` headings, in the order above, as the form shows its boxes. Write each in [STE](../../../docs/writing.md#ste). Then run the check round on _Acceptance checks_.

## Hand-over

A Bug is already filed, so give no form link. Ask "Edit #<number> now?" as its own question. Only after a yes to that question, run one `gh issue edit <number> --body-file - <<'BUG_BODY_END'`. First check that no line of the new body is `BUG_BODY_END`.

The new body is the exact body up to any `<!-- refine bug -->` line, unchanged. Then comes that line, then the four sections. So a later run replaces only its own sections.

Without `gh`, print only the `<!-- refine bug -->` line and the four sections. The tech lead adds them at the end of the body, in the issue's Edit box.

The tech lead sets the status label, as [Roles and labels](../../../docs/how-we-work.md#roles-and-labels-whose-turn-is-it) says. Stop there.
