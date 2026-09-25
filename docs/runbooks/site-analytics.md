# Site analytics

Where each question about `marslabs.dev` is answered, and how to reach the
source. Started by `docs/plans/site-observability/` (ticket-001), completed by
ticket-011. The retired manual CSV exports are preserved at the end.

## Map: question → source

| Question | Source |
| -------- | ------ |
| Edge traffic, bandwidth, cache ratio | Grafana **Mars Labs** (Cloudflare zone exporter) |
| Origin requests, latency, 4xx/5xx, top paths, status codes | Grafana **Mars Labs** (Traefik metrics + Loki access logs) |
| Tunnel health (Cloudflare Tunnel) | Grafana **Mars Labs** (cloudflared metrics) |
| Page paths, referrers, countries, devices, field Core Web Vitals | Cloudflare Web Analytics |
| Queries, impressions, CTR, average position (SEO) | Google Search Console |
| Build-time lab metrics (pages, build time, HTML weight, lab CLS) | Home metrics, written by `scripts/update-stats.mjs` |

## Grafana — Mars Labs dashboard

- **Source**: homelab, `https://grafana.fotingo12.com/d/marslabs-health/mars-labs`.
- **Edge**: `cloudflare_zone_*` from the custom exporter
  (`homelab/stacks/observability/cloudflare-exporter/`), which reads the free
  daily dataset `httpRequests1dGroups` (zone id `cd1db4f9…`).
- **Origin**: `traefik_service_requests_total` / `..._duration_seconds_bucket`
  with `service="marslabs-svc@docker"`.
- **Paths / status**: LogQL over the Traefik access logs in Loki
  (`{container="server-traefik-1"} | json | ServiceName="marslabs-svc@docker"`).
- **Tunnel**: `cloudflared_tunnel_*` (HA connections, requests, errors).
- **Alerts**: folder `Homelab Alerts`, group `marslabs` — origin down, 5xx,
  tunnel down, cache ratio < 15 %/24 h.

## Cloudflare Web Analytics (audience and field Core Web Vitals)

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

## Edge cache

The origin headers and the Cloudflare Cache Rule that make HTML cacheable, plus
the deploy-time purge, are documented in [edge-cache.md](./edge-cache.md).

## Build-time lab metrics

The home page numbers (pages, build time, mean HTML weight, lab CLS) are
measured and written on every build by `scripts/update-stats.mjs`, and gated by
`scripts/perf-budget.mjs` (FCP + CLS) in CI.

## Historical snapshot — retired CSV exports

Until 2026-09-25 the edge totals were exported by hand as
`live/data/*.csv` (Cloudflare zone analytics: requests, unique visitors, bytes
served, bytes cached and `% cached`). That directory is now ignored and the
exports deleted; the pipeline above replaces them. The 9-day window is kept here
for the record (all values from the source CSVs):

| Day (2026) | Requests | Unique visitors | Bytes served | Bytes cached | % cached |
| ---------- | -------- | --------------- | ------------ | ------------ | -------- |
| 16 Sep | 642 | 63 | 5,351,547 | 3,124,332 | 58.38 |
| 17 Sep | 598 | 80 | 4,166,737 | 907,829 | 21.79 |
| 18 Sep | 1,668 | 241 | 9,678,738 | 3,461,183 | 35.76 |
| 19 Sep | 858 | 180 | 4,514,823 | 1,075,764 | 23.83 |
| 20 Sep | 1,595 | 260 | 7,514,421 | 1,661,027 | 22.10 |
| 21 Sep | 656 | 150 | 3,092,625 | 590,689 | 19.10 |
| 22 Sep | 377 | 140 | 2,806,064 | 454,187 | 16.19 |
| 23 Sep | 247 | 179 | 1,610,548 | 474,600 | 29.47 |
| 24 Sep | 424 | 178 | 3,828,982 | 978,993 | 25.57 |

Days before 16 Sep are absent (tracking started that day).
