# Build rules

These rules apply to each build of an approved plan.

## Who builds

<a id="build-ownership"></a>**Build ownership.** The CI agent builds the rows of an approved plan that are not hand-back paths ([building](../docs/building.md#specs-bugs-and-chores)). Before a person builds by hand, the person does these steps:

- Run `git fetch`. Then read the PR comments.
- If the PR has a "Building…" comment, wait. The workflow deletes it when the run ends.
- If the PR has no "Building…" comment, continue from the last pushed commit.

## While you build

<a id="test-first"></a>**Test first.** This rule applies to logic that a unit test covers. Before you write the code, see the test fail on the behaviour, not on an import error. Paste that failing line in the Evidence of the PR.

<a id="failing-tests"></a>**Failing tests.** Fix the code, not the test. If the plan changes the behaviour that a test checks, you can do one of these to the test:

- Change the test.
- Skip the test.
- Delete the test.
- Loosen an assertion.

In each other case, leave a test that looks wrong as it is. Write a "Big:" line that names the test and the reason ([big-departures rule](#big-departures)).

## When the plan changes

<a id="small-departures"></a>**Small departures.** A small departure does not change the intent of the plan. These are examples:

- a file name;
- the step order;
- an extra helper.

Update the plan in the same commit as the code. Write one line under `## Deviations`. The tech lead's PR approval approves the code and the final plan together.

<a id="big-departures"></a>**Big departures.** A big departure is a change that does one of these:

- It alters the scope.
- It alters the data model.
- It alters a public API.
- It alters an acceptance check.
- It adds a dependency.

If a change alters the scope, the data model, a public API or an acceptance check, do these steps:

- Build the change that you judge correct.
- Write one line under `## Deviations` that starts with "Big:". Give the reason.
- In a build, keep the PR a draft. A fix review leaves the draft state to the tech lead.

If a change adds a dependency, build the work that needs no package. Write a "Big:" line that names the package. In a build, keep the PR a draft.

If two readings of the plan are equally correct, build the one that changes less. Name the other reading in the "Big:" line. A "Big:" line never changes a Decisions box.

## Before ready

<a id="ready-check"></a>**Ready check.** Before the PR leaves the draft state, compare the plan and the diff with these parts of the issue:

- A Chore:
  - "What to change";
  - "How we'll know it's done";
  - Constraints.
- A Spec: "Behaviour and UX" and "Acceptance checks".
- A Bug:
  - "What did you expect?";
  - "Acceptance checks";
  - "Must not break".

Do not list an edit that a step of [Changing the design system](../design/CANVAS.md#changing-the-design-system) makes. List each other difference under `## Deviations`. If a difference changes a done check, write it as a "Big:" line ([big-departures rule](#big-departures)).
