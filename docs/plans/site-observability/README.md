# Mars Labs site observability

Extend the site's self-measurement from build-time lab numbers to **field
truth**: real visitor traffic, real Core Web Vitals, edge cache efficiency and
origin health, surfaced in the homelab Grafana, with the manual CSV exports
retired.

- **Spec**: this plan. Origin: the analysis of `live/data/*.csv` (Cloudflare edge
  totals, 16–24 Sep 2026) plus the edge/observability topology.
- **Context**: [site self-measurement post](../../../src/content/blog/site-que-se-mide.md)
  (the claim this plan makes true), `homelab/README.MD` (edge and central
  observability model), `nginx.conf` (origin cache headers),
  [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) (build,
  publish and deploy), `homelab/nodes/server/observability/` (Prometheus, Loki,
  alloy, Grafana).
- **Repos**: this plan spans `marslabs.dev` (site) and the sibling `homelab`
  (infra / observability). Every ticket is single-repo; its `repo:` frontmatter
  says which.

## Why

The home page claims the site measures itself, and it does — but every number is
**lab data produced at build time**: pages built, HTML weight, CLS in a headless
run (`scripts/update-stats.mjs`). What is missing is what real visitors
experience and what the edge and origin actually do. The five CSVs under
`live/data/` are Cloudflare **edge** totals exported by hand — requests, unique
visitors, bytes served, bytes cached, `% cached` — over nine days, with no page
paths, no RUM, no origin health. Edge metrics alone cannot show performance:
Cloudflare terminates TLS and caches, so a cache hit hides the origin and a miss
is invisible.

Findings this plan closes:

| Id  | Finding                                                                                          |
| --- | ------------------------------------------------------------------------------------------------ |
| F1  | Measurement is lab-only; there is no field / RUM (Core Web Vitals) data.                          |
| F2  | Usage has no dimension — zone totals only, no path, referrer, country or device.                  |
| F3  | `% cached` averages ~25% on a fully static site; HTML is not being cached at the edge.            |
| F4  | Origin health (latency, 4xx/5xx by path) is unobserved for `marslabs`, though Traefik exposes it.  |
| F5  | Traefik access logs and container logs already reach Loki, Traefik metrics reach Prometheus, but no `marslabs` dashboard exists. |
| F6  | `cloudflared` exposes no metrics; tunnel health is invisible.                                     |
| F7  | Cloudflare zone analytics are hand-exported instead of scraped.                                    |
| F8  | No sitemap or robots.txt and no Search Console baseline, despite ranking #2 for the target query.  |

## Non-goals

- **No self-hosted analytics product.** No Umami, Plausible or Matomo; Cloudflare
  Web Analytics + Traefik logs in Loki are enough.
- **No consent / cookie banner work.** The chosen tools are cookieless and
  aggregate; no personal data is stored.
- **No new alert channels.** Alert rules reuse the existing Grafana notification
  setup; no paging, email or chat integration is built here.
- **No site redesign, content or SEO copywriting.** Only measurement plumbing.
- **No change to the Cloudflare Tunnel exposure model.** `*.fotingo12.com` stays
  as documented; `marslabs.dev` stays public through the same tunnel.
- **No new homelab service beyond the one metrics exporter** in ticket-007.
- **No historical backfill.** Metrics start when each pipeline lands; the 9-day
  CSV window is preserved as a snapshot in the runbook, not imported.

## Cross-repo delivery

Process: [docs/plans/README.md](../README.md); templates:
[docs/plans/TEMPLATE.md](../TEMPLATE.md).

The plan and its ticket index live here, in `marslabs.dev`. Each ticket declares
`repo:` in its frontmatter and lands as **exactly one commit in that repo**.
Because the plan home and the work can be in different repositories, a
`repo: homelab` ticket updates its `status:` here in a follow-up docs commit
(`docs: mark ticket-00N done (ticket-00N)`); the ticket body, acceptance criteria
and verification are unchanged. If strict single-repo planning is later
preferred, mirror this plan under `homelab/docs/plans/site-observability/` and
drop the cross-repo note.

## Amendments

- **2026-09-25 — ticket-013 added.** While verifying ticket-004, `pnpm build`
  failed: `scripts/update-stats.mjs` only parses build times in seconds, and
  Astro prints `949ms` once a build drops under one second. This blocks the gate,
  so ticket-013 fixes the parser and ticket-004 depends on it.
- **2026-09-25 — ticket-001 mechanism.** The draft added a committed Cloudflare
  Web Analytics beacon (`src/consts.ts` + `src/layouts/Layout.astro`). The
  operator chose Cloudflare **automatic setup** instead, so the ticket now
  enables and documents the dashboard-managed beacon rather than adding code; it
  creates `docs/runbooks/site-analytics.md`, which is why ticket-003 now depends
  on it. Additive and reversible: a later ticket can move back to a committed
  beacon if version control is wanted.

## Phases

| Phase | Name                            | Tickets    | Release tag |
| ----- | ------------------------------- | ---------- | ----------- |
| 1     | Field measurement               | 001 .. 003 | v0.1.0      |
| 2     | Edge efficiency and deploy      | 004, 005, 013 | v0.2.0   |
| 3     | Central observability (homelab) | 006 .. 009 | v0.3.0      |
| 4     | Regression guard and close      | 010 .. 012 | v0.4.0      |

## Tickets

| Id         | Title                                                   | Repo        | Phase | Finding  | Depends on               | Status  |
| ---------- | ------------------------------------------------------- | ----------- | ----- | -------- | ------------------------ | ------- |
| ticket-001 | Add field analytics and RUM to the site                 | marslabs.dev | 1    | F1, F2   | -                        | done    |
| ticket-002 | Add sitemap, robots and canonical URLs                  | marslabs.dev | 1    | F8       | -                        | done    |
| ticket-003 | Verify Search Console and record the SEO baseline       | marslabs.dev | 1    | F8       | ticket-001, ticket-002   | planned |
| ticket-004 | Make the edge cache HTML                                | marslabs.dev | 2    | F3       | ticket-013               | planned |
| ticket-005 | Purge the edge cache on deploy                          | marslabs.dev | 2    | F3       | ticket-004               | planned |
| ticket-006 | Expose and scrape cloudflared tunnel metrics            | homelab     | 3    | F6       | -                        | planned |
| ticket-007 | Add the Cloudflare zone analytics exporter              | homelab     | 3    | F7       | -                        | planned |
| ticket-008 | Provision the Mars Labs dashboard                       | homelab     | 3    | F4, F5   | ticket-006, ticket-007   | planned |
| ticket-009 | Alert on Mars Labs health                               | homelab     | 3    | F4       | ticket-008               | planned |
| ticket-010 | Gate the build on a performance budget                  | marslabs.dev | 4    | F1       | ticket-001               | planned |
| ticket-011 | Retire the manual CSV exports and document the pipeline | marslabs.dev | 4    | F7       | ticket-003, ticket-008   | planned |
| ticket-012 | Close the plan                                          | marslabs.dev | 4    | -        | ticket-011               | planned |
| ticket-013 | Parse sub-second build times in the stats script        | marslabs.dev | 2    | -        | -                        | planned |

## Risk

The riskiest tickets are ticket-004 and ticket-005: caching HTML at the edge can
serve stale content, and the mitigation (a purge on deploy) moves work into CI
where a broken token breaks the pipeline. Both are reversible with a Cloudflare
cache purge and `git revert`. The homelab tickets change the shared
observability stack — a bad Prometheus job or Grafana JSON can blank a dashboard
but not the site — so each is verified with `docker compose config` before
deploy and with a live scrape after. No ticket lowers an existing threshold or
touches the site's content. The site-side gate is
`pnpm lint && pnpm typecheck && pnpm build`; the homelab-side gate is
`docker compose -f nodes/<node>/compose.yaml config --quiet` with a placeholder
secrets directory. Both must be green before a phase closes.

## End state

When the plan is done:

- The site has Cloudflare Web Analytics enabled (automatic setup) and a canonical
  sitemap; Search Console shows the query/impression/CTR/position baseline.
- Cloudflare caches HTML and static assets with an evidence-backed rule, the
  cache ratio is materially higher, and every deploy purges the edge.
- Grafana (homelab) has a **Mars Labs** dashboard with edge traffic and cache
  ratio, Traefik latency and error rates, top paths and status codes from Loki,
  and cloudflared tunnel health.
- Alerts fire on origin down, 5xx spikes, tunnel down and a sustained cache-ratio
  drop.
- `live/data/*.csv` is gone; `live/` is ignored; `docs/runbooks/site-analytics.md`
  is the single map from question to source.
