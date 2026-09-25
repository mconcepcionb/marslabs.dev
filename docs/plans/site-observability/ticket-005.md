---
id: ticket-005
plan: site-observability
repo: marslabs.dev
phase: 2
status: planned
depends_on: [ticket-004]
---

# Purge the edge cache on deploy

## Why

Finding F3, follow-on: once ticket-004 makes HTML cacheable at the edge, a new
deploy no longer reaches visitors until the edge TTL expires. The image is
pulled and recreated by the homelab (`homelab/stacks/applications/marslabs/compose.yaml`),
while the site's CI (`.github/workflows/ci.yml`) publishes the image, so the
purge must not depend on the site knowing when the homelab pulled. Purging right
after a successful publish is the simple, correct-enough point: the homelab
recreate follows quickly, and the short 300 s TTL bounds any remaining window.

## Scope

**In**

- Add a CI step to `.github/workflows/ci.yml`, after the image is pushed and only
  on `main`, that calls the Cloudflare purge endpoint:
  `POST https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache`
  with `{"purge_everything":true}`.
- Authenticate with a repository secret `CLOUDFLARE_API_TOKEN` scoped to
  Zone → Cache Purge for `marslabs.dev`, and a repository variable
  `CLOUDFLARE_ZONE_ID` (not secret). Document both in the workflow with a
  comment and in `docs/runbooks/edge-cache.md`.
- Fail the job with the API response visible when the purge returns non-2xx, so
  a stale cache is never silent.

**Out**

- No tag/hash-based incremental purge; `purge_everything` is small and correct
  for a site this size.
- No homelab-side change; the homelab only pulls and recreates.
- No purge on pull requests (publishing is `main`-only already).
- No change to the site image build.

## Acceptance criteria

- [ ] On a `main` push, the workflow reaches the purge step and the Cloudflare
      API returns `{"success":true}`.
- [ ] The purge step is skipped on pull requests and on non-`main` refs.
- [ ] The workflow exposes the raw API response on failure.
- [ ] `CLOUDFLARE_API_TOKEN` is a repository secret and `CLOUDFLARE_ZONE_ID` a
      variable; neither is ever committed.
- [ ] After a deploy, `curl -sI https://marslabs.dev/` returns the new
      `ETag`/content immediately (no stale HTML).

## Verification

```
# Local syntax/lint of the workflow (actionlint if available, else YAML parse)
node -e "require('node:fs').readFileSync('.github/workflows/ci.yml')"
# expect: no throw

git grep -n 'purge_everything' .github/workflows/ci.yml
# expect: one hit, guarded by github.ref == 'refs/heads/main'
```

Manual: push a trivial `main` change, watch the workflow succeed, and confirm
the home page reflects the change within one request. Record the workflow run
URL and the Cloudflare `success:true` in the Result.

## Regression risk and rollback

- **Risk**: a broken or over-scoped token can fail the pipeline or purge more
  than intended. Scope the token to `marslabs.dev` cache purge only; the step
  runs after the image is already pushed, so a purge failure does not lose a
  build.
- **Rollback**: `git revert <commit>` removes the step; ticket-004's short TTL
  still limits staleness, and the cache can be purged by hand.
