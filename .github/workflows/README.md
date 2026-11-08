<!-- Written by `npm run workflows:diagram` from the workflow files. Don't edit it by hand. -->

# Workflows

What starts each GitHub Actions workflow, its jobs, and the reusable workflows it calls. How the team uses them: [the README](../../README.md#how-we-work).

| Workflow | Trigger | Filter | Jobs |
| --- | --- | --- | --- |
| Actions: Update repo action pins<br>`actions-pin-update.yml` | push | `main · paths: .github/actions/**, .github/workflows/**` | update-pins |
| | workflow_dispatch | | |
| Backlog: Intent ready for PO<br>`backlog-intent-ready.yml` | issues | `closed` | flag-intent |
| Backlog: Interaction limit reminder<br>`backlog-interaction-limit.yml` | schedule | `0 6 * * 2` | remind |
| | workflow_dispatch | | |
| Backlog: Issue status<br>`backlog-issue-status.yml` | pull_request | `opened, ready_for_review` | status |
| | pull_request_review | `submitted` | |
| Backlog: Inherit milestone<br>`backlog-milestone.yml` | issues | `opened, edited` | inherit |
| | pull_request | `opened, edited, reopened` | |
| | workflow_dispatch | | |
| Backlog: Link Spec to Intent<br>`backlog-spec-link.yml` | issues | `opened` | link-spec |
| CI: Delete PR caches<br>`ci-cache-cleanup.yml` | pull_request | `closed` | delete |
| CI: Playwright cache<br>`ci-playwright-cache.yml` | push | `main · paths: package-lock.json, .github/workflows/ci-playwright-cache.yml` | seed |
| | schedule | `0 5 * * 1,4` | |
| | workflow_dispatch | | |
| CI<br>`ci.yml` | pull_request | `opened, synchronize, reopened, ready_for_review` | lint · typecheck · format · test · coverage · boundaries · words · image · e2e |
| | push | `main` | |
| Claude: Build<br>`claude-build.yml` · calls Claude: Run (shared) | pull_request_review | `submitted` | approve · build |
| Claude: Code Review<br>`claude-code-review.yml` | pull_request | `opened, synchronize, ready_for_review, reopened · paths-ignore: plans/**` | claude-review · summary |
| Claude: Denial audit<br>`claude-denial-audit.yml` | schedule | `0 7 * * 1` | audit |
| | workflow_dispatch | | |
| Claude: Fix review<br>`claude-fix-review.yml` · calls Claude: Run (shared) | pull_request | `labeled` | fix · unlabel |
| Claude: Hand back<br>`claude-hand-back.yml` | pull_request | `opened, synchronize, reopened` | label |
| Claude: Plan<br>`claude-plan.yml` · calls Claude: Run (shared) | issues | `labeled` | plan |
| Claude: Plugin pin check<br>`claude-plugin-pin-check.yml` | schedule | `0 6 * * 1` | check-pin |
| | workflow_dispatch | | |
| Claude: Resolve conflict<br>`claude-resolve-conflict.yml` · calls Claude: Run (shared) | pull_request | `labeled` | resolve · unlabel |
| Claude: Respond<br>`claude-respond.yml` | issue_comment | `created` | claude · summary |
| | pull_request_review_comment | `created` | |
| | issues | `opened, assigned` | |
| | pull_request_review | `submitted` | |
| Claude: Run (shared)<br>`claude-run.yml` | workflow_call | | gate · run · return · summary |
| Claude: Unblock<br>`claude-unblock.yml` | issues | `closed` | unblock · refresh |
| Design agent shots<br>`design-agent-shots.yml` | workflow_dispatch | | setup · render · commit |

## Pull requests

```mermaid
---
config:
  theme: redux-color
  look: neo
  layout: elk
---
flowchart TB
  on_pull_request([pull_request])
  on_pull_request_review([pull_request_review])
  on_pull_request_review_comment([pull_request_review_comment])
  backlog_issue_status["Backlog: Issue status"]
  backlog_milestone["Backlog: Inherit milestone"]
  ci_cache_cleanup["CI: Delete PR caches"]
  ci["CI"]
  claude_build["Claude: Build"]
  claude_code_review["Claude: Code Review"]
  claude_fix_review["Claude: Fix review"]
  claude_hand_back["Claude: Hand back"]
  claude_resolve_conflict["Claude: Resolve conflict"]
  claude_respond["Claude: Respond"]
  claude_run["Claude: Run (shared)"]
  on_pull_request --> backlog_issue_status
  on_pull_request --> backlog_milestone
  on_pull_request --> ci_cache_cleanup
  on_pull_request --> ci
  on_pull_request --> claude_code_review
  on_pull_request --> claude_fix_review
  on_pull_request --> claude_hand_back
  on_pull_request --> claude_resolve_conflict
  on_pull_request_review --> backlog_issue_status
  on_pull_request_review --> claude_build
  on_pull_request_review --> claude_respond
  on_pull_request_review_comment --> claude_respond
  claude_build -.->|calls| claude_run
  claude_fix_review -.->|calls| claude_run
  claude_resolve_conflict -.->|calls| claude_run
  classDef backlog fill:#fdf3dd,stroke:#b7791f
  classDef ci fill:#e8f1f7,stroke:#3e7fa6
  classDef claude fill:#e6eee4,stroke:#264f29
  class backlog_issue_status,backlog_milestone backlog
  class ci_cache_cleanup,ci ci
  class claude_build,claude_code_review,claude_fix_review,claude_hand_back,claude_resolve_conflict,claude_respond,claude_run claude
```

## Issues

```mermaid
---
config:
  theme: redux-color
  look: neo
  layout: elk
---
flowchart TB
  on_issue_comment([issue_comment])
  on_issues([issues])
  backlog_intent_ready["Backlog: Intent ready for PO"]
  backlog_milestone["Backlog: Inherit milestone"]
  backlog_spec_link["Backlog: Link Spec to Intent"]
  claude_plan["Claude: Plan"]
  claude_respond["Claude: Respond"]
  claude_unblock["Claude: Unblock"]
  claude_run["Claude: Run (shared)"]
  on_issue_comment --> claude_respond
  on_issues --> backlog_intent_ready
  on_issues --> backlog_milestone
  on_issues --> backlog_spec_link
  on_issues --> claude_plan
  on_issues --> claude_respond
  on_issues --> claude_unblock
  claude_plan -.->|calls| claude_run
  classDef backlog fill:#fdf3dd,stroke:#b7791f
  classDef claude fill:#e6eee4,stroke:#264f29
  class backlog_intent_ready,backlog_milestone,backlog_spec_link backlog
  class claude_plan,claude_respond,claude_unblock,claude_run claude
```

## Push, schedule and manual runs

```mermaid
---
config:
  theme: redux-color
  look: neo
  layout: elk
---
flowchart TB
  on_push([push])
  on_schedule([schedule])
  on_workflow_dispatch([workflow_dispatch])
  actions_pin_update["Actions: Update repo action pins"]
  backlog_interaction_limit["Backlog: Interaction limit reminder"]
  backlog_milestone["Backlog: Inherit milestone"]
  ci_playwright_cache["CI: Playwright cache"]
  ci["CI"]
  claude_denial_audit["Claude: Denial audit"]
  claude_plugin_pin_check["Claude: Plugin pin check"]
  design_agent_shots["Design agent shots"]
  on_push --> actions_pin_update
  on_push --> ci_playwright_cache
  on_push --> ci
  on_schedule --> backlog_interaction_limit
  on_schedule --> ci_playwright_cache
  on_schedule --> claude_denial_audit
  on_schedule --> claude_plugin_pin_check
  on_workflow_dispatch --> actions_pin_update
  on_workflow_dispatch --> backlog_interaction_limit
  on_workflow_dispatch --> backlog_milestone
  on_workflow_dispatch --> ci_playwright_cache
  on_workflow_dispatch --> claude_denial_audit
  on_workflow_dispatch --> claude_plugin_pin_check
  on_workflow_dispatch --> design_agent_shots
  classDef actions fill:#fbedea,stroke:#b4412f
  classDef backlog fill:#fdf3dd,stroke:#b7791f
  classDef ci fill:#e8f1f7,stroke:#3e7fa6
  classDef claude fill:#e6eee4,stroke:#264f29
  classDef design fill:#f4f5f0,stroke:#c9cfc5
  class actions_pin_update actions
  class backlog_interaction_limit,backlog_milestone backlog
  class ci_playwright_cache,ci ci
  class claude_denial_audit,claude_plugin_pin_check claude
  class design_agent_shots design
```
