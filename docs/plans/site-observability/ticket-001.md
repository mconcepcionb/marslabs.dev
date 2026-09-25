---
id: ticket-001
plan: site-observability
repo: marslabs.dev
phase: 1
status: done
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

The draft used a committed beacon (`src/consts.ts` + `src/layouts/Layout.astro`).
The operator chose **Cloudflare automatic setup** instead, so no token is stored
in the repo and no beacon is hand-written; the plan README records the amendment.
The tradeoff — the beacon is not version-controlled — is documented by this
ticket, and a future ticket can switch to a committed beacon if versioning is
wanted.

## Scope

**In**

- Enable Cloudflare **Web Analytics → automatic setup** for `marslabs.dev` in the
  account dashboard (the edge injects the beacon into proxied HTML; no code).
- Verify the beacon is present in the HTML served from the public edge.
- Create `docs/runbooks/site-analytics.md` with a **Web Analytics** section: that
  it is dashboard-managed and not version-controlled, how to reach it, the
  questions it answers (page paths, referrers, countries, devices and field Core
  Web Vitals), the cookieless / sampled caveat, and the tradeoff against a
  committed beacon.

**Out**

- No beacon added to the repository (automatic setup chosen; see the plan
  Amendments section).
- No cookie banner or consent flow; the beacon is cookieless and aggregate.
- No self-hosted analytics (Umami / Plausible / Matomo).
- No dashboard or exporter work — that is ticket-007 / ticket-008.
- No change to `scripts/update-stats.mjs`; build-time metrics remain.
- No custom events or conversion tracking.

## Acceptance criteria

- [ ] Automatic setup is enabled for `marslabs.dev` in Cloudflare Web Analytics.
- [ ] `curl -s https://marslabs.dev/` contains the Cloudflare Insights beacon
      (`static.cloudflareinsights.com/beacon.min.js`).
- [ ] `docs/runbooks/site-analytics.md` exists and its Web Analytics section
      answers the audience/CWV questions above and states the versioning tradeoff.
- [ ] Cloudflare Web Analytics shows at least one page view and a Core Web
      Vitals sample within 24 h.

## Verification

```
curl -s https://marslabs.dev/ | rg -o 'cloudflareinsights\.com/beacon[^"'"'"']*'
# expect: the beacon URL (after automatic setup is enabled and the edge serves fresh HTML)

curl -s https://marslabs.dev/ | rg -o 'data-cf-beacon=.[^>]*'
# expect: a beacon config with a token
```

If the HTML is cached, wait for the TTL or purge the zone, then repeat.

Manual: open
`https://dash.cloudflare.com/?to=/:account/web-analytics`, select
`marslabs.dev`, and confirm page views and a Core Web Vitals sample appear.

## Regression risk and rollback

- **Risk**: the edge-injected script adds a network request and a small parse
  cost; it is deferred and external, and ad blockers only reduce sampled data,
  never break the page. Because injection happens at the edge, it does not affect
  local builds.
- **Rollback**: disable automatic setup in the dashboard. This ticket changes no
  code, so there is nothing to revert beyond the runbook it adds.

## Result

- Automatic setup was already active but in **"enabling, excluding visitor data
  in the EU"** mode, so the beacon was suppressed for EU visitors. Switched to
  **"Enable"** (all visitors) in the account's Web Analytics page; verified from
  the EU (Madrid) afterwards.
- The beacon **is** injected, but only into navigation requests. A bare `curl`
  (no `Accept: text/html`, no `Sec-Fetch-*`) gets no beacon — the false negative
  that stalled this ticket. Verified with navigation headers:
  ```
  cloudflareinsights.com/beacon.min.js/v31edd6df95cf4e85bb4c19e7a9bdbcba1788362987495
  data-cf-beacon='{"version":"2024.11.0","token":"fbbd5d30b04741fb85bca2f797c40ffd","r":1,"spa":2}'
  ```
  Response grew from 22 385 to 22 752 bytes, i.e. the injected script.
- `docs/runbooks/site-analytics.md` created with the Web Analytics section and a
  health check that sends the navigation headers.
- Acceptance #4 (≥1 page view and a Core Web Vitals sample) is passive: now that
  the beacon is live for all visitors, the dashboard fills within 24 h. Confirmed
  separately if the first sample is delayed.
- No code changed: automatic setup means the beacon is dashboard-managed, not
  version-controlled. The token above is public (it ships in every page); it is
  recorded here only as evidence, not as a secret.
