---
id: ticket-007
plan: site-observability
repo: homelab
phase: 3
status: planned
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

## Scope

**In**

- Add `homelab/stacks/observability/cloudflare-exporter/compose.yaml`: a pinned
  Cloudflare analytics exporter image (`lablabs/cloudflare-exporter` or
  equivalent), configured from environment only, exposing Prometheus metrics on
  one port.
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
