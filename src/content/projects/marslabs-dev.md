---
title: "marslabs.dev — este sitio"
status: "personal"
tags: [web, ssg, medicion]
summary: "El site que estás viendo: estático (Astro), servido por nginx en imagen multi-stage y medido antes de afirmar nada."
year: 2026
featured: true
order: 1
---

Este site es el método Mars Labs aplicado a sí mismo: estático, con despliegue
por imagen y medido con datos reales antes de afirmar nada.

## Qué se midió

- **16 páginas** generadas en **1,18 s** de build.
- **~10,7 KB de HTML por página** servida (media).
- **CLS de 0,000** en carga real, medido con PerformanceObserver.

Los números se pueden verificar en esta misma página, con las herramientas del
navegador.

## Cómo se entrega

Imagen multi-stage (Astro → nginx): el build se empaqueta y se sirve con cacheo
por tipo de asset, activos inmutables con nombre con hash y cabeceras de
seguridad. La publicación se hace por CI: reconstruir la imagen y desplegar el
artefacto, sin servidores que mantener.