---
title: "Homelab"
status: "personal"
tags: [infraestructura, homelab, docker, sops]
summary: "Infraestructura reproducible por Docker Compose + SOPS: 27 servicios en dos nodos, edge con Traefik y Cloudflare, SSO y observabilidad central."
year: 2026
featured: true
order: 2
---

Infraestructura reproducible por Docker Compose + SOPS: 27 servicios en dos
nodos, edge con Traefik y Cloudflare, SSO y observabilidad central.

## Cómo está montado

- **27 servicios** gestionados como código y verificados contra los hashes del
  modelo Compose.
- **Modelo en dos niveles**: cada servicio se define una vez como stack base y
  cada nodo aplica su override y sus secretos. El mismo servicio puede
  desplegarse distinto en cada nodo.
- **Edge**: traefik (proxy), pihole (DNS dividido: red local y el dominio del homelab),
  cloudflared (túnel Zero Trust) y authentik (SSO/OIDC).
- **Observabilidad central**: Prometheus + Loki + Grafana + alloy, que scrapean
  ambos nodos y la NAS por SNMPv3.
- **GPU real**: Immich con NVENC y CUDA en una GTX 970 (Maxwell), con la imagen
  de ML fijada.
- **CI**: Renovate self-hosted y validación de `docker compose config`.

## Secretos

Todo versionado con SOPS + age: los secretos viajan cifrados con el repo y las
claves privadas nunca se suben. En el despliegue se materializan en
`/run/homelab/secrets` con permisos restringidos.

## Despliegue

Preparar rutas, materializar secretos y levantar Compose: el despliegue de un
nodo se reduce a tres pasos reproducibles, sin estados escondidos.