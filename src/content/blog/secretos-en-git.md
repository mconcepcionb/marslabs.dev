---
title: Cómo aprendí a dejar de preocuparme y hacer commit de secretos a git
summary: "Tener secretos en git suena a error de novato. Con cifrado asimétrico se versionan sin que el texto plano exista, y las claves nunca se suben. Dónde queda el riesgo real."
date: 2026-09-16
tags: [seguridad, sops, git]
---

Subir un secreto a git se siente como romper algo irrecuperable. Y en parte es
cierto: si el texto plano llegó a la historia, la fuga ya está. La solución no
es dejar de versionar, sino cifrar lo que viaja y mantener las claves fuera.

## El acuerdo

Los secretos se guardan cifrados. El texto plano no entra al repositorio: el
control de versiones lo ignora por regla. Las claves que podrían descifrar todo
nunca se suben; viven solo en las máquinas que deben poder hacerlo.

## Qué pasa en el despliegue

Cada nodo tiene su propio juego de claves, y el repositorio cifra cada secreto
para el nodo al que pertenece. En el despliegue, el nodo descifra lo suyo y lo
coloca en un directorio de ejecución con permisos restringidos. El texto plano
solo existe donde debe existir.

## Editar un secreto

Se abre con la herramienta, se edita cifrado y se guarda cifrado. Nunca a
mano, nunca en claro.

## Dónde queda el riesgo real

Cifrar no elimina el problema: lo mueve. Quien tiene la clave puede descifrar,
así que la frontera real es proteger esa clave y decidir quién la tiene. Y un
repositorio cifrado no convierte un repositorio público en un buen sitio para
secretos de producción. El miedo no desaparece: se reubica en el lugar
correcto, donde se puede vigilar.