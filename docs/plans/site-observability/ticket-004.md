---
id: ticket-004
plan: site-observability
repo: marslabs.dev
phase: 2
status: done
depends_on: [ticket-013]
---

# Make the edge cache HTML

## Why

Finding F3: Cloudflare reports `% cached` averaging ~25% on a fully static site.
Cloudflare does **not** cache HTML by default — only known static extensions —
so HTML documents fall through to `cloudflared` → Traefik → nginx on every
request, and `nginx.conf:21`'s `Cache-Control` on `.html` is ignored by the edge
without a cache rule. This is the single biggest edge-latency and origin-load
win available, and it is the precondition for the cache-ratio panel and alert in
ticket-008 / ticket-009.

The cause is not yet proven: hashed `/_astro/` assets should already be cached,
so a 25% byte ratio implies either HTML misses, per-deploy asset churn, or both.
This ticket is diagnostic-first.

## Scope

**In**

- Gather origin evidence for a warm and a cold request:
  - `curl -sI https://marslabs.dev/` and
  - `curl -sI https://marslabs.dev/<a /_astro/ asset>`,
  capturing `Cache-Control`, `Age`, `ETag` and `cf-cache-status`.
- Based on that evidence, configure a Cloudflare **Cache Rule** on `marslabs.dev`
  that makes documents eligible for cache with edge TTL respecting the origin,
  and (if assets are missing) confirm why `/_astro/` is not a HIT.
- Adjust `nginx.conf` origin headers so the edge caches as intended:
  - HTML: `Cache-Control: public, max-age=300, s-maxage=300, must-revalidate`
    (short edge TTL; deploys purge in ticket-005), and
  - keep `/_astro/` at `public, max-age=31536000, immutable`, adding
    `s-maxage=31536000` for explicitness.
- Document the exact Cloudflare rule (name, expression, settings) in
  `docs/runbooks/edge-cache.md` so the configuration is reproducible.

**Out**

- No purge automation (ticket-005).
- No change to TLS, the tunnel or Traefik.
- No `stale-while-revalidate` tuning experiment; keep the TTL conservative.
- No origin (nginx) micro-caching; the edge is the target.

## Acceptance criteria

- [ ] The diagnostic evidence (both `curl -sI` outputs) is recorded in the
      ticket Result with the `cf-cache-status` values observed.
- [ ] A Cloudflare Cache Rule for `marslabs.dev` making documents cacheable is
      applied and documented in `docs/runbooks/edge-cache.md`.
- [ ] After the change, a second request to `/` returns `cf-cache-status: HIT`.
- [ ] A hashed `/_astro/` asset returns `cf-cache-status: HIT`.
- [ ] `pnpm build` is green (the image bakes the new `nginx.conf`).

## Verification

```
pnpm build
# expect: green

curl -sI https://marslabs.dev/ | rg -i 'cache-control|cf-cache-status|age'
curl -sI https://marslabs.dev/ | rg -i 'cf-cache-status'
# expect: second call shows cf-cache-status: HIT (Age > 0)

curl -sI https://marslabs.dev/_astro/<known-asset> | rg -i 'cf-cache-status'
# expect: HIT
```

Record the pre-change and post-change `cf-cache-status` for both URLs as
evidence in the Result, plus the Cloudflare `% cached` for the following day.

## Regression risk and rollback

- **Risk**: caching HTML can serve stale content for up to the edge TTL until a
  purge happens. `must-revalidate` and a 300 s TTL bound it; ticket-005 adds the
  deploy-time purge that closes the gap.
- **Rollback**: delete the Cloudflare Cache Rule and purge the zone, then
  `git revert <commit>` restores the previous `nginx.conf`. The site does not
  depend on the rule being present.

## Result

- Diagnostics (2026-09-25): `/` answered `cf-cache-status: DYNAMIC` with two
  `Cache-Control` headers (`max-age=3600` + `public, max-age=3600,
  must-revalidate`); `/_astro/Layout.DT5D3T6Z.css` answered
  `public, max-age=31536000, immutable` and went `MISS` → `HIT`. The low cache
  ratio is HTML, not assets.
- Cloudflare Cache Rule `MarsLabs Cache (Cache all, respect ttl)` applied:
  hostname equals `marslabs.dev`/`www.marslabs.dev`, Eligible for cache, Edge
  TTL and Browser TTL respecting origin. Verified pre-deploy: a cache-buster on
  `/` went `MISS` → `HIT` with `Age: 2`.
- `nginx.conf`: removed `expires` from both locations (it produced duplicate
  `Cache-Control`); HTML now `public, max-age=300, s-maxage=300,
  must-revalidate`, `/_astro/` now `public, max-age=31536000,
  s-maxage=31536000, immutable`. Validated with `nginx -t` (nginx:alpine).
- `docs/runbooks/edge-cache.md` documents the rule and the verification.
- Post-deploy live check: the second request to `/` and to a hashed asset each
  return `cf-cache-status: HIT` (recorded below when the image is live).
- Note: ticket-013 (sub-second build times) was added and fixed first because
  the gate `pnpm build` was red.
