---
title: Mi homelab está escrito en código
summary: "27 servicios en dos nodos definidos como código, secretos cifrados en el repo y un despliegue en tres pasos. La historia de un homelab que no se configura a mano."
date: 2026-09-16
tags: [infraestructura, homelab, docker, sops]
---

Antes, configurar un servicio era una ceremonia: entrar por SSH, editar un
archivo, reiniciar y rezar para que el sistema arrancara igual. Hoy mi homelab
es un repositorio. Todo lo que hace está escrito; nada se configura a mano.

## Cómo funciona

Cada servicio se define una sola vez, y cada nodo aplica su variante. El mismo
servicio puede desplegarse distinto en cada máquina sin duplicar la definición.
Los servicios se comunican por redes internas, y casi todo el tráfico entra por
un único punto. Un nodo es el generalista; el otro, el de cómputo, lleva los
trabajos de GPU.

## La frontera

- Un **proxy** termina el tráfico y lo enruta al servicio correcto.
- El **DNS** divide el mundo en dos: lo que se resuelve dentro de casa y el
  dominio público del homelab.
- Un **túnel** expone el dominio público sin abrir puertos.
- El **SSO** hace que una sola cuenta sirva para las aplicaciones que lo piden.

## Observabilidad

Las métricas y los logs de todos los nodos acaban en un mismo lugar. Cuando
algo falla, hay un número que lo dice antes que el síntoma. No hay que adivinar
qué pasó: se mira.

## Secretos

Los secretos viajan cifrados dentro del repositorio, y las claves privadas
nunca se suben. En el despliegue se descifran en el propio nodo, con permisos
restringidos. No hay un fichero de contraseñas en texto plano.

## Despliegue

Tres pasos: preparar las rutas, materializar los secretos y levantar los
servicios. Y una verificación: los 27 servicios coinciden con el modelo del
repositorio. La reproducibilidad no es un comando mágico; es que el estado esté
escrito y se pueda comprobar.

## Lo que aún falta

Este homelab no está acabado, y sería un error venderlo como tal. La NAS
todavía no es declarativa, y el backup de fotos es una copia sin restauración
probada documentada. La regla es la misma de siempre: lo que no se ha probado,
no se afirma.