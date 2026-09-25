---
id: ticket-011
plan: site-observability
repo: marslabs.dev
phase: 4
status: planned
depends_on: [ticket-003, ticket-008]
---

# Retire the manual CSV exports and document the pipeline

## Why

Finding F7: the five hand-exported CSVs in `live/data/` are now redundant — the
edge is scraped into Prometheus (ticket-007) and shown in the dashboard
(ticket-008), audience and field Core Web Vitals live in Cloudflare Web
Analytics (ticket-001), and SEO lives in Search Console (ticket-003). Leaving the
exports in place invites two contradictory sources of truth and keeps untracked
data in the working tree (`git status` currently reports `live/` as untracked).
This ticket closes the plan by making the source of each question explicit.

## Scope

**In**

- Preserve the pre-pipeline snapshot: copy the 9-day CSV totals (16–24 Sep 2026)
  and the ticket-003 SEO baseline into `docs/runbooks/site-analytics.md` as the
  historical record, clearly dated.
- Delete `live/data/*.csv` and add `live/` to `.gitignore` so exports are not
  reintroduced into the tree.
- Finish `docs/runbooks/site-analytics.md` as the single map from question to
  source:
  - edge traffic, bandwidth, cache ratio → Grafana **Mars Labs** (Cloudflare
    exporter);
  - origin latency, error rate, top paths, status codes → Grafana **Mars Labs**
    (Traefik metrics + Loki access logs);
  - tunnel health → Grafana **Mars Labs** (cloudflared);
  - page paths, referrers, countries, devices and field Core Web Vitals →
    Cloudflare Web Analytics;
  - queries, impressions, CTR, average position → Google Search Console;
  - build-time lab metrics (pages, build time, HTML weight, lab CLS) → the home
    metrics, written by `scripts/update-stats.mjs`.
- Note the cache rule (ticket-004) and the deploy purge (ticket-005) as the
  reason the edge cache is observable, linking `docs/runbooks/edge-cache.md`.

**Out**

- No change to the home metrics content or the blog post.
- No deletion of tracked data (there is none; `live/` was never committed).
- No new exporter or dashboard (tickets 007, 008).
- No archival upload of the CSVs to external storage; the runbook snapshot is
  the record.

## Acceptance criteria

- [ ] `live/data/` contains no CSV files and `git status --ignored` reports
      `live/` as ignored.
- [ ] `docs/runbooks/site-analytics.md` maps every question above to exactly one
      source, with links, and contains the dated historical snapshot.
- [ ] `rg -l 'unique_visitors|percent_cached' .` finds no stray CSV-derived file
      outside the runbook.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` stay green.

## Verification

```
git status --ignored --short live | head
# expect: "!! live/" (ignored) and no tracked CSV

test -z "$(find live -name '*.csv' 2>/dev/null | head -1)"
# expect: exit 0 (no CSVs)

rg -n 'Search Console|Cloudflare Web Analytics|Mars Labs' docs/runbooks/site-analytics.md
# expect: each source named

pnpm lint && pnpm typecheck && pnpm build
# expect: green
```

## Regression risk and rollback

- **Risk**: deleting the CSVs loses the only copy of the 9-day baseline; the
  runbook snapshot must land in the same commit, and the originals remain in the
  operator's shell history / Cloudflare dashboard if needed.
- **Rollback**: `git revert <commit>` restores the CSVs (if they had been
  tracked) and removes the ignore rule; `.gitignore` is trivially editable.
