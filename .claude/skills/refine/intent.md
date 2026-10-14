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

Your first message does three things, briefly:

1. Says what is about to happen: a few short rounds of questions, nothing is written down until they agree, and the result is text they copy into GitHub.
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

When everything is confirmed, show the draft under **one heading per box of the GitHub form**, in this order, so the PO can copy each block into its box. Use the PO's wording where you can.

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

Then tell the PO, in plain steps:

1. On GitHub, open the repository, choose **Issues → New issue → Intent → Get started**.
2. Copy each block above into the box with the same name, and give the issue the title shown.
3. Press **Submit new issue**. The Intent starts as `status: draft`. When they are happy with it, they change the label to `status: ready-for-dev`, as the form explains.

Offer to adjust any block before they paste it. Don't start on a Spec. That is the tech lead's step.
