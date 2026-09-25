# Plans

How work is planned and delivered. This is authoritative for the process.

A **Plan** is a named, phased body of work that delivers one coherent goal. It
is split into atomic **Tickets**, each of which is independently verifiable,
independently revertable, and lands as exactly one commit. A Plan's **Phases**
are milestones; the phase-closing commit is tagged when the plan uses releases.

## Layout

```
docs/plans/
  README.md              this file
  TEMPLATE.md            plan and ticket templates
  <plan-slug>/
    README.md            the plan: goal, non-goals, phases, ticket index
    ticket-001.md
    ticket-002.md
```

- Plan slug: kebab-case noun phrase, e.g. `site-observability`.
- Tickets: `ticket-XXX.md`, zero-padded to three digits, numbered sequentially
  within the Plan. **Never renumber.** A dropped ticket stays with
  `status: cancelled`.
- Cross-plan references: `<plan-slug>/ticket-014`.

## Plan README

Must contain: goal and why, non-goals, phases (name, tickets, release tag),
the ticket index, and links to the spec, ADR or review document it implements.

The ticket index is the plan's map. `Repo` is added only when a plan spans more
than one repository:

| Id         | Title       | Repo        | Phase | Finding | Depends on  | Status  |
| ---------- | ----------- | ----------- | ----- | ------- | ----------- | ------- |
| ticket-001 | Short title | marslabs.dev | 1    | 1       | -           | planned |

## Ticket

YAML frontmatter plus a fixed body. See [TEMPLATE.md](./TEMPLATE.md).

```yaml
---
id: ticket-001
plan: <plan-slug>
repo: marslabs.dev
phase: 1
status: planned
depends_on: []
---
```

- `repo`: which repository the ticket commits to. Omit on single-repo plans.
  These repos are siblings: `marslabs.dev` (this site) and `homelab` (infra /
  observability).
- `status`: `planned` | `in-progress` | `done` | `cancelled`.
- `in-progress` is a local marker only and is **never committed**; the only
  statuses that appear in commits are `planned`, `done` and `cancelled`.

Body sections: **Why**, **Scope** (in and out), **Acceptance criteria**,
**Verification**, **Regression risk and rollback**. A `Result` section is added
when the ticket lands.

### Verifiable

A Ticket is verifiable only if its acceptance criteria can be checked pass/fail
by someone other than the author, executable where possible (a command, a test,
an assertion). New behaviour adds or adjusts automated tests. Manual-only checks
are allowed only with exact steps and the evidence they produce.

### Atomic

Atomic means: one coherent change, criteria checkable in one sitting, and
`git revert <commit>` undoes it cleanly. A Ticket may span repos only when a
contract change forces producer and consumer to move together; otherwise it is
single-repo. There is no size cap.

### Ready

A Ticket is ready to start only when every entry in `depends_on` is `done`.
Cycles are forbidden. The plan README answers "what can I do next?".

## Commits

- Exactly one commit per Ticket, final state, **in the repo named by `repo:`**.
  Squash and amend freely before it lands.
- Message: `<scope>: <imperative summary> (ticket-NNN)`, body links the Ticket
  path.
- The `status: done` flip ships in that same commit. When the plan home and the
  work are in different repos, a cross-repo ticket flips its status in a
  follow-up docs commit (`docs: mark ticket-00N done (ticket-00N)`).
- No pull requests. Commits land on `main`; CI runs on push.

## Verification and the gate

- Per Ticket: run the checks the change affects.
  - `marslabs.dev`: `pnpm lint && pnpm typecheck && pnpm build`.
  - `homelab`: `HOMELAB_SECRETS_DIR=<dir> docker compose -f nodes/<node>/compose.yaml config --quiet`,
    plus the ticket's live check.
- Before a Phase closes, the full gate for every repo the phase touched must be
  green.
- Never lower a coverage threshold or a performance budget inside a Ticket.
  Lowering one requires its own Ticket.

## Phases and releases

- A Phase completes when all its Tickets are `done` and the full gate is green.
- The Phase-closing commit is tagged `vMAJOR.MINOR.PATCH`; the tag message lists
  the Phase's Tickets.
- Hotfixes (production defects) get their own Ticket and a PATCH tag.

## Unplanned work

- In scope of an open Plan: add a Ticket and update the plan README index.
- Out of scope: start a new Plan under `docs/plans/`.
- If a discovery changes a Plan's scope, amend the plan README first, then add
  Tickets.

## Plan index

| Plan | Goal | Repos | Status | Latest tag |
| ---- | ---- | ----- | ------ | ---------- |
| [site-observability](./site-observability/README.md) | Extend the site's self-measurement from build-time lab numbers to field traffic, RUM, edge cache and origin health, surfaced in the homelab Grafana | marslabs.dev, homelab | planned | - |
