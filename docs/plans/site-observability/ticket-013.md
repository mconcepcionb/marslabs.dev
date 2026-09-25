---
id: ticket-013
plan: site-observability
repo: marslabs.dev
phase: 2
status: done
depends_on: []
---

# Parse sub-second build times in the stats script

## Why

Discovered while verifying ticket-004: `pnpm build` (`node
scripts/update-stats.mjs`) exited 1. The script parses Astro's summary with
`/(\d+) page\(s\) built in ([\d.]+)s/`, but Astro prints **milliseconds** once a
build is faster than one second — `29 page(s) built in 949ms`. The regex matches
nothing, the script reports "no se pudo parsear el resultado del build" and
exits 1. It is timing-dependent: the same build passed earlier at 2.60 s. This
breaks the site gate (ticket-004's `pnpm build` check) and would break the Docker
build in CI on a fast runner.

## Scope

**In**

- Update the parse in `scripts/update-stats.mjs` to accept both units,
  `([\d.]+)(ms|s)`, and normalise to seconds (two decimals) so
  `metricas`/`tiempo-build.md` keep their unit.
- Keep the failure path: unparseable output still exits non-zero with the
  captured output.
- Verify both branches (a forced `ms` string and a forced `s` string) with a
  one-off assertion; the repo has no test runner, so the check stays a command.

**Out**

- No other change to `update-stats.mjs` (no CLS, weight or page-count logic).
- No test framework introduced.
- No change to `nginx.conf`, the site or the pipeline.

## Acceptance criteria

- [ ] `pnpm build` is green whether Astro prints seconds or milliseconds.
- [ ] The parsed build time is normalised to seconds (e.g. `949ms` → `0.95`).
- [ ] Unparseable output still fails with a non-zero exit and the raw output.
- [ ] `pnpm lint` and `pnpm typecheck` stay green.

## Verification

```
pnpm build
# expect: green, "[stats] stats: 29 páginas · <s> s · ..."

node -e "const r=/(\\d+) page\\(s\\) built in ([\\d.]+)(ms|s)/; console.log(r.exec('29 page(s) built in 949ms')[3]==='ms', r.exec('29 page(s) built in 2.60s')[3]==='s')"
# expect: true true

pnpm lint && pnpm typecheck
# expect: no diagnostics
```

## Regression risk and rollback

- **Risk**: a careless regex could mis-parse a decimals value; the two-branch
  check above covers ms and s, the only units Astro emits.
- **Rollback**: `git revert <commit>` restores the seconds-only parser; a build
  over one second behaves exactly as today.

## Result

- `scripts/update-stats.mjs`: parse changed to
  `/(\d+) page\(s\) built in ([\d.]+)(ms|s)/`, normalising `ms` to seconds
  (`949ms` → `0.95`) so `tiempo-build.md` keeps its `s` unit. The
  "no se pudo parsear" failure path is unchanged.
- Verification: both branches asserted (`ms` and `s`); `pnpm build` green
  (`[stats] stats: 29 páginas · 1,01 s · 10,3 KB media · CLS 0,000`);
  `pnpm lint` and `pnpm typecheck` green.
- Found while verifying ticket-004; the amendment is recorded in the plan
  README and ticket-004 now depends on this ticket.
