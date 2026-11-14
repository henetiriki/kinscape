# Filing a Spec or Chore with `gh`

[SKILL.md](SKILL.md) links here. A Bug is already filed: [bug.md](bug.md) edits it.

After the check round, follow these steps:

1. Ask "File it now?" as a question of its own. If the answer is not yes, file nothing.
2. Read the title prefix and `labels:` from the form in `.github/ISSUE_TEMPLATE/`.
3. Write the body to a new file outside the repo, in the scratchpad or `$TMPDIR`.
4. Write one `### <label>` heading per form box, in the form's order. The Spec-link workflow reads "Intent or milestone". Under an empty optional box, write `_No response_`.
5. Put the title and each label in single quotes. Write a `'` in the title as `'\''`.
6. Run `gh issue create --title '<title>' --label '<label>' --body-file <file>` once. Give one `--label` for each form label.
7. Report the issue number.

## If `gh` fails

If `gh` is missing, signed out or fails, say why. Then give a prefilled link, as _Prefilled links_ in [SKILL.md](SKILL.md) describes.

If the link does not work, tell the user: **Issues → New issue → the form's name**. Then they copy each block into the box with the same name.

If the user asks for a link, give it. File nothing.
