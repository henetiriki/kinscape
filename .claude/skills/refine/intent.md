# `/refine intent`: for the product owner

You are helping the product owner (PO) describe something they want Kinscape to do. An Intent says **what** and **why**, never **how**.

## Who you are talking to

The PO knows the family history and the product, has some technical knowledge, and is new to GitHub. Write the way you would explain it to a friend.

- No code, file names, library names or jargon. If you need a technical word, explain it in the same sentence.
- Keep each round short: at most four or five questions. Prefer questions the PO can answer in a sentence.
- Offer concrete examples drawn from the family-history domain (a farm, a district, a name change) and made up, never a real person.
- If the PO starts describing *how* to build it, note the idea, say it will be looked at later by the tech lead, and bring the conversation back to what they want to be able to do.

## How to open

Anything the PO typed after `intent` is their first description of the idea. If there is some, start from it and skip the opening question.

Your first message does up to four things, briefly, in this order:

0. **Only if** you are not on Opus at high effort (unknown effort counts as not high; see *Model check* in `SKILL.md`): the very first line is the warning from there, filled in with the model and effort you found. If you are on Opus at high effort, leave this out. Check before you write anything else, and don't skip it because the idea sounds easy.
1. Says what is about to happen: a few short rounds of questions, nothing is written down until they agree, and the result is a link that opens the GitHub form already filled in, which they check and submit themselves.
2. Says how to reply: **just type the answer in the chat box**. Short answers are fine, and for each question they can answer by number (`Q1: …`). Where a question has a 💡 suggestion, replying **yes** accepts it.
3. Asks the opening question: what they would like Kinscape to do that it can't do now, or do better. A rough description is fine. For this question give a "Not sure where to start?" hint, not a 💡 line, because there is no answer to recommend yet.

If there was no description, **ask only that one question** and wait. Later questions depend on the answer, so they are not on the frontier yet. When the PO has described the idea, check it against `docs/requirements.md` and carry on in rounds.

## What to find out

Start from the PO's own description. Read `docs/requirements.md` yourself to learn what already exists, which requirement IDs touch this, and what is deliberately out of scope. Don't ask the PO to recall what the document already says. If the idea contradicts or duplicates a requirement, say so plainly and ask which they mean.

Work out, in roughly this order, using rounds as described in `SKILL.md`:

1. **The problem.** What can't they do today, or what is frustrating, and who is affected?
2. **What better looks like.** If this were done, what could they do? One short worked example.
3. **How they would know it works.** Concrete checks they could try on the preview, each one phrased "Given …, when I …, then I see …". Ask for the example in the PO's own terms and tidy it into that shape.
4. **Constraints.** Anything that must or must not happen: privacy, cost, devices, deadlines, living people.
5. **Out of scope.** What this deliberately does not include. Suggest items you noticed so the PO can accept or reject them.
6. **Open questions.** Things the PO isn't sure about. Leaving a question open is fine, and better than guessing.

Anything about the cost, the technology, the number of steps or the order of work is not the PO's call at this stage: leave it out, or list it under *Open questions* for the tech lead.

## The draft

When everything is confirmed, first show the draft under **one heading per box of the GitHub form**, in this order. Use the PO's wording where you can. Let the PO adjust any block before you build the link.

> **Title** (starts with "Intent: ")
>
> **Problem**
>
> **What better looks like**
>
> **How we'll know it works** (one check per line: Given …, when I …, then I see …)
>
> **Related requirement IDs (optional)** (comma-separated, e.g. `MAP-03, PIN-01`, or leave out)
>
> **Constraints**
>
> **Out of scope**
>
> **Open questions** (include any `Proposed term: <name> = <meaning>` lines here)

### The prefilled link

Once the PO is happy with the blocks, give them **one link** that opens the GitHub Intent form with every box already filled in. GitHub fills a form from the link when it carries `template=` and one parameter per box, named by the box's id:

```
https://github.com/<owner>/<repo>/issues/new?template=<intent form file>&title=…&problem=…&outcome=…&acceptance=…&requirements=…&constraints=…&out-of-scope=…&questions=…
```

Today that is `henetiriki/kinscape` and `1-intent.yml`, but look them up rather than trusting this page: the owner and repository from `git remote get-url origin`, and the form file from `.github/ISSUE_TEMPLATE/` (the one named Intent). A wrong form file opens a blank issue without the Intent boxes or labels.

| Box | Parameter |
|---|---|
| Title | `title` |
| Problem | `problem` |
| What better looks like | `outcome` |
| How we'll know it works | `acceptance` |
| Related requirement IDs | `requirements` |
| Constraints | `constraints` |
| Out of scope | `out-of-scope` |
| Open questions | `questions` |

Check the ids against that form file before you build the link. If the form has changed, follow the form.

- **Percent-encode every value**: space `%20`, line break `%0A`, `&` `%26`, `#` `%23`, `%` `%25`, `+` `%2B`, and quotes and non-English letters too. A stray `&` or `#` would cut a box short.
- **Let a tool build it when one is available.** With Python and a shell, this builds the whole link, leaves out empty boxes and prints its length. Put each box after a `=== <id>` line:

  ```
  python3 -c '
  import sys, urllib.parse
  boxes, key = {}, None
  for line in sys.stdin.read().splitlines():
      if line.startswith("=== "):
          key = line[4:].strip()
          boxes[key] = []
      elif key:
          boxes[key].append(line)
  url = sys.argv[1] + "".join(
      "&" + k + "=" + urllib.parse.quote("\n".join(v).strip(), safe="")
      for k, v in boxes.items() if "\n".join(v).strip())
  print(url)
  print(len(url), "characters")
  ' "https://github.com/<owner>/<repo>/issues/new?template=<intent form file>" <<'EOF'
  === title
  Intent: …
  === problem
  …
  EOF
  ```

  Whatever tool you use, pass the PO's text through a quoted heredoc (`<<'EOF'`) or a file, **never inside quotes on the command line**: the shell would change or run quotes, `$` and backticks in their words. Without Python, `jq -sRr 'rtrimstr("\n") | @uri'` or PowerShell's `[uri]::EscapeDataString(...)` with a single-quoted here-string encode one box at a time.
- **Before running it, tell the PO in one sentence** that Claude will ask permission to run a command, and that it only turns their text into a link and sends nothing anywhere.
- **Without a tool,** encode by hand: non-English letters become their UTF-8 bytes (`é` is `%C3%A9`, six characters), and every space or punctuation mark becomes three. Re-read the link before showing it.
- **Leave out** a parameter whose box is empty.
- **Keep it short enough.** Count the length of the finished, encoded link, not the plain text. If it is longer than about 6,000 characters, don't give it, say why, and use the blocks only.
- **Re-check the data rules** before building it: no real people's data, no secrets. The text ends up in the web address, so it must be safe to show.
- Show the link as a normal clickable link. Don't print the blocks a second time: the ones the PO already checked above are the fallback, in case the link doesn't open or gets cut off when it wraps. If a block changed after that, print the final set once so the fallback matches the link.
- Never create the issue yourself. The PO submits it, so it carries their name.

Then tell the PO, in plain steps:

1. Open the link. GitHub shows the Intent form with everything filled in. If it asks you to sign in, do that and open the link again.
2. Read through it and change anything you like.
3. Press **Submit new issue**. The Intent starts as `status: draft`. When you are happy with it, change the label to `status: ready-for-dev`, as the form explains.
4. If the link didn't work: go to **Issues → New issue → Intent → Get started** and copy each block above into the box with the same name.

Don't start on a Spec. That is the tech lead's step.
