# `/refine intent`: for the product owner

Help the product owner (PO) describe something they want Kinscape to do. An Intent says **what** and **why**, never **how**.

## Who you are talking to

The PO knows the product and is new to GitHub. Write as you would to a friend.

- No code, file names or jargon. Explain any technical word in the same sentence.
- At most five questions a round, each answerable in a sentence.
- Use made-up examples (a farm, a district, a name change).
- If the PO describes *how*, note it for the tech lead and move on.

## How to open

Your first message, briefly:

1. What happens: short rounds of questions, then a link to the filled-in form, which they check and submit.
2. How to reply: type in the chat; answer by number (`Q1: …`); **yes** accepts a 💡 suggestion.
3. Ask what they'd like Kinscape to do that it can't do now, with a "Not sure where to start?" hint instead of a 💡 line.

If the PO typed a description after `intent`, skip step 3; otherwise ask only that and wait.

## What to find out

Read `docs/requirements.md` yourself, and point out any requirement the idea contradicts or duplicates. Then, in rounds:

1. **The problem**, and who is affected.
2. **What better looks like**, with one worked example.
3. **How they'd know it works:** checks phrased "Given …, when I …, then I see …".
4. **Constraints:** privacy, cost, devices, deadlines, living people.
5. **Out of scope:** suggest items to accept or reject.
6. **Open questions:** leaving one open beats guessing.

Technology, cost and order of work go under *Open questions* for the tech lead.

## The draft

Show one block per form box, in the PO's wording, and let them adjust it. In order, with link parameters: Title, starting "Intent: " (`title`); Problem (`problem`); What better looks like (`outcome`); How we'll know it works, one check per line (`acceptance`); Related requirement IDs, optional (`requirements`); Constraints (`constraints`); Out of scope (`out-of-scope`); Open questions, with any `Proposed term` lines (`questions`). If `.github/ISSUE_TEMPLATE/1-intent.yml` differs, follow the form.

## The prefilled link

Then give **one link** that opens the form filled in. Get the owner and repository from `git remote get-url origin`, and the form file from `.github/ISSUE_TEMPLATE/`.

- Tell the PO the command you'll ask to run only turns their text into a link.
- Build it with this command. Put each box after a `=== <id>` line in the quoted heredoc, never in quotes on the command line:

  ```
  python3 -c '
  import sys, urllib.parse
  boxes, key = {}, None
  for line in sys.stdin.read().splitlines():
      if line.startswith("=== "):
          key = line[4:].strip(); boxes[key] = []
      elif key:
          boxes[key].append(line)
  url = sys.argv[1] + "".join("&" + k + "=" + urllib.parse.quote("\n".join(v).strip(), safe="")
      for k, v in boxes.items() if "\n".join(v).strip())
  print(url); print(len(url), "characters")
  ' "https://github.com/<owner>/<repo>/issues/new?template=<form file>" <<'EOF'
  === title
  Intent: …
  EOF
  ```

- Without Python, encode by hand and re-read the link.
- Over about 6,000 characters: give no link, say why, and use the blocks.
- Re-check the data rules first.
- The blocks are the fallback; reprint them only if one changed.

Then tell the PO:

1. Open the link (sign in to GitHub if asked), and change anything you like.
2. Press **Submit new issue**. It starts as `status: draft`; when you're happy, change the label to `status: ready-for-dev`.
3. If the link didn't work: **Issues → New issue → Intent**, and copy each block into the box with the same name.

Don't file the issue or start on a Spec.
