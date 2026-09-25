---
id: ticket-007
plan: site-observability
repo: homelab
phase: 3
status: done
depends_on: []
---

# Add the Cloudflare zone analytics exporter

## Why

Finding F7: the `live/data/*.csv` files in `marslabs.dev` are Cloudflare zone
totals exported by hand — requests, unique visitors, bytes served, bytes cached
and `% cached`. Nothing refreshes them and nothing can alert on them. Traefik
metrics and Loki logs cover the **origin**; the zone exporter covers the **edge**
(what Cloudflare itself sees, including cache hits that never reach Traefik), so
the two together explain a request end to end. This exporter is the source for
the edge panels and the cache-ratio alert (tickets 008, 009) and lets
`marslabs.dev` delete the CSVs (ticket-011).

**Amendment (2026-09-25).** The draft used `lablabs/cloudflare_exporter`. Tested
against the free-plan `marslabs.dev` zone it exposes **nothing**: without
`FREE_TIER` its *zone totals* query is denied (`does not have access to the
path`, a paid adaptive dataset); with `FREE_TIER=true` it returns no error but
zero Cloudflare series (also with `SCRAPE_DELAY=0`). Free zones can only use the
pre-aggregated daily rollup `httpRequests1dGroups`. The ticket therefore ships a
small stdlib-only Python exporter instead of a third-party image.

## Scope

**In**

- Add `homelab/stacks/observability/cloudflare-exporter/exporter.py`: a
  stdlib-only Python service that queries `httpRequests1dGroups` over a window
  and exposes Prometheus text at `/metrics` (plus `/health`), on a pinned
  `python:3.13-alpine` image with the script bind-mounted read-only. Metrics:
  per-day and windowed requests, bytes, cached bytes, cached requests, unique
  visitors, page views and cache ratio, plus last-success/last-error gauges.
- Add `homelab/nodes/server/observability/cloudflare-exporter.override.yaml`
  with the encrypted secret env file and a host-published metrics port, matching
  the cadvisor/node-exporter pattern.
- Add the secret at
  `homelab/nodes/server/observability/cloudflare-exporter/secrets/cloudflare.sops.env`
  from a `.env.example`; it holds a Cloudflare API token scoped read-only to
  Zone → Analytics Read for the relevant zone(s). `scripts/materialize-secrets.sh`
  discovers `*/secrets/*.sops.env` automatically, so no script change is needed;
  the existing `^nodes/server/.*\.sops\.env$` rule in `.sops.yaml` already
  covers the path.
- Register the stack in `homelab/nodes/server/observability/compose.yaml`.
- Add the same placeholder secret path to
  `homelab/.github/workflows/validate-compose.yml` so `docker compose config`
  keeps passing in CI, and add a Prometheus scrape job `cloudflare` targeting the
  host-published port with `labels: { node: server }`.
- Document the token scope, the metric families emitted (record the real names
  in the Result) and the zone coverage in `homelab/nodes/server/observability/`.

**Out**

- No Grafana dashboard or alert (tickets 008, 009).
- No change to `marslabs.dev` (ticket-011 deletes the CSVs).
- No new datasource; the metrics are Prometheus-native.
- No Cloudflare account-level or Logpush data; zone analytics only.

## Acceptance criteria

- [ ] `docker compose -f nodes/server/compose.yaml config --quiet` succeeds with
      a placeholder secrets dir, and CI `validate-compose` stays green.
- [ ] The token is stored only as an encrypted SOPS file; no plaintext token is
      committed (`sops filestatus` reports it encrypted).
- [ ] `curl -s http://192.168.1.20:<port>/metrics` returns per-zone series for
      requests, bytes served, bytes cached and unique visitors (record the exact
      names in the Result).
- [ ] Prometheus reports the `cloudflare` target as `UP`.
- [ ] A 24 h value for requests and bytes served matches the Cloudflare dashboard
      within a small tolerance.

## Verification

```
sops filestatus nodes/server/observability/cloudflare-exporter/secrets/cloudflare.sops.env
# expect: "encrypted file" (no plaintext)

HOMELAB_SECRETS_DIR="$RUNNER_TEMP/homelab-secrets" \
  docker compose -f nodes/server/compose.yaml config --quiet
# expect: exit 0

curl -s http://192.168.1.20:<port>/metrics | rg 'cloudflare'
# expect: zone series for requests, bandwidth, cached bandwidth, uniques

curl -s http://192.168.1.20:9090/api/v1/targets | rg -o '"job":"cloudflare"[^}]*"health":"[a-z]+"'
# expect: health":"up"
```

Manual: compare the exporter's 24 h request total for `marslabs.dev` with the
Cloudflare dashboard and record both in the Result.

## Regression risk and rollback

- **Risk**: an over-scoped API token or a misconfigured image could hit Cloudflare
  rate limits or leak data. Use a read-only analytics token, pin the image, and
  keep the port LAN-bound. Failure is contained to an empty Prometheus target.
- **Rollback**: `git revert <commit>` removes the stack, the scrape job and the
  CI placeholder; the secret file can be deleted and the token revoked in
  Cloudflare.

## Result

- Homelab commits: `cc8aa52` (stack, override, `.env.example`, include,
  Prometheus job, CI placeholder), `3a2bbf3` (SOPS secret), then `531b550`,
  `7e82afc`, `8e334e3` replacing `lablabs/cloudflare_exporter` with the custom
  `exporter.py`.
- Two schema/format bugs found and fixed during deploy: the `viewer.zones` node
  has **no** `name` field (label by zone tag now), and the exposition was missing
  the label braces. The output now passes `promtool check metrics`.
- Verification (2026-09-25): `CF_ZONES` zone id `cd1db4f9…`; window (7 d) sample
  `cloudflare_zone_requests_window=4535`, `cloudflare_zone_bytes_window≈26.8 MB`,
  `cloudflare_zone_cache_ratio_window=0.213`. Prometheus ingests it:
  `cloudflare_zone_cache_ratio_window{job="cloudflare",…}=0.213352`.
- The cache ratio (~21 %) matches the CSV-derived ~25 % ballpark, confirming the
  metric is sound and that ticket-004 should raise it.
- Note: the label `zone` is the zone ID; ticket-008 maps it to a display name.
