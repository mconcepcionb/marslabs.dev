---
id: ticket-001
plan: site-observability
repo: marslabs.dev
phase: 1
status: planned
depends_on: []
---

# Add field analytics and RUM to the site

## Why

Findings F1 and F2: the site's only measurements are lab numbers produced at
build time (`scripts/update-stats.mjs`). Nothing reports what real visitors
experience — no page views, no page paths, no referrers, no countries, no
devices, and no field Core Web Vitals. The Cloudflare CSVs in `live/data/` are
edge totals with no dimensions. The site's own thesis, stated in
[site-que-se-mide.md](../../../src/content/blog/site-que-se-mide.md), is that it
measures itself; this ticket adds the field half of that claim. Cloudflare Web
Analytics is free, cookieless and, because the zone is already proxied through
Cloudflare, available without new infrastructure.

## Scope

**In**

- Add Cloudflare Web Analytics to `src/layouts/Layout.astro` with a manual
  beacon so the token is version-controlled and does not depend on Cloudflare
  HTML injection:
  - a `CF_BEACON_TOKEN` constant in `src/consts.ts` (the token is public — it is
    embedded in the served HTML — so committing it is intended);
  - a deferred `<script>` pointing at
    `https://static.cloudflareinsights.com/beacon.min.js` with
    `data-cf-beacon`, loaded only when the token is non-empty so local/offline
    builds never call out.
- Turn off Cloudflare's automatic Web Analytics injection for the zone to avoid
  a double beacon (document the exact toggle in the runbook created by
  ticket-011; note it in this ticket's Result if done by hand).

**Out**

- No cookie banner or consent flow; the beacon is cookieless and aggregate.
- No self-hosted analytics (Umami / Plausible / Matomo).
- No dashboard or exporter work — that is ticket-007 / ticket-008.
- No change to `scripts/update-stats.mjs`; build-time metrics remain.
- No custom events or conversion tracking.

## Acceptance criteria

- [ ] Every generated page includes the Cloudflare beacon `<script>` in its
      `<head>` (verified against `dist/`).
- [ ] The beacon is only emitted when `CF_BEACON_TOKEN` is non-empty.
- [ ] The beacon does not block rendering (`defer`, no render-blocking fetch).
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` are green.
- [ ] Cloudflare Web Analytics shows at least one page view and a Core Web
      Vitals sample within 24 h of deploy.

## Verification

```
pnpm build
# expect: green, stats written, no error

rg -l 'cloudflareinsights.com/beacon' dist --glob '*.html' | wc -l
# expect: equal to the number of generated HTML pages

rg -o 'data-cf-beacon="[^"]*"' dist/index.html
# expect: a token is present; with CF_BEACON_TOKEN empty the tag is absent

pnpm lint && pnpm typecheck
# expect: no diagnostics
```

Manual: after the image is deployed, open
`https://dash.cloudflare.com/?to=/:account/marslabs.dev/web-analytics` and
confirm page views and a Core Web Vitals sample appear.

## Regression risk and rollback

- **Risk**: a third-party script adds a network request and a small parse cost;
  `defer` and the token guard keep it off the critical path and out of local
  builds. The script is external and may be blocked by ad blockers, which only
  reduces sampled data, never breaks the page.
- **Rollback**: `git revert <commit>` removes the beacon; the site keeps working
  and Cloudflare simply stops receiving samples.
