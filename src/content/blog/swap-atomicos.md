---
title: Despliegues estáticos con swap atómico — el detalle que evita versiones mezcladas
description: "Cómo publicar un site estático en caliente sin reconstruir la imagen y sin servir contenido a medias: artefacto versionado, symlink y mv -T."
pubDate: 2026-09-01
tags: [infraestructura, despliegue, ssg]
---

Tu contenido vive en un volumen, no en la imagen. Eso es la frontera correcta
para un site estático: el artefacto se publica, se versiona y se cambia por
intercambio atómico — no reconstruyendo el contenedor por cada cambio editorial.

## Las tres reglas

1. **El swap es `mv -T` sobre un symlink recién creado** (`rename(2)`, atómico).
   No `ln -sfn`: ese hace unlink + symlink con una ventana sin enlace.
2. **Binde el directorio padre, nunca `current`.** Docker resuelve el target del
   symlink en el `-v`; montar `current` congela el árbol y el swap no se ve.
3. **`open_file_cache` solo para assets inmutables** (nombre con hash). En HTML
   que se publica en caliente, un descriptor cacheado apunta al inodo viejo y
   tras el swap sirves versiones mezcladas hasta la recarga.

## Por qué importa

Un despliegue mal hecho no falla ruidosamente: sirve contenido ligeramente
incoherente durante minutos. Es el tipo de bug que solo aparece en producción y
solo se diagnostica midiendo.

La regla de Mars Labs aplica aquí también: el detalle de despliegue se valida y
se documenta, no se improvisa el día del corte.