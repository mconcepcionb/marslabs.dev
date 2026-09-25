---
id: ticket-003
plan: site-observability
repo: marslabs.dev
phase: 1
status: planned
depends_on: [ticket-002]
---

# Verify Search Console and record the SEO baseline

## Why

Finding F8: the site reportedly ranks second for a query, but there is no way to
see impressions, click-through rate, average position or which queries actually
bring traffic. Search Console is the only free source for that, and it needs a
verified property and a submitted sitemap (ticket-002). Without a recorded
baseline, later changes cannot be judged.

## Scope

**In**

- Verify the `marslabs.dev` property in Google Search Console using a DNS `TXT`
  record added through Cloudflare (do not add a verification meta tag; DNS keeps
  it out of the code path).
- Submit `https://marslabs.dev/sitemap-index.xml` and confirm the status is
  `Success`.
- Record the baseline as of the day of the ticket in
  `docs/runbooks/site-analytics.md`, created here with: property, verification
  method, sitemap URL and status, and a table of the last 28 days — impressions,
  clicks, CTR, average position, and the top queries and pages (including the
  target query and its position).
- Note the URL inspection result for the home page (indexed / canonical chosen).

**Out**

- No paid SEO tooling, no backlink or competitor analysis.
- No content or copy changes based on the baseline; this ticket only records.
- No Bing / other engine verification.
- No alerting on SEO metrics.

## Acceptance criteria

- [ ] `dig +short TXT marslabs.dev` shows the `google-site-verification` record.
- [ ] Search Console reports the sitemap as `Success` with a discovered-URL
      count consistent with the build.
- [ ] `docs/runbooks/site-analytics.md` exists and contains a dated baseline
      table with impressions, clicks, CTR, average position and top queries /
      pages.
- [ ] The target query and its position are recorded explicitly.

## Verification

```
dig +short TXT marslabs.dev
# expect: the google-site-verification value is present

test -f docs/runbooks/site-analytics.md
# expect: exit 0
```

Manual (evidence recorded in the runbook): Search Console → Sitemaps shows
`Success`; Performance → last 28 days shows non-zero impressions for the target
query, pasted as a table into the runbook.

## Regression risk and rollback

- **Risk**: a DNS `TXT` record at the apex can conflict with existing records;
  add it alongside, never replace. Removing it later would un-verify the
  property.
- **Rollback**: remove the `TXT` record in Cloudflare and delete the baseline
  section; no site code or build output changes.
