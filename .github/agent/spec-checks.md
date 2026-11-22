# Spec checks

Run these four checks on the whole body of a Spec, Bug or Chore. Finish every check.

- Each file, board, route, token, type and count that Behaviour, Acceptance checks or Decisions name is on `main`, with the shape the text says.
- Each thing that a Decision option or answer says the Spec gets is in the body.
- No two parts of the body name different boards, values or orders for one thing.
- Each step that the body puts before the plan is done on `main`, or the body says the build does it.

Write one line for each check: `Checked: <files read>` or `Not checked: <reason>`. Write a question for each `Not checked`.

After the four check lines, list each item of the parts that the [Ready check](../../plans/BUILD.md#ready-check) names for the issue's type. Write one line for each item:

- `<part> <n>: matches main`
- `<part> <n>: D<k>`, with the number of its Drift item
- `<part> <n>: Not checked: <reason>`, with a question

For an empty part, write `<part>: empty`. A respond run and a build write only the four check lines. If another file puts a line last, keep that line last.
