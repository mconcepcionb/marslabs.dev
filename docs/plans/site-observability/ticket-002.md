---
id: ticket-002
plan: site-observability
repo: marslabs.dev
phase: 1
status: done
depends_on: []
---

# Add sitemap, robots and canonical URLs

## Why

Finding F8: the site ranks #2 for its target query but has no `sitemap.xml` and
no `robots.txt`, and `astro.config.mjs` sets no `site`, so Astro emits no
canonical URL and the build has no absolute origin to build one from. Search
Console cannot be pointed at a sitemap (ticket-003) and crawlers have no explicit
guidance. This is prerequisite plumbing for SEO measurement, not an SEO change.

## Scope

**In**

- Set `site: 'https://marslabs.dev'` in `astro.config.mjs`.
- Add `@astrojs/sitemap` to the Astro integrations (pinned in `package.json` and
  `pnpm-lock.yaml`) so the build emits `sitemap-index.xml` + `sitemap-0.xml`.
- Add `public/robots.txt` with a `Sitemap:` line pointing at
  `https://marslabs.dev/sitemap-index.xml` and a permissive default.
- Add a canonical `<link rel="canonical">` to `src/layouts/Layout.astro` derived
  from `Astro.site` + `Astro.url.pathname` so every page declares one.

**Out**

- No structured data (JSON-LD), OpenGraph or Twitter card work.
- No content, copy or route changes.
- No Search Console work (ticket-003).
- No `www` / apex redirect policy beyond what Cloudflare/Traefik already do.

## Acceptance criteria

- [ ] `dist/sitemap-index.xml` exists and references `dist/sitemap-0.xml`.
- [ ] `sitemap-0.xml` contains one `<loc>` per generated page, all absolute
      `https://marslabs.dev/...` URLs.
- [ ] `dist/robots.txt` exists and points at the sitemap index.
- [ ] Every generated page has exactly one canonical link matching its own URL.
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` are green.

## Verification

```
pnpm build
# expect: green

test -f dist/sitemap-index.xml && test -f dist/sitemap-0.xml && test -f dist/robots.txt
# expect: exit 0

rg -c '<loc>' dist/sitemap-0.xml
# expect: equal to the page count reported by the build (minus any intentionally excluded route)

rg -c 'rel="canonical"' dist/index.html
# expect: 1

pnpm lint && pnpm typecheck
# expect: no diagnostics
```

## Regression risk and rollback

- **Risk**: the sitemap integration can silently exclude routes; the `<loc>`
  count assertion catches it. A wrong `site` value would emit wrong canonical
  URLs, so the verification reads the value back from `dist/`.
- **Rollback**: `git revert <commit>` removes the integration, `public/robots.txt`
  and the canonical tag; the build returns to its current output.

## Result

- `astro.config.mjs`: set `site: 'https://marslabs.dev'` and added
  `@astrojs/sitemap` (`3.7.4`) to the integrations.
- `public/robots.txt`: `Allow: /` plus `Sitemap: https://marslabs.dev/sitemap-index.xml`.
- `src/layouts/Layout.astro`: canonical link derived from
  `Astro.url.pathname` + `Astro.site`.
- Verification: `pnpm lint`, `pnpm typecheck` and `pnpm build` green; build
  reported 29 pages. `dist/sitemap-index.xml` references `dist/sitemap-0.xml`,
  `sitemap-0.xml` has 29 `<loc>` entries (one per page), `dist/robots.txt`
  present, and `dist/index.html` has exactly one canonical —
  `https://marslabs.dev/`.
- Note: the build also rewrote the auto-generated metrics under
  `src/content/metrics/` and `src/content/projects/marslabs-dev.md` (the
  committed values were stale: 16 → 29 pages). Those files are unrelated to this
  ticket and were reverted, so the commit stays atomic; the drift should get its
  own commit.
