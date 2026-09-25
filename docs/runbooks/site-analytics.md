# Site analytics

Where each question about `marslabs.dev` is answered, and how to reach the
source. Created by `docs/plans/site-observability/` (ticket-001); completed as
the pipeline lands (ticket-003 for SEO, ticket-011 for the full map).

## Web Analytics (audience and field Core Web Vitals)

- **Source**: Cloudflare Web Analytics, **automatic setup** for `marslabs.dev`.
- **Reach it**: `https://dash.cloudflare.com/?to=/:account/web-analytics` →
  select `marslabs.dev`. Web Analytics is **account-scoped**, not a zone tab.
- **Answers**: page views, top paths, referrers, countries, device / browser
  breakdown, and field Core Web Vitals (LCP, CLS, INP, FCP, TTFB).
- **Caveats**:
  - Cookieless and aggregate; no consent banner is required and no personal data
    is stored.
  - Sampled, so treat it as a trend, not an exact count.
  - The beacon is injected at the edge, so **it is not version-controlled** in
    this repository. That is the accepted tradeoff of automatic setup; a future
    ticket can switch to a committed beacon (`src/consts.ts` +
    `src/layouts/Layout.astro`) if version control is wanted.
- **Health check** (send navigation headers; Cloudflare only injects the beacon
  into navigation requests, so a bare `curl` returns no beacon and gives a false
  negative):
  ```
  curl -s --compressed \
    -H 'Accept: text/html' \
    -H 'Sec-Fetch-Mode: navigate' \
    -H 'Sec-Fetch-Dest: document' \
    https://marslabs.dev/ | rg -o 'cloudflareinsights\.com/beacon[^"'"'"']*'
  # expect: the beacon URL
  ```
  If the HTML is cached, wait for the TTL or purge the zone, then repeat.

## Search Console (SEO)

- **Source**: Google Search Console, **domain** property `marslabs.dev`, verified
  with a DNS `TXT` record (`google-site-verification`) added in Cloudflare.
- **Reach it**: `https://search.google.com/search-console` → `marslabs.dev`.
- **Answers**: queries, impressions, clicks, CTR and average position, plus URL
  inspection and the Core Web Vitals report.
- **Sitemap**: `https://marslabs.dev/sitemap-index.xml` — submitted, read by
  Google, 29 URLs.
- **Baseline (2026-09-25)**: the property was verified that day and Performance
  shows **no data yet**; Search Console backfills a property after verification
  (usually 1–3 days). Record the 28-day impressions / clicks / CTR / average
  position and the top queries here once data appears.

## Not yet in this runbook

- **Edge traffic, cache ratio, origin latency, top paths and tunnel health** —
  the Grafana **Mars Labs** dashboard in the homelab; added by ticket-008 and
  documented by ticket-011.
- **Build-time lab metrics** (pages, build time, HTML weight, lab CLS) — the home
  metrics, written by `scripts/update-stats.mjs`.
