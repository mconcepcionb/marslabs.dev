---
title: "Seguridad de un agente autónomo"
summary: "Un agente con herramientas reales es una superficie de riesgo nueva. Qué límites protejo, qué sigue sin revisar y dónde está la frontera."
date: 2026-09-16
tags: [ia, seguridad, agentes]
---

Un agente autónomo con acceso al terminal, a los archivos y a la red no es un
chatbot: es un proceso con privilegios. Lo que lo hace útil es lo que lo hace
peligroso. Por eso, antes de vender sus capacidades, hay que hablar de su
superficie de riesgo y de lo que todavía no está resuelto.

## Qué protejo

El agente tiene tres frentes: el acceso (quién le habla), la identidad (qué
cree ser cuando actúa) y los secretos (qué credenciales guarda). Los tres se
tratan como infraestructura, no como configuración de un producto.

- El dashboard tiene autenticación básica por perfil, con usuario fijo y
  contraseña propia cifrada en el repo.
- Los secretos viajan cifrados con SOPS y se descifran solo en el nodo, en
  un directorio de ejecución con permisos restringidos.
- No hay puertos expuestos al host: todo el acceso entra por el proxy, y el
  servidor de API interno no se publica.

## La frontera

Los límites están escritos y son visibles, no asumidos. El registro operativo
del homelab documenta qué sigue pendiente: revisar la autenticación y la
exposición de los dashboards del agente. Los routers del proxy usan el
entrypoint HTTP, porque el TLS lo termina Cloudflare en el túnel, fuera del
homelab. Y como los secretos se cargan con `required: false`, un despliegue
con el materializador sin ejecutar deja el dashboard sin contraseña: el
contenedor arranca igual. Ninguno de estos puntos es una brecha hoy, pero
ninguno está resuelto.

## La regla

La seguridad de un agente autónomo no se mide por lo que protege: se mide por
lo que aún no ha revisado. La lista de pendientes escrita y visible vale más
que una configuración que parece segura. Y esta es la razón por la que un
agente así se monta como un despliegue más: definido como código, con la
frontera cerrada y los pendientes a la vista.

Cuando alguien me pide un agente, el trabajo no es el modelo. Es la frontera:
quién habla, qué puede tocar, qué guarda y qué falta por revisar. Eso es
infraestructura, y es lo que hago: [sistemas e infraestructura](/servicios/sistemas-infra/).