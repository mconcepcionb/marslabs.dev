---
id: ticket-009
plan: site-observability
repo: homelab
phase: 3
status: planned
depends_on: [ticket-008]
---

# Alert on Mars Labs health

## Why

Finding F4: the dashboard makes the site observable but nobody watches a
dashboard. A stale HTML deploy, an origin container that will not start, a 5xx
spike or a dead tunnel should surface without a human opening Grafana. The
observability stack already runs Grafana alerting (the provisioning directory
exists but is empty), so the rules belong there, not in a new tool.

## Scope

**In**

- Add Grafana file-provisioned alert rules under
  `homelab/nodes/server/observability/grafana/config/provisioning/alerting/`
  (rule groups referencing the `prometheus`/`loki` datasource uids), covering:
  - **Origin down** — the `marslabs` container/target is absent or the site
    returns no successful origin requests for a sustained window.
  - **5xx spike** — origin 5xx rate above a threshold for longer than a short
    evaluation window.
  - **Tunnel down** — cloudflared reports no active connection / a failed state.
  - **Cache ratio drop** — `% cached` below a floor for 24 h (guards ticket-004).
- Set explicit, conservative `for` durations so single scrapes and brief blips
  do not fire.
- Document each rule (what it means, the threshold, the first response step) in
  `homelab/nodes/server/observability/grafana/README.md`.

**Out**

- No new contact points or notification channels; rules reuse the existing
  Grafana notification setup. Rule **state** is the acceptance target here, not
  delivery.
- No paging (no PagerDuty / SMS), no chat bot.
- No alerts on SEO or Core Web Vitals.
- No change to the site or the exporters.

## Acceptance criteria

- [ ] The alerting provisioning files are valid and Grafana loads them on
      reload (rules visible under Alerting → Alert rules).
- [ ] Each rule moves to `Firing` under a synthetic fault and back to `Normal`
      when the fault clears.
- [ ] Thresholds and `for` durations are recorded in the Grafana README.
- [ ] The rules reference only the `prometheus` and `loki` datasource uids.

## Verification

```
ls nodes/server/observability/grafana/config/provisioning/alerting/
# expect: at least one rules file (no longer only .gitkeep)

HOMELAB_SECRETS_DIR="$RUNNER_TEMP/homelab-secrets" \
  docker compose -f nodes/server/compose.yaml config --quiet
# expect: exit 0
```

Manual synthetic tests (record state transitions in the Result):
`docker stop marslabs` → **Origin down** Firing; `docker start marslabs` →
Normal. Tunnel test only if a safe window exists; otherwise assert the query
returns the expected series in Grafana's alert preview.

## Regression risk and rollback

- **Risk**: noisy or badly-scoped rules train the operator to ignore alerts;
  conservative `for` windows and single-site selectors guard against this.
  A malformed rules file is skipped by provisioning and breaks nothing else.
- **Rollback**: `git revert <commit>` removes the rules; Grafana de-provisions
  them on the next reload.
