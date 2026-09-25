# Templates

Copy these when starting a Plan. Replace every `<...>`. A Plan's own README and
tickets are the source of truth once created; keep them in sync with this file.

## Plan README

Create `docs/plans/<plan-slug>/README.md`:

```markdown
# <Plan title>

<One or two sentences: the goal and why it matters.>

- **Spec**: <link to the review, ADR or issue this implements>
- **Context**: <links to the ADRs and stable docs that constrain it>
- **Repos**: <the repos this plan touches, and the rule for cross-repo tickets;
  omit if single-repo>

## Why

<The problem, with the findings that motivate it. A findings table works well
when the plan comes from a review or an analysis.>

## Non-goals

- <What this plan deliberately does not do.>

## Phases

| Phase | Name   | Tickets                | Release tag |
| ----- | ------ | ---------------------- | ----------- |
| 1     | <name> | ticket-001, ticket-002 | v0.1.0      |
| 2     | <name> | ticket-003             | v0.2.0      |

## Tickets

| Id         | Title   | Repo        | Phase | Finding | Depends on | Status  |
| ---------- | ------- | ----------- | ----- | ------- | ---------- | ------- |
| ticket-001 | <title> | marslabs.dev | 1    | 1       | -          | planned |
| ticket-002 | <title> | homelab      | 1    | 2       | ticket-001 | planned |

## Risk

<The riskiest tickets and why, plus the gate required before each phase closes.>

## End state

<The observable state when the plan is done.>
```

## Ticket

Create `docs/plans/<plan-slug>/ticket-XXX.md`:

```markdown
---
id: ticket-XXX
plan: <plan-slug>
repo: <repo>
phase: <n>
status: planned
depends_on: []
---

# <Imperative title>

## Why

<The problem this solves and why it is worth a commit. Name the review Finding
and link the spec.>

## Scope

**In**

- <What this ticket changes.>

**Out**

- <What it deliberately leaves alone. Keep this honest; it is what keeps the
  ticket atomic.>

## Acceptance criteria

- [ ] <Checkable statement. Prefer something executable.>
- [ ] <New behaviour adds or adjusts automated tests.>

## Verification

<Exact commands and expected result. Run from the repo root. Example:>

    pnpm build
    # expect: green

<If a criterion can only be checked by hand, give the exact steps and the
evidence.>

## Regression risk and rollback

- **Risk**: <what could break, and what the ticket does so it does not.>
- **Rollback**: `git revert <commit>` restores the previous behaviour.
```

A `Result` section is added when the ticket lands, recording the evidence
(commands run, outputs, decisions taken). `repo:` is omitted on single-repo
plans.
