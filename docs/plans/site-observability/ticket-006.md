---
id: ticket-006
plan: site-observability
repo: homelab
phase: 3
status: done
depends_on: []
---

# Expose and scrape cloudflared tunnel metrics

## Why

Finding F6: `cloudflared` runs with no metrics endpoint, so tunnel health is
invisible. Every public hostname enters through it
(`homelab/nodes/server/infra/README.md`), including `marslabs.dev`; if the tunnel
degrades, Grafana cannot tell the difference between "no traffic" and "tunnel
down". This ticket makes tunnel health a first-class metric and is a dependency
of the dashboard (ticket-008) and tunnel alert (ticket-009).

Note this is tunnel-internal telemetry (connection state, RTT to the Cloudflare
edge, request/error counters). It does **not** provide zone traffic or cache
analytics — that is ticket-007.

## Scope

**In**

- Give the tunnel a metrics endpoint in
  `homelab/stacks/infra/cloudflared/compose.yaml` by adding
  `--metrics 0.0.0.0:20241` to the `command`, keeping the existing
  `--no-autoupdate` and `run`.
- Publish the endpoint only on `server` via
  `homelab/nodes/server/infra/cloudflared.override.yaml`
  (`ports: ["20241:20241"]`, matching the host-published exporter pattern used by
  cadvisor/node-exporter).
- Add a Prometheus job `cloudflared` in
  `homelab/nodes/server/observability/prometheus/config/prometheus.yml` targeting
  `192.168.1.20:20241` with `labels: { node: server }`.
- Document the endpoint in `homelab/nodes/server/infra/README.md` (what it is,
  that it is read-only and LAN-bound).

**Out**

- No log pipeline change; container logs already reach Loki through alloy.
- No dashboard or alert (tickets 008, 009).
- No firewall change beyond publishing on the LAN; the homelab host is not
  internet-exposed except through the tunnel.
- No change to the tunnel token or Cloudflare-side configuration.

## Acceptance criteria

- [ ] `docker compose -f nodes/server/compose.yaml config --quiet` succeeds with
      a placeholder secrets dir.
- [ ] `cloudflared` starts and `curl -s http://192.168.1.20:20241/metrics`
      returns `cloudflared_*` series.
- [ ] Prometheus reports the `cloudflared` target as `UP`.
- [ ] The tunnel keeps serving `marslabs.dev` after the recreate (no regression).

## Verification

```
HOMELAB_SECRETS_DIR="$RUNNER_TEMP/homelab-secrets" \
  docker compose -f nodes/server/compose.yaml config --quiet
# expect: exit 0

curl -s http://192.168.1.20:20241/metrics | rg '^cloudflared_'
# expect: cloudflared metrics (e.g. connection state, request counters)

curl -s http://192.168.1.20:9090/api/v1/targets | rg -o '"job":"cloudflared"[^}]*"health":"[a-z]+"'
# expect: health":"up"

curl -sI https://marslabs.dev/ | head -1
# expect: HTTP/2 200 (tunnel still serving)
```

## Regression risk and rollback

- **Risk**: the metrics flag changes the `command`; a typo would stop the tunnel
  and take every public hostname down. The change is verified with
  `docker compose config` before recreate and with a `marslabs.dev` request
  after.
- **Rollback**: `git revert <commit>` and recreate the tunnel container; the
  Prometheus job becomes an empty target and is harmless.

## Result

- Homelab commit `9744ae7` (`cloudflared: exponer metricas Prometheus y
  scrapearlas`): added `--metrics 0.0.0.0:20241` in
  `stacks/infra/cloudflared/compose.yaml`, published `20241:20241` in
  `nodes/server/infra/cloudflared.override.yaml`, added the `cloudflared`
  Prometheus job, and documented the endpoint in `nodes/server/infra/README.md`.
- Discovery during deploy: the live tunnel is `server-cloudflared-1` (project
  `server`, from the repo). An old `cloudflared` container from a legacy
  `/home/mars/stacks/tunnel/compose.yml` is stopped — inspecting it by name first
  was misleading. The homelab-managed tunnel is the one that serves traffic.
- Verification (2026-09-25): `curl http://192.168.1.20:20241/metrics` returns
  `cloudflared_*` series; Prometheus target `job=cloudflared` is `health: up`;
  `https://marslabs.dev/` still returns `200`. Prometheus had to be recreated
  (`up -d --force-recreate prometheus`) because `git pull` replaced the bind-
  mounted `prometheus.yml` with a new inode and `/-/reload` read the stale file.
