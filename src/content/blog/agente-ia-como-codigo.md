---
title: "Un agente de IA desplegado como código"
summary: "Un agente de IA desplegado como cualquier servicio: un stack base, tres perfiles con extends, secretos SOPS por nodo y cero puertos al host."
date: 2026-09-16
tags: [ia, docker, sops, homelab]
---

El agente de IA de mi homelab no se configura a mano. Es un servicio más del
repo, definido como código, con el mismo método que el resto: definición base
reutilizable, override por nodo y secretos cifrados. Y se despliega en tres
perfiles a partir de una sola definición.

## Una definición, tres instancias

El stack base define el servicio una vez. Cada perfil lo hereda con `extends`
y solo añade lo suyo (el nombre de perfil es un ejemplo):

```yaml
hermes-<perfil>:
  extends:
    file: ../../../../stacks/applications/hermes-agent/compose.yaml
    service: hermes-agent
```

Tres perfiles aislados, una imagen y cero duplicación. Si cambia algo en el
stack base, cambia en los tres.

## La memoria es una ruta

La memoria de cada perfil es un directorio en el host. No lo crea el
contenedor al arrancar: lo declara un archivo de tmpfiles con propietario
fijo.

```
d /srv/homelab/hermes/<perfil>  0750  10000  10000  -
```

El usuario y grupo son el 10000. Y el montaje tiene una regla estricta:

```yaml
volumes:
  - type: bind
    source: /srv/homelab/hermes/<perfil>
    target: /opt/data
    bind:
      create_host_path: false
```

Si la ruta no existe, el contenedor falla al arrancar en vez de crearla él
mismo. No hay estados que se materializan por arte de magia: si no está
preparado, no arranca.

## Cero puertos al host

El agente no publica ningún puerto en el nodo. El tráfico entra por Traefik,
con un label por perfil:

```yaml
- traefik.http.routers.hermes-<perfil>.rule=Host(`hermes-<perfil>.fotingo12.com`)
- traefik.http.services.hermes-<perfil>.loadbalancer.server.port=9119
```

El puerto 9119 es el del dashboard, pero vive dentro de la red del proxy. El
servidor de API escucha en el 8642 y ni siquiera se expone. Desde fuera no hay
nada que tocar: solo los hostnames que el proxy conoce.

## Secretos por nodo

Las credenciales viajan cifradas con SOPS y age, en el propio repo. Cada nodo
tiene su regla de cifrado con dos destinatarios: el de administración y el del
nodo. En el despliegue se descifran en `/run/homelab/secrets` con permisos
restringidos. El texto plano solo existe donde debe existir.

## Lo que aún falta

Este despliegue no está acabado, y no lo presento como tal. La imagen se fija
por tag fechado (`v2026.9.7`), no por digest, así que la reproducibilidad no
es al byte. El stack no define healthchecks ni límites de recursos. Y los
secretos de los perfiles se cargan con `required: false`: si el materializador
no ha corrido, el contenedor arranca igual, con lo que tenga. Son deudas
conocidas, escritas en el registro operativo del homelab.

## La regla

Un agente de IA no es un componente mágico: es un servicio con una imagen, una
memoria y unos secretos. Tratarlo como código es lo que lo hace auditable,
reproducible y capaz de fallar en voz alta en lugar de degradarse en silencio.
La IA no cambia las reglas de la infraestructura: las cumple.