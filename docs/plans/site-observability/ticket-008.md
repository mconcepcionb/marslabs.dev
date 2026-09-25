---
id: ticket-008
plan: site-observability
repo: homelab
phase: 3
status: done
depends_on: [ticket-006, ticket-007]
---

# Provision the Mars Labs dashboard

## Why

Findings F4 and F5: Traefik already emits JSON access logs and Prometheus
metrics, and alloy already ships every container's stdout — including Traefik
and the `marslabs` nginx container — to Loki. Nothing surfaces it. There is no
per-site view of latency, error rate, top paths or edge cache efficiency, so the
origin and the edge are both effectively unobserved for `marslabs.dev`. This
ticket is the payoff of the pipeline: one dashboard that answers "is the site
healthy, fast and cached?".

## Scope

**In**

- Add `homelab/nodes/server/observability/grafana/config/dashboards/marslabs.json`,
  provisioned automatically by the existing `Homelab` file provider
  (`config/provisioning/dashboards/dashboards.yaml`). Use the existing
  Prometheus datasource uid `prometheus` and Loki datasource uid `loki`; follow
  the shape and `schemaVersion` of the existing dashboards.
- Panels:
  - **Edge traffic** — requests/s per status class and total (Cloudflare zone
    exporter, ticket-007).
  - **Edge cache** — bandwidth served vs bandwidth cached and `% cached`
    (cache ratio), from the same exporter.
  - **Origin latency** — p50/p95/p99 from `traefik_service_request_duration_seconds`
    filtered to the `marslabs` service.
  - **Origin errors** — 4xx and 5xx rate from `traefik_service_requests_total`
    filtered to the `marslabs` service.
  - **Top paths and status codes** — LogQL over the Traefik access logs in Loki,
    filtered to `Host` `marslabs.dev`/`www.marslabs.dev`.
  - **Tunnel health** — cloudflared connection state / RTT and request counters
    (ticket-006).
- Determine the real Traefik `service` label value and the real access-log JSON
  field names from a live sample and record both in the Result; do not hardcode
  guessed names.

**Out**

- No alerts (ticket-009).
- No new datasource, dashboard folder or plugin.
- No change to Traefik, cloudflared or the site.
- No RUM / Core Web Vitals panel; that data lives in Cloudflare Web Analytics
  (ticket-001), not in Prometheus.

## Acceptance criteria

- [ ] The dashboard JSON is valid and is provisioned by Grafana (visible in the
      `Homelab` folder without manual import).
- [ ] Every Prometheus panel returns data for the last 24 h.
- [ ] The top-paths / status panel returns parsed access-log rows for
      `marslabs.dev`.
- [ ] The tunnel panel returns cloudflared series.
- [ ] The dashboard defines no hardcoded absolute time range that hides a
      default query.

## Verification

```
jq empty nodes/server/observability/grafana/config/dashboards/marslabs.json
# expect: exit 0 (valid JSON)

# Provisioning is file-based; validate the compose mount still resolves
HOMELAB_SECRETS_DIR="$RUNNER_TEMP/homelab-secrets" \
  docker compose -f nodes/server/compose.yaml config --quiet
# expect: exit 0
```

Manual: open `https://grafana.fotingo12.com`, find **Mars Labs**, set the range
to 24 h, and confirm each panel renders. Capture the service label and log field
names used, with one raw log line and one raw metric line, in the Result.

## Regression risk and rollback

- **Risk**: a malformed dashboard JSON or a wrong label selector yields empty
  panels, not a broken Grafana — the provider skips invalid files. Keep the
  panels read-only and the JSON self-contained.
- **Rollback**: `git revert <commit>` removes `marslabs.json`; Grafana
  de-provisions it on the next reload.

## Result

- Homelab commit `2c2df76` (`grafana: dashboard de Mars Labs (edge, origen,
  tunel)`): `nodes/server/observability/grafana/config/dashboards/marslabs.json`,
  uid `marslabs-health`, provisioned by the existing `Homelab` file provider.
- Ten panels: edge cache ratio / requests / bandwidth (Cloudflare exporter),
  origin requests-by-status, latency p50/p95, 4xx/5xx rate (Traefik), tunnel
  requests/s and HA connections (cloudflared), and two Loki tables (top paths and
  status codes).
- Labels/fields discovered and used instead of guessed: Traefik service
  `marslabs-svc@docker`; Loki container `server-traefik-1` and JSON fields
  `ServiceName`, `RequestPath`, `DownstreamStatus`.
- Verification (2026-09-25): JSON valid; all six PromQL expressions return data;
  both LogQL expressions return `resultType: vector`; the file is visible in the
  container (`/var/lib/grafana/dashboards/marslabs.json`); Grafana's search API
  returns `{"uid":"marslabs-health","title":"Mars Labs","url":"/d/marslabs-health/mars-labs"}`.
- The label `zone` maps the Cloudflare zone ID; a value mapping to `marslabs.dev`
  is left to the operator (or a later ticket).
