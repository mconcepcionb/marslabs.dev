# Edge cache

Why `marslabs.dev` is cached the way it is, and how to reproduce the Cloudflare
side. Created by `docs/plans/site-observability/ticket-004`; the deploy-time
purge is ticket-005.

## Finding (2026-09-25)

- **HTML** (`/`) answered `cf-cache-status: DYNAMIC` with two `Cache-Control`
  headers (`max-age=3600` from nginx `expires`, plus
  `public, max-age=3600, must-revalidate`). Cloudflare does not cache HTML by
  default, so every document fell through to the origin.
- **Hashed assets** (`/_astro/*`) answered `public, max-age=31536000, immutable`
  and went `MISS` → `HIT`: they cache correctly.
- Result: the ~25% `% cached` in `live/data/*.csv` is driven by HTML misses and
  per-deploy asset churn, not by assets failing to cache.

## Origin headers (`nginx.conf`)

- HTML: `Cache-Control: public, max-age=300, s-maxage=300, must-revalidate`
  (short edge TTL; browser revalidates).
- `/_astro/`: `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`.
- `expires` was removed from both locations: combined with `add_header`, nginx
  emitted two `Cache-Control` headers.

## Required Cloudflare Cache Rule

Cloudflare does not cache HTML unless a rule allows it. In the dashboard
(`marslabs.dev` → Caching → Cache Rules → Create rule):

- **Name**: `MarsLabs Cache (Cache all, respect ttl)` (applied 2026-09-25)
- **When incoming requests match**:
  ```
  (http.host eq "marslabs.dev") or (http.host eq "www.marslabs.dev")
  ```
- **Settings**:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **Respect origin** (uses the `s-maxage` above)
  - Browser TTL: **Respect origin** (or "No override")
  - Cache Key: default

### Evidence it works

Before the `nginx.conf` change landed, a cache-buster on `/` already went
`MISS` → `HIT` with `Age: 2` once the rule was active, proving the rule caches
documents. The `nginx.conf` change only adjusts the TTL (`max-age=3600` →
`s-maxage=300`).

## Verification

```
# HTML: first MISS (or EXPIRED), second HIT with Age > 0
curl -sI https://marslabs.dev/ | grep -i 'cache-control\|cf-cache-status\|age:'
curl -sI https://marslabs.dev/ | grep -i 'cf-cache-status'

# Asset: HIT
curl -sI https://marslabs.dev/_astro/<hashed-asset> | grep -i 'cf-cache-status'
```

Expected: a single `Cache-Control` per response; HTML `HIT` after the rule is
applied and the new image is deployed.

## Rollback

Delete the Cache Rule in Cloudflare and purge the zone, then `git revert` the
`nginx.conf` change. The site keeps working without the rule; it simply stops
being cached at the edge.
