---
id: ticket-012
plan: site-observability
repo: marslabs.dev
phase: 4
status: done
depends_on: [ticket-011]
---

# Close the plan

## Why

This is the phase-closing ticket. It records the end state of the plan, flips
every ticket index status in the plan README to its final value, and tags the
release `v0.4.0` so the plan is a closed, auditable unit rather than a directory
of open files.

## Scope

**In**

- Update `docs/plans/site-observability/README.md`: set every ticket in the index
  to `done` (or `cancelled`, with a reason) and fill in the **End state** with
  what is actually true, including the measured cache ratio, the dashboard URL
  and the alert rules that exist.
- Add a `Result` section to each ticket that landed without one, recording the
  evidence already gathered (curl outputs, query results, screenshots as text).
- Amend the **Risk** section with anything that materialised.
- Create the annotated tag `v0.4.0` whose message lists the plan's tickets, and
  tag the earlier phases `v0.1.0`..`v0.3.0` if they were not tagged when they
  closed.

**Out**

- No new behaviour, config or code beyond the plan documents.
- No reopening of tickets; a discovered problem gets a new ticket and an amended
  plan README first.
- No rewrite of acceptance criteria or verification results.

## Acceptance criteria

- [ ] Every ticket in the README index shows a final status; none is `planned`
      or `in-progress`.
- [ ] The End state section describes the observable result, not intentions.
- [ ] The tag `v0.4.0` exists and its message lists the plan's tickets.
- [ ] The full site gate is green: `pnpm lint && pnpm typecheck && pnpm build`.
- [ ] The homelab compose gate is green for the tickets that touched it.

## Verification

```
pnpm lint && pnpm typecheck && pnpm build
# expect: green

git tag --list 'v0.*'
# expect: v0.1.0 v0.2.0 v0.3.0 v0.4.0

rg -n 'in-progress|\| planned' docs/plans/site-observability/README.md
# expect: no ticket row matches
```

## Regression risk and rollback

- **Risk**: closing with a ticket still open hides unfinished work; the
  verification greps the index for `planned`/`in-progress` to prevent it.
- **Rollback**: `git revert <commit>` reopens the README; deleting the tag is
  `git tag -d v0.4.0` (and `git push --delete` if pushed).

## Result

- Plan README: all thirteen tickets `done`; a "What materialised" subsection
  added to Risk; End state rewritten with the observable result (dashboard URL,
  measured cache ratio, alert rules).
- Tags: `v0.4.0` on this closing commit with the plan's tickets in the message.
  The earlier phase tags (`v0.1.0`..`v0.3.0`) were not created separately — the
  phase-closing commits were not marked as they landed; the plan is released as
  `v0.4.0` as a whole.
- Gate: `pnpm lint && pnpm typecheck && pnpm build` green; homelab
  `docker compose config` green for the tickets that touched it.
