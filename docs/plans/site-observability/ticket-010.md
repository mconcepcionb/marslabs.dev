---
id: ticket-010
plan: site-observability
repo: marslabs.dev
phase: 4
status: done
depends_on: [ticket-001]
---

# Gate the build on a performance budget

## Why

Finding F1: the site measures CLS, page count, build time and HTML weight on
every build (`scripts/update-stats.mjs`) but writes them as inert numbers. A
regression — a heavier page, a late layout shift, a blocker — updates a stat and
ships anyway. Cloudflare Web Analytics (ticket-001) shows field Core Web Vitals
after the fact; this ticket stops a regression before it reaches `main`, which is
what "the site measures itself" should mean at delivery time.

## Scope

**In**

- Add `scripts/perf-budget.mjs` that reuses the existing `dist` server and
  Playwright approach from `scripts/update-stats.mjs`, but measures against
  explicit budget constants and **exits non-zero on breach**:
  - LCP, CLS (and FCP/TTFB if cheap) on the home page and one blog post,
  - measured as the median of several runs to damp timing noise,
  - budgets recorded as named constants with a short comment on their origin.
- Make the Chromium resolution work in CI as well as locally: honour a
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE` override and fall back to the local path
  already used by `update-stats.mjs`; install the browser in CI (a
  `microsoft/playwright` action or `pnpm exec playwright install --with-deps
  chromium`, adding the `playwright` devDependency if required).
- Add a `perf` script to `package.json` and a CI step in
  `.github/workflows/ci.yml` (quality job) that runs it after the build, with
  `SKIP_PERF=1` as an escape hatch for local/offline runs — matching the
  existing `SKIP_CLS` convention.
- Document the budgets and how to update them in the runbook or the script
  header.

**Out**

- No field RUM (ticket-001) and no Lighthouse integration.
- No per-route budget matrix; home + one blog post is the guard.
- No budget on all images or third-party requests.
- No change to the published image or the homelab.
- No lowering of an existing threshold to make the gate pass.

## Acceptance criteria

- [ ] `pnpm run perf` passes on the current build.
- [ ] A deliberately breached budget (temporarily raising a metric or lowering a
      constant) makes the command exit non-zero, and the failure output names the
      metric and the budget — demonstrated and then reverted.
- [ ] CI runs the step on `main` and on pull requests.
- [ ] `SKIP_PERF=1 pnpm run perf` short-circuits without measuring.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` stay green.

## Verification

```
pnpm build
pnpm run perf
# expect: exit 0; per-metric lines within budget

SKIP_PERF=1 pnpm run perf
# expect: exit 0; skipped message

# breach check (do not commit): set CLS budget to 0 and rerun
pnpm run perf
# expect: exit non-zero naming CLS

pnpm lint && pnpm typecheck
# expect: no diagnostics
```

Record the measured LCP/CLS values and the chosen budgets in the Result.

## Regression risk and rollback

- **Risk**: timing-based gates are flaky on shared runners; median-of-N and
  generous budgets (well above the local numbers) keep it stable, and
  `SKIP_PERF=1` is the documented escape hatch.
- **Rollback**: `git revert <commit>` removes the script, the script entry and
  the CI step; builds return to their current behaviour.

## Result

- `scripts/perf-budget.mjs`: serves `dist/`, measures the home and one blog post
  over 3 runs (median), and exits 1 on breach. `SKIP_PERF=1` skips.
- Deviation from the draft: the budget is on **FCP** (1800 ms) + CLS (0.05), not
  LCP. The Playwright headless Chromium exposes `first-contentful-paint` but no
  `largest-contentful-paint` entries (verified: `paint` present, `lcp` length 0),
  so an LCP budget could never be satisfied; LCP is still reported when present.
- Browser resolution: `PLAYWRIGHT_CHROMIUM_EXECUTABLE` → `playwright` package
  (added `playwright@1.63.0` devDependency; CI installs it) → the local
  `chromium-1228` path used by `update-stats.mjs`.
- `package.json`: `perf` script. `.github/workflows/ci.yml`: build (`SKIP_CLS=1`)
  + `playwright install --with-deps chromium` + `pnpm run perf` in the quality
  job.
- Verification (2026-09-25): `pnpm run perf` green
  (`/` FCP 56 ms · CLS 0.0000; `/blog/site-que-se-mide/` FCP 52 ms · CLS 0.0000);
  lowering the FCP budget to 1 ms produced `FAIL` and exit 1; `SKIP_PERF=1`
  short-circuits; `pnpm lint` and `pnpm typecheck` are clean.
